import React, { useState, useRef, useEffect } from 'react';
import { THAI_PROVINCES } from '../data/provincesData';

const CAR_COLORS = [
  { name: 'White', label: 'White (ขาว / บรอนซ์ขาว)', hex: '#ffffff' },
  { name: 'Black', label: 'Black (ดำ / ดำเงา)', hex: '#0f172a' },
  { name: 'Silver', label: 'Silver (บรอนซ์เงิน)', hex: '#cbd5e1' },
  { name: 'Gray', label: 'Gray (เทา / เทาดำ)', hex: '#64748b' },
  { name: 'Red', label: 'Red (แดง / แดงเมทัลลิก)', hex: '#dc2626' },
  { name: 'Blue', label: 'Blue (น้ำเงิน / ฟ้า)', hex: '#2563eb' },
  { name: 'Bronze', label: 'Bronze / Gold (บรอนซ์ทอง / น้ำตาล)', hex: '#d97706' },
  { name: 'Green', label: 'Green (เขียว)', hex: '#059669' },
  { name: 'Yellow', label: 'Yellow (เหลือง)', hex: '#eab308' },
  { name: 'Orange', label: 'Orange (ส้ม)', hex: '#ea580c' }
];

const MOTORCYCLE_COLORS = [
  { name: 'Black', label: 'Black (ดำ / ดำด้าน / ดำเงา)', hex: '#0f172a' },
  { name: 'White', label: 'White (ขาว / ขาวมุก)', hex: '#ffffff' },
  { name: 'Red', label: 'Red (แดง / แดงบรอนซ์)', hex: '#dc2626' },
  { name: 'Blue', label: 'Blue (น้ำเงิน / ฟ้า)', hex: '#2563eb' },
  { name: 'Gray', label: 'Gray (เทา / เทาแลมโบ)', hex: '#64748b' },
  { name: 'Green', label: 'Green (เขียว / เขียวมะนาว)', hex: '#059669' },
  { name: 'Yellow', label: 'Yellow (เหลือง)', hex: '#eab308' },
  { name: 'Orange', label: 'Orange (ส้ม)', hex: '#ea580c' },
  { name: 'Pink', label: 'Pink (ชมพู)', hex: '#ec4899' },
  { name: 'Purple', label: 'Purple (ม่วง)', hex: '#9333ea' }
];

