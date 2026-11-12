/**
 * CampusMate AI Chatbot API Handler (Vercel Serverless Function)
 * Route: /api/chat
 *
 * Uses the official @google/genai SDK with the free-tier Gemini Flash model.
 * Protects student privacy by stripping names and IDs from schedule context.
 */

const { GoogleGenAI } = require('@google/genai');

// In-memory per-IP rate limiter (15 requests per minute per IP)
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 15;
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

  // Periodically clean up old IPs to prevent memory leak
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

  // 2. Validate API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY is not configured on the server. Please add it to your environment variables or Vercel settings.',
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

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Format messages for @google/genai contents
    const contents = recentMessages.map((m) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: String(m.content || '') }],
    }));

    // Choose the free-tier Flash model: gemini-2.5-flash with fallback to gemini-2.0-flash
    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction,
          maxOutputTokens: 500,
          temperature: 0.4,
        },
      });
    } catch (modelErr) {
      // Fallback to gemini-2.0-flash if 2.5 is unavailable
      if (modelErr?.status === 404 || modelErr?.message?.includes('not found')) {
        response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents,
          config: {
            systemInstruction,
            maxOutputTokens: 500,
            temperature: 0.4,
          },
        });
      } else {
        throw modelErr;
      }
    }

    const reply = response?.text || 'I could not generate an answer. Please try again.';

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Gemini API error in /api/chat:', err);

    if (err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED')) {
      return res.status(429).json({
        error: 'The free AI service is currently receiving high traffic. Please try asking again in a few seconds!',
      });
    }

    return res.status(500).json({
      error: 'Sorry, I encountered an error while processing your request. Please try again.',
    });
  }
};
