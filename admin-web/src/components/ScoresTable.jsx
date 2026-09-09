import React, { useState } from 'react';

export default function ScoresTable({ vehicles, logs = [], onAdjustScore, onViewViolations }) {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleOpenHistory = async (item) => {
    setSelectedStudent(item);
    setLoadingHistory(true);
    try {
      // 1. Fetch score adjustment audit logs from backend
      const res = await fetch('http://localhost:8000/admin/score-logs');
      let apiScoreLogs = [];
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          apiScoreLogs = data.filter(log => 
            (log.user_email && item.ownerEmail && log.user_email.toLowerCase() === item.ownerEmail.toLowerCase()) ||
            (log.owner && log.owner === item.owner)
          );
        }
      }

      // 2. Also map any live detection violations for this user/plate
      const userDetectionLogs = (logs || []).filter(l => 
        (l.owner && l.owner === item.owner) ||
        (l.plate && item.plate && l.plate.includes(item.plate))
      ).map((l, index) => ({
        id: `DET-LOG-${index + 1}`,
        timestamp: l.time || 'Today',
        reason: l.isViolation ? 'AI Detection: Motorcycle No Helmet Violation' : 'AI Gate Inspection: Compliant',
        points_changed: l.isViolation ? -10 : 0,
        gate_name: l.gate || 'Gate 1 (Main Entrance)',
        new_score: l.isViolation ? Math.max(0, item.score - 10) : item.score
      }));

      // Combine both sources
      const combined = [...apiScoreLogs, ...userDetectionLogs];
      
      // If empty, create a default initial registration record
      if (combined.length === 0) {
        combined.push({
          id: 'INIT-LOG-001',
          timestamp: 'Initial Registration',
          reason: 'Initial Safety Score Allocation',
          points_changed: 0,
          gate_name: 'System Admin',
          new_score: 100
        });
      }

      setHistoryLogs(combined);
    } catch (e) {
      console.warn('Error fetching score history:', e);
      setHistoryLogs([{
        id: 'INIT-LOG-001',
        timestamp: 'Initial Registration',
        reason: 'Initial Safety Score Allocation (Default)',
        points_changed: 0,
        gate_name: 'System Admin',
        new_score: item.score || 100
      }]);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-title">
          <i className="ri-speed-up-line"></i>
          <span>Driver Safety Score & Penalty Enforcement</span>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>Current Safety Score</th>
              <th>Last Violation</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((item, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 700, color: '#0f172a' }}>{item.id}</td>
                <td style={{ fontWeight: 700, color: '#0f172a' }}>{item.owner}</td>
                <td style={{ fontWeight: 900, fontSize: '16px', color: item.score <= 50 ? '#dc2626' : '#0f172a' }}>
                  {item.score} / 100
                </td>
                <td>
                  {item.isViolation ? (
                    <div>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>No Helmet (-10 pts)</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                        {item.lastViolationDate || item.time || '09/09/2026 • 09:15'}
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: '#64748b', fontWeight: 500 }}>None (Compliant)</span>
                  )}
                </td>
                <td>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    style={{ color: '#0f172a', border: '1px solid #cbd5e1', background: '#f8fafc' }} 
                    onClick={() => onViewViolations ? onViewViolations(item.owner) : handleOpenHistory(item)}
                  >
                    <i className="ri-search-line"></i> View Violations
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Driver Score Audit History Modal */}
      {selectedStudent && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="card" style={{ width: 620, maxHeight: '85vh', padding: 24, borderRadius: 20, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', display: 'flex', flexDirection: 'column' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="ri-history-line" style={{ color: '#2563eb' }}></i>
                  <span>Driver Score History</span>
                </h3>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                  Comprehensive history of penalties, deductions, and restorations
                </div>
              </div>
              <button 
                onClick={() => setSelectedStudent(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, color: '#94a3b8', cursor: 'pointer', padding: 4 }}
              >
                <i className="ri-close-line"></i>
              </button>
            </div>

            {/* Student Info Profile Banner */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>{selectedStudent.owner}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  Student ID: <strong style={{ color: '#2563eb' }}>{selectedStudent.id}</strong> • Plate: <strong>{selectedStudent.plate}</strong>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Current Score</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: selectedStudent.score >= 90 ? '#059669' : '#dc2626' }}>
                  {selectedStudent.score} / 100
                </div>
              </div>
            </div>

            {/* History Table Content */}
            <div style={{ overflowY: 'auto', flex: 1, border: '1px solid #e2e8f0', borderRadius: 12 }}>
              {loadingHistory ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                  <i className="ri-loader-4-line spin" style={{ fontSize: 28, color: '#2563eb', display: 'block', marginBottom: 8 }}></i>
                  Loading score audit logs...
                </div>
              ) : historyLogs.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                  <i className="ri-shield-check-line" style={{ fontSize: 32, color: '#059669', display: 'block', marginBottom: 8 }}></i>
                  No deduction or restoration logs recorded yet.
                </div>
              ) : (
                <table className="table" style={{ margin: 0, fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th>Time / ID</th>
                      <th>Reason / Action</th>
                      <th>Location</th>
                      <th>Change</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyLogs.map((log, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600, color: '#475569', fontSize: 12 }}>
                          {log.timestamp || log.time || 'N/A'}
                        </td>
                        <td style={{ fontWeight: 600, color: '#0f172a' }}>
                          {log.reason}
                        </td>
                        <td style={{ color: '#64748b', fontSize: 12 }}>
                          {log.gate_name || 'Gate 1'}
                        </td>
                        <td>
                          <span className={`badge ${log.points_changed < 0 ? 'badge-danger' : (log.points_changed > 0 ? 'badge-live' : '')}`} style={{
                            background: log.points_changed < 0 ? '#fef2f2' : (log.points_changed > 0 ? '#ecfdf5' : '#f1f5f9'),
                            color: log.points_changed < 0 ? '#dc2626' : (log.points_changed > 0 ? '#059669' : '#64748b'),
                            fontWeight: 700
                          }}>
                            {log.points_changed > 0 ? `+${log.points_changed}` : log.points_changed} pts
                          </span>
                        </td>
                        <td style={{ fontWeight: 800, color: '#0f172a' }}>
                          {log.new_score ?? 100}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setSelectedStudent(null)}
                style={{ padding: '8px 18px', fontWeight: 600 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

