import React, { useState, useEffect } from 'react';

export default function ViolationsTable({ logs, initialSearchQuery = '' }) {
  const [dateFilter, setDateFilter] = useState(initialSearchQuery ? 'all' : 'today');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
      setDateFilter('all');
    }
  }, [initialSearchQuery]);

  // Filter logs for helmet violations and apply date & search filter
  const violationLogs = (logs || []).filter(l => l.isViolation);

  const filteredLogs = violationLogs.filter(item => {
    // 1. Date Filter
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

    // 2. User & Plate Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const ownerMatch = (item.owner || '').toLowerCase().includes(q);
      const plateMatch = (item.plate || '').toLowerCase().includes(q);
      const vehicleMatch = (item.vehicle || '').toLowerCase().includes(q);
      const gateMatch = (item.gate || '').toLowerCase().includes(q);
      return ownerMatch || plateMatch || vehicleMatch || gateMatch;
    }

    return true;
  });

  const [selectedSnapshot, setSelectedSnapshot] = useState(null);

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div className="card-header-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#ef4444" style={{ verticalAlign: 'middle' }}>
            <path d="M12 2C6.48 2 2 6.48 2 12v3c0 1.66 1.34 3 3 3h1.18c.41 1.16 1.51 2 2.82 2h6c1.31 0 2.41-.84 2.82-2H19c1.66 0 3-1.34 3-3v-3c0-5.52-4.48-10-10-10zm0 2.1c3.85 0 7.03 2.76 7.77 6.4H12V4.1zM4.23 10.5C4.97 6.86 8.15 4.1 12 4.1v6.4H4.23zM4 12.5h7v3.5H5c-.55 0-1-.45-1-1v-2.5zm16 2.5c0 .55-.45 1-1 1h-6v-3.5h7v2.5z"/>
          </svg>
          <span>Helmet Violation Log & Audit Trail</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* User Search Input Box */}
          <div className="search-box">
            <i className="ri-search-line"></i>
            <input 
              type="text" 
              placeholder="Search User or Plate..." 
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
            {filteredLogs.length} Violations Logged
          </span>
        </div>
      </div>

      <div className="table-container">
        {(!filteredLogs || filteredLogs.length === 0) ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
            <i className="ri-shield-check-line" style={{ fontSize: 36, color: '#059669', display: 'block', marginBottom: 12 }}></i>
            <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>No Helmet Violations Found</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>No motorcycle helmet violations match the selected date filter.</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Incident ID</th>
                <th>Time</th>
                <th>Plate Number</th>
                <th>Rider / Owner</th>
                <th>Location Gate</th>
                <th>AI Violation Detail</th>
                <th>CCTV Snapshot</th>
                <th>Penalty Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((item, i) => {
                const rawUrl = item.imageUrl || item.image_url || item.snapshot_base64 || item.snapshotUrl || item.image || item.photo || item.cctv_image_url || item.snapshot_url;
                const cleanUrl = typeof rawUrl === 'string' ? rawUrl.trim() : '';
                const hasPhoto = Boolean(
                  cleanUrl &&
                  cleanUrl.length > 15 &&
                  cleanUrl !== '-' &&
                  cleanUrl !== 'null' &&
                  cleanUrl !== 'undefined' &&
                  !cleanUrl.endsWith('base64,') &&
                  !cleanUrl.endsWith('base64')
                );
                const snapshotUrl = hasPhoto
                  ? ((cleanUrl.startsWith('http') || cleanUrl.startsWith('data:')) ? cleanUrl : `http://${window.location.hostname}:8000${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`)
                  : null;
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>LOG-V{String(i + 1).padStart(3, '0')}</td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{item.time}</td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>
                      {item.plate} {item.province && !item.plate.includes(item.province) ? item.province : ''}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.owner}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{item.vehicle}</div>
                    </td>
                    <td style={{ color: '#0f172a', fontWeight: 500 }}>{item.gate}</td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>
                      {item.violationType?.replace(' (-10 pts)', '') || 'No Helmet'}
                    </td>
                    <td>
                      {hasPhoto ? (
                        <button 
                          className="btn btn-secondary btn-sm" 
                          style={{ color: '#0f172a', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: 11, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          onClick={() => {
                            setModalImageError(false);
                            setSelectedSnapshot({ ...item, snapshotUrl });
                          }}
                        >
                          <i className="ri-image-line" style={{ color: '#0f172a' }}></i> View Photo
                        </button>
                      ) : (
                        <span style={{ color: '#0f172a', fontWeight: 600 }}>-</span>
                      )}
                    </td>
                    <td style={{ color: '#0f172a', fontWeight: 600 }}>
                      -10 Safety Points
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
        <div
          onClick={() => setSelectedSnapshot(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
          }}
        >
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: 540, padding: 24, borderRadius: 20, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: 17, fontWeight: 800 }}>
                  <span>CCTV Helmet Violation Evidence</span>
                </h3>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {(() => {
                    let d = new Date();
                    if (selectedSnapshot.rawDate) d = new Date(selectedSnapshot.rawDate);
                    else if (selectedSnapshot.timestamp) d = new Date(selectedSnapshot.timestamp);
                    const day = String(d.getDate()).padStart(2, '0');
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const year = d.getFullYear();
                    const dateStr = !isNaN(d.getTime()) ? `${day}/${month}/${year}` : new Date().toLocaleDateString('en-GB');
                    return `${dateStr} • ${selectedSnapshot.time || ''}`;
                  })()}
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
            {selectedSnapshot.snapshotUrl && !modalImageError ? (
              <div style={{ borderRadius: 14, overflow: 'hidden', border: '2px solid #e2e8f0', background: '#f8fafc', marginBottom: 16 }}>
                <img 
                  src={selectedSnapshot.snapshotUrl} 
                  alt="CCTV Helmet Violation" 
                  onError={() => setModalImageError(true)}
                  style={{ width: '100%', height: 260, objectFit: 'cover', display: 'block' }}
                />
              </div>
            ) : (
              <div style={{ borderRadius: 14, overflow: 'hidden', border: '2px solid #e2e8f0', background: '#f8fafc', height: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: 8, marginBottom: 16 }}>
                <i className="ri-image-off-line" style={{ fontSize: 36 }}></i>
                <span style={{ fontSize: 13, fontWeight: 600 }}>No CCTV Snapshot Available</span>
              </div>
            )}

            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#991b1b' }}>
                  Plate: {selectedSnapshot.plate} {selectedSnapshot.province && !selectedSnapshot.plate?.includes(selectedSnapshot.province) ? selectedSnapshot.province : ''}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#991b1b', marginTop: 2 }}>Gate: {selectedSnapshot.gate || 'Gate 1'}</div>
                <div style={{ fontSize: 12, color: '#b91c1c', marginTop: 2 }}>Violation: No Helmet Worn (AI Confidence: 98.4%)</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#dc2626' }}>-10 pts</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
