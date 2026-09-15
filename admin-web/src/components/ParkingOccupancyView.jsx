import React, { useState, useMemo } from 'react';

const SAMPLE_ZONE_IMAGES = [
  { name: 'Ground Floor Car Deck', url: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&auto=format&fit=crop&q=80' },
  { name: 'Motorcycle Two-Wheeler Deck', url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80' },
  { name: 'Faculty & Staff Car Deck', url: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600&auto=format&fit=crop&q=80' }
];

// Initial mock data of parking spots (Camera ALPR)
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
    floor: 'Floor G',
    pillar: 'Spot B-01',
    entryTime: '08:24 AM (Gate 1 Entry)',
    exitTime: 'Active (In Building)',
    scannedTime: '08:24 AM',
    entryGate: 'Gate 1 Entry at 08:24 AM',
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
    pillar: 'Spot A-02',
    entryTime: '09:10 AM (Gate 1 Entry)',
    exitTime: 'Active (In Building)',
    scannedTime: '09:10 AM',
    entryGate: 'Gate 1 Entry at 09:10 AM',
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
    floor: 'Floor G',
    pillar: 'Spot C-01',
    entryTime: '08:10 AM (Gate 2 Entry)',
    exitTime: 'Active (In Building)',
    scannedTime: '08:10 AM',
    entryGate: 'Gate 2 Entry at 08:10 AM',
    safetyScore: 100,
    status: 'Active Parked',
    imageUrl: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'SPOT-66070112',
    owner: 'Cherie Anan',
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
    pillar: 'Spot A-03',
    entryTime: '08:00 AM (Gate 1 Entry)',
    exitTime: 'Active (In Building)',
    scannedTime: '08:00 AM',
    entryGate: 'Gate 1 (Main Entrance) at 08:00 AM',
    safetyScore: 100,
    status: 'Active Parked',
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
    floor: 'Floor G',
    pillar: 'Spot B-02',
    entryTime: '09:15 AM (Gate 1 Entry)',
    exitTime: 'Active (In Building)',
    scannedTime: '09:15 AM',
    entryGate: 'Gate 1 Entry at 09:15 AM',
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
    pillar: 'Spot A-01',
    entryTime: '10:25 AM (Gate 1 Entry)',
    exitTime: 'Active (In Building)',
    scannedTime: '10:25 AM',
    entryGate: 'Gate 1 Entry at 10:25 AM',
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
    zone: 'Zone D',
    floor: 'Floor G',
    pillar: 'Spot D-01',
    entryTime: '11:00 AM (Gate 2 Entry)',
    exitTime: 'Active (In Building)',
    scannedTime: '11:00 AM',
    entryGate: 'Gate 2 Entry at 11:00 AM',
    safetyScore: 100,
    status: 'Active Parked',
    imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'SPOT-65070512',
    owner: 'Kittisak W.',
    studentId: '65070512',
    ownerEmail: '65070512@student.university.ac.th',
    role: 'Student',
    plate: '4กม 7777',
    province: 'กรุงเทพมหานคร',
    vehicleType: 'motorcycle',
    vehicleName: 'GPX Drone 150 (Red)',
    building: 'VMES Building',
    zone: 'Zone B',
    floor: 'Floor G',
    pillar: 'Spot B-01',
    entryTime: '07:45 AM (Gate 1 Entry)',
    exitTime: 'Active (In Building)',
    scannedTime: '07:45 AM',
    entryGate: 'Gate 1 (Main Entrance) at 07:45 AM',
    safetyScore: 50,
    status: 'Active Parked',
    imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80'
  }
];

// Historical parking records log
const INITIAL_PARKING_HISTORY = [
  {
    id: 'HIST-1001',
    date: '2026-09-14',
    entryTime: '08:15 AM (Gate 1 Entry)',
    exitTime: '12:45 PM (Exit Gate 1)',
    duration: '4h 30m',
    spot: 'Spot A-01',
    zone: 'Zone A',
    studentId: '65070088',
    owner: 'Puttarawadee T.',
    role: 'Student',
    plate: '3กข 8924',
    province: 'กรุงเทพมหานคร',
    vehicleName: 'Toyota Yaris Ativ (Silver)',
    vehicleType: 'car',
    status: 'Completed'
  },
  {
    id: 'HIST-1002',
    date: '2026-09-14',
    entryTime: '07:50 AM (Gate 2 Entry)',
    exitTime: '16:20 PM (Exit Gate 1)',
    duration: '8h 30m',
    spot: 'Spot C-01',
    zone: 'Zone C',
    studentId: 'SEC-01',
    owner: 'Dr. Somchai P.',
    role: 'Staff',
    plate: '9กข 9999',
    province: 'สมุทรปราการ',
    vehicleName: 'Toyota Camry (White)',
    vehicleType: 'car',
    status: 'Completed'
  },
  {
    id: 'HIST-1003',
    date: '2026-09-14',
    entryTime: '08:24 AM (Gate 1 Entry)',
    exitTime: '12:30 PM (Exit Gate 2)',
    duration: '4h 06m',
    spot: 'Spot B-01',
    zone: 'Zone B',
    studentId: '65070042',
    owner: 'Thanaphat S.',
    role: 'Student',
    plate: '1กข 1234',
    province: 'กรุงเทพมหานคร',
    vehicleName: 'Honda PCX 160 (Black)',
    vehicleType: 'motorcycle',
    status: 'Completed'
  },
  {
    id: 'HIST-1004',
    date: '2026-09-13',
    entryTime: '09:00 AM (Gate 1 Entry)',
    exitTime: '15:10 PM (Exit Gate 1)',
    duration: '6h 10m',
    spot: 'Spot A-03',
    zone: 'Zone A',
    studentId: '66070112',
    owner: 'Cherie Anan',
    role: 'Student',
    plate: '9กฮ 5512',
    province: 'กรุงเทพมหานคร',
    vehicleName: 'Mazda 2 Sedan (Red)',
    vehicleType: 'car',
    status: 'Completed'
  },
  {
    id: 'HIST-1005',
    date: '2026-09-13',
    entryTime: '10:15 AM (Gate 2 Entry)',
    exitTime: '17:45 PM (Exit Gate 2)',
    duration: '7h 30m',
    spot: 'Spot D-01',
    zone: 'Zone D',
    studentId: '65070244',
    owner: 'Chayanan T.',
    role: 'Student',
    plate: '2กข 4321',
    province: 'นนทบุรี',
    vehicleName: 'Vespa Sprint 150 (White)',
    vehicleType: 'motorcycle',
    status: 'Completed'
  },
  {
    id: 'HIST-1006',
    date: '2026-09-12',
    entryTime: '08:30 AM (Gate 1 Entry)',
    exitTime: '13:00 PM (Exit Gate 1)',
    duration: '4h 30m',
    spot: 'Spot A-02',
    zone: 'Zone A',
    studentId: '65070399',
    owner: 'Puttarapon M.',
    role: 'Student',
    plate: '5กษ 8888',
    province: 'กรุงเทพมหานคร',
    vehicleName: 'Honda Civic (Black)',
    vehicleType: 'car',
    status: 'Completed'
  }
];

// Definition of zone layout spots for visual slot grid
const ZONE_PILLAR_LAYOUTS = {
  'Zone A': [
    { pillar: 'Spot A-01', spotId: 'SPOT-65070399', label: 'Spot A-01' },
    { pillar: 'Spot A-02', spotId: 'SPOT-65070088', label: 'Spot A-02' },
    { pillar: 'Spot A-03', spotId: 'SPOT-66070112', label: 'Spot A-03' },
    { pillar: 'Spot A-04', spotId: null, label: 'Spot A-04' },
    { pillar: 'Spot A-05', spotId: null, label: 'Spot A-05' },
    { pillar: 'Spot A-06', spotId: null, label: 'Spot A-06' },
    { pillar: 'Spot A-07', spotId: null, label: 'Spot A-07' },
    { pillar: 'Spot A-08', spotId: null, label: 'Spot A-08' },
    { pillar: 'Spot A-09', spotId: null, label: 'Spot A-09' },
    { pillar: 'Spot A-10', spotId: null, label: 'Spot A-10' }
  ],
  'Zone B': [
    { pillar: 'Spot B-01', spotId: 'SPOT-65070042', label: 'Side B-01' },
    { pillar: 'Spot B-02', spotId: 'SPOT-65070118', label: 'Side B-02' }
  ],
  'Zone C': [
    { pillar: 'Spot C-01', spotId: 'SPOT-SOMCHAI-P', label: 'Spot C-01' },
    { pillar: 'Spot C-02', spotId: null, label: 'Spot C-02' },
    { pillar: 'Spot C-03', spotId: null, label: 'Spot C-03' },
    { pillar: 'Spot C-04', spotId: null, label: 'Spot C-04' },
    { pillar: 'Spot C-05', spotId: null, label: 'Spot C-05' },
    { pillar: 'Spot C-06', spotId: null, label: 'Spot C-06' },
    { pillar: 'Spot C-07', spotId: null, label: 'Spot C-07' },
    { pillar: 'Spot C-08', spotId: null, label: 'Spot C-08' }
  ],
  'Zone D': [
    { pillar: 'Spot D-01', spotId: 'SPOT-65070244', label: 'Spot D-01' }
  ]
};

export default function ParkingOccupancyView({ parkingOccupancy, logs = [], vehicles = [] }) {
  const {
    total = 21,
    occupied = 0,
    available = 0,
    rate = 0
  } = parkingOccupancy || {};


  // Search & Date Filter Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('today');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reservationFilter, setReservationFilter] = useState('ACTIVE');

  // Calculate live count from logs & occupancy
  const estCars = occupied > 0 ? occupied : logs.filter(l => l.vehicle_type === 'car' || (l.vehicle && /car/i.test(l.vehicle))).length;
  const estMotos = (logs || []).filter(l => l.vehicle_type === 'motorcycle' || (l.vehicle && /motorcycle|มอเตอร์ไซค์/i.test(l.vehicle))).length;

  const availableCarSpots = available > 0 ? available : Math.max(0, total - estCars);
  const carRate = rate;

  // State for Registered Account Scanned & Admin Locked Parking Spots
  const [parkedSpots, setParkedSpots] = useState(INITIAL_REGISTERED_PARKED_SPOTS);

  // Dynamic Building Zones State
  const [zones, setZones] = useState([
    {
      id: 'Zone A',
      name: 'Zone A',
      tag: 'Cars Only',
      badgeClass: 'badge-live',
      location: 'Floor G - Automobile Deck A',
      pillars: 'Spots A-01 - A-10',
      capacity: '10 Car Spots',
      imageUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&auto=format&fit=crop&q=80',
      description: 'Automobile Deck A (A-01 to A-10).',
      color: '#2563eb',
      bgLight: '#eff6ff'
    },
    {
      id: 'Zone B',
      name: 'Zone B',
      tag: 'Motorcycles',
      badgeClass: 'badge-warning',
      location: 'Floor G - Motorcycle Deck B',
      pillars: 'Spots B-01, B-02 (2 Sides)',
      capacity: '2 Motorcycle Sides',
      imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80',
      description: 'Motorcycle Deck B with 2 sides (B-01, B-02).',
      color: '#d97706',
      bgLight: '#fef3c7'
    },
    {
      id: 'Zone C',
      name: 'Zone C',
      tag: 'Cars Only',
      badgeClass: 'badge-live',
      location: 'Floor G - Automobile Deck C',
      pillars: 'Spots C-01 - C-08',
      capacity: '8 Car Spots',
      imageUrl: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600&auto=format&fit=crop&q=80',
      description: 'Automobile Deck C (C-01 to C-08).',
      color: '#9333ea',
      bgLight: '#f3e8ff'
    },
    {
      id: 'Zone D',
      name: 'Zone D',
      tag: 'Motorcycles',
      badgeClass: 'badge-warning',
      location: 'Floor G - Motorcycle Deck D',
      pillars: 'Spot D-01',
      capacity: '1 Motorcycle Spot',
      imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80',
      description: 'Single Motorcycle Deck D (D-01).',
      color: '#059669',
      bgLight: '#dcfce7'
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

  // Count active spots per zone
  const getZoneActiveCount = (zoneName) => {
    return parkedSpots.filter(s => s.status === 'Active Parked' && s.zone.toUpperCase().includes(zoneName.toUpperCase())).length;
  };


  // Filtered Scanned Parking Spots
  const filteredSpots = useMemo(() => {
    return parkedSpots.filter(spot => {
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
      const matchZone = selectedZoneId === 'ALL' || spot.zone.toUpperCase().includes(selectedZoneId.toUpperCase());

      // 3. Date Filter
      let matchDate = true;
      if (dateFilter !== 'all') {
        const itemDate = spot.rawDate ? new Date(spot.rawDate) : (spot.timestamp ? new Date(spot.timestamp) : new Date());
        const today = new Date();
        if (dateFilter === 'today') {
          matchDate = itemDate.toDateString() === today.toDateString();
        } else if (dateFilter === 'yesterday') {
          const yest = new Date(today);
          yest.setDate(yest.getDate() - 1);
          matchDate = itemDate.toDateString() === yest.toDateString();
        } else if (dateFilter === 'custom' && selectedDate) {
          const [year, month, day] = selectedDate.split('-').map(Number);
          matchDate = itemDate.getFullYear() === year && (itemDate.getMonth() + 1) === month && itemDate.getDate() === day;
        }
      }

      // 4. Status Filter
      let matchStatus = true;
      if (reservationFilter === 'ACTIVE') {
        matchStatus = spot.status === 'Active Parked';
      }

      return matchSearch && matchZone && matchDate && matchStatus;
    });
  }, [parkedSpots, searchQuery, selectedZoneId, dateFilter, selectedDate, reservationFilter]);

  // Filtered Historical Parking Records
  const filteredHistory = useMemo(() => {
    return INITIAL_PARKING_HISTORY.filter(item => {
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

      let matchDate = true;
      if (dateFilter !== 'all') {
        const todayStr = new Date().toISOString().split('T')[0];
        if (dateFilter === 'today') {
          matchDate = item.date === todayStr;
        } else if (dateFilter === 'yesterday') {
          const yest = new Date();
          yest.setDate(yest.getDate() - 1);
          matchDate = item.date === yest.toISOString().split('T')[0];
        } else if (dateFilter === 'custom' && selectedDate) {
          matchDate = item.date === selectedDate;
        }
      }

      return matchSearch && matchZone && matchDate;
    });
  }, [searchQuery, selectedZoneId, dateFilter, selectedDate]);



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
  const currentSelectedZoneObj = zones.find(z => z.name.toUpperCase() === selectedZoneId.toUpperCase() || z.id.toUpperCase() === selectedZoneId.toUpperCase());
  const isMotorcycleZone = currentSelectedZoneObj ? /motorcycle/i.test(currentSelectedZoneObj.tag || '') : false;

  const todayStr = new Date().toISOString().split('T')[0];
  const exitedTodayCount = INITIAL_PARKING_HISTORY.filter(h => h.date === todayStr).length;

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
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{totalActiveSpotsCount}</div>
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
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Campus Building (18 Car Spots)</div>
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
                    background: isSelected ? z.bgLight : '#ffffff',
                    border: `2px solid ${isSelected ? z.color : '#e2e8f0'}`,
                    borderRadius: 14,
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? `0 4px 12px ${z.color}22` : '0 1px 3px rgba(0,0,0,0.03)',
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
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                {selectedZoneId === 'ALL'
                  ? 'Track real-time vehicle entry and exit timestamps.'
                  : `${currentSelectedZoneObj?.location || ''}`}
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
                    padding: '7px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#0f172a',
                    background: '#ffffff',
                    border: '1px solid #2563eb',
                    borderRadius: 10,
                    outline: 'none'
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
                      const cleanInTime = rawIn;

                      const cleanOutTime = spot.exitTime
                        ? String(spot.exitTime).replace(/^Today\s*•?\s*/i, '')
                        : 'Active (In Building)';

                      const recordDate = spot.rawDate || new Date().toISOString().split('T')[0];

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
                              {spot.plate}
                            </span>
                            <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 600, marginLeft: 6 }}>
                              ({spot.province})
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: 13, color: '#0f172a', fontWeight: 800 }}>
                            {spot.zone}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: 12, color: '#0f172a', fontWeight: 600 }}>
                            {spot.floor}{spot.pillar ? `, ${String(spot.pillar).replace(/\s*\([^)]*\)/gi, '').trim()}` : ''}
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
