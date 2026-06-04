import type { BoardCell, Card, GameState, Move, Team } from './game.types';
import { getCellsByCardCode, getBoardCell } from './board';

export type MoveValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

/**
 * Validates a player's intended move against the current game state.
 */
export function validateMove(
  state: GameState,
  playerId: string,
  card: Card,
  cellId: string
): MoveValidationResult {
  if (state.status !== 'playing') {
    return { valid: false, reason: 'Game is not in progress.' };
  }

  if (state.currentTurnPlayerId !== playerId) {
    return { valid: false, reason: 'It is not your turn.' };
  }

  const team = state.teams.find(t => t.playerIds.includes(playerId));
  if (!team) {
    return { valid: false, reason: 'Player team not found.' };
  }

  const cell = getBoardCell(state.board, cellId);
  if (!cell) {
    return { valid: false, reason: 'Invalid board cell.' };
  }

  if (card.isTwoEyedJack) {
    return validateTwoEyedJack(cell);
  }

  if (card.isOneEyedJack) {
    return validateOneEyedJack(cell, team.id);
  }

  return validateRegularCardMove(state.board, card, cell, team.id);
}

function validateTwoEyedJack(cell: BoardCell): MoveValidationResult {
  if (cell.isCorner) {
    return { valid: false, reason: 'Cannot place on a corner (already free for all).' };
  }
  if (cell.occupiedByTeamId !== null) {
    return { valid: false, reason: 'That cell is already occupied.' };
  }
  return { valid: true };
}

function validateOneEyedJack(cell: BoardCell, teamId: string): MoveValidationResult {
  if (cell.isCorner) {
    return { valid: false, reason: 'Cannot remove a corner cell chip.' };
  }
  if (cell.occupiedByTeamId === null) {
    return { valid: false, reason: 'Cannot remove from an empty cell.' };
  }
  if (cell.occupiedByTeamId === teamId) {
    return { valid: false, reason: 'Cannot remove your own chip.' };
  }
  if (cell.isSequenceCell) {
    return { valid: false, reason: 'Cannot remove a chip that is part of a completed sequence.' };
  }
  return { valid: true };
}

function validateRegularCardMove(
  board: BoardCell[][],
  card: Card,
  cell: BoardCell,
  teamId: string
): MoveValidationResult {
  if (cell.isCorner) {
    return { valid: false, reason: 'Cannot place on a corner cell.' };
  }

  const matchingCells = getCellsByCardCode(board, card.code);
  if (matchingCells.length === 0) {
    return { valid: false, reason: 'Card has no matching board positions.' };
  }

  const isValidPosition = matchingCells.some(c => c.id === cell.id);
  if (!isValidPosition) {
    return { valid: false, reason: 'This card does not match that board position.' };
  }

  if (cell.occupiedByTeamId !== null) {
    return { valid: false, reason: 'That cell is already occupied.' };
  }

  return { valid: true };
}

/**
 * Checks whether a card is dead (all matching board positions are occupied).
 */
export function isDeadCard(card: Card, board: BoardCell[][]): boolean {
  if (card.isOneEyedJack || card.isTwoEyedJack) return false;
  const cells = getCellsByCardCode(board, card.code);
  return cells.length > 0 && cells.every(c => c.occupiedByTeamId !== null && !c.isCorner);
}

/**
 * Returns which cards in a hand are dead.
 */
export function getDeadCards(hand: Card[], board: BoardCell[][]): Card[] {
  return hand.filter(card => isDeadCard(card, board));
}

/**
 * Determines winning condition:
 * - 2 players / 2 teams: first to 2 sequences wins
 * - 3 teams: first to 1 sequence wins
 */
export function checkWinner(
  teams: Team[],
  sequenceCounts: Record<string, number>
): string | null {
  const requiredSequences = teams.length >= 3 ? 1 : 2;
  for (const team of teams) {
    const count = sequenceCounts[team.id] ?? 0;
    if (count >= requiredSequences) {
      return team.id;
    }
  }
  return null;
}

/**
 * Returns the next turn index, cycling through connected players.
 */
export function getNextTurnIndex(
  currentIndex: number,
  turnOrder: string[]
): number {
  return (currentIndex + 1) % turnOrder.length;
}

/**
 * Builds a move record.
 */
export function buildMove(
  playerId: string,
  card: Card,
  action: Move['action'],
  cellId: string | null
): Move {
  return { playerId, card, action, cellId, timestamp: Date.now() };
}
