import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Calendar, Bell, BookOpen, TrendingUp, Clock, MapPin, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

// Samin's East West University Fall-2026 Advising Slip Courses
const DEFAULT_SLIP_COURSES = [
  {
    code: 'CSE246',
    name: 'Algorithms',
    section: '7',
    credits: '4.5',
    sessions: [
      { type: 'Theory', daysExpanded: ['Sunday', 'Thursday'], time: '4:50PM - 6:20PM', room: 'FUB-303' },
      { type: 'Lab', daysExpanded: ['Monday'], time: '4:50PM - 7:50PM', room: '435 (Programming Lab)' },
    ]
  },
  {
    code: 'CSE251',
    name: 'Electronic Devices & Circuits',
    section: '5',
    credits: '4.0',
    sessions: [
      { type: 'Theory', daysExpanded: ['Sunday', 'Thursday'], time: '8:30AM - 10:00AM', room: 'AB1-601' },
      { type: 'Lab', daysExpanded: ['Tuesday'], time: '8:00AM - 10:00AM', room: '548 (Circuit Lab)' },
    ]
  },
  {
    code: 'POP7203',
    name: 'Population & Development',
    section: '1',
    credits: '3.0',
    sessions: [
      { type: 'Class', daysExpanded: ['Sunday', 'Thursday'], time: '11:50AM - 1:20PM', room: '550 (Lecture Gallery)' },
    ]
  }
];

