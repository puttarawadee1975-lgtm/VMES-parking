import React, { useState, useMemo } from 'react';

const SAMPLE_ZONE_IMAGES = [
  { name: 'Ground Floor Car Deck', url: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&auto=format&fit=crop&q=80' },
  { name: 'Motorcycle Two-Wheeler Deck', url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80' },
  { name: 'Faculty & Staff Reserved Deck', url: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600&auto=format&fit=crop&q=80' }
];

// Initial mock data of parking spots (Scanned QR & Admin Locked Reservations)
const INITIAL_REGISTERED_PARKED_SPOTS = [
  {
    id: 'SPOT-65070042',
    owner: 'Thanaphat S.',
    studentId: '65070042',
    ownerEmail: '65070042@student.university.ac.th',
    role: 'Student',
    plate: '1กข 1234',
    province: 'กรุงเทพมหานคร',
    vehicleType: 'motorcycle',
    vehicleName: 'Honda PCX 160 (Black)',
    building: 'VMES Building',
    zone: 'Zone B',
    floor: 'Floor 1',
    pillar: 'Pillar B06-B10',
    entryTime: 'Today • 08:24 AM (Gate 1 Entry Scan)',
    exitTime: 'Active (Currently Parked)',
    scannedTime: 'Today • 08:24 AM',
    entryGate: 'Gate 1 (Main Entrance) at 08:24 AM',
    safetyScore: 98,
    status: 'Active Parked',
    imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'SPOT-65070088',
    owner: 'Puttarawadee T.',
    studentId: '65070088',
    ownerEmail: 'puttarawadee@student.university.ac.th',
    role: 'Student',
    plate: '3กข 8924',
    province: 'กรุงเทพมหานคร',
    vehicleType: 'car',
    vehicleName: 'Toyota Yaris Ativ (Silver)',
    building: 'VMES Building',
    zone: 'Zone A',
    floor: 'Floor G',
    pillar: 'Pillar G05-G09 (VIP Entrance)',
    entryTime: 'Today • 09:10 AM (Gate 1 Entry Scan)',
    exitTime: 'Active (Currently Parked)',
    scannedTime: 'Today • 09:10 AM',
    entryGate: 'Gate 1 (Main Entrance) at 09:10 AM',
    safetyScore: 100,
    status: 'Active Parked',
    imageUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'SPOT-SOMCHAI-P',
    owner: 'Dr. Somchai P.',
    studentId: 'SEC-01',
    ownerEmail: 'somchai@university.ac.th',
    role: 'Staff',
    plate: '9กข 9999',
    province: 'สมุทรปราการ',
    vehicleType: 'car',
    vehicleName: 'Toyota Camry (White)',
    building: 'VMES Building',
    zone: 'Zone C',
    floor: 'Floor 2',
    pillar: 'Pillar C01-C04 (Faculty Area)',
    entryTime: 'Today • 08:10 AM (Gate 2 Entry Scan)',
    exitTime: 'Active (Currently Parked)',
    scannedTime: 'Today • 08:10 AM',
    entryGate: 'Gate 2 (East Entrance) at 08:10 AM',
    safetyScore: 100,
    status: 'Active Parked',
    imageUrl: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'SPOT-LOCKED-VIP',
    owner: 'Cherie Anan (Guest VIP)',
    studentId: '66070112',
    ownerEmail: 'cherie.a@student.university.ac.th',
    role: 'Student',
    plate: '9กฮ 5512',
    province: 'กรุงเทพมหานคร',
    vehicleType: 'car',
    vehicleName: 'Mazda 2 Sedan (Red)',
    building: 'VMES Building',
    zone: 'Zone A',
    floor: 'Floor G',
    pillar: 'Pillar G10-G12',
    entryTime: 'Admin Lock • Pre-Reserved',
    exitTime: 'Hold Duration: 2 Hours (Faculty Lock)',
    scannedTime: 'Admin Lock • Pre-Reserved',
    entryGate: 'Hold Duration: 2 Hours (Faculty Event Lock)',
    safetyScore: 100,
    status: 'Reserved & Locked',
    imageUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'SPOT-65070118',
    owner: 'Nattapong K.',
    studentId: '65070118',
    ownerEmail: '65070118@student.university.ac.th',
    role: 'Student',
    plate: '3กฮ 5678',
    province: 'กรุงเทพมหานคร',
    vehicleType: 'motorcycle',
    vehicleName: 'Yamaha Grand Filano (Gray)',
    building: 'VMES Building',
    zone: 'Zone B',
    floor: 'Floor 1',
    pillar: 'Pillar B01-B05',
    entryTime: 'Today • 09:15 AM (Zone QR Scan)',
    exitTime: 'Active (Currently Parked)',
    scannedTime: 'Today • 09:15 AM',
    entryGate: 'Gate 1 (Main Entrance) at 09:15 AM',
    safetyScore: 80,
    status: 'Active Parked',
    imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'SPOT-65070399',
    owner: 'Pattarapon M.',
    studentId: '65070399',
    ownerEmail: '65070399@student.university.ac.th',
    role: 'Student',
    plate: '5กษ 8888',
    province: 'กรุงเทพมหานคร',
    vehicleType: 'car',
    vehicleName: 'Honda Civic (Black)',
    building: 'VMES Building',
    zone: 'Zone A',
    floor: 'Floor G',
    pillar: 'Pillar G01-G04',
    entryTime: 'Today • 10:25 AM (Gate 2 Entry Scan)',
    exitTime: 'Active (Currently Parked)',
    scannedTime: 'Today • 10:25 AM',
    entryGate: 'Gate 2 (East Entrance) at 10:25 AM',
    safetyScore: 95,
    status: 'Active Parked',
    imageUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'SPOT-65070244',
    owner: 'Chayanan T.',
    studentId: '65070244',
    ownerEmail: '65070244@student.university.ac.th',
    role: 'Student',
    plate: '2กข 4321',
    province: 'นนทบุรี',
    vehicleType: 'motorcycle',
    vehicleName: 'Vespa Sprint 150 (White)',
    building: 'VMES Building',
    zone: 'Zone B',
    floor: 'Floor 1',
    pillar: 'Pillar B08-B12',
    entryTime: 'Today • 11:00 AM (Zone QR Scan)',
    exitTime: 'Active (Currently Parked)',
    scannedTime: 'Today • 11:00 AM',
    entryGate: 'Gate 1 (Main Entrance) at 11:00 AM',
    safetyScore: 100,
    status: 'Active Parked',
    imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80'
  }
];

// Definition of automobile zone layout pillars for visual slot grid (Cars Only)
const ZONE_PILLAR_LAYOUTS = {
  'Zone A': [
    { pillar: 'Pillar G01', spotId: 'SPOT-65070399', label: 'Spot G01' },
    { pillar: 'Pillar G02', spotId: 'SPOT-65070088', label: 'Spot G02' },
    { pillar: 'Pillar G03', spotId: 'SPOT-LOCKED-VIP', isLocked: true, label: 'Spot G03' },
    { pillar: 'Pillar G04', spotId: null, label: 'Spot G04' },
    { pillar: 'Pillar G05', spotId: null, label: 'Spot G05' },
    { pillar: 'Pillar G06', spotId: null, label: 'Spot G06' },
    { pillar: 'Pillar G07', spotId: null, label: 'Spot G07' },
    { pillar: 'Pillar G08', spotId: null, label: 'Spot G08' },
    { pillar: 'Pillar G09', spotId: null, label: 'Spot G09' },
    { pillar: 'Pillar G10', spotId: null, label: 'Spot G10' }
  ],
  'Zone C': [
    { pillar: 'Pillar C01-C04 (Faculty Area)', spotId: 'SPOT-SOMCHAI-P' },
    { pillar: 'Pillar C05-C08', spotId: null, label: 'Available Faculty Spot' },
    { pillar: 'Pillar C09-C12', spotId: null, label: 'Available Staff Spot' }
  ]
};

export default function ParkingOccupancyView({ parkingOccupancy, logs = [], vehicles = [] }) {
  const { total = 18 } = parkingOccupancy || {};

  // Active Main View Tab: 'tracker' (Default) or 'zones-config'
  const [activeSubTab, setActiveSubTab] = useState('tracker');

  // Active Selected Zone for Inspection: 'ALL', 'Zone A', 'Zone B', 'Zone C'
  const [selectedZoneId, setSelectedZoneId] = useState('ALL');

  // Search Query for filter
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate live count from logs
  const estCars = logs.filter(l => l.vehicle_type === 'car' || (l.vehicle && /car/i.test(l.vehicle))).length;
  const estMotos = logs.filter(l => l.vehicle_type === 'motorcycle' || (l.vehicle && /motorcycle/i.test(l.vehicle))).length;

  const availableCarSpots = Math.max(0, total - estCars);

  // State for Registered Account Scanned & Admin Locked Parking Spots
  const [parkedSpots, setParkedSpots] = useState(INITIAL_REGISTERED_PARKED_SPOTS);



  // Modal State for Admin Spot Locking / Reservation
  const [showAdminLockModal, setShowAdminLockModal] = useState(false);
  const [lockTargetOwner, setLockTargetOwner] = useState('');
  const [lockTargetPlate, setLockTargetPlate] = useState('');
  const [lockZone, setLockZone] = useState('Zone A');
  const [lockFloor, setLockFloor] = useState('Floor G');
  const [lockPillar, setLockPillar] = useState('Pillar G10-G12');
  const [lockPurpose, setLockPurpose] = useState('Faculty / Staff Reserved');
  const [lockDuration, setLockDuration] = useState('2 Hours');

  // Dynamic Building Zones List
  const [zones, setZones] = useState([
    {
      id: 'Zone A',
      name: 'Zone A',
      tag: 'Cars Only',
      badgeClass: 'badge-live',
      location: 'Ground Floor - Automobile Deck',
      pillars: 'Pillars G01 - G10',
      capacity: '10 Car Spots',
      imageUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&auto=format&fit=crop&q=80',
      description: 'Main Entrance Automobile Deck with direct lift access.',
      color: '#2563eb',
      bgLight: '#eff6ff'
    },
    {
      id: 'Zone B',
      name: 'Zone B',
      tag: 'Motorcycles',
      badgeClass: 'badge-warning',
      location: 'Floor 1 - Two-Wheeler Deck',
      pillars: 'Pillars B01 - B12 (Ramp Side)',
      capacity: '12 Motorcycle Spots',
      imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80',
      description: 'Dedicated two-wheeler deck with helmet storage.',
      color: '#d97706',
      bgLight: '#fef3c7'
    },
    {
      id: 'Zone C',
      name: 'Zone C',
      tag: 'Staff & Faculty',
      badgeClass: 'badge-secondary',
      location: 'Floor 2 - Reserved Automobile Deck',
      pillars: 'Pillars C01 - C06 (Faculty Area)',
      capacity: '12 Car Spots',
      imageUrl: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600&auto=format&fit=crop&q=80',
      description: 'Reserved deck for university staff and faculty.',
      color: '#9333ea',
      bgLight: '#f3e8ff'
    }
  ]);

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

  // Count active & locked spots per zone
  const getZoneActiveCount = (zoneName) => {
    return parkedSpots.filter(s => (s.status === 'Active Parked' || s.status === 'Reserved & Locked') && s.zone.toUpperCase().includes(zoneName.toUpperCase())).length;
  };

  const getZoneLockedCount = (zoneName) => {
    return parkedSpots.filter(s => s.status === 'Reserved & Locked' && s.zone.toUpperCase().includes(zoneName.toUpperCase())).length;
  };

  // Filtered Scanned & Locked Parking Spots
  const filteredSpots = useMemo(() => {
    return parkedSpots.filter(spot => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || (
        spot.owner.toLowerCase().includes(q) ||
        spot.studentId.toLowerCase().includes(q) ||
        spot.plate.toLowerCase().includes(q) ||
        spot.zone.toLowerCase().includes(q) ||
        spot.pillar.toLowerCase().includes(q) ||
        spot.vehicleName.toLowerCase().includes(q) ||
        spot.status.toLowerCase().includes(q)
      );

      const matchZone = selectedZoneId === 'ALL' || spot.zone.toUpperCase().includes(selectedZoneId.toUpperCase());
      return matchSearch && matchZone;
    });
  }, [parkedSpots, searchQuery, selectedZoneId]);

  // Admin Action: Save New Spot Reservation / Lock
  const handleSaveAdminLockSpot = (e) => {
    e.preventDefault();
    const targetVeh = vehicles.find(v => v.owner === lockTargetOwner || v.id === lockTargetOwner) || vehicles[0];
    const now = new Date();
    const timeStr = `Today • ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newLockedSpot = {
      id: `LOCK-${Date.now().toString().slice(-6)}`,
      owner: lockTargetOwner || (targetVeh ? targetVeh.owner : 'Faculty Reserved'),
      studentId: targetVeh ? targetVeh.id : 'ADMIN-LOCK',
      ownerEmail: targetVeh ? targetVeh.ownerEmail : 'admin@university.ac.th',
      role: targetVeh ? (targetVeh.role || 'Staff') : 'Staff',
      plate: lockTargetPlate || (targetVeh ? targetVeh.plate : '1กข 8924'),
      province: targetVeh ? (targetVeh.province || 'กรุงเทพมหานคร') : 'กรุงเทพมหานคร',
      vehicleType: targetVeh ? targetVeh.vehicle_type : 'car',
      vehicleName: targetVeh ? (targetVeh.vehicle || `${targetVeh.brand} ${targetVeh.model}`) : `${lockPurpose}`,
      building: 'VMES Building',
      zone: lockZone,
      floor: lockFloor,
      pillar: lockPillar,
      scannedTime: `Admin Lock • ${timeStr}`,
      entryGate: `Hold Duration: ${lockDuration} (${lockPurpose})`,
      safetyScore: 100,
      status: 'Reserved & Locked',
      imageUrl: SAMPLE_ZONE_IMAGES[0].url
    };

    setParkedSpots(prev => [newLockedSpot, ...prev]);
    setShowAdminLockModal(false);
  };

  // Admin Action: Unlock / Release a Locked Spot
  const handleUnlockSpot = (spotId) => {
    if (window.confirm('Are you sure you want to unlock and release this reserved parking spot?')) {
      setParkedSpots(prev => prev.filter(s => s.id !== spotId));
    }
  };

  // Zone Config Controls
  const handleOpenAddZone = () => {
    setEditingZone(null);
    setFormName(`Zone ${String.fromCharCode(65 + zones.length)}`);
    setFormTag('Cars Only');
    setFormLocation('Ground Floor');
    setFormPillars('Pillars G10 - G15');
    setFormCapacity('6 Car Spots');
    setFormImageUrl(SAMPLE_ZONE_IMAGES[0].url);
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
      setZones(prev => prev.map(z => z.id === editingZone.id ? {
        ...z,
        name: formName.trim(),
        tag: formTag.trim(),
        badgeClass,
        location: formLocation.trim(),
        pillars: formPillars.trim(),
        capacity: formCapacity.trim(),
        imageUrl: formImageUrl.trim(),
        description: formDescription.trim()
      } : z));
    } else {
      const newZoneObj = {
        id: formName.trim(),
        name: formName.trim(),
        tag: formTag.trim(),
        badgeClass,
        location: formLocation.trim(),
        pillars: formPillars.trim(),
        capacity: formCapacity.trim(),
        imageUrl: formImageUrl.trim() || SAMPLE_ZONE_IMAGES[0].url,
        description: formDescription.trim(),
        color: '#2563eb',
        bgLight: '#eff6ff'
      };
      setZones(prev => [...prev, newZoneObj]);
    }
    setShowZoneModal(false);
  };

  const handleDeleteZone = (zoneId) => {
    if (window.confirm('Are you sure you want to remove this Building Zone specification?')) {
      setZones(prev => prev.filter(z => z.id !== zoneId));
    }
  };

  const totalActiveSpotsCount = parkedSpots.filter(s => s.status === 'Active Parked').length;
  const totalLockedSpotsCount = parkedSpots.filter(s => s.status === 'Reserved & Locked').length;
  const currentSelectedZoneObj = zones.find(z => z.name.toUpperCase() === selectedZoneId.toUpperCase());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Overview KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <div className="kpi-card" style={{ background: '#ffffff', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Active Parked Accounts</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              <i className="ri-qr-scan-2-line"></i>
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', marginTop: 10 }}>
            {totalActiveSpotsCount} <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>Parked Cars/Motos</span>
          </div>
          <div style={{ fontSize: 12, color: '#059669', fontWeight: 600, marginTop: 4 }}>Verified Scanned QR Locations</div>
        </div>

        <div className="kpi-card" style={{ background: '#ffffff', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Locked & Reserved Spots</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              <i className="ri-lock-2-line"></i>
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#d97706', marginTop: 10 }}>
            {totalLockedSpotsCount} <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>Locked Spots</span>
          </div>
          <div style={{ fontSize: 12, color: '#d97706', fontWeight: 600, marginTop: 4 }}>Pre-Booked / VIP Reservations</div>
        </div>

        <div className="kpi-card" style={{ background: '#ffffff', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Available Car Spots</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#dcfce7', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              <i className="ri-checkbox-circle-line"></i>
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#059669', marginTop: 10 }}>{availableCarSpots} <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>Open</span></div>
          <div style={{ fontSize: 12, color: '#059669', fontWeight: 600, marginTop: 4 }}>Ready for Car Entry</div>
        </div>

        <div className="kpi-card" style={{ background: '#ffffff', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Motorcycles Inside</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f3e8ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              <i className="ri-motorbike-line"></i>
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#9333ea', marginTop: 10 }}>{estMotos} <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>Motorcycles</span></div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Tracked via QR Scan</div>
        </div>
      </div>

      {/* Navigation Sub-tab Header */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', background: '#f1f5f9', padding: 4, borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <button 
              onClick={() => setActiveSubTab('tracker')}
              style={{
                padding: '8px 18px',
                borderRadius: 10,
                border: 'none',
                background: activeSubTab === 'tracker' ? '#ffffff' : 'transparent',
                color: activeSubTab === 'tracker' ? '#2563eb' : '#64748b',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: activeSubTab === 'tracker' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <i className="ri-qr-scan-2-line" style={{ fontSize: 16 }}></i>
              Zone-by-Zone Parking Tracker
            </button>

            <button 
              onClick={() => setActiveSubTab('zones-config')}
              style={{
                padding: '8px 18px',
                borderRadius: 10,
                border: 'none',
                background: activeSubTab === 'zones-config' ? '#ffffff' : 'transparent',
                color: activeSubTab === 'zones-config' ? '#2563eb' : '#64748b',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: activeSubTab === 'zones-config' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <i className="ri-layout-grid-line" style={{ fontSize: 16 }}></i>
              Building Zones & Specifications
            </button>
          </div>


        </div>
      </div>

      {/* TAB 1: Zone-by-Zone Clickable Inspection & Lock Management Section */}
      {activeSubTab === 'tracker' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Clickable Zone Selector Cards Bar */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
              Select Zone to Inspect & Lock Spots:
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {/* All Zones Card */}
              <div 
                onClick={() => setSelectedZoneId('ALL')}
                style={{
                  background: selectedZoneId === 'ALL' ? '#eff6ff' : '#ffffff',
                  border: `2px solid ${selectedZoneId === 'ALL' ? '#2563eb' : '#e2e8f0'}`,
                  borderRadius: 16,
                  padding: 16,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: selectedZoneId === 'ALL' ? '0 4px 12px rgba(37, 99, 235, 0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: 15, color: selectedZoneId === 'ALL' ? '#1e3a8a' : '#0f172a' }}>
                    All Building Zones
                  </span>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#3b82f6', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                    <i className="ri-building-2-fill"></i>
                  </div>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#2563eb', marginTop: 8 }}>
                  {totalActiveSpotsCount + totalLockedSpotsCount} <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Active / Locked</span>
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: 600 }}>
                  Overview across all VMES Building floors
                </div>
              </div>

              {/* Individual Dynamic Zone Cards */}
              {zones.map((z) => {
                const isSelected = selectedZoneId.toUpperCase() === z.name.toUpperCase();
                const activeInZone = getZoneActiveCount(z.name);
                const lockedInZone = getZoneLockedCount(z.name);

                return (
                  <div 
                    key={z.id}
                    onClick={() => setSelectedZoneId(z.name)}
                    style={{
                      background: isSelected ? z.bgLight : '#ffffff',
                      border: `2px solid ${isSelected ? z.color : '#e2e8f0'}`,
                      borderRadius: 16,
                      padding: 16,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? `0 4px 12px ${z.color}33` : '0 1px 3px rgba(0,0,0,0.05)',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>
                        {z.name}
                      </span>
                      <span className={`badge ${z.badgeClass}`} style={{ fontSize: 10 }}>{z.tag}</span>
                    </div>

                    <div style={{ fontSize: 24, fontWeight: 800, color: z.color, marginTop: 8 }}>
                      {activeInZone} <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Parked</span>
                      {lockedInZone > 0 && (
                        <span style={{ fontSize: 12, color: '#d97706', fontWeight: 800, marginLeft: 6 }}>
                          ({lockedInZone} 🔒 Locked)
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 11, color: '#475569', marginTop: 4, fontWeight: 600 }}>
                      <i className="ri-map-pin-line" style={{ marginRight: 3, color: z.color }}></i>
                      {z.location}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Zone Detail Header & Visual Pillar Grid */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                    {selectedZoneId === 'ALL' ? 'VMES Building - All Parking Zones' : `Inspecting: ${selectedZoneId}`}
                  </h3>
                  <span className="badge badge-live" style={{ fontSize: 11 }}>
                    {selectedZoneId === 'ALL' ? 'All Vehicles & Locked Spots' : (currentSelectedZoneObj?.tag || 'Zone View')}
                  </span>
                  {(selectedZoneId === 'Zone B' || /motorcycle/i.test(zones.find(z => z.id === selectedZoneId)?.tag || '')) && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '3px 10px', borderRadius: 20, border: '1px solid #bfdbfe' }}>
                      📷 Single Zone QR Code
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  {selectedZoneId === 'ALL' 
                    ? 'Displaying all registered student & staff vehicles and locked reservations across all VMES Building zones.'
                    : `${currentSelectedZoneObj?.location || ''} • ${currentSelectedZoneObj?.pillars || ''}`}
                </div>
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', width: 260 }}>
                <i className="ri-search-line" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                <input 
                  type="text" 
                  placeholder="Search in this zone..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    fontSize: 13,
                    color: '#0f172a',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* All Building Zones Table View */}
            {selectedZoneId === 'ALL' && (
              <div style={{ marginTop: 8 }}>
                <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                  <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Student / User ID</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name & Role</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Registered Vehicle</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Zone & Location</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Entry & Exit Timestamps</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parkedSpots
                        .filter(s => {
                          if (!searchQuery) return true;
                          const q = searchQuery.toLowerCase();
                          return (
                            s.owner?.toLowerCase().includes(q) ||
                            s.studentId?.toLowerCase().includes(q) ||
                            s.plate?.toLowerCase().includes(q) ||
                            s.vehicleName?.toLowerCase().includes(q) ||
                            s.zone?.toLowerCase().includes(q)
                          );
                        })
                        .map((spot, idx) => {
                          const isLocked = spot.status === 'Reserved & Locked';
                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                              <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a', fontSize: 13 }}>
                                {spot.studentId}
                              </td>
                              <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a', fontSize: 14 }}>
                                {spot.owner}
                                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500, marginLeft: 6 }}>({spot.role})</span>
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 13 }}>
                                  {spot.plate}
                                </span>
                                <span style={{ fontSize: 13, color: '#475569', fontWeight: 500, marginLeft: 6 }}>
                                  ({spot.province}) • {spot.vehicleName}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px', fontSize: 12, color: '#475569', fontWeight: 600 }}>
                                <span style={{ fontWeight: 800, color: '#2563eb' }}>{spot.zone}</span> • {spot.floor}
                              </td>
                              <td style={{ padding: '14px 16px', fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                                {isLocked ? (
                                  <span style={{ fontSize: 11, fontWeight: 700, color: '#b45309', background: '#fef3c7', padding: '4px 10px', borderRadius: 20, border: '1px solid #fde68a' }}>
                                    🔒 Reserved & Locked
                                  </span>
                                ) : (
                                  <div>
                                    <div style={{ fontSize: 12, color: '#059669', fontWeight: 700 }}>
                                      <i className="ri-login-circle-line" style={{ marginRight: 4 }}></i>
                                      In: {spot.entryTime || spot.scannedTime || 'Today • 08:24 AM'}
                                    </div>
                                    <div style={{ fontSize: 11, color: spot.exitTime && !spot.exitTime.includes('Active') ? '#dc2626' : '#64748b', marginTop: 3 }}>
                                      <i className="ri-logout-circle-line" style={{ marginRight: 4, color: spot.exitTime && !spot.exitTime.includes('Active') ? '#dc2626' : '#94a3b8' }}></i>
                                      Out: {spot.exitTime || 'Active (In Building)'}
                                    </div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Motorcycle Zone Minimal Table View */}
            {selectedZoneId !== 'ALL' && (selectedZoneId === 'Zone B' || /motorcycle/i.test(zones.find(z => z.id === selectedZoneId)?.tag || '')) && (
              <div style={{ marginTop: 8 }}>
                <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                  <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Student / User ID</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Registered Vehicle</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Entry & Exit Timestamps</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parkedSpots
                        .filter(s => {
                          const matchesZone = s.zone === selectedZoneId || (selectedZoneId === 'Zone B' && (s.vehicleType === 'motorcycle' || /motorcycle/i.test(s.vehicleName)));
                          if (!matchesZone) return false;
                          if (!searchQuery) return true;
                          const q = searchQuery.toLowerCase();
                          return (s.owner?.toLowerCase().includes(q) || s.studentId?.toLowerCase().includes(q) || s.plate?.toLowerCase().includes(q) || s.vehicleName?.toLowerCase().includes(q));
                        })
                        .map((moto, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                            <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a', fontSize: 13 }}>
                              {moto.studentId}
                            </td>
                            <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a', fontSize: 14 }}>
                              {moto.owner}
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 13 }}>
                                {moto.plate}
                              </span>
                              <span style={{ fontSize: 13, color: '#475569', fontWeight: 500, marginLeft: 6 }}>
                                ({moto.province}) • {moto.vehicleName}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px', fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                              <div style={{ fontSize: 12, color: '#059669', fontWeight: 700 }}>
                                <i className="ri-login-circle-line" style={{ marginRight: 4 }}></i>
                                In: {moto.entryTime || moto.scannedTime || 'Today • 08:24 AM'}
                              </div>
                              <div style={{ fontSize: 11, color: moto.exitTime && !moto.exitTime.includes('Active') ? '#dc2626' : '#64748b', marginTop: 3 }}>
                                <i className="ri-logout-circle-line" style={{ marginRight: 4, color: moto.exitTime && !moto.exitTime.includes('Active') ? '#dc2626' : '#94a3b8' }}></i>
                                Out: {moto.exitTime || 'Active (In Building)'}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Visual Pillar Slot Grid for specific Automobile zone view */}
            {selectedZoneId !== 'ALL' && selectedZoneId !== 'Zone B' && !/motorcycle/i.test(zones.find(z => z.id === selectedZoneId)?.tag || '') && ZONE_PILLAR_LAYOUTS[selectedZoneId] && (
              <div style={{ marginBottom: 24, background: '#f8fafc', borderRadius: 16, padding: 18, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="ri-layout-2-line" style={{ color: '#2563eb' }}></i>
                    Interactive Pillar Layout & Spot Lock Grid ({selectedZoneId}):
                  </div>
                  <button
                    onClick={() => {
                      setLockZone(selectedZoneId);
                      setLockPillar(ZONE_PILLAR_LAYOUTS[selectedZoneId][0]?.pillar || '');
                      setShowAdminLockModal(true);
                    }}
                    style={{
                      background: '#fef3c7',
                      border: '1px solid #fde68a',
                      color: '#b45309',
                      fontSize: 12,
                      fontWeight: 800,
                      borderRadius: 10,
                      padding: '6px 14px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    🔒 Lock / Reserve Spot
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                  {ZONE_PILLAR_LAYOUTS[selectedZoneId].map((slot, idx) => {
                    const spotObj = slot.spotId ? parkedSpots.find(s => s.id === slot.spotId) : null;
                    const isSpotLocked = spotObj && spotObj.status === 'Reserved & Locked';
                    const isOccupied = !!spotObj;

                    return (
                      <div 
                        key={idx}
                        onClick={() => {
                          if (!isOccupied) {
                            setLockZone(selectedZoneId);
                            setLockPillar(slot.pillar);
                            setLockTargetOwner('');
                            setLockTargetPlate('');
                            setShowAdminLockModal(true);
                          }
                        }}
                        style={{
                          height: 115,
                          background: isSpotLocked ? '#fffbeb' : '#ffffff',
                          border: `1px solid ${isSpotLocked ? '#f59e0b' : (isOccupied ? '#cbd5e1' : '#e2e8f0')}`,
                          borderRadius: 12,
                          padding: 12,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                          cursor: isOccupied ? 'default' : 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isOccupied) {
                            e.currentTarget.style.borderColor = '#94a3b8';
                            e.currentTarget.style.background = '#f8fafc';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isOccupied) {
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.background = '#ffffff';
                          }
                        }}
                      >
                        {/* Top Header Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: isSpotLocked ? '#b45309' : (isOccupied ? '#1e293b' : '#64748b'),
                            background: isSpotLocked ? '#fef3c7' : '#f1f5f9',
                            padding: '2px 8px',
                            borderRadius: 6
                          }}>
                            {slot.pillar}
                          </span>

                          <span style={{ fontSize: 10, fontWeight: 700, color: isSpotLocked ? '#d97706' : (isOccupied ? '#059669' : '#10b981') }}>
                            {isSpotLocked ? '🔒 LOCKED' : (isOccupied ? '● Occupied' : '🟢 Available')}
                          </span>
                        </div>

                        {/* Middle Content Row */}
                        <div style={{ margin: '4px 0' }}>
                          {isOccupied ? (
                            <>
                              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {spotObj.owner}
                              </div>
                              <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
                                ID: {spotObj.studentId}
                              </div>
                            </>
                          ) : (
                            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                              Available Spot
                            </div>
                          )}
                        </div>

                        {/* Bottom Action / Metadata Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
                          {isOccupied ? (
                            <>
                              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 11 }}>
                                {spotObj.plate}
                              </span>
                              {isSpotLocked && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUnlockSpot(spotObj.id);
                                  }}
                                  style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 10, fontWeight: 800, borderRadius: 6, padding: '2px 8px', cursor: 'pointer' }}
                                >
                                  🔓 Unlock
                                </button>
                              )}
                            </>
                          ) : (
                            <>
                              <span style={{ fontSize: 11, color: '#cbd5e1' }}>
                                -
                              </span>
                              <button
                                style={{
                                  background: '#fef3c7',
                                  border: '1px solid #fde68a',
                                  color: '#b45309',
                                  fontSize: 10,
                                  fontWeight: 800,
                                  borderRadius: 6,
                                  padding: '2px 8px',
                                  cursor: 'pointer'
                                }}
                              >
                                🔒 Lock
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}


          </div>
        </div>
      )}

      {/* TAB 2: Building Zones & Specifications Management */}
      {activeSubTab === 'zones-config' && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="ri-layout-grid-line" style={{ color: '#2563eb' }}></i>
                Building Zones Allocation & Specifications
              </h3>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                Manage Zone layouts, specify pillars, set capacities, and upload zone photos for Mobile App display
              </div>
            </div>

            <button 
              className="btn btn-primary btn-sm"
              onClick={handleOpenAddZone}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, borderRadius: 10, padding: '8px 16px' }}
            >
              <i className="ri-add-line" style={{ fontSize: 16 }}></i>
              Add New Zone
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {zones.map((z) => (
              <div key={z.id} style={{ background: '#ffffff', padding: 18, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 16 }}>{z.name}</span>
                    <span className={`badge ${z.badgeClass}`}>{z.tag}</span>
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                    <i className="ri-map-pin-2-line" style={{ color: '#2563eb', marginRight: 4 }}></i>
                    {z.location}
                  </div>

                  <div style={{ fontSize: 12, color: '#0f172a', fontWeight: 700, marginBottom: 8, background: '#f1f5f9', padding: '6px 10px', borderRadius: 8, display: 'inline-block' }}>
                    <i className="ri-pushpin-line" style={{ color: '#d97706', marginRight: 4 }}></i>
                    {z.pillars || 'Pillars G01-G09'}
                  </div>

                  <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 12 }}>
                    Capacity: <strong style={{ color: '#0f172a' }}>{z.capacity}</strong>
                  </div>

                  {z.imageUrl && (
                    <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', height: 120, marginBottom: 12, border: '1px solid #cbd5e1' }}>
                      <img 
                        src={z.imageUrl} 
                        alt={z.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                      <div style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', color: '#ffffff', padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                        <i className="ri-smartphone-line" style={{ marginRight: 2 }}></i> App Display Ready
                      </div>
                    </div>
                  )}

                  {z.description && (
                    <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic', marginBottom: 12 }}>
                      "{z.description}"
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    style={{ flex: 1, color: '#0f172a', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700, fontSize: 12, padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                    onClick={() => handleOpenEditZone(z)}
                  >
                    <i className="ri-edit-line" style={{ color: '#2563eb' }}></i> Edit Zone & Pillars
                  </button>

                  {z.imageUrl && (
                    <button 
                      className="btn btn-secondary btn-sm" 
                      style={{ color: '#0f172a', border: '1px solid #cbd5e1', background: '#f8fafc', padding: '6px 10px' }}
                      onClick={() => setSelectedPreviewImage({ name: z.name, url: z.imageUrl, location: z.location, pillars: z.pillars })}
                      title="View Full Zone Photo"
                    >
                      <i className="ri-image-line" style={{ color: '#059669' }}></i>
                    </button>
                  )}

                  <button 
                    className="btn btn-secondary btn-sm" 
                    style={{ color: '#dc2626', border: '1px solid #fecaca', background: '#fef2f2', padding: '6px 10px' }}
                    onClick={() => handleDeleteZone(z.id)}
                    title="Delete Zone"
                  >
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}



      {/* ADMIN LOCK & RESERVE PARKING SPOT MODAL */}
      {showAdminLockModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="card" style={{ width: 520, padding: 24, borderRadius: 20, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="ri-lock-2-line" style={{ color: '#d97706' }}></i>
                <span>🔒 Lock & Reserve Parking Spot (Admin)</span>
              </h3>
              <button onClick={() => setShowAdminLockModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 20, width: 32, height: 32, cursor: 'pointer', color: '#475569', fontSize: 18 }}>✕</button>
            </div>

            <form onSubmit={handleSaveAdminLockSpot}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#475569', fontWeight: 700 }}>Select Registered User / Vehicle *</label>
                <select 
                  value={lockTargetOwner} 
                  onChange={e => {
                    setLockTargetOwner(e.target.value);
                    const matched = vehicles.find(v => v.owner === e.target.value);
                    if (matched) setLockTargetPlate(matched.plate);
                  }}
                  style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600, outline: 'none' }}
                >
                  {vehicles.map((v, i) => (
                    <option key={i} value={v.owner}>
                      {v.owner} ({v.id || 'Student'}) — {v.plate} ({v.brand} {v.model})
                    </option>
                  ))}
                  <option value="VIP Guest Speaker">VIP Guest Speaker (Faculty Guest)</option>
                  <option value="Faculty Dean Reserved">Faculty Dean Reserved (Executive / Dean)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#475569', fontWeight: 700 }}>Target Zone *</label>
                  <select 
                    value={lockZone} 
                    onChange={e => {
                      setLockZone(e.target.value);
                      if (e.target.value === 'Zone A') { setLockFloor('Floor G'); setLockPillar('Pillar G10-G12'); }
                      if (e.target.value === 'Zone C') { setLockFloor('Floor 2'); setLockPillar('Pillar C05-C08'); }
                    }}
                    style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600, outline: 'none' }}
                  >
                    <option value="Zone A">Zone A (Ground Floor Automobile - Cars Only)</option>
                    <option value="Zone C">Zone C (Floor 2 Staff/Faculty - Cars Only)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#475569', fontWeight: 700 }}>Target Pillar / Slot *</label>
                  <input 
                    type="text" 
                    value={lockPillar} 
                    onChange={e => setLockPillar(e.target.value)}
                    placeholder="e.g. Pillar G10-G12"
                    style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#475569', fontWeight: 700 }}>Lock Purpose Tag *</label>
                  <select 
                    value={lockPurpose} 
                    onChange={e => setLockPurpose(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600, outline: 'none' }}
                  >
                    <option value="Faculty / Staff Reserved">Faculty / Staff Reserved</option>
                    <option value="VIP Guest Speaker">VIP Guest Speaker</option>
                    <option value="Pre-Booked Student Reservation">Pre-Booked Student Reservation</option>
                    <option value="Special Event Lock">Special Event Lock</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: '#475569', fontWeight: 700 }}>Hold Duration *</label>
                  <select 
                    value={lockDuration} 
                    onChange={e => setLockDuration(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 13, fontWeight: 600, outline: 'none' }}
                  >
                    <option value="30 Minutes">30 Minutes</option>
                    <option value="1 Hour">1 Hour</option>
                    <option value="2 Hours">2 Hours</option>
                    <option value="Full Day Lock (24h)">Full Day Lock (24h)</option>
                    <option value="Indefinite Lock">Indefinite Lock (Until Released)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdminLockModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#d97706', borderColor: '#b45309' }}>
                  🔒 Lock & Reserve Spot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
