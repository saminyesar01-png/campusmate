import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Upload, Plus, Trash2, Save, FileImage, CheckCircle, Clock, MapPin, BookOpen, Wand2, Calendar } from 'lucide-react';

// Official East West University Day Mappings
// S = Sunday, M = Monday, T = Tuesday, W = Wednesday, R = Thursday
export const EWU_DAY_MAP = {
  'S': 'Sunday',
  'M': 'Monday',
  'T': 'Tuesday',
  'W': 'Wednesday',
  'R': 'Thursday',
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

// Samin's real advising slip data (Fall-2026)
const SAMIN_SLIP_COURSES = [
  {
    id: 'c1',
    code: 'CSE246',
    name: 'Algorithms',
    section: '7',
    credits: '4.5',
    sessions: [
      { type: 'Theory', days: 'SR', daysExpanded: ['Sunday', 'Thursday'], time: '4:50PM - 6:20PM', room: 'FUB-303' },
      { type: 'Lab', days: 'M', daysExpanded: ['Monday'], time: '4:50PM - 7:50PM', room: '435 (General Purpose Programming Lab)' },
    ],
    tuition: '27,000.00'
  },
  {
    id: 'c2',
    code: 'CSE251',
    name: 'Electronic Devices & Circuits',
    section: '5',
    credits: '4.0',
    sessions: [
      { type: 'Theory', days: 'SR', daysExpanded: ['Sunday', 'Thursday'], time: '8:30AM - 10:00AM', room: 'AB1-601' },
      { type: 'Lab', days: 'T', daysExpanded: ['Tuesday'], time: '8:00AM - 10:00AM', room: '548 (Electrical Circuit Lab)' },
    ],
    tuition: '24,000.00'
  },
  {
    id: 'c3',
    code: 'POP7203',
    name: 'Population & Development',
    section: '1',
    credits: '3.0',
    sessions: [
      { type: 'Class', days: 'SR', daysExpanded: ['Sunday', 'Thursday'], time: '11:50AM - 1:20PM', room: '550 (Lecture Gallery)' },
    ],
    tuition: '18,000.00'
  }
];

export default function AdvisingSlip() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('routine'); // default to routine view so they see it right away!
  const [slipImage, setSlipImage] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [courses, setCourses] = useState(() => {
    const saved = localStorage.getItem('ewu_advising_courses_v2');
    return saved ? JSON.parse(saved) : SAMIN_SLIP_COURSES;
  });
  const [savedNotice, setSavedNotice] = useState(false);
  const [activeRoutineDay, setActiveRoutineDay] = useState(() => {
    const today = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
    return DAYS.includes(today) ? today : 'Sunday';
  });

  // Manual course adder state
  const [newCourse, setNewCourse] = useState({
    code: '',
    name: '',
    section: '',
    credits: '3.0',
    theoryDays: 'SR',
    theoryTime: '8:30AM - 10:00AM',
    theoryRoom: '',
    hasLab: false,
    labDay: 'M',
    labTime: '4:50PM - 7:50PM',
    labRoom: '',
  });

  useEffect(() => {
    localStorage.setItem('ewu_advising_courses_v2', JSON.stringify(courses));
  }, [courses]);

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSlipImage(file);
    setSlipPreview(URL.createObjectURL(file));
  }

  function loadSampleSlip() {
    setCourses(SAMIN_SLIP_COURSES);
    localStorage.setItem('ewu_advising_courses_v2', JSON.stringify(SAMIN_SLIP_COURSES));
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
    setActiveTab('routine');
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

    const sessions = [
      {
        type: 'Theory',
        days: newCourse.theoryDays,
        daysExpanded,
        time: newCourse.theoryTime,
        room: newCourse.theoryRoom || 'TBA',
      }
    ];

    if (newCourse.hasLab) {
      const labDayExpanded = EWU_DAY_MAP[newCourse.labDay] ? [EWU_DAY_MAP[newCourse.labDay]] : ['Monday'];
      sessions.push({
        type: 'Lab',
        days: newCourse.labDay,
        daysExpanded: labDayExpanded,
        time: newCourse.labTime,
        room: newCourse.labRoom || 'Lab',
      });
    }

    const created = {
      id: Date.now().toString(),
      code: newCourse.code.toUpperCase(),
      name: newCourse.name || newCourse.code.toUpperCase(),
      section: newCourse.section || '1',
      credits: newCourse.credits,
      sessions,
    };

    setCourses(prev => [...prev, created]);
    setNewCourse({
      code: '',
      name: '',
      section: '',
      credits: '3.0',
      theoryDays: 'SR',
      theoryTime: '8:30AM - 10:00AM',
      theoryRoom: '',
      hasLab: false,
      labDay: 'M',
      labTime: '4:50PM - 7:50PM',
      labRoom: '',
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  }

  function deleteCourse(id) {
    setCourses(prev => prev.filter(c => c.id !== id));
  }

  // Build weekly routine timetable
  function getWeeklyRoutine() {
    const routine = { Sunday: [], Monday: [], Tuesday: [], Wednesday: [], Thursday: [] };

    courses.forEach(c => {
      c.sessions?.forEach(s => {
        s.daysExpanded?.forEach(day => {
          if (routine[day]) {
            routine[day].push({
              code: c.code,
              name: c.name,
              section: c.section,
              credits: c.credits,
              type: s.type,
              time: s.time,
              room: s.room,
            });
          }
        });
      });
    });

    // Sort classes chronologically by start time
    Object.keys(routine).forEach(day => {
      routine[day].sort((a, b) => {
        const getMinutes = (str) => {
          const match = str.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (!match) return 0;
          let h = parseInt(match[1]);
          const m = parseInt(match[2]);
          const ampm = match[3].toUpperCase();
          if (ampm === 'PM' && h !== 12) h += 12;
          if (ampm === 'AM' && h === 12) h = 0;
          return h * 60 + m;
        };
        return getMinutes(a.time) - getMinutes(b.time);
      });
    });

    return routine;
  }

  const weeklyRoutine = getWeeklyRoutine();
  const totalCredits = courses.reduce((sum, c) => sum + (parseFloat(c.credits) || 0), 0);

  return (
    <div className="page">
      {/* Header with advising slip badge info */}
      <div className="dashboard-header" style={{ marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', marginBottom: '10px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a5b4fc' }}>
              East West University • Fall-2026 Advising
            </span>
          </div>
          <h1 className="page-title" style={{ fontSize: '26px', margin: '0 0 6px' }}>
            📋 Advising Slip & Class Routine
          </h1>
          <p className="page-subtitle" style={{ fontSize: '13.5px' }}>
            Registered for <strong style={{ color: '#818cf8' }}>{courses.length} Courses</strong> ({totalCredits.toFixed(1)} Credits)
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <button
            onClick={loadSampleSlip}
            className="btn btn-secondary"
            style={{ fontSize: '12px', padding: '6px 14px', borderColor: 'rgba(99, 102, 241, 0.4)' }}
          >
            <Wand2 size={14} color="#818cf8" />
            <span>Load Slip Data</span>
          </button>
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            Student ID: <strong>2024-3-60-187</strong>
          </span>
        </div>
      </div>

      {savedNotice && (
        <div className="alert alert-success" style={{ marginBottom: '16px' }}>
          ✅ Routine updated and saved!
        </div>
      )}

      {/* Tabs */}
      <div className="filter-tabs" style={{ marginBottom: '22px' }}>
        <button
          className={`filter-tab ${activeTab === 'routine' ? 'active' : ''}`}
          onClick={() => setActiveTab('routine')}
        >
          <Clock size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
          Weekly Class Routine ({weeklyRoutine[activeRoutineDay]?.length || 0} today)
        </button>
        <button
          className={`filter-tab ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          <BookOpen size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
          Advising Slip Courses ({courses.length})
        </button>
        <button
          className={`filter-tab ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <Upload size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
          Upload & View Slip Image
        </button>
        <button
          className={`filter-tab ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          <Plus size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
          Add More Courses
        </button>
      </div>

      {/* TAB 1: WEEKLY ROUTINE */}
      {activeTab === 'routine' && (
        <div>
          {/* Day Selector Pills */}
          <div className="day-tabs" style={{ marginBottom: '20px' }}>
            {DAYS.map(day => (
              <button
                key={day}
                onClick={() => setActiveRoutineDay(day)}
                className={`day-tab ${activeRoutineDay === day ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <span>{day}</span>
                <span className="badge" style={{ background: activeRoutineDay === day ? 'rgba(255,255,255,0.25)' : 'rgba(99, 102, 241, 0.15)', fontSize: '10px' }}>
                  {weeklyRoutine[day]?.length || 0}
                </span>
              </button>
            ))}
          </div>

          {/* Routine Schedule View for Active Day */}
          <div className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title" style={{ margin: 0, fontSize: '18px' }}>
                  📅 {activeRoutineDay} Schedule
                </h2>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {weeklyRoutine[activeRoutineDay]?.length || 0} scheduled classes & labs
                </span>
              </div>
              <span className="badge badge-primary">
                EWU Standard Slot (SR / MW)
              </span>
            </div>

            {weeklyRoutine[activeRoutineDay]?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '15px', margin: '0 0 6px' }}>No classes on {activeRoutineDay}! 🎉</p>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Enjoy your break or work on project milestones.</span>
              </div>
            ) : (
              <div className="schedule-list">
                {weeklyRoutine[activeRoutineDay]?.map((item, idx) => (
                  <div
                    key={idx}
                    className="schedule-item"
                    style={{
                      borderLeftColor: item.type === 'Lab' ? '#10b981' : '#6366f1',
                      background: item.type === 'Lab' ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.08), var(--surface-card) 40%)' : 'var(--surface-card)'
                    }}
                  >
                    {/* Time Column */}
                    <div className="schedule-time" style={{ minWidth: '130px', textAlign: 'left', alignItems: 'flex-start' }}>
                      <span style={{ color: item.type === 'Lab' ? '#34d399' : '#818cf8', fontSize: '13px' }}>
                        {item.time}
                      </span>
                      <span className={`badge ${item.type === 'Lab' ? 'badge-success' : 'badge-primary'}`} style={{ marginTop: '4px', fontSize: '10px' }}>
                        {item.type}
                      </span>
                    </div>

                    {/* Course Details */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ fontWeight: '800', fontSize: '16px', color: '#ffffff' }}>
                          {item.code}
                        </span>
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', fontSize: '11px' }}>
                          Sec {item.section}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          • {item.credits} Credits
                        </span>
                      </div>
                      <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: '0 0 4px' }}>
                        {item.name}
                      </p>
                    </div>

                    {/* Room Location */}
                    <div style={{ textAlign: 'right', minWidth: '180px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <MapPin size={15} color={item.type === 'Lab' ? '#34d399' : '#818cf8'} />
                        <span style={{ fontWeight: '700', fontSize: '13.5px', color: '#f1f5f9' }}>
                          {item.room}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Full Week Overview Grid */}
          <h2 className="section-title" style={{ marginTop: '30px', marginBottom: '16px' }}>
            🗓️ Complete Week Matrix
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            {DAYS.map(day => (
              <div key={day} className="card" style={{ padding: '16px', background: activeRoutineDay === day ? 'linear-gradient(180deg, rgba(99, 102, 241, 0.1), var(--surface) 60%)' : 'var(--surface)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
                    {day}
                  </h3>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', fontSize: '10px' }}>
                    {weeklyRoutine[day]?.length} classes
                  </span>
                </div>

                {weeklyRoutine[day]?.length === 0 ? (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>Off Day</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {weeklyRoutine[day]?.map((cls, i) => (
                      <div key={i} style={{ padding: '8px 10px', background: 'var(--surface-low)', borderRadius: '6px', borderLeft: `3px solid ${cls.type === 'Lab' ? '#10b981' : '#6366f1'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: '700', fontSize: '12.5px', color: '#ffffff' }}>{cls.code}</span>
                          <span style={{ fontSize: '10px', color: cls.type === 'Lab' ? '#34d399' : '#818cf8', fontWeight: '600' }}>{cls.type}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {cls.time}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                          📍 {cls.room}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ADVISING SLIP COURSES TABLE */}
      {activeTab === 'summary' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title" style={{ margin: 0 }}>📋 Registered Courses Breakdown</h2>
              <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                Directly from East West University Advising Slip • Fall-2026
              </span>
            </div>
            <span className="badge badge-primary">{totalCredits} Total Credits</span>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Sec</th>
                <th>Credits</th>
                <th>Schedule (EWU WeekDay Code)</th>
                <th>Room Allocation</th>
                <th>Tuition Fee</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(c => (
                <tr key={c.id}>
                  <td>
                    <div>
                      <strong style={{ color: '#818cf8', fontSize: '14px' }}>{c.code}</strong>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{c.name}</div>
                    </div>
                  </td>
                  <td>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.06)' }}>{c.section}</span>
                  </td>
                  <td>
                    <span className="badge badge-primary">{c.credits} cr</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {c.sessions?.map((s, i) => (
                        <div key={i} style={{ fontSize: '12px' }}>
                          <span style={{ fontWeight: '700', color: s.type === 'Lab' ? '#34d399' : '#a5b4fc', marginRight: '6px' }}>
                            [{s.days}] {s.type}:
                          </span>
                          <span>{s.time}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {c.sessions?.map((s, i) => (
                        <div key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          📍 {s.room}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '12.5px', color: '#f1f5f9' }}>{c.tuition ? `${c.tuition} BDT` : '—'}</span>
                  </td>
                  <td>
                    <button onClick={() => deleteCourse(c.id)} className="btn-icon btn-danger" title="Remove course">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* EWU Code Reference */}
          <div style={{ marginTop: '24px', padding: '16px', background: 'var(--surface-low)', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 8px' }}>
              💡 EWU Day Code Reference:
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <span><strong>S</strong> = Sunday</span>
              <span><strong>M</strong> = Monday</span>
              <span><strong>T</strong> = Tuesday</span>
              <span><strong>W</strong> = Wednesday</span>
              <span><strong>R</strong> = Thursday</span>
              <span><strong>SR</strong> = Sunday & Thursday (Standard Theory Slot)</span>
              <span><strong>MW</strong> = Monday & Wednesday</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: UPLOAD SLIP */}
      {activeTab === 'upload' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="card">
            <h2 className="card-title">📄 Upload Advising Slip</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 20px' }}>
              Upload your official EWU advising slip PDF or image.
            </p>

            <label
              htmlFor="slip-file"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 24px',
                border: '2px dashed var(--border)',
                borderRadius: '12px',
                cursor: 'pointer',
                background: 'rgba(99, 102, 241, 0.04)',
                textAlign: 'center',
              }}
            >
              <FileImage size={40} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
              <p style={{ color: 'var(--text-secondary)', fontWeight: '600', margin: '0 0 4px' }}>
                Select Advising Slip File
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>
                PDF, JPG, or PNG from Student Portal
              </p>
              <input id="slip-file" type="file" accept="image/*,.pdf" onChange={handleFileSelect} style={{ display: 'none' }} />
            </label>

            {slipImage && (
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} color="var(--success)" />
                <span style={{ fontSize: '13px', color: 'var(--text)' }}>{slipImage.name}</span>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="card-title">👁️ Preview</h2>
            {slipPreview ? (
              <img src={slipPreview} alt="Preview" style={{ width: '100%', maxHeight: '450px', objectFit: 'contain', borderRadius: '8px' }} />
            ) : (
              <div style={{ padding: '60px 20px', textAlign: 'center', border: '1px solid var(--border-subtle)', borderRadius: '10px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', margin: 0 }}>
                  Upload a slip to see the visual preview
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ADD CUSTOM COURSES */}
      {activeTab === 'add' && (
        <div className="card">
          <h2 className="card-title">➕ Add an Extra Course to Your Schedule</h2>
          <form onSubmit={handleAddCourse} className="auth-form" style={{ marginTop: '16px' }}>
            <div className="form-row">
              <div className="form-group">
                <label>Course Code</label>
                <input
                  placeholder="e.g. CSE246"
                  value={newCourse.code}
                  onChange={e => setNewCourse({ ...newCourse, code: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Course Title</label>
                <input
                  placeholder="e.g. Algorithms"
                  value={newCourse.name}
                  onChange={e => setNewCourse({ ...newCourse, name: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Section</label>
                <input
                  placeholder="e.g. 7"
                  value={newCourse.section}
                  onChange={e => setNewCourse({ ...newCourse, section: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Credit Hours</label>
                <select
                  value={newCourse.credits}
                  onChange={e => setNewCourse({ ...newCourse, credits: e.target.value })}
                >
                  {['1.0', '1.5', '2.0', '3.0', '4.0', '4.5'].map(cr => (
                    <option key={cr} value={cr}>{cr} Credits</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Theory Slot */}
            <div style={{ padding: '14px', background: 'var(--surface-low)', borderRadius: '9px', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '12px', fontWeight: '700', color: '#818cf8', margin: '0 0 10px', textTransform: 'uppercase' }}>
                Theory Class Schedule
              </p>
              <div className="form-row">
                <div className="form-group">
                  <label>Day Code</label>
                  <select
                    value={newCourse.theoryDays}
                    onChange={e => setNewCourse({ ...newCourse, theoryDays: e.target.value })}
                  >
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
                  <input
                    placeholder="e.g. 4:50PM - 6:20PM"
                    value={newCourse.theoryTime}
                    onChange={e => setNewCourse({ ...newCourse, theoryTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '10px' }}>
                <label>Room Allocation</label>
                <input
                  placeholder="e.g. FUB-303 or AB1-601"
                  value={newCourse.theoryRoom}
                  onChange={e => setNewCourse({ ...newCourse, theoryRoom: e.target.value })}
                />
              </div>
            </div>

            {/* Lab Slot Toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: '6px 0' }}>
              <input
                type="checkbox"
                checked={newCourse.hasLab}
                onChange={e => setNewCourse({ ...newCourse, hasLab: e.target.checked })}
                style={{ width: 'auto' }}
              />
              <span style={{ fontWeight: '600', fontSize: '13.5px' }}>This course has a Lab session</span>
            </label>

            {newCourse.hasLab && (
              <div style={{ padding: '14px', background: 'var(--surface-low)', borderRadius: '9px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <p style={{ fontSize: '12px', fontWeight: '700', color: '#34d399', margin: '0 0 10px', textTransform: 'uppercase' }}>
                  Lab Session Details
                </p>
                <div className="form-row">
                  <div className="form-group">
                    <label>Lab Day</label>
                    <select
                      value={newCourse.labDay}
                      onChange={e => setNewCourse({ ...newCourse, labDay: e.target.value })}
                    >
                      <option value="M">Monday (M)</option>
                      <option value="T">Tuesday (T)</option>
                      <option value="W">Wednesday (W)</option>
                      <option value="S">Sunday (S)</option>
                      <option value="R">Thursday (R)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Lab Time Slot</label>
                    <input
                      placeholder="e.g. 4:50PM - 7:50PM"
                      value={newCourse.labTime}
                      onChange={e => setNewCourse({ ...newCourse, labTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: '10px' }}>
                  <label>Lab Room</label>
                  <input
                    placeholder="e.g. 435 (General Purpose Lab)"
                    value={newCourse.labRoom}
                    onChange={e => setNewCourse({ ...newCourse, labRoom: e.target.value })}
                  />
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '10px' }}>
              Add Course to Routine
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
