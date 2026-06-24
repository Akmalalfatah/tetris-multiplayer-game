import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    reconnectOnError: (err) => {
        console.error('[Redis] Connection error:', err.message);
        return true;
    },
});

redisClient.on('connect', () => console.log('[Redis] Connected to Redis'));
redisClient.on('error', (err) => console.error('[Redis] Error:', err.message));