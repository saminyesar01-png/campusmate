import React, { useState, useEffect } from 'react';
import { Calculator, Target, RefreshCw, Plus, Trash2, Award, Info, CheckCircle2 } from 'lucide-react';

// Official East West University (EWU) Grading Scale
export const EWU_GRADES = {
  'A+': { point: 4.00, range: '80% and above', remark: 'Outstanding' },
  'A':  { point: 3.75, range: '75% to < 80%',  remark: 'Excellent' },
  'A-': { point: 3.50, range: '70% to < 75%',  remark: 'Very Good' },
  'B+': { point: 3.25, range: '65% to < 70%',  remark: 'Good' },
  'B':  { point: 3.00, range: '60% to < 65%',  remark: 'Satisfactory' },
  'B-': { point: 2.75, range: '55% to < 60%',  remark: 'Above Average' },
  'C+': { point: 2.50, range: '50% to < 55%',  remark: 'Average' },
  'C':  { point: 2.25, range: '45% to < 50%',  remark: 'Below Average' },
  'D':  { point: 2.00, range: '40% to < 45%',  remark: 'Passing' },
  'F':  { point: 0.00, range: 'Less than 40%', remark: 'Failing' },
};

const GRADE_LIST = Object.keys(EWU_GRADES);

const createEmptyCourse = () => ({
  id: Date.now() + Math.random(),
  name: '',
  credits: '3',
  grade: 'A+',
  isRetake: false,
  previousGrade: 'F',
});

