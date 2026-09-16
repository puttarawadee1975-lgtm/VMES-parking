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

const SEMESTER_DATA = {
  '2026-1': {
    label: 'Semester 1 / 2026 (Current Term)',
    period: '15 Aug 2026 – 20 Dec 2026',
    totalScans: 14820,
    violationsCount: 146,
    complianceRate: '98.9%',
    avgSafetyScore: 94,
    noHelmetCount: 99,
    overtimeCount: 47,
    gate1Percent: 58,
    gate2Percent: 42,
    monthlyTrend: [
      { month: 'Aug', traffic: 2840, violations: 32 },
      { month: 'Sep', traffic: 3450, violations: 41 },
      { month: 'Oct', traffic: 3100, violations: 28 },
      { month: 'Nov', traffic: 3220, violations: 25 },
      { month: 'Dec', traffic: 2210, violations: 20 },
    ]
  },
  '2025-2': {
    label: 'Semester 2 / 2025',
    period: '05 Jan 2026 – 22 May 2026',
    totalScans: 16450,
    violationsCount: 182,
    complianceRate: '98.5%',
    avgSafetyScore: 92,
    noHelmetCount: 124,
    overtimeCount: 58,
    gate1Percent: 61,
    gate2Percent: 39,
    monthlyTrend: [
      { month: 'Jan', traffic: 3120, violations: 42 },
      { month: 'Feb', traffic: 3540, violations: 38 },
      { month: 'Mar', traffic: 3680, violations: 45 },
      { month: 'Apr', traffic: 2980, violations: 29 },
      { month: 'May', traffic: 3130, violations: 28 },
    ]
  },
  '2025-1': {
    label: 'Semester 1 / 2025',
    period: '15 Aug 2025 – 19 Dec 2025',
    totalScans: 15200,
    violationsCount: 204,
    complianceRate: '98.2%',
    avgSafetyScore: 90,
    noHelmetCount: 142,
    overtimeCount: 62,
    gate1Percent: 55,
    gate2Percent: 45,
    monthlyTrend: [
      { month: 'Aug', traffic: 2950, violations: 48 },
      { month: 'Sep', traffic: 3610, violations: 52 },
      { month: 'Oct', traffic: 3280, violations: 41 },
      { month: 'Nov', traffic: 3160, violations: 36 },
      { month: 'Dec', traffic: 2200, violations: 27 },
    ]
  },
  '2024-2': {
    label: 'Semester 2 / 2024',
    period: '06 Jan 2025 – 23 May 2025',
    totalScans: 14100,
    violationsCount: 220,
    complianceRate: '98.0%',
    avgSafetyScore: 89,
    noHelmetCount: 155,
    overtimeCount: 65,
    gate1Percent: 59,
    gate2Percent: 41,
    monthlyTrend: [
      { month: 'Jan', traffic: 2800, violations: 50 },
      { month: 'Feb', traffic: 3200, violations: 48 },
      { month: 'Mar', traffic: 3400, violations: 54 },
      { month: 'Apr', traffic: 2600, violations: 38 },
      { month: 'May', traffic: 2100, violations: 30 },
    ]
  }
};

