import { useGameStore } from '../../store/gameStore';
import { Button } from '../UI/Button';
import { emitRestartGame, emitLeaveRoom } from '../../services/socket.service';
import { clearSession } from '../../services/localStorage.service';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export function WinnerModal() {
  const { room, myPlayer, clearGame } = useGameStore();
  const navigate = useNavigate();

  if (!room || room.gameState.status !== 'finished') return null;

  const gameState = room.gameState;
  const winnerTeam = gameState.teams.find(t => t.id === gameState.winnerTeamId);
  const isMyTeam = myPlayer?.teamId === gameState.winnerTeamId;

  const handleRestart = async () => {
    if (!myPlayer?.isHost) return;
    const res = await emitRestartGame(room.code, myPlayer.id);
    if (res.error) toast.error(res.error);
  };

  const handleLeave = async () => {
    if (!myPlayer) return;
    await emitLeaveRoom(room.code, myPlayer.id);
    clearSession();
    clearGame();
    navigate('/');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-bounce-in">
        <div className="text-7xl mb-4">{isMyTeam ? '🏆' : '😔'}</div>

        <h2 className="text-3xl font-bold text-white mb-2">
          {isMyTeam ? 'Victory!' : 'Game Over'}
        </h2>

        {winnerTeam && (
          <div className="mb-6">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-white"
              style={{ backgroundColor: winnerTeam.color }}
            >
              <span className="text-xl">🎯</span>
              <span>{winnerTeam.name} Team Wins!</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-6">
          {gameState.teams.map(team => (
            <div
              key={team.id}
              className="rounded-lg p-3 border"
              style={{ borderColor: team.color + '60', backgroundColor: team.color + '20' }}
            >
              <div className="text-lg font-bold" style={{ color: team.color }}>
                {team.sequenceCount}
              </div>
              <div className="text-xs text-slate-400">{team.name}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-center">
          {myPlayer?.isHost && (
            <Button variant="primary" onClick={handleRestart}>
              Play Again
            </Button>
          )}
          <Button variant="secondary" onClick={handleLeave}>
            Leave Room
          </Button>
        </div>

        {!myPlayer?.isHost && (
          <p className="text-slate-500 text-sm mt-4">Waiting for host to restart...</p>
        )}
      </div>
    </div>
  );
}
