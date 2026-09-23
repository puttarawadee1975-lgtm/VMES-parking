import React, { useEffect, useState } from 'react';

export default function CameraStream({
  gateName = "Gate 1 (Entry Gate)",
  camId = "CAM-01: ENTRY RAMP",
  gateType = "ENTRY",
  currentDetection,
  onTriggerScan,
  streamUrl = null,
  statusUrl = null
}) {
  const [status, setStatus] = useState(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setStatus(null);
    if (!statusUrl) return;

    const controller = new AbortController();
    let timer;
    const pollStatus = async () => {
      const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(5000)]);
      try {
        const response = await fetch(statusUrl, { signal, cache: 'no-store' });
        if (!response.ok) throw new Error('Status unavailable');
        const nextStatus = await response.json();
        signal.throwIfAborted();
        if (!controller.signal.aborted) setStatus(nextStatus);
      } catch {
        if (!controller.signal.aborted) setStatus({ unavailable: true });
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(pollStatus, 3000);
      }
    };
    pollStatus();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [statusUrl]);

  const statusLabel = !status ? 'Checking…'
    : status.unavailable ? 'Status unavailable'
    : !status.configured ? 'Not configured'
    : status.connected ? 'Connected' : 'Disconnected';
  const isViolation = currentDetection?.isViolation;
  const isExit = gateType === "EXIT";
  const plateText = currentDetection ? `${currentDetection.plate} ${currentDetection.province}` : (isExit ? '5KS 8888 Bangkok' : '1KB 1234 Bangkok');
  const helmetText = currentDetection ? (isViolation ? 'FAIL: No Helmet' : 'PASS: Helmet Worn') : (isExit ? 'PASS: Exit Verified' : 'PASS: Helmet Worn');
  const timestamp = now.toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok', hour12: false });

  return (
    <div className="card card-camera" style={{ marginBottom: 0 }}>
      <div className="card-header">
        <div className="card-header-title">
          <span>{gateName}</span>
        </div>
        <div className="live-tag">
          <span className={`dot ${statusUrl ? (status?.connected ? 'pulse-green' : 'pulse-amber') : (isExit ? 'pulse-amber' : 'pulse-green')}`}></span> {gateType} 1440P
          {statusUrl && <span role="status"> · {statusLabel}</span>}
        </div>
      </div>

      <div className="camera-viewport" style={{ minHeight: 220, backgroundColor: '#000000', position: 'relative', overflow: 'hidden' }}>
        {streamUrl ? (
          <img
            src={streamUrl}
            alt={gateName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="camera-bg-grid" />
        )}
        <div className="camera-overlay">
          <div className="cam-info">
            <span>{camId}</span>
            <span>{timestamp}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
