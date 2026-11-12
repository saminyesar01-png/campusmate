import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Calendar, Bell, BookOpen, TrendingUp, MapPin, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import ChatBox from '../../components/ChatBox';

export default function StudentDashboard() {
  const { profile } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [todayClasses, setTodayClasses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [slipData, setSlipData] = useState(null);
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];

  useEffect(() => {
    async function fetchData() {
      // 1. Read Advising Slip Courses (User-specific only)
      const userKey = profile?.id ? `ewu_advising_courses_${profile.id}` : null;
      const saved = userKey ? localStorage.getItem(userKey) : null;
      const courses = saved ? JSON.parse(saved) : [];
      setEnrolledCourses(courses);

      const slipKey = profile?.id ? `ewu_slip_data_${profile.id}` : null;
      const savedSlip = slipKey ? localStorage.getItem(slipKey) : null;
      if (savedSlip) {
        try { setSlipData(JSON.parse(savedSlip)); } catch (e) {}
      }

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

      // 4. Fetch upcoming post-mid assignments & lab reports (User-specific only)
      const classroomKey = profile?.id ? `ewu_classroom_stream_${profile.id}` : null;
      const savedClassroom = classroomKey ? localStorage.getItem(classroomKey) : null;
      let classroomTasks = [];
      if (savedClassroom) {
        try {
          const parsed = JSON.parse(savedClassroom)
            .filter(t => t.category !== 'lecture' && (t.status !== 'completed' && t.status !== 'submitted') && t.dueDate);
          classroomTasks = parsed;
        } catch (e) {}
      }

      setAnnouncements(ann || []);
      setUpcomingAssignments(classroomTasks);
      setLoading(false);
    }

    fetchData();
  }, [today, profile?.id]);

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
        <div className="dashboard-header-main">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', marginBottom: '12px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a5b4fc' }}>
              Academic Cycle Active • Fall 2026
            </span>
          </div>

          <h1 className="page-title">
            Good {getGreeting()}{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! 👋
          </h1>
          <p className="page-subtitle">
            {enrolledCourses.length > 0 ? (
              <>
                You have <strong style={{ color: '#818cf8' }}>{todayClasses.length} classes scheduled today ({today})</strong> and{' '}
                <strong style={{ color: '#34d399' }}>{enrolledCourses.length} registered courses</strong> ({totalCredits.toFixed(1)} Credits) from your advising slip.
              </>
            ) : (
              <>
                Welcome to CampusMate! Please <Link to="/student/advising" style={{ color: '#818cf8', textDecoration: 'underline' }}>add your Advising Slip</Link> to view your daily routine, classes, and coursework.
              </>
            )}
          </p>
        </div>

        <div className="dashboard-header-meta">
          {profile?.student_id && (
            <span className="badge badge-primary" style={{ padding: '6px 14px', fontSize: '12.5px', whiteSpace: 'nowrap' }}>
              ID: {profile.student_id}
            </span>
          )}
          <span className="dashboard-header-date" style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
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
          sublabel={todayClasses.length > 0 ? "Next: " + todayClasses[0].code : (enrolledCourses.length > 0 ? "No classes today" : "Add advising slip")}
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Enrolled Courses"
          value={enrolledCourses.length}
          color="green"
          sublabel={enrolledCourses.length > 0 ? `${totalCredits.toFixed(1)} Total Credits` : "None added yet"}
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

      {/* CampusMate AI Academic Assistant Chatbot */}
      <ChatBox
        scheduleData={slipData || (enrolledCourses.length > 0 ? { courses: enrolledCourses } : null)}
        hasSchedule={(slipData?.courses?.length > 0) || (enrolledCourses.length > 0)}
      />

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

          {enrolledCourses.length === 0 ? (
            <div style={{ padding: '36px 14px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '0 0 12px' }}>
                No courses in advising slip yet. 📋
              </p>
              <Link to="/student/advising" className="btn btn-primary" style={{ display: 'inline-flex', fontSize: '12.5px', padding: '8px 16px' }}>
                Add Advising Slip Courses
              </Link>
            </div>
          ) : todayClasses.length === 0 ? (
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
            <a
              href="https://classroom.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="card-link"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>View Classroom →</span>
            </a>
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
    <Link to={to} className="quick-action-btn">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        <span className="quick-action-icon">{icon}</span>
        <span className="quick-action-label" style={{ color: '#ffffff', fontWeight: '700' }}>{label}</span>
      </div>
      {desc && <span className="quick-action-desc" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{desc}</span>}
    </Link>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
