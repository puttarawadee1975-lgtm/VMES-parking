import React from 'react';

export default function Header({ pageTitle, pageSubtitle }) {
  return (
    <header className="top-header">
      <div className="header-left">
        <h1 className="page-title">{pageTitle}</h1>
        <p className="page-subtitle">{pageSubtitle}</p>
      </div>

      <div className="header-right"></div>
    </header>
  );
}
