import React from 'react';

export default function Header({ pageTitle, pageSubtitle, enforcementActive = true, onToggleEnforcement }) {
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
        {/* Master Penalty Deduction System Toggle Switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, backgroundColor: enforcementActive ? '#f0fdf4' : '#fffbeb', border: `1px solid ${enforcementActive ? '#bbf7d0' : '#fef08a'}`, padding: '6px 14px', borderRadius: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: 11, fontWeight: '800', color: enforcementActive ? '#15803d' : '#b45309', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Parking Access Mode
            </span>
            <span style={{ fontSize: 10, fontWeight: '800', color: enforcementActive ? '#16a34a' : '#d97706', letterSpacing: '0.5px' }}>
              {enforcementActive ? 'ON' : 'PAUSED'}
            </span>
          </div>

          <button
            onClick={onToggleEnforcement}
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              backgroundColor: enforcementActive ? '#22c55e' : '#cbd5e1',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background-color 0.2s ease',
              padding: 2
            }}
            title={enforcementActive ? 'Click to toggle Free Parking Mode' : 'Click to enable Automatic Point Deductions'}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                position: 'absolute',
                top: 2,
                left: enforcementActive ? 22 : 2,
                transition: 'left 0.2s ease'
              }}
            />
          </button>
        </div>
      </div>
    </header>
  );
}
