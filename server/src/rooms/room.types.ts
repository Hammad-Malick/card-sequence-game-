import type { GameState } from '../game/game.types';

export type GameMode = '2players' | '2teams' | '3teams';

export interface Player {
  id: string;
  name: string;
  roomCode: string;
  teamId: string;
  isHost: boolean;
  hand: import('../game/game.types').Card[];
  connected: boolean;
  reconnectToken: string;
  socketId: string;
  disconnectedAt: number | null;
}

export interface Room {
  code: string;
  hostId: string;
  players: Player[];
  gameState: GameState;
  gameMode: GameMode;
  createdAt: number;
  updatedAt: number;
}

export interface CreateRoomPayload {
  playerName: string;
  gameMode: GameMode;
}

export interface JoinRoomPayload {
  playerName: string;
  roomCode: string;
}

export interface ReconnectPayload {
  roomCode: string;
  playerId: string;
  reconnectToken: string;
}

export interface KickPlayerPayload {
  roomCode: string;
  hostId: string;
  targetPlayerId: string;
}

export interface ChangeTeamPayload {
  roomCode: string;
  playerId: string;
  newTeamId: string;
}

export interface ChatMessagePayload {
  roomCode: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}
