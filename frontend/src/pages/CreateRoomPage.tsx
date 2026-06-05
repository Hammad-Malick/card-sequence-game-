import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameLayout, PageContainer, Card } from '../components/Layout/GameLayout';
import { Button } from '../components/UI/Button';
import { useGameStore } from '../store/gameStore';
import { emitCreateRoom } from '../services/socket.service';
import { saveSession } from '../services/localStorage.service';
import type { GameMode } from '../game/types';
import {
  CARDS_PER_HAND_OPTIONS,
  TURN_TIMER_OPTIONS,
  DEFAULT_ROOM_SETTINGS,
} from '../constants/room-settings.constant';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const GAME_MODES: { value: GameMode; label: string; description: string; players: string }[] = [
  { value: '2players', label: '2 Players', description: 'Classic 1v1 — each player is their own team', players: '2' },
  { value: '2teams', label: '2 Teams', description: '2 teams, 2–4 players total (2 per team)', players: '2–4' },
  { value: '3teams', label: '3 Teams', description: '3 teams, first to 1 sequence wins', players: '3–6' },
];

export function CreateRoomPage() {
  const navigate = useNavigate();
  const { setRoomView } = useGameStore();
  const [playerName, setPlayerName] = useState('');
  const [gameMode, setGameMode] = useState<GameMode>('2players');
  const [cardsPerHand, setCardsPerHand] = useState<number | null>(DEFAULT_ROOM_SETTINGS.cardsPerHand);
  const [turnTimerSeconds, setTurnTimerSeconds] = useState(DEFAULT_ROOM_SETTINGS.turnTimerSeconds);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const name = playerName.trim();
    if (!name) {
      toast.error('Please enter your player name.');
      return;
    }
    if (name.length > 20) {
      toast.error('Name must be 20 characters or less.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await emitCreateRoom(name, gameMode, {
        cardsPerHand,
        turnTimerSeconds,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      if (!res.room || !res.myPlayer) {
        toast.error('Failed to create room. Please try again.');
        return;
      }

      setRoomView(res.room, res.myPlayer);
      saveSession({
        playerId: res.myPlayer.id,
        playerName: res.myPlayer.name,
        roomCode: res.room.code,
        teamId: res.myPlayer.teamId,
        isHost: res.myPlayer.isHost,
        reconnectToken: res.myPlayer.reconnectToken,
      });

      toast.success(`Room ${res.room.code} created!`);
      navigate('/lobby');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GameLayout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-4">
        <PageContainer narrow className="py-0">
          <button
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-slate-200 text-sm mb-6 flex items-center gap-1 transition-colors"
          >
            ← Back
          </button>

          <h1 className="text-3xl font-bold text-white mb-6 text-center">Create Room</h1>

          <Card className="p-6 animate-slide-up">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  placeholder="Enter your name..."
                  maxLength={20}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Game Mode
                </label>
                <div className="flex flex-col gap-2">
                  {GAME_MODES.map(mode => (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => setGameMode(mode.value)}
                      className={clsx(
                        'flex items-start gap-3 p-4 rounded-xl border text-left transition-all',
                        gameMode === mode.value
                          ? 'border-emerald-500/70 bg-emerald-900/30'
                          : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600'
                      )}
                    >
                      <div
                        className={clsx(
                          'w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 transition-colors',
                          gameMode === mode.value
                            ? 'border-emerald-400 bg-emerald-400'
                            : 'border-slate-600'
                        )}
                      />
                      <div>
                        <div className="font-semibold text-slate-100 text-sm">{mode.label}</div>
                        <div className="text-slate-400 text-xs mt-0.5">{mode.description}</div>
                        <div className="text-slate-500 text-xs mt-1">Players: {mode.players}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Cards per Hand
                </label>
                <select
                  value={cardsPerHand === null ? 'default' : String(cardsPerHand)}
                  onChange={e => {
                    const value = e.target.value;
                    setCardsPerHand(value === 'default' ? null : Number(value));
                  }}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {CARDS_PER_HAND_OPTIONS.map(option => (
                    <option
                      key={option.value === null ? 'default' : option.value}
                      value={option.value === null ? 'default' : String(option.value)}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Turn Timer
                </label>
                <select
                  value={String(turnTimerSeconds)}
                  onChange={e => setTurnTimerSeconds(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {TURN_TIMER_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <Button type="submit" variant="primary" size="lg" fullWidth loading={isLoading}>
                Create Room
              </Button>
            </form>
          </Card>
        </PageContainer>
      </div>
    </GameLayout>
  );
}
