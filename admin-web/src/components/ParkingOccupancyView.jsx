import React from 'react';

export default function ParkingOccupancyView({ parkingOccupancy, logs }) {
  const { available = 12, occupied = 6, total = 18, rate = 33.3 } = parkingOccupancy || {};

  // Calculate live ratio estimates from recent scan logs
  const carScans = logs.filter(l => l.vehicle && l.vehicle.includes('🚗')).length;
  const motoScans = logs.filter(l => l.vehicle && l.vehicle.includes('🛵')).length;
  const totalScans = carScans + motoScans || 1;
  const estCars = Math.round((carScans / totalScans) * occupied);
  const estMotos = Math.max(0, occupied - estCars);

  const getStatusBadge = () => {
    if (rate >= 85) {
      return { label: 'CRITICAL / NEARLY FULL', badgeClass: 'badge-danger', color: '#ef4444' };
    } else if (rate >= 50) {
      return { label: 'MODERATE OCCUPANCY', badgeClass: 'badge-warning', color: '#d97706' };
    }
    return { label: 'SPOTS AVAILABLE', badgeClass: 'badge-live', color: '#059669' };
  };

  const statusInfo = getStatusBadge();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Overview KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <div className="kpi-card" style={{ background: '#ffffff', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Total Capacity</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              <i className="ri-building-2-line"></i>
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', marginTop: 10 }}>{total} <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>Spots</span></div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>VEMS Smart Building</div>
        </div>

        <div className="kpi-card" style={{ background: '#ffffff', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Currently Occupied</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              <i className="ri-car-fill"></i>
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#d97706', marginTop: 10 }}>{occupied} <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>Vehicles</span></div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Parked inside building</div>
        </div>

        <div className="kpi-card" style={{ background: '#ffffff', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Available Spots</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#dcfce7', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              <i className="ri-checkbox-circle-line"></i>
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#059669', marginTop: 10 }}>{available} <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>Open</span></div>
          <div style={{ fontSize: 12, color: '#059669', fontWeight: 600, marginTop: 4 }}>Ready for entry</div>
        </div>

        <div className="kpi-card" style={{ background: '#ffffff', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Fill Rate</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f3e8ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              <i className="ri-pie-chart-line"></i>
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', marginTop: 10 }}>{rate}%</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Building load index</div>
        </div>
      </div>

      {/* Main Building Status Card */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="ri-building-line" style={{ color: '#2563eb' }}></i>
              VEMS Building Live Occupancy Status
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748b' }}>
              Real-time entry/exit barrier counting & AI Gate LPR synchronization
            </p>
          </div>
          <span className={`badge ${statusInfo.badgeClass}`} style={{ fontSize: 13, padding: '6px 14px' }}>
            ● {statusInfo.label}
          </span>
        </div>

        {/* Big Progress Gauge Bar */}
        <div style={{ background: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, fontWeight: 700, color: '#334155' }}>
            <span>Building Capacity Utilization</span>
            <span>{occupied} of {total} Occupied ({rate}%)</span>
          </div>
          <div style={{ height: 16, width: '100%', background: '#e2e8f0', borderRadius: 10, overflow: 'hidden', display: 'flex' }}>
            <div style={{
              width: `${rate}%`,
              background: rate >= 85 ? 'linear-gradient(90deg, #ef4444, #dc2626)' : (rate >= 50 ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 'linear-gradient(90deg, #10b981, #059669)'),
              transition: 'width 0.5s ease',
              borderRadius: 10
            }}></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                <i className="ri-car-line"></i>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Estimated Automobiles Parked</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{estCars} Cars</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                <i className="ri-motorbike-line"></i>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Estimated Motorcycles Parked</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{estMotos} Motorcycles</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Building Floor Specifications & Allocation Rules */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ marginTop: 0, fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>
          <i className="ri-layout-grid-line" style={{ color: '#4f46e5', marginRight: 8 }}></i>
          Building Zones Allocation & Specifications
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 14, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>Zone A</span>
              <span className="badge badge-live">Cars Only</span>
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>Ground Floor - Automobile Deck</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Design Capacity: 6 Spots</div>
          </div>

          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 14, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>Zone B</span>
              <span className="badge badge-warning">Motorcycles</span>
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>Floor 1 - Two-Wheeler Deck</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Design Capacity: 6 Spots</div>
          </div>

          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 14, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>Zone C</span>
              <span className="badge badge-secondary">Staff & Faculty</span>
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>Floor 2 - Reserved Deck</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Design Capacity: 6 Spots</div>
          </div>
        </div>
      </div>
    </div>
  );
}