export default function CGPACalculator() {
  const [activeTab, setActiveTab] = useState('calculator'); // 'calculator' | 'target' | 'scale'

  // Calculator State
  const [prevCGPA, setPrevCGPA] = useState('');
  const [prevCredits, setPrevCredits] = useState('');
  const [courses, setCourses] = useState(() => {
    const saved = localStorage.getItem('ewu_courses');
    return saved ? JSON.parse(saved) : [createEmptyCourse(), createEmptyCourse(), createEmptyCourse()];
  });

  // Target Planner State
  const [targetCGPA, setTargetCGPA] = useState('');
  const [targetRemainingCredits, setTargetRemainingCredits] = useState('15');

  // Calculation Results
  const [result, setResult] = useState(null);
  const [targetResult, setTargetResult] = useState(null);

  useEffect(() => {
    localStorage.setItem('ewu_courses', JSON.stringify(courses));
  }, [courses]);

  // Handle Course row updates
  function addCourse() {
    setCourses(c => [...c, createEmptyCourse()]);
  }

  function removeCourse(id) {
    if (courses.length > 1) {
      setCourses(c => c.filter(item => item.id !== id));
    }
  }

  function updateCourse(id, field, value) {
    setCourses(c =>
      c.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  }

  // EWU CGPA & Retake Calculation Logic
  function calculateCGPA() {
    let termQualityPoints = 0;
    let termCredits = 0;

    let retakeDeductionPoints = 0;
    let retakeCreditAdjustment = 0;

    for (const c of courses) {
      const cr = parseFloat(c.credits) || 0;
      const pt = EWU_GRADES[c.grade]?.point ?? 0;

      termQualityPoints += cr * pt;
      termCredits += cr;

      // In EWU Retake Policy:
      // The new grade replaces the previous attempt in cumulative CGPA calculation.
      if (c.isRetake) {
        const oldPt = EWU_GRADES[c.previousGrade]?.point ?? 0;
        retakeDeductionPoints += cr * oldPt;
        // If the previous attempt was not F, those credits were already counted in prevCredits
        if (c.previousGrade !== 'F') {
          retakeCreditAdjustment += cr;
        }
      }
    }

    const termGPA = termCredits > 0 ? (termQualityPoints / termCredits).toFixed(2) : '0.00';

    const pCG = parseFloat(prevCGPA);
    const pCr = parseFloat(prevCredits);

    let cumulativeCGPA = null;
    let totalCreditsEarned = termCredits;

    if (!isNaN(pCG) && !isNaN(pCr) && pCr > 0) {
      const prevTotalPoints = pCG * pCr;
      const totalPoints = prevTotalPoints - retakeDeductionPoints + termQualityPoints;
      const totalEarnedCr = pCr + termCredits - retakeCreditAdjustment;
      totalCreditsEarned = totalEarnedCr;
      cumulativeCGPA = totalEarnedCr > 0 ? (totalPoints / totalEarnedCr).toFixed(2) : termGPA;
    }

    setResult({
      termGPA,
      termCredits,
      cumulativeCGPA,
      totalCredits: totalCreditsEarned,
    });
  }

  // Target Planner Calculation
  function calculateTarget() {
    const currentCG = parseFloat(prevCGPA);
    const currentCr = parseFloat(prevCredits);
    const target = parseFloat(targetCGPA);
    const remainingCr = parseFloat(targetRemainingCredits);

    if (isNaN(currentCG) || isNaN(currentCr) || isNaN(target) || isNaN(remainingCr) || remainingCr <= 0) {
      setTargetResult({ error: 'Please enter valid numbers for Current CGPA, Credits Completed, Target CGPA, and Credits to Take.' });
      return;
    }

    const totalTargetCredits = currentCr + remainingCr;
    const requiredTotalPoints = target * totalTargetCredits;
    const currentPoints = currentCG * currentCr;
    const neededPoints = requiredTotalPoints - currentPoints;
    const neededGPA = neededPoints / remainingCr;

    setTargetResult({
      neededGPA: neededGPA.toFixed(2),
      isPossible: neededGPA <= 4.00,
      remainingCr,
      target,
    });
  }

  function resetAll() {
    setPrevCGPA('');
    setPrevCredits('');
    setCourses([createEmptyCourse(), createEmptyCourse(), createEmptyCourse()]);
    setResult(null);
    setTargetResult(null);
  }

  return (
    <div className="page">
      <div className="page-header-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="page-title">EWU CGPA Calculator & Planner</h1>
            <span className="badge badge-primary">Official EWU Scale</span>
          </div>
          <p className="page-subtitle">
            Calculated precisely according to East West University grading policy & retake rules
          </p>
        </div>
        <button onClick={resetAll} className="btn btn-secondary">
          <RefreshCw size={14} /> Reset
        </button>
      </div>

      {/* Tabs */}
      <div className="filter-tabs" style={{ marginBottom: '20px' }}>
        <button
          className={`filter-tab ${activeTab === 'calculator' ? 'active' : ''}`}
          onClick={() => setActiveTab('calculator')}
        >
          <Calculator size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
          Semester & CGPA Calculator
        </button>
        <button
          className={`filter-tab ${activeTab === 'target' ? 'active' : ''}`}
          onClick={() => setActiveTab('target')}
        >
          <Target size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
          Target CGPA Planner
        </button>
        <button
          className={`filter-tab ${activeTab === 'scale' ? 'active' : ''}`}
          onClick={() => setActiveTab('scale')}
        >
          <Award size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
          EWU Grading Chart
        </button>
      </div>

      {/* TAB 1: CALCULATOR */}
      {activeTab === 'calculator' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          {/* Previous CGPA Card */}
          <div className="card">
            <h2 className="card-title">1. Previous Academic History (Optional)</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 16px' }}>
              Leave blank if calculating Semester GPA only (e.g. for 1st semester students)
            </p>
            <div className="form-row">
              <div className="form-group">
                <label>Previous Cumulative CGPA</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4.00"
                  placeholder="e.g. 3.45"
                  value={prevCGPA}
                  onChange={e => setPrevCGPA(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Total Credits Completed So Far</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="e.g. 45"
                  value={prevCredits}
                  onChange={e => setPrevCredits(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Current Semester Courses */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="card-title" style={{ margin: 0 }}>2. Current Semester Courses</h2>
              <button onClick={addCourse} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12.5px' }}>
                <Plus size={14} /> Add Course
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {courses.map((c, index) => (
                <div
                  key={c.id}
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 40px', gap: '12px', alignItems: 'center' }}>
                    <div>
                      <input
                        type="text"
                        placeholder={`Course ${index + 1} (e.g. CSE106)`}
                        value={c.name}
                        onChange={e => updateCourse(c.id, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <select
                        value={c.credits}
                        onChange={e => updateCourse(c.id, 'credits', e.target.value)}
                      >
                        {['1.0', '1.5', '2.0', '3.0', '4.0'].map(cr => (
                          <option key={cr} value={cr}>{cr} Credits</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <select
                        value={c.grade}
                        onChange={e => updateCourse(c.id, 'grade', e.target.value)}
                      >
                        {GRADE_LIST.map(g => (
                          <option key={g} value={g}>{g} ({EWU_GRADES[g].point.toFixed(2)})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <button
                        onClick={() => removeCourse(c.id)}
                        className="btn-icon btn-danger"
                        disabled={courses.length === 1}
                        title="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Retake Option */}
                  <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed var(--border)', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={c.isRetake}
                        onChange={e => updateCourse(c.id, 'isRetake', e.target.checked)}
                        style={{ width: 'auto' }}
                      />
                      <span>Is this a Retake course?</span>
                    </label>

                    {c.isRetake && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Previous Attempt Grade:</span>
                        <select
                          value={c.previousGrade}
                          onChange={e => updateCourse(c.id, 'previousGrade', e.target.value)}
                          style={{ width: '130px', padding: '4px 8px', fontSize: '12px' }}
                        >
                          {GRADE_LIST.map(g => (
                            <option key={g} value={g}>{g} ({EWU_GRADES[g].point.toFixed(2)})</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={calculateCGPA} className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '14px' }}>
                Calculate EWU CGPA
              </button>
            </div>
          </div>

          {/* Results Display */}
          {result && (
            <div className="card" style={{ background: '#f8fafc', border: '2px solid var(--primary)' }}>
              <h2 className="card-title" style={{ color: 'var(--primary)', marginBottom: '16px' }}>
                🎓 Calculation Results
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div className="stat-card stat-blue">
                  <div>
                    <p className="stat-value">{result.termGPA}</p>
                    <p className="stat-label">Semester GPA ({result.termCredits} Credits)</p>
                  </div>
                </div>

                {result.cumulativeCGPA !== null && (
                  <div className="stat-card stat-green">
                    <div>
                      <p className="stat-value">{result.cumulativeCGPA}</p>
                      <p className="stat-label">Cumulative CGPA ({result.totalCredits} Total Credits)</p>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '16px', fontSize: '12.5px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} color="var(--success)" />
                <span>
                  Retake grades have been replaced in accordance with East West University Academic Regulations.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TARGET PLANNER */}
      {activeTab === 'target' && (
        <div className="card">
          <h2 className="card-title">🎯 Target CGPA Goal Planner</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: '0 0 20px' }}>
            Find out what GPA you must maintain in your upcoming semesters to hit your graduation CGPA goal.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label>Current Cumulative CGPA</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 3.20"
                value={prevCGPA}
                onChange={e => setPrevCGPA(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Credits Completed So Far</label>
              <input
                type="number"
                step="0.5"
                placeholder="e.g. 60"
                value={prevCredits}
                onChange={e => setPrevCredits(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Target CGPA You Want</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 3.50"
                value={targetCGPA}
                onChange={e => setTargetCGPA(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Credits You Plan to Take</label>
              <input
                type="number"
                step="0.5"
                placeholder="e.g. 15 (next term) or 60 (remaining)"
                value={targetRemainingCredits}
                onChange={e => setTargetRemainingCredits(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <button onClick={calculateTarget} className="btn btn-primary">
              Calculate Required GPA
            </button>
          </div>

          {targetResult && (
            <div style={{ marginTop: '24px' }}>
              {targetResult.error ? (
                <div className="alert alert-error">{targetResult.error}</div>
              ) : targetResult.isPossible ? (
                <div className="cgpa-result cgpa-result-green">
                  <p className="cgpa-result-label">Required Average GPA</p>
                  <p className="cgpa-result-value">{targetResult.neededGPA}</p>
                  <p className="cgpa-result-status">
                    You need to maintain an average of <strong>{targetResult.neededGPA}</strong> over your next <strong>{targetResult.remainingCr} credits</strong> to reach a <strong>{targetResult.target}</strong> CGPA!
                  </p>
                </div>
              ) : (
                <div className="cgpa-result cgpa-result-red">
                  <p className="cgpa-result-label">Required GPA</p>
                  <p className="cgpa-result-value">{targetResult.neededGPA}</p>
                  <p className="cgpa-result-status">
                    Mathematically unreachable (exceeds EWU maximum 4.00). Try increasing the remaining credits or adjusting the target.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EWU OFFICIAL GRADING SCALE */}
      {activeTab === 'scale' && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Info size={18} color="var(--primary)" />
            <h2 className="card-title" style={{ margin: 0 }}>East West University Official Grading Scale</h2>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Letter Grade</th>
                <th>Grade Point</th>
                <th>Numerical Marks</th>
                <th>Assessment Meaning</th>
              </tr>
            </thead>
            <tbody>
              {GRADE_LIST.map(g => (
                <tr key={g}>
                  <td><strong>{g}</strong></td>
                  <td><span className="badge badge-primary">{EWU_GRADES[g].point.toFixed(2)}</span></td>
                  <td>{EWU_GRADES[g].range}</td>
                  <td>{EWU_GRADES[g].remark}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
