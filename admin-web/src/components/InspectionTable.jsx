import React from 'react';

export default function InspectionTable({ logs }) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-title">
          <i className="ri-list-check-2"></i>
          <span>Real-Time Access & Inspection Feed</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="dot pulse-green" style={{ width: 8, height: 8 }}></span>
          <span className="text-muted text-xs">Live Backend Stream</span>
        </div>
      </div>

      <div className="table-container">
        {(!logs || logs.length === 0) ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
            <i className="ri-radar-line" style={{ fontSize: 36, color: '#38bdf8', display: 'block', marginBottom: 12 }}></i>
            <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>No Recent Vehicle Detections</div>
            <div style={{ fontSize: 13 }}>Waiting for live AI CCTV camera events from Gate 1 / Mobile Scanners...</div>
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
                <th>Access Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((item, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: 700, color: '#38bdf8' }}>{item.time}</td>
                  <td><span className="plate-tag">{item.plate} {item.province}</span></td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{item.owner}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.vehicle}</div>
                  </td>
                  <td>
                    <span className={`badge ${item.isViolation ? 'badge-danger' : 'badge-live'}`}>
                      {item.helmet}
                    </span>
                  </td>
                  <td>{item.gate}</td>
                  <td>
                    <span style={{ color: item.isViolation ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                      {item.isViolation ? 'Penalized (-10 pts)' : 'Pass Granted'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

