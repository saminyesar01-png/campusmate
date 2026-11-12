import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Calendar, Bell, BookOpen, TrendingUp, MapPin, CheckCircle, ArrowRight, Clock, CreditCard, Sparkles, ExternalLink } from 'lucide-react';
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

      // 2. Extract classes scheduled for TODAY
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

      // Sort today's classes chronologically by start time
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
        .limit(3);

      // 4. Fetch upcoming assignments if any
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
  const firstName = profile?.full_name?.split(' ')[0] || 'Student';

  // Find upcoming payment deadline if present
  const upcomingFeeDeadline = slipData?.deadlines
    ? [...slipData.deadlines]
        .sort((a, b) => a.date.localeCompare(b.date))
        .find(d => new Date(d.date + 'T00:00:00') >= new Date(new Date().setHours(0,0,0,0)))
    : null;

  if (loading) {
    return (
      <div className="loading" style={{ color: 'var(--text-secondary)' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        Loading your academic hub...
      </div>
    );
  }

  const hasSchedule = (slipData?.courses?.length > 0) || (enrolledCourses.length > 0);
  const activeSchedule = slipData || (enrolledCourses.length > 0 ? { courses: enrolledCourses } : null);

  return (
    <div className="page">
      {/* ── 1. ROYAL HERO HEADER ── */}
      <div className="dashboard-header">
        <div className="dashboard-header-main">
          <div className="hero-status-pill">
            <span className="hero-status-dot" />
            <span className="hero-status-text">
              East West University • Academic Cycle Fall 2026
            </span>
          </div>

          <h1 className="page-title" style={{ fontSize: '28px' }}>
            Good {getGreeting()}, {firstName}! 👋
          </h1>

          <p className="page-subtitle" style={{ fontSize: '14px', marginTop: '6px' }}>
            You have <strong style={{ color: '#a5b4fc' }}>{todayClasses.length} classes scheduled today ({today})</strong> and{' '}
            <strong style={{ color: '#a5b4fc' }}>{enrolledCourses.length} registered courses</strong> ({totalCredits.toFixed(1)} Credits) from your advising slip.
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

      {/* ── 2. STATS GRID ── */}
      <div className="stats-grid">
        <StatCard
          icon={<Calendar size={20} />}
          label={`Classes Today (${today.slice(0, 3)})`}
          value={todayClasses.length}
          color="blue"
          sublabel={todayClasses.length > 0 ? `Next: ${todayClasses[0].code}` : (enrolledCourses.length > 0 ? "No classes today" : "Add advising slip")}
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
          sublabel="Campus & Faculty Notices"
        />
        <StatCard
          icon={<BookOpen size={20} />}
          label="Due Deadlines"
          value={upcomingAssignments.length + (upcomingFeeDeadline ? 1 : 0)}
          color="amber"
          sublabel={upcomingFeeDeadline ? `Fee Due: ${upcomingFeeDeadline.date.slice(5)}` : "All caught up"}
        />
      </div>

      {/* ── 3. ORGANIZED 2-COLUMN DASHBOARD ── */}
      <div className="dashboard-layout-row">
        {/* Left Column: Today's Schedule & Routine (Main Focus) */}
        <div className="dashboard-main-col">
          <div className="card" style={{ height: '100%', marginBottom: 0 }}>
            <div className="card-header">
              <div>
                <h2 className="card-title" style={{ margin: 0, fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📅</span> Today's Class Routine ({today})
                </h2>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {todayClasses.length} sessions from your official East West University slip
                </span>
              </div>
              <Link to="/student/advising" className="card-link" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>View Full Schedule</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {enrolledCourses.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>📋</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px', color: '#ffffff' }}>
                  No Advising Slip Uploaded Yet
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', maxWidth: '420px', margin: '0 auto 18px' }}>
                  Upload your EWU advising slip PDF to automatically populate today's classes, classrooms, and weekly timetable!
                </p>
                <Link to="/student/advising" className="btn btn-primary" style={{ display: 'inline-flex', fontSize: '13px', padding: '9px 18px' }}>
                  Upload Advising Slip
                </Link>
              </div>
            ) : todayClasses.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '34px', marginBottom: '10px' }}>🎉</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px', color: '#ffffff' }}>
                  No Classes Scheduled Today!
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: 0 }}>
                  Take time to review study materials, complete lab assignments, or relax.
                </p>
              </div>
            ) : (
              <div className="schedule-timeline-list">
                {todayClasses.map((cls, idx) => (
                  <div
                    key={idx}
                    className={`schedule-timeline-card ${cls.type === 'Lab' ? 'lab-border' : 'theory-border'}`}
                  >
                    {/* Time Slot Badge */}
                    <div className="schedule-time-col">
                      <span className="schedule-time-main">{cls.time}</span>
                      <span className={`badge ${cls.type === 'Lab' ? 'badge-success' : 'badge-primary'}`} style={{ fontSize: '10.5px' }}>
                        {cls.type}
                      </span>
                    </div>

                    {/* Course Details */}
                    <div className="schedule-details-col">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '800', fontSize: '15px', color: '#ffffff' }}>
                          {cls.code}
                        </span>
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Sec {cls.section}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          • {cls.credits} Credits
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                        {cls.name}
                      </p>
                    </div>

                    {/* Classroom Badge */}
                    <div className="schedule-room-col">
                      <MapPin size={14} color={cls.type === 'Lab' ? '#34d399' : '#818cf8'} />
                      <span style={{ fontWeight: '700', fontSize: '13px', color: '#f8fafc' }}>
                        {cls.room || 'TBA'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Deadlines, Notices & Quick Shortcuts */}
        <div className="dashboard-side-col">
          {/* Upcoming Deadlines & Payment Card */}
          <div className="card" style={{ marginBottom: '18px' }}>
            <div className="card-header">
              <h2 className="card-title" style={{ margin: 0, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} color="#fbbf24" />
                Deadlines & Actions
              </h2>
              <a
                href="https://classroom.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="card-link"
                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
              >
                <span>Google Classroom</span>
                <ExternalLink size={12} />
              </a>
            </div>

            {upcomingFeeDeadline && (
              <div className="deadline-highlight-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={16} color="#f59e0b" />
                  <span style={{ fontWeight: '700', fontSize: '12.5px', color: '#fbbf24' }}>Tuition Fee Deadline</span>
                </div>
                <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  ৳{Number(upcomingFeeDeadline.amount).toLocaleString('en-US')} due on <strong>{upcomingFeeDeadline.date}</strong>
                </div>
              </div>
            )}

            {upcomingAssignments.length === 0 && !upcomingFeeDeadline ? (
              <div style={{ padding: '20px 0', textAlign: 'center' }}>
                <CheckCircle size={28} color="var(--success)" style={{ margin: '0 auto 6px' }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
                  All caught up! No pending deadlines.
                </p>
              </div>
            ) : (
              <ul className="assignment-list" style={{ marginTop: '10px' }}>
                {upcomingAssignments.slice(0, 3).map(a => (
                  <li key={a.id} className="assignment-item" style={{ padding: '8px 0' }}>
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                      <p className="assignment-title" style={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {a.title}
                      </p>
                      <span className="badge badge-primary" style={{ fontSize: '10px' }}>
                        {a.courseCode || 'Task'}
                      </span>
                    </div>
                    <span className="deadline" style={{ fontSize: '11px' }}>
                      Due {format(new Date(a.dueDate || a.due_date || new Date()), 'MMM d')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Campus Notices Card */}
          <div className="card" style={{ marginBottom: '18px' }}>
            <div className="card-header">
              <h2 className="card-title" style={{ margin: 0, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Bell size={16} color="#a855f7" />
                Campus Notices
              </h2>
              <Link to="/student/announcements" className="card-link" style={{ fontSize: '12px' }}>
                View all →
              </Link>
            </div>

            {announcements.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', textAlign: 'center', padding: '16px 0' }}>
                No campus notices posted yet.
              </p>
            ) : (
              <ul className="announcement-list">
                {announcements.map(ann => (
                  <li key={ann.id} className="announcement-item" style={{ padding: '8px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      {ann.is_pinned && <span className="badge badge-warning" style={{ fontSize: '9px', padding: '2px 6px' }}>Pinned</span>}
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {format(new Date(ann.created_at), 'MMM d')}
                      </span>
                    </div>
                    <p className="announcement-title" style={{ fontSize: '13px', margin: 0 }}>
                      {ann.title}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick Academic Navigation Chips */}
          <div className="card" style={{ padding: '14px 16px', marginBottom: 0 }}>
            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
              Academic Hub Shortcuts
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <Link to="/student/advising" className="compact-action-pill">📋 Advising Slip</Link>
              <Link to="/student/routine" className="compact-action-pill">📅 Class Routine</Link>
              <Link to="/student/cgpa" className="compact-action-pill">🧮 CGPA Calc</Link>
              <Link to="/student/materials" className="compact-action-pill">📚 Materials</Link>
              <Link to="/student/lost-found" className="compact-action-pill">🔍 Lost & Found</Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. CORNER FLOATING AI CHATBOT ── */}
      <ChatBox scheduleData={activeSchedule} hasSchedule={hasSchedule} />
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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
