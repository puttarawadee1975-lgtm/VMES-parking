/**
 * SafeRide AI - Detection Engine & Live Video Stream Simulation
 * Integrates YOLOv8 Helmet Detection overlay, Thai License Plate EasyOCR formatting,
 * Real Webcam input, and WebSocket connection for Senior Project Python backend.
 */

const DetectionModule = (function () {
  // DOM Elements
  let canvas, ctx;
  let videoEl;
  let isStreaming = true;
  let currentSource = 'simulation'; // 'simulation' | 'webcam' | 'websocket'
  let showBoxes = true;
  let audioAlertEnabled = true;

  // Simulation State
  let simAnimId = null;
  let simTime = 0;
  let currentVehicleIndex = 0;

  // Simulated Vehicles Dataset (Realistic Thai Plates & Models)
  const SIMULATED_VEHICLES = [
    {
      plate: '1กข 8924 กรุงเทพมหานคร',
      plateShort: '1กข 8924 กทม',
      helmet: 'HELMET',
      helmetTextTh: 'สวมหมวกนิรภัย',
      confHelmet: 0.948,
      confPlate: 0.912,
      vehicle: 'Motorcycle (Honda Click 160)',
      driverColor: '#38bdf8',
      helmetColor: '#10b981',
      gate: 'ประตู 1 (หน้า ม.)',
      isViolation: false
    },
    {
      plate: '2ขค 5519 เชียงใหม่',
      plateShort: '2ขค 5519 ชม',
      helmet: 'NO_HELMET',
      helmetTextTh: 'ไม่สวมหมวกนิรภัย (ฝ่าฝืน)',
      confHelmet: 0.892,
      confPlate: 0.884,
      vehicle: 'Motorcycle (Yamaha Aerox)',
      driverColor: '#f43f5e',
      helmetColor: null,
      gate: 'ประตู 1 (หน้า ม.)',
      isViolation: true
    },
    {
      plate: '3ขพ 4512 กรุงเทพมหานคร',
      plateShort: '3ขพ 4512 กทม',
      helmet: 'HELMET',
      helmetTextTh: 'สวมหมวกนิรภัย',
      confHelmet: 0.965,
      confPlate: 0.935,
      vehicle: 'Motorcycle (Vespa Sprint 150)',
      driverColor: '#a855f7',
      helmetColor: '#10b981',
      gate: 'ประตู 2 (หอพัก)',
      isViolation: false
    },
    {
      plate: '1กษ 7812 ขอนแก่น',
      plateShort: '1กษ 7812 ขก',
      helmet: 'NO_HELMET',
      helmetTextTh: 'ไม่สวมหมวกนิรภัย (ฝ่าฝืน)',
      confHelmet: 0.915,
      confPlate: 0.871,
      vehicle: 'Motorcycle (Honda Wave 125i)',
      driverColor: '#f59e0b',
      helmetColor: null,
      gate: 'ประตู 1 (หน้า ม.)',
      isViolation: true
    },
    {
      plate: '5กม 1284 นครราชสีมา',
      plateShort: '5กม 1284 นม',
      helmet: 'HELMET',
      helmetTextTh: 'สวมหมวกนิรภัย',
      confHelmet: 0.972,
      confPlate: 0.942,
      vehicle: 'Motorcycle (Honda PCX 160)',
      driverColor: '#06b6d4',
      helmetColor: '#10b981',
      gate: 'ประตู 3 (อาคารเรียน)',
      isViolation: false
    }
  ];

  // Logs History
  const detectionLogs = [];
  let wsConnection = null;

  /**
   * Web Audio API Synthesizer for alerts
   */
  function playAlertSound(type = 'ok') {
    if (!audioAlertEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctxAudio = new AudioCtx();
      const osc = ctxAudio.createOscillator();
      const gain = ctxAudio.createGain();

      osc.connect(gain);
      gain.connect(ctxAudio.destination);

      if (type === 'violation') {
        // High-low warning beep
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, ctxAudio.currentTime);
        osc.frequency.setValueAtTime(440, ctxAudio.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctxAudio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctxAudio.currentTime + 0.35);
        osc.start();
        osc.stop(ctxAudio.currentTime + 0.35);
      } else {
        // Soft friendly chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctxAudio.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctxAudio.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.12, ctxAudio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctxAudio.currentTime + 0.25);
        osc.start();
        osc.stop(ctxAudio.currentTime + 0.25);
      }
    } catch (e) {
      // Ignore audio autoplay restrictions
    }
  }

  /**
   * Initialize Detection Module
   */
  function init() {
    canvas = document.getElementById('detection-canvas');
    videoEl = document.getElementById('webcam-video');
    
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    // Resize canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initial Logs populated with realistic past records
    populateInitialLogs();

    // Start Simulation Loop
    startSimulation();
  }

  function resizeCanvas() {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = 1280;
    canvas.height = 720;
  }

  /**
   * Populate initial demo logs
   */
  function populateInitialLogs() {
    const times = ['08:24:12', '08:22:45', '08:19:30', '08:15:02', '08:10:48'];
    SIMULATED_VEHICLES.forEach((veh, idx) => {
      addDetectionLog({
        id: 'LOG-' + (1000 + idx),
        time: times[idx] || '08:00:00',
        plate: veh.plate,
        plateShort: veh.plateShort,
        helmet: veh.helmet,
        helmetTextTh: veh.helmetTextTh,
        confHelmet: veh.confHelmet,
        confPlate: veh.confPlate,
        gate: veh.gate,
        isViolation: veh.isViolation,
        vehicleModel: veh.vehicle
      }, false);
    });
  }

  /**
   * Draw Simulated AI CCTV Feed
   */
  function drawSimulationFrame() {
    if (!ctx) return;
    simTime += 0.03;

    const w = canvas.width;
    const h = canvas.height;

    // 1. Draw Campus Gate Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(0.5, '#131d2e');
    bgGrad.addColorStop(1, '#0b111e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Draw Road & Lane markings
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(w * 0.2, h);
    ctx.lineTo(w * 0.42, h * 0.4);
    ctx.lineTo(w * 0.58, h * 0.4);
    ctx.lineTo(w * 0.8, h);
    ctx.closePath();
    ctx.fill();

    // Center dash line
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 6;
    ctx.setLineDash([25, 20]);
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.4);
    ctx.lineTo(w * 0.5, h);
    ctx.stroke();
    ctx.setLineDash([]);

    // Campus Gate Arch in distance
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(w * 0.35, h * 0.3, w * 0.3, h * 0.25);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
    ctx.fillRect(w * 0.35, h * 0.3, w * 0.3, h * 0.25);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px Prompt, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ประตู 1 • MAIN GATE ENTRANCE', w * 0.5, h * 0.34);

    // Current Vehicle Data
    const veh = SIMULATED_VEHICLES[currentVehicleIndex];

    // Vehicle Motion Position (Approaching Camera)
    const progress = (Math.sin(simTime) + 1) / 2; // 0 to 1 oscillation
    const scale = 0.4 + progress * 0.65; // scale from far to near
    const vehX = w * 0.5 + (Math.sin(simTime * 0.5) * 60);
    const vehY = h * 0.42 + progress * (h * 0.38);

    // Draw Motorcycle Shape
    ctx.save();
    ctx.translate(vehX, vehY);
    ctx.scale(scale, scale);

    // Bike Body
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(0, 40, 55, 75, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Headlight with dynamic glow
    const lightGlow = ctx.createRadialGradient(0, 10, 5, 0, 10, 50);
    lightGlow.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
    lightGlow.addColorStop(0.5, 'rgba(255, 255, 100, 0.3)');
    lightGlow.addColorStop(1, 'rgba(255, 255, 100, 0)');
    ctx.fillStyle = lightGlow;
    ctx.beginPath();
    ctx.arc(0, 10, 50, 0, Math.PI * 2);
    ctx.fill();

    // Rider Torso
    ctx.fillStyle = veh.driverColor;
    ctx.beginPath();
    ctx.ellipse(0, -40, 45, 55, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rider Head / Helmet
    if (veh.helmet === 'HELMET') {
      // Helmet (Sleek full face helmet)
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(0, -95, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a'; // Visor
      ctx.beginPath();
      ctx.ellipse(0, -92, 18, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // No Helmet (Hair & face)
      ctx.fillStyle = '#3e2723'; // Hair
      ctx.beginPath();
      ctx.arc(0, -95, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffcc80'; // Face
      ctx.beginPath();
      ctx.arc(0, -90, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    // License Plate Holder on front/rear
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-35, 80, 70, 32);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(-35, 80, 70, 32);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 9px Prompt, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(veh.plateShort, 0, 100);

    ctx.restore();

    // 2. Draw YOLOv8 & OCR Bounding Boxes Overlays (if enabled)
    if (showBoxes) {
      // 2.1 Bounding Box: Motorcycle (YOLOv8)
      const boxBikeW = 180 * scale;
      const boxBikeH = 300 * scale;
      const boxBikeX = vehX - boxBikeW / 2;
      const boxBikeY = vehY - 140 * scale;

      ctx.strokeStyle = 'rgba(59, 130, 246, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(boxBikeX, boxBikeY, boxBikeW, boxBikeH);

      // Label
      drawBoundingLabel(
        boxBikeX,
        boxBikeY,
        `🏍️ motorcycle ${(0.94 * scale).toFixed(2)}`,
        '#3b82f6'
      );

      // 2.2 Bounding Box: Helmet or No Helmet (YOLOv8 Head Model)
      const headSize = 75 * scale;
      const headX = vehX - headSize / 2;
      const headY = vehY - 140 * scale;

      if (veh.helmet === 'HELMET') {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.strokeRect(headX, headY, headSize, headSize);
        drawBoundingLabel(
          headX,
          headY,
          `🪖 helmet ${(veh.confHelmet).toFixed(2)}`,
          '#10b981'
        );
      } else {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.strokeRect(headX, headY, headSize, headSize);
        drawBoundingLabel(
          headX,
          headY,
          `⚠️ NO_HELMET ${(veh.confHelmet).toFixed(2)}`,
          '#ef4444'
        );
      }

      // 2.3 Bounding Box: License Plate (EasyOCR Thai Engine)
      const plateW = 100 * scale;
      const plateH = 45 * scale;
      const plateX = vehX - plateW / 2;
      const plateY = vehY + 70 * scale;

      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      ctx.strokeRect(plateX, plateY, plateW, plateH);
      drawBoundingLabel(
        plateX,
        plateY + plateH + 18,
        `🔍 ${veh.plateShort} (${(veh.confPlate * 100).toFixed(0)}%)`,
        '#06b6d4',
        true
      );
    }

    // Update HUD Info
    updateHUD(veh);
  }

  function drawBoundingLabel(x, y, text, color, below = false) {
    ctx.save();
    ctx.font = 'bold 13px Prompt, sans-serif';
    const textWidth = ctx.measureText(text).width;
    const pad = 6;
    const labelH = 22;

    const posY = below ? y : y - labelH;

    ctx.fillStyle = color;
    ctx.fillRect(x, posY, textWidth + pad * 2, labelH);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + pad, posY + labelH / 2);
    ctx.restore();
  }

  /**
   * Update HUD Elements on screen
   */
  function updateHUD(veh) {
    const helmetBadge = document.getElementById('hud-helmet-status');
    const plateText = document.getElementById('hud-plate-text');
    const fpsVal = document.getElementById('hud-fps');
    const confVal = document.getElementById('hud-conf');

    if (fpsVal) fpsVal.textContent = (29.5 + Math.random() * 1.5).toFixed(1);
    if (confVal) confVal.textContent = (veh.confHelmet * 100).toFixed(1) + '%';

    if (helmetBadge) {
      if (veh.helmet === 'HELMET') {
        helmetBadge.className = 'hud-status-badge helmet-ok';
        helmetBadge.innerHTML = '🪖 HELMET DETECTED';
      } else {
        helmetBadge.className = 'hud-status-badge helmet-violation';
        helmetBadge.innerHTML = '⚠️ NO HELMET (VIOLATION)';
      }
    }

    if (plateText) {
      plateText.textContent = veh.plateShort;
    }
  }

  /**
   * Main Loop
   */
  function simulationLoop() {
    if (isStreaming) {
      if (currentSource === 'simulation') {
        drawSimulationFrame();
      } else if (currentSource === 'webcam' && videoEl && videoEl.readyState === 4) {
        drawWebcamFrame();
      }
    }
    simAnimId = requestAnimationFrame(simulationLoop);
  }

  /**
   * Draw Real Webcam Frame with Mock YOLO Overlay
   */
  function drawWebcamFrame() {
    if (!ctx || !videoEl) return;
    const w = canvas.width;
    const h = canvas.height;

    ctx.drawImage(videoEl, 0, 0, w, h);

    if (showBoxes) {
      // Draw detection frame in center
      const boxW = 340;
      const boxH = 420;
      const boxX = (w - boxW) / 2;
      const boxY = (h - boxH) / 2;

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.strokeRect(boxX, boxY, boxW, boxH);
      drawBoundingLabel(boxX, boxY, '🪖 helmet (96.4%)', '#10b981');

      // Plate scan area
      const pBoxW = 200;
      const pBoxH = 60;
      const pBoxX = (w - pBoxW) / 2;
      const pBoxY = boxY + boxH - 40;

      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(pBoxX, pBoxY, pBoxW, pBoxH);
      drawBoundingLabel(pBoxX, pBoxY + pBoxH + 18, '🔍 Scanning Plate...', '#06b6d4', true);
    }
  }

  function startSimulation() {
    if (!simAnimId) {
      simulationLoop();
    }
  }

  /**
   * Trigger next vehicle scan event (Manual or Timer)
   */
  function triggerNextVehicle() {
    currentVehicleIndex = (currentVehicleIndex + 1) % SIMULATED_VEHICLES.length;
    const veh = SIMULATED_VEHICLES[currentVehicleIndex];

    const newLog = {
      id: 'LOG-' + Math.floor(1000 + Math.random() * 9000),
      time: new Date().toLocaleTimeString('th-TH'),
      plate: veh.plate,
      plateShort: veh.plateShort,
      helmet: veh.helmet,
      helmetTextTh: veh.helmetTextTh,
      confHelmet: veh.confHelmet,
      confPlate: veh.confPlate,
      gate: veh.gate,
      isViolation: veh.isViolation,
      vehicleModel: veh.vehicle
    };

    addDetectionLog(newLog, true);

    // Audio Feedback
    if (veh.isViolation) {
      playAlertSound('violation');
      window.dispatchEvent(new CustomEvent('saferide:violation', { detail: newLog }));
    } else {
      playAlertSound('ok');
    }

    // Update KPI counts
    incrementKPIScans(veh.isViolation);
  }

  function incrementKPIScans(isViolation) {
    const scanEl = document.getElementById('kpi-total-scans');
    const violEl = document.getElementById('kpi-violations');

    if (scanEl) {
      const current = parseInt(scanEl.textContent.replace(/,/g, '')) || 1284;
      scanEl.textContent = (current + 1).toLocaleString();
    }

    if (isViolation && violEl) {
      const currentV = parseInt(violEl.textContent.replace(/,/g, '')) || 146;
      violEl.textContent = (currentV + 1).toLocaleString();
    }

    // Dynamic AVAILABLE and OCCUPIED counts for user.html
    const availableEl = document.getElementById('kpi-available-count');
    const occupiedEl = document.getElementById('kpi-occupied-count');
    if (availableEl && occupiedEl) {
      let availableVal = parseInt(availableEl.textContent);
      if (isNaN(availableVal)) {
        availableVal = 0;
      }
      let occupiedVal = parseInt(occupiedEl.textContent) || 0;

      if (availableVal > 0) {
        availableVal -= 1;
        occupiedVal += 1;
      }

      occupiedEl.textContent = occupiedVal;

      if (availableVal <= 0) {
        availableEl.textContent = 'full';
        availableEl.className = 'kpi-box-value text-danger';
      } else {
        availableEl.textContent = availableVal;
        availableEl.className = 'kpi-box-value text-success';
      }
    }
  }

  /**
   * Add Entry to Live Detection Log UI
   */
  function addDetectionLog(item, animate = true) {
    detectionLogs.unshift(item);
    if (detectionLogs.length > 50) detectionLogs.pop();

    const listEl = document.getElementById('detections-scroll-list');
    if (!listEl) return;

    const logDiv = document.createElement('div');
    logDiv.className = `detection-log-item ${item.isViolation ? 'violation' : 'compliant'}`;
    if (!animate) logDiv.style.animation = 'none';

    const helmetBadgeHtml = item.isViolation
      ? `<span class="badge-helmet bad">⚠️ ไม่สวมหมวกนิรภัย</span>`
      : `<span class="badge-helmet ok">✓ สวมหมวกนิรภัย</span>`;

    logDiv.innerHTML = `
      <div class="log-snapshot-thumb">
        <span>${item.isViolation ? '⚠️' : '🏍️'}</span>
      </div>
      <div class="log-details-col">
        <div class="log-plate-row">
          <strong class="log-plate-num">${item.plate}</strong>
          <span class="log-time">${item.time}</span>
        </div>
        <div class="log-status-row">
          ${helmetBadgeHtml}
          <span class="log-location-text">• ${item.gate}</span>
        </div>
      </div>
    `;

    if (listEl.firstChild) {
      listEl.insertBefore(logDiv, listEl.firstChild);
    } else {
      listEl.appendChild(logDiv);
    }

    // Update count badge
    const badgeEl = document.getElementById('log-count-badge');
    if (badgeEl) {
      badgeEl.textContent = `${detectionLogs.length} รายการล่าสุด`;
    }
  }

  /**
   * Switch Stream Source (Webcam <-> Simulation)
   */
  async function switchSource() {
    const labelEl = document.getElementById('stream-source-label');
    const sourceTag = document.getElementById('current-source-tag');

    if (currentSource === 'simulation') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 }
        });
        videoEl.srcObject = stream;
        currentSource = 'webcam';
        if (labelEl) labelEl.textContent = 'สลับเป็นโหมด Simulation';
        if (sourceTag) sourceTag.textContent = 'LIVE WEBCAM';
        return true;
      } catch (err) {
        console.warn('Webcam permission denied or unavailable:', err);
        throw new Error('ไม่สามารถเข้าถึงกล้อง Webcam ได้ (กำลังใช้งาน Simulation Demo แทน)');
      }
    } else {
      if (videoEl && videoEl.srcObject) {
        videoEl.srcObject.getTracks().forEach(track => track.stop());
        videoEl.srcObject = null;
      }
      currentSource = 'simulation';
      if (labelEl) labelEl.textContent = 'สลับเป็นกล้อง Webcam';
      if (sourceTag) sourceTag.textContent = 'SIMULATION DEMO';
      return false;
    }
  }

  function toggleBoundingBoxes() {
    showBoxes = !showBoxes;
    return showBoxes;
  }

  function toggleStreaming() {
    isStreaming = !isStreaming;
    return isStreaming;
  }

  function clearLogs() {
    detectionLogs.length = 0;
    const listEl = document.getElementById('detections-scroll-list');
    if (listEl) listEl.innerHTML = '';
    const badgeEl = document.getElementById('log-count-badge');
    if (badgeEl) badgeEl.textContent = '0 รายการ';
  }

  function exportCSV() {
    if (detectionLogs.length === 0) {
      alert('ไม่มีข้อมูลบันทึกสำหรับดาวน์โหลด');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += 'Log ID,Timestamp,License Plate,Helmet Status,Violation,Location,Vehicle Model\n';

    detectionLogs.forEach(row => {
      csvContent += `"${row.id}","${row.time}","${row.plate}","${row.helmetTextTh}","${row.isViolation ? 'YES' : 'NO'}","${row.gate}","${row.vehicleModel}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SafeRide_AI_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Connect to Python WebSocket Backend (server.py)
   */
  function connectWebSocket(url) {
    return new Promise((resolve, reject) => {
      try {
        if (wsConnection) {
          wsConnection.close();
        }

        wsConnection = new WebSocket(url);

        wsConnection.onopen = () => {
          console.log('Connected to SafeRide Python Backend WebSocket');
          const statusText = document.getElementById('backend-status-text');
          if (statusText) statusText.textContent = 'Python Backend Connected';
          resolve(true);
        };

        wsConnection.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'DETECTION_EVENT') {
              addDetectionLog({
                id: 'PY-' + Date.now(),
                time: new Date().toLocaleTimeString('th-TH'),
                plate: data.plate || 'ตรวจไม่พบป้าย',
                plateShort: data.plate || 'N/A',
                helmet: data.helmet || 'HELMET',
                helmetTextTh: data.helmet === 'HELMET' ? 'สวมหมวกนิรภัย' : 'ไม่สวมหมวกนิรภัย (ฝ่าฝืน)',
                confHelmet: data.confHelmet || 0.9,
                confPlate: data.confPlate || 0.85,
                gate: 'ประตู 1 (Python Cam)',
                isViolation: data.helmet !== 'HELMET',
                vehicleModel: 'Live Camera Capture'
              });
            }
          } catch (err) {
            console.error('WebSocket message parse error:', err);
          }
        };

        wsConnection.onerror = (err) => {
          reject(err);
        };

        wsConnection.onclose = () => {
          console.log('WebSocket closed');
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  return {
    init,
    triggerNextVehicle,
    switchSource,
    toggleBoundingBoxes,
    toggleStreaming,
    clearLogs,
    exportCSV,
    connectWebSocket,
    setAudioAlert: (val) => { audioAlertEnabled = val; }
  };
})();
