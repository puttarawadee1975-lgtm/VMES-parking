import React from 'react';

export default function ScoresTable({ vehicles, onAdjustScore }) {
  return (
    <div class="card">
      <div class="card-header">
        <div class="card-header-title">
          <i class="ri-speed-up-line"></i>
          <span>Driver Safety Score & Penalty Enforcement</span>
        </div>
      </div>

      <div class="table-container">
        <table class="table">
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
                <td style={{ fontWeight: 700, color: '#ffffff' }}>{item.owner}</td>
                <td>{item.id}</td>
                <td style={{ fontWeight: 900, fontSize: '16px', color: item.score >= 90 ? '#10b981' : '#ef4444' }}>
                  {item.score} / 100
                </td>
                <td>
                  <span class={`badge ${item.score >= 90 ? 'badge-live' : 'badge-danger'}`}>
                    {item.score >= 90 ? 'Perfect / Good' : 'Warning'}
                  </span>
                </td>
                <td>{item.isViolation ? 'No Helmet (-10 pts)' : 'None (Compliant)'}</td>
                <td>
                  <button class="btn btn-secondary btn-sm" style={{ marginRight: 6 }} onClick={() => onAdjustScore(item.owner, -10)}>
                    Deduct -10
                  </button>
                  <button class="btn btn-secondary btn-sm" onClick={() => onAdjustScore(item.owner, 10)}>
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
