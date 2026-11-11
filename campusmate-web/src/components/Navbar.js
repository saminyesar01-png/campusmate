import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Calendar, Bell, BookOpen,
  Calculator, Search, LogOut, Menu, X, GraduationCap, Sparkles, FileText
} from 'lucide-react';

export default function Navbar({ sidebarOpen, setSidebarOpen }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  const studentLinks = [
    { to: '/student', icon: <LayoutDashboard size={18} />, label: 'Overview' },
    { to: '/student/advising', icon: <FileText size={18} />, label: 'Advising & Routine' },
    { to: '/student/routine', icon: <Calendar size={18} />, label: 'Class Routine' },
    { to: '/student/materials', icon: <BookOpen size={18} />, label: 'Study Materials' },
    { to: '/student/cgpa', icon: <Calculator size={18} />, label: 'EWU CGPA' },
    { to: '/student/announcements', icon: <Bell size={18} />, label: 'Announcements' },
    { to: '/student/lost-found', icon: <Search size={18} />, label: 'Lost & Found' },
  ];

  const teacherLinks = [
    { to: '/teacher', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/teacher/announcements', icon: <Bell size={18} />, label: 'Announcements' },
    { to: '/teacher/materials', icon: <BookOpen size={18} />, label: 'Materials' },
    { to: '/teacher/assignments', icon: <Calendar size={18} />, label: 'Assignments' },
  ];

  const adminLinks = [
    { to: '/admin', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/admin/users', icon: <GraduationCap size={18} />, label: 'Users' },
    { to: '/admin/courses', icon: <BookOpen size={18} />, label: 'Courses' },
    { to: '/admin/events', icon: <Calendar size={18} />, label: 'Events' },
    { to: '/admin/announcements', icon: <Bell size={18} />, label: 'Announcements' },
  ];

  const links =
    profile?.role === 'admin' ? adminLinks :
    profile?.role === 'teacher' ? teacherLinks :
    studentLinks;

  return (
    <>
      {/* Mobile top bar */}
      <div className="navbar-topbar">
        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <span className="navbar-brand">🎓 CampusMate</span>
        <span className="navbar-role-badge">{profile?.role || 'User'}</span>
      </div>

      {/* Sleek Obsidian Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="sidebar-logo">🎓 CampusMate</span>
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '2px' }}>
              EWU Academic Hub
            </span>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">
            {profile?.full_name?.[0]?.toUpperCase() || 'S'}
          </div>
          <div className="user-info" style={{ minWidth: 0, flex: 1 }}>
            <p className="user-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile?.full_name || 'Student'}
            </p>
            <p className="user-role">
              {profile?.student_id ? `${profile.student_id}` : profile?.role || 'student'}
            </p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <p style={{ padding: '0 10px', margin: '0 0 8px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
            Academic Space
          </p>

          {links.map(({ to, icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`nav-link ${location.pathname === to ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              {icon}
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <button className="sidebar-signout" onClick={handleSignOut}>
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </aside>
    </>
  );
}
