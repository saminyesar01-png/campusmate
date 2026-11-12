/**
 * CampusMate AI Chatbot API Handler (Vercel Serverless Function)
 * Route: /api/chat
 *
 * Uses the official @google/genai SDK with the free-tier Gemini Flash models.
 * Protects student privacy by stripping names and IDs from schedule context.
 */

const { GoogleGenAI } = require('@google/genai');

// In-memory per-IP rate limiter (20 requests per minute per IP)
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;
const ipRequestHistory = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const history = ipRequestHistory.get(ip) || [];
  const recent = history.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    ipRequestHistory.set(ip, recent);
    return true;
  }

  recent.push(now);
  ipRequestHistory.set(ip, recent);

  // Periodically clean up old IPs
  if (ipRequestHistory.size > 1000) {
    for (const [key, timestamps] of ipRequestHistory.entries()) {
      const active = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
      if (active.length === 0) {
        ipRequestHistory.delete(key);
      } else {
        ipRequestHistory.set(key, active);
      }
    }
  }

  return false;
}

/**
 * Remove student PII (Name, Student ID) from schedule data
 * Free-tier requests may be processed by Google, so keep only academic metadata.
 */
function sanitizeSchedule(raw) {
  if (!raw) return null;

  const courses = Array.isArray(raw) ? raw : (raw.courses || []);

  const sanitizedCourses = courses.map((c) => ({
    code: c.code,
    name: c.name || c.code,
    section: c.section || c.sec,
    credits: c.credits || c.cr,
    tuition: c.tuition,
    sessions: (c.sessions || []).map((s) => ({
      type: s.type || s.kind,
      days: s.days,
      daysExpanded: s.daysExpanded,
      time: s.time || (s.start && s.end ? `${s.start} - ${s.end}` : undefined),
      room: s.room || 'TBA',
    })),
  }));

  return {
    semester: raw.student?.semester || undefined,
    courses: sanitizedCourses,
    fees: raw.fees
      ? {
          tuition: raw.fees.tuition,
          lab: raw.fees.lab,
          activity: raw.fees.activity,
        }
      : undefined,
    deadlines: Array.isArray(raw.deadlines)
      ? raw.deadlines.map((d) => ({
          date: d.date,
          amount: d.amount,
        }))
      : undefined,
  };
}

module.exports = async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. Per-IP Rate Limiting
  const forwardedFor = req.headers['x-forwarded-for'];
  const clientIp = typeof forwardedFor === 'string'
    ? forwardedFor.split(',')[0].trim()
    : req.socket?.remoteAddress || 'client';

  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      error: 'You have sent too many questions in a short period. Please wait a minute and try again.',
    });
  }

  // 2. Validate API key (clean any accidental quotes or whitespace)
  const rawKey = process.env.GEMINI_API_KEY || '';
  const apiKey = rawKey.replace(/["'\r\n\s]/g, '').trim();

  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY is not configured on the server. Please add it to your Vercel settings and redeploy.',
    });
  }

  // 3. Parse input body
  const { messages, schedule, clientDate } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'A messages array is required.' });
  }

  // Use only the last 10 messages for context
  const recentMessages = messages.slice(-10);

  // 4. Sanitize Schedule Data (strip Name & Student ID)
  const safeSchedule = sanitizeSchedule(schedule);

  // 5. Determine today's date context
  const currentDate = clientDate ? new Date(clientDate) : new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayName = dayNames[currentDate.getDay()];
  const formattedDate = currentDate.toDateString();

  // 6. Build System Instructions (Schedule Assistant + Math & Academic Solver)
  const systemInstruction = `You are CampusMate AI, an intelligent, supportive university assistant for East West University (EWU) students.
Today is ${todayDayName}, ${formattedDate}.

Here is the student's enrolled courses and schedule data (sanitized of personal identification):
${JSON.stringify(safeSchedule, null, 2)}

GUIDELINES:
1. Schedule, Routine, Rooms & Deadlines:
   - Answer accurately using the schedule data above.
   - EWU standard day abbreviations: S = Sunday, M = Monday, T = Tuesday, W = Wednesday, R = Thursday, A = Saturday, F = Friday. "SR" means Sunday and Thursday.
   - If a specific schedule detail (like instructor name, exam seat plan, or course outline) is not found in the provided schedule, kindly inform the student that this information is not in their advising slip.
2. Academic & Math Questions:
   - You can solve math problems, physics/engineering problems, algorithms, coding questions, and explain university academic concepts with clear, step-by-step working.
3. Tone & Formatting:
   - Be helpful, clear, and encouraging.
   - Use clean Markdown (bullet points, bold text, code blocks) to make answers easy to read on mobile and desktop.
   - Keep answers focused and concise.`;

  // 7. Format messages for Gemini API
  // Gemini requires conversations to start with a 'user' turn and alternate turns
  const firstUserIdx = recentMessages.findIndex((m) => m.role === 'user');
  const validMessages = firstUserIdx !== -1 ? recentMessages.slice(firstUserIdx) : recentMessages;

  const contents = [];
  for (const m of validMessages) {
    const role = m.role === 'assistant' || m.role === 'model' ? 'model' : 'user';
    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += `\n${m.content || ''}`;
    } else {
      contents.push({
        role,
        parts: [{ text: String(m.content || '') }],
      });
    }
  }

  // Safety fallback if no user message was found
  if (contents.length === 0 || contents[0].role !== 'user') {
    return res.status(400).json({ error: 'Please ask a question to begin.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Primary free tier models on Google AI Studio
    const candidateModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash'];
    let response = null;
    let lastError = null;

    for (const model of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            maxOutputTokens: 500,
            temperature: 0.4,
          },
        });
        if (response?.text) {
          break; // Successfully got response
        }
      } catch (err) {
        lastError = err;
        console.warn(`Model ${model} error:`, err?.message || err);
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('No response generated from Gemini API.');
    }

    return res.status(200).json({ reply: response.text });
  } catch (err) {
    console.error('Gemini API error in /api/chat:', err);

    if (err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED')) {
      return res.status(429).json({
        error: 'The free AI service is currently receiving high traffic. Please try asking again in a few seconds!',
      });
    }

    const rawMessage = err?.message || '';
    let userFriendlyError = 'Sorry, I encountered an error while processing your request. Please try again.';

    if (rawMessage.includes('API_KEY_INVALID') || rawMessage.includes('API key not valid')) {
      userFriendlyError = 'Your GEMINI_API_KEY is invalid. Please copy a valid key from Google AI Studio and update Vercel.';
    } else if (rawMessage) {
      userFriendlyError = `AI Error: ${rawMessage.slice(0, 160)}`;
    }

    return res.status(500).json({ error: userFriendlyError });
  }
};
