import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Clock, ExternalLink, RefreshCw, Download
} from 'lucide-react';
import { format } from 'date-fns';

// Categorized Google Classroom Stream (Post-Midterm cycle for Fall-2026)
const EWU_CLASSROOM_STREAM = [
  // LECTURE MATERIALS & SLIDES
  {
    id: 'mat-1',
    courseCode: 'CSE246',
    courseName: 'Algorithms (Sec 7)',
    title: 'Lecture 14: Dynamic Programming - 0/1 Knapsack & Matrix Chain',
    category: 'lecture', // 'lecture' | 'lab_report' | 'assignment' | 'quiz' | 'exam' | 'announcement'
    date: '2026-11-10T10:30:00',
    dueDate: null,
    fileType: 'PDF Slides',
    classroomUrl: 'https://classroom.google.com',
    description: 'Post-mid slides covering bottom-up DP table construction, optimal substructure, and overlapping subproblems.',
  },
  {
    id: 'mat-2',
    courseCode: 'CSE251',
    courseName: 'Electronic Devices & Circuits (Sec 5)',
    title: 'Lecture 12: BJT Small Signal Analysis & Hybrid-Pi Model',
    category: 'lecture',
    date: '2026-11-09T09:00:00',
    dueDate: null,
    fileType: 'PowerPoint',
    classroomUrl: 'https://classroom.google.com',
    description: 'Read Chapter 5 from Boylestad before next Tuesday theory slot in AB1-601.',
  },
  {
    id: 'mat-3',
    courseCode: 'POP7203',
    courseName: 'Population & Development (Sec 1)',
    title: 'Reading Material: Fertility Decline & Economic Growth in South Asia',
    category: 'lecture',
    date: '2026-11-08T12:00:00',
    dueDate: null,
    fileType: 'PDF Document',
    classroomUrl: 'https://classroom.google.com',
    description: 'Required reading for next Thursday lecture gallery discussion in Room 550.',
  },

  // LAB REPORTS & MANUALS
  {
    id: 'lab-1',
    courseCode: 'CSE251',
    courseName: 'Electronic Devices & Circuits Lab (Sec 5)',
    title: 'Lab Report 4: Common Emitter (CE) Amplifier Frequency Response',
    category: 'lab_report',
    date: '2026-11-10T14:00:00',
    dueDate: '2026-11-17T17:00:00',
    points: 25,
    status: 'assigned',
    classroomUrl: 'https://classroom.google.com',
    description: 'Submit calculated midband voltage gain (Av) and cutoff frequencies (fL, fH) with Proteus simulation graphs.',
  },
  {
    id: 'lab-2',
    courseCode: 'CSE246',
    courseName: 'Algorithms Lab (Sec 7)',
    title: 'Lab Task 5: Dijkstra and Bellman-Ford Shortest Path Implementation',
    category: 'lab_report',
    date: '2026-11-09T18:00:00',
    dueDate: '2026-11-16T23:59:00',
    points: 30,
    status: 'assigned',
    classroomUrl: 'https://classroom.google.com',
    description: 'Upload your C++ / Java source code with complexity analysis and test cases executed in Lab 435.',
  },

  // ASSIGNMENTS
  {
    id: 'asg-1',
    courseCode: 'POP7203',
    courseName: 'Population & Development (Sec 1)',
    title: 'Term Paper Proposal: Urbanization & Migration Trends in Dhaka City',
    category: 'assignment',
    date: '2026-11-07T11:00:00',
    dueDate: '2026-11-24T23:59:00',
    points: 40,
    status: 'assigned',
    classroomUrl: 'https://classroom.google.com',
    description: 'Submit 2-page proposal outlining research objectives, survey methodology, and key hypotheses.',
  },

  // QUIZZES
  {
    id: 'qz-1',
    courseCode: 'CSE246',
    courseName: 'Algorithms (Sec 7)',
    title: 'Quiz 3: Greedy Algorithms & Huffman Coding',
    category: 'quiz',
    date: '2026-11-11T12:00:00',
    dueDate: '2026-11-19T16:50:00',
    points: 20,
    status: 'assigned',
    classroomUrl: 'https://classroom.google.com',
    description: 'In-class 20 min quiz during Thursday theory session in FUB-303.',
  },

  // PAST MIDTERMS (ENDED LAST WEEK)
  {
    id: 'ex-mid1',
    courseCode: 'CSE251',
    courseName: 'Electronic Devices & Circuits (Sec 5)',
    title: 'Midterm Examination (Fall 2026)',
    category: 'exam',
    date: '2026-11-03T08:30:00',
    dueDate: '2026-11-03T10:00:00',
    status: 'completed', // completed last week!
    classroomUrl: 'https://classroom.google.com',
    description: 'Midterm exam completed last week. Scripts are currently being graded by faculty.',
  },
  {
    id: 'ex-mid2',
    courseCode: 'CSE246',
    courseName: 'Algorithms (Sec 7)',
    title: 'Midterm Examination (Theory)',
    category: 'exam',
    date: '2026-11-05T16:50:00',
    dueDate: '2026-11-05T18:20:00',
    status: 'completed', // completed last week!
    classroomUrl: 'https://classroom.google.com',
    description: 'Midterm exam completed last week. Average scores will be published in classroom.',
  },

  // UPCOMING FINAL EXAM (DECEMBER 2026)
  {
    id: 'ex-fin1',
    courseCode: 'CSE246',
    courseName: 'Algorithms (Sec 7)',
    title: 'Final Examination (Comprehensive)',
    category: 'exam',
    date: '2026-11-12T00:00:00',
    dueDate: '2026-12-28T09:00:00',
    status: 'upcoming',
    classroomUrl: 'https://classroom.google.com',
    description: 'Official EWU Fall-2026 Final Examination slot.',
  }
];

