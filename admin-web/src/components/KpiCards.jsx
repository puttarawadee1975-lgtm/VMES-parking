import React from 'react';

export default function KpiCards({ totalScans, violationsCount, availableSpots, occupiedRate }) {
  return (
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon blue">
          <i class="ri-scan-2-line"></i>
        </div>
        <div class="kpi-details">
          <span class="kpi-title">Total Today's Gate Scans</span>
          <h3 class="kpi-value">{totalScans.toLocaleString()}</h3>
          <span class="kpi-sub green"><i class="ri-arrow-up-line"></i> +12.4% vs yesterday</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon red">
          <i class="ri-error-warning-line"></i>
        </div>
        <div class="kpi-details">
          <span class="kpi-title">Helmet Violations Caught</span>
          <h3 class="kpi-value">{violationsCount.toLocaleString()}</h3>
          <span class="kpi-sub red"><i class="ri-shield-cross-line"></i> 11.3% violation rate</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon emerald">
          <i class="ri-parking-box-line"></i>
        </div>
        <div class="kpi-details">
          <span class="kpi-title">Available Parking Spots</span>
          <h3 class="kpi-value">{availableSpots}</h3>
          <span class="kpi-sub text-muted">VEMS Building (Zone A & B)</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon purple">
          <i class="ri-car-fill"></i>
        </div>
        <div class="kpi-details">
          <span class="kpi-title">Occupied Spot Rate</span>
          <h3 class="kpi-value">{occupiedRate}%</h3>
          <span class="kpi-sub text-muted">18 spots occupied</span>
        </div>
      </div>
    </div>
  );
}
