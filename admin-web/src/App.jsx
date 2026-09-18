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
import LiveOverviewDashboard from './components/LiveOverviewDashboard';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [violationUserFilter, setViolationUserFilter] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [totalScans, setTotalScans] = useState(0);
  const [violationsCount, setViolationsCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [parkingOccupancy, setParkingOccupancy] = useState({ available: 0, occupied: 0, total: 0, rate: 0 });

  const [logs, setLogs] = useState([]);
  const [enforcementActive, setEnforcementActive] = useState(true);

  const handleNavigateToViolations = (userName) => {
    setViolationUserFilter(userName || '');
    setActiveTab('access-history');
  };

  const fetchAPI = async (endpoint, options) => {
    try {
      const res = await fetch(`http://localhost:8000${endpoint}`, options);
      if (res.ok) return res;
    } catch (e) {}
    return fetch(`https://smart-campus-parking-deploy.onrender.com${endpoint}`, options);
  };

  const handleToggleEnforcement = async () => {
    const nextStatus = !enforcementActive;
    setEnforcementActive(nextStatus);
    try {
      await fetchAPI(`/admin/toggle-enforcement?active=${nextStatus}`, { method: 'POST' });
    } catch (err) {
      console.warn('Enforcement toggle warning:', err);
    }
  };

  // Fetch real data from Backend FastAPI + MongoDB
  const fetchBackendData = useCallback(async () => {
    try {
      // 0. Fetch Enforcement System Status
      const resEnforce = await fetchAPI('/admin/enforcement-status');
      if (resEnforce.ok) {
        const dataEnforce = await resEnforce.json();
        if (typeof dataEnforce.enforcement_active === 'boolean') {
          setEnforcementActive(dataEnforce.enforcement_active);
        }
      }
    } catch (e) {}

    try {
      // 1. Fetch Detections
      const resDet = await fetchAPI('/detections');
      if (resDet.ok) {
        const dataDet = await resDet.json();
        if (Array.isArray(dataDet)) {
          const transformedLogs = dataDet.map(item => {
            const dateObj = item.timestamp ? new Date(item.timestamp) : new Date();
            const timeStr = dateObj.toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const isV = item.violation || false;
            const vType = isV ? (item.violation_type || (item.vehicle_type === 'car' ? 'Parked >30 Mins' : 'No Helmet')).replace(' (-10 pts)', '') : '-';
            const hText = isV ? (item.vehicle_type === 'car' ? 'Parked >30 Mins' : 'No Helmet') : '-';
            let gateName = 'Gate 1 (Entry Gate)';
            if (item.gate_type) {
              const gt = String(item.gate_type).toLowerCase();
              if (gt.includes('exit') || gt.includes('gate 2') || gt.includes('gate2')) {
                gateName = 'Gate 2 (Exit Gate)';
              } else if (gt.includes('entry') || gt.includes('gate 1') || gt.includes('gate1')) {
                gateName = 'Gate 1 (Entry Gate)';
              } else {
                gateName = item.gate_type;
              }
            }
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
              rawDate: item.timestamp,
              time: timeStr,
              plate: rawP,
              province: rawProv,
              vehicle: `${item.vehicle_type === 'car' ? 'Car' : 'Motorcycle'}`,
              owner: item.matched_user || 'Guest / Unregistered',
              helmet: hText,
              violationType: vType,
              isViolation: isV,
              penaltyApplied: item.penalty_applied,
              gate: gateName,
              zone: item.zone || 'Zone A',
              // Resolve local snapshot URLs to absolute localhost URL so the
              // Admin Web browser can fetch them from the local FastAPI server.
              // Records without image_url remain null and InspectionTable falls
              // back to its existing Unsplash placeholder automatically.
              imageUrl: item.image_url
                ? (item.image_url.startsWith('http')
                    ? item.image_url
                    : `http://localhost:8000${item.image_url}`)
                : null,
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
      const resAnalytics = await fetchAPI('/admin/analytics');
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
      const resPark = await fetchAPI('/parking/status');
      if (resPark.ok) {
        const zones = await resPark.json();
        if (Array.isArray(zones) && zones.length > 0) {
          // Filter ONLY Car Zones (Zone A & Zone C) for Car Available Spot KPI
          const carZones = zones.filter(z => {
            const zName = (z.zone || z.name || '').toUpperCase();
            return zName.includes('ZONE A') || zName.includes('ZONE C');
          });
          let total = 0;
          let occupied = 0;
          carZones.forEach(z => {
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
      const resVeh = await fetchAPI('/admin/all-vehicles');
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
    'overview': { title: 'Dashboard', subtitle: 'Academic term statistics, safety violations & campus parking load' },
    'live-camera': { title: 'Gate Camera', subtitle: 'Multi-Gate CCTV Stream & Optical Character Recognition' },
    'access-history': { title: 'Gate Access & Violation History', subtitle: 'Real-time & historic gate entry/exit logs, helmet violation audits, and CCTV snapshots' },
    'vehicles': { title: 'Vehicle Directory', subtitle: 'Manage student & staff approved license plates' },
    'safety-scores': { title: 'Driving Score', subtitle: '100-point scale enforcement, violation penalties, and score restorations' },
    'violations': { title: 'Gate Access & Violation History', subtitle: 'Real-time & historic gate entry/exit logs, helmet violation audits, and CCTV snapshots' },
    'parking-map': { title: 'Building Occupancy', subtitle: "Real-time VMES's building parking availability" },
    'announcements': { title: 'Official Campus Announcements', subtitle: 'Broadcast real-time notices, safety updates, and maintenance alerts to mobile users' }
  };

  const currentMeta = titles[activeTab] || titles['overview'];

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onClearViolationFilter={() => setViolationUserFilter('')} />

      <main className="main-content">
        <Header
          pageTitle={currentMeta.title}
          pageSubtitle={currentMeta.subtitle}
          enforcementActive={enforcementActive}
          onToggleEnforcement={handleToggleEnforcement}
        />

        {activeTab === 'overview' && (
          <LiveOverviewDashboard
            totalScans={totalScans}
            violationsCount={violationsCount}
            parkingOccupancy={parkingOccupancy}
            logs={logs}
            vehicles={vehicles}
            onNavigate={(tab) => { setViolationUserFilter(''); setActiveTab(tab); }}
            handleTriggerScan={handleTriggerScan}
          />
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
              <span className="text-muted text-xs">2-Camera Stream</span>
            </div>

            <div className="grid-2-col gap-16 mt-16" style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <CameraStream
                gateName="Gate 1 (Entry Gate)"
                camId="CAM-01: ENTRY RAMP"
                gateType="ENTRY"
                currentDetection={logs.find(l => l.gate.includes('ENTRY')) || logs[0]}
                onTriggerScan={() => handleTriggerScan('ENTRY')}
                streamUrl="http://localhost:8000/cameras/stream/1"
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

