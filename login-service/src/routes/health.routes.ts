import { Router } from 'express';
import { prisma } from '../config/database';
import { redisClient } from '../config/redis';

export const healthRouter = Router();

healthRouter.get('/', async (req, res) => {
    const checks = { database: false, redis: false };

    try {
        await prisma.$queryRaw`SELECT 1`;
        checks.database = true;
    } catch { }

    try {
        await redisClient.ping();
        checks.redis = true;
    } catch { }

    const healthy = Object.values(checks).every(Boolean);
    return res.status(healthy ? 200 : 503).json({
        service: 'login-service',
        status: healthy ? 'healthy' : 'degraded',
        checks,
        timestamp: new Date().toISOString(),
    });
});