export default function GoogleClassroom() {
  const [stream, setStream] = useState(() => {
    const saved = localStorage.getItem('ewu_classroom_stream_v3');
    return saved ? JSON.parse(saved) : EWU_CLASSROOM_STREAM;
  });
  const [activeCategory, setActiveCategory] = useState('all'); 
  const [filterCourse, setFilterCourse] = useState('all');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    localStorage.setItem('ewu_classroom_stream_v3', JSON.stringify(stream));
  }, [stream]);

  function handleSyncNow() {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
    }, 800);
  }

  function toggleStatus(id) {
    setStream(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: item.status === 'completed' || item.status === 'submitted' ? 'assigned' : 'submitted'
        };
      }
      return item;
    }));
  }

  const filteredItems = stream.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesCourse = filterCourse === 'all' || item.courseCode === filterCourse;
    return matchesCategory && matchesCourse;
  });

  const uniqueCourses = [...new Set(stream.map(c => c.courseCode))];

  return (
    <div className="page">
      {/* Header Banner */}
      <div className="dashboard-header" style={{ marginBottom: '22px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', marginBottom: '10px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a5b4fc' }}>
              Google Classroom Stream • Fall 2026 (Post-Mid Cycle)
            </span>
          </div>

          <h1 className="page-title" style={{ fontSize: '26px', margin: '0 0 6px' }}>
            📚 Google Classroom Stream & Coursework
          </h1>
          <p className="page-subtitle" style={{ fontSize: '13.5px' }}>
            Categorized feed of Lecture Slides, Lab Reports, Quizzes, and Post-Mid Deadlines
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={handleSyncNow} 
            className="btn btn-secondary" 
            disabled={syncing}
            style={{ fontSize: '12.5px', padding: '8px 14px' }}
          >
            <RefreshCw size={14} className={syncing ? 'spinner' : ''} />
            <span>{syncing ? 'Syncing...' : 'Sync Classroom'}</span>
          </button>
        </div>
      </div>

      {/* Midterm Status Alert Pill */}
      <div style={{ padding: '12px 18px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '10px', marginBottom: '22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={18} color="#10b981" />
          <span style={{ fontSize: '13px', color: '#f1f5f9' }}>
            <strong>Midterm Examinations Completed:</strong> Your CSE246 and CSE251 mid exams ended last week. Now focusing on Post-Mid Lab Reports & Final Exam preparation!
          </span>
        </div>
        <span className="badge badge-success">Midterm Cycle Closed ✓</span>
      </div>

      {/* Category Pills Matching Real Classroom Activity */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div className="filter-tabs" style={{ margin: 0 }}>
            {[
              { id: 'all', label: 'All Stream Items' },
              { id: 'lecture', label: '📄 Lecture Slides & Notes' },
              { id: 'lab_report', label: '🔬 Lab Reports' },
              { id: 'assignment', label: '📝 Assignments' },
              { id: 'quiz', label: '⚡ Quizzes' },
              { id: 'exam', label: '🎓 Exams (Mid & Final)' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`filter-tab ${activeCategory === tab.id ? 'active' : ''}`}
                style={{ fontSize: '12.5px' }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filter Course */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Course:</span>
            <select
              value={filterCourse}
              onChange={e => setFilterCourse(e.target.value)}
              style={{ width: '150px', padding: '6px 10px', fontSize: '12.5px' }}
            >
              <option value="all">All Courses</option>
              {uniqueCourses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stream Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredItems.map(item => {
          const isExam = item.category === 'exam';
          const isMidtermPast = isExam && item.status === 'completed';
          const isLecture = item.category === 'lecture';
          const isLabReport = item.category === 'lab_report';
          const isQuiz = item.category === 'quiz';
          const isCompleted = item.status === 'submitted' || item.status === 'completed';

          return (
            <div
              key={item.id}
              className="card"
              style={{
                margin: 0,
                borderLeft: `4px solid ${
                  isMidtermPast ? 'var(--text-muted)' :
                  isLecture ? '#38bdf8' :
                  isLabReport ? '#10b981' :
                  isQuiz ? '#c084fc' :
                  '#6366f1'
                }`,
                background: isMidtermPast ? 'rgba(255,255,255,0.02)' : isCompleted ? 'rgba(16, 185, 129, 0.03)' : 'var(--surface-card)',
                opacity: isMidtermPast ? 0.65 : 1,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                {/* Content */}
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span className="badge badge-primary">{item.courseCode}</span>
                    <span className="badge" style={{
                      background: isLecture ? 'rgba(56, 189, 248, 0.15)' : isLabReport ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                      color: isLecture ? '#38bdf8' : isLabReport ? '#34d399' : '#818cf8',
                      textTransform: 'uppercase',
                      fontSize: '10.5px',
                    }}>
                      {item.category.replace('_', ' ')}
                    </span>
                    {item.fileType && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        📎 {item.fileType}
                      </span>
                    )}
                    {item.points && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        • {item.points} Marks
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px', color: '#ffffff' }}>
                    {item.title}
                  </h3>

                  {item.description && (
                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 0 10px', maxWidth: '720px' }}>
                      {item.description}
                    </p>
                  )}

                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    📚 {item.courseName}
                  </span>
                </div>

                {/* Right Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  {item.dueDate ? (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ 
                        fontSize: '12px', 
                        fontWeight: '700', 
                        color: isMidtermPast ? 'var(--text-muted)' : isCompleted ? '#34d399' : '#818cf8',
                        background: 'rgba(255,255,255,0.05)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Clock size={13} />
                        <span>{isMidtermPast ? 'Ended Last Week' : `Due: ${format(new Date(item.dueDate), 'MMM d, h:mm a')}`}</span>
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      Posted: {format(new Date(item.date), 'MMM d')}
                    </span>
                  )}

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {isLecture ? (
                      <a
                        href={item.classroomUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary"
                        style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Download size={13} />
                        <span>View Slides</span>
                      </a>
                    ) : isMidtermPast ? (
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                        ✓ Exam Concluded
                      </span>
                    ) : (
                      <button
                        onClick={() => toggleStatus(item.id)}
                        className={`btn ${isCompleted ? 'btn-secondary' : 'btn-primary'}`}
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                      >
                        {isCompleted ? 'Mark Pending' : '✓ Mark Done'}
                      </button>
                    )}

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
        })}
      </div>
    </div>
  );
}
