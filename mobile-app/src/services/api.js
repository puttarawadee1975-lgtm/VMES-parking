export const API_BASE_URL =
  'http://127.0.0.1:8000';

export const WS_BASE_URL =
  'ws://127.0.0.1:8000/ws/detections';

let storedToken = null;

export const setAuthToken = (token) => {
  storedToken = token;
};

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (storedToken) {
    headers['Authorization'] = `Bearer ${storedToken}`;
  }
  return headers;
};

let cachedWorkingHost = null;

const fetchWithTimeout = async (url, options = {}, timeoutMs = 1500) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return response;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
};

// Helper function to fetch with local backend fallback & host caching for max performance
const fetchAPI = async (endpoint, options = {}) => {
  if (cachedWorkingHost) {
    try {
      const res = await fetchWithTimeout(`${cachedWorkingHost}${endpoint}`, options, 2500);
      if (res.ok) return res;
    } catch (e) {
      cachedWorkingHost = null;
    }
  }

  const candidateHosts = [
    'http://192.168.1.42:8000',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://10.0.2.2:8000',
    API_BASE_URL,
  ];

  // Try fast parallel connection to find the active host
  try {
    const fastHost = await Promise.any(
      candidateHosts.map(async (host) => {
        const res = await fetchWithTimeout(`${host}${endpoint}`, options, 1500);
        if (res.ok) {
          cachedWorkingHost = host;
          return res;
        }
        throw new Error('Host not ok');
      })
    );
    return fastHost;
  } catch (err) {
    // Fallback to primary API_BASE_URL
    return fetch(`${API_BASE_URL}${endpoint}`, options);
  }
};

// 1. Parking Status (Public)
export const getParkingStatus = async () => {
  try {
    const res = await fetchAPI('/parking/status', {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Failed to fetch parking status:', err);
    return null;
  }
};

// 1.5 Announcements API (Public)
export const getAnnouncements = async () => {
  try {
    const res = await fetchAPI('/admin/announcements', {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[API] Failed to fetch announcements:', err);
    return [];
  }
};

// 2. Microsoft Entra ID Login
export const loginWithMicrosoft = async ({ accessToken, idToken, email, name }) => {
  try {
    const res = await fetchAPI('/auth/microsoft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: accessToken,
        id_token: idToken,
        email: email,
        name: name,
      }),
    });
    if (!res || !res.ok) throw new Error(`Login failed`);
    const data = await res.json();
    if (data.access_token) {
      setAuthToken(data.access_token);
    }
    return data;
  } catch (err) {
    console.warn('[API] Login fallback triggered:', err);
    return {
      access_token: 'mock-jwt-token',
      user: {
        email: email || '65070042@student.university.ac.th',
        name: name || (email ? email.split('@')[0] : 'User'),
        role: 'Student',
        driving_score: 100
      }
    };
  }
};

// 3. Officer Live Detections (Officer / Office only)
export const getOfficerDetections = async (violationOnly = false) => {
  try {
    const query = violationOnly ? '?violation_only=true' : '';
    const res = await fetchAPI(`/officer/detections${query}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Failed to fetch officer detections:', err);
    return [];
  }
};

// 4. Admin Users Management (Office only)
export const getAdminUsers = async () => {
  try {
    const res = await fetchAPI('/admin/users', {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Failed to fetch admin users:', err);
    return [];
  }
};

// 6. Save Spot
export const saveSpotToMongoDB = async (spotData, userEmail = '65070042@student.university.ac.th') => {
  try {
    const res = await fetchAPI('/parking/save-spot', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        user_email: userEmail,
        ...spotData
      }),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Failed to save spot:', err);
    return null;
  }
};

// 7. Get Saved Spot
export const getSpotFromMongoDB = async (userEmail = '65070042@student.university.ac.th') => {
  try {
    const res = await fetchAPI(`/parking/get-spot?user_email=${encodeURIComponent(userEmail)}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Failed to fetch spot:', err);
    return null;
  }
};

// 8. Clear Saved Spot
export const clearSpotInMongoDB = async (userEmail = '65070042@student.university.ac.th') => {
  try {
    const res = await fetchAPI(`/parking/clear-spot?user_email=${encodeURIComponent(userEmail)}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Failed to clear spot:', err);
    return null;
  }
};

// 9. Register Vehicle
export const registerVehicleToMongoDB = async (vehicleData, userEmail, role = 'student') => {
  if (!userEmail) return null;
  try {
    const res = await fetchAPI('/parking/register-vehicle', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        plate: vehicleData.plate,
        model: vehicleData.model,
        user_email: userEmail,
        role: role,
        vehicle_photo: vehicleData.vehicle_photo || null,
        vehicle_front_photo: vehicleData.vehicle_front_photo || null,
        vehicle_side_photo: vehicleData.vehicle_side_photo || null,
        student_id_photo: vehicleData.student_id_photo || null
      }),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Failed to register vehicle:', err);
    return null;
  }
};

// 10. Delete Vehicle
export const deleteVehicleFromMongoDB = async (plate, userEmail) => {
  if (!userEmail) return null;
  try {
    const res = await fetchAPI(`/parking/delete-vehicle?user_email=${encodeURIComponent(userEmail)}&plate=${encodeURIComponent(plate)}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Failed to delete vehicle:', err);
    return null;
  }
};

// 11. Fetch User Vehicles
export const getUserVehiclesFromMongoDB = async (userEmail) => {
  if (!userEmail) return [];
  try {
    const res = await fetchAPI(`/parking/user-vehicles?user_email=${encodeURIComponent(userEmail)}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Failed to fetch user vehicles:', err);
    return [];
  }
};

// 12. Adjust Driver Safety Score
export const adjustScoreInMongoDB = async (userEmail, pointsChanged, reason, gateName, imageUrl) => {
  try {
    const res = await fetchAPI('/admin/adjust-score', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        user_email: userEmail,
        points_changed: pointsChanged,
        reason: reason,
        gate_name: gateName || 'Gate 1 (Main Entrance)',
        image_url: imageUrl || null
      })
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Failed to adjust score:', err);
    return null;
  }
};

// 13. Fetch Driver Safety Score Audit Logs
export const getScoreLogsFromMongoDB = async () => {
  try {
    const res = await fetchAPI('/admin/score-logs', {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Failed to fetch score logs:', err);
    return [];
  }
};

// 14. Fetch Gate Detections History (Public / Student / Admin)
export const getGateDetectionsHistory = async () => {
  try {
    const res = await fetchAPI('/detections', {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Failed to fetch gate detections history:', err);
    return [];
  }
};

// 15. Fetch User Notifications
export const getUserNotifications = async (userEmail) => {
  const targetEmail = userEmail || 'u6814509@au.edu';
  try {
    const res = await fetchAPI(`/notifications?email=${encodeURIComponent(targetEmail)}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data)) return data;
  } catch (err) {
    console.warn('[API] Failed to fetch user notifications:', err);
  }
  return [];
};

// 16. AI License Plate OCR Camera Scan API
export const scanPlateImageAPI = async (base64Image, vehicleType = 'car') => {
  try {
    const res = await fetchAPI('/detections/ocr-scan', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        image_base64: base64Image,
        vehicle_type: vehicleType
      }),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] OCR scan request failed:', err);
    return null;
  }
};
