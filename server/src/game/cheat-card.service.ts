import type { Card } from './game.types';
import type { Player } from '../rooms/room.types';
import type { CheatCardMode } from './cheat-card.type';
import { CHEAT_CARD_ERRORS } from './cheat-card.constant';

function isJackCard(card: Card): boolean {
  return card.isTwoEyedJack || card.isOneEyedJack;
}

function upgradeCard(card: Card, mode: CheatCardMode): Card {
  if (mode === 'wild') {
    return {
      ...card,
      rank: 'J',
      suit: 'diamonds',
      isTwoEyedJack: true,
      isOneEyedJack: false,
    };
  }

  return {
    ...card,
    rank: 'J',
    suit: 'hearts',
    isOneEyedJack: true,
    isTwoEyedJack: false,
  };
}

function resolveTargetIndexes(hand: Card[], cardCode?: string, handIndex?: number): number[] {
  if (typeof handIndex === 'number') {
    if (handIndex < 0 || handIndex >= hand.length) {
      return [];
    }
    return [handIndex];
  }

  if (cardCode) {
    const index = hand.findIndex(card => card.code === cardCode);
    return index === -1 ? [] : [index];
  }

  return [];
}

export type CheatHandResult =
  | { success: true; players: Player[]; upgradedCodes: string[] }
  | { success: false; reason: string };

export function upgradePlayerHandCards(
  players: Player[],
  playerId: string,
  mode: CheatCardMode,
  options: { cardCode?: string; handIndex?: number; all?: boolean }
): CheatHandResult {
  const player = players.find(entry => entry.id === playerId);
  if (!player) {
    return { success: false, reason: CHEAT_CARD_ERRORS.PLAYER_NOT_FOUND };
  }

  let targetIndexes: number[] = [];

  if (options.all) {
    targetIndexes = player.hand
      .map((card, index) => ({ card, index }))
      .filter(({ card }) => !isJackCard(card))
      .map(({ index }) => index);
  } else {
    targetIndexes = resolveTargetIndexes(player.hand, options.cardCode, options.handIndex);
    if (targetIndexes.length === 0) {
      return { success: false, reason: CHEAT_CARD_ERRORS.INVALID_TARGET };
    }
  }

  if (targetIndexes.length === 0) {
    return { success: false, reason: CHEAT_CARD_ERRORS.NO_TARGETS };
  }

  const upgradedCodes: string[] = [];
  const nextHand = player.hand.map((card, index) => {
    if (!targetIndexes.includes(index)) {
      return card;
    }
    if (isJackCard(card)) {
      return card;
    }
    const upgraded = upgradeCard(card, mode);
    upgradedCodes.push(upgraded.code);
    return upgraded;
  });

  if (upgradedCodes.length === 0) {
    return { success: false, reason: CHEAT_CARD_ERRORS.ALREADY_JACK };
  }

  const nextPlayers = players.map(entry =>
    entry.id === playerId ? { ...entry, hand: nextHand } : entry
  );

  return { success: true, players: nextPlayers, upgradedCodes };
}
