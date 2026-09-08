import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import KpiCards from './components/KpiCards';
import CameraStream from './components/CameraStream';
import InspectionTable from './components/InspectionTable';
import VehiclesTable from './components/VehiclesTable';
import ScoresTable from './components/ScoresTable';
import AnalyticsCharts from './components/AnalyticsCharts';
import AnnouncementsTable from './components/AnnouncementsTable';
import ParkingOccupancyView from './components/ParkingOccupancyView';

const INITIAL_VEHICLES = [
  { plate: '1กข 1234', province: 'กรุงเทพมหานคร', vehicle_type: 'motorcycle', brand: 'Honda', model: 'PCX 160', color: 'Black', vehicle: 'Motorcycle Honda PCX 160 (Black)', helmet: 'Pass (Worn)', isViolation: false, gate: 'Gate 1 (Main Entrance)', owner: 'Thanaphat S.', id: '65070042', role: 'Student', score: 98, ownerEmail: '65070042@student.university.ac.th' },
  { plate: '3กฮ 5678', province: 'กรุงเทพมหานคร', vehicle_type: 'motorcycle', brand: 'Yamaha', model: 'Grand Filano', color: 'Gray', vehicle: 'Motorcycle Yamaha Grand Filano (Gray)', helmet: 'NO HELMET', isViolation: true, gate: 'Gate 1 (Main Entrance)', owner: 'Nattapong K.', id: '65070118', role: 'Student', score: 80, ownerEmail: '65070118@student.university.ac.th' },
  { plate: '9กข 9999', province: 'สมุทรปราการ', vehicle_type: 'car', brand: 'Toyota', model: 'Camry', color: 'White', vehicle: 'Car Toyota Camry (White)', helmet: 'N/A (Automobile)', isViolation: false, gate: 'Gate 2 (East Entrance)', owner: 'Dr. Somchai P.', id: 'SEC-01', role: 'Staff', score: 100, ownerEmail: 'somchai@university.ac.th' },
  { plate: '2กข 4321', province: 'นนทบุรี', vehicle_type: 'motorcycle', brand: 'Vespa', model: 'Sprint 150', color: 'White', vehicle: 'Motorcycle Vespa Sprint 150 (White)', helmet: 'Pass (Worn)', isViolation: false, gate: 'Gate 1 (Main Entrance)', owner: 'Chayanan T.', id: '65070244', role: 'Student', score: 100, ownerEmail: '65070244@student.university.ac.th' },
  { plate: '5กษ 8888', province: 'กรุงเทพมหานคร', vehicle_type: 'car', brand: 'Honda', model: 'Civic', color: 'Black', vehicle: 'Car Honda Civic (Black)', helmet: 'N/A (Automobile)', isViolation: false, gate: 'Gate 2 (East Entrance)', owner: 'Pattarapon M.', id: '65070399', role: 'Student', score: 95, ownerEmail: '65070399@student.university.ac.th' }
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
            let rawP = (item.license_plate || 'Unregistered').trim();
            let rawProv = (item.province || 'กรุงเทพมหานคร').trim();
            const parts = rawP.split(/\s+/);
            if (parts.length >= 3) {
              rawP = parts.slice(0, -1).join(' ');
              rawProv = parts[parts.length - 1];
            } else if (rawProv && rawP.endsWith(rawProv)) {
              rawP = rawP.slice(0, -rawProv.length).trim();
            }

            return {
              id: item.id,
              time: timeStr,
              plate: rawP,
              province: rawProv,
              vehicle: `${item.vehicle_type === 'car' ? 'Car' : 'Motorcycle'}`,
              owner: item.matched_user || 'Guest / Unregistered',
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
      const combinedVehicleStr = (item.vehicle || '') + ' ' + (item.brand || '') + ' ' + (item.model || '');
      const isCar = item.vehicle_type === 'car' || item.vehicle?.includes('🚗') || /car|รถยนต์|mazda|toyota|camry|civic|altis|benz|bmw|accord|nissan/i.test(combinedVehicleStr);
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
    'parking-map': { title: 'VEMS Building Occupancy & Capacity Monitor', subtitle: 'Real-time building parking availability, load percentage, and floor specifications' },
    'analytics': { title: 'Analytics & Traffic Intelligence', subtitle: 'Peak hours traffic distribution, compliance rates, and gate throughput' },
    'announcements': { title: 'Campus Announcements Management', subtitle: 'Broadcast real-time notices, safety updates, and maintenance alerts to mobile users' }
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
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                  <i className="ri-shield-check-line" style={{ fontSize: 36, color: '#059669', display: 'block', marginBottom: 12 }}></i>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>No Helmet Violations Detected</div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>All motorcycle riders scanned at campus gates were wearing helmets.</div>
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
                        <td style={{ fontWeight: 700, color: '#dc2626' }}>LOG-V{String(i + 1).padStart(3, '0')}</td>
                        <td style={{ fontWeight: 600, color: '#2563eb' }}>{item.time}</td>
                        <td><span className="plate-tag">{item.plate} {item.province && !item.plate.includes(item.province) ? item.province : ''}</span></td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.owner}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{item.vehicle}</div>
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
          <ParkingOccupancyView parkingOccupancy={parkingOccupancy} logs={logs} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsCharts />
        )}

        {activeTab === 'announcements' && (
          <AnnouncementsTable />
        )}
      </main>
    </div>
  );
}

