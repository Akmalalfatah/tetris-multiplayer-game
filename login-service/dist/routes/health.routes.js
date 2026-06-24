"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
exports.healthRouter = (0, express_1.Router)();
exports.healthRouter.get('/', async (req, res) => {
    const checks = { database: false, redis: false };
    try {
        await database_1.prisma.$queryRaw `SELECT 1`;
        checks.database = true;
    }
    catch { }
    try {
        await redis_1.redisClient.ping();
        checks.redis = true;
    }
    catch { }
    const healthy = Object.values(checks).every(Boolean);
    return res.status(healthy ? 200 : 503).json({
        service: 'login-service',
        status: healthy ? 'healthy' : 'degraded',
        checks,
        timestamp: new Date().toISOString(),
    });
});
