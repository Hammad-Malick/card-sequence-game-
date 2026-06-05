import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { getTurnSecondsRemaining, formatTurnTimer } from '../../utils/turn-timer.util';

interface TurnTimerProps {
  turnStartedAt: number | null;
  turnTimerSeconds: number;
  isMyTurn: boolean;
}

export function TurnTimer({ turnStartedAt, turnTimerSeconds, isMyTurn }: TurnTimerProps) {
  const [remaining, setRemaining] = useState<number | null>(
    getTurnSecondsRemaining(turnStartedAt, turnTimerSeconds)
  );

  useEffect(() => {
    const update = () => {
      setRemaining(getTurnSecondsRemaining(turnStartedAt, turnTimerSeconds));
    };

    update();
    const interval = setInterval(update, 250);
    return () => clearInterval(interval);
  }, [turnStartedAt, turnTimerSeconds]);

  if (remaining === null) {
    return null;
  }

  const isUrgent = remaining <= 10;

  return (
    <div
      className={clsx(
        'flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded-full border shrink-0',
        isMyTurn && isUrgent
          ? 'border-red-500/60 bg-red-950/50 text-red-300 animate-pulse'
          : isMyTurn
          ? 'border-yellow-500/50 bg-yellow-950/40 text-yellow-300'
          : 'border-slate-700 bg-slate-800/60 text-slate-400'
      )}
      title="Turn timer"
    >
      <span>⏱</span>
      <span>{formatTurnTimer(remaining)}</span>
    </div>
  );
}
