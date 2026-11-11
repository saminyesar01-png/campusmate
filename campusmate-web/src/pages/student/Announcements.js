import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('announcements')
      .select('*, profiles(full_name, role), courses(name, code)')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setAnnouncements(data || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loading">Loading announcements...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">📢 Announcements</h1>
        <p className="page-subtitle">Campus-wide and course-specific notices</p>
      </div>

      {announcements.length === 0 ? (
        <div className="card"><p className="empty-state">No announcements yet.</p></div>
      ) : (
        <div className="announcement-feed">
          {announcements.map(ann => (
            <div key={ann.id} className={`announcement-card ${ann.is_pinned ? 'pinned' : ''}`}>
              <div className="announcement-card-header">
                <div>
                  {ann.is_pinned && <span className="badge badge-warning">📌 Pinned</span>}
                  {ann.courses && (
                    <span className="badge badge-info">{ann.courses.code}</span>
                  )}
                  {!ann.courses && (
                    <span className="badge badge-primary">Campus-wide</span>
                  )}
                </div>
                <span className="announcement-date">
                  {format(new Date(ann.created_at), 'MMM d, yyyy · h:mm a')}
                </span>
              </div>
              <h3 className="announcement-title">{ann.title}</h3>
              <p className="announcement-content">{ann.content}</p>
              <p className="announcement-author">
                — {ann.profiles?.full_name}
                {ann.profiles?.role && ` (${ann.profiles.role})`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
