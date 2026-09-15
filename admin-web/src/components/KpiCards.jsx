import React from 'react';

export default function KpiCards({ totalScans, violationsCount, availableSpots, occupiedRate }) {
  return (
    <div className="kpi-grid">
      <div className="kpi-card">
        <div className="kpi-icon blue">
          <i className="ri-scan-2-line"></i>
        </div>
        <div className="kpi-details">
          <span className="kpi-title">Today's Gate Traffic (In & Out)</span>
          <h3 className="kpi-value">{totalScans.toLocaleString()}</h3>
          <span className="kpi-sub text-muted">Live detection records</span>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-icon red">
          <i className="ri-error-warning-line"></i>
        </div>
        <div className="kpi-details">
          <span className="kpi-title">Helmet Violations Caught</span>
          <h3 className="kpi-value">{violationsCount.toLocaleString()}</h3>
          <span className="kpi-sub red">
  <i className="ri-shield-cross-line"></i>{' '}
  {totalScans > 0 ? ((violationsCount / totalScans) * 100).toFixed(1) : '0.0'}% violation rate
</span>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-icon emerald">
          <i className="ri-parking-box-line"></i>
        </div>
        <div className="kpi-details">
          <span className="kpi-title">Available Parking Spots</span>
          <h3 className="kpi-value">{availableSpots}</h3>
          <span className="kpi-sub text-muted">Campus Building (18 Car Spots)</span>
        </div>
      </div>
    </div>
  );
}
