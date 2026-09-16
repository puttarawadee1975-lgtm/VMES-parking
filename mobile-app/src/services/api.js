export const API_BASE_URL =
  'https://smart-campus-parking-deploy.onrender.com';

export const WS_BASE_URL =
  'wss://smart-campus-parking-deploy.onrender.com/ws/detections';

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
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[API] Failed to fetch announcements from MongoDB:', err);
    return [];
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
export const registerVehicleToMongoDB = async (vehicleData, userEmail, role = 'student') => {
  if (!userEmail) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/parking/register-vehicle`, {
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
    console.warn('[API] Failed to register vehicle in MongoDB:', err);
    return null;
  }
};


// 10. Delete Vehicle from MongoDB
export const deleteVehicleFromMongoDB = async (plate, userEmail) => {
  if (!userEmail) return null;
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
export const getUserVehiclesFromMongoDB = async (userEmail) => {
  if (!userEmail) return [];
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

// 15. Fetch User Notifications from MongoDB
export const getUserNotifications = async (userEmail) => {
  const targetEmail = userEmail || 'u6814509@au.edu';
  try {
    const res = await fetch(`${API_BASE_URL}/notifications?email=${encodeURIComponent(targetEmail)}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data)) return data;
  } catch (err) {
    console.warn('[API] Failed to fetch user notifications from MongoDB:', err);
  }
  return [];
};

// 16. AI License Plate OCR Camera Scan API
export const scanPlateImageAPI = async (base64Image, vehicleType = 'car') => {
  try {
    const res = await fetch(`${API_BASE_URL}/detections/ocr-scan`, {
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




