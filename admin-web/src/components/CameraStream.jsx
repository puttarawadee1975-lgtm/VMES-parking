import React from 'react';

export default function CameraStream({ 
  gateName = "Gate 1 (Main Entrance - ENTRY)", 
  camId = "CAM-01: ENTRY RAMP", 
  gateType = "ENTRY", 
  currentDetection, 
  onTriggerScan 
}) {
  const isViolation = currentDetection?.isViolation;
  const isExit = gateType === "EXIT";
  const plateText = currentDetection ? `${currentDetection.plate} ${currentDetection.province}` : (isExit ? '5กษ 8888 กรุงเทพมหานคร' : '1กข 1234 กรุงเทพมหานคร');
  const helmetText = currentDetection ? (isViolation ? 'FAIL: No Helmet' : 'PASS: Helmet Worn') : (isExit ? 'PASS: Exit Verified' : 'PASS: Helmet Worn');
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

  return (
    <div className="card card-camera" style={{ marginBottom: 0 }}>
      <div className="card-header">
        <div className="card-header-title">
          <i className={isExit ? "ri-logout-box-r-line" : "ri-login-box-r-line"} style={{ color: isExit ? '#f59e0b' : '#10b981' }}></i>
          <span>{gateName}</span>
        </div>
        <div className="live-tag">
          <span className={`dot ${isExit ? 'pulse-amber' : 'pulse-green'}`}></span> {gateType} LIVE 1080P
        </div>
      </div>

      <div className="camera-viewport" style={{ minHeight: 220 }}>
        <div className="camera-overlay">
          <div className="cam-info">
            <span>{camId}</span>
            <span>{timestamp}</span>
          </div>

          <div 
            className="ocr-bounding-box" 
            style={{ borderColor: isViolation ? '#ef4444' : (isExit ? '#f59e0b' : '#10b981') }}
          >
            <div className="corner tl"></div>
            <div className="corner tr"></div>
            <div className="corner bl"></div>
            <div className="corner br"></div>
            <div className="ocr-plate-badge">
              <span className="sim-plate-text">{plateText}</span>
              <span className={`badge-helmet ${isViolation ? 'fail' : 'pass'}`}>
                {helmetText}
              </span>
            </div>
          </div>
        </div>
        <div className="camera-bg-grid"></div>
      </div>

      <div className="camera-footer">
        <div className="cam-spec">
          <span>Model: <strong>YOLOv8n + Thai OCR v4.2</strong></span>
          <span>Mode: <strong style={{ color: isExit ? '#f59e0b' : '#10b981' }}>{gateType} SURVEILLANCE</strong></span>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => onTriggerScan && onTriggerScan(gateType)}>
          <i className="ri-refresh-line"></i> Trigger {gateType} Scan
        </button>
      </div>
    </div>
  );
}

