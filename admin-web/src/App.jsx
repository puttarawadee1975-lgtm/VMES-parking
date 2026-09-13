import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import KpiCards from './components/KpiCards';
import CameraStream from './components/CameraStream';
import InspectionTable from './components/InspectionTable';
import VehiclesTable from './components/VehiclesTable';
import ScoresTable from './components/ScoresTable';
import AnnouncementsTable from './components/AnnouncementsTable';
import ParkingOccupancyView from './components/ParkingOccupancyView';
import ViolationsTable from './components/ViolationsTable';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [violationUserFilter, setViolationUserFilter] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [totalScans, setTotalScans] = useState(0);
  const [violationsCount, setViolationsCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [parkingOccupancy, setParkingOccupancy] = useState({ available: 0, occupied: 0, total: 0, rate: 0 });

  const [logs, setLogs] = useState([]);

  const handleNavigateToViolations = (userName) => {
    setViolationUserFilter(userName || '');
    setActiveTab('access-history');
  };

  // Fetch real data from Backend FastAPI
  const fetchBackendData = useCallback(async () => {
    try {
      // 1. Fetch Detections
      const resDet = await fetch('https://smart-campus-parking-deploy.onrender.com/detections');
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
              helmet: hText,
              isViolation: isV,
              penaltyApplied: item.penalty_applied,
              gate: gateName,
              zone: item.zone || 'Zone A'
            };
          });
          setLogs(transformedLogs);
        }
      }
    } catch (e) {
      console.log('Backend connection notice (detections):', e.message);
    }

    try {
      // 2. Fetch Analytics
      const resAnalytics = await fetch('https://smart-campus-parking-deploy.onrender.com/admin/analytics');
      if (resAnalytics.ok) {
        const analytics = await resAnalytics.json();
        setTotalScans(analytics.total_scans || 0);
        setViolationsCount(analytics.violations_count || 0);
      }
    } catch (e) {
      console.log('Backend connection notice (analytics):', e.message);
    }
    
    try {
      // 3. Fetch Parking Status
      const resPark = await fetch('https://smart-campus-parking-deploy.onrender.com/parking/status');
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
      // 4. Fetch Vehicles from Backend (Exact MongoDB Registered Vehicles)
      const resVeh = await fetch('https://smart-campus-parking-deploy.onrender.com/admin/all-vehicles');
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

      await fetch('https://smart-campus-parking-deploy.onrender.com/detections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      // Refresh state immediately after posting detection
      fetchBackendData();
    } catch (e) {
      console.warn('Scan trigger API notice:', e);
    }
  };

  const handleAdjustScore = async (owner, change, customReason) => {
    const targetVeh = vehicles.find(v => v.owner === owner);
    const email = targetVeh?.ownerEmail || '65070042@student.university.ac.th';
    const defaultReason = change < 0 ? 'Admin Manual Deduction' : 'Admin Score Restoration';
    const reason = customReason || defaultReason;

    try {
      await fetch('https://smart-campus-parking-deploy.onrender.com/admin/adjust-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: email,
          points_changed: change,
          reason: reason,
          gate_name: 'System Admin',
          image_url: ''
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
    'live-camera': { title: 'Gate Camera Feed Surveillance Grid (ENTRY & EXIT)', subtitle: 'Multi-Gate CCTV Stream & Optical Character Recognition' },
    'access-history': { title: 'Gate Access & Violation History Log', subtitle: 'Real-time & historic gate entry/exit logs, helmet violation audits, and CCTV snapshots' },
    'vehicles': { title: 'Registered Vehicles & Campus Passes', subtitle: 'Manage student & staff approved license plates and 1-plate policy rules' },
    'safety-scores': { title: 'Driver Safety Scores & Audit Console', subtitle: '100-point scale enforcement, violation penalties, and score restorations' },
    'violations': { title: 'Gate Access & Violation History Log', subtitle: 'Real-time & historic gate entry/exit logs, helmet violation audits, and CCTV snapshots' },
    'parking-map': { title: 'Building Occupancy & Capacity Monitor', subtitle: 'Real-time building parking availability, load percentage, and floor specifications' },
    'announcements': { title: 'Campus Announcements Management', subtitle: 'Broadcast real-time notices, safety updates, and maintenance alerts to mobile users' }
  };

  const currentMeta = titles[activeTab] || titles['overview'];

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onClearViolationFilter={() => setViolationUserFilter('')} />

      <main className="main-content">
        <Header 
          pageTitle={currentMeta.title} 
          pageSubtitle={currentMeta.subtitle}
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
              <InspectionTable logs={logs} isOverview={true} onViewAllHistory={() => { setViolationUserFilter(''); setActiveTab('access-history'); }} />
            </div>
          </div>
        )}

        {(activeTab === 'access-history' || activeTab === 'violations') && (
          <InspectionTable 
            logs={logs} 
            isOverview={false} 
            initialSearchQuery={violationUserFilter}
            initialViolationFilter={activeTab === 'violations' ? 'violations_only' : 'all'}
          />
        )}

        {activeTab === 'live-camera' && (
          <div className="card">
            <div className="card-header">
              <div className="card-header-title">
                <i className="ri-camera-lens-line"></i>
                <span>VMES CCTV Entry & Exit Gate</span>
              </div>
              <span className="text-muted text-xs">2-Camera Grid Stream</span>
            </div>

            <div className="grid-2-col gap-16 mt-16" style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <CameraStream 
                gateName="Gate 1 (Entry Gate)"
                camId="CAM-01: ENTRY RAMP"
                gateType="ENTRY"
                currentDetection={logs.find(l => l.gate.includes('ENTRY')) || logs[0]} 
                onTriggerScan={() => handleTriggerScan('ENTRY')} 
              />
              <CameraStream 
                gateName="Gate 2 (Exit Gate)"
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
          <ScoresTable 
            vehicles={vehicles} 
            logs={logs} 
            onAdjustScore={handleAdjustScore} 
            onViewViolations={handleNavigateToViolations}
          />
        )}

        {activeTab === 'parking-map' && (
          <ParkingOccupancyView parkingOccupancy={parkingOccupancy} logs={logs} />
        )}

        {activeTab === 'announcements' && (
          <AnnouncementsTable />
        )}
      </main>
    </div>
  );
}

