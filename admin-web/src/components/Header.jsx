import React from 'react';

export default function Header({ pageTitle, pageSubtitle, onTriggerScan }) {
  return (
    <header class="top-header">
      <div class="header-left">
        <h1 class="page-title">{pageTitle}</h1>
        <p class="page-subtitle">{pageSubtitle}</p>
      </div>

      <div class="header-right">
        <div class="status-indicator">
          <span class="dot pulse-green"></span>
          <span>FastAPI Backend: <strong>Connected (8000)</strong></span>
        </div>

        <button class="btn btn-primary" onClick={onTriggerScan}>
          <i class="ri-rfid-line"></i>
          <span>Simulate Gate Detection</span>
        </button>

        <div class="icon-btn" title="System Notifications">
          <i class="ri-notification-3-line"></i>
          <span class="notification-badge"></span>
        </div>
      </div>
    </header>
  );
}
