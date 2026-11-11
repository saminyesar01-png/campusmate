import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

export default function TeacherDashboard() {
  const { profile } = useAuth();
  const [myCourses, setMyCourses] = useState([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: courses } = await supabase
        .from('courses')
        .select('*, departments(name)')
        .eq('teacher_id', profile?.id);

      const { data: ann } = await supabase
        .from('announcements')
        .select('*')
        .eq('author_id', profile?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setMyCourses(courses || []);
      setRecentAnnouncements(ann || []);
      setLoading(false);
    }

    if (profile?.id) fetchData();
  }, [profile]);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Welcome, {profile?.full_name?.split(' ')[0]}! 👋</h1>
          <p className="page-subtitle">Teacher Dashboard · {format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-blue">
          <div className="stat-icon">📚</div>
          <div>
            <p className="stat-value">{myCourses.length}</p>
            <p className="stat-label">My Courses</p>
          </div>
        </div>
        <div className="stat-card stat-orange">
          <div className="stat-icon">📢</div>
          <div>
            <p className="stat-value">{recentAnnouncements.length}</p>
            <p className="stat-label">Announcements</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* My Courses */}
        <div className="card">
          <h2 className="card-title">📚 My Courses</h2>
          {myCourses.length === 0 ? (
            <p className="empty-state">No courses assigned yet.</p>
          ) : (
            <ul className="course-list">
              {myCourses.map(c => (
                <li key={c.id} className="course-item">
                  <div className="course-code">{c.code}</div>
                  <div>
                    <p className="course-name">{c.name}</p>
                    <p className="course-meta">{c.departments?.name} · Section {c.section} · {c.credit_hours} credits</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Announcements */}
        <div className="card">
          <h2 className="card-title">📢 My Announcements</h2>
          {recentAnnouncements.length === 0 ? (
            <p className="empty-state">You haven't posted any announcements yet.</p>
          ) : (
            <ul className="announcement-list">
              {recentAnnouncements.map(ann => (
                <li key={ann.id} className="announcement-item">
                  <p className="announcement-title">{ann.title}</p>
                  <p className="announcement-meta">{format(new Date(ann.created_at), 'MMM d, yyyy')}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
