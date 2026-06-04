/**
 * Maps our internal card codes to Deck of Cards API image URLs.
 *
 * Our codes  : AS, 2S, TS (10 of Spades), JS, QS, KS …
 * API codes  : AS, 2S, 0S          (10 = "0"), JS, QS, KS …
 * Image URL  : https://deckofcardsapi.com/static/img/{CODE}.png
 *
 * Reference: https://deckofcardsapi.com/
 */

const API_BASE = 'https://deckofcardsapi.com/static/img';

/** Converts our internal rank initial to the API rank character */
function toApiRank(rankInitial: string): string {
  return rankInitial === 'T' ? '0' : rankInitial;
}

/**
 * Returns the full PNG image URL for a card given its internal code.
 * Example: 'TS' → 'https://deckofcardsapi.com/static/img/0S.png'
 */
export function getCardImageUrl(code: string): string {
  const suit = code.slice(-1);
  const rank = code.slice(0, -1);
  return `${API_BASE}/${toApiRank(rank)}${suit}.png`;
}

/** Card back image */
export const CARD_BACK_URL = `${API_BASE}/back.png`;
