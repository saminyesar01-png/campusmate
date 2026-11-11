import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Calendar, CheckCircle2, Clock, AlertCircle, ExternalLink, 
  RefreshCw, BookOpen, GraduationCap, Sparkles, Filter 
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

// Realistic EWU Google Classroom coursework data mapped to Samin's Fall-2026 courses
const INITIAL_CLASSROOM_DATA = [
  {
    id: 'cw-1',
    courseCode: 'CSE246',
    courseName: 'Algorithms (Sec 7)',
    title: 'Assignment 1: Divide and Conquer & Recurrences',
    type: 'assignment', // 'assignment' | 'quiz' | 'midterm' | 'final'
    dueDate: '2026-11-20T23:59:00',
    points: 100,
    status: 'assigned', // 'assigned' | 'submitted' | 'graded'
    classroomUrl: 'https://classroom.google.com',
    description: 'Solve the recurrence relations using Master Theorem and implement Merge Sort variations.',
  },
  {
    id: 'cw-2',
    courseCode: 'CSE251',
    courseName: 'Electronic Devices & Circuits (Sec 5)',
    title: 'Lab Report 2: Diode Clipper and Clamper Circuits',
    type: 'assignment',
    dueDate: '2026-11-18T17:00:00',
    points: 50,
    status: 'assigned',
    classroomUrl: 'https://classroom.google.com',
    description: 'Submit the simulation waveforms and experimental hardware data recorded in Circuit Lab 548.',
  },
  {
    id: 'cw-3',
    courseCode: 'CSE246',
    courseName: 'Algorithms (Sec 7)',
    title: 'Quiz 2: Asymptotic Notations & Greedy Methods',
    type: 'quiz',
    dueDate: '2026-11-22T16:50:00',
    points: 20,
    status: 'assigned',
    classroomUrl: 'https://classroom.google.com',
    description: '20-minute in-class quiz during theory slot in FUB-303.',
  },
  {
    id: 'cw-4',
    courseCode: 'CSE251',
    courseName: 'Electronic Devices & Circuits (Sec 5)',
    title: 'Midterm Examination (Fall 2026)',
    type: 'midterm',
    dueDate: '2026-11-26T08:30:00',
    points: 100,
    status: 'assigned',
    classroomUrl: 'https://classroom.google.com',
    description: 'Room AB1-601. Covers Modules 1 through 4 (Semiconductors, PN Junctions, BJT Biasing).',
  },
  {
    id: 'cw-5',
    courseCode: 'POP7203',
    courseName: 'Population & Development (Sec 1)',
    title: 'Term Paper Proposal: Demographic Transition in Bangladesh',
    type: 'assignment',
    dueDate: '2026-11-28T23:59:00',
    points: 30,
    status: 'assigned',
    classroomUrl: 'https://classroom.google.com',
    description: 'Submit 2-page PDF proposal with research question, methodology, and initial references.',
  },
  {
    id: 'cw-6',
    courseCode: 'CSE246',
    courseName: 'Algorithms (Sec 7)',
    title: 'Midterm Examination (Theory)',
    type: 'midterm',
    dueDate: '2026-11-30T16:50:00',
    points: 100,
    status: 'assigned',
    classroomUrl: 'https://classroom.google.com',
    description: 'Room FUB-303. Topics: Asymptotic analysis, Divide & Conquer, Dynamic Programming.',
  }
];

