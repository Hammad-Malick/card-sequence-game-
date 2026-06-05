import { getHandSize } from '../game/deck';
import type { RoomSettings } from './room-settings.type';
import {
  ALLOWED_CARDS_PER_HAND,
  ALLOWED_TURN_TIMER_SECONDS,
  DEFAULT_ROOM_SETTINGS,
} from './room-settings.constant';

export function resolveCardsPerHand(
  settings: RoomSettings,
  playerCount: number
): number {
  if (settings.cardsPerHand !== null) {
    return settings.cardsPerHand;
  }
  return getHandSize(playerCount);
}

export function normalizeRoomSettings(
  partial?: Partial<RoomSettings>
): RoomSettings {
  const cardsPerHand = partial?.cardsPerHand ?? DEFAULT_ROOM_SETTINGS.cardsPerHand;
  const turnTimerSeconds = partial?.turnTimerSeconds ?? DEFAULT_ROOM_SETTINGS.turnTimerSeconds;

  const validHandSize =
    cardsPerHand === null ||
    ALLOWED_CARDS_PER_HAND.includes(cardsPerHand as (typeof ALLOWED_CARDS_PER_HAND)[number]);

  const validTimer =
    ALLOWED_TURN_TIMER_SECONDS.includes(
      turnTimerSeconds as (typeof ALLOWED_TURN_TIMER_SECONDS)[number]
    );

  return {
    cardsPerHand: validHandSize ? cardsPerHand : DEFAULT_ROOM_SETTINGS.cardsPerHand,
    turnTimerSeconds: validTimer ? turnTimerSeconds : DEFAULT_ROOM_SETTINGS.turnTimerSeconds,
  };
}
