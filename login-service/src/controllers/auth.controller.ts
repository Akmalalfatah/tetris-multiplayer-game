import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { redisClient } from '../config/redis';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';

export class AuthController {
    register = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { username, email, password } = req.body;

            const existing = await prisma.user.findFirst({
                where: { OR: [{ email }, { username }] },
            });
            if (existing) {
                return res.status(409).json({
                    success: false,
                    message: existing.email === email ? 'Email already registered' : 'Username taken',
                });
            }

            const passwordHash = await bcrypt.hash(password, 12);
            const user = await prisma.user.create({
                data: { username, email, password_hash: passwordHash },
                select: { id: true, username: true, email: true, created_at: true },
            });

            const tokens = generateTokens({ userId: user.id, username: user.username });

            await prisma.session.create({
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
        } catch (err) {
            next(err);
        }
    };

    login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body;

            const user = await prisma.user.findUnique({ where: { email } });
            if (!user || !user.is_active) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
            if (user.is_banned) {
                return res.status(403).json({ success: false, message: 'Account banned' });
            }

            const valid = await bcrypt.compare(password, user.password_hash);
            if (!valid) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            const tokens = generateTokens({ userId: user.id, username: user.username });

            await prisma.session.create({
                data: {
                    user_id: user.id,
                    refresh_token: tokens.refreshToken,
                    ip_address: req.ip,
                    device_info: req.headers['user-agent'] || '',
                    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });

            await prisma.user.update({
                where: { id: user.id },
                data: { last_login: new Date() },
            });

            await redisClient.setex(
                `session:${user.id}`,
                86400,
                JSON.stringify({ userId: user.id, username: user.username, email: user.email })
            );

            return res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user: { id: user.id, username: user.username, email: user.email },
                    ...tokens,
                },
            });
        } catch (err) {
            next(err);
        }
    };

    refresh = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { refreshToken } = req.body;
            const payload = verifyRefreshToken(refreshToken);
            if (!payload) {
                return res.status(401).json({ success: false, message: 'Invalid refresh token' });
            }

            const session = await prisma.session.findFirst({
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

            const tokens = generateTokens({ userId: payload.userId, username: payload.username });

            await prisma.session.update({
                where: { id: session.id },
                data: { refresh_token: tokens.refreshToken },
            });

            return res.json({ success: true, data: tokens });
        } catch (err) {
            next(err);
        }
    };

    logout = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user.userId;
            const authHeader = req.headers.authorization;
            const token = authHeader?.split(' ')[1];

            if (token) {
                await redisClient.setex(`blacklist:${token}`, 86400, '1');
            }

            await prisma.session.deleteMany({
                where: { user_id: userId, device_info: req.headers['user-agent'] || '' },
            });

            await redisClient.del(`session:${userId}`);

            return res.json({ success: true, message: 'Logged out successfully' });
        } catch (err) {
            next(err);
        }
    };

    logoutAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user.userId;

            await prisma.session.updateMany({
                where: { user_id: userId },
                data: { is_revoked: true },
            });

            await redisClient.del(`session:${userId}`);

            return res.json({ success: true, message: 'Logged out from all devices' });
        } catch (err) {
            next(err);
        }
    };

    verify = async (req: Request, res: Response) => {
        const user = (req as any).user;
        return res.json({ success: true, data: user });
    };
}