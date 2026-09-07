import React from 'react';

export default function CameraStream({ currentDetection, onTriggerScan }) {
  const isViolation = currentDetection?.isViolation;
  const plateText = currentDetection ? `${currentDetection.plate} ${currentDetection.province}` : '1กข 1234 กรุงเทพมหานคร';
  const helmetText = currentDetection ? (isViolation ? 'FAIL: No Helmet' : 'PASS: Helmet Worn') : 'PASS: Helmet Worn';
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

  return (
    <div class="card card-camera">
      <div class="card-header">
        <div class="card-header-title">
          <i class="ri-vidicon-line"></i>
          <span>Gate 1 (Main Entrance) - AI CCTV Stream</span>
        </div>
        <div class="live-tag">
          <span class="dot pulse-green"></span> LIVE 1080P
        </div>
      </div>

      <div class="camera-viewport">
        <div class="camera-overlay">
          <div class="cam-info">
            <span>CAM-01: GATE 1 RAMP</span>
            <span>{timestamp}</span>
          </div>

          <div 
            class="ocr-bounding-box" 
            style={{ borderColor: isViolation ? '#ef4444' : '#10b981' }}
          >
            <div class="corner tl"></div>
            <div class="corner tr"></div>
            <div class="corner bl"></div>
            <div class="corner br"></div>
            <div class="ocr-plate-badge">
              <span class="sim-plate-text">{plateText}</span>
              <span class={`badge-helmet ${isViolation ? 'fail' : 'pass'}`}>
                {isViolation ? '⚠️ ' : '🛡️ '}{helmetText}
              </span>
            </div>
          </div>
        </div>
        <div class="camera-bg-grid"></div>
      </div>

      <div class="camera-footer">
        <div class="cam-spec">
          <span>Model: <strong>YOLOv8n + Thai OCR v4.2</strong></span>
          <span>Inference Time: <strong style={{ color: '#10b981' }}>32ms</strong></span>
        </div>
        <button class="btn btn-secondary btn-sm" onClick={onTriggerScan}>
          <i class="ri-refresh-line"></i> Trigger AI Detection
        </button>
      </div>
    </div>
  );
}
