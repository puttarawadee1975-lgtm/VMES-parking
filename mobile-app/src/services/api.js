import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Automatically detect the local IP from Expo Dev Server
let localIp = 'localhost'; // fallback for simulator
const debuggerHost = Constants.expoConfig?.hostUri;
if (debuggerHost) {
  localIp = debuggerHost.split(':')[0];
} else if (Platform.OS === 'android') {
  localIp = '10.0.2.2'; // Android emulator localhost
}

// Backend IP Address (Dynamic based on current Wi-Fi)
export const MAC_MINI_IP = localIp;
export const API_PORT = '8000';

// API Base URL for HTTP Requests
export const API_BASE_URL = `http://${MAC_MINI_IP}:${API_PORT}`;

// WebSocket URL for Live Detections
export const WS_BASE_URL = `ws://${MAC_MINI_IP}:${API_PORT}/ws/detections`;

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

// 1. Parking Status (Public)
export const getParkingStatus = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/parking/status`, {
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
    const res = await fetch(`${API_BASE_URL}/admin/announcements`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Failed to fetch announcements:', err);
    return [
      {
        id: 'ANN-01',
        title: 'Zone B Maintenance Notice',
        content: 'Zone B Floor 2 will be temporarily closed for sensor maintenance tomorrow from 09:00 AM to 02:00 PM. Please park at Zone A or Zone C.',
        date: 'Today, 09:00 AM',
        priority: 'high'
      },
      {
        id: 'ANN-02',
        title: 'Helmet Safety Policy Reminder',
        content: 'All motorcycle drivers must wear a safety helmet when entering university gates. AI CCTV cameras will deduct 10 safety points for non-compliance.',
        date: 'Yesterday',
        priority: 'normal'
      }
    ];
  }
};

// 2. Microsoft Entra ID Login
export const loginWithMicrosoft = async ({ accessToken, idToken, email, name }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/microsoft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: accessToken,
        id_token: idToken,
        email: email,
        name: name,
      }),
    });
    if (!res.ok) throw new Error(`Login failed with status ${res.status}`);
    const data = await res.json();
    if (data.access_token) {
      setAuthToken(data.access_token);
    }
    return data;
  } catch (err) {
    console.error('[API] Login error:', err);
    throw err;
  }
};

// 3. Officer Live Detections (Officer / Office only)
export const getOfficerDetections = async (violationOnly = false) => {
  try {
    const query = violationOnly ? '?violation_only=true' : '';
    const res = await fetch(`${API_BASE_URL}/officer/detections${query}`, {
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
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
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

// 6. Save Spot to MongoDB
export const saveSpotToMongoDB = async (spotData, userEmail = '65070042@student.university.ac.th') => {
  try {
    const res = await fetch(`${API_BASE_URL}/parking/save-spot?user_email=${encodeURIComponent(userEmail)}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(spotData),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Failed to save spot to MongoDB:', err);
    return null;
  }
};

// 7. Get Saved Spot from MongoDB
export const getSpotFromMongoDB = async (userEmail = '65070042@student.university.ac.th') => {
  try {
    const res = await fetch(`${API_BASE_URL}/parking/get-spot?user_email=${encodeURIComponent(userEmail)}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Failed to fetch spot from MongoDB:', err);
    return null;
  }
};

// 8. Clear Saved Spot in MongoDB
export const clearSpotInMongoDB = async (userEmail = '65070042@student.university.ac.th') => {
  try {
    const res = await fetch(`${API_BASE_URL}/parking/clear-spot?user_email=${encodeURIComponent(userEmail)}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Failed to clear spot in MongoDB:', err);
    return null;
  }
};

// 9. Register Vehicle to MongoDB
export const registerVehicleToMongoDB = async (vehicleData, userEmail = '65070042@student.university.ac.th', role = 'student') => {
  try {
    const res = await fetch(`${API_BASE_URL}/parking/register-vehicle`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        plate: vehicleData.plate,
        model: vehicleData.model,
        user_email: userEmail,
        role: role
      }),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Failed to register vehicle in MongoDB:', err);
    return null;
  }
};

// 10. Delete Vehicle from MongoDB
export const deleteVehicleFromMongoDB = async (plate, userEmail = '65070042@student.university.ac.th') => {
  try {
    const res = await fetch(`${API_BASE_URL}/parking/delete-vehicle?user_email=${encodeURIComponent(userEmail)}&plate=${encodeURIComponent(plate)}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Failed to delete vehicle from MongoDB:', err);
    return null;
  }
};

// 11. Fetch User Vehicles from MongoDB
export const getUserVehiclesFromMongoDB = async (userEmail = '65070042@student.university.ac.th') => {
  try {
    const res = await fetch(`${API_BASE_URL}/parking/user-vehicles?user_email=${encodeURIComponent(userEmail)}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Failed to fetch user vehicles from MongoDB:', err);
    return [];
  }
};

// 12. Adjust Driver Safety Score in MongoDB
export const adjustScoreInMongoDB = async (userEmail, pointsChanged, reason, gateName, imageUrl) => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/adjust-score`, {
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
    console.warn('[API] Failed to adjust score in MongoDB:', err);
    return null;
  }
};

// 13. Fetch Driver Safety Score Audit Logs
export const getScoreLogsFromMongoDB = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/score-logs`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return await res.json();
  } catch (err) {
    console.warn('[API] Failed to fetch score logs from MongoDB:', err);
    return [];
  }
};

// 14. Fetch Gate Detections History (Public / Student / Admin)
export const getGateDetectionsHistory = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/detections`, {
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



