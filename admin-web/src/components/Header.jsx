import React from 'react';

export default function Header({ pageTitle, pageSubtitle, onTriggerScan }) {
  return (
    <header className="top-header">
      <div className="header-left">
        <h1 className="page-title">{pageTitle}</h1>
        <p className="page-subtitle">{pageSubtitle}</p>
      </div>

      <div className="header-right">
        <div className="status-indicator">
          <span className="dot pulse-green"></span>
          <span>FastAPI Backend: <strong style={{ color: '#059669' }}>Connected (8000)</strong></span>
        </div>

        <button className="btn btn-primary" onClick={onTriggerScan}>
          <i className="ri-rfid-line"></i>
          <span>Simulate Gate Detection</span>
        </button>

        <div className="icon-btn" title="System Notifications">
          <i className="ri-notification-3-line"></i>
          <span className="notification-badge"></span>
        </div>
      </div>
    </header>
  );
}
