import { emitReconnect } from './socket.service';
import { hasActiveSession, loadSession, clearSession } from './localStorage.service';
import { useGameStore } from '../store/gameStore';
import type { RoomData, MyPlayer } from '../game/types';

export type ReconnectResult =
  | { success: true; route: '/game' | '/lobby' }
  | { success: false; reason: 'no-session' | 'room-expired' | 'invalid-session' | 'error'; message?: string };

let reconnectInFlight = false;
let lastReconnectAt = 0;
const RECONNECT_DEBOUNCE_MS = 2000;

export async function attemptAutoReconnect(): Promise<ReconnectResult> {
  if (reconnectInFlight) {
    return { success: false, reason: 'error', message: 'Reconnect already in progress.' };
  }

  if (Date.now() - lastReconnectAt < RECONNECT_DEBOUNCE_MS) {
    const { room, myPlayer } = useGameStore.getState();
    if (room && myPlayer) {
      const route = room.gameState.status === 'playing' ? '/game' : '/lobby';
      return { success: true, route };
    }
    return { success: false, reason: 'error', message: 'Reconnect debounced.' };
  }

  if (!hasActiveSession()) {
    return { success: false, reason: 'no-session' };
  }

  const session = loadSession();
  if (!session) {
    return { success: false, reason: 'no-session' };
  }

  const { room, myPlayer } = useGameStore.getState();
  if (room && myPlayer && myPlayer.id === session.playerId) {
    const route = room.gameState.status === 'playing' ? '/game' : '/lobby';
    return { success: true, route };
  }

  reconnectInFlight = true;
  try {
    const res = await emitReconnect(session.roomCode, session.playerId, session.reconnectToken);

    if (res.error === 'room-expired' || res.error === 'invalid-session') {
      clearSession();
      useGameStore.getState().clearGame();
      return { success: false, reason: res.error };
    }

    if (res.error) {
      return { success: false, reason: 'error', message: res.error };
    }

    if (!res.room || !res.myPlayer) {
      return { success: false, reason: 'error', message: 'Invalid reconnect response.' };
    }

    useGameStore.getState().setRoomView(res.room as RoomData, res.myPlayer as MyPlayer);
    lastReconnectAt = Date.now();
    const route = res.room.gameState.status === 'playing' ? '/game' : '/lobby';
    return { success: true, route };
  } finally {
    reconnectInFlight = false;
  }
}
