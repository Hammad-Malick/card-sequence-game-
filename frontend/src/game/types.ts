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

export interface RoomSettings {
  cardsPerHand: number | null;
  turnTimerSeconds: number;
}

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

export type GameMode = '2players' | '2teams' | '3teams';

export interface PublicPlayer {
  id: string;
  name: string;
  teamId: string;
  isHost: boolean;
  connected: boolean;
  handSize: number;
  hand: Card[];
}

export interface RoomData {
  code: string;
  hostId: string;
  gameMode: GameMode;
  settings: RoomSettings;
  gameState: GameState;
  players: PublicPlayer[];
  createdAt: number;
}

export interface MyPlayer {
  id: string;
  name: string;
  teamId: string;
  isHost: boolean;
  hand: Card[];
  reconnectToken: string;
}

export interface ServerRoomView {
  room: RoomData;
  myPlayer: MyPlayer;
}

export interface ChatMessage {
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}

export interface LocalSession {
  playerId: string;
  playerName: string;
  roomCode: string;
  teamId: string;
  isHost: boolean;
  reconnectToken: string;
  lastKnownGameState: GameState | null;
  recentChatMessages: ChatMessage[];
  soundEnabled: boolean;
}
