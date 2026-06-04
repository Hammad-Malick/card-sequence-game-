const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRoomCode(length = 6): string {
  return Array.from({ length }, () =>
    CHARSET[Math.floor(Math.random() * CHARSET.length)]
  ).join('');
}
