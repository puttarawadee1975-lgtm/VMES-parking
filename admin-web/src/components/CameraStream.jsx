import React from 'react';

export default function CameraStream({
  gateName = "Gate 1 (Entry Gate)",
  camId = "CAM-01: ENTRY RAMP",
  gateType = "ENTRY",
  currentDetection,
  onTriggerScan,
  streamUrl = null
}) {
  const isViolation = currentDetection?.isViolation;
  const isExit = gateType === "EXIT";
  const plateText = currentDetection ? `${currentDetection.plate} ${currentDetection.province}` : (isExit ? '5KS 8888 Bangkok' : '1KB 1234 Bangkok');
  const helmetText = currentDetection ? (isViolation ? 'FAIL: No Helmet' : 'PASS: Helmet Worn') : (isExit ? 'PASS: Exit Verified' : 'PASS: Helmet Worn');
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

  return (
    <div className="card card-camera" style={{ marginBottom: 0 }}>
      <div className="card-header">
        <div className="card-header-title">
          <span>{gateName}</span>
        </div>
        <div className="live-tag">
          <span className={`dot ${isExit ? 'pulse-amber' : 'pulse-green'}`}></span> {gateType} 1080P
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

      <div className="camera-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => onTriggerScan && onTriggerScan(gateType)}>
          <i className="ri-refresh-line"></i> Trigger {gateType} Scan
        </button>
      </div>
    </div>
  );
}

