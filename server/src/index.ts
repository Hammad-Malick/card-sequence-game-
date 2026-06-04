import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { registerSocketHandlers } from './socket';

const PORT = parseInt(process.env.PORT ?? '4000', 10);
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173';
const NODE_ENV = process.env.NODE_ENV ?? 'development';

const allowedOrigins = NODE_ENV === 'production'
  ? [CLIENT_URL]
  : [CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

const app = express();

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 30_000,
  pingInterval: 10_000,
  transports: ['websocket', 'polling'],
});

registerSocketHandlers(io);

// Global error handling — prevent crashes from bad client payloads
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

httpServer.listen(PORT, () => {
  console.log(`[server] Sequence game server running on port ${PORT}`);
  console.log(`[server] Allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`[server] Environment: ${NODE_ENV}`);
});
