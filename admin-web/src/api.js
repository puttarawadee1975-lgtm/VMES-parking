// Central API Helper for Admin Web
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://smart-campus-parking-deploy.onrender.com';

export const getApiHost = () => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:8000';
  }
  return API_BASE_URL;
};

export const fetchAPI = async (endpoint, options = {}) => {
  const host = getApiHost();
  try {
    const res = await fetch(`${host}${endpoint}`, options);
    if (res.ok) return res;
  } catch (e) {
    console.warn(`[API] Failed to fetch from ${host}${endpoint}:`, e);
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
