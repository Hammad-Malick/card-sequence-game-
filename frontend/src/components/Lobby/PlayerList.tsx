import clsx from 'clsx';
import type { PublicPlayer, Team } from '../../game/types';
import { Button } from '../UI/Button';

interface PlayerListProps {
  players: PublicPlayer[];
  teams: Team[];
  myPlayerId: string;
  hostId: string;
  isHost: boolean;
  onKick: (playerId: string) => void;
}

export function PlayerList({ players, teams, myPlayerId, hostId, isHost, onKick }: PlayerListProps) {
  return (
    <div className="flex flex-col gap-2">
      {players.map(player => {
        const team = teams.find(t => t.id === player.teamId);
        const isMe = player.id === myPlayerId;
        const isPlayerHost = player.id === hostId;

        return (
          <div
            key={player.id}
            className={clsx(
              'flex items-center gap-3 p-3 rounded-xl border transition-all',
              isMe
                ? 'border-emerald-500/50 bg-emerald-900/20'
                : 'border-slate-700/50 bg-slate-800/40',
              !player.connected && 'opacity-60'
            )}
          >
            {/* Connection indicator */}
            <div
              className={clsx(
                'w-2.5 h-2.5 rounded-full shrink-0',
                player.connected ? 'bg-emerald-400 shadow-emerald-400/50 shadow-sm' : 'bg-slate-600'
              )}
            />

            {/* Team color dot */}
            {team && (
              <div
                className="w-4 h-4 rounded-full shrink-0 border border-white/20"
                style={{ backgroundColor: team.color }}
              />
            )}

            {/* Name */}
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-sm text-slate-100 truncate block">
                {player.name}
                {isMe && <span className="text-emerald-400 text-xs ml-1">(You)</span>}
                {isPlayerHost && <span className="text-yellow-400 text-xs ml-1">👑 Host</span>}
              </span>
              {team && (
                <span className="text-xs text-slate-400" style={{ color: team.color }}>
                  {team.name} Team
                </span>
              )}
            </div>

            {/* Disconnected badge */}
            {!player.connected && (
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                Offline
              </span>
            )}

            {/* Kick button (host only, not self) */}
            {isHost && !isMe && (
              <Button
                variant="danger"
                size="sm"
                className="text-xs px-2 py-1"
                onClick={() => onKick(player.id)}
              >
                Kick
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
