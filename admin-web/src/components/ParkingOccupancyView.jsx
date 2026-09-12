import React, { useState } from 'react';

const SAMPLE_ZONE_IMAGES = [
  { name: 'Ground Floor Car Deck', url: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&auto=format&fit=crop&q=80' },
  { name: 'Motorcycle Two-Wheeler Deck', url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80' },
  { name: 'Faculty & Staff Reserved Deck', url: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600&auto=format&fit=crop&q=80' }
];

export default function ParkingOccupancyView({ parkingOccupancy, logs }) {
  const { total = 18 } = parkingOccupancy || {};

  // Calculate live count from logs
  const estCars = logs.filter(l => l.vehicle_type === 'car' || (l.vehicle && /car|รถยนต์/i.test(l.vehicle))).length;
  const estMotos = logs.filter(l => l.vehicle_type === 'motorcycle' || (l.vehicle && /motorcycle|มอเตอร์ไซค์/i.test(l.vehicle))).length;

  const availableCarSpots = Math.max(0, total - estCars);
  const carRate = Number(((estCars / total) * 100).toFixed(1));

  // Dynamic Building Zones State
  const [zones, setZones] = useState([
    {
      id: 'ZONE-A',
      name: 'Zone A',
      tag: 'Cars Only',
      badgeClass: 'badge-live',
      location: 'Ground Floor - Automobile Deck',
      pillars: 'Pillars G01 - G09 (VIP Entrance)',
      capacity: '6 Car Spots',
      imageUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&auto=format&fit=crop&q=80',
      description: 'Main Entrance Automobile Deck with direct lift access.'
    },
    {
      id: 'ZONE-B',
      name: 'Zone B',
      tag: 'Motorcycles',
      badgeClass: 'badge-warning',
      location: 'Floor 1 - Two-Wheeler Deck',
      pillars: 'Pillars B01 - B12 (Ramp Side)',
      capacity: 'Separate Motorcycle Area',
      imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80',
      description: 'Dedicated two-wheeler deck with helmet storage.'
    },
    {
      id: 'ZONE-C',
      name: 'Zone C',
      tag: 'Staff & Faculty',
      badgeClass: 'badge-secondary',
      location: 'Floor 2 - Reserved Automobile Deck',
      pillars: 'Pillars C01 - C06 (Faculty Area)',
      capacity: '12 Car Spots',
      imageUrl: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600&auto=format&fit=crop&q=80',
      description: 'Reserved deck for university staff and faculty.'
    }
  ]);

  // Modal State for Adding/Editing Zone
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [editingZone, setEditingZone] = useState(null); // null for new, object for edit
  const [selectedPreviewImage, setSelectedPreviewImage] = useState(null);

  // Form Fields State
  const [formName, setFormName] = useState('');
  const [formTag, setFormTag] = useState('Cars Only');
  const [formLocation, setFormLocation] = useState('');
  const [formPillars, setFormPillars] = useState('');
  const [formCapacity, setFormCapacity] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const handleOpenAddZone = () => {
    setEditingZone(null);
    setFormName(`Zone ${String.fromCharCode(65 + zones.length)}`);
    setFormTag('Cars Only');
    setFormLocation('Ground Floor');
    setFormPillars('Pillars G10 - G15');
    setFormCapacity('6 Car Spots');
    setFormImageUrl(SAMPLE_ZONE_IMAGES[0].url);
    setFormDescription('New Building Zone Specification.');
    setShowZoneModal(true);
  };

  const handleOpenEditZone = (zone) => {
    setEditingZone(zone);
    setFormName(zone.name);
    setFormTag(zone.tag);
    setFormLocation(zone.location);
    setFormPillars(zone.pillars || '');
    setFormCapacity(zone.capacity);
    setFormImageUrl(zone.imageUrl || '');
    setFormDescription(zone.description || '');
    setShowZoneModal(true);
  };

  const handleSaveZone = (e) => {
    e.preventDefault();
    if (!formName.trim()) return;

    let badgeClass = 'badge-live';
    if (formTag.toLowerCase().includes('motorcycle')) badgeClass = 'badge-warning';
    if (formTag.toLowerCase().includes('staff') || formTag.toLowerCase().includes('faculty')) badgeClass = 'badge-secondary';

    if (editingZone) {
      // Update existing zone
      setZones(prev => prev.map(z => z.id === editingZone.id ? {
        ...z,
        name: formName.trim(),
        tag: formTag.trim(),
        badgeClass,
        location: formLocation.trim(),
        pillars: formPillars.trim(),
        capacity: formCapacity.trim(),
        imageUrl: formImageUrl.trim(),
        description: formDescription.trim()
      } : z));
    } else {
      // Add new zone
      const newZoneObj = {
        id: `ZONE-${Date.now()}`,
        name: formName.trim(),
        tag: formTag.trim(),
        badgeClass,
        location: formLocation.trim(),
        pillars: formPillars.trim(),
        capacity: formCapacity.trim(),
        imageUrl: formImageUrl.trim() || SAMPLE_ZONE_IMAGES[0].url,
        description: formDescription.trim()
      };
      setZones(prev => [...prev, newZoneObj]);
    }
    setShowZoneModal(false);
  };

  const handleDeleteZone = (zoneId) => {
    if (window.confirm('Are you sure you want to remove this Building Zone specification?')) {
      setZones(prev => prev.filter(z => z.id !== zoneId));
    }
  };

  const getStatusBadge = () => {
    if (carRate >= 85) {
      return { label: 'CRITICAL / NEARLY FULL', badgeClass: 'badge-danger', color: '#ef4444' };
    } else if (carRate >= 50) {
      return { label: 'MODERATE OCCUPANCY', badgeClass: 'badge-warning', color: '#d97706' };
    }
    return { label: 'CAR SPOTS AVAILABLE', badgeClass: 'badge-live', color: '#059669' };
  };

  const statusInfo = getStatusBadge();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Overview KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <div className="kpi-card" style={{ background: '#ffffff', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Car Capacity</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              <i className="ri-car-line"></i>
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', marginTop: 10 }}>{total} <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>Car Spots</span></div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Smart Building</div>
        </div>

        <div className="kpi-card" style={{ background: '#ffffff', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Cars Occupied</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              <i className="ri-car-fill"></i>
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#d97706', marginTop: 10 }}>{estCars} <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>Cars</span></div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Occupying {estCars} of 18 Car Spots</div>
        </div>

        <div className="kpi-card" style={{ background: '#ffffff', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Available Car Spots</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#dcfce7', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              <i className="ri-checkbox-circle-line"></i>
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#059669', marginTop: 10 }}>{availableCarSpots} <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>Open</span></div>
          <div style={{ fontSize: 12, color: '#059669', fontWeight: 600, marginTop: 4 }}>Ready for Car Entry</div>
        </div>

        <div className="kpi-card" style={{ background: '#ffffff', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Motorcycles Inside</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f3e8ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              <i className="ri-motorbike-line"></i>
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#9333ea', marginTop: 10 }}>{estMotos} <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>Motorcycles</span></div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Tracked Separately (Uncounted)</div>
        </div>
      </div>



      {/* Building Floor Specifications & Allocation Rules */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="ri-layout-grid-line" style={{ color: '#2563eb' }}></i>
              Building Zones Allocation & Specifications
            </h3>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              Manage Zone layouts, specify pillars, set capacities, and upload zone photos for Mobile App display
            </div>
          </div>

          <button 
            className="btn btn-primary btn-sm"
            onClick={handleOpenAddZone}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, borderRadius: 10, padding: '8px 16px' }}
          >
            <i className="ri-add-line" style={{ fontSize: 16 }}></i>
            Add New Zone
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {zones.map((z) => (
            <div key={z.id} style={{ background: '#ffffff', padding: 18, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 16 }}>{z.name}</span>
                  <span className={`badge ${z.badgeClass}`}>{z.tag}</span>
                </div>

                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                  <i className="ri-map-pin-2-line" style={{ color: '#2563eb', marginRight: 4 }}></i>
                  {z.location}
                </div>

                <div style={{ fontSize: 12, color: '#0f172a', fontWeight: 700, marginBottom: 8, background: '#f1f5f9', padding: '6px 10px', borderRadius: 8, display: 'inline-block' }}>
                  <i className="ri-pushpin-line" style={{ color: '#d97706', marginRight: 4 }}></i>
                  {z.pillars || 'Pillars G01-G09'}
                </div>

                <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 12 }}>
                  Capacity: <strong style={{ color: '#0f172a' }}>{z.capacity}</strong>
                </div>

                {/* Zone Photo Preview Box */}
                {z.imageUrl && (
                  <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', height: 120, marginBottom: 12, border: '1px solid #cbd5e1' }}>
                    <img 
                      src={z.imageUrl} 
                      alt={z.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <div style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', color: '#ffffff', padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                      <i className="ri-smartphone-line" style={{ marginRight: 2 }}></i> App Display Ready
                    </div>
                  </div>
                )}

                {z.description && (
                  <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic', marginBottom: 12 }}>
                    "{z.description}"
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                <button 
                  className="btn btn-secondary btn-sm" 
                  style={{ flex: 1, color: '#0f172a', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700, fontSize: 12, padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                  onClick={() => handleOpenEditZone(z)}
                >
                  <i className="ri-edit-line" style={{ color: '#2563eb' }}></i> Edit Zone & Pillars
                </button>

                {z.imageUrl && (
                  <button 
                    className="btn btn-secondary btn-sm" 
                    style={{ color: '#0f172a', border: '1px solid #cbd5e1', background: '#f8fafc', padding: '6px 10px' }}
                    onClick={() => setSelectedPreviewImage({ name: z.name, url: z.imageUrl, location: z.location, pillars: z.pillars })}
                    title="View Full Zone Photo"
                  >
                    <i className="ri-image-line" style={{ color: '#059669' }}></i>
                  </button>
                )}

                <button 
                  className="btn btn-secondary btn-sm" 
                  style={{ color: '#dc2626', border: '1px solid #fecaca', background: '#fef2f2', padding: '6px 10px' }}
                  onClick={() => handleDeleteZone(z.id)}
                  title="Delete Zone"
                >
                  <i className="ri-delete-bin-line"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit / Add Zone Modal */}
      {showZoneModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="card" style={{ width: 620, maxHeight: '90vh', padding: 24, borderRadius: 20, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="ri-layout-grid-line" style={{ color: '#2563eb' }}></i>
                <span>{editingZone ? `Edit Specification: ${editingZone.name}` : 'Add New Building Zone'}</span>
              </h3>
              <button onClick={() => setShowZoneModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 20, width: 32, height: 32, cursor: 'pointer', color: '#475569', fontSize: 18 }}>✕</button>
            </div>

            <form onSubmit={handleSaveZone}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#475569', fontWeight: 700 }}>Zone Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Zone A / Zone B / Zone VIP"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#475569', fontWeight: 700 }}>Target Vehicle / Role Tag *</label>
                  <select 
                    value={formTag}
                    onChange={e => setFormTag(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600, outline: 'none' }}
                  >
                    <option value="Cars Only">Cars Only</option>
                    <option value="Motorcycles">Motorcycles</option>
                    <option value="Staff & Faculty">Staff & Faculty</option>
                    <option value="EV Charging Zone">EV Charging Zone</option>
                    <option value="Visitor / Guest">Visitor / Guest</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#475569', fontWeight: 700 }}>Floor / Location *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Ground Floor - Automobile Deck"
                    value={formLocation}
                    onChange={e => setFormLocation(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#475569', fontWeight: 700 }}>Pillars Specification (ระบุเสา) *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Pillars G01 - G09 (VIP Entrance)"
                    value={formPillars}
                    onChange={e => setFormPillars(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600 }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#475569', fontWeight: 700 }}>Design Capacity *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. 6 Car Spots / Dedicated Motorcycle Area"
                  value={formCapacity}
                  onChange={e => setFormCapacity(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600 }}
                />
              </div>

              {/* Zone Image URL & Presets */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#475569', fontWeight: 700 }}>
                  Zone Layout Photo URL (แสดงใน User App) *
                </label>
                <input 
                  type="text" 
                  placeholder="https://images.unsplash.com/..."
                  value={formImageUrl}
                  onChange={e => setFormImageUrl(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600, marginBottom: 8 }}
                />

                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, fontWeight: 600 }}>Or Select Sample Zone Photo Presets:</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {SAMPLE_ZONE_IMAGES.map((img, idx) => (
                    <button 
                      key={idx}
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setFormImageUrl(img.url)}
                      style={{ fontSize: 11, padding: '4px 10px', background: formImageUrl === img.url ? '#eff6ff' : '#f8fafc', borderColor: formImageUrl === img.url ? '#2563eb' : '#cbd5e1', color: '#0f172a', fontWeight: 600 }}
                    >
                      📷 {img.name}
                    </button>
                  ))}
                </div>

                {/* Live Image Preview */}
                {formImageUrl && (
                  <div style={{ marginTop: 10, borderRadius: 10, overflow: 'hidden', height: 110, border: '1px solid #cbd5e1', position: 'relative' }}>
                    <img src={formImageUrl} alt="Zone Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(15,23,42,0.8)', color: '#ffffff', fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                      Live User App Image Preview
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#475569', fontWeight: 700 }}>Description / User Notes</label>
                <textarea 
                  rows={2}
                  placeholder="Additional notes for students & faculty in User App..."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowZoneModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Zone Specifications</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Photo Modal */}
      {selectedPreviewImage && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
          <div className="card" style={{ width: 560, padding: 20, borderRadius: 20, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{selectedPreviewImage.name} Photo</h4>
                <div style={{ fontSize: 12, color: '#64748b' }}>{selectedPreviewImage.location} • {selectedPreviewImage.pillars}</div>
              </div>
              <button onClick={() => setSelectedPreviewImage(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 20, width: 32, height: 32, cursor: 'pointer', color: '#475569', fontSize: 18 }}>✕</button>
            </div>
            <div style={{ borderRadius: 12, overflow: 'hidden', maxHeight: 360, border: '1px solid #cbd5e1' }}>
              <img src={selectedPreviewImage.url} alt={selectedPreviewImage.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
