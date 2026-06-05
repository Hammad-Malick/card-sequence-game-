import type { RoomSettings } from './room-settings.type';

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  cardsPerHand: null,
  turnTimerSeconds: 0,
};

export const ALLOWED_CARDS_PER_HAND = [5, 6, 7] as const;

export const ALLOWED_TURN_TIMER_SECONDS = [0, 30, 45, 60, 90, 120] as const;

export const TURN_TIMER_SKIP_REASON = 'Turn timed out.';
