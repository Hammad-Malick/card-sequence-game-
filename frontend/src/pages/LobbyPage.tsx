import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameLayout, PageContainer, Card } from '../components/Layout/GameLayout';
import { Button } from '../components/UI/Button';
import { PlayerList } from '../components/Lobby/PlayerList';
import { ConfirmModal } from '../components/Modals/ConfirmModal';
import { useGameStore } from '../store/gameStore';
import { emitStartGame, emitLeaveRoom, emitKickPlayer, emitChangeTeam } from '../services/socket.service';
import { clearSession } from '../services/localStorage.service';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const GAME_MODE_LABELS: Record<string, string> = {
  '2players': '2 Players (1v1)',
  '2teams': '2 Teams',
  '3teams': '3 Teams',
};

export function LobbyPage() {
  const navigate = useNavigate();
  const { room, myPlayer, clearGame } = useGameStore();
  const [isStarting, setIsStarting] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [kickTarget, setKickTarget] = useState<string | null>(null);
  const [changingTeam, setChangingTeam] = useState(false);

  useEffect(() => {
    if (!room || !myPlayer) {
      navigate('/');
      return;
    }
    if (room.gameState.status === 'playing') {
      navigate('/game');
    }
  }, [room, myPlayer, navigate]);

  if (!room || !myPlayer) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.code).then(() => toast.success('Room code copied!'));
  };

  const handleStartGame = async () => {
    setIsStarting(true);
    const res = await emitStartGame(room.code, myPlayer.id);
    if (res.error) toast.error(res.error);
    setIsStarting(false);
  };

  const handleLeave = async () => {
    await emitLeaveRoom(room.code, myPlayer.id);
    clearSession();
    clearGame();
    navigate('/');
  };

  const handleKick = async (playerId: string) => {
    const res = await emitKickPlayer(room.code, myPlayer.id, playerId);
    if (res.error) toast.error(res.error);
    setKickTarget(null);
  };

  const handleChangeTeam = async (newTeamId: string) => {
    if (changingTeam || myPlayer.teamId === newTeamId) return;
    setChangingTeam(true);
    const res = await emitChangeTeam(room.code, myPlayer.id, newTeamId);
    if (res.error) toast.error(res.error);
    setChangingTeam(false);
  };

  const connectedCount = room.players.filter(p => p.connected).length;
  const canStart = myPlayer.isHost && connectedCount >= 2;

  return (
    <GameLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-4">
        <PageContainer narrow className="py-8">
          <Card className="p-6 animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white">Game Lobby</h1>
                <p className="text-slate-400 text-sm">
                  {GAME_MODE_LABELS[room.gameMode] ?? room.gameMode}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setConfirmLeave(true)}>
                Leave
              </Button>
            </div>

            {/* Room code */}
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 mb-6 text-center">
              <p className="text-slate-400 text-xs mb-1 uppercase tracking-wide">Room Code</p>
              <p className="font-mono text-4xl font-bold text-emerald-400 tracking-widest mb-3">
                {room.code}
              </p>
              <Button variant="secondary" size="sm" onClick={handleCopyCode}>
                📋 Copy Code
              </Button>
            </div>

            {/* Teams — clickable to switch */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">
                  Teams — click to join
                </p>
                {myPlayer.teamId && (
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      color: room.gameState.teams.find(t => t.id === myPlayer.teamId)?.color,
                      backgroundColor: (room.gameState.teams.find(t => t.id === myPlayer.teamId)?.color ?? '#888') + '20',
                    }}
                  >
                    You: {room.gameState.teams.find(t => t.id === myPlayer.teamId)?.name}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {room.gameState.teams.map(team => {
                  const isMyTeam = myPlayer.teamId === team.id;
                  const teamPlayers = room.players.filter(p => p.teamId === team.id && p.connected);
                  const isFull = room.gameMode === '2players' && teamPlayers.some(p => p.id !== myPlayer.id);

                  return (
                    <button
                      key={team.id}
                      disabled={isMyTeam || isFull || changingTeam}
                      onClick={() => handleChangeTeam(team.id)}
                      className={clsx(
                        'relative flex flex-col items-start gap-1.5 p-3 rounded-xl border-2 transition-all text-left',
                        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900',
                        isMyTeam
                          ? 'border-current cursor-default'
                          : isFull
                          ? 'border-slate-700/40 bg-slate-800/20 opacity-50 cursor-not-allowed'
                          : 'border-slate-700/50 bg-slate-800/30 hover:bg-slate-700/40 hover:scale-[1.02] cursor-pointer active:scale-100'
                      )}
                      style={
                        isMyTeam
                          ? { borderColor: team.color, backgroundColor: team.color + '18' }
                          : {}
                      }
                    >
                      {/* Team color + name */}
                      <div className="flex items-center gap-2 w-full">
                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0 border-2 border-white/20"
                          style={{ backgroundColor: team.color }}
                        />
                        <span className="font-semibold text-sm" style={{ color: team.color }}>
                          {team.name}
                        </span>
                        {isMyTeam && (
                          <span className="ml-auto text-[10px] font-bold text-white/70 bg-white/10 px-1.5 py-0.5 rounded-full">
                            YOU
                          </span>
                        )}
                        {isFull && !isMyTeam && (
                          <span className="ml-auto text-[10px] text-slate-500">Full</span>
                        )}
                      </div>

                      {/* Players on this team */}
                      <div className="flex flex-wrap gap-1 min-h-[18px]">
                        {teamPlayers.length === 0 ? (
                          <span className="text-[10px] text-slate-600">Empty</span>
                        ) : (
                          teamPlayers.map(p => (
                            <span
                              key={p.id}
                              className="text-[10px] text-slate-300 bg-slate-700/60 px-1.5 py-0.5 rounded-full truncate max-w-[80px]"
                            >
                              {p.name}
                            </span>
                          ))
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Player list */}
            <div className="mb-6">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-3">
                Players ({connectedCount})
              </p>
              <PlayerList
                players={room.players}
                teams={room.gameState.teams}
                myPlayerId={myPlayer.id}
                hostId={room.hostId}
                isHost={myPlayer.isHost}
                onKick={(id) => setKickTarget(id)}
              />
            </div>

            {/* Actions */}
            {myPlayer.isHost ? (
              <div className="flex flex-col gap-2">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isStarting}
                  disabled={!canStart}
                  onClick={handleStartGame}
                >
                  🎮 Start Game
                </Button>
                {!canStart && (
                  <p className="text-center text-xs text-slate-500">
                    Need at least 2 connected players to start
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-slate-800/40 rounded-xl p-4 text-center">
                <div className="inline-flex items-center gap-2 text-slate-400">
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-pulse" />
                  Waiting for host to start the game...
                </div>
              </div>
            )}
          </Card>
        </PageContainer>
      </div>

      {confirmLeave && (
        <ConfirmModal
          title="Leave Room?"
          message="Are you sure you want to leave this room?"
          onConfirm={handleLeave}
          onCancel={() => setConfirmLeave(false)}
        />
      )}

      {kickTarget && (
        <ConfirmModal
          title="Kick Player?"
          message="Remove this player from the room?"
          confirmLabel="Kick"
          onConfirm={() => handleKick(kickTarget)}
          onCancel={() => setKickTarget(null)}
        />
      )}
    </GameLayout>
  );
}
