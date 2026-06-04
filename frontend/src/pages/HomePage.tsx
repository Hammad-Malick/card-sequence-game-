import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameLayout, PageContainer, Card } from '../components/Layout/GameLayout';
import { Button } from '../components/UI/Button';
import { useSocketStore } from '../store/socketStore';
import { useGameStore } from '../store/gameStore';
import { hasActiveSession, clearSession, loadSession } from '../services/localStorage.service';
import { emitReconnect } from '../services/socket.service';
import toast from 'react-hot-toast';

export function HomePage() {
  const navigate = useNavigate();
  const { initializeSocket, isConnected } = useSocketStore();
  const { setRoomView, clearGame } = useGameStore();
  const [hasSession, setHasSession] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<{ playerName: string; roomCode: string } | null>(null);
  const [isResuming, setIsResuming] = useState(false);

  useEffect(() => {
    initializeSocket();
    const session = loadSession();
    if (session && hasActiveSession()) {
      setHasSession(true);
      setSessionInfo({ playerName: session.playerName, roomCode: session.roomCode });
    }
  }, [initializeSocket]);

  const handleResumeGame = async () => {
    const session = loadSession();
    if (!session) return;

    setIsResuming(true);
    try {
      const res = await emitReconnect(session.roomCode, session.playerId, session.reconnectToken);
      if (res.error === 'room-expired' || res.error === 'invalid-session') {
        toast.error(
          'Your room no longer exists. The server may have restarted or the room expired.',
          { duration: 5000 }
        );
        clearSession();
        clearGame();
        setHasSession(false);
        setSessionInfo(null);
      } else if (res.error) {
        toast.error(res.error);
      } else if (res.room && res.myPlayer) {
        setRoomView(res.room, res.myPlayer);
        if (res.room.gameState.status === 'playing') {
          navigate('/game');
        } else {
          navigate('/lobby');
        }
      }
    } finally {
      setIsResuming(false);
    }
  };

  const handleClearSession = () => {
    clearSession();
    clearGame();
    setHasSession(false);
    setSessionInfo(null);
    toast.success('Session cleared');
  };

  return (
    <GameLayout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-4">
        <PageContainer narrow className="py-0">
          <div className="text-center mb-10 animate-fade-in">
            <div className="text-7xl mb-4">🃏</div>
            <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">
              {import.meta.env.VITE_APP_NAME ?? 'Sequence'}
            </h1>
            <p className="text-slate-400 text-lg">
              Real-time multiplayer board game
            </p>

            {/* Connection status */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
                }`}
              />
              <span className="text-sm text-slate-400">
                {isConnected ? 'Connected to server' : 'Connecting to server...'}
              </span>
            </div>
          </div>

          <Card className="p-6 animate-slide-up">
            <div className="flex flex-col gap-3">
              {hasSession && sessionInfo && (
                <div className="bg-emerald-900/30 border border-emerald-600/40 rounded-xl p-4 mb-2">
                  <p className="text-emerald-300 text-sm font-semibold mb-1">
                    📌 Active Session Found
                  </p>
                  <p className="text-slate-400 text-sm">
                    <span className="text-slate-200">{sessionInfo.playerName}</span> — Room{' '}
                    <span className="font-mono text-emerald-300">{sessionInfo.roomCode}</span>
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="primary"
                      size="sm"
                      loading={isResuming}
                      onClick={handleResumeGame}
                      disabled={!isConnected}
                    >
                      Resume Game
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearSession}
                    >
                      Clear Session
                    </Button>
                  </div>
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={!isConnected}
                onClick={() => navigate('/create-room')}
              >
                🎮 Create Room
              </Button>

              <Button
                variant="secondary"
                size="lg"
                fullWidth
                disabled={!isConnected}
                onClick={() => navigate('/join-room')}
              >
                🚪 Join Room
              </Button>

              {!isConnected && (
                <p className="text-center text-sm text-red-400 mt-2">
                  ⚠️ Unable to reach the game server. Please check your connection.
                </p>
              )}
            </div>
          </Card>

          <div className="mt-8 text-center text-slate-600 text-xs">
            <p>2–6 players · Real-time · No account needed</p>
          </div>
        </PageContainer>
      </div>
    </GameLayout>
  );
}
