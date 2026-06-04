import type { Card, CardRank, CardSuit } from './types';

const SUIT_SYMBOLS: Record<CardSuit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

/** Traditional playing-card colors: red for hearts/diamonds, dark for clubs/spades */
const SUIT_COLORS: Record<CardSuit, string> = {
  hearts: 'text-red-600',
  diamonds: 'text-red-600',
  clubs: 'text-slate-900',
  spades: 'text-slate-900',
};

export function getSuitSymbol(suit: CardSuit): string {
  return SUIT_SYMBOLS[suit];
}

export function getSuitColor(suit: CardSuit): string {
  return SUIT_COLORS[suit];
}

export function getCardDisplayRank(rank: CardRank): string {
  return rank === '10' ? '10' : rank;
}

/** Returns a human-readable card name */
export function getCardLabel(card: Card): string {
  if (card.isTwoEyedJack) return 'Wild Jack ✦';
  if (card.isOneEyedJack) return 'Jack (Remove)';
  return `${card.rank}${SUIT_SYMBOLS[card.suit]}`;
}

/** Checks if a card is dead on the current board */
export function isDeadCard(card: Card, board: import('./types').BoardCell[][]): boolean {
  if (card.isOneEyedJack || card.isTwoEyedJack) return false;
  const cells: import('./types').BoardCell[] = [];
  for (const row of board) {
    for (const cell of row) {
      if (cell.cardCode === card.code) cells.push(cell);
    }
  }
  return cells.length > 0 && cells.every(c => c.occupiedByTeamId !== null && !c.isCorner);
}
