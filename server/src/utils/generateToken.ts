import { randomBytes } from 'crypto';

export function generateToken(byteLength = 24): string {
  return randomBytes(byteLength).toString('hex');
}

export function generatePlayerId(): string {
  return `player-${randomBytes(8).toString('hex')}`;
}
