import React, { useState } from 'react';

export default function Sidebar({ activeTab, setActiveTab, onClearViolationFilter, adminUser, onLogout }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <>
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

          {!isCollapsed && <div className="menu-label" style={{ marginTop: 16 }}>Safety & Security</div>}
          <button
            onClick={() => setActiveTab('safety-scores')}
            className={`menu-item ${activeTab === 'safety-scores' ? 'active' : ''}`}
            title="Driving Score"
          >
            <i className="ri-speed-up-line"></i>
            {!isCollapsed && <span>Driving Score</span>}
          </button>

          {!isCollapsed && <div className="menu-label" style={{ marginTop: 16 }}>Operations</div>}
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

        {/* Sidebar Footer: User Name and Logout Button */}
        <div className="sidebar-footer">
          <div
            className="user-pill"
            title={adminUser?.name || "Chief Security Officer #01"}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              width: '100%',
              gap: 8,
              padding: isCollapsed ? '10px 8px' : '10px 14px'
            }}
          >
            {!isCollapsed && (
              <div
                className="user-name"
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flex: 1
                }}
              >
                {adminUser?.name || 'Chief Security Officer #01'}
              </div>
            )}

            {onLogout && (
              <button
                type="button"
                onClick={handleLogoutClick}
                title="Sign Out / Logout"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  cursor: 'pointer',
                  fontSize: 15,
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fca5a5'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
              >
                <i className="ri-logout-box-r-line"></i>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: 20
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 24,
            padding: '28px 28px 24px 28px',
            maxWidth: 380,
            width: '100%',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
            border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              margin: '0 auto 16px auto'
            }}>
              <i className="ri-logout-box-r-line"></i>
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
              Confirm Logout?
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
              Are you sure you want to sign out?
            </p>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 14,
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 14,
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
                  transition: 'all 0.2s ease'
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