export default function LiveOverviewDashboard({
  totalScans,
  violationsCount,
  parkingOccupancy,
  logs,
  vehicles,
  onNavigate,
  handleTriggerScan
}) {
  const [selectedTerm, setSelectedTerm] = useState('2026-1');
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
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

  const currentTermData = useMemo(() => {
    return SEMESTER_DATA[selectedTerm] || SEMESTER_DATA['2026-1'];
  }, [selectedTerm]);

  // Compute metrics from vehicles data
  const highRiskDrivers = useMemo(() => {
    return (vehicles || [])
      .filter(v => (v.score ?? 100) < 70)
      .sort((a, b) => (a.score ?? 100) - (b.score ?? 100));
  }, [vehicles]);

  const avgSafetyScore = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return currentTermData.avgSafetyScore;
    const sum = vehicles.reduce((acc, v) => acc + (v.score ?? 100), 0);
    return Math.round(sum / vehicles.length);
  }, [vehicles, currentTermData]);

  // Filter logs for display table
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

  const maxTrafficInTrend = useMemo(() => {
    return Math.max(...currentTermData.monthlyTrend.map(m => m.traffic), 4000);
  }, [currentTermData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Term Selector & Control Header Bar */}
      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        border: '1px solid #e2e8f0',
        padding: '16px 24px',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            fontSize: 22
          }}>
            <i className="ri-calendar-event-line"></i>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Select Academic Term Summary
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: 10,
                  padding: '6px 14px',
                  fontSize: 14,
                  fontWeight: 800,
                  color: '#0f172a',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {Object.keys(SEMESTER_DATA).map(key => (
                  <option key={key} value={key}>
                    {SEMESTER_DATA[key].label}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', background: '#f1f5f9', padding: '4px 10px', borderRadius: 8 }}>
                📅 {currentTermData.period}
              </span>
            </div>
          </div>
        </div>


      </div>

      {/* Top 4 Term Summary KPI Cards */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {/* Card 1: Term Gate Traffic */}
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
            justify: 'center',
            flexShrink: 0
          }}>
            <i className="ri-scan-2-line" style={{ color: '#2563eb', fontSize: 24 }}></i>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Term Gate Traffic</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              {currentTermData.totalScans.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Total Gate Scans in Term</div>
          </div>
        </div>

        {/* Card 2: Term Violations */}
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
            justify: 'center',
            flexShrink: 0
          }}>
            <i className="ri-error-warning-line" style={{ color: '#dc2626', fontSize: 24 }}></i>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Term Violations</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              {currentTermData.violationsCount.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
              Helmet & Overtime Incidents
            </div>
          </div>
        </div>

        {/* Card 3: Term Compliance Rate */}
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
            justify: 'center',
            flexShrink: 0
          }}>
            <i className="ri-checkbox-circle-line" style={{ color: '#059669', fontSize: 24 }}></i>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Term Compliance Rate</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              {currentTermData.complianceRate}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
              Compliant Campus Entries
            </div>
          </div>
        </div>

        {/* Card 4: Avg Driver Safety Score */}
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
            justify: 'center',
            flexShrink: 0
          }}>
            <i className="ri-shield-line" style={{ color: '#7c3aed', fontSize: 24 }}></i>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Avg. Term Safety Score</div>
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

        {/* Left Column (68%): Term Monthly Trends & Gate Access Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Monthly Trend Visual Breakdown */}
          <div className="card" style={{
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #e2e8f0',
            padding: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                  Monthly Traffic & Violation Breakdown ({selectedTerm})
                </h3>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  Monthly gate scans vs safety violations across the selected semester
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, fontWeight: 700 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#2563eb' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: '#2563eb' }}></span> Gate Scans
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#dc2626' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: '#dc2626' }}></span> Violations
                </span>
              </div>
            </div>

            {/* Bar Chart Visual */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${currentTermData.monthlyTrend.length}, 1fr)`, gap: 16, height: 180, alignItems: 'flex-end', paddingTop: 20 }}>
              {currentTermData.monthlyTrend.map((m, idx) => {
                const trafficHeightPercent = Math.round((m.traffic / maxTrafficInTrend) * 100);
                const violationHeightPercent = Math.min(100, Math.round((m.violations / 60) * 100));

                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ display: 'flex', items: 'flex-end', gap: 6, height: '80%', alignItems: 'flex-end', width: '100%', justifyContent: 'center' }}>
                      {/* Traffic Bar */}
                      <div style={{
                        width: 22,
                        height: `${trafficHeightPercent}%`,
                        background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)',
                        borderRadius: '6px 6px 0 0',
                        position: 'relative'
                      }} title={`Traffic: ${m.traffic} scans`}>
                      </div>

                      {/* Violation Bar */}
                      <div style={{
                        width: 22,
                        height: `${violationHeightPercent}%`,
                        background: 'linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)',
                        borderRadius: '6px 6px 0 0',
                        position: 'relative'
                      }} title={`Violations: ${m.violations}`}>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{m.month}</div>
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: -4 }}>{m.traffic} scans</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Gate Access & Audit Table */}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                  Gate Access & Audit Log Summary
                </h3>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  Real-time & recent CCTV gate detection records
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="search-box" style={{ width: 220 }}>
                  <i className="ri-search-line"></i>
                  <input
                    type="text"
                    placeholder="Search plate or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onNavigate && onNavigate('access-history')}
                  style={{ fontSize: 12, padding: '6px 12px' }}
                >
                  View All History →
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569' }}>Time</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569' }}>Plate Number</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569' }}>Vehicle & Owner</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569' }}>Violation</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569' }}>Gate</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700, color: '#475569' }}>CCTV Photo</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>
                        No gate access records found for search filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((item, idx) => {
                      const isCar = (item.vehicle || '').toLowerCase().includes('car');
                      const snapshotUrl = item.imageUrl || item.image || (isCar
                        ? 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80'
                        : 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80');

                      return (
                        <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>{item.time}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                            {item.plate} {item.province && !item.plate?.includes(item.province) ? item.province : ''}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.owner}</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>{item.vehicle}</div>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ color: '#0f172a', fontWeight: 600 }}>
                              {item.isViolation
                                ? (isCar ? 'Parked >30 Mins' : 'No Helmet')
                                : '-'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 500, color: '#0f172a' }}>{item.gate}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ color: '#0f172a', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: 11, padding: '4px 10px' }}
                              onClick={() => setSelectedSnapshot({ ...item, snapshotUrl })}
                            >
                              View Photo
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (30%): Term Analytics & Breakdown Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Card 1: Term Violation Types Breakdown */}
          <div className="card" style={{
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #e2e8f0',
            padding: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
              Term Violation Types Breakdown
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  <span style={{ color: '#0f172a' }}>No Helmet Violations</span>
                  <span style={{ color: '#dc2626' }}>68% ({currentTermData.noHelmetCount} Incidents)</span>
                </div>
                <div style={{ width: '100%', height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: '68%', height: '100%', background: '#dc2626', borderRadius: 4 }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  <span style={{ color: '#0f172a' }}>VMES Car Overtime (&gt;30 Mins)</span>
                  <span style={{ color: '#2563eb' }}>32% ({currentTermData.overtimeCount} Incidents)</span>
                </div>
                <div style={{ width: '100%', height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: '32%', height: '100%', background: '#2563eb', borderRadius: 4 }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Term Gate Traffic Distribution */}
          <div className="card" style={{
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #e2e8f0',
            padding: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
              Term Gate Traffic Distribution
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Gate 1 (Entry Gate)</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{currentTermData.gate1Percent}%</span>
              </div>
              <div style={{ width: '100%', height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${currentTermData.gate1Percent}%`, height: '100%', background: '#059669' }}></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Gate 2 (Exit Gate)</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{currentTermData.gate2Percent}%</span>
              </div>
              <div style={{ width: '100%', height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${currentTermData.gate2Percent}%`, height: '100%', background: '#2563eb' }}></div>
              </div>
            </div>
          </div>

          {/* Card 3: At-Risk Student Drivers (Term Summary) */}
          <div className="card" style={{
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #e2e8f0',
            padding: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                Drivers Needing Safety Review
              </h4>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onNavigate && onNavigate('safety-scores')}
                style={{ fontSize: 11, padding: '2px 8px' }}
              >
                View Scores
              </button>
            </div>

            {highRiskDrivers.length === 0 ? (
              <div style={{ fontSize: 12, color: '#64748b', textAlign: 'center', padding: '16px 0' }}>
                ✅ All student drivers are above 70 safety points!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {highRiskDrivers.slice(0, 3).map((v, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fef2f2', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: 10 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#991b1b' }}>{v.owner || 'Student Driver'}</div>
                      <div style={{ fontSize: 11, color: '#b91c1c' }}>{v.plate} • {v.model}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#dc2626' }}>
                      {v.score ?? 100} pts
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 4: Official Campus Announcements */}
          <div className="card" style={{
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #e2e8f0',
            padding: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                Campus Announcements
              </h4>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onNavigate && onNavigate('announcements')}
                style={{ fontSize: 11, padding: '2px 8px' }}
              >
                Manage
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {announcements.slice(0, 2).map((anc, i) => (
                <div key={anc.id || i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 10, borderRadius: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{anc.title}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{anc.content}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
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
                  <span>CCTV Gate Access Snapshot</span>
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
            <div style={{ borderRadius: 14, overflow: 'hidden', border: '2px solid #e2e8f0', background: '#000000', marginBottom: 16 }}>
              <img
                src={selectedSnapshot.snapshotUrl}
                alt="CCTV Gate Entry Snapshot"
                style={{ width: '100%', height: 260, objectFit: 'cover', display: 'block' }}
              />
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                Plate: {selectedSnapshot.plate} {selectedSnapshot.province && !selectedSnapshot.plate?.includes(selectedSnapshot.province) ? selectedSnapshot.province : ''}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginTop: 4 }}>
                Gate: {selectedSnapshot.gate}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginTop: 2 }}>
                Owner: {selectedSnapshot.owner}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
