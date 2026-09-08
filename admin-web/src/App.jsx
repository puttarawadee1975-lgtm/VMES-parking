import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import KpiCards from './components/KpiCards';
import CameraStream from './components/CameraStream';
import InspectionTable from './components/InspectionTable';
import VehiclesTable from './components/VehiclesTable';
import ScoresTable from './components/ScoresTable';
import AnalyticsCharts from './components/AnalyticsCharts';

const INITIAL_VEHICLES = [
  { plate: '1กข 1234', province: 'กรุงเทพมหานคร', vehicle: '🛵 Honda PCX 160 (Black)', helmet: 'Pass (Worn)', isViolation: false, gate: 'Gate 1 (Main Entrance)', owner: 'Thanaphat S.', id: '65070042', role: 'Student', score: 98, ownerEmail: '65070042@student.university.ac.th' },
  { plate: '3กฮ 5678', province: 'กรุงเทพมหานคร', vehicle: '🛵 Yamaha Grand Filano (Gray)', helmet: 'NO HELMET', isViolation: true, gate: 'Gate 1 (Main Entrance)', owner: 'Nattapong K.', id: '65070118', role: 'Student', score: 80, ownerEmail: '65070118@student.university.ac.th' },
  { plate: '9กข 9999', province: 'สมุทรปราการ', vehicle: '🚗 Toyota Camry (White)', helmet: 'N/A (Automobile)', isViolation: false, gate: 'Gate 2 (East Entrance)', owner: 'Dr. Somchai P.', id: 'SEC-01', role: 'Staff', score: 100, ownerEmail: 'somchai@university.ac.th' },
  { plate: '2กข 4321', province: 'นนทบุรี', vehicle: '🛵 Vespa Sprint 150 (White)', helmet: 'Pass (Worn)', isViolation: false, gate: 'Gate 1 (Main Entrance)', owner: 'Chayanan T.', id: '65070244', role: 'Student', score: 100, ownerEmail: '65070244@student.university.ac.th' },
  { plate: '5กษ 8888', province: 'กรุงเทพมหานคร', vehicle: '🚗 Honda Civic (Black)', helmet: 'N/A (Automobile)', isViolation: false, gate: 'Gate 2 (East Entrance)', owner: 'Pattarapon M.', id: '65070399', role: 'Student', score: 95, ownerEmail: '65070399@student.university.ac.th' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [vehicles, setVehicles] = useState(INITIAL_VEHICLES);
  const [totalScans, setTotalScans] = useState(1284);
  const [violationsCount, setViolationsCount] = useState(146);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [parkingOccupancy, setParkingOccupancy] = useState({ available: 12, occupied: 6, total: 18, rate: 33.3 });

  const [logs, setLogs] = useState([]);

  // Fetch real data from Backend FastAPI
  const fetchBackendData = useCallback(async () => {
    try {
      // 1. Fetch Detections
      const resDet = await fetch('http://localhost:8000/detections');
      if (resDet.ok) {
        const dataDet = await resDet.json();
        if (Array.isArray(dataDet)) {
          const transformedLogs = dataDet.map(item => {
            const dateObj = item.timestamp ? new Date(item.timestamp) : new Date();
            const timeStr = dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const isV = item.violation || false;
            const hText = item.vehicle_type === 'car' ? 'N/A (Automobile)' : (item.helmet_detected ? 'Pass (Worn)' : 'NO HELMET');
            const gateName = item.gate_type ? (item.gate_type.includes('Gate') ? item.gate_type : `Gate 1 (${item.gate_type})`) : 'Gate 1 (Main Entrance)';
            return {
              id: item.id,
              time: timeStr,
              plate: item.license_plate || 'Unregistered',
              province: item.province || 'กรุงเทพมหานคร',
              vehicle: `${item.vehicle_type === 'car' ? '🚗 Car' : '🛵 Motorcycle'}`,
              owner: item.matched_user || 'Guest / Unregistered',
              helmet: hText,
              isViolation: isV,
              gate: gateName,
              zone: item.zone || 'Zone A'
            };
          });
          setLogs(transformedLogs);
          if (transformedLogs.length > 0) {
            setTotalScans(prev => Math.max(prev, transformedLogs.length));
            setViolationsCount(prev => Math.max(prev, transformedLogs.filter(l => l.isViolation).length));
          }
        }
      }
    } catch (e) {
      console.log('Backend connection notice (detections):', e.message);
    }
    
    try {
      // 2. Fetch Parking Status
      const resPark = await fetch('http://localhost:8000/parking/status');
      if (resPark.ok) {
        const zones = await resPark.json();
        if (Array.isArray(zones) && zones.length > 0) {
          let total = 0;
          let occupied = 0;
          zones.forEach(z => {
            total += z.total_slots || 0;
            occupied += z.occupied_slots || 0;
          });
          const available = Math.max(0, total - occupied);
          const rate = total > 0 ? parseFloat(((occupied / total) * 100).toFixed(1)) : 0;
          setParkingOccupancy({ available, occupied, total, rate });
        }
      }
    } catch (e) {
      console.log('Backend connection notice (parking):', e.message);
    }

    try {
      // 3. Fetch Vehicles from Backend (Exact MongoDB Registered Vehicles)
      const resVeh = await fetch('http://localhost:8000/admin/all-vehicles');
      if (resVeh.ok) {
        const backendVehicles = await resVeh.json();
        if (Array.isArray(backendVehicles)) {
          setVehicles(backendVehicles);
        }
      }
    } catch (e) {
      console.log('Backend connection notice (vehicles):', e.message);
    }
  }, []);


  useEffect(() => {
    fetchBackendData();
    const interval = setInterval(fetchBackendData, 3000);
    return () => clearInterval(interval);
  }, [fetchBackendData]);

  const handleTriggerScan = async (gateType = 'ENTRY') => {
    const nextIdx = (currentIndex + 1) % vehicles.length;
    setCurrentIndex(nextIdx);
    const item = vehicles[nextIdx];

    // Trigger actual backend API call
    try {
      const isCar = item.vehicle.includes('🚗') || item.vehicle.toLowerCase().includes('camry') || item.vehicle.toLowerCase().includes('civic');
      const payload = {
        license_plate: item.plate,
        vehicle_type: isCar ? 'car' : 'motorcycle',
        helmet_detected: isCar ? null : !item.isViolation,
        gate_type: gateType,
        zone: 'Zone A'
      };

      await fetch('http://localhost:8000/detections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      // Refresh state immediately after posting detection
      fetchBackendData();
    } catch (e) {
      console.warn('Scan trigger API notice:', e);
      // Fallback local update
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      setTotalScans(prev => prev + 1);
      if (item.isViolation) setViolationsCount(prev => prev + 1);
      const newLog = {
        time: timeStr,
        plate: item.plate,
        province: item.province,
        vehicle: item.vehicle,
        owner: item.owner || 'Student',
        helmet: item.helmet,
        isViolation: item.isViolation,
        gate: `Gate (${gateType})`
      };
      setLogs(prev => [newLog, ...prev.slice(0, 49)]);
    }
  };

  const handleAdjustScore = async (owner, change) => {
    const targetVeh = vehicles.find(v => v.owner === owner);
    const email = targetVeh?.ownerEmail || '65070042@student.university.ac.th';
    const reason = change < 0 ? 'Admin Manual Deduction (No Helmet Violation)' : 'Admin Score Restoration';

    try {
      await fetch('http://localhost:8000/admin/adjust-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: email,
          points_changed: change,
          reason: reason,
          gate_name: 'Gate 1 (Main Entrance)',
          image_url: 'http://localhost:8000/snapshots/ev_violation_no_helmet.svg'
        })
      });
      fetchBackendData();
    } catch (e) {
      console.warn('API sync warning:', e);
    }

    setVehicles(prev => prev.map(v => {
      if (v.owner === owner) {
        const newScore = Math.min(100, Math.max(0, v.score + change));
        return { ...v, score: newScore };
      }
      return v;
    }));
  };

  const titles = {
    'overview': { title: 'Live Gate & Operations Overview', subtitle: 'Real-time AI License Plate Recognition & Campus Safety Monitor' },
    'live-camera': { title: 'AI Gate Camera Feed Surveillance Grid (ENTRY & EXIT)', subtitle: 'Multi-Gate Real-time CCTV Stream & Optical Character Recognition' },
    'vehicles': { title: 'Registered Vehicles & Campus Passes', subtitle: 'Manage student & staff approved license plates and 1-plate policy rules' },
    'safety-scores': { title: 'Driver Safety Scores & Audit Console', subtitle: '100-point scale enforcement, violation penalties, and score restorations' },
    'violations': { title: 'Helmet Violation Audit Logs', subtitle: 'Comprehensive AI detection history for campus motorcycle safety rules' },
    'parking-map': { title: 'Campus Parking Zone & Spot Inspection', subtitle: 'VEMS Building Zone A, B, C floor occupancy & pillar spots' },
    'analytics': { title: 'Analytics & Traffic Intelligence', subtitle: 'Peak hours traffic distribution, compliance rates, and gate throughput' }
  };

  const currentMeta = titles[activeTab] || titles['overview'];

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="main-content">
        <Header 
          pageTitle={currentMeta.title} 
          pageSubtitle={currentMeta.subtitle}
          onTriggerScan={() => handleTriggerScan('ENTRY')}
        />

        {activeTab === 'overview' && (
          <div>
            <KpiCards 
              totalScans={totalScans} 
              violationsCount={violationsCount} 
              availableSpots={parkingOccupancy.available} 
              occupiedRate={parkingOccupancy.rate} 
            />

            <div style={{ marginTop: 16 }}>
              <InspectionTable logs={logs} />
            </div>
          </div>
        )}

        {activeTab === 'live-camera' && (
          <div className="card">
            <div className="card-header">
              <div className="card-header-title">
                <i className="ri-camera-lens-line"></i>
                <span>Multi-Gate Dual AI CCTV Surveillance (ENTRY & EXIT)</span>
              </div>
              <span className="text-muted text-xs">Live 2-Camera Grid Stream</span>
            </div>

            <div className="grid-2-col gap-16 mt-16" style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <CameraStream 
                gateName="Gate 1 (Main Entrance - ENTRY)"
                camId="CAM-01: ENTRY RAMP"
                gateType="ENTRY"
                currentDetection={logs.find(l => l.gate.includes('ENTRY')) || logs[0]} 
                onTriggerScan={() => handleTriggerScan('ENTRY')} 
              />
              <CameraStream 
                gateName="Gate 2 (East Gate - EXIT)"
                camId="CAM-02: EXIT RAMP"
                gateType="EXIT"
                currentDetection={logs.find(l => l.gate.includes('EXIT'))} 
                onTriggerScan={() => handleTriggerScan('EXIT')} 
              />
            </div>
          </div>
        )}

        {activeTab === 'vehicles' && (
          <VehiclesTable vehicles={vehicles} onRefreshVehicles={fetchBackendData} />
        )}

        {activeTab === 'safety-scores' && (
          <ScoresTable vehicles={vehicles} onAdjustScore={handleAdjustScore} />
        )}

        {activeTab === 'violations' && (
          <div className="card">
            <div className="card-header">
              <div className="card-header-title">
                <i className="ri-alarm-warning-line" style={{ color: '#ef4444' }}></i>
                <span>Helmet Violation Log & Audit Trail</span>
              </div>
              <span className="badge badge-danger" style={{ fontSize: 13, padding: '4px 12px' }}>
                {logs.filter(l => l.isViolation).length} Total Violations Logged
              </span>
            </div>
            <div className="table-container">
              {logs.filter(l => l.isViolation).length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                  <i className="ri-shield-check-line" style={{ fontSize: 36, color: '#10b981', display: 'block', marginBottom: 12 }}></i>
                  <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>No Helmet Violations Detected</div>
                  <div style={{ fontSize: 13 }}>All motorcycle riders scanned at campus gates were wearing helmets.</div>
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Incident ID</th>
                      <th>Time</th>
                      <th>Plate Number</th>
                      <th>Rider / Owner</th>
                      <th>Location Gate</th>
                      <th>AI Violation Detail</th>
                      <th>Penalty Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.filter(l => l.isViolation).map((item, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 700, color: '#ef4444' }}>LOG-V{String(i + 1).padStart(3, '0')}</td>
                        <td style={{ fontWeight: 600, color: '#38bdf8' }}>{item.time}</td>
                        <td><span className="plate-tag">{item.plate} {item.province}</span></td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#f8fafc' }}>{item.owner}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.vehicle}</div>
                        </td>
                        <td>{item.gate}</td>
                        <td>
                          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <i className="ri-close-circle-line"></i> No Helmet Worn
                          </span>
                        </td>
                        <td>
                          <span style={{ color: '#ef4444', fontWeight: 700, fontSize: 13 }}>
                            -10 Safety Points
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'parking-map' && (
          <div className="card">
            <div className="card-header">
              <div className="card-header-title">
                <i className="ri-map-pin-2-line"></i>
                <span>VEMS Building Campus Parking Map & Pillars</span>
              </div>
            </div>

            <div className="zone-grid" style={{ marginTop: 16 }}>
              <div className="zone-card active">
                <div className="zone-title">Zone A (Ground Floor - Cars)</div>
                <div className="zone-count">{Math.min(6, parkingOccupancy.occupied)} / 6 Occupied</div>
                <div className="progress-bar">
                  <div className="progress-fill warning" style={{ width: `${Math.min(100, (parkingOccupancy.occupied / 6) * 100)}%` }}></div>
                </div>
              </div>
              <div className="zone-card">
                <div className="zone-title">Zone B (Floor 1 - Motorcycles)</div>
                <div className="zone-count">4 / 6 Occupied</div>
                <div className="progress-bar"><div className="progress-fill success" style={{ width: '66.6%' }}></div></div>
              </div>
              <div className="zone-card">
                <div className="zone-title">Zone C (Floor 2 - Staff & Cars)</div>
                <div className="zone-count">2 / 6 Occupied</div>
                <div className="progress-bar"><div className="progress-fill success" style={{ width: '33.3%' }}></div></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <AnalyticsCharts />
        )}
      </main>
    </div>
  );
}

