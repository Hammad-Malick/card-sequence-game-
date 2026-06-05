import type { RoomSettings } from '../game/types';

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  cardsPerHand: null,
  turnTimerSeconds: 0,
};

export const CARDS_PER_HAND_OPTIONS: Array<{ value: number | null; label: string }> = [
  { value: null, label: 'Default (by player count)' },
  { value: 5, label: '5 cards' },
  { value: 6, label: '6 cards' },
  { value: 7, label: '7 cards' },
];

export const TURN_TIMER_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 0, label: 'No timer' },
  { value: 30, label: '30 seconds' },
  { value: 45, label: '45 seconds' },
  { value: 60, label: '60 seconds' },
  { value: 90, label: '90 seconds' },
  { value: 120, label: '2 minutes' },
];
