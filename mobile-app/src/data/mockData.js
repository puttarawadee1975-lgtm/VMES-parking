// Demo Accounts preset for different roles
export const DEMO_ACCOUNTS = {
  '65070042@student.university.ac.th': {
    role: 'student',
    name: 'Cherie A.',
    studentId: '65070042',
    email: '65070042@student.university.ac.th',
    vehicles: [
      { plate: 'กข 3363 อำนาจเจริญ', model: '🚗 Mazda Mazda2 (Red)' }
    ],
    safetyScore: 98
  },
  'thanawat.p@student.university.ac.th': {
    role: 'student',
    name: 'Thanawat Pongpanich',
    studentId: '64010589',
    email: 'thanawat.p@student.university.ac.th',
    vehicles: [
      { plate: '2EF 5519 Chiang Mai', model: '🛵 Yamaha Aerox (Blue)' }
    ],
    safetyScore: 92
  },
  'security.gate1@university.ac.th': {
    role: 'admin',
    name: 'Officer Somchai',
    studentId: 'SEC-01',
    email: 'security.gate1@university.ac.th',
    vehicles: [],
    safetyScore: 100
  }
};

// Simulated vehicles cycling through AI CCTV camera
export const SIMULATED_VEHICLES = [
  {
    plate: '1AB 8924 Bangkok',
    plateShort: '1AB 8924 BKK',
    helmet: 'HELMET',
    helmetText: 'Helmet On',
    confHelmet: 0.95,
    confPlate: 0.91,
    vehicle: 'Honda Click 160',
    driverColor: '#0284c7',
    gate: 'Gate 1 (Main Entrance)',
    isViolation: false
  },
  {
    plate: '2EF 5519 Chiang Mai',
    plateShort: '2EF 5519 CM',
    helmet: 'NO_HELMET',
    helmetText: 'No Helmet',
    confHelmet: 0.89,
    confPlate: 0.88,
    vehicle: 'Yamaha Aerox',
    driverColor: '#e11d48',
    gate: 'Gate 1 (Main Entrance)',
    isViolation: true
  },
  {
    plate: '3CD 4512 Bangkok',
    plateShort: '3CD 4512 BKK',
    helmet: 'HELMET',
    helmetText: 'Helmet On',
    confHelmet: 0.97,
    confPlate: 0.94,
    vehicle: 'Vespa Sprint 150',
    driverColor: '#7c3aed',
    gate: 'Gate 2 (Dormitory Zone)',
    isViolation: false
  },
  {
    plate: '1GH 7812 Khon Kaen',
    plateShort: '1GH 7812 KK',
    helmet: 'NO_HELMET',
    helmetText: 'No Helmet',
    confHelmet: 0.92,
    confPlate: 0.87,
    vehicle: 'Honda Wave 125i',
    driverColor: '#d97706',
    gate: 'Gate 1 (Main Entrance)',
    isViolation: true
  },
  {
    plate: '5IJ 1284 Nakhon Ratchasima',
    plateShort: '5IJ 1284 NM',
    helmet: 'HELMET',
    helmetText: 'Helmet On',
    confHelmet: 0.97,
    confPlate: 0.94,
    vehicle: 'Honda PCX 160',
    driverColor: '#0891b2',
    gate: 'Gate 3 (Faculty Complex)',
    isViolation: false
  }
];

export const ENGLISH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function getEnglishFormattedDate(dateInput = new Date()) {
  const d = new Date(dateInput);
  const day = d.getDate();
  const month = ENGLISH_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function getEnglishFormattedTime(dateInput = new Date()) {
  const d = new Date(dateInput);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// Preset Parking Spots:
// 1. Zone A Floor G
// 2. Zone B Floor G
// 3. Zone C Floor G
// Building: VMES Building
export const PRESET_ZONES = [
  {
    id: 'ZONE-A',
    zone: 'Zone A',
    building: 'VMES Building',
    floor: 'Floor G',
    pillar: 'G05-G09',
    description: 'VIP Front Entrance Zone'
  },
  {
    id: 'ZONE-B',
    zone: 'Zone B',
    building: 'VMES Building',
    floor: 'Floor G',
    pillar: 'G06-G10',
    description: 'East Wing Zone'
  },
  {
    id: 'ZONE-C',
    zone: 'Zone C',
    building: 'VMES Building',
    floor: 'Floor G',
    pillar: 'G11-G15',
    description: 'West Wing Zone'
  }
];

export const INITIAL_DETECTION_LOGS = [
  { id: 'LOG-1004', time: '08:24:12', plate: '5IJ 1284 Nakhon Ratchasima', plateShort: '5IJ 1284 NM', helmet: 'HELMET', helmetText: 'Helmet On', gate: 'Gate 3 (Faculty Complex)', isViolation: false, vehicle: 'Honda PCX 160' },
  { id: 'LOG-1003', time: '08:22:45', plate: '1GH 7812 Khon Kaen', plateShort: '1GH 7812 KK', helmet: 'NO_HELMET', helmetText: 'No Helmet', gate: 'Gate 1 (Main Entrance)', isViolation: true, vehicle: 'Honda Wave 125i' },
  { id: 'LOG-1002', time: '08:19:30', plate: '3CD 4512 Bangkok', plateShort: '3CD 4512 BKK', helmet: 'HELMET', helmetText: 'Helmet On', gate: 'Gate 2 (Dormitory Zone)', isViolation: false, vehicle: 'Vespa Sprint 150' },
  { id: 'LOG-1001', time: '08:15:02', plate: '2EF 5519 Chiang Mai', plateShort: '2EF 5519 CM', helmet: 'NO_HELMET', helmetText: 'No Helmet', gate: 'Gate 1 (Main Entrance)', isViolation: true, vehicle: 'Yamaha Aerox' },
  { id: 'LOG-1000', time: '08:10:48', plate: '1AB 8924 Bangkok', plateShort: '1AB 8924 BKK', helmet: 'HELMET', helmetText: 'Helmet On', gate: 'Gate 1 (Main Entrance)', isViolation: false, vehicle: 'Honda Click 160' }
];

