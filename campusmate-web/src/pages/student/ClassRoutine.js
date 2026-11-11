import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const today = DAYS[new Date().getDay()];

export default function ClassRoutine() {
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(today);

  useEffect(() => {
    async function fetchSchedule() {
      const { data } = await supabase
        .from('class_schedule')
        .select('*, courses(name, code, teacher_id, profiles!courses_teacher_id_fkey(full_name))')
        .order('start_time');

      // Group by day
      const grouped = {};
      DAYS.forEach(d => { grouped[d] = []; });
      (data || []).forEach(item => {
        if (grouped[item.day_of_week]) {
          grouped[item.day_of_week].push(item);
        }
      });
      setSchedule(grouped);
      setLoading(false);
    }
    fetchSchedule();
  }, []);

  if (loading) return <div className="loading">Loading routine...</div>;

  const workdays = DAYS.filter(d => d !== 'Friday'); // typical BD university schedule

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">📅 Class Routine</h1>
        <p className="page-subtitle">Your weekly class schedule</p>
      </div>

      {/* Day Tabs */}
      <div className="day-tabs">
        {workdays.map(day => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`day-tab ${activeDay === day ? 'active' : ''} ${day === today ? 'today' : ''}`}
          >
            {day.slice(0, 3)}
            {day === today && <span className="today-dot">•</span>}
          </button>
        ))}
      </div>

      {/* Classes for Active Day */}
      <div className="card">
        <h2 className="card-title">
          {activeDay} {activeDay === today && <span className="badge badge-primary">Today</span>}
        </h2>

        {schedule[activeDay]?.length === 0 ? (
          <p className="empty-state">No classes on {activeDay}. 🎉</p>
        ) : (
          <div className="schedule-list">
            {schedule[activeDay]?.map(cls => (
              <div key={cls.id} className="schedule-item">
                <div className="schedule-time">
                  <span>{cls.start_time?.slice(0, 5)}</span>
                  <span className="time-separator">|</span>
                  <span>{cls.end_time?.slice(0, 5)}</span>
                </div>
                <div className="schedule-info">
                  <p className="schedule-course">{cls.courses?.name}</p>
                  <p className="schedule-meta">
                    {cls.courses?.code}
                    {cls.room && ` · Room ${cls.room}`}
                    {cls.courses?.profiles?.full_name && ` · ${cls.courses.profiles.full_name}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
