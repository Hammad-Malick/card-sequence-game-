export interface RoomSettings {
  /** null = official Sequence default based on player count */
  cardsPerHand: number | null;
  /** 0 = timer disabled */
  turnTimerSeconds: number;
}
