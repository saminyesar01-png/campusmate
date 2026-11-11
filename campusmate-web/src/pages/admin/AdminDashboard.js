import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ students: 0, teachers: 0, courses: 0, announcements: 0 });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [
        { count: studentCount },
        { count: teacherCount },
        { count: courseCount },
        { count: annCount },
        { data: users },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('announcements').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      setStats({
        students: studentCount || 0,
        teachers: teacherCount || 0,
        courses: courseCount || 0,
        announcements: annCount || 0,
      });
      setRecentUsers(users || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return <div className="loading">Loading admin dashboard...</div>;

  return (
    <div className="page">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Admin Dashboard 🛡️</h1>
          <p className="page-subtitle">Platform overview · {format(new Date(), 'MMMM d, yyyy')}</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-blue">
          <div className="stat-icon">👩‍🎓</div>
          <div><p className="stat-value">{stats.students}</p><p className="stat-label">Students</p></div>
        </div>
        <div className="stat-card stat-green">
          <div className="stat-icon">👨‍🏫</div>
          <div><p className="stat-value">{stats.teachers}</p><p className="stat-label">Teachers</p></div>
        </div>
        <div className="stat-card stat-orange">
          <div className="stat-icon">📚</div>
          <div><p className="stat-value">{stats.courses}</p><p className="stat-label">Courses</p></div>
        </div>
        <div className="stat-card stat-purple">
          <div className="stat-icon">📢</div>
          <div><p className="stat-value">{stats.announcements}</p><p className="stat-label">Announcements</p></div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">👥 Recently Joined Users</h2>
        {recentUsers.length === 0 ? (
          <p className="empty-state">No users yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map(u => (
                <tr key={u.id}>
                  <td>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td><span className={`badge badge-${u.role === 'admin' ? 'danger' : u.role === 'teacher' ? 'warning' : 'primary'}`}>{u.role}</span></td>
                  <td>{format(new Date(u.created_at), 'MMM d, yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
