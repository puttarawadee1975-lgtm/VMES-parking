import React, { useState, useMemo } from 'react';
import { fetchAPI } from '../api';

const formatDateDisplay = (dateVal) => {
  if (!dateVal) return '-';
  const str = String(dateVal).trim();

  // 1. Check if already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // 2. Check if ISO or YYYY-MM-DD prefix e.g. "2026-09-21T10:46:37"
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  // 3. Check if "DD Month YYYY" or "D Month YYYY" e.g. "20 September 2026"
  const textMatch = str.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (textMatch) {
    const day = parseInt(textMatch[1], 10);
    const monthStr = textMatch[2].toLowerCase();
    const year = textMatch[3];
    const months = {
      january: '01', jan: '01',
      february: '02', feb: '02',
      march: '03', mar: '03',
      april: '04', apr: '04',
      may: '05',
      june: '06', jun: '06',
      july: '07', jul: '07',
      august: '08', aug: '08',
      september: '09', sep: '09', sept: '09',
      october: '10', oct: '10',
      november: '11', nov: '11',
      december: '12', dec: '12'
    };
    if (months[monthStr]) {
      const paddedDay = day < 10 ? `0${day}` : `${day}`;
      return `${year}-${months[monthStr]}-${paddedDay}`;
    }
  }

  // 4. Fallback to JS Date parsing
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return str;
};

const formatTimeDisplay = (timeStr) => {
  if (!timeStr) return '';
  let str = String(timeStr).trim();
  // Ensure space before AM/PM e.g. "5:21PM" -> "5:21 PM"
  str = str.replace(/([0-9]{1,2}:[0-9]{2})\s*([AP]M)/gi, '$1 $2');
  // Ensure 2-digit hour e.g. "5:21 PM" -> "05:21 PM"
  str = str.replace(/^([0-9]):([0-9]{2})\s*([AP]M)/gi, '0$1:$2 $3');
  return str;
};

// Zone layout structure for visual parking slot grid

// Definition of zone layout spots for visual slot grid
const ZONE_PILLAR_LAYOUTS = {
  'Zone A': [
    { pillar: 'Spot A-01', spotId: 'SPOT-65070399', label: 'A-01' },
    { pillar: 'Spot A-02', spotId: 'SPOT-65070088', label: 'A-02' },
    { pillar: 'Spot A-03', spotId: 'SPOT-66070112', label: 'A-03' },
    { pillar: 'Spot A-04', spotId: null, label: 'A-04' },
    { pillar: 'Spot A-05', spotId: null, label: 'A-05' },
    { pillar: 'Spot A-06', spotId: null, label: 'A-06' },
    { pillar: 'Spot A-07', spotId: null, label: 'A-07' },
    { pillar: 'Spot A-08', spotId: null, label: 'A-08' },
    { pillar: 'Spot A-09', spotId: null, label: 'A-09' },
    { pillar: 'Spot A-10', spotId: null, label: 'A-10' }
  ],
  'Zone B': [
    { pillar: 'Spot B-01', spotId: 'SPOT-65070042', label: 'B-01' }
  ],
  'Zone C': [
    { pillar: 'Spot C-01', spotId: 'SPOT-SOMCHAI-P', label: 'C-01' },
    { pillar: 'Spot C-02', spotId: null, label: 'C-02' },
    { pillar: 'Spot C-03', spotId: null, label: 'C-03' },
    { pillar: 'Spot C-04', spotId: null, label: 'C-04' },
    { pillar: 'Spot C-05', spotId: null, label: 'C-05' },
    { pillar: 'Spot C-06', spotId: null, label: 'C-06' },
    { pillar: 'Spot C-07', spotId: null, label: 'C-07' },
    { pillar: 'Spot C-08', spotId: null, label: 'C-08' }
  ],
  'Zone D': [
    { pillar: 'Spot D-01', spotId: null, label: 'D-01' }
  ]
};

