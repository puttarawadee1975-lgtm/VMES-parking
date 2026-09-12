import React from 'react';

export default function Sidebar({ activeTab, setActiveTab, onClearViolationFilter }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">
          <i className="ri-shield-keyhole-fill"></i>
        </div>
        <div className="brand-text">
          <h2>AU SmartPark</h2>
          <span>ADMIN CONSOLE</span>
        </div>
      </div>

      <nav className="sidebar-menu">
        <div className="menu-label">Main Dashboard</div>
        <button 
          onClick={() => setActiveTab('overview')} 
          className={`menu-item ${activeTab === 'overview' ? 'active' : ''}`}
        >
          <i className="ri-dashboard-3-line"></i>
          <span>Live Overview</span>
        </button>
        <button 
          onClick={() => setActiveTab('live-camera')} 
          className={`menu-item ${activeTab === 'live-camera' ? 'active' : ''}`}
        >
          <i className="ri-camera-lens-line"></i>
          <span>Gate Camera</span>
        </button>
        <button 
          onClick={() => {
            if (onClearViolationFilter) onClearViolationFilter();
            setActiveTab('access-history');
          }} 
          className={`menu-item ${activeTab === 'access-history' ? 'active' : ''}`}
        >
          <i className="ri-history-line"></i>
          <span>Gate Access & Violation History</span>
        </button>
        <button 
          onClick={() => setActiveTab('vehicles')} 
          className={`menu-item ${activeTab === 'vehicles' ? 'active' : ''}`}
        >
          <i className="ri-car-line"></i>
          <span>Vehicle Directory</span>
        </button>

        <div className="menu-label">Safety & Security</div>
        <button 
          onClick={() => setActiveTab('safety-scores')} 
          className={`menu-item ${activeTab === 'safety-scores' ? 'active' : ''}`}
        >
          <i className="ri-speed-up-line"></i>
          <span>Driving Scores</span>
        </button>

        <div className="menu-label">Operations</div>
        <button 
          onClick={() => setActiveTab('parking-map')} 
          className={`menu-item ${activeTab === 'parking-map' ? 'active' : ''}`}
        >
          <i className="ri-building-2-line"></i>
          <span>Building Occupancy</span>
        </button>
        <button 
          onClick={() => setActiveTab('announcements')} 
          className={`menu-item ${activeTab === 'announcements' ? 'active' : ''}`}
        >
          <i className="ri-megaphone-line"></i>
          <span>Announcements</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="user-pill">
          <div className="avatar">SEC</div>
          <div className="user-info">
            <div className="user-name">Chief Security</div>
            <div className="user-role">Officer #01</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
