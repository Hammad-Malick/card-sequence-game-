export function getTurnSecondsRemaining(
  turnStartedAt: number | null,
  turnTimerSeconds: number,
  nowMs: number = Date.now()
): number | null {
  if (turnTimerSeconds <= 0 || turnStartedAt === null) {
    return null;
  }

  const elapsedSeconds = Math.floor((nowMs - turnStartedAt) / 1000);
  const remaining = turnTimerSeconds - elapsedSeconds;
  return Math.max(remaining, 0);
}

export function formatTurnTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  return `${secs}s`;
}
