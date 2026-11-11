import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Upload, Plus, Trash2, Save, FileImage, CheckCircle, Clock, MapPin, BookOpen } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '09:40', '10:00', '10:30',
  '11:00', '11:10', '11:30', '12:00', '12:30', '12:40',
  '13:00', '13:30', '14:00', '14:10', '14:30',
  '15:00', '15:30', '15:40', '16:00', '16:30',
  '17:00', '17:30', '18:00'
];

const createEmptyCourse = () => ({
  id: Date.now() + Math.random(),
  code: '',
  name: '',
  section: '',
  credits: '3',
  day1: 'Sunday',
  start1: '08:00',
  end1: '09:30',
  room1: '',
  day2: '',
  start2: '',
  end2: '',
  room2: '',
  teacher: '',
});

export default function AdvisingSlip() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'manual' | 'routine'
  const [slipImage, setSlipImage] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const [courses, setCourses] = useState(() => {
    const saved = localStorage.getItem('ewu_advising_courses');
    return saved ? JSON.parse(saved) : [createEmptyCourse()];
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    localStorage.setItem('ewu_advising_courses', JSON.stringify(courses));
  }, [courses]);

  // ---- Upload Handlers ----
  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSlipImage(file);
    setSlipPreview(URL.createObjectURL(file));
    setUploadSuccess(false);
  }

  async function handleUpload() {
    if (!slipImage || !profile?.id) return;
    setUploading(true);

    const ext = slipImage.name.split('.').pop();
    const fileName = `advising-slips/${profile.id}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('campusmate-files')
      .upload(fileName, slipImage, { upsert: true });

    if (error) {
      alert('Upload failed: ' + error.message + '\n\nNote: You may need to create a "campusmate-files" storage bucket in Supabase first.');
    } else {
      setUploadSuccess(true);
    }
    setUploading(false);
  }

  // ---- Course Entry Handlers ----
  function addCourse() {
    setCourses(c => [...c, createEmptyCourse()]);
  }

  function removeCourse(id) {
    if (courses.length > 1) {
      setCourses(c => c.filter(item => item.id !== id));
    }
  }

  function updateCourse(id, field, value) {
    setCourses(c => c.map(item => item.id === id ? { ...item, [field]: value } : item));
    setSaved(false);
  }

  function saveCourses() {
    setSaving(true);
    localStorage.setItem('ewu_advising_courses', JSON.stringify(courses));
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
    }, 500);
  }

  // ---- Build Routine from Courses ----
  function buildRoutine() {
    const routine = {};
    DAYS.forEach(d => { routine[d] = []; });

    courses.forEach(c => {
      if (c.code && c.day1 && c.start1 && c.end1) {
        routine[c.day1].push({
          code: c.code,
          name: c.name,
          section: c.section,
          start: c.start1,
          end: c.end1,
          room: c.room1,
          teacher: c.teacher,
          credits: c.credits,
        });
      }
      if (c.code && c.day2 && c.start2 && c.end2) {
        routine[c.day2].push({
          code: c.code,
          name: c.name,
          section: c.section,
          start: c.start2,
          end: c.end2,
          room: c.room2 || c.room1,
          teacher: c.teacher,
          credits: c.credits,
        });
      }
    });

    // Sort each day by start time
    Object.keys(routine).forEach(day => {
      routine[day].sort((a, b) => a.start.localeCompare(b.start));
    });

    return routine;
  }

  const routine = buildRoutine();
  const totalCredits = courses.reduce((sum, c) => sum + (parseFloat(c.credits) || 0), 0);

  return (
    <div className="page">
      <div className="page-header-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="page-title">📋 Advising Slip & Routine</h1>
            <span className="badge badge-primary">{courses.filter(c => c.code).length} Courses</span>
            <span className="badge badge-info">{totalCredits} Credits</span>
          </div>
          <p className="page-subtitle">
            Upload your EWU advising slip or manually enter your courses to auto-generate your weekly routine
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="filter-tabs" style={{ marginBottom: '24px' }}>
        <button className={`filter-tab ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>
          <Upload size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
          Upload Advising Slip
        </button>
        <button className={`filter-tab ${activeTab === 'manual' ? 'active' : ''}`} onClick={() => setActiveTab('manual')}>
          <Plus size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
          Enter Courses Manually
        </button>
        <button className={`filter-tab ${activeTab === 'routine' ? 'active' : ''}`} onClick={() => setActiveTab('routine')}>
          <Clock size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
          View My Routine
        </button>
      </div>

      {/* TAB 1: UPLOAD ADVISING SLIP */}
      {activeTab === 'upload' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="card">
            <h2 className="card-title">📄 Upload Your EWU Advising Slip</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 20px' }}>
              Upload a screenshot or photo of your advising slip from the EWU Student Portal.
              Accepted formats: PNG, JPG, PDF.
            </p>

            {/* Drop Zone */}
            <label
              htmlFor="slip-upload"
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
                transition: 'all 0.2s',
                textAlign: 'center',
              }}
            >
              <FileImage size={40} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
              <p style={{ color: 'var(--text-secondary)', fontWeight: '600', margin: '0 0 4px' }}>
                Click to select your advising slip
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>
                PNG, JPG, or PDF • Max 10MB
              </p>
              <input
                id="slip-upload"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </label>

            {slipImage && (
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={16} color="var(--success)" />
                  <span style={{ fontSize: '13px', color: 'var(--text)' }}>{slipImage.name}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    ({(slipImage.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <button
                  onClick={handleUpload}
                  className="btn btn-primary"
                  disabled={uploading}
                  style={{ fontSize: '13px', padding: '8px 16px' }}
                >
                  {uploading ? 'Uploading...' : uploadSuccess ? '✓ Uploaded!' : 'Upload to Cloud'}
                </button>
              </div>
            )}

            {uploadSuccess && (
              <div className="alert alert-success" style={{ marginTop: '12px' }}>
                ✅ Advising slip uploaded and saved to your account!
              </div>
            )}

            <div style={{ marginTop: '20px', padding: '14px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '10px' }}>
              <p style={{ fontSize: '12.5px', color: '#fbbf24', fontWeight: '600', margin: '0 0 4px' }}>
                💡 Coming Soon: AI Auto-Extract
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                In the next update, our AI will automatically read your advising slip and fill in all your course details, schedule, and room numbers!
                For now, please enter your courses manually in the next tab.
              </p>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="card">
            <h2 className="card-title">👁️ Slip Preview</h2>
            {slipPreview ? (
              <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <img
                  src={slipPreview}
                  alt="Advising Slip Preview"
                  style={{ width: '100%', maxHeight: '500px', objectFit: 'contain', background: '#1a1a2e' }}
                />
              </div>
            ) : (
              <div style={{ padding: '60px 20px', textAlign: 'center', border: '1px solid var(--border-subtle)', borderRadius: '10px', background: 'rgba(255,255,255,0.02)' }}>
                <FileImage size={48} color="var(--text-muted)" style={{ marginBottom: '12px', opacity: 0.4 }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
                  Your advising slip preview will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MANUAL COURSE ENTRY */}
      {activeTab === 'manual' && (
        <div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 className="card-title" style={{ margin: 0 }}>📝 Enter Your Semester Courses</h2>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  Fill in your courses from the advising slip. Each course can have up to 2 class sessions per week.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={addCourse} className="btn btn-secondary" style={{ fontSize: '12.5px' }}>
                  <Plus size={14} /> Add Course
                </button>
                <button onClick={saveCourses} className="btn btn-primary" disabled={saving} style={{ fontSize: '12.5px' }}>
                  <Save size={14} /> {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save All'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {courses.map((c, index) => (
                <div
                  key={c.id}
                  style={{
                    background: 'var(--surface-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '16px 18px',
                    borderLeft: '4px solid var(--primary)',
                  }}
                >
                  {/* Course Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#818cf8' }}>
                      Course {index + 1}
                    </span>
                    <button
                      onClick={() => removeCourse(c.id)}
                      className="btn-icon btn-danger"
                      disabled={courses.length === 1}
                      title="Remove course"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Row 1: Code, Name, Section, Credits, Teacher */}
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 2fr 80px 80px 1.5fr', gap: '10px', marginBottom: '14px' }}>
                    <div className="form-group" style={{ gap: '3px' }}>
                      <label style={{ fontSize: '11px' }}>Course Code</label>
                      <input
                        placeholder="CSE110"
                        value={c.code}
                        onChange={e => updateCourse(c.id, 'code', e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ gap: '3px' }}>
                      <label style={{ fontSize: '11px' }}>Course Title</label>
                      <input
                        placeholder="Programming Language I"
                        value={c.name}
                        onChange={e => updateCourse(c.id, 'name', e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ gap: '3px' }}>
                      <label style={{ fontSize: '11px' }}>Section</label>
                      <input
                        placeholder="01"
                        value={c.section}
                        onChange={e => updateCourse(c.id, 'section', e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ gap: '3px' }}>
                      <label style={{ fontSize: '11px' }}>Credits</label>
                      <select value={c.credits} onChange={e => updateCourse(c.id, 'credits', e.target.value)}>
                        {['1.0', '1.5', '2.0', '3.0', '4.0', '4.5'].map(cr => (
                          <option key={cr} value={cr}>{cr}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ gap: '3px' }}>
                      <label style={{ fontSize: '11px' }}>Faculty Name</label>
                      <input
                        placeholder="Dr. Rahman"
                        value={c.teacher}
                        onChange={e => updateCourse(c.id, 'teacher', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Row 2: Schedule Slot 1 */}
                  <div style={{ marginBottom: '8px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Class Slot 1
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                      <select value={c.day1} onChange={e => updateCourse(c.id, 'day1', e.target.value)}>
                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <select value={c.start1} onChange={e => updateCourse(c.id, 'start1', e.target.value)}>
                        {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <select value={c.end1} onChange={e => updateCourse(c.id, 'end1', e.target.value)}>
                        {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input placeholder="Room (e.g. AB-301)" value={c.room1} onChange={e => updateCourse(c.id, 'room1', e.target.value)} />
                    </div>
                  </div>

                  {/* Row 3: Schedule Slot 2 (optional) */}
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Class Slot 2 (if applicable)
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                      <select value={c.day2} onChange={e => updateCourse(c.id, 'day2', e.target.value)}>
                        <option value="">— No 2nd slot —</option>
                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <select value={c.start2} onChange={e => updateCourse(c.id, 'start2', e.target.value)} disabled={!c.day2}>
                        <option value="">Start</option>
                        {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <select value={c.end2} onChange={e => updateCourse(c.id, 'end2', e.target.value)} disabled={!c.day2}>
                        <option value="">End</option>
                        {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input placeholder="Room" value={c.room2} onChange={e => updateCourse(c.id, 'room2', e.target.value)} disabled={!c.day2} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={addCourse} className="btn btn-secondary">
                <Plus size={14} /> Add Another Course
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {courses.filter(c => c.code).length} courses · {totalCredits} credits
                </span>
                <button onClick={saveCourses} className="btn btn-primary" disabled={saving}>
                  <Save size={14} /> {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Courses'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GENERATED ROUTINE VIEW */}
      {activeTab === 'routine' && (
        <div>
          {/* Summary Bar */}
          <div className="stats-grid" style={{ marginBottom: '24px' }}>
            <div className="stat-card stat-blue">
              <div className="stat-icon"><BookOpen size={20} /></div>
              <div>
                <p className="stat-value">{courses.filter(c => c.code).length}</p>
                <p className="stat-label">Enrolled Courses</p>
              </div>
            </div>
            <div className="stat-card stat-purple">
              <div className="stat-icon"><Clock size={20} /></div>
              <div>
                <p className="stat-value">{totalCredits}</p>
                <p className="stat-label">Total Credits</p>
              </div>
            </div>
            <div className="stat-card stat-green">
              <div className="stat-icon"><MapPin size={20} /></div>
              <div>
                <p className="stat-value">
                  {[...new Set(courses.flatMap(c => [c.room1, c.room2].filter(Boolean)))].length}
                </p>
                <p className="stat-label">Rooms Assigned</p>
              </div>
            </div>
          </div>

          {/* Course Summary Table */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h2 className="card-title">📋 Enrolled Courses Summary</h2>
            {courses.filter(c => c.code).length === 0 ? (
              <p className="empty-state">No courses entered yet. Go to "Enter Courses Manually" tab to add your courses.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Course Title</th>
                    <th>Sec</th>
                    <th>Credits</th>
                    <th>Faculty</th>
                    <th>Schedule</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.filter(c => c.code).map(c => (
                    <tr key={c.id}>
                      <td><strong style={{ color: '#818cf8' }}>{c.code}</strong></td>
                      <td>{c.name || '—'}</td>
                      <td>{c.section || '—'}</td>
                      <td><span className="badge badge-primary">{c.credits}</span></td>
                      <td style={{ color: 'var(--text-secondary)' }}>{c.teacher || '—'}</td>
                      <td style={{ fontSize: '12px' }}>
                        <div>{c.day1} {c.start1}–{c.end1} {c.room1 && `(${c.room1})`}</div>
                        {c.day2 && <div style={{ color: 'var(--text-muted)' }}>{c.day2} {c.start2}–{c.end2} {c.room2 && `(${c.room2})`}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Daily Routine Cards */}
          <h2 className="section-title" style={{ marginBottom: '16px' }}>📅 Weekly Class Routine</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {DAYS.map(day => (
              <div key={day} className="card" style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 12px', color: '#e2e8f0' }}>
                  {day}
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px', fontWeight: '500' }}>
                    {routine[day].length} classes
                  </span>
                </h3>

                {routine[day].length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                    No classes 🎉
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {routine[day].map((cls, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '10px 12px',
                          background: 'var(--surface-low)',
                          borderRadius: '8px',
                          borderLeft: '3px solid var(--primary)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#818cf8' }}>
                            {cls.code} {cls.section && `(${cls.section})`}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>
                            {cls.credits} cr
                          </span>
                        </div>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#f1f5f9', margin: '0 0 2px' }}>
                          {cls.name || 'Course Session'}
                        </p>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                          <span>🕐 {cls.start} – {cls.end}</span>
                          {cls.room && <span>📍 {cls.room}</span>}
                        </div>
                        {cls.teacher && (
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '3px 0 0' }}>
                            👤 {cls.teacher}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
