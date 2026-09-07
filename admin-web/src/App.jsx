import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import KpiCards from './components/KpiCards';
import CameraStream from './components/CameraStream';
import InspectionTable from './components/InspectionTable';
import VehiclesTable from './components/VehiclesTable';
import ScoresTable from './components/ScoresTable';
import AnalyticsCharts from './components/AnalyticsCharts';

const INITIAL_VEHICLES = [
  { plate: '1กข 1234', province: 'กรุงเทพมหานคร', vehicle: '🛵 Honda PCX 160 (Black)', helmet: 'Pass (Worn)', isViolation: false, gate: 'Gate 1 (Main Entrance)', owner: 'Thanaphat S.', id: '65070042', role: 'Student', score: 98 },
  { plate: '3กฮ 5678', province: 'กรุงเทพมหานคร', vehicle: '🛵 Yamaha Grand Filano (Gray)', helmet: 'NO HELMET', isViolation: true, gate: 'Gate 1 (Main Entrance)', owner: 'Nattapong K.', id: '65070118', role: 'Student', score: 80 },
  { plate: '9กข 9999', province: 'สมุทรปราการ', vehicle: '🚗 Toyota Camry (White)', helmet: 'N/A (Automobile)', isViolation: false, gate: 'Gate 2 (East Entrance)', owner: 'Dr. Somchai P.', id: 'SEC-01', role: 'Staff', score: 100 },
  { plate: '2กข 4321', province: 'นนทบุรี', vehicle: '🛵 Vespa Sprint 150 (White)', helmet: 'Pass (Worn)', isViolation: false, gate: 'Gate 1 (Main Entrance)', owner: 'Chayanan T.', id: '65070244', role: 'Student', score: 100 },
  { plate: '5กษ 8888', province: 'กรุงเทพมหานคร', vehicle: '🚗 Honda Civic (Black)', helmet: 'N/A (Automobile)', isViolation: false, gate: 'Gate 2 (East Entrance)', owner: 'Pattarapon M.', id: '65070399', role: 'Student', score: 95 }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [vehicles, setVehicles] = useState(INITIAL_VEHICLES);
  const [totalScans, setTotalScans] = useState(1284);
  const [violationsCount, setViolationsCount] = useState(146);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [logs, setLogs] = useState(() => {
    const now = new Date();
    return INITIAL_VEHICLES.map((item, idx) => ({
      time: new Date(now.getTime() - idx * 180000).toTimeString().split(' ')[0],
      plate: item.plate,
      province: item.province,
      vehicle: item.vehicle,
      helmet: item.helmet,
      isViolation: item.isViolation,
      gate: item.gate
    }));
  });

  const handleTriggerScan = () => {
    const nextIdx = (currentIndex + 1) % vehicles.length;
    setCurrentIndex(nextIdx);
    const item = vehicles[nextIdx];
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    setTotalScans(prev => prev + 1);
    if (item.isViolation) setViolationsCount(prev => prev + 1);

    const newLog = {
      time: timeStr,
      plate: item.plate,
      province: item.province,
      vehicle: item.vehicle,
      helmet: item.helmet,
      isViolation: item.isViolation,
      gate: item.gate
    };

    setLogs(prev => [newLog, ...prev.slice(0, 49)]);
  };

  useEffect(() => {
    const interval = setInterval(handleTriggerScan, 12000);
    return () => clearInterval(interval);
  }, [currentIndex, vehicles]);

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
    'live-camera': { title: 'AI Gate Camera Feed Surveillance', subtitle: 'Multi-Gate Real-time CCTV Stream & Optical Character Recognition' },
    'vehicles': { title: 'Registered Vehicles & Campus Passes', subtitle: 'Manage student & staff approved license plates and 1-plate policy rules' },
    'safety-scores': { title: 'Driver Safety Scores & Audit Console', subtitle: '100-point scale enforcement, violation penalties, and score restorations' },
    'violations': { title: 'Helmet Violation Audit Logs', subtitle: 'Comprehensive AI detection history for campus motorcycle safety rules' },
    'parking-map': { title: 'Campus Parking Zone & Spot Inspection', subtitle: 'VEMS Building Zone A, B, C floor occupancy & pillar spots' },
    'analytics': { title: 'Analytics & Traffic Intelligence', subtitle: 'Peak hours traffic distribution, compliance rates, and gate throughput' }
  };

  const currentMeta = titles[activeTab] || titles['overview'];

  return (
    <div class="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main class="main-content">
        <Header 
          pageTitle={currentMeta.title} 
          pageSubtitle={currentMeta.subtitle}
          onTriggerScan={handleTriggerScan}
        />

        {activeTab === 'overview' && (
          <div>
            <KpiCards 
              totalScans={totalScans} 
              violationsCount={violationsCount} 
              availableSpots={32} 
              occupiedRate={86.2} 
            />

            <div class="grid-2-col">
              <CameraStream 
                currentDetection={logs[0]} 
                onTriggerScan={handleTriggerScan} 
              />
              <InspectionTable logs={logs} />
            </div>
          </div>
        )}

        {activeTab === 'live-camera' && (
          <div class="card">
            <div class="card-header">
              <div class="card-header-title">
                <i class="ri-camera-lens-line"></i>
                <span>Multi-Gate AI CCTV Surveillance Grid</span>
              </div>
            </div>
            <div class="grid-2-col gap-16 mt-16" style={{ marginTop: 16 }}>
              <div class="camera-box-large">
                <CameraStream currentDetection={logs[0]} onTriggerScan={handleTriggerScan} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vehicles' && (
          <VehiclesTable vehicles={vehicles} />
        )}

        {activeTab === 'safety-scores' && (
          <ScoresTable vehicles={vehicles} onAdjustScore={handleAdjustScore} />
        )}

        {activeTab === 'violations' && (
          <div class="card">
            <div class="card-header">
              <div class="card-header-title">
                <i class="ri-alarm-warning-line"></i>
                <span>Helmet Violation Log & Audit Trail</span>
              </div>
            </div>
            <div class="table-container">
              <table class="table">
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>Timestamp</th>
                    <th>Plate Number</th>
                    <th>Location Gate</th>
                    <th>Violation Detail</th>
                    <th>Penalty</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.filter(l => l.isViolation).map((item, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700, color: '#ef4444' }}>LOG-V0{i + 1}</td>
                      <td>{item.time}</td>
                      <td><span class="plate-tag">{item.plate} {item.province}</span></td>
                      <td>{item.gate}</td>
                      <td><span style={{ color: '#ef4444', fontWeight: 700 }}>No Helmet Detected</span></td>
                      <td><span class="badge badge-danger">-10 Safety Points</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'parking-map' && (
          <div class="card">
            <div class="card-header">
              <div class="card-header-title">
                <i class="ri-map-pin-2-line"></i>
                <span>VEMS Building Campus Parking Map & Pillars</span>
              </div>
            </div>

            <div class="zone-grid" style={{ marginTop: 16 }}>
              <div class="zone-card active">
                <div class="zone-title">Zone A (Ground Floor)</div>
                <div class="zone-count">8 / 10 Occupied</div>
                <div class="progress-bar"><div class="progress-fill warning" style={{ width: '80%' }}></div></div>
              </div>
              <div class="zone-card">
                <div class="zone-title">Zone B (Floor 1 - Motorcycles)</div>
                <div class="zone-count">10 / 20 Occupied</div>
                <div class="progress-bar"><div class="progress-fill success" style={{ width: '50%' }}></div></div>
              </div>
              <div class="zone-card">
                <div class="zone-title">Zone C (Floor 2 - Cars)</div>
                <div class="zone-count">0 / 15 Occupied</div>
                <div class="progress-bar"><div class="progress-fill success" style={{ width: '0%' }}></div></div>
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
