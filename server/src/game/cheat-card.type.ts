export type CheatCardMode = 'wild' | 'remove';

export interface CheatCardPayload {
  roomCode: string;
  playerId: string;
  mode: CheatCardMode;
  cardCode?: string;
  handIndex?: number;
  all?: boolean;
}
