import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from 'redis';

import { authRouter } from './routes/auth.routes';
import { healthRouter } from './routes/health.routes';
import { errorHandler } from './middleware/errorHandler';
import { redisClient } from './config/redis';
import { prisma } from './config/database';

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 3001;
const REDIS_URL = process.env.REDIS_URL || 'redis://redis-primary:6379';

app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('combined'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Sesuai saran sebelumnya, jika Nginx melakukan rewrite /api/auth/ -> /auth/
// Pastikan routing router internal menangkap endpoint dengan selaras.
app.use('/auth', authRouter); 
app.use('/health', healthRouter);

const io = new Server(httpServer, {
    path: '/chat',
    cors: { origin: '*', methods: ['GET', 'POST'] },
});

const pubClient = createClient({ url: REDIS_URL });
const subClient = pubClient.duplicate();
const CHAT_CHANNEL = 'GLOBAL_CHAT';

let matchmakingQueue: { socketId: string; username: string }[] = [];

io.on('connection', (socket) => {
    console.log(`User connected to socket: ${socket.id}`);

    socket.on('join_matchmaking', (data) => {
        const { username } = data;
        if (!matchmakingQueue.some(p => p.username === username)) {
            matchmakingQueue.push({ socketId: socket.id, username });
            console.log(`🔍 ${username} masuk antrean matchmaking. Total: ${matchmakingQueue.length}`);
        }

        if (matchmakingQueue.length >= 2) {
            const player1 = matchmakingQueue.shift()!;
            const player2 = matchmakingQueue.shift()!;
            const roomId = `room_${player1.username}_vs_${player2.username}`;

            const s1 = io.sockets.sockets.get(player1.socketId);
            const s2 = io.sockets.sockets.get(player2.socketId);
            if (s1) s1.join(roomId);
            if (s2) s2.join(roomId);

            io.to(player1.socketId).emit('match_found', { roomId, opponent: player2.username });
            io.to(player2.socketId).emit('match_found', { roomId, opponent: player1.username });
            console.log(`⚔️ Match Terbentuk! ${player1.username} VS ${player2.username} di Room: ${roomId}`);
        }
    });

    socket.on('player_board_update', (data) => {
        if (data.roomId) {
            socket.to(data.roomId).emit('enemy_board_update', data);
        }
    });

    socket.on('player_retreat', (data) => {
        if (data.roomId) {
            console.log(`🏳️ ${data.username} menyerah di room: ${data.roomId}`);
            socket.to(data.roomId).emit('enemy_retreated', { username: data.username });
        }
    });

    socket.on('send_message', async (data) => {
        try {
            const { username, message } = data;
            const payload = JSON.stringify({ username, message, timestamp: new Date() });
            await pubClient.publish(CHAT_CHANNEL, payload);
        } catch (error) {
            console.error('Failed to publish chat:', error);
        }
    });

    socket.on('disconnect', () => {
        matchmakingQueue = matchmakingQueue.filter(p => p.socketId !== socket.id);
        console.log(`User disconnected: ${socket.id}`);
    });
});

app.use(errorHandler);

const init = async () => {
    try {
        await pubClient.connect();
        await subClient.connect();
        await subClient.unsubscribe(CHAT_CHANNEL);
        await subClient.subscribe(CHAT_CHANNEL, (message) => {
            const payload = JSON.parse(message);
            io.emit('receive_message', payload);
        });
        httpServer.listen(PORT, () => console.log(`[Login Service] Running on port ${PORT}`));
    } catch (error) {
        process.exit(1);
    }
};
init();
export default app;