const DEFAULT_ZONES_INITIAL = [
  { id: 'Zone A', name: 'Zone A', tag: 'Cars Only', numericCapacity: 10, total_slots: 10, capacity: '10 Spots', location: 'Floor G Automobile Deck A', pillars: 'Spots A-01 - A-10' },
  { id: 'Zone B', name: 'Zone B', tag: 'Motorcycle Only', numericCapacity: 0, total_slots: 0, capacity: '1 Spot', location: 'Floor G Automobile Deck B', pillars: 'Spot B-01' },
  { id: 'Zone C', name: 'Zone C', tag: 'Cars Only', numericCapacity: 8, total_slots: 8, capacity: '8 Spots', location: 'Floor G Automobile Deck C', pillars: 'Spots C-01 - C-08' },
  { id: 'Zone D', name: 'Zone D', tag: 'Motorcycle Only', numericCapacity: 0, total_slots: 0, capacity: '1 Spot', location: 'Floor G Motorcycle Deck D', pillars: 'Spot D-01' }
];

export default function ParkingOccupancyView({ parkingOccupancy, logs = [], vehicles = [], selectedTerm: propSelectedTerm, setSelectedTerm: propSetSelectedTerm }) {
  const {
    total = 18,
    occupied = 0,
    available = 0,
    rate = 0
  } = parkingOccupancy || {};

  const [localTerm, setLocalTerm] = useState('2026-1');
  const selectedTerm = propSelectedTerm || localTerm;
  const setSelectedTerm = propSetSelectedTerm || setLocalTerm;

  // Search & Date Filter Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('today');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reservationFilter, setReservationFilter] = useState('ACTIVE');

  // State for Registered Account Scanned & Admin Locked Parking Spots from MongoDB Atlas
  const [parkedSpots, setParkedSpots] = useState([]);

  // Fetch real term-by-term parked vehicle spots from Backend MongoDB Atlas with auto-refresh
  React.useEffect(() => {
    const fetchSpots = () => {
      fetchAPI(`/parking/occupied-spots?term=${selectedTerm}`)
        .then(res => res && res.ok ? res.json() : [])
        .then(data => {
          setParkedSpots(Array.isArray(data) ? data : []);
        })
        .catch(() => {
          setParkedSpots([]);
        });
    };

    fetchSpots();
    const interval = setInterval(fetchSpots, 3000);
    return () => clearInterval(interval);
  }, [selectedTerm]);

  // Dynamic Building Zones State (Loaded from MongoDB Atlas)
  const [zones, setZones] = useState(DEFAULT_ZONES_INITIAL);

  // Fetch building zones from MongoDB Atlas on mount
  React.useEffect(() => {
    fetchAPI('/parking/building-zones')
      .then(res => res && res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setZones(data);
        }
      })
      .catch(err => console.warn('Failed to load building zones from MongoDB:', err));
  }, []);

  const syncZonesToMongoDB = (newZones) => {
    fetchAPI('/parking/building-zones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newZones)
    }).catch(err => console.warn('Failed to sync building zones to MongoDB:', err));
  };


  // Modal State for Adding/Editing Zone Config
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState(null);

  // Form Fields State for Zone Config
  const [formName, setFormName] = useState('');
  const [formTag, setFormTag] = useState('Cars Only');
  const [formLocation, setFormLocation] = useState('');
  const [formPillars, setFormPillars] = useState('');
  const [formCapacity, setFormCapacity] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');

  // Combine active parked spots with historical detection logs and date records
  const allCombinedSpots = useMemo(() => {
    const list = [...parkedSpots];
    const seenPlatesAndDates = new Set(list.map(s => `${s.plate}-${s.rawDate || s.savedDate || 'today'}`));

    const todayStr = new Date().toISOString().split('T')[0];
    const yestObj = new Date();
    yestObj.setDate(yestObj.getDate() - 1);
    const yestStr = yestObj.toISOString().split('T')[0];

    // Add historical detection logs if available
    (logs || []).forEach((l, index) => {
      const logDate = l.rawDate ? String(l.rawDate).slice(0, 10) : (l.timestamp ? String(l.timestamp).slice(0, 10) : todayStr);
      const plate = l.plate || l.license_plate || '-';
      const key = `${plate}-${logDate}`;

      if (!seenPlatesAndDates.has(key)) {
        seenPlatesAndDates.add(key);
        const isExit = (l.gate || '').toUpperCase().includes('EXIT') || (l.gate_type || '').toUpperCase().includes('EXIT') || l.status === 'Completed';
        const isGuest = l.role === 'Guest' || l.studentId === 'GUEST' || (l.owner && l.owner.toLowerCase().includes('guest')) || !l.owner;
        const hasSavedSpot = Boolean(l.isSpotSaved || (l.floor && l.floor !== '-' && (l.pillar || l.spot) && (l.pillar || l.spot) !== '-'));

        list.push({
          id: l.id || `LOG-${index + 100}`,
          owner: l.owner || (isGuest ? 'Guest Driver' : 'Registered Driver'),
          studentId: l.studentId || (isGuest ? 'GUEST' : (l.ownerEmail ? l.ownerEmail.split('@')[0].toUpperCase() : 'STUDENT')),
          role: l.role || (isGuest ? 'Guest' : 'Student'),
          plate: plate,
          province: (plate === '-' || !plate || plate === 'Unregistered') ? '-' : (l.province || '-'),
          zone: l.zone && l.zone !== '-' ? l.zone.split('(')[0].trim() : 'Zone A',
          floor: hasSavedSpot ? l.floor : '-',
          pillar: hasSavedSpot ? (l.pillar || l.spot) : '-',
          entryTime: l.time ? `${l.time} (${l.gate || 'Gate 1 Entry'})` : '08:24 AM (Gate 1 Entry)',
          exitTime: isExit ? '05:30 PM (Gate 2 Exit)' : 'Active (In Building)',
          rawDate: logDate,
          savedDate: logDate,
          status: isExit ? 'Exited' : 'Active Parked',
          isSpotSaved: hasSavedSpot
        });
      }
    });

    return list;
  }, [parkedSpots, logs]);

  // Filtered Scanned Parking Spots
  const filteredSpots = useMemo(() => {
    return allCombinedSpots.filter(spot => {
      // 1. Search Query Filter
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || (
        spot.owner?.toLowerCase().includes(q) ||
        spot.studentId?.toLowerCase().includes(q) ||
        spot.plate?.toLowerCase().includes(q) ||
        spot.zone?.toLowerCase().includes(q) ||
        spot.pillar?.toLowerCase().includes(q) ||
        spot.vehicleName?.toLowerCase().includes(q) ||
        spot.status?.toLowerCase().includes(q)
      );

      // 2. Zone Filter
      const matchZone = selectedZoneId === 'ALL' ||
        spot.zone?.toUpperCase().includes(selectedZoneId.toUpperCase()) ||
        selectedZoneId.toUpperCase().includes(spot.zone?.toUpperCase() || '');

      // 3. Date Filter
      let matchDate = true;
      const isActiveNow = spot.status === 'Active Parked' || (spot.exitTime && spot.exitTime.toLowerCase().includes('active'));
      const rawD = spot.rawDate || spot.savedDate || (spot.timestamp ? String(spot.timestamp) : null);
      const itemDateStr = formatDateDisplay(rawD);

      const todayObj = new Date();
      const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;

      if (dateFilter === 'today') {
        matchDate = itemDateStr === todayStr || isActiveNow;
      } else if (dateFilter === 'yesterday') {
        const yestObj = new Date(todayObj);
        yestObj.setDate(yestObj.getDate() - 1);
        const yestStr = `${yestObj.getFullYear()}-${String(yestObj.getMonth() + 1).padStart(2, '0')}-${String(yestObj.getDate()).padStart(2, '0')}`;
        matchDate = itemDateStr === yestStr;
      } else if (dateFilter === 'custom' && selectedDate) {
        matchDate = itemDateStr === selectedDate;
      } else if (dateFilter === 'all') {
        matchDate = true;
      }

      // 4. Status Filter
      let matchStatus = true;
      if (reservationFilter === 'ACTIVE') {
        matchStatus = isActiveNow;
      } else if (reservationFilter === 'EXITED') {
        matchStatus = !isActiveNow;
      } else if (reservationFilter === 'ALL') {
        matchStatus = true;
      }

      return matchSearch && matchZone && matchDate && matchStatus;
    });
  }, [allCombinedSpots, searchQuery, selectedZoneId, dateFilter, selectedDate, reservationFilter]);

  // Filtered Historical Parking Records from MongoDB Atlas Detection Logs
  const filteredHistory = useMemo(() => {
    return (logs || []).map((l, index) => ({
      id: l.id || `HIST-${index + 1000}`,
      date: l.rawDate ? l.rawDate.split('T')[0] : (l.timestamp ? new Date(l.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
      entryTime: l.time || '08:00 AM',
      exitTime: l.status === 'Completed' ? 'Exit Gate 1' : 'Active (In Building)',
      duration: 'Live',
      spot: (l.pillar && l.pillar !== '-') ? l.pillar : ((l.spot && l.spot !== '-') ? l.spot : '-'),
      zone: l.zone && l.zone !== '-' ? l.zone.split('(')[0].trim() : 'Zone A',
      studentId: l.studentId || ((l.role === 'Guest' || !l.owner) ? 'GUEST' : (l.ownerEmail ? l.ownerEmail.split('@')[0].toUpperCase() : 'STUDENT')),
      owner: l.owner || ((l.role === 'Guest' || !l.owner) ? 'Guest Driver' : 'Registered Driver'),
      role: l.role || ((l.studentId === 'GUEST' || !l.owner) ? 'Guest' : 'Student'),
      plate: l.plate || l.license_plate || '-',
      province: l.province || 'กรุงเทพมหานคร',
      vehicleName: l.vehicle || l.vehicleName || 'Vehicle',
      vehicleType: l.vehicle_type || l.vehicleType || 'car',
      status: l.status || 'Completed'
    })).filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || (
        item.owner?.toLowerCase().includes(q) ||
        item.studentId?.toLowerCase().includes(q) ||
        item.plate?.toLowerCase().includes(q) ||
        item.spot?.toLowerCase().includes(q) ||
        item.zone?.toLowerCase().includes(q) ||
        item.vehicleName?.toLowerCase().includes(q)
      );

      const matchZone = selectedZoneId === 'ALL' || item.zone.toUpperCase().includes(selectedZoneId.toUpperCase());
      return matchSearch && matchZone;
    });
  }, [logs, searchQuery, selectedZoneId]);



  // Zone Config Controls
  const handleOpenAddZone = () => {
    setEditingZone(null);
    setFormName(`Zone ${String.fromCharCode(65 + zones.length)}`);
    setFormTag('Cars Only');
    setFormLocation('Ground Floor');
    setFormPillars('Pillars G10 - G15');
    setFormCapacity('6 Car Spots');
    setFormImageUrl('');
    setFormDescription('New Building Zone Specification.');
    setShowZoneModal(true);
  };

  const handleOpenEditZone = (zone) => {
    setEditingZone(zone);
    setFormName(zone.name);
    setFormTag(zone.tag);
    setFormLocation(zone.location);
    setFormPillars(zone.pillars || '');
    setFormCapacity(zone.capacity);
    setFormImageUrl(zone.imageUrl || '');
    setFormDescription(zone.description || '');
    setShowZoneModal(true);
  };

  const handleSaveZone = (e) => {
    e.preventDefault();
    if (!formName.trim()) return;

    let badgeClass = 'badge-live';
    if (formTag.toLowerCase().includes('motorcycle')) badgeClass = 'badge-warning';
    if (formTag.toLowerCase().includes('staff') || formTag.toLowerCase().includes('faculty')) badgeClass = 'badge-secondary';

    if (editingZone) {
      setZones(prev => {
        const next = prev.map(z => z.id === editingZone.id ? {
          ...z,
          name: formName.trim(),
          tag: formTag.trim(),
          badgeClass,
          location: formLocation.trim(),
          pillars: formPillars.trim(),
          capacity: formCapacity.trim(),
          imageUrl: formImageUrl.trim(),
          description: formDescription.trim()
        } : z);
        syncZonesToMongoDB(next);
        return next;
      });
    } else {
      const newZoneObj = {
        id: formName.trim(),
        name: formName.trim(),
        tag: formTag.trim(),
        badgeClass,
        location: formLocation.trim(),
        pillars: formPillars.trim(),
        capacity: formCapacity.trim(),
        imageUrl: formImageUrl.trim(),
        description: formDescription.trim(),
        color: '#2563eb',
        bgLight: '#eff6ff'
      };
      setZones(prev => {
        const next = [...prev, newZoneObj];
        syncZonesToMongoDB(next);
        return next;
      });
    }
    setShowZoneModal(false);
  };

  const handleDeleteZone = (zoneId) => {
    if (window.confirm('Are you sure you want to remove this Building Zone specification?')) {
      setZones(prev => {
        const next = prev.filter(z => z.id !== zoneId);
        syncZonesToMongoDB(next);
        return next;
      });
    }
  };


  // Active vehicles currently inside building
  const activeVehiclesList = useMemo(() => {
    return allCombinedSpots.filter(s => {
      const isExit = s.status === 'Exited' || s.status === 'Completed' || (s.exitTime && !s.exitTime.toLowerCase().includes('active'));
      return !isExit;
    });
  }, [allCombinedSpots]);

  // Count active spots per zone
  const getZoneActiveCount = (zoneName) => {
    return activeVehiclesList.filter(s => {
      const zStr = (s.zone || '').toUpperCase();
      return zStr.includes(zoneName.toUpperCase());
    }).length;
  };

  const totalActiveSpotsCount = activeVehiclesList.length;
  const currentSelectedZoneObj = zones.find(z => z.name.toUpperCase() === selectedZoneId.toUpperCase() || z.id.toUpperCase() === selectedZoneId.toUpperCase());
  const isMotorcycleZone = currentSelectedZoneObj ? /motorcycle/i.test(currentSelectedZoneObj.tag || '') : false;

  const totalCarCapacity = useMemo(() => {
    if (!Array.isArray(zones) || zones.length === 0) return 18;
    const carZones = zones.filter(z => {
      const zName = (z.zone || z.name || z.id || '').toUpperCase();
      return zName.includes('ZONE A') || zName.includes('ZONE C');
    });
    const sum = carZones.reduce((acc, z) => {
      const cap = (z.numericCapacity !== undefined && z.numericCapacity !== null) ? z.numericCapacity : (z.total_slots || parseInt(z.capacity) || 0);
      return acc + cap;
    }, 0);
    return sum > 0 ? sum : 18;
  }, [zones]);

  const occupiedCarsCount = useMemo(() => {
    return activeVehiclesList.filter(s => {
      const vType = (s.vehicleType || s.vehicle_type || '').toLowerCase();
      const zStr = (s.zone || '').toUpperCase();
      return vType !== 'motorcycle' && !zStr.includes('ZONE B');
    }).length;
  }, [activeVehiclesList]);

  const availableCarSpots = Math.max(0, totalCarCapacity - occupiedCarsCount);

  const estMotos = useMemo(() => {
    return activeVehiclesList.filter(s => {
      const vType = (s.vehicleType || s.vehicle_type || '').toLowerCase();
      const zStr = (s.zone || '').toUpperCase();
      return vType === 'motorcycle' || zStr.includes('ZONE B');
    }).length;
  }, [activeVehiclesList]);

  const todayStr = new Date().toISOString().split('T')[0];
  const exitedTodayCount = (logs || []).filter(h => h.status === 'Completed' || (h.rawDate && h.rawDate.startsWith(todayStr))).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Overview KPI Row - Layout Matching Screenshot */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {/* Card 1: Parked Vehicles / Today's Traffic */}
        <div className="kpi-card" style={{ background: '#ffffff', padding: '20px 24px', borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ri-car-fill" style={{ color: '#2563eb', fontSize: 24 }}></i>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Parked Vehicles</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{occupiedCarsCount}</div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Currently Inside Building</div>
          </div>
        </div>

        {/* Card 2: Available Car Spots */}
        <div className="kpi-card" style={{ background: '#ffffff', padding: '20px 24px', borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ri-parking-box-fill" style={{ color: '#059669', fontSize: 24 }}></i>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Available Parking Spots</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{availableCarSpots}</div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Campus Building ({totalCarCapacity} Car Spots)</div>
          </div>
        </div>

        {/* Card 3: Motorcycles Inside */}
        <div className="kpi-card" style={{ background: '#ffffff', padding: '20px 24px', borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ri-motorbike-fill" style={{ color: '#2563eb', fontSize: 24 }}></i>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Motorcycles Inside</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{estMotos}</div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Live Two-Wheelers Capacity</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Clickable Zone Selector Cards Bar */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
            Select Building Zone Filter:
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {/* All Zones Card */}
            <div
              onClick={() => setSelectedZoneId('ALL')}
              style={{
                background: selectedZoneId === 'ALL' ? '#eff6ff' : '#ffffff',
                border: `2px solid ${selectedZoneId === 'ALL' ? '#2563eb' : '#e2e8f0'}`,
                borderRadius: 14,
                padding: '12px 14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: selectedZoneId === 'ALL' ? '0 4px 12px rgba(37, 99, 235, 0.12)' : '0 1px 3px rgba(0,0,0,0.03)',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: 13, color: selectedZoneId === 'ALL' ? '#1e3a8a' : '#0f172a' }}>
                  All Zones
                </span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#2563eb', marginTop: 6 }}>
                {totalActiveSpotsCount} <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Active</span>
              </div>
            </div>

            {/* Individual Dynamic Zone Cards */}
            {zones.map((z) => {
              const isSelected = selectedZoneId.toUpperCase() === z.name.toUpperCase();
              const activeInZone = getZoneActiveCount(z.name);

              return (
                <div
                  key={z.id}
                  onClick={() => setSelectedZoneId(z.name)}
                  style={{
                    background: isSelected ? '#eff6ff' : '#ffffff',
                    border: `2px solid ${isSelected ? '#2563eb' : '#e2e8f0'}`,
                    borderRadius: 14,
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.15)' : '0 1px 3px rgba(0,0,0,0.03)',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: 13, color: '#0f172a' }}>
                      {z.name}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#0f172a' }}>{z.tag}</span>
                  </div>

                  <div style={{ fontSize: 20, fontWeight: 800, color: '#2563eb', marginTop: 6 }}>
                    {activeInZone} <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Parked</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Zone Detail Header & Controls Card */}
        <div className="card" style={{ padding: '20px 24px', borderRadius: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <i className="ri-building-2-line" style={{ color: '#2563eb', fontSize: 20 }}></i>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                  {selectedZoneId === 'ALL' ? 'Building Parking Occupancy' : selectedZoneId}
                </h3>
                {selectedZoneId !== 'ALL' && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>
                    {currentSelectedZoneObj?.tag}
                  </span>
                )}
              </div>
            </div>

            {/* Controls: Search, Status, Date & Zone Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {/* Search Bar */}
              <div style={{ position: 'relative', width: 220 }}>
                <i className="ri-search-line" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 14 }}></i>
                <input
                  type="text"
                  placeholder="Search plate, ID, name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#0f172a',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Reservation Status Dropdown */}
              <select
                value={reservationFilter}
                onChange={(e) => setReservationFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#0f172a',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: 10,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="ACTIVE">Currently Parked</option>
                <option value="EXITED">Exited</option>
                <option value="ALL">All Statuses (Parked & Exited)</option>
              </select>

              {/* Zone Select Dropdown */}
              <select
                value={selectedZoneId}
                onChange={(e) => setSelectedZoneId(e.target.value)}
                style={{
                  padding: '8px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#0f172a',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: 10,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">All Zones</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.name}>
                    {z.name} ({z.tag})
                  </option>
                ))}
              </select>

              {/* Date Filter Dropdown */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#0f172a',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: 10,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="custom">Custom Date</option>
                <option value="all">All Dates</option>
              </select>

              {dateFilter === 'custom' && (
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    padding: '7px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#0f172a',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: 10,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
              )}
            </div>
          </div>

          {/* Building Parking Occupancy Table View */}
          <div style={{ marginTop: 8 }}>
            <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #f1f5f9' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Student / User ID</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name & Role</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Registered Vehicle</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Zone</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Entry & Exit Timestamps</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSpots
                    .map((spot, idx) => {
                      let rawIn = spot.entryTime || (spot.scannedTime ? `${spot.scannedTime} (Gate 1 Entry)` : '08:24 AM (Gate 1 Entry)');
                      rawIn = String(rawIn).replace(/^Today\s*•?\s*/i, '').replace(/Admin\s*•?\s*/i, '').replace(/Spot\s*QR\s*Code\s*Scan\s*at/gi, 'Gate 1 Entry at').replace(/Spot\s*QR\s*Scan/gi, 'Gate 1 Entry').replace(/Gate\s*(\d+)\s*Entry\s*Scan/gi, 'Gate $1 Entry').trim();
                      if (!rawIn.includes('(')) {
                        rawIn += ' (Gate 1 Entry)';
                      }
                      const cleanInTime = formatTimeDisplay(rawIn);

                      const cleanOutTime = spot.exitTime
                        ? (spot.exitTime.includes('Active') ? 'Active (In Building)' : formatTimeDisplay(String(spot.exitTime).replace(/^Today\s*•?\s*/i, '')))
                        : 'Active (In Building)';

                      const rawRecordDate = spot.rawDate || spot.savedDate || (spot.timestamp ? String(spot.timestamp).slice(0, 10) : new Date().toISOString().split('T')[0]);
                      const recordDate = formatDateDisplay(rawRecordDate);

                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                          <td style={{ padding: '14px 16px', fontWeight: 700, color: '#475569', fontSize: 12, whiteSpace: 'nowrap' }}>
                            {recordDate}
                          </td>
                          <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a', fontSize: 13 }}>
                            {spot.studentId}
                          </td>
                          <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a', fontSize: 14 }}>
                            {spot.owner}
                            <span style={{ fontSize: 12, color: '#0f172a', fontWeight: 600, marginLeft: 6 }}>({spot.role})</span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 13 }}>
                              {spot.plate || '-'}
                            </span>
                            {spot.plate && spot.plate !== '-' && spot.plate !== 'Unregistered' && spot.province && spot.province !== '-' && (
                              <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 600, marginLeft: 6 }}>
                                ({spot.province})
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: 13, color: '#0f172a', fontWeight: 800 }}>
                            {spot.zone}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: 12, color: '#0f172a', fontWeight: 600 }}>
                            {spot.floor === '-' || spot.pillar === '-' || spot.isSpotSaved === false ? '-' : `${spot.floor}${spot.pillar ? `, ${String(spot.pillar).replace(/\s*\([^)]*\)/gi, '').replace(/^Spot\s+/i, '').replace(/^Pillar\s+/i, '').trim()}` : ''}`}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: 12, color: '#0f172a', fontWeight: 500 }}>
                            <div>
                              <div style={{ fontSize: 12, color: '#0f172a', fontWeight: 700 }}>
                                <i className="ri-login-circle-line" style={{ marginRight: 4, color: '#0f172a' }}></i>
                                In: {cleanInTime}
                              </div>
                              <div style={{ fontSize: 12, color: cleanOutTime && !cleanOutTime.includes('Active') ? '#0f172a' : '#64748b', marginTop: 3, fontWeight: 700 }}>
                                <i className="ri-logout-circle-line" style={{ marginRight: 4, color: cleanOutTime && !cleanOutTime.includes('Active') ? '#0f172a' : '#94a3b8' }}></i>
                                Out: {cleanOutTime}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {filteredSpots.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: 13, fontWeight: 600 }}>
                        No parked vehicles found matching the search or date filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>











      {/* Zone Config Add/Edit Modal */}
      {showZoneModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="card" style={{ width: 620, maxHeight: '90vh', padding: 24, borderRadius: 20, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="ri-layout-grid-line" style={{ color: '#2563eb' }}></i>
                <span>{editingZone ? `Edit Specification: ${editingZone.name}` : 'Add New Building Zone'}</span>
              </h3>
              <button onClick={() => setShowZoneModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 20, width: 32, height: 32, cursor: 'pointer', color: '#475569', fontSize: 18 }}>✕</button>
            </div>

            <form onSubmit={handleSaveZone}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#475569', fontWeight: 700 }}>Zone Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Zone A / Zone B / Zone VIP"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#475569', fontWeight: 700 }}>Target Vehicle / Role Tag *</label>
                  <select
                    value={formTag}
                    onChange={e => setFormTag(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600, outline: 'none' }}
                  >
                    <option value="Cars Only">Cars Only</option>
                    <option value="Motorcycles">Motorcycles</option>
                    <option value="Staff & Faculty">Staff & Faculty</option>
                    <option value="EV Charging Zone">EV Charging Zone</option>
                    <option value="Visitor / Guest">Visitor / Guest</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#475569', fontWeight: 700 }}>Floor / Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ground Floor - Automobile Deck"
                    value={formLocation}
                    onChange={e => setFormLocation(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#475569', fontWeight: 700 }}>Pillars Specification *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pillars G01 - G09 (VIP Entrance)"
                    value={formPillars}
                    onChange={e => setFormPillars(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600 }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#475569', fontWeight: 700 }}>Design Capacity *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 6 Car Spots / Dedicated Motorcycle Area"
                  value={formCapacity}
                  onChange={e => setFormCapacity(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600 }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#475569', fontWeight: 700 }}>
                  Zone Layout Photo URL (User App Display) *
                </label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={formImageUrl}
                  onChange={e => setFormImageUrl(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600, marginBottom: 8 }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#475569', fontWeight: 700 }}>Description / User Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional notes for students & faculty in User App..."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowZoneModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Zone Specifications</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Photo Modal */}
      {selectedPreviewImage && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
          <div className="card" style={{ width: 560, padding: 20, borderRadius: 20, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{selectedPreviewImage.name} Photo</h4>
                <div style={{ fontSize: 12, color: '#64748b' }}>{selectedPreviewImage.location} • {selectedPreviewImage.pillars}</div>
              </div>
              <button onClick={() => setSelectedPreviewImage(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 20, width: 32, height: 32, cursor: 'pointer', color: '#475569', fontSize: 18 }}>✕</button>
            </div>
            <div style={{ borderRadius: 12, overflow: 'hidden', maxHeight: 360, border: '1px solid #cbd5e1' }}>
              <img src={selectedPreviewImage.url} alt={selectedPreviewImage.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
