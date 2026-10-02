// Demo Accounts preset for different roles
export const DEMO_ACCOUNTS = {
  'u6814509@au.edu': {
    role: 'student',
    name: 'Student U6814509',
    studentId: '6814509',
    email: 'u6814509@au.edu',
    vehicles: [
      { plate: '3KH 5678 Bangkok', model: '🚗 Honda Civic RS (Black)' }
    ],
    safetyScore: 100
  },
  '65070042@student.university.ac.th': {
    role: 'student',
    name: 'Cherie A.',
    studentId: '65070042',
    email: '65070042@student.university.ac.th',
    vehicles: [
      { plate: '1AB 8924 Bangkok', model: '🛵 Honda PCX 160 (White)' }
    ],
    safetyScore: 100
  },
  'thanawat.p@student.university.ac.th': {
    role: 'student',
    name: 'Thanawat Pongpanich',
    studentId: '64010589',
    email: 'thanawat.p@student.university.ac.th',
    vehicles: [
      { plate: '2EF 5519 Chiang Mai', model: '🛵 Yamaha NMAX (Gray)' }
    ],
    safetyScore: 100
  },


  'faculty.staff@au.edu': {
    role: 'staff',
    name: 'Dr. Somchai',
    staffId: 'STF-1024',
    email: 'faculty.staff@au.edu',
    vehicles: [
      { plate: '1KK 1234 Bangkok', model: '🚗 Toyota Camry (White)' }
    ],
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

export const getThaiFormattedDate = getEnglishFormattedDate;
export const getThaiFormattedTime = getEnglishFormattedTime;

export const NAV_MAP_ASSETS = {
  'A-01': require('../../assets/nav_maps/nav_A-01.png'),
  'A-02': require('../../assets/nav_maps/nav_A-02.png'),
  'A-03': require('../../assets/nav_maps/nav_A-03.png'),
  'A-04': require('../../assets/nav_maps/nav_A-04.png'),
  'A-05': require('../../assets/nav_maps/nav_A-05.png'),
  'A-06': require('../../assets/nav_maps/nav_A-06.png'),
  'A-07': require('../../assets/nav_maps/nav_A-07.png'),
  'A-08': require('../../assets/nav_maps/nav_A-08.png'),
  'A-09': require('../../assets/nav_maps/nav_A-09.png'),
  'A-10': require('../../assets/nav_maps/nav_A-10.png'),
  'B-01': require('../../assets/nav_maps/nav_B-01.png'),
  'B-02': require('../../assets/nav_maps/nav_B-02.png'),
  'C-01': require('../../assets/nav_maps/nav_C-01.png'),
  'C-02': require('../../assets/nav_maps/nav_C-02.png'),
  'C-03': require('../../assets/nav_maps/nav_C-03.png'),
  'C-04': require('../../assets/nav_maps/nav_C-04.png'),
  'C-05': require('../../assets/nav_maps/nav_C-05.png'),
  'C-06': require('../../assets/nav_maps/nav_C-06.png'),
  'C-07': require('../../assets/nav_maps/nav_C-07.png'),
  'C-08': require('../../assets/nav_maps/nav_C-08.png'),
  'D-01': require('../../assets/nav_maps/nav_D-01.png'),
};

export function getNavMapAsset(spotCode) {
  if (!spotCode) return NAV_MAP_ASSETS['A-01'];
  const cleanCode = spotCode.replace(/^(Spot|Pillar)\s+/i, '').trim();
  return NAV_MAP_ASSETS[cleanCode] || NAV_MAP_ASSETS['A-01'];
}

// Permanent Fixed 21 Parking Spots across 4 Zones (VMES Building, Floor G)
export const PRESET_ZONES = [
  // Zone A (10 Spots: Spot A-01 to Spot A-10)
  ...Array.from({ length: 10 }, (_, i) => {
    const num = String(i + 1).padStart(2, '0');
    const spotCode = `A-${num}`;
    return {
      id: `VMES-G-ZONEA-A${num}`,
      zone: 'Zone A',
      building: 'VMES Building',
      floor: 'Floor G',
      pillar: `Spot A-${num}`,
      description: `VMES Floor G - Zone A Spot A-${num}`,
      imageUrl: `/static/zone_a_building.jpg,/static/zone_a_spot.jpg,/static/nav_maps/nav_${spotCode}.png`,
      imageUrls: [
        '/static/zone_a_building.jpg',
        '/static/zone_a_spot.jpg',
        `/static/nav_maps/nav_${spotCode}.png`
      ],
      images: [
        require('../../assets/zone_a_building.jpg'),
        require('../../assets/zone_a_spot.jpg'),
        NAV_MAP_ASSETS[spotCode]
      ]
    };
  }),

  // Zone B (2 Spots: Spot B-01 to Spot B-02)
  ...Array.from({ length: 2 }, (_, i) => {
    const num = String(i + 1).padStart(2, '0');
    const spotCode = `B-${num}`;
    return {
      id: `VMES-G-ZONEB-B${num}`,
      zone: 'Zone B',
      building: 'VMES Building',
      floor: 'Floor G',
      pillar: `Spot B-${num}`,
      description: `VMES Floor G - Zone B Spot B-${num}`,
      imageUrl: `/static/zone_b_building.jpg,/static/zone_b_spot.jpg,/static/nav_maps/nav_${spotCode}.png`,
      imageUrls: [
        '/static/zone_b_building.jpg',
        '/static/zone_b_spot.jpg',
        `/static/nav_maps/nav_${spotCode}.png`
      ],
      images: [
        require('../../assets/zone_b_building.jpg'),
        require('../../assets/zone_b_spot.jpg'),
        NAV_MAP_ASSETS[spotCode]
      ]
    };
  }),

  // Zone C (8 Spots: Spot C-01 to Spot C-08)
  ...Array.from({ length: 8 }, (_, i) => {
    const num = String(i + 1).padStart(2, '0');
    const spotCode = `C-${num}`;
    const isC08 = (i + 1) === 8;
    return {
      id: `VMES-G-ZONEC-C${num}`,
      zone: 'Zone C',
      building: 'VMES Building',
      floor: 'Floor G',
      pillar: `Spot C-${num}`,
      description: `VMES Floor G - Zone C Spot C-${num}`,
      imageUrl: isC08 ? `/static/zone_c_c08_building.jpg,/static/zone_c_c08_spot.jpg,/static/nav_maps/nav_${spotCode}.png` : `/static/zone_c_building.jpg,/static/zone_c_spot.jpg,/static/nav_maps/nav_${spotCode}.png`,
      imageUrls: isC08 ? [
        '/static/zone_c_c08_building.jpg',
        '/static/zone_c_c08_spot.jpg',
        `/static/nav_maps/nav_${spotCode}.png`
      ] : [
        '/static/zone_c_building.jpg',
        '/static/zone_c_spot.jpg',
        `/static/nav_maps/nav_${spotCode}.png`
      ],
      images: isC08 ? [
        require('../../assets/zone_c_c08_building.jpg'),
        require('../../assets/zone_c_c08_spot.jpg'),
        NAV_MAP_ASSETS[spotCode]
      ] : [
        require('../../assets/zone_c_building.jpg'),
        require('../../assets/zone_c_spot.jpg'),
        NAV_MAP_ASSETS[spotCode]
      ]
    };
  }),

  // Zone D (1 Spot: Spot D-01)
  {
    id: 'VMES-G-ZONED-D01',
    zone: 'Zone D',
    building: 'VMES Building',
    floor: 'Floor G',
    pillar: 'Spot D-01',
    description: 'VMES Floor G - Zone D Spot D-01',
    imageUrl: '/static/zone_d_building.jpg,/static/zone_d_spot.jpg,/static/nav_maps/nav_D-01.png',
    imageUrls: [
      '/static/zone_d_building.jpg',
      '/static/zone_d_spot.jpg',
      '/static/nav_maps/nav_D-01.png'
    ],
    images: [
      require('../../assets/zone_d_building.jpg'),
      require('../../assets/zone_d_spot.jpg'),
      NAV_MAP_ASSETS['D-01']
    ]
  }
];

export const INITIAL_DETECTION_LOGS = [
  { id: 'LOG-1004', time: '08:24:12', plate: '5IJ 1284 Nakhon Ratchasima', plateShort: '5IJ 1284 NM', helmet: 'HELMET', helmetText: 'Helmet On', gate: 'Gate 3 (Faculty Complex)', isViolation: false, vehicle: 'Honda PCX 160' },
  { id: 'LOG-1003', time: '08:22:45', plate: '1GH 7812 Khon Kaen', plateShort: '1GH 7812 KK', helmet: 'NO_HELMET', helmetText: 'No Helmet', gate: 'Gate 1 (Main Entrance)', isViolation: true, vehicle: 'Honda Wave 125i' },
  { id: 'LOG-1002', time: '08:19:30', plate: '3CD 4512 Bangkok', plateShort: '3CD 4512 BKK', helmet: 'HELMET', helmetText: 'Helmet On', gate: 'Gate 2 (Dormitory Zone)', isViolation: false, vehicle: 'Vespa Sprint 150' },
  { id: 'LOG-1001', time: '08:15:02', plate: '2EF 5519 Chiang Mai', plateShort: '2EF 5519 CM', helmet: 'NO_HELMET', helmetText: 'No Helmet', gate: 'Gate 1 (Main Entrance)', isViolation: true, vehicle: 'Yamaha Aerox' },
  { id: 'LOG-1000', time: '08:10:48', plate: '1AB 8924 Bangkok', plateShort: '1AB 8924 BKK', helmet: 'HELMET', helmetText: 'Helmet On', gate: 'Gate 1 (Main Entrance)', isViolation: false, vehicle: 'Honda Click 160' }
];

