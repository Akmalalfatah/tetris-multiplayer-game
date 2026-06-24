"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const redis_1 = require("../config/redis");
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    // Cek jika token sudah di-blacklist (user sudah logout)
    const blacklisted = await redis_1.redisClient.get(`blacklist:${token}`);
    if (blacklisted) {
        return res.status(401).json({ success: false, message: 'Token revoked or expired' });
    }
    const payload = (0, jwt_1.verifyAccessToken)(token);
    if (!payload) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = payload;
    next();
};
exports.authenticate = authenticate;