function SearchableColorSelect({ value, onChange, vehicleType = 'motorcycle' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const colorOptions = vehicleType === 'car' ? CAR_COLORS : MOTORCYCLE_COLORS;

  const filteredColors = colorOptions.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input 
          type="text"
          placeholder="Select color or type custom color..."
          value={searchTerm}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onChange(searchTerm);
              setIsOpen(false);
            }
          }}
          style={{ 
            width: '100%', 
            padding: '10px 32px 10px 14px', 
            background: '#f8fafc', 
            border: '1px solid #cbd5e1', 
            borderRadius: 10, 
            color: '#0f172a', 
            fontSize: 13, 
            fontWeight: 600, 
            outline: 'none' 
          }}
        />
        <i 
          className={isOpen ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"}
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: 'absolute',
            right: 10,
            color: '#64748b',
            fontSize: 16,
            cursor: 'pointer'
          }}
        />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', 
          top: '100%', 
          left: 0, 
          right: 0, 
          marginTop: 4,
          maxHeight: 200, 
          overflowY: 'auto', 
          background: '#ffffff',
          border: '1px solid #cbd5e1', 
          borderRadius: 10,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)', 
          zIndex: 10000
        }}>
          {filteredColors.length > 0 ? (
            filteredColors.map(c => {
              const isSelected = searchTerm.toLowerCase() === c.name.toLowerCase();
              return (
                <div 
                  key={c.name}
                  onClick={() => {
                    setSearchTerm(c.name);
                    onChange(c.name);
                    setIsOpen(false);
                  }}
                  style={{
                    padding: '8px 12px', 
                    cursor: 'pointer', 
                    fontSize: 13,
                    borderBottom: '1px solid #f1f5f9', 
                    color: '#0f172a',
                    fontWeight: isSelected ? 700 : 500,
                    background: isSelected ? '#eff6ff' : 'transparent',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = isSelected ? '#eff6ff' : 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ 
                      width: 14, 
                      height: 14, 
                      borderRadius: '50%', 
                      background: c.hex, 
                      border: '1px solid #cbd5e1',
                      display: 'inline-block' 
                    }} />
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{c.label}</span>
                  </div>
                  {isSelected && <i className="ri-checkbox-circle-fill" style={{ color: '#2563eb', fontSize: 16 }}></i>}
                </div>
              );
            })
          ) : (
            <div 
              onClick={() => {
                onChange(searchTerm);
                setIsOpen(false);
              }}
              style={{ 
                padding: '10px 12px', 
                fontSize: 13, 
                color: '#2563eb', 
                fontWeight: 600, 
                textAlign: 'left', 
                cursor: 'pointer', 
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <i className="ri-edit-box-line" style={{ fontSize: 16 }}></i>
              <span>Use custom color: <strong style={{ color: '#0f172a' }}>"{searchTerm}"</strong></span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SearchableProvinceSelect({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProvinces = THAI_PROVINCES.filter(p => 
    p.th.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.en.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input 
          type="text"
          placeholder="Type or select province (e.g. Bangkok / กรุงเทพ...)"
          value={searchTerm}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onChange(searchTerm);
              setIsOpen(false);
            }
          }}
          style={{ 
            width: '100%', 
            padding: '10px 32px 10px 14px', 
            background: '#f8fafc', 
            border: '1px solid #cbd5e1', 
            borderRadius: 10, 
            color: '#0f172a', 
            fontSize: 13, 
            fontWeight: 600, 
            outline: 'none' 
          }}
        />
        <i 
          className={isOpen ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"}
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: 'absolute',
            right: 10,
            color: '#64748b',
            fontSize: 16,
            cursor: 'pointer',
            pointerEvents: 'auto'
          }}
        />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', 
          top: '100%', 
          left: 0, 
          right: 0, 
          marginTop: 4,
          maxHeight: 220, 
          overflowY: 'auto', 
          background: '#ffffff',
          border: '1px solid #cbd5e1', 
          borderRadius: 10,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)', 
          zIndex: 10000
        }}>
          {filteredProvinces.length > 0 ? (
            filteredProvinces.map(p => {
              const isSelected = searchTerm.toLowerCase() === p.th.toLowerCase() || 
                                 searchTerm.toLowerCase() === p.en.toLowerCase() ||
                                 searchTerm.toLowerCase() === (p.label || '').toLowerCase();
              return (
                <div 
                  key={p.id}
                  onClick={() => {
                    setSearchTerm(p.th);
                    onChange(p.th);
                    setIsOpen(false);
                  }}
                  style={{
                    padding: '9px 14px', 
                    cursor: 'pointer', 
                    fontSize: 13,
                    borderBottom: '1px solid #f1f5f9', 
                    color: '#0f172a',
                    fontWeight: isSelected ? 700 : 500,
                    background: isSelected ? '#eff6ff' : 'transparent',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = isSelected ? '#eff6ff' : 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{p.en}</span>
                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>({p.th})</span>
                  </div>
                  {isSelected && <i className="ri-checkbox-circle-fill" style={{ color: '#2563eb', fontSize: 16 }}></i>}
                </div>
              );
            })
          ) : (
            <div style={{ padding: 12, fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
              No province found for "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
    const matchedP = THAI_PROVINCES.find(p => 
      p.th.toLowerCase() === (v.province || '').toLowerCase() || 
      p.en.toLowerCase() === (v.province || '').toLowerCase()
    );
    setNewProvince(matchedP ? matchedP.th : (v.province || 'กรุงเทพมหานคร'));
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
          <span>Vehicle Directory</span>
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
            {search && (
              <button 
                type="button"
                onClick={() => setSearch('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 16
                }}
                title="Clear search"
              >
                <i className="ri-close-circle-fill"></i>
              </button>
            )}
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
                <th>Student ID</th>
                <th>Name</th>
                <th>Role</th>
                <th>Vehicle Type</th>
                <th>License Plate</th>
                <th>Vehicle Details</th>
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
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>{item.id}</td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>{item.owner}</td>
                    <td style={{ color: '#0f172a', fontWeight: 600 }}>{item.role}</td>
                    <td style={{ color: '#0f172a', fontWeight: 600 }}>{vTypeLabel}</td>
                    <td style={{ color: '#0f172a', fontWeight: 700 }}>{item.plate} {item.province && !item.plate.includes(item.province) ? item.province : ''}</td>
                    <td style={{ color: '#0f172a', fontWeight: 500 }}>{detailsStr}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" style={{ color: '#0f172a', border: '1px solid #cbd5e1', background: '#f8fafc' }} onClick={() => handleOpenEdit(item)}>
                          <i className="ri-edit-line"></i> Edit
                        </button>
                        <button className="btn btn-secondary btn-sm" style={{ color: '#0f172a', border: '1px solid #cbd5e1', background: '#f8fafc' }} onClick={() => setRevokeConfirmVehicle(item)}>
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
                  <SearchableProvinceSelect 
                    value={newProvince}
                    onChange={setNewProvince}
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
                  <SearchableColorSelect 
                    value={newColor}
                    onChange={setNewColor}
                    vehicleType={newVehicleType}
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
