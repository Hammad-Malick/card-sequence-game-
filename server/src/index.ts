import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { registerSocketHandlers } from './socket';

const PORT = parseInt(process.env.PORT ?? '4000', 10);
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173';
const NODE_ENV   = process.env.NODE_ENV   ?? 'development';

/*
 * CORS origins:
 *   Production  → only the Vercel frontend URL (set CLIENT_URL in Vercel dashboard)
 *   Development → localhost variants for local dev
 */
const allowedOrigins =
  NODE_ENV === 'production'
    ? [CLIENT_URL]
    : [CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

const app = express();

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: NODE_ENV,
  });
});

const httpServer = createServer(app);

/*
 * Socket.io configuration for Vercel compatibility.
 *
 * - `transports: ['websocket', 'polling']`
 *     WebSocket is tried first (works on Vercel Pro + Fluid Compute).
 *     Falls back to HTTP long-polling for Hobby / serverless constraints.
 *
 * - `pingTimeout / pingInterval`
 *     Kept under Vercel Hobby's 10 s function limit so polls don't get
 *     killed mid-request.  Adjust upward on Pro (60 s) or Enterprise (300 s).
 *
 * - `connectionStateRecovery`
 *     Buffers missed events during brief disconnections and replays them
 *     on reconnect, minimising visible "blinks" for players.
 */
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 20_000,
  pingInterval: 10_000,
  connectTimeout: 45_000,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true,
  },
});

registerSocketHandlers(io);

// Prevent server crashes from unexpected errors in socket payloads
process.on('uncaughtException',  (err)    => console.error('[uncaughtException]', err));
process.on('unhandledRejection', (reason) => console.error('[unhandledRejection]', reason));

/*
 * Vercel exports:
 *   `@vercel/node` imports this file as a module and passes incoming
 *   requests directly to `httpServer` — it does NOT call listen().
 *
 * Local development:
 *   process.env.VERCEL is undefined → we call listen() ourselves.
 */
export default httpServer;

if (!process.env.VERCEL) {
  httpServer.listen(PORT, () => {
    console.log(`[server] Sequence game server running on http://localhost:${PORT}`);
    console.log(`[server] Allowed origins : ${allowedOrigins.join(', ')}`);
    console.log(`[server] Environment     : ${NODE_ENV}`);
  });
}
