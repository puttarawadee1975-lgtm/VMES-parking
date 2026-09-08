import React from 'react';

export default function ScoresTable({ vehicles, onAdjustScore }) {
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
              <th>Student / Driver</th>
              <th>Student ID</th>
              <th>Current Safety Score</th>
              <th>Status</th>
              <th>Last Violation</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((item, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 700, color: '#0f172a' }}>{item.owner}</td>
                <td style={{ color: '#64748b', fontWeight: 500 }}>{item.id}</td>
                <td style={{ fontWeight: 900, fontSize: '16px', color: item.score >= 90 ? '#059669' : '#dc2626' }}>
                  {item.score} / 100
                </td>
                <td>
                  <span className={`badge ${item.score >= 90 ? 'badge-live' : 'badge-danger'}`}>
                    {item.score >= 90 ? 'Perfect / Good' : 'Warning'}
                  </span>
                </td>
                <td style={{ color: item.isViolation ? '#dc2626' : '#64748b', fontWeight: 600 }}>
                  {item.isViolation ? 'No Helmet (-10 pts)' : 'None (Compliant)'}
                </td>
                <td>
                  <button className="btn btn-secondary btn-sm" style={{ marginRight: 6 }} onClick={() => onAdjustScore(item.owner, -10)}>
                    Deduct -10
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => onAdjustScore(item.owner, 10)}>
                    Restore +10
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
