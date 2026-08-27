/**
 * SafeRide AI - Authentication & User State Management
 * Supports Google Student Email Sign-in, Direct Student Email, and Guest Mode
 */

const AuthModule = (function () {
  const STORAGE_KEY = 'saferide_auth_user';

  // State
  let currentUser = null;
  const authListeners = [];

  // Default demo student accounts
  const DEMO_ACCOUNTS = {
    '65070042@student.university.ac.th': {
      role: 'student',
      name: 'Cherie A.',
      studentId: '65070042',
      email: '65070042@student.university.ac.th',
      vehicles: [
        { plate: '1กข 8924 กรุงเทพมหานคร', model: 'Honda Click 160 (สีดำ-แดง)' },
        { plate: '3ขพ 4512 กรุงเทพมหานคร', model: 'Yamaha Grand Filano (สีขาว)' }
      ],
      safetyScore: 98
    },
    'thanawat.p@student.university.ac.th': {
      role: 'student',
      name: 'Thanawat Pongpanich',
      studentId: '64010589',
      email: 'thanawat.p@student.university.ac.th',
      vehicles: [
        { plate: '2ขค 5519 เชียงใหม่', model: 'Honda Wave 125i (สีน้ำเงิน)' }
      ],
      safetyScore: 92
    },
    'security.gate1@university.ac.th': {
      role: 'admin',
      name: 'Security Officer Somchai',
      studentId: 'SEC-01',
      email: 'security.gate1@university.ac.th',
      vehicles: [],
      safetyScore: 100
    }
  };

  /**
   * Initialize Auth from localStorage
   */
  function init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        currentUser = JSON.parse(stored);
        notifyListeners();
      }
    } catch (e) {
      console.warn('Failed to parse saved auth state:', e);
      currentUser = null;
    }
  }

  /**
   * Subscribe to auth state changes
   */
  function onAuthStateChanged(callback) {
    authListeners.push(callback);
    callback(currentUser);
  }

  function notifyListeners() {
    authListeners.forEach(cb => cb(currentUser));
  }

  function saveSession(user) {
    currentUser = user;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
    notifyListeners();
  }

  /**
   * Sign In via Microsoft Account (Student)
   */
  function signInWithMicrosoft(email, name = null, studentId = null) {
    if (!email || !email.includes('@')) {
      throw new Error('กรุณาระบุอีเมลที่ถูกต้อง');
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if demo preset exists
    if (DEMO_ACCOUNTS[cleanEmail]) {
      const acc = DEMO_ACCOUNTS[cleanEmail];
      saveSession({
        ...acc,
        loginType: 'microsoft',
        avatarChar: acc.name.charAt(0).toUpperCase()
      });
      return currentUser;
    }

    // Parse student ID from email if possible (e.g. 65070042@...)
    let parsedId = studentId;
    if (!parsedId) {
      const match = cleanEmail.match(/^(\d{8,10})/);
      parsedId = match ? match[1] : 'STD-' + Math.floor(1000 + Math.random() * 9000);
    }

    const displayName = name || cleanEmail.split('@')[0];

    const newUser = {
      role: 'student',
      name: displayName,
      studentId: parsedId,
      email: cleanEmail,
      loginType: 'microsoft',
      avatarChar: displayName.charAt(0).toUpperCase(),
      vehicles: [
        { plate: '1กข 8924 กรุงเทพมหานคร', model: 'Honda Click 160 (สีดำ)' }
      ],
      safetyScore: 95
    };

    saveSession(newUser);
    return newUser;
  }

  /**
   * Validate student email domain
   */
  function isValidStudentEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const clean = email.trim().toLowerCase();
    const studentDomainRegex = /^[^\s@]+@[^\s@]+\.(ac\.th|edu|edu\.th|ku\.th|chula\.ac\.th|cmu\.ac\.th|kmitl\.ac\.th|kmutt\.ac\.th|tu\.ac\.th|nu\.ac\.th|psu\.ac\.th|mahidol\.ac\.th|gmail\.com)$/i;
    return studentDomainRegex.test(clean);
  }

  /**
   * Sign in directly with student email
   */
  function signInWithEmail(email) {
    if (!isValidStudentEmail(email)) {
      throw new Error('กรุณาใช้อีเมลนักศึกษา (เช่น @*.ac.th, @*.edu หรืออีเมลสถาบัน)');
    }
    return signInWithMicrosoft(email);
  }

  /**
   * Enter as Guest (No login required)
   */
  function signInAsGuest() {
    const guestUser = {
      role: 'guest',
      name: 'ผู้เยี่ยมชม (Guest)',
      studentId: 'GUEST',
      email: 'guest@public.demo',
      loginType: 'guest',
      avatarChar: 'G',
      vehicles: [],
      safetyScore: null
    };

    saveSession(guestUser);
    return guestUser;
  }

  /**
   * Sign out
   */
  function signOut() {
    currentUser = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) { }
    notifyListeners();
  }

  function getCurrentUser() {
    return currentUser;
  }

  function isGuest() {
    return currentUser && currentUser.role === 'guest';
  }

  function isStudent() {
    return currentUser && currentUser.role === 'student';
  }

  function isAdmin() {
    return currentUser && currentUser.role === 'admin';
  }

  /**
   * Add a new vehicle to the student profile
   */
  function addVehicle(plate, model) {
    if (!currentUser) {
      throw new Error('ไม่พบข้อมูลผู้เข้าใช้งาน');
    }
    if (!currentUser.vehicles) {
      currentUser.vehicles = [];
    }
    if (currentUser.vehicles.some(v => v.plate.toLowerCase().replace(/\s+/g, '') === plate.toLowerCase().replace(/\s+/g, ''))) {
      throw new Error('ยานพาหนะทะเบียนนี้ถูกลงทะเบียนไว้แล้ว');
    }
    currentUser.vehicles.push({ plate, model });
    saveSession(currentUser);
  }

  /**
   * Remove a vehicle from the student profile
   */
  function removeVehicle(plate) {
    if (!currentUser || !currentUser.vehicles) return;
    currentUser.vehicles = currentUser.vehicles.filter(
      v => v.plate.toLowerCase().replace(/\s+/g, '') !== plate.toLowerCase().replace(/\s+/g, '')
    );
    saveSession(currentUser);
  }

  return {
    init,
    onAuthStateChanged,
    signInWithMicrosoft,
    signInWithEmail,
    signInAsGuest,
    signOut,
    getCurrentUser,
    isGuest,
    isStudent,
    isAdmin,
    isValidStudentEmail,
    addVehicle,
    removeVehicle,
    DEMO_ACCOUNTS
  };
})();
