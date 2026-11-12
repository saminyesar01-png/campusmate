/**
 * parseSlip.js — EWU Advising Slip PDF Parser
 *
 * Extracts courses, sessions, fees, deadlines and student info
 * from an official East West University advising-slip PDF.
 *
 * The column-position logic was tested against real slips —
 * DO NOT change the coordinate thresholds or regex patterns.
 */
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

// Use the matching worker from the installed package
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.min.js',
  import.meta.url
).toString();

/* ──────────────────────────────────────────── helpers ──── */

const DAYS = [
  ['S', 'Sun'],
  ['M', 'Mon'],
  ['T', 'Tue'],
  ['W', 'Wed'],
  ['R', 'Thu'],
  ['F', 'Fri'],
  ['A', 'Sat'],
];

const todayCode = () => DAYS[new Date().getDay()][0];

/* ──────────────────────────────────────────── core ──── */

/**
 * Parse the text-content items that pdf.js extracted from page 1.
 * Each item must have { str, x, y, w }.
 *
 * Returns { student, courses, fees, deadlines }
 */
export function parseSlipItems(all) {
  const bank = all.find(i => /^Bank Copy$/i.test(i.str.trim()));
  const items = all.filter(i => i.str.trim() && (!bank || i.y > bank.y));
  const near = (a, b, d) => Math.abs(a.y - b.y) <= d;
  const t24 = (s) => { const m = s.match(/(\d{1,2}):(\d{2})\s*([AP])M/i); let h = +m[1] % 12; if (m[3].toUpperCase() === 'P') h += 12; return String(h).padStart(2, '0') + ':' + m[2]; };
  const TIME = /^([SMTWRFA]{1,4})\s+(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)$/i;
  const LABEL = /^([A-Z]{2,4}\s?\d{3,4}[A-Z]?)(\s+Lab)?$/i;
  const cx = (i) => i.x + (i.w || 0) / 2;
  const timeH = (items.find(i => /^Time-WeekDay$/i.test(i.str.trim())));
  const hdr = (re) => items.find(i => re.test(i.str.trim()));
  const roomH = hdr(/^Room$/i), remH = hdr(/^Remarks$/i);
  const slots = items.filter(i => TIME.test(i.str.trim())).map(i => { const m = i.str.trim().match(TIME); return { y: i.y, days: m[1].toUpperCase().split(''), start: t24(m[2]), end: t24(m[3]), roomParts: [] }; });
  if (!slots.length || !roomH) throw new Error('No schedule table found');
  const rx0 = timeH ? (cx(timeH) + cx(roomH)) / 2 : roomH.x - 15, rx1 = remH ? (cx(roomH) + cx(remH)) / 2 : Infinity;
  items.filter(i => cx(i) >= rx0 && cx(i) < rx1 && i.y < roomH.y - 3).forEach(i => {
    if (TIME.test(i.str.trim())) return;
    let best = null; slots.forEach(s => { if (!best || Math.abs(s.y - i.y) < Math.abs(best.y - i.y)) best = s; });
    if (best && Math.abs(best.y - i.y) < 14) best.roomParts.push(i);
  });
  const labels = items.filter(i => LABEL.test(i.str.trim()));
  const courses = [];
  const byCode = {};
  labels.forEach(l => {
    const m = l.str.trim().match(LABEL); const code = m[1].replace(/\s/g, '').toUpperCase();
    if (m[2]) return;
    const row = items.filter(i => near(i, l, 3) && i !== l);
    const sec = row.find(i => /^\d{1,2}$/.test(i.str.trim())), cr = row.find(i => /^\d+\.\d{2}$/.test(i.str.trim()) && +i.str < 20), tu = row.find(i => /^\d{3,}\.\d{2}$/.test(i.str.trim()));
    const c = { code, sec: sec ? +sec.str : null, cr: cr ? +cr.str : 0, tuition: tu ? +tu.str : 0, sessions: [] };
    courses.push(c); byCode[code] = c;
  });
  slots.forEach(s => {
    let best = null; labels.forEach(l => { const d = Math.abs(l.y - s.y); if (d < 20 && (!best || d < Math.abs(best.y - s.y))) best = l; });
    if (!best) return;
    const m = best.str.trim().match(LABEL); const c = byCode[m[1].replace(/\s/g, '').toUpperCase()]; if (!c) return;
    const room = s.roomParts.sort((a, b) => b.y - a.y).map(i => i.str.trim()).join(' ').replace(/\s+/g, ' ');
    c.sessions.push({ kind: m[2] ? 'Lab' : 'Lecture', days: s.days, start: s.start, end: s.end, room });
  });
  const idItem = items.find(i => /\d{4}-\d-\d{2}-\d{3}/.test(i.str));
  const semItem = items.find(i => /(Spring|Summer|Fall)-\d{4}/i.test(i.str));
  const nameItem = idItem && items.find(i => near(i, idItem, 3) && i.x < idItem.x && !/^(Name:?|ID#?)$/i.test(i.str.trim()) && i.str.trim());
  const fee = (re) => { const l = hdr(re); const a = l && items.find(i => near(i, l, 3) && /^\d+\.\d{2}$/.test(i.str.trim())); return a ? +a.str : null; };
  const deadlines = [];
  items.filter(i => /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(i.str.trim())).forEach(d => {
    const a = items.find(i => near(i, d, 3) && /^\d+\.\d{2}$/.test(i.str.trim()));
    const [dd, mm, yy] = d.str.trim().split('/');
    if (a) deadlines.push({ date: `${yy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`, amount: +a.str });
  });
  return {
    student: { name: nameItem ? nameItem.str.replace(/^Name:\s*/i, '').trim() : 'Student', id: idItem ? idItem.str.match(/\d{4}-\d-\d{2}-\d{3}/)[0] : '', semester: semItem ? semItem.str.match(/(Spring|Summer|Fall)-\d{4}/i)[0] : '' },
    courses, fees: { tuition: fee(/^Tuition Fee$/i), lab: fee(/^Laboratory Fee$/i), activity: fee(/^Student Activity Fee$/i) }, deadlines
  };
}

/**
 * High-level: accept a File, return parsed slip data.
 */
export async function parseSlip(file) {
  if (!/pdf$/i.test(file.type) && !/\.pdf$/i.test(file.name)) {
    throw new Error(
      'Please upload the PDF version of your slip. Photos need OCR, which isn\'t built yet.'
    );
  }

  const doc = await pdfjsLib.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
  }).promise;

  const tc = await (await doc.getPage(1)).getTextContent();
  const items = tc.items.map((i) => ({
    str: i.str,
    x: i.transform[4],
    y: i.transform[5],
    w: i.width,
  }));

  const data = parseSlipItems(items);

  if (!data.courses.length || !data.courses.some((c) => c.sessions.length)) {
    throw new Error('Couldn\'t find the course table in this PDF.');
  }

  return data;
}

/* ──────────── formatters (used by UI components) ──── */

export const mins = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export const fmt = (t) => {
  let [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${ap}`;
};

export const flat = (courses) =>
  courses.flatMap((c) =>
    c.sessions.map((s) => ({ ...s, code: c.code, sec: c.sec }))
  );

export const taka = (n) => '৳' + Number(n).toLocaleString('en-US');

export { DAYS, todayCode };