export default function GoogleClassroom() {
  const { profile } = useAuth();
  const [isConnected, setIsConnected] = useState(() => {
    return localStorage.getItem('ewu_classroom_connected') === 'true';
  });
  const [coursework, setCoursework] = useState(() => {
    const saved = localStorage.getItem('ewu_classroom_work');
    return saved ? JSON.parse(saved) : INITIAL_CLASSROOM_DATA;
  });
  const [filterType, setFilterType] = useState('all'); // 'all' | 'assignment' | 'quiz' | 'midterm'
  const [filterCourse, setFilterCourse] = useState('all');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    localStorage.setItem('ewu_classroom_work', JSON.stringify(coursework));
  }, [coursework]);

  function handleConnect() {
    setSyncing(true);
    setTimeout(() => {
      setIsConnected(true);
      localStorage.setItem('ewu_classroom_connected', 'true');
      setSyncing(false);
    }, 1200);
  }

  function handleDisconnect() {
    setIsConnected(false);
    localStorage.setItem('ewu_classroom_connected', 'false');
  }

  function handleSyncNow() {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
    }, 1000);
  }

  function toggleStatus(id) {
    setCoursework(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: item.status === 'submitted' ? 'assigned' : 'submitted'
        };
      }
      return item;
    }));
  }

  const filteredItems = coursework.filter(item => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesCourse = filterCourse === 'all' || item.courseCode === filterCourse;
    return matchesType && matchesCourse;
  });

  const uniqueCourses = [...new Set(coursework.map(c => c.courseCode))];

  return (
    <div className="page">
      {/* Header Banner */}
      <div className="dashboard-header" style={{ marginBottom: '22px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', marginBottom: '10px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isConnected ? '#10b981' : '#f59e0b', boxShadow: isConnected ? '0 0 8px #10b981' : 'none' }} />
            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a5b4fc' }}>
              {isConnected ? 'Google Classroom Sync Active • @std.ewubd.edu' : 'Google Classroom Integration'}
            </span>
          </div>

          <h1 className="page-title" style={{ fontSize: '26px', margin: '0 0 6px' }}>
            📚 Google Classroom & Deadlines Hub
          </h1>
          <p className="page-subtitle" style={{ fontSize: '13.5px' }}>
            All assignments, quizzes, and midterm/final exam dates automatically pulled from your EWU courses
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {isConnected ? (
            <>
              <button 
                onClick={handleSyncNow} 
                className="btn btn-secondary" 
                disabled={syncing}
                style={{ fontSize: '12.5px', padding: '8px 14px' }}
              >
                <RefreshCw size={14} className={syncing ? 'spinner' : ''} />
                <span>{syncing ? 'Syncing...' : 'Sync Classroom'}</span>
              </button>
              <button 
                onClick={handleDisconnect} 
                className="btn btn-ghost"
                style={{ fontSize: '12px', color: 'var(--text-muted)' }}
              >
                Disconnect
              </button>
            </>
          ) : (
            <button 
              onClick={handleConnect} 
              className="btn btn-primary"
              disabled={syncing}
              style={{ fontSize: '13px', padding: '10px 18px' }}
            >
              <span>{syncing ? 'Connecting...' : 'Connect Google Classroom'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Connection Callout if not connected */}
      {!isConnected && (
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(17, 24, 39, 0.9))', borderColor: 'rgba(99, 102, 241, 0.3)', marginBottom: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 4px', color: '#ffffff' }}>
                🔗 Connect your EWU Student Google Account
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                Link your official <code>@std.ewubd.edu</code> account to auto-import course deadlines, announcements, and exam schedules.
              </p>
            </div>
            <button onClick={handleConnect} className="btn btn-primary">
              Connect @std.ewubd.edu Account
            </button>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="stats-grid" style={{ marginBottom: '22px' }}>
        <div className="stat-card stat-red">
          <div className="stat-icon"><AlertCircle size={20} /></div>
          <div>
            <p className="stat-value">{coursework.filter(c => c.status !== 'submitted').length}</p>
            <p className="stat-label">Pending Deadlines</p>
          </div>
        </div>
        <div className="stat-card stat-orange">
          <div className="stat-icon"><Clock size={20} /></div>
          <div>
            <p className="stat-value">{coursework.filter(c => c.type === 'midterm' || c.type === 'final').length}</p>
            <p className="stat-label">Upcoming Exams</p>
          </div>
        </div>
        <div className="stat-card stat-purple">
          <div className="stat-icon"><BookOpen size={20} /></div>
          <div>
            <p className="stat-value">{coursework.filter(c => c.type === 'quiz').length}</p>
            <p className="stat-label">Scheduled Quizzes</p>
          </div>
        </div>
        <div className="stat-card stat-green">
          <div className="stat-icon"><CheckCircle2 size={20} /></div>
          <div>
            <p className="stat-value">{coursework.filter(c => c.status === 'submitted').length}</p>
            <p className="stat-label">Completed Tasks</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          {/* Type Filters */}
          <div className="filter-tabs" style={{ margin: 0 }}>
            {['all', 'assignment', 'quiz', 'midterm'].map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`filter-tab ${filterType === t ? 'active' : ''}`}
                style={{ textTransform: 'capitalize' }}
              >
                {t === 'all' ? 'All Deadlines' : t + 's'}
              </button>
            ))}
          </div>

          {/* Course Dropdown Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Filter Course:</span>
            <select
              value={filterCourse}
              onChange={e => setFilterCourse(e.target.value)}
              style={{ width: '160px', padding: '6px 10px', fontSize: '12.5px' }}
            >
              <option value="all">All Courses</option>
              {uniqueCourses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Coursework Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredItems.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 0' }}>
            <CheckCircle2 size={36} color="var(--success)" style={{ margin: '0 auto 10px' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
              No deadlines found matching your filter!
            </p>
          </div>
        ) : (
          filteredItems.map(item => {
            const daysLeft = differenceInDays(new Date(item.dueDate), new Date());
            const isUrgent = daysLeft >= 0 && daysLeft <= 3 && item.status !== 'submitted';
            const isCompleted = item.status === 'submitted';

            return (
              <div
                key={item.id}
                className="card"
                style={{
                  margin: 0,
                  borderLeft: `4px solid ${
                    isCompleted ? '#10b981' :
                    item.type === 'midterm' ? '#f59e0b' :
                    item.type === 'quiz' ? '#8b5cf6' :
                    isUrgent ? '#ef4444' : '#6366f1'
                  }`,
                  background: isCompleted ? 'rgba(16, 185, 129, 0.03)' : 'var(--surface-card)',
                  opacity: isCompleted ? 0.75 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  {/* Left: Course details and title */}
                  <div style={{ flex: 1, minWidth: '260px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span className="badge badge-primary">{item.courseCode}</span>
                      <span className={`badge ${
                        item.type === 'midterm' ? 'badge-warning' :
                        item.type === 'quiz' ? 'badge-info' : 'badge-primary'
                      }`} style={{ textTransform: 'uppercase', fontSize: '10px' }}>
                        {item.type}
                      </span>
                      {item.points && (
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          • {item.points} Marks
                        </span>
                      )}
                    </div>

                    <h3 style={{ 
                      fontSize: '16px', 
                      fontWeight: '700', 
                      margin: '0 0 6px',
                      textDecoration: isCompleted ? 'line-through' : 'none',
                      color: isCompleted ? 'var(--text-muted)' : '#ffffff'
                    }}>
                      {item.title}
                    </h3>

                    {item.description && (
                      <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 0 10px', maxWidth: '700px' }}>
                        {item.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <span>📚 {item.courseName}</span>
                    </div>
                  </div>

                  {/* Right: Due Date & Action Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                    {/* Due Date Badge */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontSize: '12.5px', 
                        fontWeight: '700', 
                        color: isCompleted ? '#34d399' : isUrgent ? '#f87171' : '#818cf8',
                        background: isCompleted ? 'rgba(16, 185, 129, 0.1)' : isUrgent ? 'rgba(239, 68, 68, 0.12)' : 'rgba(99, 102, 241, 0.1)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}>
                        <Clock size={13} />
                        <span>Due: {format(new Date(item.dueDate), 'MMM d, h:mm a')}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                        {isCompleted ? '✓ Completed' : daysLeft >= 0 ? `${daysLeft} days remaining` : 'Overdue'}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => toggleStatus(item.id)}
                        className={`btn ${isCompleted ? 'btn-secondary' : 'btn-primary'}`}
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                      >
                        {isCompleted ? 'Mark Pending' : '✓ Mark as Done'}
                      </button>
                      <a
                        href={item.classroomUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary"
                        style={{ fontSize: '12px', padding: '6px 10px' }}
                        title="Open in Google Classroom"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
