import React, { useState } from 'react';

export default function InspectionTable({ 
  logs, 
  isOverview = false, 
  onViewAllHistory,
  initialSearchQuery = '',
  initialViolationFilter = 'all'
}) {
  const [dateFilter, setDateFilter] = useState('today');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [violationFilter, setViolationFilter] = useState(initialViolationFilter); // 'all' | 'violations_only' | 'pass_only'
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);

  React.useEffect(() => {
    setSearchQuery(initialSearchQuery || '');
    if (initialSearchQuery) {
      setDateFilter('all');
    } else {
      setDateFilter('today');
    }
    setViolationFilter(initialViolationFilter || 'all');
  }, [initialSearchQuery, initialViolationFilter]);

  const filteredLogs = (logs || []).filter(item => {
    if (isOverview) return true;

    // 1. Violation Filter
    if (violationFilter === 'violations_only' && !item.isViolation) return false;
    if (violationFilter === 'pass_only' && item.isViolation) return false;

    // 2. Date Filter
    let dateMatch = true;
    if (item.rawDate || item.timestamp) {
      const itemDate = item.rawDate ? new Date(item.rawDate) : (item.timestamp ? new Date(item.timestamp) : new Date());
      const today = new Date();

      if (dateFilter === 'today') {
        dateMatch = itemDate.toDateString() === today.toDateString();
      } else if (dateFilter === 'yesterday') {
        const yest = new Date(today);
        yest.setDate(yest.getDate() - 1);
        dateMatch = itemDate.toDateString() === yest.toDateString();
      } else if (dateFilter === 'custom' && selectedDate) {
        const [year, month, day] = selectedDate.split('-').map(Number);
        dateMatch = itemDate.getFullYear() === year && (itemDate.getMonth() + 1) === month && itemDate.getDate() === day;
      }
    } else {
      dateMatch = dateFilter === 'today' || dateFilter === 'all';
    }

    if (!dateMatch) return false;

    // 3. User & Plate Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const ownerMatch = (item.owner || '').toLowerCase().includes(q);
      const plateMatch = (item.plate || '').toLowerCase().includes(q);
      const vehicleMatch = (item.vehicle || '').toLowerCase().includes(q);
      const gateMatch = (item.gate || '').toLowerCase().includes(q);
      const idMatch = (item.id || '').toLowerCase().includes(q);
      return ownerMatch || plateMatch || vehicleMatch || gateMatch || idMatch;
    }

    return true;
  });

  const displayLogs = isOverview ? filteredLogs.slice(0, 5) : filteredLogs;

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div className="card-header-title">
          <i className="ri-list-check-2"></i>
          <span>{isOverview ? 'Recent Gate Scans (Live Feed)' : 'Gate Access & Violation History Log'}</span>
        </div>

        {isOverview ? (
          <button 
            className="btn btn-secondary btn-sm" 
            style={{ color: '#0f172a', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={onViewAllHistory}
          >
            <i className="ri-arrow-right-line" style={{ color: '#2563eb' }}></i> View All History
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Search Input Box */}
            <div className="search-box">
              <i className="ri-search-line"></i>
              <input 
                type="text" 
                placeholder="Search User, Plate, or Gate..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ minWidth: 180 }}
              />
              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => setSearchQuery('')}
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

            {/* Violation Filter Dropdown */}
            <select 
              value={violationFilter}
              onChange={(e) => setViolationFilter(e.target.value)}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: '#0f172a',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">All</option>
              <option value="violations_only">Helmet Violations</option>
              <option value="pass_only">Pass Granted</option>
            </select>

            {/* Date Filter Dropdown */}
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: '#0f172a',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="custom">Select Date Calendar...</option>
              <option value="all">All History</option>
            </select>

            {dateFilter === 'custom' && (
              <input 
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  padding: '5px 10px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#0f172a',
                  background: '#ffffff',
                  border: '1px solid #2563eb',
                  borderRadius: 8,
                  outline: 'none'
                }}
              />
            )}

            <span style={{ fontSize: 12, fontWeight: 600, color: '#334155', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 8, padding: '5px 12px' }}>
              {filteredLogs.length} Scans Logged
            </span>
          </div>
        )}
      </div>

      <div className="table-container">
        {(!displayLogs || displayLogs.length === 0) ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
            <i className="ri-radar-line" style={{ fontSize: 36, color: '#2563eb', display: 'block', marginBottom: 12 }}></i>
            <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>No Vehicle Detections Found</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>There are no gate scans matching the selected date filter.</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Plate Number</th>
                <th>Vehicle & Owner</th>
                <th>Helmet Check</th>
                <th>Gate</th>
                <th>CCTV Snapshot</th>
                <th>Access Action</th>
              </tr>
            </thead>
            <tbody>
              {displayLogs.map((item, index) => {
                const isCar = (item.vehicle || '').toLowerCase().includes('car');
                const snapshotUrl = item.imageUrl || item.image || (isCar 
                  ? 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80' 
                  : 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80');

                return (
                  <tr key={index}>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>{item.time}</td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>{item.plate} {item.province && !item.plate.includes(item.province) ? item.province : ''}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.owner}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{item.vehicle}</div>
                    </td>
                    <td>
                      <span style={{ color: item.isViolation ? '#dc2626' : '#059669', fontWeight: 700 }}>
                        {item.helmet}
                      </span>
                    </td>
                    <td style={{ color: '#0f172a', fontWeight: 500 }}>{item.gate}</td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        style={{ color: '#0f172a', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: 11, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        onClick={() => setSelectedSnapshot({ ...item, snapshotUrl })}
                      >
                        <i className="ri-image-line" style={{ color: '#2563eb' }}></i> View Photo
                      </button>
                    </td>
                    <td>
                      <span style={{ color: item.isViolation ? '#dc2626' : '#059669', fontWeight: 700 }}>
                        {item.isViolation ? 'Penalized (-10 pts)' : 'Pass Granted'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Snapshot Preview Modal */}
      {selectedSnapshot && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="card" style={{ width: 540, padding: 24, borderRadius: 20, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: 17, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="ri-camera-lens-line" style={{ color: '#2563eb' }}></i>
                  <span>CCTV Gate Access Snapshot</span>
                </h3>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {selectedSnapshot.gate || 'Gate 1'} • {selectedSnapshot.time || 'Today'}
                </div>
              </div>
              <button 
                onClick={() => setSelectedSnapshot(null)}
                style={{ background: 'none', border: 'none', fontSize: 22, color: '#94a3b8', cursor: 'pointer', padding: 4 }}
              >
                <i className="ri-close-line"></i>
              </button>
            </div>

            {/* Image Frame */}
            <div style={{ borderRadius: 14, overflow: 'hidden', border: '2px solid #e2e8f0', background: '#000000', position: 'relative', marginBottom: 16 }}>
              <img 
                src={selectedSnapshot.snapshotUrl} 
                alt="CCTV Gate Entry Snapshot" 
                style={{ width: '100%', height: 260, objectFit: 'cover', display: 'block' }}
              />
              <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(15, 23, 42, 0.85)', color: '#ffffff', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                Plate: {selectedSnapshot.plate} ({selectedSnapshot.owner})
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 12, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>Gate: {selectedSnapshot.gate}</div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                  Helmet Check: {selectedSnapshot.helmet || 'Pass'}
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: selectedSnapshot.isViolation ? '#dc2626' : '#059669' }}>
                {selectedSnapshot.isViolation ? 'Penalized (-10 pts)' : 'Pass Granted'}
              </div>
            </div>

            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedSnapshot(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
