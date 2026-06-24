"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const jwt_1 = require("../utils/jwt");
class AuthController {
    register = async (req, res, next) => {
        try {
            const { username, email, password } = req.body;
            const existing = await database_1.prisma.user.findFirst({
                where: { OR: [{ email }, { username }] },
            });
            if (existing) {
                return res.status(409).json({
                    success: false,
                    message: existing.email === email ? 'Email already registered' : 'Username taken',
                });
            }
            const passwordHash = await bcryptjs_1.default.hash(password, 12);
            const user = await database_1.prisma.user.create({
                data: { username, email, password_hash: passwordHash },
                select: { id: true, username: true, email: true, created_at: true },
            });
            const tokens = (0, jwt_1.generateTokens)({ userId: user.id, username: user.username });
            await database_1.prisma.session.create({
                data: {
                    user_id: user.id,
                    refresh_token: tokens.refreshToken,
                    ip_address: req.ip,
                    device_info: req.headers['user-agent'] || '',
                    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });
            return res.status(201).json({
                success: true,
                message: 'Registration successful',
                data: { user, ...tokens },
            });
        }
        catch (err) {
            next(err);
        }
    };
    login = async (req, res, next) => {
        try {
            const { email, password } = req.body;
            const user = await database_1.prisma.user.findUnique({ where: { email } });
            if (!user || !user.is_active) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
            if (user.is_banned) {
                return res.status(403).json({ success: false, message: 'Account banned' });
            }
            const valid = await bcryptjs_1.default.compare(password, user.password_hash);
            if (!valid) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
            const tokens = (0, jwt_1.generateTokens)({ userId: user.id, username: user.username });
            await database_1.prisma.session.create({
                data: {
                    user_id: user.id,
                    refresh_token: tokens.refreshToken,
                    ip_address: req.ip,
                    device_info: req.headers['user-agent'] || '',
                    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });
            await database_1.prisma.user.update({
                where: { id: user.id },
                data: { last_login: new Date() },
            });
            await redis_1.redisClient.setex(`session:${user.id}`, 86400, JSON.stringify({ userId: user.id, username: user.username, email: user.email }));
            return res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user: { id: user.id, username: user.username, email: user.email },
                    ...tokens,
                },
            });
        }
        catch (err) {
            next(err);
        }
    };
    refresh = async (req, res, next) => {
        try {
            const { refreshToken } = req.body;
            const payload = (0, jwt_1.verifyRefreshToken)(refreshToken);
            if (!payload) {
                return res.status(401).json({ success: false, message: 'Invalid refresh token' });
            }
            const session = await database_1.prisma.session.findFirst({
                where: {
                    refresh_token: refreshToken,
                    user_id: payload.userId,
                    is_revoked: false,
                    expires_at: { gt: new Date() },
                },
            });
            if (!session) {
                return res.status(401).json({ success: false, message: 'Session expired or revoked' });
            }
            const tokens = (0, jwt_1.generateTokens)({ userId: payload.userId, username: payload.username });
            await database_1.prisma.session.update({
                where: { id: session.id },
                data: { refresh_token: tokens.refreshToken },
            });
            return res.json({ success: true, data: tokens });
        }
        catch (err) {
            next(err);
        }
    };
    logout = async (req, res, next) => {
        try {
            const userId = req.user.userId;
            const authHeader = req.headers.authorization;
            const token = authHeader?.split(' ')[1];
            if (token) {
                await redis_1.redisClient.setex(`blacklist:${token}`, 86400, '1');
            }
            await database_1.prisma.session.deleteMany({
                where: { user_id: userId, device_info: req.headers['user-agent'] || '' },
            });
            await redis_1.redisClient.del(`session:${userId}`);
            return res.json({ success: true, message: 'Logged out successfully' });
        }
        catch (err) {
            next(err);
        }
    };
    logoutAll = async (req, res, next) => {
        try {
            const userId = req.user.userId;
            await database_1.prisma.session.updateMany({
                where: { user_id: userId },
                data: { is_revoked: true },
            });
            await redis_1.redisClient.del(`session:${userId}`);
            return res.json({ success: true, message: 'Logged out from all devices' });
        }
        catch (err) {
            next(err);
        }
    };
    verify = async (req, res) => {
        const user = req.user;
        return res.json({ success: true, data: user });
    };
}
exports.AuthController = AuthController;
