import React, { useState } from 'react';

export default function InspectionTable({ logs }) {
  const [dateFilter, setDateFilter] = useState('today');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredLogs = (logs || []).filter(item => {
    if (!item.rawDate && !item.timestamp) {
      return dateFilter === 'today' || dateFilter === 'all';
    }
    const itemDate = item.rawDate ? new Date(item.rawDate) : (item.timestamp ? new Date(item.timestamp) : new Date());
    const today = new Date();

    if (dateFilter === 'today') {
      return itemDate.toDateString() === today.toDateString();
    }
    if (dateFilter === 'yesterday') {
      const yest = new Date(today);
      yest.setDate(yest.getDate() - 1);
      return itemDate.toDateString() === yest.toDateString();
    }
    if (dateFilter === 'custom' && selectedDate) {
      const [year, month, day] = selectedDate.split('-').map(Number);
      return itemDate.getFullYear() === year && (itemDate.getMonth() + 1) === month && itemDate.getDate() === day;
    }
    if (dateFilter === 'all') {
      return true;
    }
    return true;
  });

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="card-header-title">
          <i className="ri-list-check-2"></i>
          <span>Real-Time Access & Inspection Feed</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
        </div>
      </div>

      <div className="table-container">
        {(!filteredLogs || filteredLogs.length === 0) ? (
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
                <th>Access Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((item, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: 700, color: '#2563eb' }}>{item.time}</td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>{item.plate} {item.province && !item.plate.includes(item.province) ? item.province : ''}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.owner}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{item.vehicle}</div>
                  </td>
                  <td>
                    <span className={`badge ${item.isViolation ? 'badge-danger' : 'badge-live'}`}>
                      {item.helmet}
                    </span>
                  </td>
                  <td style={{ color: '#334155', fontWeight: 500 }}>{item.gate}</td>
                  <td>
                    <span style={{ color: item.isViolation ? '#dc2626' : '#059669', fontWeight: 700 }}>
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
