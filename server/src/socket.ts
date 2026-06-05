import { Server, Socket } from 'socket.io';
import {
  createRoom,
  joinRoom,
  reconnectPlayer,
  markPlayerDisconnected,
  removeDisconnectedPlayer,
  schedulePlayerEviction,
  leaveRoom,
  kickPlayer,
  startRoomGame,
  makeMove,
  replaceDeadCard,
  restartRoomGame,
  endRoomGame,
  changePlayerTeam,
  cheatUpgradeHandCards,
  getDisconnectGraceMs,
  getRoomBySocketId,
  scheduleTurnTimer,
  cancelTurnTimer,
} from './rooms/room.manager';
import type {
  CreateRoomPayload,
  JoinRoomPayload,
  ReconnectPayload,
  KickPlayerPayload,
  ChangeTeamPayload,
  ChatMessagePayload,
} from './rooms/room.types';
import type { MakeMovePayload, ReplaceDeadCardPayload } from './game/game.types';
import type { CheatCardPayload } from './game/cheat-card.type';
import { DEV_CHEAT_SOCKET_EVENT, CHEAT_CARD_ERRORS } from './game/cheat-card.constant';

/** Serializes the game state for a specific player (only sends that player's hand) */
function buildPlayerView(room: ReturnType<typeof createRoom>, playerId: string) {
  if (!room) return null;
  const player = room.players.find(p => p.id === playerId);
  return {
    room: {
      code: room.code,
      hostId: room.hostId,
      gameMode: room.gameMode,
      settings: room.settings,
      gameState: {
        ...room.gameState,
        deck: [], // Never send deck to client
        discardPile: room.gameState.discardPile.slice(-1), // Only top card
      },
      players: room.players.map(p => ({
        id: p.id,
        name: p.name,
        teamId: p.teamId,
        isHost: p.isHost,
        connected: p.connected,
        handSize: p.hand.length,
        // Only send this player's own hand
        hand: p.id === playerId ? p.hand : [],
      })),
      createdAt: room.createdAt,
    },
    myPlayer: player
      ? {
          id: player.id,
          name: player.name,
          teamId: player.teamId,
          isHost: player.isHost,
          hand: player.hand,
          reconnectToken: player.reconnectToken,
        }
      : null,
  };
}

/** Broadcasts the updated room to all players in the room (each gets their own view) */
function broadcastRoomUpdate(io: Server, room: ReturnType<typeof createRoom>) {
  if (!room) return;
  for (const player of room.players) {
    if (player.connected && player.socketId) {
      io.to(player.socketId).emit('room:update', buildPlayerView(room, player.id));
    }
  }

  if (room.gameState.status === 'playing' && room.settings.turnTimerSeconds > 0) {
    scheduleTurnTimer(room.code, updatedRoom => {
      broadcastRoomUpdate(io, updatedRoom);
    });
  } else {
    cancelTurnTimer(room.code);
  }
}

