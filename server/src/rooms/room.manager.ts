import type { Room, Player, GameMode, CreateRoomPayload, JoinRoomPayload, ReconnectPayload } from './room.types';
import { generateRoomCode } from '../utils/generateRoomCode';
import { generateToken, generatePlayerId } from '../utils/generateToken';
import { createInitialGameState, assignTeam, startGame, processMove, processReplaceDeadCard } from '../game/game.manager';
import { upgradePlayerHandCards } from '../game/cheat-card.service';
import type { CheatCardMode } from '../game/cheat-card.type';
import { CHEAT_CARD_ERRORS } from '../game/cheat-card.constant';

/** In-memory room store — cleared on server restart */
const rooms = new Map<string, Room>();

const STALE_ROOM_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours
const DISCONNECT_GRACE_MS = 60_000; // 60 seconds before removing disconnected player

// Periodically clean up stale rooms
setInterval(() => {
  const cutoff = Date.now() - STALE_ROOM_TTL_MS;
  for (const [code, room] of rooms) {
    if (room.updatedAt < cutoff && room.gameState.status === 'finished') {
      rooms.delete(code);
    }
  }
}, 10 * 60 * 1000);

export function createRoom(payload: CreateRoomPayload, socketId: string): Room | null {
  let code = generateRoomCode();
  let attempts = 0;
  while (rooms.has(code) && attempts < 10) {
    code = generateRoomCode();
    attempts++;
  }
  if (rooms.has(code)) return null;

  const gameState = createInitialGameState(payload.gameMode);
  const teamId = assignTeam(gameState, 'host', payload.gameMode);

  // Add host player to team
  const hostTeam = gameState.teams.find(t => t.id === teamId);
  const playerId = generatePlayerId();
  if (hostTeam) hostTeam.playerIds.push(playerId);

  const host: Player = {
    id: playerId,
    name: payload.playerName,
    roomCode: code,
    teamId,
    isHost: true,
    hand: [],
    connected: true,
    reconnectToken: generateToken(),
    socketId,
    disconnectedAt: null,
  };

  const room: Room = {
    code,
    hostId: playerId,
    players: [host],
    gameState,
    gameMode: payload.gameMode,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  rooms.set(code, room);
  return room;
}

export function joinRoom(payload: JoinRoomPayload, socketId: string): { room: Room; player: Player } | { error: string } {
  const room = rooms.get(payload.roomCode.toUpperCase());
  if (!room) return { error: 'Room not found. Please check the room code.' };
  if (room.gameState.status === 'playing') return { error: 'Game already in progress.' };
  if (room.gameState.status === 'finished') return { error: 'Game has ended.' };

  const maxPlayers = room.gameMode === '3teams' ? 6 : 4;
  if (room.players.filter(p => p.connected).length >= maxPlayers) {
    return { error: 'Room is full.' };
  }

  const teamId = assignTeam(room.gameState, 'new', room.gameMode);
  const team = room.gameState.teams.find(t => t.id === teamId);
  const playerId = generatePlayerId();
  if (team) team.playerIds.push(playerId);

  const player: Player = {
    id: playerId,
    name: payload.playerName,
    roomCode: payload.roomCode.toUpperCase(),
    teamId,
    isHost: false,
    hand: [],
    connected: true,
    reconnectToken: generateToken(),
    socketId,
    disconnectedAt: null,
  };

  room.players.push(player);
  room.updatedAt = Date.now();
  return { room, player };
}

export function reconnectPlayer(
  payload: ReconnectPayload,
  socketId: string
): { room: Room; player: Player } | { error: string } {
  const room = rooms.get(payload.roomCode.toUpperCase());
  if (!room) return { error: 'room-expired' };

  const player = room.players.find(
    p => p.id === payload.playerId && p.reconnectToken === payload.reconnectToken
  );
  if (!player) return { error: 'invalid-session' };

  player.connected = true;
  player.socketId = socketId;
  player.disconnectedAt = null;
  room.updatedAt = Date.now();
  return { room, player };
}

export function markPlayerDisconnected(socketId: string): { room: Room; player: Player } | null {
  for (const room of rooms.values()) {
    const player = room.players.find(p => p.socketId === socketId);
    if (player) {
      player.connected = false;
      player.disconnectedAt = Date.now();
      room.updatedAt = Date.now();
      return { room, player };
    }
  }
  return null;
}

export function removeDisconnectedPlayer(roomCode: string, playerId: string): Room | null {
  const room = rooms.get(roomCode);
  if (!room) return null;

  const playerIndex = room.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) return null;

  const player = room.players[playerIndex];

  // Remove from team
  const team = room.gameState.teams.find(t => t.id === player.teamId);
  if (team) {
    team.playerIds = team.playerIds.filter(id => id !== playerId);
  }

  room.players.splice(playerIndex, 1);

  // If host leaves, promote next connected player
  if (room.hostId === playerId && room.players.length > 0) {
    const nextHost = room.players.find(p => p.connected) ?? room.players[0];
    nextHost.isHost = true;
    room.hostId = nextHost.id;
  }

  // Remove empty room
  if (room.players.length === 0) {
    rooms.delete(roomCode);
    return null;
  }

  room.updatedAt = Date.now();
  return room;
}

export function leaveRoom(roomCode: string, playerId: string): Room | null {
  return removeDisconnectedPlayer(roomCode, playerId);
}

