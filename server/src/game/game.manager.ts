import type { GameState, Team } from './game.types';
import type { Player, GameMode } from '../rooms/room.types';
import { createBoard } from './board';
import { createDeck, shuffleDeck, dealCards, getHandSize } from './deck';
import {
  validateMove,
  isDeadCard,
  checkWinner,
  getNextTurnIndex,
  buildMove,
} from './rules';
import {
  checkAllSequences,
  applySequencesToBoard,
  countSequencesPerTeam,
} from './sequence-checker';
import { buildAlternatingTurnOrder } from './turn-order.util';

const TEAM_CONFIGS: Record<GameMode, Array<{ id: string; name: string; color: string }>> = {
  '2players': [
    { id: 'team-blue', name: 'Blue', color: '#3B82F6' },
    { id: 'team-green', name: 'Green', color: '#22C55E' },
  ],
  '2teams': [
    { id: 'team-blue', name: 'Blue', color: '#3B82F6' },
    { id: 'team-green', name: 'Green', color: '#22C55E' },
  ],
  '3teams': [
    { id: 'team-blue', name: 'Blue', color: '#3B82F6' },
    { id: 'team-green', name: 'Green', color: '#22C55E' },
    { id: 'team-red', name: 'Red', color: '#EF4444' },
  ],
};

export function createInitialGameState(gameMode: GameMode): GameState {
  const teamDefs = TEAM_CONFIGS[gameMode];
  const teams: Team[] = teamDefs.map(t => ({
    ...t,
    sequenceCount: 0,
    playerIds: [],
  }));

  return {
    status: 'waiting',
    board: createBoard(),
    deck: [],
    discardPile: [],
    currentTurnPlayerId: '',
    currentTurnIndex: 0,
    teams,
    winner: null,
    winnerTeamId: null,
    moveHistory: [],
    turnOrder: [],
  };
}

export function assignTeam(state: GameState, playerId: string, gameMode: GameMode): string {
  const teams = state.teams;

  if (gameMode === '2players') {
    // Each player gets their own team in 2-player mode
    const unfilledTeam = teams.find(t => t.playerIds.length === 0);
    return unfilledTeam ? unfilledTeam.id : teams[0].id;
  }

  // For team modes, distribute evenly
  const smallestTeam = teams.reduce((min, t) =>
    t.playerIds.length < min.playerIds.length ? t : min
  );
  return smallestTeam.id;
}

export type StartGameResult =
  | { success: true; state: GameState; updatedPlayers: Player[] }
  | { success: false; reason: string };

export function startGame(
  state: GameState,
  players: Player[]
): StartGameResult {
  const connectedPlayers = players.filter(p => p.connected);
  if (connectedPlayers.length < 2) {
    return { success: false, reason: 'Need at least 2 connected players to start.' };
  }

  const shuffled = shuffleDeck(createDeck());
  const handSize = getHandSize(connectedPlayers.length);
  let deck = shuffled;

  const dealtPlayers = connectedPlayers.map(p => {
    const { hand, remainingDeck } = dealCards(deck, handSize);
    deck = remainingDeck;
    return { ...p, hand };
  });

  const turnOrder = buildAlternatingTurnOrder(dealtPlayers, state.teams);
  const firstPlayer = turnOrder[0] ?? dealtPlayers[0]?.id ?? '';

  const newState: GameState = {
    ...state,
    status: 'playing',
    board: createBoard(),
    deck,
    discardPile: [],
    currentTurnPlayerId: firstPlayer,
    currentTurnIndex: 0,
    winner: null,
    winnerTeamId: null,
    moveHistory: [],
    turnOrder,
  };

  // Merge dealt hands back into the full player list (include disconnected players with empty hands)
  const dealtMap = new Map(dealtPlayers.map(p => [p.id, p]));
  const updatedPlayers: Player[] = players.map(p => dealtMap.get(p.id) ?? { ...p, hand: [] });

  return { success: true, state: newState, updatedPlayers };
}

export type MakeMoveResult =
  | { success: true; state: GameState; updatedPlayers: Player[] }
  | { success: false; reason: string };

