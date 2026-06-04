import type { Card, CardRank, CardSuit } from './game.types';

const SUITS: CardSuit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: CardRank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const SUIT_INITIALS: Record<CardSuit, string> = {
  hearts: 'H',
  diamonds: 'D',
  clubs: 'C',
  spades: 'S',
};

const RANK_INITIALS: Record<CardRank, string> = {
  A: 'A', '2': '2', '3': '3', '4': '4', '5': '5',
  '6': '6', '7': '7', '8': '8', '9': '9', '10': 'T',
  J: 'J', Q: 'Q', K: 'K',
};

/**
 * One-eyed Jacks (remove opponent chip): Jack of Hearts, Jack of Spades
 * Two-eyed Jacks (wild/place chip): Jack of Diamonds, Jack of Clubs
 */
function isOneEyedJack(suit: CardSuit, rank: CardRank): boolean {
  return rank === 'J' && (suit === 'hearts' || suit === 'spades');
}

function isTwoEyedJack(suit: CardSuit, rank: CardRank): boolean {
  return rank === 'J' && (suit === 'diamonds' || suit === 'clubs');
}

function createCard(suit: CardSuit, rank: CardRank): Card {
  return {
    suit,
    rank,
    code: `${RANK_INITIALS[rank]}${SUIT_INITIALS[suit]}`,
    isOneEyedJack: isOneEyedJack(suit, rank),
    isTwoEyedJack: isTwoEyedJack(suit, rank),
  };
}

/**
 * Creates two standard 52-card decks for Sequence (104 cards total).
 */
export function createDeck(): Card[] {
  const singleDeck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      singleDeck.push(createCard(suit, rank));
    }
  }
  return [...singleDeck, ...singleDeck.map(c => ({ ...c }))];
}

/**
 * Fisher-Yates shuffle — mutates and returns the array.
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

/**
 * Deals `count` cards from the front of the deck.
 * Returns { hand, remainingDeck }.
 */
export function dealCards(
  deck: Card[],
  count: number
): { hand: Card[]; remainingDeck: Card[] } {
  return {
    hand: deck.slice(0, count),
    remainingDeck: deck.slice(count),
  };
}

/**
 * Returns the initial hand size based on total player count (official Sequence rules).
 */
export function getHandSize(playerCount: number): number {
  if (playerCount === 2) return 7;
  if (playerCount <= 4) return 6;
  return 5;
}
