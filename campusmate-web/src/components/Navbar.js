import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Calendar, Bell, BookOpen,
  Calculator, Search, LogOut, Menu, X, GraduationCap
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
    { to: '/student', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/student/routine', icon: <Calendar size={18} />, label: 'Routine' },
    { to: '/student/announcements', icon: <Bell size={18} />, label: 'Announcements' },
    { to: '/student/materials', icon: <BookOpen size={18} />, label: 'Materials' },
    { to: '/student/cgpa', icon: <Calculator size={18} />, label: 'CGPA' },
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
        <span className="navbar-role-badge">{profile?.role}</span>
      </div>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-logo">🎓 CampusMate</span>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">
            {profile?.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="user-info">
            <p className="user-name">{profile?.full_name}</p>
            <p className="user-role">{profile?.role}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
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
