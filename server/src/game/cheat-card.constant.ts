export const DEV_CHEAT_SOCKET_EVENT = 'dev:cheat-card';

export const CHEAT_CARD_ERRORS = {
  NOT_DEV: 'Cheats are disabled in production.',
  ROOM_NOT_FOUND: 'Room not found.',
  PLAYER_NOT_FOUND: 'Player not found.',
  CARD_NOT_FOUND: 'Card not found in your hand.',
  ALREADY_JACK: 'That card is already a Jack.',
  NO_TARGETS: 'No eligible cards to upgrade (Jacks are skipped).',
  INVALID_TARGET: 'Provide a hand index, card code, or use all: true.',
} as const;
