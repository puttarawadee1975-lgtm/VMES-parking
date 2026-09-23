import { PublicClientApplication } from '@azure/msal-browser';

const clientId = import.meta.env.VITE_AZURE_CLIENT_ID || '';
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID || 'organizations';
const redirectUri = import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin;

export const isMsalConfigured = Boolean(clientId && clientId.trim() !== '' && !clientId.includes('ใส่_'));

export const msalConfig = {
  auth: {
    clientId: clientId || '00000000-0000-0000-0000-000000000000',
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: redirectUri,
    postLogoutRedirectUri: redirectUri,
    navigateToLoginRequestUrl: false
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false
  }
};

export const loginRequest = {
  scopes: ['User.Read', 'email', 'profile', 'openid']
};

export const ALLOWED_ADMIN_EMAILS = [
  'u6814509@au.edu',
  'u6642032@au.edu',
  'admin@au.edu'
];

let msalInstancePromise = null;

export const getMsalInstance = async () => {
  if (!msalInstancePromise) {
    const instance = new PublicClientApplication(msalConfig);
    msalInstancePromise = instance.initialize().then(() => instance);
  }
  return msalInstancePromise;
};
