import type { GameState } from './game.types';
import type { Player } from '../rooms/room.types';

export interface TurnAdvanceResult {
  currentTurnPlayerId: string;
  currentTurnIndex: number;
  turnOrder: string[];
}

function getConnectedPlayerIds(players: Player[]): Set<string> {
  const ids = new Set<string>();
  for (const player of players) {
    if (player.connected) {
      ids.add(player.id);
    }
  }
  return ids;
}

export function getNextActiveTurnIndex(
  currentIndex: number,
  turnOrder: string[],
  activePlayerIds: Set<string>
): number | null {
  if (turnOrder.length === 0) {
    return null;
  }

  for (let step = 1; step <= turnOrder.length; step++) {
    const candidate = (currentIndex + step) % turnOrder.length;
    if (activePlayerIds.has(turnOrder[candidate])) {
      return candidate;
    }
  }

  return null;
}

export function advanceToNextActiveTurn(
  state: GameState,
  players: Player[]
): TurnAdvanceResult {
  const activePlayerIds = getConnectedPlayerIds(players);
  const nextIndex = getNextActiveTurnIndex(
    state.currentTurnIndex,
    state.turnOrder,
    activePlayerIds
  );

  if (nextIndex === null) {
    return {
      currentTurnPlayerId: state.currentTurnPlayerId,
      currentTurnIndex: state.currentTurnIndex,
      turnOrder: state.turnOrder,
    };
  }

  return {
    currentTurnPlayerId: state.turnOrder[nextIndex],
    currentTurnIndex: nextIndex,
    turnOrder: state.turnOrder,
  };
}

export function ensureCurrentTurnIsActive(
  state: GameState,
  players: Player[]
): TurnAdvanceResult {
  const currentPlayer = players.find(p => p.id === state.currentTurnPlayerId);
  if (currentPlayer?.connected) {
    return {
      currentTurnPlayerId: state.currentTurnPlayerId,
      currentTurnIndex: state.currentTurnIndex,
      turnOrder: state.turnOrder,
    };
  }

  return advanceToNextActiveTurn(state, players);
}

export function removePlayerFromTurnOrder(
  turnOrder: string[],
  playerId: string
): string[] {
  return turnOrder.filter(id => id !== playerId);
}

export function applyPlayerRemovalToTurnState(
  state: GameState,
  removedPlayerId: string,
  players: Player[]
): TurnAdvanceResult {
  const filteredOrder = removePlayerFromTurnOrder(state.turnOrder, removedPlayerId);
  const wasCurrentTurn = state.currentTurnPlayerId === removedPlayerId;

  if (wasCurrentTurn) {
    const removedIndex = state.turnOrder.indexOf(removedPlayerId);
    return advanceToNextActiveTurn(
      {
        ...state,
        turnOrder: filteredOrder,
        currentTurnIndex: removedIndex >= 0 ? removedIndex : state.currentTurnIndex,
      },
      players
    );
  }

  let currentIndex = state.currentTurnIndex;

  const removedIndex = state.turnOrder.indexOf(removedPlayerId);
  if (removedIndex !== -1 && removedIndex < currentIndex) {
    currentIndex = Math.max(0, currentIndex - 1);
  }

  const adjustedState: GameState = {
    ...state,
    turnOrder: filteredOrder,
    currentTurnIndex: Math.min(currentIndex, Math.max(filteredOrder.length - 1, 0)),
  };

  return {
    currentTurnPlayerId: adjustedState.currentTurnPlayerId,
    currentTurnIndex: adjustedState.currentTurnIndex,
    turnOrder: filteredOrder,
  };
}
