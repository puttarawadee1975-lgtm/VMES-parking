import React from 'react';

export default function InspectionTable({ logs }) {
  return (
    <div class="card">
      <div class="card-header">
        <div class="card-header-title">
          <i class="ri-list-check-2"></i>
          <span>Real-Time Access & Inspection Feed</span>
        </div>
        <span class="text-muted text-xs">Auto-scrolls on new event</span>
      </div>

      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Plate Number</th>
              <th>Vehicle</th>
              <th>Helmet Check</th>
              <th>Gate</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((item, index) => (
              <tr key={index}>
                <td style={{ fontWeight: 700 }}>{item.time}</td>
                <td><span class="plate-tag">{item.plate} {item.province}</span></td>
                <td>{item.vehicle}</td>
                <td>
                  <span class={`badge ${item.isViolation ? 'badge-danger' : 'badge-live'}`}>
                    {item.isViolation ? '⚠️ ' + item.helmet : '🛡️ ' + item.helmet}
                  </span>
                </td>
                <td>{item.gate}</td>
                <td>
                  <span style={{ color: item.isViolation ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                    {item.isViolation ? 'Penalized (-10)' : 'Pass Granted'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