export function processMove(
  state: GameState,
  players: Player[],
  playerId: string,
  cardCode: string,
  cellId: string
): MakeMoveResult {
  const player = players.find(p => p.id === playerId);
  if (!player) {
    return { success: false, reason: 'Player not found.' };
  }

  const cardIndex = player.hand.findIndex(c => c.code === cardCode);
  if (cardIndex === -1) {
    return { success: false, reason: 'Card not in player hand.' };
  }

  const card = player.hand[cardIndex];
  const validation = validateMove(state, playerId, card, cellId);
  if (!validation.valid) {
    return { success: false, reason: validation.reason };
  }

  const team = state.teams.find(t => t.playerIds.includes(playerId));
  if (!team) {
    return { success: false, reason: 'Player team not found.' };
  }

  // Apply move to board
  let newBoard = state.board.map(row => row.map(cell => ({ ...cell })));
  const targetCell = newBoard
    .flat()
    .find(c => c.id === cellId);

  if (!targetCell) {
    return { success: false, reason: 'Board cell not found.' };
  }

  const action = card.isOneEyedJack ? 'remove' : 'place';

  if (action === 'place') {
    targetCell.occupiedByTeamId = team.id;
    targetCell.occupiedByPlayerId = playerId;
  } else {
    targetCell.occupiedByTeamId = null;
    targetCell.occupiedByPlayerId = null;
    targetCell.isSequenceCell = false;
    targetCell.sequenceId = null;
  }

  // Detect sequences
  const sequences = checkAllSequences(newBoard);
  newBoard = applySequencesToBoard(newBoard, sequences);
  const sequenceCounts = countSequencesPerTeam(sequences);

  // Update team sequence counts
  const updatedTeams: Team[] = state.teams.map(t => ({
    ...t,
    sequenceCount: sequenceCounts[t.id] ?? 0,
  }));

  // Check winner
  const winnerTeamId = checkWinner(updatedTeams, sequenceCounts);

  // Draw new card for player
  let newDeck = [...state.deck];
  let newDiscardPile = [...state.discardPile, card];
  const newHand = [...player.hand];
  newHand.splice(cardIndex, 1);

  if (newDeck.length === 0 && newDiscardPile.length > 0) {
    // Reshuffle discard pile
    newDeck = shuffleDeck([...newDiscardPile]);
    newDiscardPile = [];
  }

  let drawnCard = null;
  if (newDeck.length > 0) {
    [drawnCard] = newDeck.splice(0, 1);
    newHand.push(drawnCard);
  }

  // Advance turn
  const nextIndex = getNextTurnIndex(state.currentTurnIndex, state.turnOrder);
  const nextPlayerId = state.turnOrder[nextIndex];

  const move = buildMove(playerId, card, action, cellId);

  const newState: GameState = {
    ...state,
    board: newBoard,
    deck: newDeck,
    discardPile: newDiscardPile,
    teams: updatedTeams,
    currentTurnPlayerId: winnerTeamId ? state.currentTurnPlayerId : nextPlayerId,
    currentTurnIndex: winnerTeamId ? state.currentTurnIndex : nextIndex,
    winner: winnerTeamId ? updatedTeams.find(t => t.id === winnerTeamId)?.name ?? null : null,
    winnerTeamId,
    status: winnerTeamId ? 'finished' : 'playing',
    moveHistory: [...state.moveHistory.slice(-49), move],
  };

  const updatedPlayers = players.map(p =>
    p.id === playerId ? { ...p, hand: newHand } : p
  );

  return { success: true, state: newState, updatedPlayers };
}

export type ReplaceDeadCardResult =
  | { success: true; state: GameState; updatedPlayers: Player[] }
  | { success: false; reason: string };

export function processReplaceDeadCard(
  state: GameState,
  players: Player[],
  playerId: string,
  cardCode: string
): ReplaceDeadCardResult {
  if (state.currentTurnPlayerId !== playerId) {
    return { success: false, reason: 'It is not your turn.' };
  }

  const player = players.find(p => p.id === playerId);
  if (!player) {
    return { success: false, reason: 'Player not found.' };
  }

  const cardIndex = player.hand.findIndex(c => c.code === cardCode);
  if (cardIndex === -1) {
    return { success: false, reason: 'Card not in player hand.' };
  }

  const card = player.hand[cardIndex];
  if (!isDeadCard(card, state.board)) {
    return { success: false, reason: 'Card is not dead.' };
  }

  let newDeck = [...state.deck];
  let newDiscardPile = [...state.discardPile, card];

  if (newDeck.length === 0 && newDiscardPile.length > 0) {
    newDeck = shuffleDeck([...newDiscardPile]);
    newDiscardPile = [];
  }

  if (newDeck.length === 0) {
    return { success: false, reason: 'No cards left in deck.' };
  }

  const [drawnCard, ...remainingDeck] = newDeck;
  const newHand = [...player.hand];
  newHand.splice(cardIndex, 1, drawnCard);

  const move = buildMove(playerId, card, 'replace-dead-card', null);

  const newState: GameState = {
    ...state,
    deck: remainingDeck,
    discardPile: newDiscardPile,
    moveHistory: [...state.moveHistory.slice(-49), move],
  };

  const updatedPlayers = players.map(p =>
    p.id === playerId ? { ...p, hand: newHand } : p
  );

  return { success: true, state: newState, updatedPlayers };
}
