const jwt = require('jsonwebtoken');

// ตรวจสอบ JWT Token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access Denied: No Token Provided' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SECRET_KEY');
        req.user = decoded; // { id, email, role }
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid Token' });
    }
};

// ตรวจสอบสิทธิ์ตาม Role ที่อนุญาต
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: You do not have permission' });
        }
        next();
    };
};

module.exports = { verifyToken, checkRole };