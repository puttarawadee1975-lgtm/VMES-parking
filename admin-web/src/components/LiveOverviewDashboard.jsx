import React, { useState, useEffect, useMemo } from 'react';

const SAMPLE_ANNOUNCEMENTS = [
  {
    id: 'ANC-01',
    title: 'Zone B Parking Maintenance Notice',
    content: 'Zone B motorcycle parking area floor repainting scheduled for Sept 18.',
    priority: 'high',
    date: '14/09/2026',
    target_audience: 'all'
  },
  {
    id: 'ANC-02',
    title: 'Mandatory Helmet Safety Enforcement',
    content: 'Security officers will penalize non-helmet riders entering Gate 1.',
    priority: 'normal',
    date: '12/09/2026',
    target_audience: 'all_students'
  }
];

export default function LiveOverviewDashboard({
  totalScans,
  violationsCount,
  parkingOccupancy,
  logs,
  vehicles,
  onNavigate,
  handleTriggerScan
}) {
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [announcements, setAnnouncements] = useState(SAMPLE_ANNOUNCEMENTS);

  useEffect(() => {
    fetch('http://localhost:8000/admin/announcements')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAnnouncements(data);
        }
      })
      .catch(() => { });
  }, []);

  // Trigger Gate Scan wrapper with visual feedback
  const triggerScan = async (gateType) => {
    setIsSimulating(true);
    if (handleTriggerScan) {
      await handleTriggerScan(gateType);
    }
    setTimeout(() => setIsSimulating(false), 500);
  };

  // Compute metrics from vehicles data
  const safeDriversCount = useMemo(() => {
    return (vehicles || []).filter(v => (v.score ?? 100) >= 90).length;
  }, [vehicles]);

  const cautionDriversCount = useMemo(() => {
    return (vehicles || []).filter(v => (v.score ?? 100) >= 70 && (v.score ?? 100) < 90).length;
  }, [vehicles]);

  const highRiskDrivers = useMemo(() => {
    return (vehicles || [])
      .filter(v => (v.score ?? 100) < 70)
      .sort((a, b) => (a.score ?? 100) - (b.score ?? 100));
  }, [vehicles]);

  const avgSafetyScore = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return 100;
    const sum = vehicles.reduce((acc, v) => acc + (v.score ?? 100), 0);
    return Math.round(sum / vehicles.length);
  }, [vehicles]);

  // Filter logs for real-time display table
  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    if (!searchQuery.trim()) return logs.slice(0, 7);

    const q = searchQuery.toLowerCase().trim();
    return logs.filter(l =>
      (l.owner || '').toLowerCase().includes(q) ||
      (l.plate || '').toLowerCase().includes(q) ||
      (l.vehicle || '').toLowerCase().includes(q) ||
      (l.gate || '').toLowerCase().includes(q)
    ).slice(0, 7);
  }, [logs, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top 4 KPI Summary Cards */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {/* Card 1: Today's Gate Traffic */}
        <div className="kpi-card" style={{
          background: '#ffffff',
          padding: '20px 24px',
          borderRadius: 20,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: '#eff6ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <i className="ri-scan-2-line" style={{ color: '#2563eb', fontSize: 24 }}></i>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Today's Gate Traffic</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              {(totalScans || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Total Scans (In & Out)</div>
          </div>
        </div>

        {/* Card 2: Helmet Violations Caught */}
        <div className="kpi-card" style={{
          background: '#ffffff',
          padding: '20px 24px',
          borderRadius: 20,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: '#fef2f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <i className="ri-error-warning-line" style={{ color: '#dc2626', fontSize: 24 }}></i>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Helmet Violations Caught</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              {(violationsCount || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
              Live Helmet Violation
            </div>
          </div>
        </div>

        {/* Card 3: Available Parking Spots */}
        <div className="kpi-card" style={{
          background: '#ffffff',
          padding: '20px 24px',
          borderRadius: 20,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: '#ecfdf5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <i className="ri-parking-box-fill" style={{ color: '#059669', fontSize: 24 }}></i>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Available Parking Spots</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              {parkingOccupancy?.available ?? 12}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
              Building Deck (18 Car Spots)
            </div>
          </div>
        </div>

        {/* Card 4: Registered Vehicles & Safety */}
        <div className="kpi-card" style={{
          background: '#ffffff',
          padding: '20px 24px',
          borderRadius: 20,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: '#f3e8ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <i className="ri-shield-user-line" style={{ color: '#7c3aed', fontSize: 24 }}></i>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Avg. Driver Safety Score</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              {avgSafetyScore} <span style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>/ 100</span>
            </div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
              {(vehicles || []).length} Registered Vehicles
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area: 2 Columns Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '68% 30%', gap: 20 }}>

        {/* Left Column (68%): Live Gate Scans Feed Table */}
        <div className="card" style={{
          background: '#ffffff',
          borderRadius: 20,
          border: '1px solid #e2e8f0',
          padding: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="ri-history-line" style={{ color: '#2563eb', fontSize: 20 }}></i>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                  Gate Access & Violation History
                </h3>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  Real-time optical plate recognition & helmet enforcement
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

              <button
                className="btn btn-secondary btn-sm"
                style={{
                  color: '#2563eb',
                  border: '1px solid #bfdbfe',
                  background: '#eff6ff',
                  fontWeight: 700,
                  fontSize: 12,
                  padding: '6px 12px',
                  borderRadius: 10,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer'
                }}
                onClick={() => onNavigate && onNavigate('access-history')}
              >
                View All History <i className="ri-arrow-right-line"></i>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b', fontSize: 12 }}>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>DATE</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>TIME</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>PLATE NUMBER</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>VEHICLE & OWNER</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>HELMET CHECK</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>GATE</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>SNAPSHOT</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textCenter: 'center', padding: 24, color: '#94a3b8' }}>
                      No gate detection scans available.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((item, index) => {
                    const isCar = (item.vehicle || '').toLowerCase().includes('car');
                    const snapshotUrl = item.imageUrl || item.image || (isCar
                      ? 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80'
                      : 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80');

                    const isNoHelmet = String(item.helmet || '').toUpperCase().includes('NO HELMET');
                    const isPassHelmet = String(item.helmet || '').toUpperCase().includes('PASS') || String(item.helmet || '').toUpperCase().includes('WORN');

                    const formattedDate = (() => {
                      let d = new Date();
                      if (item.rawDate) d = new Date(item.rawDate);
                      else if (item.timestamp) d = new Date(item.timestamp);
                      const day = String(d.getDate()).padStart(2, '0');
                      const month = String(d.getMonth() + 1).padStart(2, '0');
                      const year = d.getFullYear();
                      return !isNaN(d.getTime()) ? `${day}/${month}/${year}` : new Date().toLocaleDateString('en-GB');
                    })();

                    return (
                      <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px', fontWeight: 600, color: '#64748b', fontSize: 12 }}>{formattedDate}</td>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#0f172a' }}>{item.time}</td>
                        <td style={{ padding: '12px', fontWeight: 800, color: '#0f172a' }}>
                          {item.plate}
                          {item.province && !item.plate.includes(item.province) ? (
                            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500, marginLeft: 4 }}>{item.province}</span>
                          ) : null}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.owner}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{item.vehicle}</div>
                        </td>
                        <td>
                          <span style={{
                            color: String(item.helmet || '').toUpperCase().includes('NO HELMET')
                              ? '#dc2626'
                              : (String(item.helmet || '').toUpperCase().includes('PASS') || String(item.helmet || '').toUpperCase().includes('WORN') ? '#059669' : '#0f172a'),
                            fontWeight: 700
                          }}>
                            {item.helmet}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: '#334155', fontWeight: 600 }}>{item.gate}</td>
                        <td style={{ padding: '12px' }}>
                          <button
                            onClick={() => setSelectedSnapshot({ ...item, snapshotUrl })}
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              color: '#0f172a',
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '4px 10px',
                              borderRadius: 8,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <i className="ri-image-line" style={{ color: '#0f172a' }}></i> View Photo
                          </button>
                        </td>
                        <td style={{ padding: '12px' }}>
                          {item.isViolation ? (
                            <span style={{ color: '#dc2626', fontWeight: 800, fontSize: 12 }}>
                              Penalized (-10 pts)
                            </span>
                          ) : (
                            <span style={{ color: '#059669', fontWeight: 800, fontSize: 12 }}>
                              Pass Granted
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (30%): Operations & Live Status Widgets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Widget 1: Building Parking Occupancy Live Status */}
          <div style={{
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #e2e8f0',
            padding: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="ri-parking-box-line" style={{ color: '#2563eb', fontSize: 18 }}></i>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                  Building Parking Load
                </h4>
              </div>
            </div>

            {/* Capacity Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
                <span>{parkingOccupancy?.occupied ?? 6} Occupied</span>
                <span>({parkingOccupancy?.total ?? 18} Total)</span>
              </div>
              <div style={{ width: '100%', height: 10, borderRadius: 10, background: '#e2e8f0', overflow: 'hidden' }}>
                <div style={{
                  width: `${parkingOccupancy?.rate ?? 33.3}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
                  borderRadius: 10,
                  transition: 'width 0.5s ease'
                }}></div>
              </div>
            </div>

            {/* Quick Breakdown Badges */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Available Cars</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#2563eb', marginTop: 2 }}>
                  {parkingOccupancy?.available ?? 12} <span style={{ fontSize: 11, color: '#64748b' }}>spots</span>
                </div>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Motorcycles Inside</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#2563eb', marginTop: 2 }}>
                  3 <span style={{ fontSize: 11, color: '#64748b' }}>active</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate && onNavigate('parking-map')}
              style={{
                width: '100%',
                background: '#eff6ff',
                border: 'none',
                color: '#2563eb',
                borderRadius: 12,
                padding: '10px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              Inspect Building Zones <i className="ri-arrow-right-line"></i>
            </button>
          </div>

          {/* Widget 2: Campus Announcements & Notices */}
          <div style={{
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #e2e8f0',
            padding: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="ri-megaphone-line" style={{ color: '#2563eb', fontSize: 18 }}></i>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                  Announcements
                </h4>
              </div>
              <span style={{
                background: '#2563eb',
                color: '#ffffff',
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: 12
              }}>
                {announcements.length} Active Notices
              </span>
            </div>

            {/* List of Announcements */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {announcements.slice(0, 2).map((anc, idx) => (
                <div key={anc.id || idx} style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: 13, color: '#0f172a' }}>{anc.title}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#0f172a' }}>
                      {anc.priority === 'high' ? 'High Priority' : 'Normal'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#0f172a', lineHeight: 1.4 }}>
                    {anc.content}
                  </div>
                  <div style={{ fontSize: 11, color: '#0f172a', fontWeight: 500, marginTop: 2 }}>
                    Posted: {anc.date || 'Recent'} • Target: {anc.target_audience === 'all' ? 'All Users' : 'Students'}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigate && onNavigate('announcements')}
              style={{
                width: '100%',
                background: '#eff6ff',
                border: 'none',
                color: '#2563eb',
                borderRadius: 12,
                padding: '10px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              Manage Campus Announcements <i className="ri-arrow-right-line"></i>
            </button>
          </div>

        </div>


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
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: 17, fontWeight: 800 }}>
                  CCTV Gate Access Snapshot
                </h3>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {selectedSnapshot.time} • {selectedSnapshot.gate || 'Gate 1 (Main Entrance)'}
                </div>
              </div>
              <button
                onClick={() => setSelectedSnapshot(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <i className="ri-close-line"></i>
              </button>
            </div>

            <div style={{ position: 'relative', width: '100%', height: 280, borderRadius: 14, overflow: 'hidden', marginBottom: 16, border: '1px solid #e2e8f0' }}>
              <img
                src={selectedSnapshot.snapshotUrl}
                alt="CCTV Gate Snapshot"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute', bottom: 12, left: 12,
                background: 'rgba(15, 23, 42, 0.85)', color: '#ffffff',
                padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                backdropFilter: 'blur(4px)'
              }}>
                <i className="ri-shield-check-fill" style={{ color: '#10b981', marginRight: 6 }}></i>
                AI Plate Detected: {selectedSnapshot.plate}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: 11, display: 'block' }}>Vehicle & Owner</span>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>{selectedSnapshot.owner}</span>
                <div style={{ fontSize: 11, color: '#64748b' }}>{selectedSnapshot.vehicle}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: 11, display: 'block' }}>Helmet Enforcement</span>
                <span style={{
                  fontWeight: 800,
                  color: String(selectedSnapshot.helmet).includes('NO HELMET') ? '#dc2626' : '#059669'
                }}>
                  {selectedSnapshot.helmet}
                </span>
                <div style={{ fontSize: 11, color: selectedSnapshot.isViolation ? '#dc2626' : '#059669', fontWeight: 700 }}>
                  {selectedSnapshot.isViolation ? 'Penalized (-10 pts)' : 'Pass Granted'}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedSnapshot(null)}
                style={{
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '8px 20px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Close Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
