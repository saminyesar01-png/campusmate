import React, { useState } from 'react';

const GRADE_POINTS = {
  'A+': 4.00, 'A': 4.00, 'A-': 3.70,
  'B+': 3.30, 'B': 3.00, 'B-': 2.70,
  'C+': 2.30, 'C': 2.00, 'C-': 1.70,
  'D+': 1.30, 'D': 1.00, 'F': 0.00,
};

const GRADE_OPTIONS = Object.keys(GRADE_POINTS);

const defaultCourse = () => ({ id: Date.now(), name: '', credit: '3', grade: 'A' });

export default function CGPACalculator() {
  const [courses, setCourses] = useState([defaultCourse()]);
  const [cgpa, setCGPA] = useState(null);

  function addCourse() {
    setCourses(c => [...c, defaultCourse()]);
  }

  function removeCourse(id) {
    setCourses(c => c.filter(course => course.id !== id));
  }

  function updateCourse(id, field, value) {
    setCourses(c => c.map(course =>
      course.id === id ? { ...course, [field]: value } : course
    ));
  }

  function calculate() {
    let totalPoints = 0;
    let totalCredits = 0;

    for (const course of courses) {
      const credit = parseFloat(course.credit);
      const point = GRADE_POINTS[course.grade];
      if (!isNaN(credit) && credit > 0 && point !== undefined) {
        totalPoints += credit * point;
        totalCredits += credit;
      }
    }

    if (totalCredits === 0) {
      setCGPA(null);
      return;
    }

    setCGPA((totalPoints / totalCredits).toFixed(2));
  }

  function reset() {
    setCourses([defaultCourse()]);
    setCGPA(null);
  }

  function getCGPALabel(gpa) {
    const g = parseFloat(gpa);
    if (g >= 3.7) return { label: 'Excellent', color: 'green' };
    if (g >= 3.0) return { label: 'Good', color: 'blue' };
    if (g >= 2.0) return { label: 'Satisfactory', color: 'orange' };
    return { label: 'Needs Improvement', color: 'red' };
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">🧮 CGPA Calculator</h1>
        <p className="page-subtitle">Calculate your semester or cumulative GPA</p>
      </div>

      <div className="card cgpa-card">
        <div className="cgpa-table-header">
          <span>Course Name (optional)</span>
          <span>Credits</span>
          <span>Grade</span>
          <span></span>
        </div>

        {courses.map((course) => (
          <div key={course.id} className="cgpa-row">
            <input
              type="text"
              value={course.name}
              onChange={e => updateCourse(course.id, 'name', e.target.value)}
              placeholder={`Course ${courses.indexOf(course) + 1}`}
              className="cgpa-input"
            />
            <select
              value={course.credit}
              onChange={e => updateCourse(course.id, 'credit', e.target.value)}
              className="cgpa-select"
            >
              {['0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={course.grade}
              onChange={e => updateCourse(course.id, 'grade', e.target.value)}
              className="cgpa-select"
            >
              {GRADE_OPTIONS.map(g => (
                <option key={g} value={g}>{g} ({GRADE_POINTS[g].toFixed(2)})</option>
              ))}
            </select>
            <button
              onClick={() => removeCourse(course.id)}
              className="btn-icon btn-danger"
              disabled={courses.length === 1}
              title="Remove"
            >✕</button>
          </div>
        ))}

        <div className="cgpa-actions">
          <button onClick={addCourse} className="btn btn-secondary">
            + Add Course
          </button>
          <div className="cgpa-action-right">
            <button onClick={reset} className="btn btn-ghost">Reset</button>
            <button onClick={calculate} className="btn btn-primary">Calculate CGPA</button>
          </div>
        </div>

        {cgpa !== null && (() => {
          const { label, color } = getCGPALabel(cgpa);
          return (
            <div className={`cgpa-result cgpa-result-${color}`}>
              <p className="cgpa-result-label">Your CGPA</p>
              <p className="cgpa-result-value">{cgpa} / 4.00</p>
              <p className="cgpa-result-status">{label}</p>
            </div>
          );
        })()}

        <div className="cgpa-reference">
          <h3>Grade Point Reference</h3>
          <div className="grade-reference-grid">
            {GRADE_OPTIONS.map(g => (
              <div key={g} className="grade-ref-item">
                <span className="grade-letter">{g}</span>
                <span className="grade-point">{GRADE_POINTS[g].toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
