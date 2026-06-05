import type { RoomSettings } from '../game/types';
import { CARDS_PER_HAND_OPTIONS, TURN_TIMER_OPTIONS } from '../constants/room-settings.constant';

export function getCardsPerHandLabel(cardsPerHand: number | null): string {
  const option = CARDS_PER_HAND_OPTIONS.find(entry => entry.value === cardsPerHand);
  return option?.label ?? `${cardsPerHand ?? 6} cards`;
}

export function getTurnTimerLabel(turnTimerSeconds: number): string {
  const option = TURN_TIMER_OPTIONS.find(entry => entry.value === turnTimerSeconds);
  return option?.label ?? `${turnTimerSeconds}s`;
}

export function formatRoomSettingsSummary(settings: RoomSettings): string {
  return `${getCardsPerHandLabel(settings.cardsPerHand)} · ${getTurnTimerLabel(settings.turnTimerSeconds)}`;
}
