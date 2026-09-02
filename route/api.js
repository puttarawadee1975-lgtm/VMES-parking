const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('./middleware/auth');

// ทุกคนเข้าได้ (student, officer, office)
router.get('/parking-status', verifyToken, checkRole(['student', 'officer', 'office']), (req, res) => {
    res.json({ message: 'จำนวนที่จอดรถว่างแบบ Real-time' });
});

// เฉพาะ officer และ office (admin)
router.get('/detection-logs', verifyToken, checkRole(['officer', 'office']), (req, res) => {
    res.json({ message: 'บันทึกภาพและประวัติตรวจจับป้ายทะเบียน/หมวกกันน็อค' });
});

// เฉพาะ office (admin) เท่านั้น
router.post('/manage-users', verifyToken, checkRole(['office']), (req, res) => {
    res.json({ message: 'จัดการสิทธิ์และข้อมูลผู้ใช้ในระบบ' });
});

module.exports = router;