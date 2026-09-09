import React from 'react';

export default function Header({ pageTitle, pageSubtitle }) {
  return (
    <header className="top-header">
      <div className="header-left">
        <h1 className="page-title">{pageTitle}</h1>
        <p className="page-subtitle">{pageSubtitle}</p>
      </div>

      <div className="header-right">
        <div className="icon-btn" title="System Notifications">
          <i className="ri-notification-3-line"></i>
          <span className="notification-badge"></span>
        </div>
      </div>
    </header>
  );
}
