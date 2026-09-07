import React, { useState } from 'react';

export default function VehiclesTable({ vehicles }) {
  const [search, setSearch] = useState('');

  const filtered = vehicles.filter(v => 
    v.plate.toLowerCase().includes(search.toLowerCase()) ||
    v.owner.toLowerCase().includes(search.toLowerCase()) ||
    v.id.toLowerCase().includes(search.toLowerCase()) ||
    v.vehicle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div class="card">
      <div class="card-header">
        <div class="card-header-title">
          <i class="ri-car-line"></i>
          <span>Registered Vehicles & Campus Passes</span>
        </div>
        <div class="header-actions">
          <div class="search-box">
            <i class="ri-search-line"></i>
            <input 
              type="text" 
              placeholder="Search by Plate, ID, or Owner..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button class="btn btn-primary" onClick={() => alert('Add Vehicle Modal Triggered')}>
            <i class="ri-add-line"></i> Register Vehicle
          </button>
        </div>
      </div>

      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Owner Name</th>
              <th>Role / ID</th>
              <th>License Plate</th>
              <th>Vehicle Details</th>
              <th>Safety Score</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 700, color: '#ffffff' }}>{item.owner}</td>
                <td><span style={{ color: '#94a3b8' }}>{item.role} ({item.id})</span></td>
                <td><span class="plate-tag">{item.plate} {item.province}</span></td>
                <td>{item.vehicle}</td>
                <td style={{ fontWeight: 900, color: item.score >= 90 ? '#10b981' : '#f59e0b' }}>
                  {item.score}/100
                </td>
                <td><span class="badge badge-live">APPROVED</span></td>
                <td>
                  <button class="btn btn-secondary btn-sm" onClick={() => alert(`Revoke pass for ${item.plate}`)}>
                    Revoke
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
