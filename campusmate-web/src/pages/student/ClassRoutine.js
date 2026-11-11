import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { MapPin, Clock, Calendar, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
const today = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];

// Samin's default advising slip courses
const DEFAULT_SLIP_COURSES = [
  {
    code: 'CSE246',
    name: 'Algorithms',
    section: '7',
    credits: '4.5',
    sessions: [
      { type: 'Theory', daysExpanded: ['Sunday', 'Thursday'], time: '4:50PM - 6:20PM', room: 'FUB-303' },
      { type: 'Lab', daysExpanded: ['Monday'], time: '4:50PM - 7:50PM', room: '435 (General Purpose Programming Lab)' },
    ]
  },
  {
    code: 'CSE251',
    name: 'Electronic Devices & Circuits',
    section: '5',
    credits: '4.0',
    sessions: [
      { type: 'Theory', daysExpanded: ['Sunday', 'Thursday'], time: '8:30AM - 10:00AM', room: 'AB1-601' },
      { type: 'Lab', daysExpanded: ['Tuesday'], time: '8:00AM - 10:00AM', room: '548 (Electrical Circuit Lab)' },
    ]
  },
  {
    code: 'POP7203',
    name: 'Population & Development',
    section: '1',
    credits: '3.0',
    sessions: [
      { type: 'Class', daysExpanded: ['Sunday', 'Thursday'], time: '11:50AM - 1:20PM', room: '550 (Lecture Gallery)' },
    ]
  }
];

export default function ClassRoutine() {
  const [schedule, setSchedule] = useState({});
  const [activeDay, setActiveDay] = useState(DAYS.includes(today) ? today : 'Sunday');

  useEffect(() => {
    // Read from advising slip storage or fallback to default
    const saved = localStorage.getItem('ewu_advising_courses_v2');
    const courses = saved ? JSON.parse(saved) : DEFAULT_SLIP_COURSES;

    const grouped = {};
    DAYS.forEach(d => { grouped[d] = []; });

    courses.forEach(c => {
      c.sessions?.forEach(s => {
        s.daysExpanded?.forEach(day => {
          if (grouped[day]) {
            grouped[day].push({
              code: c.code,
              name: c.name,
              section: c.section,
              credits: c.credits,
              type: s.type,
              time: s.time,
              room: s.room,
            });
          }
        });
      });
    });

    // Sort by time
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => {
        const getMinutes = (str) => {
          const match = str.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (!match) return 0;
          let h = parseInt(match[1]);
          const m = parseInt(match[2]);
          const ampm = match[3].toUpperCase();
          if (ampm === 'PM' && h !== 12) h += 12;
          if (ampm === 'AM' && h === 12) h = 0;
          return h * 60 + m;
        };
        return getMinutes(a.time) - getMinutes(b.time);
      });
    });

    setSchedule(grouped);
  }, []);

  return (
    <div className="page">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">📅 Class Routine (EWU Schedule)</h1>
          <p className="page-subtitle">Generated automatically from your East West University Advising Slip</p>
        </div>
        <Link to="/student/advising" className="btn btn-secondary" style={{ fontSize: '13px' }}>
          Edit Advising Courses →
        </Link>
      </div>

      {/* Day Tabs */}
      <div className="day-tabs">
        {DAYS.map(day => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`day-tab ${activeDay === day ? 'active' : ''} ${day === today ? 'today' : ''}`}
          >
            {day}
            {day === today && <span className="today-dot">•</span>}
          </button>
        ))}
      </div>

      {/* Classes for Active Day */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title" style={{ margin: 0 }}>
            {activeDay} {activeDay === today && <span className="badge badge-primary">Today</span>}
          </h2>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            {schedule[activeDay]?.length || 0} sessions
          </span>
        </div>

        {!schedule[activeDay] || schedule[activeDay].length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 0' }}>
            <p className="empty-state" style={{ margin: '0 0 6px' }}>No classes on {activeDay}! 🎉</p>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Enjoy your free time.</span>
          </div>
        ) : (
          <div className="schedule-list">
            {schedule[activeDay].map((cls, idx) => (
              <div
                key={idx}
                className="schedule-item"
                style={{
                  borderLeftColor: cls.type === 'Lab' ? '#10b981' : '#6366f1',
                  background: cls.type === 'Lab' ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.08), var(--surface-card) 40%)' : 'var(--surface-card)'
                }}
              >
                <div className="schedule-time" style={{ minWidth: '130px', alignItems: 'flex-start', textAlign: 'left' }}>
                  <span style={{ color: cls.type === 'Lab' ? '#34d399' : '#818cf8', fontSize: '13px' }}>
                    {cls.time}
                  </span>
                  <span className={`badge ${cls.type === 'Lab' ? 'badge-success' : 'badge-primary'}`} style={{ marginTop: '4px', fontSize: '10px' }}>
                    {cls.type}
                  </span>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <p className="schedule-course" style={{ margin: 0 }}>{cls.code}</p>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', fontSize: '11px' }}>
                      Sec {cls.section}
                    </span>
                  </div>
                  <p className="schedule-meta" style={{ marginTop: '2px' }}>
                    {cls.name} • {cls.credits} Credits
                  </p>
                </div>

                <div style={{ textAlign: 'right', minWidth: '180px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                    <MapPin size={15} color={cls.type === 'Lab' ? '#34d399' : '#818cf8'} />
                    <span style={{ fontWeight: '700', fontSize: '13.5px', color: '#f1f5f9' }}>
                      {cls.room}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
