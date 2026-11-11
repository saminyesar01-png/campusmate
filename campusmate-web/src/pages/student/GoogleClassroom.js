import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  CheckCircle2, Clock, ExternalLink, RefreshCw, Plus, Trash2, 
  BookOpen, FileText, FlaskConical, Calendar, X, Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

// Samin's Handcrafted Classroom Stream (Fall 2026 Post-Mid)
const SAMIN_CLASSROOM_STREAM = [
  {
    id: 'mat-1',
    courseCode: 'CSE246',
    courseName: 'Algorithms (Sec 7)',
    title: 'Lecture 14: Dynamic Programming - 0/1 Knapsack & Matrix Chain',
    category: 'lecture',
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
  {
    id: 'ex-mid1',
    courseCode: 'CSE251',
    courseName: 'Electronic Devices & Circuits (Sec 5)',
    title: 'Midterm Examination (Fall 2026)',
    category: 'exam',
    date: '2026-11-03T08:30:00',
    dueDate: '2026-11-03T10:00:00',
    status: 'completed',
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
    status: 'completed',
    classroomUrl: 'https://classroom.google.com',
    description: 'Midterm exam completed last week. Average scores will be published in classroom.',
  },
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

// Helper to generate dynamic coursework for any student's registered courses
function generateClassroomForCourses(courses) {
  if (!courses || courses.length === 0) return [];
  const items = [];

  courses.forEach((c, idx) => {
    const code = c.code || `COURSE${idx + 1}`;
    const name = c.name || code;
    const sec = c.section ? ` (Sec ${c.section})` : '';
    const hasLab = c.hasLab || c.sessions?.some(s => s.type === 'Lab') || name.toLowerCase().includes('lab') || (parseFloat(c.credits) >= 4);

    // 1. Lecture Slides
    items.push({
      id: `gen-lec-${code}-${idx}`,
      courseCode: code,
      courseName: `${name}${sec}`,
      title: `${code}: Lecture 14 — Post-Mid Term Concepts & Discussion`,
      category: 'lecture',
      date: '2026-11-10T10:00:00',
      dueDate: null,
      fileType: 'PDF Slides',
      classroomUrl: 'https://classroom.google.com',
      description: `Official faculty lecture slides and reading reference materials for ${name}.`,
    });

    // 2. Assignment
    items.push({
      id: `gen-asg-${code}-${idx}`,
      courseCode: code,
      courseName: `${name}${sec}`,
      title: `${code}: Assignment 3 — Problem Set & Case Study`,
      category: 'assignment',
      date: '2026-11-09T14:00:00',
      dueDate: '2026-11-22T23:59:00',
      points: 25,
      status: 'assigned',
      classroomUrl: 'https://classroom.google.com',
      description: `Complete problems from Chapters 5–7 and submit PDF report via Google Classroom before deadline.`,
    });

    // 3. Lab Report (if course has lab session)
    if (hasLab) {
      items.push({
        id: `gen-lab-${code}-${idx}`,
        courseCode: code,
        courseName: `${name} Lab${sec}`,
        title: `${code}: Lab Report 4 — Practical Implementation & Output Analysis`,
        category: 'lab_report',
        date: '2026-11-10T16:00:00',
        dueDate: '2026-11-18T17:00:00',
        points: 30,
        status: 'assigned',
        classroomUrl: 'https://classroom.google.com',
        description: `Submit experimental findings, circuit/code implementation, and test waveforms.`,
      });
    }

    // 4. Quiz
    items.push({
      id: `gen-qz-${code}-${idx}`,
      courseCode: code,
      courseName: `${name}${sec}`,
      title: `${code}: Quiz 3 — In-Class Assessment`,
      category: 'quiz',
      date: '2026-11-11T11:00:00',
      dueDate: '2026-11-19T15:00:00',
      points: 20,
      status: 'assigned',
      classroomUrl: 'https://classroom.google.com',
      description: `In-class 20 min quiz covering post-mid syllabus. Prepare theory and numerical calculations.`,
    });

    // 5. Completed Midterm (marked completed so it doesn't show as upcoming)
    items.push({
      id: `gen-mid-${code}-${idx}`,
      courseCode: code,
      courseName: `${name}${sec}`,
      title: `${code}: Midterm Examination (Theory)`,
      category: 'exam',
      date: '2026-11-04T10:00:00',
      dueDate: '2026-11-04T12:00:00',
      status: 'completed',
      classroomUrl: 'https://classroom.google.com',
      description: `Midterm examination ended last week. Scripts under evaluation.`,
    });

    // 6. Upcoming Final Exam
    items.push({
      id: `gen-fin-${code}-${idx}`,
      courseCode: code,
      courseName: `${name}${sec}`,
      title: `${code}: Final Examination (Comprehensive)`,
      category: 'exam',
      date: '2026-11-12T00:00:00',
      dueDate: '2026-12-28T09:00:00',
      status: 'upcoming',
      classroomUrl: 'https://classroom.google.com',
      description: `Comprehensive Fall-2026 Final Examination according to EWU routine.`,
    });
  });

  return items;
}

export default function GoogleClassroom() {
  const { profile } = useAuth();
  const isSamin = !profile?.id || profile?.email?.includes('samin') || profile?.full_name?.toLowerCase().includes('samin');
  
  // 1. Load enrolled courses from this student's advising slip
  const advisingKey = profile?.id ? `ewu_advising_courses_${profile.id}` : 'ewu_advising_courses_v2';
  const [enrolledCourses] = useState(() => {
    const saved = localStorage.getItem(advisingKey);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return isSamin ? [
      { code: 'CSE246', name: 'Algorithms', section: '7', credits: '4.5' },
      { code: 'CSE251', name: 'Electronic Devices & Circuits', section: '5', credits: '4.0' },
      { code: 'POP7203', name: 'Population & Development', section: '1', credits: '3.0' },
    ] : [];
  });

  // 2. Load or generate this student's isolated classroom stream
  const classroomKey = profile?.id ? `ewu_classroom_stream_${profile.id}` : 'ewu_classroom_stream_v3';
  const [stream, setStream] = useState(() => {
    const saved = localStorage.getItem(classroomKey);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    // If Samin, load Samin's full sample stream
    if (isSamin) {
      return SAMIN_CLASSROOM_STREAM;
    }
    // If another student has advising courses, generate for their exact courses!
    if (enrolledCourses.length > 0) {
      return generateClassroomForCourses(enrolledCourses);
    }
    return [];
  });

  const [activeCategory, setActiveCategory] = useState('all'); 
  const [filterCourse, setFilterCourse] = useState('all');
  const [syncing, setSyncing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New coursework form state
  const [newItem, setNewItem] = useState({
    courseCode: enrolledCourses[0]?.code || '',
    title: '',
    category: 'assignment',
    dueDate: '2026-11-20T23:59',
    points: '25',
    description: '',
    classroomUrl: 'https://classroom.google.com',
  });

  // Save changes isolated per student
  useEffect(() => {
    if (classroomKey) {
      localStorage.setItem(classroomKey, JSON.stringify(stream));
    }
  }, [stream, classroomKey]);

  function handleSyncNow() {
    setSyncing(true);
    setTimeout(() => {
      // If student has updated advising courses and stream is empty, auto-populate for their courses
      if (stream.length === 0 && enrolledCourses.length > 0) {
        setStream(generateClassroomForCourses(enrolledCourses));
      }
      setSyncing(false);
    }, 700);
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

  function handleDeleteItem(id) {
    if (window.confirm('Are you sure you want to remove this item from your stream?')) {
      setStream(prev => prev.filter(item => item.id !== id));
    }
  }

  function handleAddItem(e) {
    e.preventDefault();
    if (!newItem.title.trim()) return;

    const courseObj = enrolledCourses.find(c => c.code === newItem.courseCode);
    const createdItem = {
      id: 'custom-' + Date.now(),
      courseCode: newItem.courseCode || 'General',
      courseName: courseObj ? `${courseObj.name} (Sec ${courseObj.section || '1'})` : newItem.courseCode,
      title: newItem.title,
      category: newItem.category,
      date: new Date().toISOString(),
      dueDate: newItem.category === 'lecture' ? null : (newItem.dueDate ? new Date(newItem.dueDate).toISOString() : null),
      points: newItem.points ? parseInt(newItem.points) : null,
      status: 'assigned',
      classroomUrl: newItem.classroomUrl || 'https://classroom.google.com',
      description: newItem.description || '',
    };

    setStream(prev => [createdItem, ...prev]);
    setShowAddModal(false);
    setNewItem({
      courseCode: enrolledCourses[0]?.code || '',
      title: '',
      category: 'assignment',
      dueDate: '2026-11-20T23:59',
      points: '25',
      description: '',
      classroomUrl: 'https://classroom.google.com',
    });
  }

  const filteredItems = stream.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesCourse = filterCourse === 'all' || item.courseCode === filterCourse;
    return matchesCategory && matchesCourse;
  });

  // Extract unique courses from stream & enrolled courses
  const uniqueCourses = Array.from(new Set([
    ...enrolledCourses.map(c => c.code),
    ...stream.map(c => c.courseCode)
  ])).filter(Boolean);

  const studentCoursesList = enrolledCourses.map(c => c.code).join(', ');

  return (
    <div className="page">
      {/* Header Banner */}
      <div className="dashboard-header" style={{ marginBottom: '22px' }}>
        <div className="dashboard-header-main">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', marginBottom: '10px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a5b4fc' }}>
              Personalized Classroom Feed • Fall 2026
            </span>
          </div>

          <h1 className="page-title" style={{ fontSize: '26px', margin: '0 0 6px' }}>
            📚 Google Classroom Stream & Coursework
          </h1>
          <p className="page-subtitle" style={{ fontSize: '13.5px' }}>
            {enrolledCourses.length > 0 
              ? `Coursework tailored for your enrolled courses: ${studentCoursesList}`
              : 'Sync and track lecture slides, assignments, lab reports and quizzes for your courses.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setShowAddModal(true)} 
            className="btn btn-primary"
            style={{ fontSize: '12.5px', padding: '8px 14px' }}
          >
            <Plus size={14} />
            <span>Add Coursework</span>
          </button>
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
            <strong>Midterm Examinations Completed:</strong> {enrolledCourses.length > 0 
              ? `Fall 2026 mid exams for ${studentCoursesList} ended last week. Now focusing on Post-Mid Lab Reports & Final Exam preparation!`
              : 'Fall 2026 mid exams ended last week. Now focusing on Post-Mid coursework & Final Exam preparations!'}
          </span>
        </div>
        <span className="badge badge-success">Midterm Cycle Closed ✓</span>
      </div>

      {/* Category Pills & Course Filter */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div className="filter-tabs" style={{ margin: 0 }}>
            {[
              { id: 'all', label: 'All Stream Items' },
              { id: 'lecture', label: '📄 Lecture Slides' },
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

          {/* Filter Course (Dynamically populated with THIS student's courses) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Course:</span>
            <select
              value={filterCourse}
              onChange={e => setFilterCourse(e.target.value)}
              style={{ width: '150px', padding: '6px 10px', fontSize: '12.5px' }}
            >
              <option value="all">All My Courses</option>
              {uniqueCourses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stream Cards or Empty State */}
      {filteredItems.length === 0 ? (
        <div className="card" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <BookOpen size={24} />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '8px' }}>
            {stream.length === 0 ? 'No Coursework Added Yet' : 'No Items Found for Selected Filter'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '480px', margin: '0 auto 20px' }}>
            {enrolledCourses.length === 0 
              ? 'You have not added any registered courses to your Advising Slip yet. Set up your advising slip to automatically generate your personalized classroom stream!'
              : 'Add your custom assignments, lecture notes, or quizzes using the button below.'}
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={15} />
              <span>Add Coursework Item</span>
            </button>
            {enrolledCourses.length === 0 && (
              <Link to="/student/advising" className="btn btn-secondary">
                <FileText size={15} />
                <span>Open Advising Slip</span>
              </Link>
            )}
          </div>
        </div>
      ) : (
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
                  padding: '18px 20px',
                  background: isMidtermPast
                    ? 'rgba(15, 21, 35, 0.5)'
                    : isCompleted
                    ? 'rgba(16, 185, 129, 0.04)'
                    : 'var(--surface-card)',
                  border: isMidtermPast
                    ? '1px solid rgba(255, 255, 255, 0.04)'
                    : isCompleted
                    ? '1px solid rgba(16, 185, 129, 0.25)'
                    : '1px solid var(--border)',
                  borderLeft: isMidtermPast
                    ? '4px solid var(--text-muted)'
                    : isCompleted
                    ? '4px solid #10b981'
                    : isLabReport
                    ? '4px solid #10b981'
                    : isQuiz
                    ? '4px solid #f59e0b'
                    : isLecture
                    ? '4px solid #06b6d4'
                    : '4px solid #6366f1',
                  opacity: isMidtermPast ? 0.75 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="badge badge-primary" style={{ fontWeight: '800' }}>
                      {item.courseCode}
                    </span>

                    {/* Category Badges */}
                    {isLecture && (
                      <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                        LECTURE
                      </span>
                    )}
                    {isLabReport && (
                      <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        LAB REPORT
                      </span>
                    )}
                    {item.category === 'assignment' && (
                      <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                        ASSIGNMENT
                      </span>
                    )}
                    {isQuiz && (
                      <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                        QUIZ
                      </span>
                    )}
                    {isExam && (
                      <span className="badge" style={{ background: isMidtermPast ? 'rgba(100, 116, 139, 0.2)' : 'rgba(239, 68, 68, 0.15)', color: isMidtermPast ? '#94a3b8' : '#f87171', border: `1px solid ${isMidtermPast ? 'rgba(100, 116, 139, 0.3)' : 'rgba(239, 68, 68, 0.3)'}` }}>
                        {isMidtermPast ? 'PAST MIDTERM' : 'FINAL EXAM'}
                      </span>
                    )}

                    {item.fileType && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        📎 {item.fileType}
                      </span>
                    )}
                    {item.points && (
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        • {item.points} Marks
                      </span>
                    )}
                  </div>

                  {/* Right side: Dates & Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isMidtermPast ? (
                      <span className="badge" style={{ background: 'rgba(100, 116, 139, 0.2)', color: '#94a3b8', fontSize: '11.5px' }}>
                        ✓ Ended Last Week
                      </span>
                    ) : item.dueDate ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        color: isCompleted ? '#34d399' : '#f59e0b',
                        background: isCompleted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: `1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`
                      }}>
                        <Clock size={12} />
                        <span>Due: {format(new Date(item.dueDate), 'MMM d, h:mm a')}</span>
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Posted: {format(new Date(item.date), 'MMM d')}
                      </span>
                    )}

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      title="Remove item"
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Content: Title & Course Name */}
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    margin: '0 0 6px',
                    color: isMidtermPast ? '#cbd5e1' : '#ffffff',
                    textDecoration: isCompleted && !isMidtermPast ? 'line-through' : 'none'
                  }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 8px' }}>
                    {item.description}
                  </p>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    📚 {item.courseName}
                  </span>
                </div>

                {/* Action Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '8px' }}>
                  <a
                    href={item.classroomUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    <span>{isLecture ? 'View Slides' : 'Open in Classroom'}</span>
                    <ExternalLink size={12} />
                  </a>

                  {!isLecture && !isMidtermPast && (
                    <button
                      onClick={() => toggleStatus(item.id)}
                      className={`btn ${isCompleted ? 'btn-secondary' : 'btn-primary'}`}
                      style={{ fontSize: '12px', padding: '6px 14px' }}
                    >
                      <CheckCircle2 size={13} />
                      <span>{isCompleted ? 'Completed ✓' : 'Mark Done'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add Custom Coursework Item */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)',
          zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '24px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#818cf8" />
                <h2 style={{ fontSize: '17px', fontWeight: '800', margin: 0 }}>Add Classroom Coursework</h2>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Enrolled Course
                </label>
                {enrolledCourses.length > 0 ? (
                  <select
                    value={newItem.courseCode}
                    onChange={e => setNewItem({ ...newItem, courseCode: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px' }}
                    required
                  >
                    {enrolledCourses.map(c => (
                      <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. CSE103 or MAT101"
                    value={newItem.courseCode}
                    onChange={e => setNewItem({ ...newItem, courseCode: e.target.value })}
                    style={{ width: '100%' }}
                    required
                  />
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Item Type
                  </label>
                  <select
                    value={newItem.category}
                    onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px' }}
                  >
                    <option value="assignment">Assignment</option>
                    <option value="lab_report">Lab Report</option>
                    <option value="quiz">Quiz</option>
                    <option value="lecture">Lecture Slide</option>
                    <option value="exam">Exam</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Points / Marks
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 25"
                    value={newItem.points}
                    onChange={e => setNewItem({ ...newItem, points: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Task Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Assignment 3: Binary Search Trees"
                  value={newItem.title}
                  onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                  style={{ width: '100%' }}
                  required
                />
              </div>

              {newItem.category !== 'lecture' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Due Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newItem.dueDate}
                    onChange={e => setNewItem({ ...newItem, dueDate: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Description / Instructions
                </label>
                <textarea
                  rows="3"
                  placeholder="Key instructions or submission requirements..."
                  value={newItem.description}
                  onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add to Classroom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
