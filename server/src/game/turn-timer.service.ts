import type { GameState } from './game.types';
import type { Player } from '../rooms/room.types';
import type { RoomSettings } from '../rooms/room-settings.type';
import { advanceToNextActiveTurn } from './turn-advance.util';

export function startTurnClock(state: GameState): GameState {
  return {
    ...state,
    turnStartedAt: Date.now(),
  };
}

export function isTurnExpired(
  state: GameState,
  settings: RoomSettings
): boolean {
  if (settings.turnTimerSeconds <= 0 || state.status !== 'playing') {
    return false;
  }

  if (state.turnStartedAt === null) {
    return false;
  }

  const elapsedMs = Date.now() - state.turnStartedAt;
  return elapsedMs >= settings.turnTimerSeconds * 1000;
}

export function skipExpiredTurn(
  state: GameState,
  players: Player[]
): GameState {
  const turnAdvance = advanceToNextActiveTurn(state, players);
  return startTurnClock({
    ...state,
    ...turnAdvance,
  });
}
