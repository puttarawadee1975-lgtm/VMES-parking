import React, { useState } from 'react';

export default function Sidebar({ activeTab, setActiveTab, onClearViolationFilter }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div
          className="brand-logo"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Click to Expand Sidebar" : "VMES Parking"}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <img src="/logo.png" alt="VMES Logo" style={{ width: 44, height: 44, objectFit: 'contain', display: 'block' }} />
        </div>
        {!isCollapsed && (
          <div className="brand-text">
            <h2>VMES Parking</h2>
            <span>ADMIN CONSOLE</span>
          </div>
        )}

        <button
          className="collapse-toggle-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label="Toggle Sidebar"
        >
          <i className={isCollapsed ? 'ri-indent-increase' : 'ri-indent-decrease'}></i>
        </button>
      </div>

      <nav className="sidebar-menu">
        {!isCollapsed && <div className="menu-label">Main Dashboard</div>}
        <button
          onClick={() => setActiveTab('overview')}
          className={`menu-item ${activeTab === 'overview' ? 'active' : ''}`}
          title="Dashboard"
        >
          <i className="ri-dashboard-3-line"></i>
          {!isCollapsed && <span>Dashboard</span>}
        </button>
        <button
          onClick={() => setActiveTab('live-camera')}
          className={`menu-item ${activeTab === 'live-camera' ? 'active' : ''}`}
          title="Gate Camera"
        >
          <i className="ri-camera-lens-line"></i>
          {!isCollapsed && <span>Gate Camera</span>}
        </button>
        <button
          onClick={() => {
            if (onClearViolationFilter) onClearViolationFilter();
            setActiveTab('access-history');
          }}
          className={`menu-item ${activeTab === 'access-history' ? 'active' : ''}`}
          title="Gate Access & Violation History"
        >
          <i className="ri-history-line"></i>
          {!isCollapsed && <span>Gate Access & Violation History</span>}
        </button>
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`menu-item ${activeTab === 'vehicles' ? 'active' : ''}`}
          title="Vehicle Directory"
        >
          <i className="ri-car-line"></i>
          {!isCollapsed && <span>Vehicle Directory</span>}
        </button>

        {!isCollapsed && <div className="menu-label">Safety & Security</div>}
        <button
          onClick={() => setActiveTab('safety-scores')}
          className={`menu-item ${activeTab === 'safety-scores' ? 'active' : ''}`}
          title="Driving Score"
        >
          <i className="ri-speed-up-line"></i>
          {!isCollapsed && <span>Driving Score</span>}
        </button>

        {!isCollapsed && <div className="menu-label">Operations</div>}
        <button
          onClick={() => setActiveTab('parking-map')}
          className={`menu-item ${activeTab === 'parking-map' ? 'active' : ''}`}
          title="Building Occupancy"
        >
          <i className="ri-building-2-line"></i>
          {!isCollapsed && <span>Building Occupancy</span>}
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`menu-item ${activeTab === 'announcements' ? 'active' : ''}`}
          title="Announcements"
        >
          <i className="ri-megaphone-line"></i>
          {!isCollapsed && <span>Announcements</span>}
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="user-pill" title={isCollapsed ? "Chief Security Officer #01" : ""}>
          <div className="avatar">SEC</div>
          {!isCollapsed && (
            <div className="user-info">
              <div className="user-name">Chief Security</div>
              <div className="user-role">Officer #01</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
