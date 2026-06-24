import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { redisClient } from '../config/redis';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Cek jika token sudah di-blacklist (user sudah logout)
    const blacklisted = await redisClient.get(`blacklist:${token}`);
    if (blacklisted) {
        return res.status(401).json({ success: false, message: 'Token revoked or expired' });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    (req as any).user = payload;
    next();
};