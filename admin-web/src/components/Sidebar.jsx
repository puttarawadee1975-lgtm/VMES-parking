import React from 'react';

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-logo">
          <i class="ri-shield-keyhole-fill"></i>
        </div>
        <div class="brand-text">
          <h2>AU SmartPark</h2>
          <span>ADMIN CONSOLE</span>
        </div>
      </div>

      <nav class="sidebar-menu">
        <div class="menu-label">Main Dashboard</div>
        <button 
          onClick={() => setActiveTab('overview')} 
          class={`menu-item ${activeTab === 'overview' ? 'active' : ''}`}
        >
          <i class="ri-dashboard-3-line"></i>
          <span>Live Overview</span>
        </button>
        <button 
          onClick={() => setActiveTab('live-camera')} 
          class={`menu-item ${activeTab === 'live-camera' ? 'active' : ''}`}
        >
          <i class="ri-camera-lens-line"></i>
          <span>AI Gate Camera</span>
          <span class="badge badge-live">LIVE</span>
        </button>
        <button 
          onClick={() => setActiveTab('vehicles')} 
          class={`menu-item ${activeTab === 'vehicles' ? 'active' : ''}`}
        >
          <i class="ri-car-line"></i>
          <span>Vehicle Directory</span>
        </button>

        <div class="menu-label">Safety & Security</div>
        <button 
          onClick={() => setActiveTab('safety-scores')} 
          class={`menu-item ${activeTab === 'safety-scores' ? 'active' : ''}`}
        >
          <i class="ri-speed-up-line"></i>
          <span>Driving Scores</span>
        </button>
        <button 
          onClick={() => setActiveTab('violations')} 
          class={`menu-item ${activeTab === 'violations' ? 'active' : ''}`}
        >
          <i class="ri-alarm-warning-line"></i>
          <span>Helmet Violations</span>
          <span class="badge badge-danger">3 New</span>
        </button>

        <div class="menu-label">Operations</div>
        <button 
          onClick={() => setActiveTab('parking-map')} 
          class={`menu-item ${activeTab === 'parking-map' ? 'active' : ''}`}
        >
          <i class="ri-map-pin-2-line"></i>
          <span>Zone & Spot Map</span>
        </button>
        <button 
          onClick={() => setActiveTab('analytics')} 
          class={`menu-item ${activeTab === 'analytics' ? 'active' : ''}`}
        >
          <i class="ri-bar-chart-box-line"></i>
          <span>Analytics & Reports</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <div class="user-pill">
          <div class="avatar">SEC</div>
          <div class="user-info">
            <div class="user-name">Chief Security</div>
            <div class="user-role">Officer #01</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
