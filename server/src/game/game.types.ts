export type CardSuit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type CardRank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: CardSuit;
  rank: CardRank;
  code: string;
  isOneEyedJack: boolean;
  isTwoEyedJack: boolean;
}

export interface BoardCell {
  id: string;
  row: number;
  col: number;
  cardCode: string | null;
  isCorner: boolean;
  occupiedByTeamId: string | null;
  occupiedByPlayerId: string | null;
  isSequenceCell: boolean;
  sequenceId: string | null;
}

export interface Move {
  playerId: string;
  card: Card;
  action: 'place' | 'remove' | 'replace-dead-card';
  cellId: string | null;
  timestamp: number;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  sequenceCount: number;
  playerIds: string[];
}

export type GameStatus = 'waiting' | 'playing' | 'finished';

export interface GameState {
  status: GameStatus;
  board: BoardCell[][];
  deck: Card[];
  discardPile: Card[];
  currentTurnPlayerId: string;
  currentTurnIndex: number;
  teams: Team[];
  winner: string | null;
  winnerTeamId: string | null;
  moveHistory: Move[];
  turnOrder: string[];
  turnStartedAt: number | null;
}

export interface MakeMovePayload {
  roomCode: string;
  playerId: string;
  card: Card;
  cellId: string;
}

export interface ReplaceDeadCardPayload {
  roomCode: string;
  playerId: string;
  card: Card;
}
