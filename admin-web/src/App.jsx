import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import AdminLoginScreen from './components/AdminLoginScreen';
import { fetchAPI, getImageUrl } from './api';

export default function App() {
  const [adminUser, setAdminUser] = useState(null);

  const handleLoginSuccess = (userObj) => {
    try {
      sessionStorage.setItem('vmes_admin_user', JSON.stringify(userObj));
    } catch (e) {}
    setAdminUser(userObj);
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('vmes_admin_user');
      localStorage.removeItem('vmes_admin_user');
      Object.keys(localStorage).forEach(key => {
        if (key.includes('msal') || key.includes('login') || key.includes('vmes')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {}
    setAdminUser(null);
  };

  const [activeTab, setActiveTab] = useState('overview');
  const [violationUserFilter, setViolationUserFilter] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [totalScans, setTotalScans] = useState(0);
  const [violationsCount, setViolationsCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [parkingOccupancy, setParkingOccupancy] = useState({ available: 0, occupied: 0, total: 0, rate: 0 });

  const [logs, setLogs] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('2026-1');
  const [enforcementActive, setEnforcementActive] = useState(true);
  const [cameraEnforcementState, setCameraEnforcementState] = useState('checking');
  const [scanMessage, setScanMessage] = useState('');
  const cameraSession = useRef(null);
  const scanInFlight = useRef(false);
  const scanController = useRef(null);
  const historyPollingActive = useRef(false);
  const detectionsRequest = useRef(null);
  const snapshotCache = useRef(new Map());

  const handleNavigateToViolations = (userName) => {
    setViolationUserFilter(userName || '');
    setActiveTab('access-history');
  };

  useEffect(() => {
    if (activeTab !== 'live-camera') return;
    const controller = new AbortController();
    const { signal } = controller;
    const session = { queue: Promise.resolve(), togglePending: false, timer: null };
    cameraSession.current = session;
    setCameraEnforcementState('checking');
    setScanMessage('');

    const readEnforcement = async () => {
      const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(10000)]);
      const response = await fetchAPI('/admin/enforcement-status', { signal: requestSignal });
      requestSignal.throwIfAborted();
      if (!response?.ok) throw new Error('Enforcement status unavailable');
      const data = await response.json();
      requestSignal.throwIfAborted();
      if (typeof data.enforcement_active !== 'boolean') throw new Error('Invalid enforcement status');
      return data.enforcement_active;
    };
    // Serialize polling and toggle verification; schedule only after completion.
    const enqueue = (toggle = false) => {
      clearTimeout(session.timer);
      session.queue = session.queue.then(async () => {
        if (signal.aborted) return;
        clearTimeout(session.timer);
        try {
          let active = await readEnforcement();
          if (toggle) {
            const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(10000)]);
            const response = await fetchAPI(`/admin/toggle-enforcement?active=${!active}`, {
              method: 'POST', signal: requestSignal,
            });
            requestSignal.throwIfAborted();
            if (!response?.ok) throw new Error('Enforcement update failed');
            active = await readEnforcement();
          }
          if (!signal.aborted) {
            setEnforcementActive(active);
            setCameraEnforcementState(session.togglePending && !toggle ? 'updating' : 'ready');
          }
        } catch {
          if (!signal.aborted) setCameraEnforcementState('unavailable');
        } finally {
          if (toggle) session.togglePending = false;
          if (!signal.aborted) session.timer = setTimeout(() => enqueue(), 5000);
        }
      });
    };
    session.toggle = () => {
      if (signal.aborted || session.togglePending) return;
      session.togglePending = true;
      setCameraEnforcementState('updating');
      enqueue(true);
    };
    enqueue();
    return () => {
      controller.abort();
      clearTimeout(session.timer);
      scanController.current?.abort();
      scanController.current = null;
      scanInFlight.current = false;
      if (cameraSession.current === session) cameraSession.current = null;
    };
  }, [activeTab]);

  const handleToggleEnforcement = async () => {
    if (activeTab === 'live-camera') {
      cameraSession.current?.toggle();
      return;
    }
    const nextStatus = !enforcementActive;
    setEnforcementActive(nextStatus);
    try {
      await fetchAPI(`/admin/toggle-enforcement?active=${nextStatus}`, { method: 'POST' });
    } catch (err) {
      console.warn('Enforcement toggle warning:', err);
    }
  };

  const getDetectionSnapshot = useCallback(async (detectionId, signal) => {
    if (!detectionId) return null;

    if (snapshotCache.current.has(detectionId)) {
      return snapshotCache.current.get(detectionId);
    }

    try {
      const response = await fetchAPI(`/detections/${detectionId}/snapshot`, { signal });
      if (!response?.ok) return null;

      const data = await response.json();
      const rawImg = data.snapshot_base64 || data.image_url || null;
      const imageUrl = rawImg ? getImageUrl(rawImg) : null;

      snapshotCache.current.set(detectionId, imageUrl);
      return imageUrl;
    } catch {
      return null;
    }
  }, []);
  const fetchDetections = useCallback(async (parentSignal) => {
    if (parentSignal?.aborted || detectionsRequest.current) return;
    const controller = new AbortController();
    detectionsRequest.current = controller;
    const signal = AbortSignal.any([
      controller.signal, AbortSignal.timeout(10000), ...(parentSignal ? [parentSignal] : []),
    ]);
    try {
      // 1. Fetch Detections
      const resDet = await fetchAPI('/detections', { signal });
      if (signal?.aborted) return;
      if (resDet?.ok) {
        const dataDet = await resDet.json();
        if (signal.aborted) return;
        if (Array.isArray(dataDet)) {
          const transformedLogs = await Promise.all(dataDet.map(async item => {
            const dateObj = item.timestamp ? new Date(item.timestamp) : new Date();
            const timeStr = dateObj.toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const isV = item.violation || false;
            const vType = isV ? (item.violation_type || 'No Helmet').replace(' (-10 pts)', '') : '-';
            const hText = isV ? (item.violation_type || 'No Helmet') : '-';
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
              // Load each stored snapshot once and reuse it from the in-memory cache.
              imageUrl: await getDetectionSnapshot(item.id, signal),
            };
          }));
          setLogs(transformedLogs);
        }
      }
    } catch (e) {
      if (signal?.aborted) return;
      console.log('Backend connection notice (detections):', e.message);
    } finally {
      if (detectionsRequest.current === controller) detectionsRequest.current = null;
    }
  }, []);

  useEffect(() => {
    const isHistory = activeTab === 'access-history' || activeTab === 'violations';
    historyPollingActive.current = isHistory;
    if (!isHistory) return;

    // Cancel an older batch's detection request before history takes ownership.
    detectionsRequest.current?.abort();
    detectionsRequest.current = null;
    const controller = new AbortController();
    let timer;
    const refresh = async () => {
      await fetchDetections(controller.signal);
      if (!controller.signal.aborted) timer = setTimeout(refresh, 3000);
    };
    refresh();
    return () => {
      historyPollingActive.current = false;
      controller.abort();
      clearTimeout(timer);
      detectionsRequest.current?.abort();
      detectionsRequest.current = null;
    };
  }, [activeTab, fetchDetections]);

  // Fetch real data from Backend FastAPI + MongoDB
  const fetchBackendData = useCallback(async (signal) => {
    if (signal?.aborted) return;
    try {
      // 0. Fetch Enforcement System Status
      const resEnforce = await fetchAPI('/admin/enforcement-status', { signal });
      if (signal?.aborted) return;
      if (resEnforce?.ok) {
        const dataEnforce = await resEnforce.json();
        if (typeof dataEnforce.enforcement_active === 'boolean') {
          setEnforcementActive(dataEnforce.enforcement_active);
        }
      }
    } catch (e) {}

    // Visible history owns detection polling independently of this batch.
    if (!historyPollingActive.current) await fetchDetections(signal);

    if (signal?.aborted) return;
    try {
      // 2. Fetch Analytics
      const resAnalytics = await fetchAPI('/admin/analytics', { signal });
      if (signal?.aborted) return;
      if (resAnalytics?.ok) {
        const analytics = await resAnalytics.json();
        setTotalScans(analytics.total_scans || 0);
        setViolationsCount(analytics.violations_count || 0);
      }
    } catch (e) {
      if (signal?.aborted) return;
      console.log('Backend connection notice (analytics):', e.message);
    }
    if (signal?.aborted) return;
    try {
      // 3. Fetch Parking Status
      const resPark = await fetchAPI('/parking/status', { signal });
      if (signal?.aborted) return;
      if (resPark?.ok) {
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
      if (signal?.aborted) return;
      console.log('Backend connection notice (parking):', e.message);
    }

    if (signal?.aborted) return;
    try {
      // 4. Fetch Vehicles from Backend (Exact MongoDB Registered Vehicles)
      const resVeh = await fetchAPI('/admin/all-vehicles', { signal });
      if (signal?.aborted) return;
      if (resVeh?.ok) {
        const backendVehicles = await resVeh.json();
        if (Array.isArray(backendVehicles)) {
          setVehicles(backendVehicles);
        }
      }
    } catch (e) {
      if (signal?.aborted) return;
      console.log('Backend connection notice (vehicles):', e.message);
    }
  }, [fetchDetections]);


  useEffect(() => {
    // Keep heavy general Admin polling off the live-camera view.
    if (activeTab === 'live-camera') return;
    const controller = new AbortController();
    const refresh = () => fetchBackendData(controller.signal);
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, [fetchBackendData, activeTab]);

  const handleTriggerScan = async (gateType = 'ENTRY') => {
    if (scanInFlight.current) return;
    scanInFlight.current = true;
    const controller = new AbortController();
    scanController.current = controller;
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]);
    let submissionStarted = false;
    const session = cameraSession.current;
    const showMessage = (message) => {
      if (cameraSession.current === session) setScanMessage(message);
    };
    showMessage(`Submitting ${gateType} scan…`);
    try {
      const response = await fetchAPI('/admin/all-vehicles', { signal });
      signal.throwIfAborted();
      if (!response?.ok) throw new Error('Unable to refresh vehicles. Scan was not submitted.');
      const freshVehicles = await response.json();
      signal.throwIfAborted();
      if (!Array.isArray(freshVehicles) || freshVehicles.length === 0) {
        throw new Error('No vehicles available. Scan was not submitted.');
      }
      setVehicles(freshVehicles);
      const nextIdx = (currentIndex + 1) % freshVehicles.length;
      const item = freshVehicles[nextIdx];
      setCurrentIndex(nextIdx);
      const combinedVehicleStr = (item.vehicle || '') + ' ' + (item.brand || '') + ' ' + (item.model || '');
      const isCar = item.vehicle_type === 'car' || item.vehicle?.includes('🚗') || /car|รถยนต์|mazda|toyota|camry|civic|altis|benz|bmw|accord|nissan/i.test(combinedVehicleStr);
      const payload = {
        license_plate: item.plate,
        vehicle_type: isCar ? 'car' : 'motorcycle',
        helmet_detected: isCar ? null : !item.isViolation,
        gate_type: gateType,
        zone: 'Zone A'
      };

      signal.throwIfAborted();
      submissionStarted = true;
      const result = await fetch('https://smart-campus-parking-deploy.onrender.com/detections', {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      signal.throwIfAborted();
      if (!result.ok) throw new Error('Scan submission failed.');
      showMessage(`${gateType} scan submitted successfully.`);
      if (activeTab !== 'live-camera') fetchBackendData();
    } catch (e) {
      if (!controller.signal.aborted) {
        showMessage(signal.aborted
          ? (submissionStarted ? 'Scan timed out. Submission outcome is unknown; check history before retrying.' : 'Vehicle lookup timed out. Scan was not submitted.')
          : (e.message || 'Scan request failed.'));
      }
    } finally {
      // An older cancelled operation must not unlock a newer scan after re-entry.
      if (scanController.current === controller) {
        scanController.current = null;
        scanInFlight.current = false;
      }
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

  if (!adminUser) {
    return <AdminLoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onClearViolationFilter={() => setViolationUserFilter('')}
        adminUser={adminUser}
        onLogout={handleLogout}
      />

      <main className="main-content">
        <Header
          pageTitle={currentMeta.title}
          pageSubtitle={currentMeta.subtitle}
          selectedTerm={selectedTerm}
          onSelectTerm={setSelectedTerm}
          adminUser={adminUser}
          onLogout={handleLogout}
        />

        {activeTab === 'overview' && (
          <LiveOverviewDashboard
            selectedTerm={selectedTerm}
            setSelectedTerm={setSelectedTerm}
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

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
              <span role="status">
                Parking Access Mode: {cameraEnforcementState === 'ready'
                  ? (enforcementActive ? 'ON' : 'PAUSED')
                  : cameraEnforcementState === 'unavailable' ? 'Unavailable — retrying'
                  : cameraEnforcementState === 'updating' ? 'Updating…' : 'Checking…'}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={cameraEnforcementState !== 'ready'}
                onClick={handleToggleEnforcement}
              >
                {enforcementActive ? 'Pause enforcement' : 'Enable enforcement'}
              </button>
            </div>
            {scanMessage && <p role="status">{scanMessage}</p>}
            <div className="grid-2-col gap-16 mt-16" style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <CameraStream
                gateName="Gate 1 (Entry Gate)"
                camId="CAM-01: ENTRY RAMP"
                gateType="ENTRY"
                currentDetection={logs.find(l => l.gate.includes('ENTRY')) || logs[0]}
                onTriggerScan={() => handleTriggerScan('ENTRY')}
                streamUrl="http://localhost:8000/cameras/stream/1"
                statusUrl="http://localhost:8000/cameras/status/1"
              />
              <CameraStream
                gateName="Gate 2 (Exit Gate)"
                camId="CAM-02: EXIT RAMP"
                gateType="EXIT"
                currentDetection={logs.find(l => l.gate.includes('EXIT'))}
                onTriggerScan={() => handleTriggerScan('EXIT')}
                streamUrl="http://localhost:8000/cameras/stream/2"
                statusUrl="http://localhost:8000/cameras/status/2"
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
          <ParkingOccupancyView parkingOccupancy={parkingOccupancy} logs={logs} selectedTerm={selectedTerm} setSelectedTerm={setSelectedTerm} />
        )}

        {activeTab === 'announcements' && (
          <AnnouncementsTable />
        )}
      </main>
    </div>
  );
}

