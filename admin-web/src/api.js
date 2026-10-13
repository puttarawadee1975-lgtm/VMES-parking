// Central API Helper for Admin Web
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const getApiHost = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return API_BASE_URL;
  }
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
    let headers = { ...(options.headers || {}) };
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('admin_user');
      if (stored) {
        try {
          const user = JSON.parse(stored);
          if (user?.email) {
            headers['X-Admin-Email'] = user.email;
          }
        } catch (e) {}
      }
    }
    const res = await fetch(`${host}${endpoint}`, { ...options, headers });
    return res;
  } catch (e) {
    console.warn(`[API] Network error fetching from ${host}${endpoint}:`, e);
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