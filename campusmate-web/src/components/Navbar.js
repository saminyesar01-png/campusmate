import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Calendar, Bell, BookOpen,
  Calculator, Search, LogOut, GraduationCap, FileText
} from 'lucide-react';

export default function Navbar() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  const studentLinks = [
    { to: '/student', icon: <LayoutDashboard size={16} />, label: 'Overview' },
    { to: '/student/advising', icon: <FileText size={16} />, label: 'Advising & Routine' },
    { to: '/student/routine', icon: <Calendar size={16} />, label: 'Class Routine' },
    { to: '/student/materials', icon: <BookOpen size={16} />, label: 'Study Materials' },
    { to: '/student/cgpa', icon: <Calculator size={16} />, label: 'EWU CGPA' },
    { to: '/student/announcements', icon: <Bell size={16} />, label: 'Announcements' },
    { to: '/student/lost-found', icon: <Search size={16} />, label: 'Lost & Found' },
  ];

  const teacherLinks = [
    { to: '/teacher', icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
    { to: '/teacher/announcements', icon: <Bell size={16} />, label: 'Announcements' },
    { to: '/teacher/materials', icon: <BookOpen size={16} />, label: 'Materials' },
    { to: '/teacher/assignments', icon: <Calendar size={16} />, label: 'Assignments' },
    { to: '/student/lost-found', icon: <Search size={16} />, label: 'Lost & Found' },
  ];

  const adminLinks = [
    { to: '/admin', icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
    { to: '/admin/users', icon: <GraduationCap size={16} />, label: 'Users' },
    { to: '/admin/courses', icon: <BookOpen size={16} />, label: 'Courses' },
    { to: '/admin/events', icon: <Calendar size={16} />, label: 'Events' },
    { to: '/admin/announcements', icon: <Bell size={16} />, label: 'Announcements' },
    { to: '/student/lost-found', icon: <Search size={16} />, label: 'Lost & Found' },
  ];

  const links =
    profile?.role === 'admin' ? adminLinks :
    profile?.role === 'teacher' ? teacherLinks :
    studentLinks;

  return (
    <header className="top-navbar">
      {/* Brand & User Row */}
      <div className="top-navbar-main">
        <Link to="/" className="top-navbar-logo">
          <img src="/favicon.svg" alt="CampusMate Logo" width="30" height="30" style={{ display: 'block', borderRadius: '8px', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.4)' }} />
          <div className="logo-text-col">
            <span className="logo-title">CampusMate</span>
            <span className="logo-subtitle">EWU Academic Hub</span>
          </div>
        </Link>

        {/* User Profile & Sign Out */}
        <div className="top-navbar-actions">
          <div className="user-capsule">
            <div className="user-capsule-avatar">
              {profile?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="user-capsule-details">
              <span className="user-capsule-name">
                {profile?.full_name || 'Student'}
              </span>
              <span className="user-capsule-id">
                {profile?.student_id ? `ID: ${profile.student_id}` : (profile?.role || 'Student')}
              </span>
            </div>
          </div>

          <button onClick={handleSignOut} className="btn-capsule-signout" title="Sign Out">
            <LogOut size={14} />
            <span className="signout-text">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Oval / Capsule Shape Navigation Bar */}
      <nav className="top-navbar-nav">
        <div className="nav-capsule-scroller">
          {links.map(({ to, icon, label }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`nav-capsule-pill ${isActive ? 'active' : ''}`}
              >
                <span className="nav-pill-icon">{icon}</span>
                <span className="nav-pill-label">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
