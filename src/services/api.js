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

// 5. Verify QR Code
export const verifyQRCode = async (qrData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/verify-qr`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ qr_code_data: qrData }),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.detail || `HTTP error! status: ${res.status}`);
    }
    
    return await res.json();
  } catch (err) {
    console.warn('[API] QR Verification failed:', err);
    throw err;
  }
};
