import React from 'react';

export const ACADEMIC_TERMS = {
  '2026-1': { label: 'Semester 1 / 2026', period: '01 Jun 2026 – 31 Oct 2026', hasData: true }
};

export default function Header({ pageTitle, pageSubtitle, selectedTerm = '2026-1', onSelectTerm }) {
  return (
    <header className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <img src="/logo.png" alt="VMES Logo" style={{ width: 44, height: 44, objectFit: 'contain', display: 'block' }} />
        <div>
          <h1 className="page-title" style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px', lineHeight: 1.1, margin: 0 }}>{pageTitle}</h1>
          <p className="page-subtitle" style={{ fontSize: 14, color: '#64748b', marginTop: 4, fontWeight: 500, margin: 0 }}>{pageSubtitle}</p>
        </div>
      </div>

      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Academic Term Selector Dropdown (Replaces Parking Access Mode Toggle) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          padding: '6px 14px',
          borderRadius: 20,
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18
          }}>
            <i className="ri-calendar-event-line"></i>
          </div>

          <select
            value={selectedTerm}
            onChange={(e) => onSelectTerm && onSelectTerm(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 14,
              fontWeight: 800,
              color: '#0f172a',
              cursor: 'pointer',
              outline: 'none',
              paddingRight: 8
            }}
          >
            {Object.keys(ACADEMIC_TERMS)
              .filter(key => ACADEMIC_TERMS[key].hasData !== false)
              .map(key => (
                <option key={key} value={key}>
                  {ACADEMIC_TERMS[key].label.replace(/\s*\(.*?\)/g, '')}
                </option>
              ))}
          </select>
        </div>
      </div>
    </header>
  );
}
