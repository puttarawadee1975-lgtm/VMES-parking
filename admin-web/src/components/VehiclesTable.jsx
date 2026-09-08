import React, { useState } from 'react';

export default function VehiclesTable({ vehicles, onRefreshVehicles }) {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newPlate, setNewPlate] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('student');
  const [submitting, setSubmitting] = useState(false);

  const filtered = vehicles.filter(v => 
    (v.plate || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.owner || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.id || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.vehicle || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!newPlate.trim()) return;

    setSubmitting(true);
    try {
      await fetch('http://localhost:8000/parking/register-vehicle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: newEmail.trim() || '65070042@student.university.ac.th',
          role: newRole,
          plate: newPlate.trim(),
          model: newModel.trim() || 'Honda PCX 160'
        })
      });
      setShowModal(false);
      setNewPlate('');
      setNewModel('');
      setNewEmail('');
      if (onRefreshVehicles) onRefreshVehicles();
    } catch (err) {
      alert('Error registering vehicle: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (plate, ownerEmail) => {
    if (!confirm(`Are you sure you want to revoke campus pass for plate ${plate}?`)) return;
    try {
      await fetch(`http://localhost:8000/parking/delete-vehicle?user_email=${encodeURIComponent(ownerEmail || '65070042@student.university.ac.th')}&plate=${encodeURIComponent(plate)}`, {
        method: 'DELETE'
      });
      if (onRefreshVehicles) onRefreshVehicles();
    } catch (err) {
      alert('Error revoking vehicle: ' + err.message);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-title">
          <i className="ri-car-line"></i>
          <span>Registered Vehicles & Campus Passes</span>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <i className="ri-search-line"></i>
            <input 
              type="text" 
              placeholder="Search by Plate, ID, or Owner..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <i className="ri-add-line"></i> Register Vehicle
          </button>
        </div>
      </div>

      <div className="table-container">
        {(!filtered || filtered.length === 0) ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
            <i className="ri-car-line" style={{ fontSize: 36, color: '#38bdf8', display: 'block', marginBottom: 12 }}></i>
            <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>No Registered Vehicles Found</div>
            <div style={{ fontSize: 13 }}>There are no registered campus vehicles matching your filter in MongoDB.</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Owner Name</th>
                <th>Role / ID</th>
                <th>License Plate</th>
                <th>Vehicle Details</th>
                <th>Safety Score</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 700, color: '#ffffff' }}>{item.owner}</td>
                  <td><span style={{ color: '#94a3b8' }}>{item.role} ({item.id})</span></td>
                  <td><span className="plate-tag">{item.plate} {item.province}</span></td>
                  <td>{item.vehicle}</td>
                  <td style={{ fontWeight: 900, color: item.score >= 90 ? '#10b981' : '#f59e0b' }}>
                    {item.score}/100
                  </td>
                  <td><span className="badge badge-live">APPROVED</span></td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleRevoke(item.plate, item.ownerEmail)}>
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>


      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="card" style={{ width: 450, padding: 24, borderRadius: 12 }}>
            <h3 style={{ marginTop: 0, color: '#38bdf8', marginBottom: 16 }}>Register New Campus Pass</h3>
            <form onSubmit={handleRegister}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#94a3b8' }}>User Email</label>
                <input 
                  type="email"
                  required
                  placeholder="e.g. 65070042@student.university.ac.th"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#fff' }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#94a3b8' }}>License Plate (Thai)</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. 1กข 1234"
                  value={newPlate}
                  onChange={e => setNewPlate(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#fff' }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#94a3b8' }}>Vehicle Brand & Model</label>
                <input 
                  type="text"
                  placeholder="e.g. Honda PCX 160 (Black)"
                  value={newModel}
                  onChange={e => setNewModel(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#fff' }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#94a3b8' }}>User Role</label>
                <select 
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#fff' }}
                >
                  <option value="student">Student</option>
                  <option value="staff">Staff / Faculty</option>
                  <option value="guest">Visitor / Guest</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Registering...' : 'Register Pass'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

