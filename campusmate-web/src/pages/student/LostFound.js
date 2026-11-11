import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { 
  Search, Plus, Image as ImageIcon, X, MapPin, 
  Phone, CheckCircle2, Trash2, Tag, AlertCircle, RefreshCw
} from 'lucide-react';

export default function LostFound() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'lost', 'found'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);
  const fileInputRef = useRef(null);

  // Form state
  const [form, setForm] = useState({
    type: 'lost',
    item_name: '',
    description: '',
    location: '',
    contact: '',
    image_url: '',
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data?.user || null);
    });
  }, []);

  async function fetchItems() {
    setLoading(true);
    let query = supabase
      .from('lost_found')
      .select('*, profiles(full_name, student_id, role)')
      .eq('is_resolved', false)
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('type', filter);
    }

    const { data, error } = await query;
    if (!error) {
      setItems(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line
  }, [filter]);

  // Handle image upload with canvas auto-compression (~30-60KB JPEG)
  function handleImageSelect(e) {
    setImageError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize image to max 800px width/height for fast loading & efficient storage
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // High quality compressed base64 JPEG
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.72);
        setImagePreview(compressedBase64);
        setForm(prev => ({ ...prev, image_url: compressedBase64 }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveImage() {
    setImagePreview(null);
    setForm(prev => ({ ...prev, image_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.item_name.trim()) return;

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();

    // Append contact info to description if provided
    let finalDesc = form.description || '';
    if (form.contact.trim()) {
      finalDesc = `${finalDesc}\n\n📞 Contact: ${form.contact.trim()}`.trim();
    }

    const payload = {
      type: form.type,
      item_name: form.item_name.trim(),
      description: finalDesc,
      location: form.location.trim() || 'EWU Campus',
      reporter_id: user?.id || null,
      image_url: form.image_url || null,
    };

    const { error } = await supabase.from('lost_found').insert(payload);

    if (!error) {
      setForm({ type: 'lost', item_name: '', description: '', location: '', contact: '', image_url: '' });
      setImagePreview(null);
      setShowForm(false);
      fetchItems();
    } else {
      alert('Error posting item: ' + error.message);
    }
    setSubmitting(false);
  }

  async function handleResolve(id) {
    if (window.confirm('Mark this item as resolved / returned to owner?')) {
      await supabase.from('lost_found').update({ is_resolved: true }).eq('id', id);
      fetchItems();
    }
  }

  async function handleDelete(id) {
    if (window.confirm('Delete this post?')) {
      await supabase.from('lost_found').delete().eq('id', id);
      fetchItems();
    }
  }

  // Filter items by search query
  const filteredItems = items.filter(item => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      item.item_name?.toLowerCase().includes(query) ||
      item.location?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="page">
      {/* Header Banner */}
      <div className="dashboard-header" style={{ marginBottom: '22px' }}>
        <div className="dashboard-header-main">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', marginBottom: '10px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a5b4fc' }}>
              Campus-Wide Community Board
            </span>
          </div>

          <h1 className="page-title" style={{ fontSize: '26px', margin: '0 0 6px' }}>
            🔍 Campus Lost & Found
          </h1>
          <p className="page-subtitle" style={{ fontSize: '13.5px' }}>
            Public campus board — anyone can post with photos, and all students and faculty can view & help reunite lost items!
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowForm(!showForm)}
            style={{ fontSize: '13px', padding: '8px 16px' }}
          >
            <Plus size={15} />
            <span>{showForm ? 'Close Form' : 'Post Item with Photo'}</span>
          </button>
          <button
            onClick={fetchItems}
            className="btn btn-secondary"
            title="Refresh Feed"
            style={{ padding: '8px 12px' }}
          >
            <RefreshCw size={14} className={loading ? 'spinner' : ''} />
          </button>
        </div>
      </div>

      {/* Post Modal / Form Card */}
      {showForm && (
        <div className="card" style={{ marginBottom: '24px', padding: '24px', border: '1px solid rgba(99, 102, 241, 0.3)', background: 'linear-gradient(135deg, rgba(23, 32, 51, 0.95), rgba(17, 24, 39, 0.98))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#ffffff' }}>
              📢 Post a Lost or Found Item
            </h2>
            <button onClick={() => setShowForm(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Type selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Category *
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: 'lost' }))}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '10px',
                      background: form.type === 'lost' ? 'rgba(239, 68, 68, 0.18)' : 'var(--surface-input)',
                      border: form.type === 'lost' ? '2px solid #ef4444' : '1px solid var(--border)',
                      color: form.type === 'lost' ? '#f87171' : 'var(--text-secondary)',
                      fontWeight: '700', fontSize: '13px', cursor: 'pointer'
                    }}
                  >
                    😢 I Lost Something
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: 'found' }))}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '10px',
                      background: form.type === 'found' ? 'rgba(16, 185, 129, 0.18)' : 'var(--surface-input)',
                      border: form.type === 'found' ? '2px solid #10b981' : '1px solid var(--border)',
                      color: form.type === 'found' ? '#34d399' : 'var(--text-secondary)',
                      fontWeight: '700', fontSize: '13px', cursor: 'pointer'
                    }}
                  >
                    🙌 I Found Something
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Item Name *
                </label>
                <input
                  value={form.item_name}
                  onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))}
                  placeholder="e.g. Casio fx-991EX Calculator / Black Wallet"
                  style={{ width: '100%' }}
                  required
                />
              </div>
            </div>

            {/* Location & Contact */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Campus Location
                </label>
                <input
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Room 435 / Library 2nd Floor / Cafeteria"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Contact (Phone / WhatsApp / Email)
                </label>
                <input
                  value={form.contact}
                  onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
                  placeholder="e.g. 017xxxxxxxx or student@ewubd.edu"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Photo Upload with Live Preview */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Item Photo (Upload or Take Photo) 📷
              </label>

              {imagePreview ? (
                <div style={{ position: 'relative', display: 'inline-block', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{ maxHeight: '220px', maxWidth: '100%', objectFit: 'contain', display: 'block', background: '#000' }}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    style={{
                      position: 'absolute', top: '8px', right: '8px',
                      background: 'rgba(239, 68, 68, 0.85)', color: '#fff',
                      border: 'none', borderRadius: '50%', width: '28px', height: '28px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    title="Remove Photo"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '24px 16px', textAlign: 'center',
                    background: 'var(--surface-input)', border: '2px dashed rgba(99, 102, 241, 0.35)',
                    borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease'
                  }}
                >
                  <ImageIcon size={28} color="#818cf8" style={{ margin: '0 auto 8px' }} />
                  <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>
                    Click or tap to upload photo
                  </p>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Take picture with camera or pick from gallery (PNG, JPG, WebP)
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                  />
                </div>
              )}
              {imageError && <p style={{ color: '#ef4444', fontSize: '11px', margin: '4px 0 0' }}>{imageError}</p>}
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Description & Distinguishing Features
              </label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Details like color, brand, stickers, serial number, or where it was handed over..."
                rows={3}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Publishing Post...' : 'Post to Campus Board 🚀'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="card" style={{ marginBottom: '22px', padding: '14px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          {/* Filter Pills */}
          <div className="filter-tabs" style={{ margin: 0 }}>
            {[
              { id: 'all', label: 'All Items' },
              { id: 'lost', label: '😢 Lost Items' },
              { id: 'found', label: '🙌 Found Items' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`filter-tab ${filter === f.id ? 'active' : ''}`}
                style={{ fontSize: '12.5px' }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '220px', flex: '1 1 260px', maxWidth: '380px' }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by item name, room, or details..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '7px 12px', fontSize: '12.5px' }}
            />
          </div>
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="loading" style={{ color: 'var(--text-secondary)' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          Loading campus lost & found posts...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Tag size={24} />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '8px' }}>
            {searchQuery ? 'No matching items found' : `No ${filter !== 'all' ? filter : ''} items posted yet`}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '440px', margin: '0 auto 20px' }}>
            {searchQuery 
              ? 'Try adjusting your search keywords.' 
              : 'Be the first to post if you lost or found something around East West University campus!'}
          </p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={15} />
            <span>Post an Item Now</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredItems.map(item => {
            const isLost = item.type === 'lost';
            const isAuthor = currentUser?.id && item.reporter_id === currentUser.id;

            return (
              <div
                key={item.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  padding: 0,
                  border: isLost ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                  borderTop: `4px solid ${isLost ? '#ef4444' : '#10b981'}`
                }}
              >
                {/* Photo Thumbnail (if photo attached) */}
                {item.image_url && (
                  <div 
                    onClick={() => setZoomImage(item.image_url)}
                    style={{ position: 'relative', width: '100%', height: '200px', background: '#090d16', cursor: 'zoom-in', overflow: 'hidden' }}
                  >
                    <img
                      src={item.image_url}
                      alt={item.item_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                    />
                    <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0, 0, 0, 0.7)', color: '#fff', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backdropFilter: 'blur(4px)' }}>
                      🔍 Tap to Zoom
                    </div>
                  </div>
                )}

                {/* Card Body */}
                <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    {/* Badge & Date */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span className={`badge ${isLost ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '11.5px', fontWeight: '700', padding: '4px 10px' }}>
                        {isLost ? '😢 LOST ITEM' : '🙌 FOUND ITEM'}
                      </span>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        {format(new Date(item.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 style={{ fontSize: '17px', fontWeight: '800', margin: '0 0 8px', color: '#ffffff' }}>
                      {item.item_name}
                    </h3>

                    {/* Location */}
                    {item.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#818cf8', fontSize: '12.5px' }}>
                        <MapPin size={14} flexShrink={0} />
                        <span style={{ fontWeight: '600' }}>{item.location}</span>
                      </div>
                    )}

                    {/* Description */}
                    {item.description && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 12px', whiteSpace: 'pre-line', lineHeight: '1.5' }}>
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Card Footer: Poster & Author Actions */}
                  <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      Posted by: <strong style={{ color: '#cbd5e1' }}>{item.profiles?.full_name || 'Campus Student'}</strong>
                    </div>

                    {isAuthor && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleResolve(item.id)}
                          className="btn btn-secondary"
                          style={{ fontSize: '11.5px', padding: '4px 10px', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                          title="Mark as returned / claimed"
                        >
                          <CheckCircle2 size={13} />
                          <span>Resolved</span>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="btn btn-secondary"
                          style={{ fontSize: '11.5px', padding: '4px 8px', color: '#f87171' }}
                          title="Delete Post"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox / Zoom Modal */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.88)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px', backdropFilter: 'blur(8px)', cursor: 'zoom-out'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img
              src={zoomImage}
              alt="Zoomed"
              style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}
            />
            <button
              onClick={() => setZoomImage(null)}
              style={{
                position: 'absolute', top: '-14px', right: '-14px',
                background: '#ffffff', color: '#000', border: 'none',
                borderRadius: '50%', width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontWeight: '800'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
