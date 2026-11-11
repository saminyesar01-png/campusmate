import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Calendar, Bell, BookOpen, Calculator, Search, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export default function StudentDashboard() {
  const { profile } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [todayClasses, setTodayClasses] = useState([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const today = days[new Date().getDay()];

  useEffect(() => {
    async function fetchData() {
      // Fetch recent announcements
      const { data: ann } = await supabase
        .from('announcements')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch today's classes (via enrollments → courses → schedule)
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
        .limit(5);

      setAnnouncements(ann || []);
      setTodayClasses(schedule || []);
      setUpcomingAssignments(assignments || []);
      setLoading(false);
    }

    fetchData();
  }, [today]);

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="page">
      {/* Welcome banner */}
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">
            Good {getGreeting()}, {profile?.full_name?.split(' ')[0]}! 👋
          </h1>
          <p className="page-subtitle">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        {profile?.student_id && (
          <span className="badge badge-primary">{profile.student_id}</span>
        )}
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        <StatCard icon={<Calendar size={20} />} label="Classes Today" value={todayClasses.length} color="blue" />
        <StatCard icon={<Bell size={20} />} label="Announcements" value={announcements.length} color="orange" />
        <StatCard icon={<BookOpen size={20} />} label="Assignments Due" value={upcomingAssignments.length} color="red" />
        <StatCard icon={<TrendingUp size={20} />} label="Semester" value="Fall 2026" color="green" />
      </div>

      {/* Quick Actions */}
      <div className="section">
        <h2 className="section-title">Quick Access</h2>
        <div className="quick-actions">
          <QuickAction to="/student/routine" icon="📅" label="Class Routine" />
          <QuickAction to="/student/announcements" icon="📢" label="Announcements" />
          <QuickAction to="/student/materials" icon="📚" label="Study Materials" />
          <QuickAction to="/student/cgpa" icon="🧮" label="CGPA Calculator" />
          <QuickAction to="/student/lost-found" icon="🔍" label="Lost & Found" />
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Today's Classes */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">📅 Today's Classes ({today})</h2>
          </div>
          {todayClasses.length === 0 ? (
            <p className="empty-state">No classes scheduled for today.</p>
          ) : (
            <ul className="class-list">
              {todayClasses.map(cls => (
                <li key={cls.id} className="class-item">
                  <div className="class-time">
                    {cls.start_time?.slice(0, 5)} – {cls.end_time?.slice(0, 5)}
                  </div>
                  <div className="class-info">
                    <p className="class-name">{cls.courses?.name}</p>
                    <p className="class-meta">{cls.courses?.code} · Room {cls.room}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Announcements */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">📢 Announcements</h2>
            <Link to="/student/announcements" className="card-link">View all</Link>
          </div>
          {announcements.length === 0 ? (
            <p className="empty-state">No announcements yet.</p>
          ) : (
            <ul className="announcement-list">
              {announcements.map(ann => (
                <li key={ann.id} className="announcement-item">
                  {ann.is_pinned && <span className="badge badge-warning">📌 Pinned</span>}
                  <p className="announcement-title">{ann.title}</p>
                  <p className="announcement-meta">
                    By {ann.profiles?.full_name} · {format(new Date(ann.created_at), 'MMM d')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Upcoming Assignments */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">📝 Upcoming Assignments</h2>
          </div>
          {upcomingAssignments.length === 0 ? (
            <p className="empty-state">No upcoming assignments. Enjoy! 🎉</p>
          ) : (
            <ul className="assignment-list">
              {upcomingAssignments.map(a => (
                <li key={a.id} className="assignment-item">
                  <div>
                    <p className="assignment-title">{a.title}</p>
                    <p className="assignment-meta">{a.courses?.code}</p>
                  </div>
                  <span className="deadline">
                    Due: {format(new Date(a.due_date), 'MMM d, h:mm a')}
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

function QuickAction({ to, icon, label }) {
  return (
    <Link to={to} className="quick-action-btn">
      <span className="quick-action-icon">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
