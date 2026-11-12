import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Upload as UploadIcon,
  Plus,
  Trash2,
  FileText,
  Clock,
  MapPin,
  BookOpen,
  CreditCard,
  CalendarDays,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { parseSlip, flat, fmt, mins, taka, DAYS, todayCode } from '../../lib/parseSlip';

// EWU Day Mappings (also used by ClassRoutine / GoogleClassroom)
export const EWU_DAY_MAP = {
  S: 'Sunday', M: 'Monday', T: 'Tuesday', W: 'Wednesday', R: 'Thursday',
};

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

/* ================================================================
   SUB-COMPONENT: Upload  — drag-and-drop PDF upload zone
   ================================================================ */
function SlipUpload({ onFile, loading, error }) {
  const [over, setOver] = useState(false);
  const ref = useRef();
  const pick = (f) => f && onFile(f);

  return (
    <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
      <div
        style={{
          border: `2px dashed ${over ? 'var(--primary)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)',
          padding: '48px 24px',
          cursor: 'pointer',
          background: over ? 'var(--primary-light)' : 'transparent',
          transition: 'all 0.2s ease',
        }}
        onClick={() => ref.current.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files[0]); }}
      >
        {loading ? (
          <RefreshCw size={40} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
        ) : (
          <UploadIcon size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
        )}
        <p style={{ fontWeight: 700, fontSize: '16px', margin: '0 0 4px', color: 'var(--text)' }}>
          {loading ? 'Reading your slip…' : 'Upload your advising slip PDF'}
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
          Drag and drop, or tap to choose the PDF. It stays in your browser.
        </p>
        <input ref={ref} type="file" accept=".pdf,application/pdf" hidden onChange={(e) => pick(e.target.files[0])} />
      </div>
      {error && (
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', color: '#f87171', fontSize: '13.5px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   SUB-COMPONENT: Stats  — 4-cell grid with enrolled, credits, etc.
   ================================================================ */
function Stats({ data }) {
  const all = flat(data.courses);
  const today = all.filter((s) => s.days.includes(todayCode()));
  const credits = data.courses.reduce((s, c) => s + c.cr, 0);
  const rooms = new Set(all.map((s) => s.room).filter(Boolean)).size;
  const items = [
    { n: data.courses.length, l: 'Enrolled courses', cls: 'stat-blue', icon: <BookOpen size={20} /> },
    { n: credits, l: 'Total credits', cls: 'stat-purple', icon: <FileText size={20} /> },
    { n: today.length, l: 'Classes today', cls: 'stat-green', icon: <Clock size={20} /> },
    { n: rooms, l: 'Classrooms', cls: 'stat-orange', icon: <MapPin size={20} /> },
  ];
  return (
    <div className="stats-grid">
      {items.map(({ n, l, cls, icon }) => (
        <div className={`stat-card ${cls}`} key={l}>
          <div className="stat-icon">{icon}</div>
          <div>
            <p className="stat-value">{n}</p>
            <p className="stat-label">{l}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================================================================
   SUB-COMPONENT: Today  — today's class list
   ================================================================ */
function Today({ data }) {
  const list = useMemo(() =>
    flat(data.courses)
      .filter((s) => s.days.includes(todayCode()))
      .sort((a, b) => mins(a.start) - mins(b.start)),
  [data]);

  const now = new Date().getHours() * 60 + new Date().getMinutes();

  if (!list.length) {
    return (
      <div className="card">
        <h2 className="card-title">📅 Today's Classes</h2>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
          No classes today 🎉
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="card-title">📅 Today's Classes</h2>
      <ul className="class-list">
        {list.map((s, i) => {
          const live = now >= mins(s.start) && now <= mins(s.end);
          return (
            <li key={i} className="class-item" style={live ? { borderColor: 'var(--success)', background: 'var(--success-bg)' } : {}}>
              <div className="class-time">
                {fmt(s.start)}<br />{fmt(s.end)}
              </div>
              <div style={{ flex: 1 }}>
                <p className="class-name">
                  {s.code}{s.kind === 'Lab' ? ' Lab' : ''}
                  {live && (
                    <span className="badge badge-success" style={{ marginLeft: 8, fontSize: '10px' }}>● Now</span>
                  )}
                </p>
                <p className="class-meta">
                  Section {s.sec} • {s.room || 'Room TBA'}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ================================================================
   SUB-COMPONENT: Week  — 7-day mini calendar grid
   ================================================================ */
function Week({ data }) {
  const all = flat(data.courses);
  const tc = todayCode();
  return (
    <div className="card">
      <h2 className="card-title">🗓️ Weekly Schedule</h2>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, minWidth: 560 }}>
          {DAYS.map(([k, name]) => (
            <div
              key={k}
              style={{
                border: `1px solid ${k === tc ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 10,
                padding: 8,
                minHeight: 90,
                fontSize: '12px',
                background: k === tc ? 'var(--primary-light)' : 'transparent',
              }}
            >
              <h4 style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 700, color: k === tc ? '#a5b4fc' : 'var(--text-secondary)' }}>{name}</h4>
              {all
                .filter((s) => s.days.includes(k))
                .sort((a, b) => mins(a.start) - mins(b.start))
                .map((s, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'var(--surface-card)',
                      borderRadius: 6,
                      padding: '4px 6px',
                      marginBottom: 4,
                    }}
                  >
                    <b style={{ color: '#ffffff', fontSize: '11px' }}>
                      {s.code}{s.kind === 'Lab' ? ' Lab' : ''}
                    </b>
                    <br />
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{fmt(s.start)}</span>
                    <br />
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{(s.room || '').split(' ')[0]}</span>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   SUB-COMPONENT: Payment  — upcoming fees and deadlines
   ================================================================ */
function Payment({ data }) {
  const { fees, deadlines } = data;
  const t0 = new Date();
  t0.setHours(0, 0, 0, 0);
  const sortedDeadlines = [...deadlines].sort((a, b) => a.date.localeCompare(b.date));
  const up = sortedDeadlines.find((d) => new Date(d.date + 'T00:00:00') >= t0);
  const days = up ? Math.round((new Date(up.date + 'T00:00:00') - t0) / 864e5) : null;

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title" style={{ margin: 0 }}>
          <CreditCard size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
          Fees & Payment Deadlines
        </h2>
      </div>

      {up ? (
        <div style={{ marginBottom: 14 }}>
          <span style={{ fontSize: '28px', fontWeight: 800, color: '#818cf8', fontFamily: "'Manrope', sans-serif" }}>
            {taka(up.amount)}
          </span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px', marginLeft: 10 }}>
            due by {new Date(up.date + 'T00:00:00').toDateString().slice(4)}
            {' '}({days === 0 ? 'today!' : `${days} days left`})
          </span>
        </div>
      ) : (
        <p style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>All deadlines have passed.</p>
      )}

      <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
        {fees.tuition != null && <>Tuition: <strong>{taka(fees.tuition)}</strong> · </>}
        {fees.lab != null && <>Lab: <strong>{taka(fees.lab)}</strong> · </>}
        {fees.activity != null && <>Activity: <strong>{taka(fees.activity)}</strong></>}
      </div>

      {sortedDeadlines.length > 0 && (
        <div style={{ marginTop: 10, fontSize: '12px', color: 'var(--text-muted)' }}>
          Late-fee schedule: {sortedDeadlines.map((d) =>
            `${d.date.slice(5).split('-').reverse().join('/')} ${taka(d.amount)}`
          ).join(' → ')}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   SUB-COMPONENT: CourseTable  — all enrolled courses in a table
   ================================================================ */
function CourseTable({ data }) {
  const rows = data.courses.flatMap((c) =>
    c.sessions.map((s, i) => ({ c, s, first: i === 0 }))
  );
  return (
    <div className="card">
      <h2 className="card-title">📋 All Enrolled Courses</h2>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Sec</th>
              <th>Cr</th>
              <th>Type</th>
              <th>Days</th>
              <th>Time</th>
              <th>Room</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ c, s, first }, i) => (
              <tr key={i}>
                <td><strong style={{ color: '#818cf8' }}>{c.code}</strong></td>
                <td>{first ? c.sec : ''}</td>
                <td>{first ? c.cr.toFixed(2) : ''}</td>
                <td>
                  <span className={`badge ${s.kind === 'Lab' ? 'badge-success' : 'badge-primary'}`} style={{ fontSize: '10px' }}>
                    {s.kind}
                  </span>
                </td>
                <td>{s.days.join('')}</td>
                <td>{fmt(s.start)} – {fmt(s.end)}</td>
                <td>{s.room}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================================================================
   MAIN PAGE  — ties everything together
   ================================================================ */
export default function AdvisingSlip() {
  const { profile } = useAuth();
  const storageKey = profile?.id ? `ewu_slip_data_${profile.id}` : null;

  // ── persisted parsed slip data ──
  const [slipData, setSlipData] = useState(() => {
    if (!storageKey) return null;
    const saved = localStorage.getItem(storageKey);
    if (saved) { try { return JSON.parse(saved); } catch (e) { /* ignore */ } }
    return null;
  });

  // ── upload state ──
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── manual-add state (preserved from old page) ──
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | add
  const manualStorageKey = profile?.id ? `ewu_advising_courses_${profile.id}` : null;
  const [manualCourses, setManualCourses] = useState(() => {
    if (!manualStorageKey) return [];
    const saved = localStorage.getItem(manualStorageKey);
    if (saved) { try { return JSON.parse(saved); } catch (e) { /* ignore */ } }
    return [];
  });

  const [newCourse, setNewCourse] = useState({
    code: '', name: '', section: '', credits: '3.0',
    theoryDays: 'SR', theoryTime: '8:30AM - 10:00AM', theoryRoom: '',
    hasLab: false, labDay: 'M', labTime: '4:50PM - 7:50PM', labRoom: '',
  });
  const [savedNotice, setSavedNotice] = useState(false);

  // ── persist data ──
  useEffect(() => {
    if (storageKey && slipData) {
      localStorage.setItem(storageKey, JSON.stringify(slipData));
    }
  }, [slipData, storageKey]);

  useEffect(() => {
    if (manualStorageKey) {
      localStorage.setItem(manualStorageKey, JSON.stringify(manualCourses));
    }
  }, [manualCourses, manualStorageKey]);

  // Also sync parsed slip courses into the old manual format
  // so that StudentDashboard / ClassRoutine / GoogleClassroom keep working
  useEffect(() => {
    if (!slipData || !manualStorageKey) return;
    const converted = slipData.courses.map((c, idx) => ({
      id: `slip-${idx}-${c.code}`,
      code: c.code,
      name: c.code,
      section: String(c.sec || ''),
      credits: c.cr.toFixed(1),
      tuition: c.tuition,
      sessions: c.sessions.map((s) => ({
        type: s.kind,
        days: s.days.join(''),
        daysExpanded: s.days.map((d) => EWU_DAY_MAP[d]).filter(Boolean),
        time: `${fmt(s.start)} - ${fmt(s.end)}`,
        room: s.room || 'TBA',
      })),
    }));
    setManualCourses(converted);
  }, [slipData, manualStorageKey]);

  // ── handlers ──
  async function handleFile(file) {
    setError('');
    if (file.size > 10 * 1024 * 1024) { setError('File is larger than 10 MB.'); return; }
    setLoading(true);
    try {
      const data = await parseSlip(file);
      setSlipData(data);
      setActiveTab('dashboard');
    } catch (e) {
      setError(e.message || "Couldn't read that slip.");
    }
    setLoading(false);
  }

  function handleReset() {
    if (window.confirm('Clear all parsed slip data and start over?')) {
      setSlipData(null);
      if (storageKey) localStorage.removeItem(storageKey);
    }
  }

  function handleAddCourse(e) {
    e.preventDefault();
    if (!newCourse.code) return;
    const daysExpanded = [];
    if (newCourse.theoryDays.includes('S')) daysExpanded.push('Sunday');
    if (newCourse.theoryDays.includes('M')) daysExpanded.push('Monday');
    if (newCourse.theoryDays.includes('T')) daysExpanded.push('Tuesday');
    if (newCourse.theoryDays.includes('W')) daysExpanded.push('Wednesday');
    if (newCourse.theoryDays.includes('R')) daysExpanded.push('Thursday');
    const sessions = [{ type: 'Theory', days: newCourse.theoryDays, daysExpanded, time: newCourse.theoryTime, room: newCourse.theoryRoom || 'TBA' }];
    if (newCourse.hasLab) {
      const labDayExpanded = EWU_DAY_MAP[newCourse.labDay] ? [EWU_DAY_MAP[newCourse.labDay]] : ['Monday'];
      sessions.push({ type: 'Lab', days: newCourse.labDay, daysExpanded: labDayExpanded, time: newCourse.labTime, room: newCourse.labRoom || 'Lab' });
    }
    setManualCourses(prev => [...prev, { id: Date.now().toString(), code: newCourse.code.toUpperCase(), name: newCourse.name || newCourse.code.toUpperCase(), section: newCourse.section || '1', credits: newCourse.credits, sessions }]);
    setNewCourse({ code: '', name: '', section: '', credits: '3.0', theoryDays: 'SR', theoryTime: '8:30AM - 10:00AM', theoryRoom: '', hasLab: false, labDay: 'M', labTime: '4:50PM - 7:50PM', labRoom: '' });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  }

  function deleteCourse(id) {
    setManualCourses(prev => prev.filter(c => c.id !== id));
  }

  const totalCredits = slipData
    ? slipData.courses.reduce((s, c) => s + c.cr, 0)
    : manualCourses.reduce((sum, c) => sum + (parseFloat(c.credits) || 0), 0);

  const courseCount = slipData ? slipData.courses.length : manualCourses.length;

  /* ──────────── RENDER ──────────── */

  return (
    <div className="page">
      {/* Header */}
      <div className="dashboard-header" style={{ marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', marginBottom: '10px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a5b4fc' }}>
              East West University • {slipData?.student?.semester || 'Advising Slip'}
            </span>
          </div>
          <h1 className="page-title" style={{ fontSize: '26px', margin: '0 0 6px' }}>
            📋 Advising Slip Dashboard
          </h1>
          <p className="page-subtitle" style={{ fontSize: '13.5px' }}>
            {slipData ? (
              <>
                {slipData.student.name} · <strong style={{ color: '#818cf8' }}>{slipData.student.id}</strong> ·{' '}
                <strong style={{ color: '#818cf8' }}>{courseCount} Courses</strong> ({totalCredits.toFixed(1)} Credits)
              </>
            ) : (
              <>Upload your advising slip PDF to auto-fill, or add courses manually</>
            )}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          {slipData && (
            <button onClick={handleReset} className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
              <UploadIcon size={13} />
              <span>Upload New Slip</span>
            </button>
          )}
          {profile?.student_id && (
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Student ID: <strong>{profile.student_id}</strong>
            </span>
          )}
        </div>
      </div>

      {savedNotice && (
        <div className="alert alert-success" style={{ marginBottom: '16px' }}>
          ✅ Course added and saved!
        </div>
      )}

      {/* ── No data yet: show upload zone ── */}
      {!slipData && manualCourses.length === 0 && (
        <>
          <SlipUpload onFile={handleFile} loading={loading} error={error} />

          <div style={{ textAlign: 'center', margin: '20px 0 14px', color: 'var(--text-muted)', fontSize: '13px' }}>
            — or —
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => setActiveTab('add')}
            style={{ display: 'flex', margin: '0 auto', gap: 8 }}
          >
            <Plus size={16} /> Add Courses Manually
          </button>
        </>
      )}

      {/* ── We have parsed slip data: full dashboard ── */}
      {slipData && (
        <>
          {/* Tab bar */}
          <div className="filter-tabs" style={{ marginBottom: '22px' }}>
            <button className={`filter-tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
              <CalendarDays size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Dashboard
            </button>
            <button className={`filter-tab ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => setActiveTab('courses')}>
              <BookOpen size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Courses ({courseCount})
            </button>
            <button className={`filter-tab ${activeTab === 'payment' ? 'active' : ''}`} onClick={() => setActiveTab('payment')}>
              <CreditCard size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Fees & Payment
            </button>
            <button className={`filter-tab ${activeTab === 'add' ? 'active' : ''}`} onClick={() => setActiveTab('add')}>
              <Plus size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Add More
            </button>
          </div>

          {activeTab === 'dashboard' && (
            <>
              <Stats data={slipData} />
              <div className="dashboard-grid">
                <Today data={slipData} />
                <Week data={slipData} />
              </div>
            </>
          )}

          {activeTab === 'courses' && <CourseTable data={slipData} />}
          {activeTab === 'payment' && <Payment data={slipData} />}
        </>
      )}

      {/* ── Manual courses table (when no PDF uploaded) ── */}
      {!slipData && manualCourses.length > 0 && (
        <>
          <div className="filter-tabs" style={{ marginBottom: '22px' }}>
            <button className={`filter-tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
              <Clock size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Routine
            </button>
            <button className={`filter-tab ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => setActiveTab('courses')}>
              <BookOpen size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Courses ({manualCourses.length})
            </button>
            <button className={`filter-tab ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>
              <UploadIcon size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Upload PDF
            </button>
            <button className={`filter-tab ${activeTab === 'add' ? 'active' : ''}`} onClick={() => setActiveTab('add')}>
              <Plus size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Add More
            </button>
          </div>

          {activeTab === 'upload' && <SlipUpload onFile={handleFile} loading={loading} error={error} />}

          {activeTab === 'dashboard' && <ManualRoutine courses={manualCourses} />}

          {activeTab === 'courses' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title" style={{ margin: 0 }}>📋 Registered Courses</h2>
                <span className="badge badge-primary">{totalCredits} Credits</span>
              </div>
              <table className="data-table">
                <thead>
                  <tr><th>Course</th><th>Sec</th><th>Cr</th><th>Schedule</th><th>Room</th><th></th></tr>
                </thead>
                <tbody>
                  {manualCourses.map(c => (
                    <tr key={c.id}>
                      <td><strong style={{ color: '#818cf8' }}>{c.code}</strong></td>
                      <td>{c.section}</td>
                      <td>{c.credits}</td>
                      <td>
                        {c.sessions?.map((s, i) => (
                          <div key={i} style={{ fontSize: '12px' }}>
                            <span style={{ fontWeight: 700, color: s.type === 'Lab' ? '#34d399' : '#a5b4fc', marginRight: 6 }}>
                              [{s.days}] {s.type}:
                            </span>
                            {s.time}
                          </div>
                        ))}
                      </td>
                      <td>{c.sessions?.map((s, i) => <div key={i} style={{ fontSize: '12px' }}>📍 {s.room}</div>)}</td>
                      <td>
                        <button onClick={() => deleteCourse(c.id)} className="btn-icon btn-danger" title="Remove"><Trash2 size={15} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Add Course form (always accessible) ── */}
      {activeTab === 'add' && (
        <div className="card">
          <h2 className="card-title">➕ Add a Course Manually</h2>
          <form onSubmit={handleAddCourse} className="auth-form" style={{ marginTop: '16px' }}>
            <div className="form-row">
              <div className="form-group">
                <label>Course Code</label>
                <input placeholder="e.g. CSE246" value={newCourse.code} onChange={e => setNewCourse({ ...newCourse, code: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Course Title</label>
                <input placeholder="e.g. Algorithms" value={newCourse.name} onChange={e => setNewCourse({ ...newCourse, name: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Section</label>
                <input placeholder="e.g. 7" value={newCourse.section} onChange={e => setNewCourse({ ...newCourse, section: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Credit Hours</label>
                <select value={newCourse.credits} onChange={e => setNewCourse({ ...newCourse, credits: e.target.value })}>
                  {['1.0', '1.5', '2.0', '3.0', '4.0', '4.5'].map(cr => <option key={cr} value={cr}>{cr} Credits</option>)}
                </select>
              </div>
            </div>

            {/* Theory Slot */}
            <div style={{ padding: '14px', background: 'var(--surface-low)', borderRadius: '9px', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8', margin: '0 0 10px', textTransform: 'uppercase' }}>Theory Class Schedule</p>
              <div className="form-row">
                <div className="form-group">
                  <label>Day Code</label>
                  <select value={newCourse.theoryDays} onChange={e => setNewCourse({ ...newCourse, theoryDays: e.target.value })}>
                    <option value="SR">SR (Sunday & Thursday)</option>
                    <option value="MW">MW (Monday & Wednesday)</option>
                    <option value="ST">ST (Sunday & Tuesday)</option>
                    <option value="TR">TR (Tuesday & Thursday)</option>
                    <option value="S">S (Sunday only)</option>
                    <option value="M">M (Monday only)</option>
                    <option value="T">T (Tuesday only)</option>
                    <option value="W">W (Wednesday only)</option>
                    <option value="R">R (Thursday only)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Time Slot</label>
                  <input placeholder="e.g. 4:50PM - 6:20PM" value={newCourse.theoryTime} onChange={e => setNewCourse({ ...newCourse, theoryTime: e.target.value })} />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 10 }}>
                <label>Room</label>
                <input placeholder="e.g. FUB-303" value={newCourse.theoryRoom} onChange={e => setNewCourse({ ...newCourse, theoryRoom: e.target.value })} />
              </div>
            </div>

            {/* Lab toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: '6px 0' }}>
              <input type="checkbox" checked={newCourse.hasLab} onChange={e => setNewCourse({ ...newCourse, hasLab: e.target.checked })} style={{ width: 'auto' }} />
              <span style={{ fontWeight: 600, fontSize: '13.5px' }}>This course has a Lab session</span>
            </label>

            {newCourse.hasLab && (
              <div style={{ padding: 14, background: 'var(--surface-low)', borderRadius: 9, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', margin: '0 0 10px', textTransform: 'uppercase' }}>Lab Session</p>
                <div className="form-row">
                  <div className="form-group">
                    <label>Lab Day</label>
                    <select value={newCourse.labDay} onChange={e => setNewCourse({ ...newCourse, labDay: e.target.value })}>
                      <option value="M">Monday (M)</option>
                      <option value="T">Tuesday (T)</option>
                      <option value="W">Wednesday (W)</option>
                      <option value="S">Sunday (S)</option>
                      <option value="R">Thursday (R)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Lab Time</label>
                    <input placeholder="e.g. 4:50PM - 7:50PM" value={newCourse.labTime} onChange={e => setNewCourse({ ...newCourse, labTime: e.target.value })} />
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: 10 }}>
                  <label>Lab Room</label>
                  <input placeholder="e.g. 435 (General Purpose Lab)" value={newCourse.labRoom} onChange={e => setNewCourse({ ...newCourse, labRoom: e.target.value })} />
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: 10 }}>
              Add Course to Routine
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   ManualRoutine — weekly routine view for manually-added courses
   (same layout as old page so existing users aren't disrupted)
   ================================================================ */
function ManualRoutine({ courses }) {
  const [activeDay, setActiveDay] = useState(() => {
    const today = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
    return WEEKDAYS.includes(today) ? today : 'Sunday';
  });

  function getWeeklyRoutine() {
    const routine = { Sunday: [], Monday: [], Tuesday: [], Wednesday: [], Thursday: [] };
    courses.forEach(c => {
      c.sessions?.forEach(s => {
        s.daysExpanded?.forEach(day => {
          if (routine[day]) {
            routine[day].push({ code: c.code, name: c.name, section: c.section, credits: c.credits, type: s.type, time: s.time, room: s.room });
          }
        });
      });
    });
    Object.keys(routine).forEach(day => {
      routine[day].sort((a, b) => {
        const getMinutes = (str) => { const match = str.match(/(\d+):(\d+)\s*(AM|PM)/i); if (!match) return 0; let h = parseInt(match[1]); const m = parseInt(match[2]); const ampm = match[3].toUpperCase(); if (ampm === 'PM' && h !== 12) h += 12; if (ampm === 'AM' && h === 12) h = 0; return h * 60 + m; };
        return getMinutes(a.time) - getMinutes(b.time);
      });
    });
    return routine;
  }

  const weeklyRoutine = getWeeklyRoutine();

  return (
    <>
      <div className="day-tabs" style={{ marginBottom: 20 }}>
        {WEEKDAYS.map(day => (
          <button key={day} onClick={() => setActiveDay(day)} className={`day-tab ${activeDay === day ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{day}</span>
            <span className="badge" style={{ background: activeDay === day ? 'rgba(255,255,255,0.25)' : 'rgba(99, 102, 241, 0.15)', fontSize: '10px' }}>
              {weeklyRoutine[day]?.length || 0}
            </span>
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title" style={{ margin: 0, fontSize: '18px' }}>📅 {activeDay} Schedule</h2>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {weeklyRoutine[activeDay]?.length || 0} scheduled classes & labs
            </span>
          </div>
        </div>

        {weeklyRoutine[activeDay]?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', margin: '0 0 6px' }}>No classes on {activeDay}! 🎉</p>
          </div>
        ) : (
          <div className="schedule-list">
            {weeklyRoutine[activeDay]?.map((item, idx) => (
              <div key={idx} className="schedule-item" style={{ borderLeftColor: item.type === 'Lab' ? '#10b981' : '#6366f1', background: item.type === 'Lab' ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.08), var(--surface-card) 40%)' : 'var(--surface-card)' }}>
                <div className="schedule-time" style={{ minWidth: 130, textAlign: 'left', alignItems: 'flex-start' }}>
                  <span style={{ color: item.type === 'Lab' ? '#34d399' : '#818cf8', fontSize: '13px' }}>{item.time}</span>
                  <span className={`badge ${item.type === 'Lab' ? 'badge-success' : 'badge-primary'}`} style={{ marginTop: 4, fontSize: '10px' }}>{item.type}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontWeight: 800, fontSize: '16px', color: '#ffffff' }}>{item.code}</span>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', fontSize: '11px' }}>Sec {item.section}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>• {item.credits} Credits</span>
                  </div>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: '0 0 4px' }}>{item.name}</p>
                </div>
                <div style={{ textAlign: 'right', minWidth: 180 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                    <MapPin size={15} color={item.type === 'Lab' ? '#34d399' : '#818cf8'} />
                    <span style={{ fontWeight: 700, fontSize: '13.5px', color: '#f1f5f9' }}>{item.room}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
