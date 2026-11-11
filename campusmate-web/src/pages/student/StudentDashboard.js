import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Calendar, Bell, BookOpen, Calculator, Search, TrendingUp, Sparkles, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export default function StudentDashboard() {
  const { profile } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [todayClasses, setTodayClasses] = useState([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];

  useEffect(() => {
    async function fetchData() {
      // Fetch recent announcements
      const { data: ann } = await supabase
        .from('announcements')
        .select('*, profiles(full_name)')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(4);

      // Fetch today's classes
      const { data: schedule } = await supabase
        .from('class_schedule')
        .select('*, courses(name, code, teacher_id, profiles(full_name))')
        .eq('day_of_week', today)
        .order('start_time');

      // Fetch upcoming assignments
      const { data: assignments } = await supabase
        .from('assignments')
        .select('*, courses(name, code)')
        .gte('due_date', new Date().toISOString())
        .order('due_date')
        .limit(4);

      setAnnouncements(ann || []);
      setTodayClasses(schedule || []);
      setUpcomingAssignments(assignments || []);
      setLoading(false);
    }

    fetchData();
  }, [today]);

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
            Good {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'Student'}! 👋
          </h1>
          <p className="page-subtitle" style={{ fontSize: '14px', maxWidth: '600px' }}>
            You have <span style={{ color: '#818cf8', fontWeight: '600' }}>{todayClasses.length} classes today</span> and{' '}
            <span style={{ color: '#f87171', fontWeight: '600' }}>{upcomingAssignments.length} pending deadlines</span> this week.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          {profile?.student_id && (
            <span className="badge badge-primary" style={{ padding: '6px 14px', fontSize: '12.5px' }}>
              ID: {profile.student_id}
            </span>
          )}
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </span>
        </div>
      </div>

      {/* Metrics Stat Cards */}
      <div className="stats-grid">
        <StatCard icon={<Calendar size={20} />} label="Classes Today" value={todayClasses.length} color="blue" />
        <StatCard icon={<Bell size={20} />} label="Announcements" value={announcements.length} color="purple" />
        <StatCard icon={<BookOpen size={20} />} label="Due Assignments" value={upcomingAssignments.length} color="red" />
        <StatCard icon={<TrendingUp size={20} />} label="Enrolled Courses" value="5" color="green" />
      </div>

      {/* Fast Shortcuts */}
      <div className="section">
        <h2 className="section-title">Quick Academic Actions</h2>
        <div className="quick-actions">
          <QuickAction to="/student/routine" icon="📅" label="Class Routine" desc="Check timings & rooms" />
          <QuickAction to="/student/cgpa" icon="🧮" label="EWU CGPA Calculator" desc="Official 4.00 scale & retakes" />
          <QuickAction to="/student/materials" icon="📚" label="Study Materials" desc="Lecture notes & slides" />
          <QuickAction to="/student/announcements" icon="📢" label="Announcements" desc="Campus & course notices" />
          <QuickAction to="/student/lost-found" icon="🔍" label="Lost & Found" desc="Missing campus items" />
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Today's Schedule Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title" style={{ margin: 0 }}>📅 Today's Schedule ({today})</h2>
            </div>
            <Link to="/student/routine" className="card-link">View full week →</Link>
          </div>

          {todayClasses.length === 0 ? (
            <div style={{ padding: '30px 10px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '0 0 6px' }}>No classes scheduled for {today} 🎉</p>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Take this time to review study materials or catch up on coursework.</span>
            </div>
          ) : (
            <ul className="class-list">
              {todayClasses.map(cls => (
                <li key={cls.id} className="class-item">
                  <div className="class-time">
                    {cls.start_time?.slice(0, 5)} - {cls.end_time?.slice(0, 5)}
                  </div>
                  <div className="class-info" style={{ flex: 1 }}>
                    <p className="class-name">{cls.courses?.name || 'Class Session'}</p>
                    <p className="class-meta">
                      {cls.courses?.code} {cls.room && `· Room ${cls.room}`}
                    </p>
                  </div>
                  <span className="badge badge-primary">Active</span>
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
          </div>

          {upcomingAssignments.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center' }}>
              <CheckCircle size={32} color="var(--success)" style={{ margin: '0 auto 8px' }} />
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>All caught up! No urgent assignments due.</p>
            </div>
          ) : (
            <ul className="assignment-list">
              {upcomingAssignments.map(a => (
                <li key={a.id} className="assignment-item">
                  <div>
                    <p className="assignment-title">{a.title}</p>
                    <p className="assignment-meta">{a.courses?.code || 'Course Assignment'}</p>
                  </div>
                  <span className="deadline">
                    Due {format(new Date(a.due_date), 'MMM d, h:mm a')}
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

function StatCard({ icon, label, value, color }) {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-icon">{icon}</div>
      <div>
        <p className="stat-value">{value}</p>
        <p className="stat-label">{label}</p>
      </div>
    </div>
  );
}

function QuickAction({ to, icon, label, desc }) {
  return (
    <Link to={to} className="quick-action-btn" style={{ flexDirection: 'column', alignItems: 'flex-start', minWidth: '180px' }}>
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
