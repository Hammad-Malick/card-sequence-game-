import { io, Socket } from 'socket.io-client';
import type {
  Card,
  GameMode,
  ServerRoomView,
} from '../game/types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'https://card-sequence-game-api.vercel.app';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket || !socket.connected) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10_000,
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

// ──────────────────────────────────────────────
// Room actions
// ──────────────────────────────────────────────

export function emitCreateRoom(
  playerName: string,
  gameMode: GameMode
): Promise<ServerRoomView & { error?: string }> {
  return new Promise(resolve => {
    getSocket().emit('room:create', { playerName, gameMode }, resolve);
  });
}

export function emitJoinRoom(
  playerName: string,
  roomCode: string
): Promise<ServerRoomView & { error?: string }> {
  return new Promise(resolve => {
    getSocket().emit('room:join', { playerName, roomCode }, resolve);
  });
}

export function emitReconnect(
  roomCode: string,
  playerId: string,
  reconnectToken: string
): Promise<ServerRoomView & { error?: string }> {
  return new Promise(resolve => {
    getSocket().emit('player:reconnect', { roomCode, playerId, reconnectToken }, resolve);
  });
}

export function emitLeaveRoom(roomCode: string, playerId: string): Promise<{ error?: string }> {
  return new Promise(resolve => {
    getSocket().emit('room:leave', { roomCode, playerId }, resolve);
  });
}

export function emitChangeTeam(
  roomCode: string,
  playerId: string,
  newTeamId: string
): Promise<{ error?: string }> {
  return new Promise(resolve => {
    getSocket().emit('room:change-team', { roomCode, playerId, newTeamId }, resolve);
  });
}

export function emitKickPlayer(
  roomCode: string,
  hostId: string,
  targetPlayerId: string
): Promise<{ error?: string }> {
  return new Promise(resolve => {
    getSocket().emit('room:kick-player', { roomCode, hostId, targetPlayerId }, resolve);
  });
}

// ──────────────────────────────────────────────
// Game actions
// ──────────────────────────────────────────────

export function emitStartGame(roomCode: string, hostId: string): Promise<{ error?: string }> {
  return new Promise(resolve => {
    getSocket().emit('game:start', { roomCode, hostId }, resolve);
  });
}

export function emitMakeMove(
  roomCode: string,
  playerId: string,
  card: Card,
  cellId: string
): Promise<{ error?: string }> {
  return new Promise(resolve => {
    getSocket().emit('game:move', { roomCode, playerId, card, cellId }, resolve);
  });
}

export function emitReplaceDeadCard(
  roomCode: string,
  playerId: string,
  card: Card
): Promise<{ error?: string }> {
  return new Promise(resolve => {
    getSocket().emit('game:dead-card-replace', { roomCode, playerId, card }, resolve);
  });
}

export function emitRestartGame(roomCode: string, hostId: string): Promise<{ error?: string }> {
  return new Promise(resolve => {
    getSocket().emit('game:restart', { roomCode, hostId }, resolve);
  });
}

export function emitEndGame(roomCode: string, hostId: string): Promise<{ error?: string }> {
  return new Promise(resolve => {
    getSocket().emit('game:end', { roomCode, hostId }, resolve);
  });
}

// ──────────────────────────────────────────────
// Chat
// ──────────────────────────────────────────────

export function emitChatMessage(
  roomCode: string,
  playerId: string,
  playerName: string,
  message: string
): void {
  getSocket().emit('game:chat-message', {
    roomCode,
    playerId,
    playerName,
    message,
    timestamp: Date.now(),
  });
}
