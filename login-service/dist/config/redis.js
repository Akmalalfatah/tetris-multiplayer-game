"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
exports.redisClient = new ioredis_1.default(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    reconnectOnError: (err) => {
        console.error('[Redis] Connection error:', err.message);
        return true;
    },
});
exports.redisClient.on('connect', () => console.log('[Redis] Connected to Redis'));
exports.redisClient.on('error', (err) => console.error('[Redis] Error:', err.message));
