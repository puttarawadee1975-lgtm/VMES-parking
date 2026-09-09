import React, { useState, useEffect } from 'react';

export default function AnnouncementsTable() {
  const [announcements, setAnnouncements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null for new, object for edit
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null); // item to delete
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('normal'); // 'normal' | 'high'
  const [targetAudience, setTargetAudience] = useState('all'); // 'all' | 'individual' | 'staff'
  const [targetUser, setTargetUser] = useState(''); // email/student_id for individual
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('http://localhost:8000/admin/announcements');
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch (e) {
      console.warn('Error fetching announcements:', e);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setTitle('');
    setContent('');
    setPriority('normal');
    setTargetAudience('all');
    setTargetUser('');
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setTitle(item.title);
    setContent(item.content);
    setPriority(item.priority || 'normal');
    setTargetAudience(item.target_audience || 'all');
    setTargetUser(item.target_user || '');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      if (editingItem) {
        // Edit existing announcement
        await fetch(`http://localhost:8000/admin/announcements/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            content: content.trim(),
            priority: priority,
            target_audience: targetAudience,
            target_user: targetAudience.startsWith('individual') ? targetUser.trim() : ''
          })
        });
      } else {
        // Post new announcement
        await fetch('http://localhost:8000/admin/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            content: content.trim(),
            priority: priority,
            target_audience: targetAudience,
            target_user: targetAudience.startsWith('individual') ? targetUser.trim() : ''
          })
        });
      }
      setShowModal(false);
      setTitle('');
      setContent('');
      setPriority('normal');
      setTargetAudience('all');
      setTargetUser('');
      setEditingItem(null);
      fetchAnnouncements();
    } catch (err) {
      alert('Error saving announcement: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem) return;
    setDeleting(true);
    try {
      await fetch(`http://localhost:8000/admin/announcements/${deleteConfirmItem.id}`, {
        method: 'DELETE'
      });
      setDeleteConfirmItem(null);
      fetchAnnouncements();
    } catch (err) {
      alert('Error deleting announcement: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-title">
          <i className="ri-megaphone-line" style={{ color: '#d97706' }}></i>
          <span>Official Campus Announcements & Student Notices</span>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <i className="ri-add-line"></i> Post New Announcement
        </button>
      </div>

      <div className="table-container">
        {(!announcements || announcements.length === 0) ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
            <i className="ri-megaphone-off-line" style={{ fontSize: 36, color: '#d97706', display: 'block', marginBottom: 12 }}></i>
            <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>No Announcements Posted</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Post announcements to display them on students' Mobile App home screens.</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Notice ID</th>
                <th>Title & Topic</th>
                <th>Announcement Content</th>
                <th>Target Audience</th>
                <th>Date Posted</th>
                <th>Priority</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {announcements.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>{item.id}</td>
                  <td style={{ fontWeight: 700, color: '#0f172a', width: '20%' }}>{item.title}</td>
                  <td style={{ color: '#0f172a', lineHeight: 1.5, maxWidth: 320 }}>{item.content}</td>
                  <td style={{ color: '#0f172a', fontWeight: 600, fontSize: 12 }}>
                    {item.target_audience === 'all' 
                      ? 'All Campus Users'
                      : item.target_audience === 'all_students'
                      ? 'All Students'
                      : item.target_audience === 'individual_staff' || item.target_audience === 'staff'
                      ? `Specific Staff: ${item.target_user || ''}`
                      : item.target_audience === 'individual_student' || item.target_audience === 'individual'
                      ? `Specific Student: ${item.target_user || ''}`
                      : 'All Campus Users'}
                  </td>
                  <td style={{ color: '#64748b', fontSize: 12 }}>{item.date}</td>
                  <td>
                    <span className={`badge ${item.priority === 'high' ? 'badge-danger' : 'badge-live'}`}>
                      {item.priority === 'high' ? 'HIGH PRIORITY' : 'NORMAL'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" style={{ color: '#0f172a', border: '1px solid #cbd5e1', background: '#f8fafc' }} onClick={() => handleOpenEdit(item)}>
                        <i className="ri-edit-line"></i> Edit
                      </button>
                      <button className="btn btn-secondary btn-sm" style={{ color: '#0f172a', border: '1px solid #cbd5e1', background: '#f8fafc' }} onClick={() => setDeleteConfirmItem(item)}>
                        <i className="ri-delete-bin-line"></i> Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="card" style={{ width: 500, padding: 24, borderRadius: 20, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a', marginBottom: 16, fontSize: 18, fontWeight: 800 }}>
              {editingItem ? 'Edit Campus Notice' : 'Post New Campus Notice'}
            </h3>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#475569', fontWeight: 700 }}>
                  Title <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input 
                  type="text"
                  required
                  placeholder="Enter announcement title..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#475569', fontWeight: 700 }}>
                  Announcement Content <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Enter announcement details..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#475569', fontWeight: 700 }}>
                  Target Audience / Recipient <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select 
                  value={targetAudience}
                  onChange={e => setTargetAudience(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600 }}
                >
                  <option value="all">All Campus Users (Including Staff)</option>
                  <option value="all_students">All Students</option>
                  <option value="individual_staff">Specific Staff / Lecturer</option>
                  <option value="individual_student">Specific Student</option>
                </select>
              </div>

              {(targetAudience === 'individual_student' || targetAudience === 'individual') && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#475569', fontWeight: 700 }}>
                    Student ID or Email <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. 65070042@student.university.ac.th or 65070042"
                    value={targetUser}
                    onChange={e => setTargetUser(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600 }}
                  />
                </div>
              )}

              {targetAudience === 'individual_staff' && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#475569', fontWeight: 700 }}>
                    Staff / Lecturer ID or Email <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. staff.somchai@university.ac.th or STF-1024"
                    value={targetUser}
                    onChange={e => setTargetUser(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600 }}
                  />
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#475569', fontWeight: 700 }}>Priority Level</label>
                <select 
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600 }}
                >
                  <option value="normal">Normal Notice</option>
                  <option value="high">High Priority Alert</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : (editingItem ? 'Save Changes' : 'Publish Announcement')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="card" style={{ width: 420, padding: 24, borderRadius: 20, textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', fontSize: 28 }}>
              <i className="ri-error-warning-line"></i>
            </div>
            <h3 style={{ marginTop: 0, color: '#0f172a', marginBottom: 8, fontSize: 18, fontWeight: 800 }}>Confirm Post Removal</h3>
            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.5, margin: '0 0 24px 0' }}>
              Are you sure you want to remove this announcement?
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }} onClick={() => setDeleteConfirmItem(null)} disabled={deleting}>
                Cancel
              </button>
              <button type="button" className="btn" style={{ flex: 1, background: '#dc2626', color: '#ffffff', border: 'none', fontWeight: 700, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }} onClick={handleConfirmDelete} disabled={deleting}>
                {deleting ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