export default function StudentDashboard() {
  const { profile } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [todayClasses, setTodayClasses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];

  useEffect(() => {
    async function fetchData() {
      // 1. Read Advising Slip Courses
      const saved = localStorage.getItem('ewu_advising_courses_v2');
      const courses = saved ? JSON.parse(saved) : DEFAULT_SLIP_COURSES;
      setEnrolledCourses(courses);

      // 2. Extract classes scheduled for TODAY (e.g. Thursday has 3 classes!)
      const classesForToday = [];
      courses.forEach(c => {
        c.sessions?.forEach(s => {
          if (s.daysExpanded?.includes(today)) {
            classesForToday.push({
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

      // Sort today's classes by time
      classesForToday.sort((a, b) => {
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

      setTodayClasses(classesForToday);

      // 3. Fetch announcements
      const { data: ann } = await supabase
        .from('announcements')
        .select('*, profiles(full_name)')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(4);

      // 4. Fetch upcoming post-mid assignments & lab reports (from Classroom sync)
      const DEFAULT_POST_MID_TASKS = [
        { id: 't1', title: 'Lab Report 4: CE Amplifier Frequency Response', courseCode: 'CSE251', dueDate: '2026-11-17T17:00:00', type: 'Lab Report' },
        { id: 't2', title: 'Lab Task 5: Dijkstra & Bellman-Ford', courseCode: 'CSE246', dueDate: '2026-11-16T23:59:00', type: 'Lab Task' },
        { id: 't3', title: 'Quiz 3: Greedy Methods & Huffman Coding', courseCode: 'CSE246', dueDate: '2026-11-19T16:50:00', type: 'Quiz' },
        { id: 't4', title: 'Term Paper Proposal: Urbanization Trends', courseCode: 'POP7203', dueDate: '2026-11-24T23:59:00', type: 'Term Paper' },
      ];

      const savedClassroom = localStorage.getItem('ewu_classroom_stream_v3');
      let classroomTasks = DEFAULT_POST_MID_TASKS;
      if (savedClassroom) {
        try {
          const parsed = JSON.parse(savedClassroom)
            .filter(t => t.category !== 'lecture' && (t.status !== 'completed' && t.status !== 'submitted') && t.dueDate);
          if (parsed.length > 0) classroomTasks = parsed;
        } catch (e) {}
      }

      setAnnouncements(ann || []);
      setUpcomingAssignments(classroomTasks);
      setLoading(false);
    }

    fetchData();
  }, [today]);

  const totalCredits = enrolledCourses.reduce((sum, c) => sum + (parseFloat(c.credits) || 0), 0);

  if (loading) {
    return (
      <div className="loading" style={{ color: 'var(--text-secondary)' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        Loading your academic hub...
      </div>
    );
  }

  return (
    <div className="page">
      {/* Hero Welcome Banner (Stitch Inspired) */}
      <div className="dashboard-header">
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', marginBottom: '12px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a5b4fc' }}>
              Academic Cycle Active • Fall 2026
            </span>
          </div>

          <h1 className="page-title" style={{ fontSize: '28px', margin: '0 0 6px' }}>
            Good {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'Samin'}! 👋
          </h1>
          <p className="page-subtitle" style={{ fontSize: '14px', maxWidth: '650px' }}>
            You have <strong style={{ color: '#818cf8' }}>{todayClasses.length} classes scheduled today ({today})</strong> and{' '}
            <strong style={{ color: '#34d399' }}>{enrolledCourses.length} registered courses</strong> ({totalCredits.toFixed(1)} Credits) from your advising slip.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <span className="badge badge-primary" style={{ padding: '6px 14px', fontSize: '12.5px' }}>
            ID: {profile?.student_id || '2024-3-60-187'}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </span>
        </div>
      </div>

      {/* Metrics Stat Cards Linked to Advising Slip */}
      <div className="stats-grid">
        <StatCard
          icon={<Calendar size={20} />}
          label={`Classes Today (${today.slice(0, 3)})`}
          value={todayClasses.length}
          color="blue"
          sublabel={todayClasses.length > 0 ? "Next: " + todayClasses[0].code : "No classes today"}
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Enrolled Courses"
          value={enrolledCourses.length}
          color="green"
          sublabel={`${totalCredits.toFixed(1)} Total Credits`}
        />
        <StatCard
          icon={<Bell size={20} />}
          label="Announcements"
          value={announcements.length}
          color="purple"
          sublabel="Campus & Course"
        />
        <StatCard
          icon={<BookOpen size={20} />}
          label="Due Assignments"
          value={upcomingAssignments.length}
          color="red"
          sublabel="This semester"
        />
      </div>

      {/* Quick Shortcuts */}
      <div className="section">
        <h2 className="section-title">Quick Academic Actions</h2>
        <div className="quick-actions">
          <QuickAction to="/student/advising" icon="📋" label="Advising Slip & Routine" desc="View Fall-2026 slip & week matrix" />
          <QuickAction to="/student/cgpa" icon="🧮" label="EWU CGPA Calculator" desc="Official 4.00 scale & retake policy" />
          <QuickAction to="/student/materials" icon="📚" label="Study Materials" desc="Lecture slides & notes" />
          <QuickAction to="/student/announcements" icon="📢" label="Announcements" desc="Campus notices & updates" />
          <QuickAction to="/student/lost-found" icon="🔍" label="Lost & Found" desc="Report or find items" />
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Today's Schedule Card (Linked to Advising Slip) */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title" style={{ margin: 0 }}>
                📅 Today's Schedule ({today})
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {todayClasses.length} classes from your advising slip
              </span>
            </div>
            <Link to="/student/advising" className="card-link" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>View slip routine</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {todayClasses.length === 0 ? (
            <div style={{ padding: '36px 10px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '0 0 6px' }}>No classes on {today}! 🎉</p>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Take this time to review lecture materials or work on projects.</span>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {todayClasses.map((cls, idx) => (
                <li
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    padding: '12px 14px',
                    background: cls.type === 'Lab'
                      ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.08), var(--surface-card) 60%)'
                      : 'var(--surface-card)',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    borderLeft: `4px solid ${cls.type === 'Lab' ? '#10b981' : '#6366f1'}`,
                  }}
                >
                  {/* Top Row: Course Code + Sec + Type Badge + Time Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '800', fontSize: '15px', color: '#ffffff' }}>
                        {cls.code}
                      </span>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Sec {cls.section}
                      </span>
                      <span className={`badge ${cls.type === 'Lab' ? 'badge-success' : 'badge-primary'}`} style={{ fontSize: '10px' }}>
                        {cls.type}
                      </span>
                    </div>

                    <span style={{
                      fontSize: '11.5px',
                      fontWeight: '700',
                      color: cls.type === 'Lab' ? '#34d399' : '#818cf8',
                      background: cls.type === 'Lab' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(99, 102, 241, 0.12)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: `1px solid ${cls.type === 'Lab' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(99, 102, 241, 0.25)'}`
                    }}>
                      🕐 {cls.time}
                    </span>
                  </div>

                  {/* Bottom Row: Course Title & Room Allocation */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      {cls.name} • {cls.credits} Credits
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} color={cls.type === 'Lab' ? '#34d399' : '#818cf8'} />
                      <span style={{ fontWeight: '700', fontSize: '12.5px', color: '#f1f5f9' }}>
                        {cls.room}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Announcements */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ margin: 0 }}>📢 Campus Notices</h2>
            <Link to="/student/announcements" className="card-link">View all →</Link>
          </div>

          {announcements.length === 0 ? (
            <p className="empty-state">No notices posted yet.</p>
          ) : (
            <ul className="announcement-list">
              {announcements.map(ann => (
                <li key={ann.id} className="announcement-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    {ann.is_pinned && <span className="badge badge-warning" style={{ fontSize: '10px' }}>Pinned</span>}
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {format(new Date(ann.created_at), 'MMM d')}
                    </span>
                  </div>
                  <p className="announcement-title">{ann.title}</p>
                  <p className="announcement-meta">
                    By {ann.profiles?.full_name || 'Administration'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Deadlines & Tasks */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ margin: 0 }}>📝 Upcoming Deadlines</h2>
            <Link to="/student/classroom" className="card-link" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>View Classroom →</span>
            </Link>
          </div>

          {upcomingAssignments.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center' }}>
              <CheckCircle size={32} color="var(--success)" style={{ margin: '0 auto 8px' }} />
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>All caught up! No urgent assignments due.</p>
            </div>
          ) : (
            <ul className="assignment-list">
              {upcomingAssignments.slice(0, 4).map(a => (
                <li key={a.id} className="assignment-item">
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                    <p className="assignment-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {a.title}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="badge badge-primary" style={{ fontSize: '10px' }}>
                        {a.courseCode || a.courses?.code || 'Course'}
                      </span>
                      {a.type && (
                        <span className="badge badge-warning" style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                          {a.type}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="deadline" style={{ flexShrink: 0 }}>
                    Due {format(new Date(a.dueDate || a.due_date || new Date()), 'MMM d')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, sublabel }) {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-icon">{icon}</div>
      <div style={{ flex: 1 }}>
        <p className="stat-value">{value}</p>
        <p className="stat-label">{label}</p>
        {sublabel && (
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '3px 0 0' }}>{sublabel}</p>
        )}
      </div>
    </div>
  );
}

function QuickAction({ to, icon, label, desc }) {
  return (
    <Link to={to} className="quick-action-btn" style={{ flexDirection: 'column', alignItems: 'flex-start', minWidth: '190px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="quick-action-icon">{icon}</span>
        <span style={{ color: '#ffffff', fontWeight: '700' }}>{label}</span>
      </div>
      {desc && <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{desc}</span>}
    </Link>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
