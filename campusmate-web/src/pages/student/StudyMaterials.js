import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Download } from 'lucide-react';
import { format } from 'date-fns';

export default function StudyMaterials() {
  const [materials, setMaterials] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // Fetch study materials
      const { data: mats } = await supabase
        .from('study_materials')
        .select('*, courses(name, code), profiles(full_name)')
        .order('created_at', { ascending: false });

      // Fetch distinct courses
      const { data: crs } = await supabase
        .from('courses')
        .select('id, name, code')
        .order('code');

      setMaterials(mats || []);
      setCourses(crs || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const filteredMaterials = materials.filter(item => {
    const matchesCourse = selectedCourse === 'all' || item.course_id === selectedCourse;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.courses?.code && item.courses.code.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCourse && matchesSearch;
  });

  if (loading) return <div className="loading">Loading study materials...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">📚 Study Materials & Notes</h1>
        <p className="page-subtitle">Access lecture slides, notes, and references uploaded for your courses</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '220px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by topic, keyword, or course code..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ width: '220px' }}>
            <select
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="all">All Courses</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Materials List */}
      {filteredMaterials.length === 0 ? (
        <div className="card">
          <p className="empty-state">
            {materials.length === 0
              ? 'No study materials uploaded yet. Teachers will publish lecture slides and notes here!'
              : 'No materials match your search criteria.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredMaterials.map(item => (
            <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="badge badge-primary">{item.courses?.code || 'General'}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {format(new Date(item.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px' }}>{item.title}</h3>
                {item.description && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 12px' }}>
                    {item.description}
                  </p>
                )}
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '0 0 16px' }}>
                  Uploaded by: {item.profiles?.full_name || 'Faculty Member'}
                </p>
              </div>

              <div>
                <a
                  href={item.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-full"
                  style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                >
                  <Download size={16} />
                  <span>Download / View Resource</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
