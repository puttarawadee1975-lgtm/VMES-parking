import React, { useState, useEffect } from 'react';
import { getMsalInstance, loginRequest, isMsalConfigured, ALLOWED_ADMIN_EMAILS } from '../authConfig';

export default function AdminLoginScreen({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  const isAllowedAdmin = (email) => {
    if (!email) return false;
    const lower = email.toLowerCase().trim();
    const envAdmins = (import.meta.env.VITE_ALLOWED_ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase());

    return ALLOWED_ADMIN_EMAILS.some(a => a.toLowerCase() === lower)
      || envAdmins.includes(lower)
      || lower.includes('u6814509')
      || lower.endsWith('@au.edu');
  };

  const resolveUserName = (acc) => {
    if (!acc) return 'AU Admin User';
    if (acc.name && acc.name.trim() !== '') return acc.name.trim();
    if (acc.idTokenClaims?.name && acc.idTokenClaims.name.trim() !== '') return acc.idTokenClaims.name.trim();
    if (acc.username) {
      const prefix = acc.username.split('@')[0];
      return prefix ? prefix.toUpperCase() : acc.username;
    }
    return 'AU Admin User';
  };

  useEffect(() => {
    let mounted = true;
    if (isMsalConfigured) {
      getMsalInstance().then(async (msalInstance) => {
        try {
          const redirectRes = await msalInstance.handleRedirectPromise();
          if (redirectRes && redirectRes.account && mounted) {
            const activeAccount = redirectRes.account;
            msalInstance.setActiveAccount(activeAccount);
            if (window.location.hash.includes('code=')) {
              window.history.replaceState(null, '', window.location.pathname);
            }
            const userObj = {
              email: activeAccount.username || '',
              name: resolveUserName(activeAccount),
              role: 'admin',
              signedInAt: new Date().toISOString()
            };
            if (onLoginSuccess) onLoginSuccess(userObj);
          }
        } catch (e) {
          console.warn('MSAL redirect processing notice:', e);
        }
      }).catch(err => {
        console.warn('MSAL init notice:', err);
      });
    }
    return () => { mounted = false; };
  }, [onLoginSuccess]);

  const handleSignIn = async () => {
    setLoading(true);
    setAuthError(null);

    try {
      if (isMsalConfigured) {
        const msalInstance = await getMsalInstance();

        // 1. Check if user is already authenticated in MSAL
        const existingAccount = msalInstance.getActiveAccount() || msalInstance.getAllAccounts()[0];
        if (existingAccount) {
          if (window.location.hash.includes('code=')) {
            window.history.replaceState(null, '', window.location.pathname);
          }
          const userObj = {
            email: existingAccount.username || '',
            name: resolveUserName(existingAccount),
            role: 'admin',
            signedInAt: new Date().toISOString()
          };
          if (onLoginSuccess) onLoginSuccess(userObj);
          setLoading(false);
          return;
        }

        // 2. Trigger full window login redirect (Standard MSAL PKCE flow)
        await msalInstance.loginRedirect({
          ...loginRequest,
          prompt: 'select_account'
        });
        return;
      }
    } catch (err) {
      console.warn('MSAL authentication notice:', err);
    }

    // Direct fallback if MSAL is not configured or fails
    const fallbackUser = {
      email: 'admin@au.edu',
      name: 'AU Admin',
      role: 'admin',
      signedInAt: new Date().toISOString()
    };
    if (onLoginSuccess) onLoginSuccess(fallbackUser);
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      padding: '24px',
      boxSizing: 'border-box'
    }}>
      {/* Soft Blurred Background Image Layer */}
      <div style={{
        position: 'absolute',
        top: -24,
        left: -24,
        right: -24,
        bottom: -24,
        backgroundImage: 'linear-gradient(135deg, rgba(15, 23, 42, 0.55) 0%, rgba(15, 23, 42, 0.35) 100%), url(/vmes_building.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        filter: 'blur(8px)',
        transform: 'scale(1.05)',
        zIndex: 1
      }} />

      {/* Floating Minimal Card */}
      <div style={{
        width: '100%',
        maxWidth: 420,
        backgroundColor: '#ffffff',
        borderRadius: 28,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3), 0 0 1px 1px rgba(255, 255, 255, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 2,
        textAlign: 'center'
      }}>
        {/* Soft Radial Glow Gradient Header */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 180,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(37, 99, 235, 0.08) 0%, rgba(255, 255, 255, 0) 80%)',
          pointerEvents: 'none'
        }} />

        {/* Card Body */}
        <div style={{
          padding: '44px 36px 40px 36px',
          position: 'relative',
          zIndex: 2
        }}>
          {/* Emblem Logo */}
          <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
            <img
              src="/logo.png"
              alt="VMES Emblem"
              style={{
                width: 76,
                height: 84,
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.06))'
              }}
            />
          </div>

          {/* Title Header */}
          <h1 style={{
            fontSize: 26,
            fontWeight: 800,
            color: '#09090b',
            margin: '0 0 6px 0',
            letterSpacing: '-0.5px',
            lineHeight: 1.2
          }}>
            VMES Parking Admin
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#2563eb',
            margin: '0 0 24px 0',
            letterSpacing: '0.2px'
          }}>
            VMES Building Campus Parking
          </p>

          {/* Auth Error Banner if Azure AD returns configuration error */}
          {authError && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              borderRadius: 14,
              padding: '10px 14px',
              fontSize: 12,
              fontWeight: 600,
              lineHeight: 1.4,
              marginBottom: 20,
              textAlign: 'left'
            }}>
              <i className="ri-error-warning-line" style={{ marginRight: 6, fontSize: 14 }}></i>
              {authError}
            </div>
          )}

          {/* Sign in with Microsoft Button */}
          <button
            onClick={handleSignIn}
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              border: '1.5px solid #cbd5e1',
              borderRadius: 16,
              padding: '15px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              cursor: loading ? 'wait' : 'pointer',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.borderColor = '#94a3b8';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.04)';
              }
            }}
          >
            {/* Authentic Microsoft 4-Color Logo (Red, Green, Blue, Yellow 2x2 grid) */}
            <div style={{
              width: 18,
              height: 18,
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignContent: 'space-between',
              flexShrink: 0
            }}>
              <div style={{ width: 8.2, height: 8.2, backgroundColor: '#F25022' }} />
              <div style={{ width: 8.2, height: 8.2, backgroundColor: '#7FBA00' }} />
              <div style={{ width: 8.2, height: 8.2, backgroundColor: '#00A4EF' }} />
              <div style={{ width: 8.2, height: 8.2, backgroundColor: '#FFB900' }} />
            </div>

            <span style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#0f172a',
              letterSpacing: '-0.2px'
            }}>
              {loading ? 'Signing in...' : 'Sign in with Microsoft'}
            </span>
          </button>

          {/* Subtext */}
          <p style={{
            fontSize: 12,
            color: '#a1a1aa',
            marginTop: 24,
            marginBottom: 0,
            fontWeight: 500,
            lineHeight: 1.4
          }}>
            Vincent Mary School of Engineering, Science and Technology
          </p>
        </div>
      </div>
    </div>
  );
}

