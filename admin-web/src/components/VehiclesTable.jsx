import React, { useState } from 'react';

export default function VehiclesTable({ vehicles, onRefreshVehicles }) {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null); // null for new, object for edit
  const [revokeConfirmVehicle, setRevokeConfirmVehicle] = useState(null); // vehicle to revoke
  const [newOwner, setNewOwner] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [newProvince, setNewProvince] = useState('กรุงเทพมหานคร');
  const [newVehicleType, setNewVehicleType] = useState('motorcycle'); // 'motorcycle' | 'car'
  const [newBrand, setNewBrand] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newColor, setNewColor] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('student');
  const [submitting, setSubmitting] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const filtered = vehicles.filter(v => 
    (v.plate || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.owner || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.id || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.vehicle || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenRegister = () => {
    setEditingVehicle(null);
    setNewOwner('');
    setNewPlate('');
    setNewProvince('กรุงเทพมหานคร');
    setNewVehicleType('motorcycle');
    setNewBrand('');
    setNewModel('');
    setNewColor('');
    setNewEmail('');
    setNewRole('student');
    setShowModal(true);
  };

  const handleOpenEdit = (v) => {
    setEditingVehicle(v);
    setNewOwner(v.owner || '');
    setNewPlate(v.plate || '');
    setNewProvince(v.province || 'Bangkok');
    const combinedInfo = (v.vehicle_type || '') + ' ' + (v.vehicle || '') + ' ' + (v.brand || '') + ' ' + (v.model || '');
    const isCar = v.vehicle_type === 'car' || /car|รถยนต์|mazda|toyota|camry|civic|altis|benz|bmw|accord|nissan/i.test(combinedInfo);
    setNewVehicleType(isCar ? 'car' : 'motorcycle');
    setNewBrand(v.brand || '');
    
    // Parse model if not separated
    let parsedModel = v.model || '';
    if (!parsedModel && v.vehicle) {
      parsedModel = v.vehicle.replace(/Motorcycle|Car|รถจักรยานยนต์|รถยนต์|\([^)]*\)/gi, '').trim();
    }
    setNewModel(parsedModel);

    // Parse color if not separated
    let parsedColor = v.color || '';
    if (!parsedColor && v.vehicle) {
      const match = v.vehicle.match(/\(([^)]+)\)/);
      if (match) parsedColor = match[1];
    }
    setNewColor(parsedColor);

    setNewEmail(v.ownerEmail || '');
    setNewRole(v.role ? v.role.toLowerCase() : 'student');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!newPlate.trim()) return;

    setSubmitting(true);
    try {
      const fullModelStr = `${newBrand} ${newModel}`.trim();
      if (editingVehicle) {
        // Edit existing vehicle
        await fetch('http://localhost:8000/admin/update-vehicle', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            old_email: editingVehicle.ownerEmail || newEmail,
            old_plate: editingVehicle.plate,
            user_email: newEmail.trim(),
            plate: newPlate.trim(),
            vehicle_type: newVehicleType,
            brand: newBrand.trim(),
            model: fullModelStr || 'Vehicle',
            color: newColor.trim(),
            owner: newOwner.trim(),
            role: newRole,
            province: newProvince
          })
        });
      } else {
        // Register new vehicle
        await fetch('http://localhost:8000/parking/register-vehicle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_email: newEmail.trim() || '65070042@student.university.ac.th',
            role: newRole,
            plate: newPlate.trim(),
            vehicle_type: newVehicleType,
            brand: newBrand.trim(),
            model: fullModelStr || 'Honda PCX 160',
            color: newColor.trim()
          })
        });
      }
      setShowModal(false);
      setEditingVehicle(null);
      setNewPlate('');
      setNewBrand('');
      setNewModel('');
      setNewColor('');
      setNewEmail('');
      setNewOwner('');
      if (onRefreshVehicles) onRefreshVehicles();
    } catch (err) {
      alert('Error saving vehicle: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!revokeConfirmVehicle) return;
    setRevoking(true);
    try {
      const plate = revokeConfirmVehicle.plate;
      const ownerEmail = revokeConfirmVehicle.ownerEmail || '65070042@student.university.ac.th';
      await fetch(`http://localhost:8000/parking/delete-vehicle?user_email=${encodeURIComponent(ownerEmail)}&plate=${encodeURIComponent(plate)}`, {
        method: 'DELETE'
      });
      setRevokeConfirmVehicle(null);
      if (onRefreshVehicles) onRefreshVehicles();
    } catch (err) {
      alert('Error revoking vehicle: ' + err.message);
    } finally {
      setRevoking(false);
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
          <button className="btn btn-primary" onClick={handleOpenRegister}>
            <i className="ri-add-line"></i> Register Vehicle
          </button>
        </div>
      </div>

      <div className="table-container">
        {(!filtered || filtered.length === 0) ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
            <i className="ri-car-line" style={{ fontSize: 36, color: '#2563eb', display: 'block', marginBottom: 12 }}></i>
            <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>No Registered Vehicles Found</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>There are no registered campus vehicles matching your filter in MongoDB.</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Role</th>
                <th>Vehicle Type</th>
                <th>License Plate</th>
                <th>Vehicle Details</th>
                <th>Safety Score</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => {
                const isCar = item.vehicle_type === 'car' || item.vehicle?.toLowerCase().includes('car');
                const vTypeLabel = isCar ? 'Car' : 'Motorcycle';
                let detailsStr = item.brand || item.model 
                  ? `${item.brand || ''} ${item.model || ''} ${item.color ? `(${item.color})` : ''}`.trim() 
                  : (item.vehicle || '').replace(/^(Car|Motorcycle)\s*/i, '').trim();
                if (!detailsStr) detailsStr = item.vehicle || 'Standard Vehicle';

                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 700, color: '#2563eb', fontFamily: 'monospace' }}>{item.id}</td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>{item.owner}</td>
                    <td style={{ color: '#475569', fontWeight: 600 }}>{item.role}</td>
                    <td style={{ color: '#334155', fontWeight: 600 }}>{vTypeLabel}</td>
                    <td style={{ color: '#0f172a', fontWeight: 700 }}>{item.plate} {item.province && !item.plate.includes(item.province) ? item.province : ''}</td>
                    <td style={{ color: '#334155', fontWeight: 500 }}>{detailsStr}</td>
                    <td style={{ fontWeight: 900, color: item.score >= 90 ? '#059669' : '#d97706' }}>
                      {item.score}/100
                    </td>
                    <td style={{ color: '#059669', fontWeight: 700 }}>Active</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" style={{ color: '#2563eb', border: '1px solid #bfdbfe', background: '#eff6ff' }} onClick={() => handleOpenEdit(item)}>
                          <i className="ri-edit-line"></i> Edit
                        </button>
                        <button className="btn btn-secondary btn-sm" style={{ color: '#dc2626', border: '1px solid #fca5a5', background: '#fef2f2' }} onClick={() => setRevokeConfirmVehicle(item)}>
                          Revoke
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="card" style={{ width: 480, padding: 24, borderRadius: 20, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a', marginBottom: 16, fontSize: 18, fontWeight: 800 }}>
              {editingVehicle ? 'Edit Vehicle & Campus Pass' : 'Register New Campus Pass'}
            </h3>
            <form onSubmit={handleSave}>
              {editingVehicle && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#475569', fontWeight: 700 }}>Name</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Thanaphat S."
                    value={newOwner}
                    onChange={e => setNewOwner(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600 }}
                  />
                </div>
              )}

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#475569', fontWeight: 700 }}>User Email</label>
                <input 
                  type="email"
                  required
                  placeholder="e.g. 65070042@student.university.ac.th"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#475569', fontWeight: 700 }}>License Plate</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. 1กข 1234"
                    value={newPlate}
                    onChange={e => setNewPlate(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#475569', fontWeight: 700 }}>Province</label>
                  <input 
                    type="text"
                    placeholder="Bangkok"
                    value={newProvince}
                    onChange={e => setNewProvince(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#475569', fontWeight: 700 }}>Vehicle Type</label>
                  <select 
                    value={newVehicleType}
                    onChange={e => setNewVehicleType(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600 }}
                  >
                    <option value="motorcycle">Motorcycle</option>
                    <option value="car">Car</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#475569', fontWeight: 700 }}>Vehicle Color</label>
                  <input 
                    type="text"
                    placeholder="e.g. Black / White / Red"
                    value={newColor}
                    onChange={e => setNewColor(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600 }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#475569', fontWeight: 700 }}>Vehicle Brand & Model</label>
                <input 
                  type="text"
                  placeholder="e.g. Honda PCX 160"
                  value={newModel}
                  onChange={e => setNewModel(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600 }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#475569', fontWeight: 700 }}>User Role</label>
                <select 
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600 }}
                >
                  <option value="student">Student</option>
                  <option value="staff">Staff / Faculty</option>
                  <option value="guest">Visitor / Guest</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : (editingVehicle ? 'Save Changes' : 'Register Pass')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revoke Confirmation Modal */}
      {revokeConfirmVehicle && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="card" style={{ width: 420, padding: 24, borderRadius: 20, textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', fontSize: 28 }}>
              <i className="ri-error-warning-line"></i>
            </div>
            <h3 style={{ marginTop: 0, color: '#0f172a', marginBottom: 8, fontSize: 18, fontWeight: 800 }}>Confirm Pass Revocation</h3>
            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.5, margin: '0 0 24px 0' }}>
              Are you sure you want to revoke campus pass for plate <strong style={{ color: '#0f172a' }}>"{revokeConfirmVehicle.plate}"</strong> ({revokeConfirmVehicle.owner})?
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }} onClick={() => setRevokeConfirmVehicle(null)} disabled={revoking}>
                Cancel
              </button>
              <button type="button" className="btn" style={{ flex: 1, background: '#dc2626', color: '#ffffff', border: 'none', fontWeight: 700, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }} onClick={handleConfirmRevoke} disabled={revoking}>
                {revoking ? 'Revoking...' : 'Confirm Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
