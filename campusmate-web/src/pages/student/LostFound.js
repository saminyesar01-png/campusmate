import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

export default function LostFound() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'lost', 'found'
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'lost', item_name: '', description: '', location: '' });
  const [submitting, setSubmitting] = useState(false);
  const { user } = { user: null }; // will use from context in real app

  async function fetchItems() {
    let query = supabase
      .from('lost_found')
      .select('*, profiles(full_name)')
      .eq('is_resolved', false)
      .order('created_at', { ascending: false });

    if (filter !== 'all') query = query.eq('type', filter);
    const { data } = await query;
    setItems(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line
  }, [filter]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('lost_found').insert({
      ...form,
      reporter_id: user.id,
    });
    setForm({ type: 'lost', item_name: '', description: '', location: '' });
    setShowForm(false);
    setSubmitting(false);
    fetchItems();
  }

  return (
    <div className="page">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">🔍 Lost & Found</h1>
          <p className="page-subtitle">Help your campus community find missing items</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Post Item'}
        </button>
      </div>

      {/* Post Form */}
      {showForm && (
        <div className="card form-card">
          <h2 className="card-title">Post a Lost or Found Item</h2>
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label>Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="lost">I Lost Something</option>
                  <option value="found">I Found Something</option>
                </select>
              </div>
              <div className="form-group">
                <label>Item Name</label>
                <input
                  value={form.item_name}
                  onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))}
                  placeholder="e.g. Blue water bottle"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="e.g. AB Building cafeteria"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Any identifying details..."
                rows={3}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Posting...' : 'Post'}
            </button>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {['all', 'lost', 'found'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`filter-tab ${filter === f ? 'active' : ''}`}
          >
            {f === 'all' ? 'All Items' : f === 'lost' ? '😢 Lost' : '🙌 Found'}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="loading">Loading items...</div>
      ) : items.length === 0 ? (
        <div className="card"><p className="empty-state">No {filter !== 'all' ? filter : ''} items posted.</p></div>
      ) : (
        <div className="lost-found-grid">
          {items.map(item => (
            <div key={item.id} className={`lf-card lf-${item.type}`}>
              <div className="lf-badge">{item.type === 'lost' ? '😢 Lost' : '🙌 Found'}</div>
              <h3 className="lf-name">{item.item_name}</h3>
              {item.location && <p className="lf-location">📍 {item.location}</p>}
              {item.description && <p className="lf-desc">{item.description}</p>}
              <p className="lf-meta">
                Posted by {item.profiles?.full_name} · {format(new Date(item.created_at), 'MMM d')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