export function registerSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`[socket] connected: ${socket.id}`);

    // ──────────────────────────────────────────────
    // ROOM EVENTS
    // ──────────────────────────────────────────────

    socket.on('room:create', (payload: CreateRoomPayload, ack: (res: unknown) => void) => {
      try {
        if (!payload?.playerName?.trim()) {
          return ack({ error: 'Player name is required.' });
        }
        const room = createRoom(payload, socket.id);
        if (!room) return ack({ error: 'Could not create room. Please try again.' });

        socket.join(room.code);
        const player = room.players[0];
        console.log(`[room] created ${room.code} by ${player.name}`);
        ack({ success: true, ...buildPlayerView(room, player.id) });
      } catch (err) {
        console.error('[room:create]', err);
        ack({ error: 'Internal server error.' });
      }
    });

    socket.on('room:join', (payload: JoinRoomPayload, ack: (res: unknown) => void) => {
      try {
        if (!payload?.playerName?.trim() || !payload?.roomCode?.trim()) {
          return ack({ error: 'Player name and room code are required.' });
        }
        const result = joinRoom({ ...payload, roomCode: payload.roomCode.toUpperCase() }, socket.id);
        if ('error' in result) return ack({ error: result.error });

        socket.join(result.room.code);
        console.log(`[room] ${payload.playerName} joined ${result.room.code}`);

        // Notify all other players
        socket.to(result.room.code).emit('room:player-joined', {
          player: {
            id: result.player.id,
            name: result.player.name,
            teamId: result.player.teamId,
            connected: true,
          },
        });

        broadcastRoomUpdate(io, result.room);
        ack({ success: true, ...buildPlayerView(result.room, result.player.id) });
      } catch (err) {
        console.error('[room:join]', err);
        ack({ error: 'Internal server error.' });
      }
    });

    socket.on('player:reconnect', (payload: ReconnectPayload, ack: (res: unknown) => void) => {
      try {
        if (!payload?.roomCode || !payload?.playerId || !payload?.reconnectToken) {
          return ack({ error: 'invalid-session' });
        }
        const result = reconnectPlayer(payload, socket.id);
        if ('error' in result) return ack({ error: result.error });

        socket.join(result.room.code);
        console.log(`[room] ${result.player.name} reconnected to ${result.room.code}`);

        socket.to(result.room.code).emit('player:connected', {
          playerId: result.player.id,
          playerName: result.player.name,
        });

        broadcastRoomUpdate(io, result.room);
        ack({ success: true, ...buildPlayerView(result.room, result.player.id) });
      } catch (err) {
        console.error('[player:reconnect]', err);
        ack({ error: 'Internal server error.' });
      }
    });

    socket.on('room:leave', (payload: { roomCode: string; playerId: string }, ack: (res: unknown) => void) => {
      try {
        const room = leaveRoom(payload.roomCode, payload.playerId);
        socket.leave(payload.roomCode);
        if (room) {
          socket.to(room.code).emit('player:left', { playerId: payload.playerId });
          broadcastRoomUpdate(io, room);
        }
        ack({ success: true });
      } catch (err) {
        console.error('[room:leave]', err);
        ack({ error: 'Internal server error.' });
      }
    });

    socket.on('room:change-team', (payload: ChangeTeamPayload, ack: (res: unknown) => void) => {
      try {
        if (!payload?.roomCode || !payload?.playerId || !payload?.newTeamId) {
          return ack({ error: 'Invalid payload.' });
        }
        const result = changePlayerTeam(payload.roomCode, payload.playerId, payload.newTeamId);
        if ('error' in result) return ack({ error: result.error });

        broadcastRoomUpdate(io, result.room);
        ack({ success: true });
      } catch (err) {
        console.error('[room:change-team]', err);
        ack({ error: 'Internal server error.' });
      }
    });

    socket.on('room:kick-player', (payload: KickPlayerPayload, ack: (res: unknown) => void) => {
      try {
        const result = kickPlayer(payload.roomCode, payload.hostId, payload.targetPlayerId);
        if ('error' in result) return ack({ error: result.error });

        io.to(payload.roomCode).emit('player:kicked', { playerId: payload.targetPlayerId });
        broadcastRoomUpdate(io, result.room);
        ack({ success: true });
      } catch (err) {
        console.error('[room:kick-player]', err);
        ack({ error: 'Internal server error.' });
      }
    });

    // ──────────────────────────────────────────────
    // GAME EVENTS
    // ──────────────────────────────────────────────

    socket.on('game:start', (payload: { roomCode: string; hostId: string }, ack: (res: unknown) => void) => {
      try {
        const result = startRoomGame(payload.roomCode, payload.hostId);
        if ('error' in result) return ack({ error: result.error });

        console.log(`[game] started in room ${payload.roomCode}`);
        broadcastRoomUpdate(io, result.room);
        ack({ success: true });
      } catch (err) {
        console.error('[game:start]', err);
        ack({ error: 'Internal server error.' });
      }
    });

    socket.on('game:move', (payload: MakeMovePayload, ack: (res: unknown) => void) => {
      try {
        if (!payload?.roomCode || !payload?.playerId || !payload?.card || !payload?.cellId) {
          return ack({ error: 'Invalid move payload.' });
        }
        const result = makeMove(payload.roomCode, payload.playerId, payload.card.code, payload.cellId);
        if ('error' in result) return ack({ error: result.error });

        broadcastRoomUpdate(io, result.room);
        ack({ success: true });
      } catch (err) {
        console.error('[game:move]', err);
        ack({ error: 'Internal server error.' });
      }
    });

    socket.on('game:dead-card-replace', (payload: ReplaceDeadCardPayload, ack: (res: unknown) => void) => {
      try {
        if (!payload?.roomCode || !payload?.playerId || !payload?.card) {
          return ack({ error: 'Invalid replace payload.' });
        }
        const result = replaceDeadCard(payload.roomCode, payload.playerId, payload.card.code);
        if ('error' in result) return ack({ error: result.error });

        broadcastRoomUpdate(io, result.room);
        ack({ success: true });
      } catch (err) {
        console.error('[game:dead-card-replace]', err);
        ack({ error: 'Internal server error.' });
      }
    });

    socket.on('game:restart', (payload: { roomCode: string; hostId: string }, ack: (res: unknown) => void) => {
      try {
        const result = restartRoomGame(payload.roomCode, payload.hostId);
        if ('error' in result) return ack({ error: result.error });

        broadcastRoomUpdate(io, result.room);
        ack({ success: true });
      } catch (err) {
        console.error('[game:restart]', err);
        ack({ error: 'Internal server error.' });
      }
    });

    socket.on('game:end', (payload: { roomCode: string; hostId: string }, ack: (res: unknown) => void) => {
      try {
        const result = endRoomGame(payload.roomCode, payload.hostId);
        if ('error' in result) return ack({ error: result.error });

        broadcastRoomUpdate(io, result.room);
        ack({ success: true });
      } catch (err) {
        console.error('[game:end]', err);
        ack({ error: 'Internal server error.' });
      }
    });

    // ──────────────────────────────────────────────
    // CHAT
    // ──────────────────────────────────────────────

    socket.on(DEV_CHEAT_SOCKET_EVENT, (payload: CheatCardPayload, ack: (res: unknown) => void) => {
      try {
        // if (process.env.NODE_ENV === 'production') {
        //   return ack({ error: CHEAT_CARD_ERRORS.NOT_DEV });
        // }

        if (!payload?.roomCode || !payload?.playerId || !payload?.mode) {
          return ack({ error: CHEAT_CARD_ERRORS.INVALID_TARGET });
        }

        const result = cheatUpgradeHandCards(
          payload.roomCode,
          payload.playerId,
          payload.mode,
          {
            cardCode: payload.cardCode,
            handIndex: payload.handIndex,
            all: payload.all,
          }
        );

        if ('error' in result) {
          return ack({ error: result.error });
        }

        console.log(
          `[dev:cheat] ${payload.mode} upgraded ${result.upgradedCodes.join(', ')} for ${payload.playerId}`
        );
        broadcastRoomUpdate(io, result.room);
        ack({ success: true, upgradedCodes: result.upgradedCodes });
      } catch (err) {
        console.error('[dev:cheat-card]', err);
        ack({ error: 'Internal server error.' });
      }
    });

    socket.on('game:chat-message', (payload: ChatMessagePayload) => {
      try {
        if (!payload?.roomCode || !payload?.message?.trim()) return;
        io.to(payload.roomCode).emit('game:chat-message', {
          playerId: payload.playerId,
          playerName: payload.playerName,
          message: payload.message.slice(0, 300),
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('[game:chat-message]', err);
      }
    });

    // ──────────────────────────────────────────────
    // DISCONNECT
    // ──────────────────────────────────────────────

    socket.on('disconnect', () => {
      console.log(`[socket] disconnected: ${socket.id}`);
      const result = markPlayerDisconnected(socket.id);
      if (!result) return;

      const { room, player } = result;
      socket.to(room.code).emit('player:disconnect', {
        playerId: player.id,
        playerName: player.name,
      });

      broadcastRoomUpdate(io, room);

      schedulePlayerEviction(room.code, player.id, updatedRoom => {
        if (updatedRoom) {
          io.to(updatedRoom.code).emit('player:left', { playerId: player.id });
          broadcastRoomUpdate(io, updatedRoom);
        }
      });
    });
  });
}
