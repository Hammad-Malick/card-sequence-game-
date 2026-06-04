import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameLayout, PageContainer, Card } from '../components/Layout/GameLayout';
import { Button } from '../components/UI/Button';
import { useGameStore } from '../store/gameStore';
import { emitJoinRoom } from '../services/socket.service';
import { saveSession } from '../services/localStorage.service';
import toast from 'react-hot-toast';

export function JoinRoomPage() {
  const navigate = useNavigate();
  const { setRoomView } = useGameStore();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const name = playerName.trim();
    const code = roomCode.trim().toUpperCase();

    if (!name) return toast.error('Please enter your player name.');
    if (name.length > 20) return toast.error('Name must be 20 characters or less.');
    if (!code) return toast.error('Please enter a room code.');
    if (code.length !== 6) return toast.error('Room code must be 6 characters.');

    setIsLoading(true);
    try {
      const res = await emitJoinRoom(name, code);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      if (!res.room || !res.myPlayer) {
        toast.error('Failed to join room. Please try again.');
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

      toast.success(`Joined room ${res.room.code}!`);
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

          <h1 className="text-3xl font-bold text-white mb-6 text-center">Join Room</h1>

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
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Room Code
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character code..."
                  maxLength={6}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-mono text-xl tracking-widest text-center uppercase"
                />
              </div>

              <Button type="submit" variant="primary" size="lg" fullWidth loading={isLoading}>
                Join Room
              </Button>
            </form>
          </Card>
        </PageContainer>
      </div>
    </GameLayout>
  );
}