export function kickPlayer(
  roomCode: string,
  hostId: string,
  targetPlayerId: string
): { room: Room } | { error: string } {
  const room = rooms.get(roomCode);
  if (!room) return { error: 'Room not found.' };
  if (room.hostId !== hostId) return { error: 'Only the host can kick players.' };
  if (targetPlayerId === hostId) return { error: 'Cannot kick yourself.' };

  const remaining = removeDisconnectedPlayer(roomCode, targetPlayerId);
  if (!remaining && rooms.has(roomCode)) return { error: 'Player not found.' };
  return { room: remaining ?? room };
}

export function startRoomGame(
  roomCode: string,
  hostId: string
): { room: Room } | { error: string } {
  const room = rooms.get(roomCode);
  if (!room) return { error: 'Room not found.' };
  if (room.hostId !== hostId) return { error: 'Only the host can start the game.' };

  const result = startGame(room.gameState, room.players);
  if (!result.success) return { error: result.reason };

  room.gameState = result.state;
  room.players = result.updatedPlayers;
  room.updatedAt = Date.now();
  return { room };
}

export function changePlayerTeam(
  roomCode: string,
  playerId: string,
  newTeamId: string
): { room: Room } | { error: string } {
  const room = rooms.get(roomCode);
  if (!room) return { error: 'Room not found.' };
  if (room.gameState.status !== 'waiting') return { error: 'Cannot change team after game has started.' };

  const player = room.players.find(p => p.id === playerId);
  if (!player) return { error: 'Player not found.' };

  const newTeam = room.gameState.teams.find(t => t.id === newTeamId);
  if (!newTeam) return { error: 'Team not found.' };

  if (player.teamId === newTeamId) return { error: 'You are already on that team.' };

  // In 2-player mode each team can hold only 1 player
  if (room.gameMode === '2players') {
    const occupied = room.players.some(p => p.id !== playerId && p.teamId === newTeamId && p.connected);
    if (occupied) return { error: 'That team is already taken in 2-player mode.' };
  }

  // Remove from old team
  const oldTeam = room.gameState.teams.find(t => t.id === player.teamId);
  if (oldTeam) {
    oldTeam.playerIds = oldTeam.playerIds.filter(id => id !== playerId);
  }

  // Add to new team
  newTeam.playerIds.push(playerId);
  player.teamId = newTeamId;
  room.updatedAt = Date.now();
  return { room };
}

export function makeMove(
  roomCode: string,
  playerId: string,
  cardCode: string,
  cellId: string
): { room: Room } | { error: string } {
  const room = rooms.get(roomCode);
  if (!room) return { error: 'Room not found.' };

  const result = processMove(room.gameState, room.players, playerId, cardCode, cellId);
  if (!result.success) return { error: result.reason };

  room.gameState = result.state;
  room.players = result.updatedPlayers;
  room.updatedAt = Date.now();
  return { room };
}

export function replaceDeadCard(
  roomCode: string,
  playerId: string,
  cardCode: string
): { room: Room } | { error: string } {
  const room = rooms.get(roomCode);
  if (!room) return { error: 'Room not found.' };

  const result = processReplaceDeadCard(room.gameState, room.players, playerId, cardCode);
  if (!result.success) return { error: result.reason };

  room.gameState = result.state;
  room.players = result.updatedPlayers;
  room.updatedAt = Date.now();
  return { room };
}

export function restartRoomGame(
  roomCode: string,
  hostId: string
): { room: Room } | { error: string } {
  const room = rooms.get(roomCode);
  if (!room) return { error: 'Room not found.' };
  if (room.hostId !== hostId) return { error: 'Only the host can restart the game.' };

  const freshState = createInitialGameState(room.gameMode);
  // Preserve team assignments
  freshState.teams = freshState.teams.map(t => ({
    ...t,
    playerIds: room.gameState.teams.find(ot => ot.id === t.id)?.playerIds ?? [],
  }));

  room.gameState = freshState;
  room.players = room.players.map(p => ({ ...p, hand: [] }));
  room.updatedAt = Date.now();
  return { room };
}

export function endRoomGame(
  roomCode: string,
  hostId: string
): { room: Room } | { error: string } {
  const room = rooms.get(roomCode);
  if (!room) return { error: 'Room not found.' };
  if (room.hostId !== hostId) return { error: 'Only the host can end the game.' };

  room.gameState.status = 'finished';
  room.updatedAt = Date.now();
  return { room };
}

export function cheatUpgradeHandCards(
  roomCode: string,
  playerId: string,
  mode: CheatCardMode,
  options: { cardCode?: string; handIndex?: number; all?: boolean }
): { room: Room; upgradedCodes: string[] } | { error: string } {
  const room = rooms.get(roomCode);
  if (!room) {
    return { error: CHEAT_CARD_ERRORS.ROOM_NOT_FOUND };
  }

  const result = upgradePlayerHandCards(room.players, playerId, mode, options);
  if (!result.success) {
    return { error: result.reason };
  }

  room.players = result.players;
  room.updatedAt = Date.now();
  return { room, upgradedCodes: result.upgradedCodes };
}

export function getRoom(roomCode: string): Room | undefined {
  return rooms.get(roomCode.toUpperCase());
}

export function getRoomBySocketId(socketId: string): { room: Room; player: Player } | null {
  for (const room of rooms.values()) {
    const player = room.players.find(p => p.socketId === socketId);
    if (player) return { room, player };
  }
  return null;
}

export function getDisconnectGraceMs(): number {
  return DISCONNECT_GRACE_MS;
}
