/**
 * SafeRide AI - Main App Controller & UI Coordinator
 * Handles Views, Translations, Theming, Modals, and Event Bindings
 */

const App = (function () {
  // Translations Dictionary
  const I18N = {
    th: {
      system_subtitle: 'Smart Campus Monitoring • Senior Project',
      status_ready: 'AI System พร้อมใช้งาน',
      hero_badge: 'Computer Vision & Deep Learning',
      hero_title: 'ระบบตรวจจับหมวกกันน็อก<br><span class="gradient-text">& ป้ายทะเบียนรถอัจฉริยะ</span>',
      hero_desc: 'โซลูชันเพื่อความปลอดภัยภายในมหาวิทยาลัย ด้วยเทคโนโลยี YOLOv8 ตรวจจับหมวกนิรภัยแบบ Real-time ร่วมกับ EasyOCR อ่านป้ายทะเบียนรถไทยอย่างแม่นยำ',
      feat_helmet_title: 'Helmet Detection AI',
      feat_helmet_desc: 'ตรวจจับผู้ขับขี่และคนซ้อนท้ายด้วยโมเดลความแม่นยำสูง',
      feat_plate_title: 'Thai License Plate OCR',
      feat_plate_desc: 'วิเคราะห์และคัดกรองหมวดอักษร-ตัวเลขทะเบียนรถไทยอัตโนมัติ',
      feat_speed_title: 'Real-time Stream Analysis',
      feat_speed_desc: 'ประมวลผลวิดีโอสดระดับ 30+ FPS พร้อมแจ้งเตือนทันที',
      auth_welcome: 'เข้าสู่ระบบการใช้งาน',
      auth_tagline: 'ยินดีต้อนรับสู่ SafeRide AI ✨',
      auth_instructions: 'เลือกเข้าสู่ระบบด้วยบัญชีนักศึกษา หรือเข้าใช้งานแบบ Guest ได้เลยน้า',
      mascot_welcome: 'พร้อมเดินทางอย่างปลอดภัยไปด้วยกันน้า~ 🛵✨',
      mascot_hover_microsoft: 'ล็อกอินด้วย Microsoft ไวและสะดวกสุดๆ เลยฮะ 🚀',
      mascot_hover_guest: 'ลองเล่นเป็น Guest ก่อนได้น้า ไม่ต้องใช้รหัสผ่าน 🎈',
      mascot_focus_email: 'กรอกอีเมลนักศึกษาได้เลยน้า 📝',
      mascot_typing: 'พิมพ์อีเมลเรียบร้อยแล้ว กดปุ่มเข้าสู่ระบบได้เลยน้า ✨',
      mascot_success: 'เย้! ยินดีต้อนรับค้าบป๋ม ขับขี่ปลอดภัยน้า 🎉🛵',
      mascot_error: 'งึม... ลองเช็คโดเมนอีเมลอีกรอบน้า 😿',
      microsoft_btn_text: 'Sign in with Microsoft',
      microsoft_btn_sub: 'Student Email (@*.ac.th / @*.edu)',
      divider_or: 'หรือ',
      label_student_email: 'อีเมลนักศึกษา (Student Email)',
      quick_domains: 'โดเมนด่วน:',
      btn_login_student: 'เข้าสู่ระบบด้วยอีเมลนักศึกษา',
      divider_guest_option: 'หรือทดลองใช้งานโดยไม่เข้าสู่ระบบ',
      btn_guest_title: 'เข้าใช้งานแบบ Guest (ผู้เยี่ยมชม)',
      badge_no_login: 'ไม่ต้อง Login',
      btn_guest_desc: 'ทดลองดู Live Camera และระบบตรวจจับ AI ได้ทันที',
      demo_accounts_title: '⚡ บัญชีทดสอบสำหรับนำเสนอผลงาน (Quick Demo):',
      tab_live: 'Live AI Monitor',
      tab_analytics: 'สถิติและความปลอดภัย',
      tab_profile: 'ข้อมูลนักศึกษา & รถของฉัน',
      tab_settings: 'ตั้งค่าระบบ & กล้อง',
      btn_logout: 'ออก',
      guest_banner_msg: 'คุณกำลังเข้าใช้งานในโหมดผู้เยี่ยมชม สามารถทดลองดูระบบตรวจจับสดได้ หากต้องการบันทึกประวัติส่วนตัว โปรดเข้าสู่ระบบด้วย Microsoft นักศึกษา',
      btn_login_now: 'เข้าสู่ระบบด้วยอีเมลนักศึกษา',
      kpi_total_scans: 'สแกนวันนี้ (Total Scans)',
      kpi_helmet_rate: 'อัตราสวมหมวกนิรภัย',
      kpi_violations: 'ไม่สวมหมวก (Violations)',
      kpi_ai_speed: 'ความเร็ว AI (Inference)',
      camera_feed_title: 'CAMERA FEED • GATE 1 (MAIN ENTRANCE)',
      recent_detections_title: 'บันทึกการตรวจจับสด (Live Feed)',
      btn_clear_logs: 'ล้างประวัติการแสดงผล',
      btn_export_csv: 'ดาวน์โหลดรายงาน (CSV)',
      microsoft_app_name: 'Sign in with Microsoft • SafeRide AI',
      microsoft_choose_account: 'เลือกบัญชีนักศึกษา',
      microsoft_choose_desc: 'เพื่อเข้าสู่ระบบ SafeRide Smart Campus',
      microsoft_other_account: 'หรือใช้อีเมล Microsoft นักศึกษาอื่น:',
      microsoft_privacy: 'ในการดำเนินการต่อ Microsoft จะแชร์ชื่อและอีเมลของคุณกับ SafeRide AI'
    },
    en: {
      system_subtitle: 'Smart Campus Monitoring • Senior Project',
      status_ready: 'AI System Ready',
      hero_badge: 'Smart Campus Buddy • AI Safety',
      hero_title: 'Smart Campus AI<br><span class="gradient-text">Helmet & License Plate Recognition</span>',
      hero_desc: 'An AI-powered campus security buddy utilizing YOLOv8 for real-time motorcycle helmet compliance and EasyOCR for Thai license plate recognition.',
      feat_helmet_title: 'Helmet Detection AI',
      feat_helmet_desc: 'Detects riders and pillion passengers with high-accuracy Deep Learning models',
      feat_plate_title: 'Thai License Plate OCR',
      feat_plate_desc: 'Extracts and parses Thai characters, numbers, and province identifiers',
      feat_speed_title: 'Real-time Stream Analysis',
      feat_speed_desc: 'Processes live video feeds at 30+ FPS with instant violation alerts',
      auth_welcome: 'Sign In to Portal',
      auth_tagline: 'Welcome to SafeRide AI ✨',
      auth_instructions: 'Choose to sign in with your student account or explore as a Guest',
      mascot_welcome: 'Ready to ride safely together! 🛵✨',
      mascot_hover_microsoft: 'Sign in with Microsoft super fast! 🚀',
      mascot_hover_guest: 'Explore as a Guest, no password needed! 🎈',
      mascot_focus_email: 'Enter your university student email! 📝',
      mascot_typing: 'Looking great! Press the submit button when ready ✨',
      mascot_success: 'Yay! Welcome aboard! Ride safely! 🎉🛵',
      mascot_error: 'Oops... please check the student email domain! 😿',
      microsoft_btn_text: 'Sign in with Microsoft',
      microsoft_btn_sub: 'Student Email (@*.ac.th / @*.edu)',
      divider_or: 'OR',
      label_student_email: 'Student Email Address',
      quick_domains: 'Quick Domains:',
      btn_login_student: 'Sign In with Student Email',
      divider_guest_option: 'OR EXPLORE WITHOUT AN ACCOUNT',
      btn_guest_title: 'Continue as Guest',
      badge_no_login: 'No Login Required',
      btn_guest_desc: 'Instantly preview the live camera feed and AI detections',
      demo_accounts_title: '⚡ Demo Presentation Accounts (Quick Test):',
      tab_live: 'Live AI Monitor',
      tab_analytics: 'Analytics & Safety',
      tab_profile: 'My Profile & Vehicles',
      tab_settings: 'Camera & API Config',
      btn_logout: 'Sign Out',
      guest_banner_msg: 'You are currently in Guest Mode. You can preview live camera streams and analytics. To view personal vehicle logs, sign in with your student email.',
      btn_login_now: 'Sign In with Student Email',
      kpi_total_scans: 'Total Scans Today',
      kpi_helmet_rate: 'Helmet Compliance Rate',
      kpi_violations: 'Violations Detected',
      kpi_ai_speed: 'AI Inference Latency',
      camera_feed_title: 'CAMERA FEED • GATE 1 (MAIN ENTRANCE)',
      recent_detections_title: 'Real-Time Detection Feed',
      btn_clear_logs: 'Clear Log Feed',
      btn_export_csv: 'Export Report (CSV)',
      microsoft_app_name: 'Sign in with Microsoft • SafeRide AI',
      microsoft_choose_account: 'Choose a Student Account',
      microsoft_choose_desc: 'to continue to SafeRide Smart Campus System',
      microsoft_other_account: 'Or use another Microsoft Student account:',
      microsoft_privacy: 'To continue, Microsoft will share your name and email address with SafeRide AI.'
    }
  };

  let currentLang = 'th';

  /**
   * Initialize App
   */
  function init() {
    setupEventListeners();
    setupLanguageSwitcher();
    setupThemeToggle();

    // Init Auth
    AuthModule.init();
    AuthModule.onAuthStateChanged(handleAuthStateChange);

    // Init Detection
    DetectionModule.init();

    // Listen for violation alert events
    window.addEventListener('saferide:violation', (e) => {
      showToast(`⚠️ ตรวจพบการไม่สวมหมวกนิรภัย: ${e.detail.plateShort || e.detail.plate}`, 'error');
    });
  }

  /**
   * Render student vehicles list dynamically with deletion actions
   */
  function renderStudentVehicles(user) {
    const listEl = document.getElementById('student-vehicles-list');
    if (!listEl) return;

    if (!user.vehicles || user.vehicles.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted); font-size: 0.8rem;">
          📭 ยังไม่มีรถจักรยานยนต์ที่ลงทะเบียนในระบบ
        </div>
      `;
      return;
    }

    listEl.innerHTML = user.vehicles.map(v => `
      <div class="vehicle-item">
        <div class="vehicle-icon">🛵</div>
        <div class="vehicle-info">
          <strong class="vehicle-plate">${v.plate}</strong>
          <span class="vehicle-model">${v.model}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div class="vehicle-sticker-status active">
            <span>Pass: Approved</span>
          </div>
          <button type="button" class="btn-delete-vehicle" data-plate="${v.plate}" style="background: transparent; border: none; color: var(--color-danger); cursor: pointer; padding: 6px; display: flex; align-items: center; justify-content: center; transition: opacity var(--transition-fast);" title="ลบรถ">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color: #ef4444;">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      </div>
    `).join('');

    // Attach click listeners to delete buttons
    listEl.querySelectorAll('.btn-delete-vehicle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const plate = btn.dataset.plate;
        if (confirm(`คุณยืนยันที่จะลบการลงทะเบียนของยานพาหนะทะเบียน "${plate}" หรือไม่?`)) {
          try {
            AuthModule.removeVehicle(plate);
            showToast(`ลบยานพาหนะ ${plate} สำเร็จ`, 'success');
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      });
    });
  }

  /**
   * Handle Auth State Changes (Render UI accordingly)
   */
  function handleAuthStateChange(user) {
    // 1. Guard route using AuthorityModule
    const isAuthorized = AuthorityModule.guardRoute(user);
    if (!isAuthorized) return; // Redirect is handled by guardRoute

    // 2. Toggle local views if elements exist
    const authView = document.getElementById('auth-view');
    const dashboardView = document.getElementById('dashboard-view');
    const guestBanner = document.getElementById('guest-alert-banner');
    const userNameEl = document.getElementById('user-display-name');
    const userRoleEl = document.getElementById('user-role-badge');
    const userAvatarChar = document.getElementById('user-avatar-letter');

    if (authView) authView.classList.remove('active');
    if (dashboardView) dashboardView.classList.add('active');

    // Update Header Profile
    if (userNameEl) userNameEl.textContent = user.name || 'User';
    if (userRoleEl) {
      if (user.role === 'student') userRoleEl.textContent = `Student (${user.studentId || 'N/A'})`;
      else if (user.role === 'admin') userRoleEl.textContent = 'Admin / Security Staff';
      else userRoleEl.textContent = 'Guest Mode';
    }
    if (userAvatarChar) userAvatarChar.textContent = user.avatarChar || 'U';

    // Guest vs Student Conditional UI
    const profileLocked = document.getElementById('profile-guest-locked');
    const profileContent = document.getElementById('profile-student-content');

    if (user.role === 'guest') {
      if (guestBanner) guestBanner.style.display = 'flex';
      if (profileLocked) profileLocked.style.display = 'flex';
      if (profileContent) profileContent.style.display = 'none';
    } else {
      if (guestBanner) guestBanner.style.display = 'none';
      if (profileLocked) profileLocked.style.display = 'none';
      if (profileContent) profileContent.style.display = 'grid';

      // Fill in student profile fields
      const pName = document.getElementById('profile-full-name');
      const pId = document.getElementById('profile-student-id');
      const pEmail = document.getElementById('profile-email-text');
      const pAvatar = document.getElementById('profile-avatar-char');
      const pScore = document.getElementById('profile-safety-score');

      if (pName) pName.textContent = user.name;
      if (pId) pId.textContent = user.studentId;
      if (pEmail) pEmail.textContent = user.email;
      if (pAvatar) pAvatar.textContent = user.avatarChar;
      if (pScore) pScore.textContent = `${user.safetyScore || 95}/100`;

      // Render student vehicles dynamically
      renderStudentVehicles(user);
    }
  }

  /**
   * Set up all UI Event Listeners
   */
  function setupEventListeners() {
    // 1. Microsoft Login Button -> Open Simulated OAuth Modal
    const btnMicrosoftLogin = document.getElementById('btn-microsoft-login');
    const microsoftModal = document.getElementById('microsoft-modal');
    const btnCloseMicrosoft = document.getElementById('btn-close-microsoft-modal');

    if (btnMicrosoftLogin && microsoftModal) {
      btnMicrosoftLogin.addEventListener('click', () => {
        microsoftModal.classList.add('show');
      });
    }

    if (btnCloseMicrosoft && microsoftModal) {
      btnCloseMicrosoft.addEventListener('click', () => {
        microsoftModal.classList.remove('show');
      });
      // Click backdrop to close
      microsoftModal.addEventListener('click', (e) => {
        if (e.target === microsoftModal) microsoftModal.classList.remove('show');
      });
    }

    // Microsoft Modal Accounts selection
    const microsoftAccountBtns = document.querySelectorAll('.microsoft-account-item');
    microsoftAccountBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const email = btn.dataset.email;
        const name = btn.dataset.name;
        const id = btn.dataset.id;
        try {
          AuthModule.signInWithMicrosoft(email, name, id);
          if (microsoftModal) microsoftModal.classList.remove('show');
          triggerSparkles(e.clientX, e.clientY);
          showToast(`ยินดีต้อนรับ น.ศ. ${name}`, 'success');
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });

    // Custom Microsoft Account input in Modal
    const btnCustomMicrosoft = document.getElementById('btn-custom-microsoft-submit');
    const customMicrosoftInput = document.getElementById('custom-microsoft-email');
    if (btnCustomMicrosoft && customMicrosoftInput) {
      btnCustomMicrosoft.addEventListener('click', (e) => {
        const email = customMicrosoftInput.value.trim();
        if (!email) return;
        try {
          const user = AuthModule.signInWithMicrosoft(email);
          if (microsoftModal) microsoftModal.classList.remove('show');
          triggerSparkles(e.clientX, e.clientY);
          showToast(`เข้าสู่ระบบด้วย Microsoft: ${user.email}`, 'success');
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    // 2. Direct Student Email Form
    const studentForm = document.getElementById('student-email-form');
    const emailInput = document.getElementById('student-email-input');
    const errorMsg = document.getElementById('email-error-msg');

    if (studentForm && emailInput) {
      studentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();

        if (!email) {
          showEmailError('กรุณากรอกอีเมลนักศึกษา');
          setMascotSpeech('mascot_error', '😿');
          return;
        }

        if (!AuthModule.isValidStudentEmail(email)) {
          showEmailError('รูปแบบอีเมลไม่ถูกต้อง (ต้องเป็นโดเมนการศึกษา เช่น @*.ac.th, @*.edu)');
          setMascotSpeech('mascot_error', '😿');
          return;
        }

        hideEmailError();
        try {
          const user = AuthModule.signInWithEmail(email);
          triggerSparkles(e.clientX || window.innerWidth / 2, e.clientY || window.innerHeight / 2);
          showToast(`เข้าสู่ระบบสำเร็จ: ${user.name}`, 'success');
        } catch (err) {
          showEmailError(err.message);
          setMascotSpeech('mascot_error', '😿');
        }
      });
    }

    // Quick Domain Chips
    const domainChips = document.querySelectorAll('.domain-chip');
    domainChips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        if (!emailInput) return;
        const current = emailInput.value.split('@')[0] || '65070042';
        emailInput.value = current + chip.dataset.domain;
        emailInput.focus();
        hideEmailError();
        setMascotSpeech('mascot_typing', '✨');
        animateMascotBounce();
        triggerSparkles(e.clientX, e.clientY, 4);
      });
    });

    function showEmailError(msg) {
      if (errorMsg) {
        errorMsg.textContent = msg;
        errorMsg.classList.add('show');
      }
    }
    function hideEmailError() {
      if (errorMsg) {
        errorMsg.classList.remove('show');
      }
    }

    // 3. Guest Mode Button
    const btnGuestLogin = document.getElementById('btn-guest-login');
    if (btnGuestLogin) {
      btnGuestLogin.addEventListener('click', (e) => {
        triggerSparkles(e.clientX, e.clientY);
        AuthModule.signInAsGuest();
        showToast('เข้าสู่ระบบในโหมดผู้เยี่ยมชม (Guest Mode) เรียบร้อย 🎈', 'info');
      });
    }

    // Banner upgrade button (for guest)
    const btnBannerLogin = document.getElementById('btn-banner-login');
    const btnProfileLoginCta = document.getElementById('btn-profile-login-cta');
    const triggerMicrosoftLogin = () => {
      if (microsoftModal) microsoftModal.classList.add('show');
    };
    if (btnBannerLogin) btnBannerLogin.addEventListener('click', triggerMicrosoftLogin);
    if (btnProfileLoginCta) btnProfileLoginCta.addEventListener('click', triggerMicrosoftLogin);

    // 4. Preset Quick Demo Buttons
    const presetBtns = document.querySelectorAll('.btn-preset-account');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const email = btn.dataset.email;
        const name = btn.dataset.name;
        const id = btn.dataset.id;
        triggerSparkles(e.clientX, e.clientY);
        AuthModule.signInWithMicrosoft(email, name, id);
        showToast(`เข้าสู่ระบบแบบ Demo: ${name}`, 'success');
      });
    });

    // 5. Cute Mascot Interactive Listeners
    setupMascotInteractions();

    // 5. Logout Button
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        AuthModule.signOut();
        showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
      });
    }

    // 6. Tab Navigation Inside Dashboard (using corrected mobile-nav-item class)
    const navTabs = document.querySelectorAll('.mobile-nav-item');
    const tabPanes = document.querySelectorAll('.tab-pane');

    navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.dataset.tab;

        navTabs.forEach(t => t.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        const targetPane = document.getElementById(targetId);
        if (targetPane) targetPane.classList.add('active');
      });
    });

    // 7. Video Stream Controls
    const btnTriggerSim = document.getElementById('btn-trigger-detection');
    if (btnTriggerSim) {
      btnTriggerSim.addEventListener('click', () => {
        DetectionModule.triggerNextVehicle();
      });
    }

    const btnStreamSource = document.getElementById('btn-stream-source');
    if (btnStreamSource) {
      btnStreamSource.addEventListener('click', async () => {
        try {
          const isWebcam = await DetectionModule.switchSource();
          if (isWebcam) {
            showToast('เชื่อมต่อกล้อง Webcam สำเร็จ', 'success');
          } else {
            showToast('สลับกลับสู่โหมด AI Simulation', 'info');
          }
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    const btnToggleBoxes = document.getElementById('btn-toggle-boxes');
    if (btnToggleBoxes) {
      btnToggleBoxes.addEventListener('click', () => {
        const enabled = DetectionModule.toggleBoundingBoxes();
        btnToggleBoxes.classList.toggle('active', enabled);
        showToast(enabled ? 'เปิดแสดงผล Bounding Boxes' : 'ปิดแสดงผล Bounding Boxes', 'info');
      });
    }

    const btnToggleStream = document.getElementById('btn-toggle-stream');
    if (btnToggleStream) {
      btnToggleStream.addEventListener('click', () => {
        const isStreaming = DetectionModule.toggleStreaming();
        btnToggleStream.innerHTML = isStreaming ? '<span>⏸️ พักการสตรีม</span>' : '<span>▶️ เล่นต่อ</span>';
      });
    }

    const btnCapture = document.getElementById('btn-capture-snapshot');
    if (btnCapture) {
      btnCapture.addEventListener('click', () => {
        showToast('📸 บันทึกภาพ Snapshot การตรวจจับแล้ว', 'success');
      });
    }

    // 8. Log Feed Actions
    const btnClearLogs = document.getElementById('btn-clear-logs');
    if (btnClearLogs) {
      btnClearLogs.addEventListener('click', () => {
        DetectionModule.clearLogs();
        showToast('ล้างประวัติการแสดงผลแล้ว', 'info');
      });
    }

    const btnExportLogs = document.getElementById('btn-export-logs');
    if (btnExportLogs) {
      btnExportLogs.addEventListener('click', () => {
        DetectionModule.exportCSV();
        showToast('ดาวน์โหลดไฟล์ CSV เรียบร้อย', 'success');
      });
    }

    // 9. Audio Alert Toggle
    const toggleAudio = document.getElementById('toggle-audio-alert');
    if (toggleAudio) {
      toggleAudio.addEventListener('change', (e) => {
        DetectionModule.setAudioAlert(e.target.checked);
        showToast(e.target.checked ? 'เปิดเสียงเตือนการฝ่าฝืน' : 'ปิดเสียงเตือน', 'info');
      });
    }

    // 10. WebSocket Connection Test
    const btnTestWs = document.getElementById('btn-test-ws');
    const wsUrlInput = document.getElementById('ws-backend-url');
    const wsResultText = document.getElementById('ws-test-result');

    if (btnTestWs && wsUrlInput && wsResultText) {
      btnTestWs.addEventListener('click', async () => {
        wsResultText.textContent = 'กำลังทดสอบการเชื่อมต่อ...';
        wsResultText.className = 'test-result-text text-warning';
        try {
          await DetectionModule.connectWebSocket(wsUrlInput.value.trim());
          wsResultText.textContent = '✓ เชื่อมต่อ Python Backend สำเร็จ!';
          wsResultText.className = 'test-result-text text-success';
          showToast('เชื่อมต่อ Python Backend สำเร็จ', 'success');
        } catch (err) {
          wsResultText.textContent = '✗ ไม่สามารถเชื่อมต่อได้ (เปิดเซิร์ฟเวอร์ server.py ก่อน)';
          wsResultText.className = 'test-result-text text-danger';
          showToast('ไม่พบเซิร์ฟเวอร์ WebSocket ที่พอร์ต 8000', 'error');
        }
      });
    }

    // 11. Sliders Feedback
    const sliderHelmet = document.getElementById('slider-conf-helmet');
    const valHelmet = document.getElementById('conf-helmet-val');
    if (sliderHelmet && valHelmet) {
      sliderHelmet.addEventListener('input', () => {
        valHelmet.textContent = sliderHelmet.value + '%';
      });
    }

    const sliderPlate = document.getElementById('slider-conf-plate');
    const valPlate = document.getElementById('conf-plate-val');
    if (sliderPlate && valPlate) {
      sliderPlate.addEventListener('input', () => {
        valPlate.textContent = sliderPlate.value + '%';
      });
    }

    // 12. Add Vehicle Modal Listeners
    const btnAddVehicle = document.getElementById('btn-add-vehicle');
    const vehicleModal = document.getElementById('add-vehicle-modal');
    const btnCloseVehicleModal = document.getElementById('btn-close-vehicle-modal');
    const btnCancelVehicle = document.getElementById('btn-cancel-vehicle');
    const addVehicleForm = document.getElementById('add-vehicle-form');

    if (btnAddVehicle && vehicleModal) {
      btnAddVehicle.addEventListener('click', () => {
        vehicleModal.classList.add('show');
      });
    }

    const closeVehicleModalFn = () => {
      if (vehicleModal) vehicleModal.classList.remove('show');
      if (addVehicleForm) addVehicleForm.reset();
    };

    if (btnCloseVehicleModal) {
      btnCloseVehicleModal.addEventListener('click', closeVehicleModalFn);
    }
    if (btnCancelVehicle) {
      btnCancelVehicle.addEventListener('click', closeVehicleModalFn);
    }
    if (vehicleModal) {
      vehicleModal.addEventListener('click', (e) => {
        if (e.target === vehicleModal) closeVehicleModalFn();
      });
    }

    if (addVehicleForm) {
      addVehicleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const plateInput = document.getElementById('vehicle-plate-input').value.trim();
        const provinceInput = document.getElementById('vehicle-province-input').value.trim();
        const modelInput = document.getElementById('vehicle-model-input').value.trim();
        const colorInput = document.getElementById('vehicle-color-input').value.trim();

        if (!plateInput || !provinceInput || !modelInput || !colorInput) {
          showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
          return;
        }

        const fullPlate = `${plateInput} ${provinceInput}`;
        const fullModel = `${modelInput} (${colorInput})`;

        try {
          AuthModule.addVehicle(fullPlate, fullModel);
          showToast(`ลงทะเบียนยานพาหนะ ${fullPlate} สำเร็จ ✨`, 'success');
          closeVehicleModalFn();
          
          // Mascot feedback animation
          animateMascotBounce();
          setMascotSpeechDirect('ยินดีด้วยฮะ! ลงทะเบียนรถเรียบร้อยแล้ว 🛵🎉', '✨');
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }
  }

  /**
   * Setup Language Switcher (TH / EN)
   */
  function setupLanguageSwitcher() {
    const btnTh = document.getElementById('btn-lang-th');
    const btnEn = document.getElementById('btn-lang-en');

    if (btnTh && btnEn) {
      btnTh.addEventListener('click', () => setLanguage('th'));
      btnEn.addEventListener('click', () => setLanguage('en'));
    }
  }

  function setLanguage(lang) {
    currentLang = lang;
    const btnTh = document.getElementById('btn-lang-th');
    const btnEn = document.getElementById('btn-lang-en');

    if (btnTh && btnEn) {
      btnTh.classList.toggle('active', lang === 'th');
      btnEn.classList.toggle('active', lang === 'en');
    }

    document.documentElement.lang = lang;

    // Translate all [data-i18n] elements
    const i18nElements = document.querySelectorAll('[data-i18n]');
    i18nElements.forEach(el => {
      const key = el.dataset.i18n;
      if (I18N[lang] && I18N[lang][key]) {
        el.innerHTML = I18N[lang][key];
      }
    });
  }

  /**
   * Setup Theme Switcher (Dark / Light)
   */
  function setupThemeToggle() {
    const btnTheme = document.getElementById('btn-theme-toggle');
    if (!btnTheme) return;

    // Check saved theme or default to dark
    const savedTheme = localStorage.getItem('saferide_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    btnTheme.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('saferide_theme', next);
      showToast(`เปลี่ยนเป็น ${next === 'dark' ? 'Dark Mode' : 'Light Mode'}`, 'info');
    });
  }

  /**
   * Cute Mascot Interactions & Speech Bubble Logic
   */
  function setupMascotInteractions() {
    const mascotChar = document.getElementById('mascot-character');
    const emailInput = document.getElementById('student-email-input');
    const btnGoogle = document.getElementById('btn-google-login');
    const btnGuest = document.getElementById('btn-guest-login');
    const presetBtns = document.querySelectorAll('.btn-preset-account');

    if (mascotChar) {
      mascotChar.addEventListener('click', (e) => {
        animateMascotBounce();
        triggerSparkles(e.clientX, e.clientY, 8);
        setMascotSpeech('mascot_welcome', '🐱✨');
      });
    }

    if (emailInput) {
      emailInput.addEventListener('focus', () => {
        setMascotSpeech('mascot_focus_email', '📝');
        const eyeLeft = document.getElementById('eye-left');
        const eyeRight = document.getElementById('eye-right');
        if (eyeLeft && eyeRight) {
          eyeLeft.style.transform = 'translateY(2px)';
          eyeRight.style.transform = 'translateY(2px)';
        }
      });

      emailInput.addEventListener('input', () => {
        if (emailInput.value.length > 5) {
          setMascotSpeech('mascot_typing', '✨');
        }
      });

      emailInput.addEventListener('blur', () => {
        const eyeLeft = document.getElementById('eye-left');
        const eyeRight = document.getElementById('eye-right');
        if (eyeLeft && eyeRight) {
          eyeLeft.style.transform = 'none';
          eyeRight.style.transform = 'none';
        }
        setTimeout(() => {
          if (document.activeElement !== emailInput) {
            setMascotSpeech('mascot_welcome', '🐾');
          }
        }, 300);
      });
    }

    const btnMicrosoft = document.getElementById('btn-microsoft-login');
    if (btnMicrosoft) {
      btnMicrosoft.addEventListener('mouseenter', () => setMascotSpeech('mascot_hover_microsoft', '🚀'));
      btnMicrosoft.addEventListener('mouseleave', () => setMascotSpeech('mascot_welcome', '🐾'));
    }

    if (btnGuest) {
      btnGuest.addEventListener('mouseenter', () => setMascotSpeech('mascot_hover_guest', '🎈'));
      btnGuest.addEventListener('mouseleave', () => setMascotSpeech('mascot_welcome', '🐾'));
    }

    presetBtns.forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        const name = btn.dataset.name || 'Demo';
        setMascotSpeechDirect(`ทดสอบด้วยบัญชี ${name} ได้เลยฮะ ⚡`, '✨');
      });
      btn.addEventListener('mouseleave', () => setMascotSpeech('mascot_welcome', '🐾'));
    });
  }

  function setMascotSpeech(key, emoji = '🐾') {
    const bubble = document.getElementById('mascot-speech');
    const textEl = document.getElementById('mascot-speech-text');
    const emojiEl = bubble ? bubble.querySelector('.speech-emoji') : null;

    if (textEl && I18N[currentLang] && I18N[currentLang][key]) {
      textEl.textContent = I18N[currentLang][key];
      textEl.dataset.i18n = key;
    }
    if (emojiEl) emojiEl.textContent = emoji;

    if (bubble) {
      bubble.style.transform = 'scale(1.05)';
      setTimeout(() => bubble.style.transform = 'none', 180);
    }
  }

  function setMascotSpeechDirect(text, emoji = '✨') {
    const bubble = document.getElementById('mascot-speech');
    const textEl = document.getElementById('mascot-speech-text');
    const emojiEl = bubble ? bubble.querySelector('.speech-emoji') : null;

    if (textEl) textEl.textContent = text;
    if (emojiEl) emojiEl.textContent = emoji;

    if (bubble) {
      bubble.style.transform = 'scale(1.05)';
      setTimeout(() => bubble.style.transform = 'none', 180);
    }
  }

  function animateMascotBounce() {
    const mascot = document.getElementById('mascot-character');
    if (!mascot) return;
    mascot.classList.remove('happy');
    void mascot.offsetWidth; // trigger reflow
    mascot.classList.add('happy');
    setTimeout(() => mascot.classList.remove('happy'), 650);
  }

  /**
   * Cute Floating Sparkle Burst Effect
   */
  function triggerSparkles(x = window.innerWidth / 2, y = window.innerHeight / 2, count = 12) {
    const emojis = ['✨', '💖', '🌸', '⭐', '🛵', '🪖', '🐾', '🎉', '🍬'];
    const posX = x || (window.innerWidth / 2);
    const posY = y || (window.innerHeight / 2);

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('span');
      particle.className = 'sparkle-particle';
      particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];

      const angle = (i / count) * 360 + (Math.random() * 30 - 15);
      const dist = 60 + Math.random() * 90;
      const dx = Math.cos(angle * Math.PI / 180) * dist;
      const dy = Math.sin(angle * Math.PI / 180) * dist - 30; // slightly upward
      const rot = (Math.random() * 360 - 180) + 'deg';

      particle.style.left = `${posX}px`;
      particle.style.top = `${posY}px`;
      particle.style.setProperty('--dx', `${dx}px`);
      particle.style.setProperty('--dy', `${dy}px`);
      particle.style.setProperty('--rot', rot);
      particle.style.animationDuration = `${1.2 + Math.random() * 0.5}s`;

      document.body.appendChild(particle);

      setTimeout(() => particle.remove(), 1800);
    }
  }

  /**
   * Toast Notification Helper
   */
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  return {
    init,
    showToast,
    setLanguage
  };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

