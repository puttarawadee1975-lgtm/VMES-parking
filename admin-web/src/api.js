// Central API Helper for Admin Web
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://smart-campus-parking-deploy.onrender.com';

export const getApiHost = () => {
  if (typeof window !== 'undefined') {
    const hn = window.location.hostname;
    if (hn === 'localhost' || hn === '127.0.0.1' || hn === '::1' || window.location.port === '5173' || window.location.port === '3000') {
      return `http://${hn}:8000`;
    }
  }
  return API_BASE_URL;
};

export const fetchAPI = async (endpoint, options = {}) => {
  const host = getApiHost();
  try {
    const res = await fetch(`${host}${endpoint}`, options);
    return res;
  } catch (e) {
    console.warn(`[API] Network error fetching from ${host}${endpoint}:`, e);
  }
  // Fallback to production URL if local host failed
  if (host !== API_BASE_URL) {
    try {
      return await fetch(`${API_BASE_URL}${endpoint}`, options);
    } catch (e) {
      console.error(`[API] Fallback fetch failed for ${API_BASE_URL}${endpoint}:`, e);
    }
  }
  return null;
};

export const getImageUrl = (rawImg) => {
  if (!rawImg) return '';
  if (rawImg.startsWith('http://') || rawImg.startsWith('https://') || rawImg.startsWith('data:')) {
    return rawImg;
  }
  const host = getApiHost();
  return `${host}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`;
};

export async function getVehicleDirectory() {
  const response = await fetchAPI('/admin/vehicle-directory');

  if (!response || !response.ok) {
    throw new Error('Failed to fetch vehicle directory');
  }

  return response.json();
}