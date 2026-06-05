import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameLayout } from '../components/Layout/GameLayout';
import { GameBoard } from '../components/Board/GameBoard';
import { PlayerHand } from '../components/Cards/PlayerHand';
import { ChatBox } from '../components/Chat/ChatBox';
import { WinnerModal } from '../components/Modals/WinnerModal';
import { ConfirmModal } from '../components/Modals/ConfirmModal';
import { Button } from '../components/UI/Button';
import { TurnTimer } from '../components/Game/TurnTimer';
import { useGameStore } from '../store/gameStore';
import { DEFAULT_ROOM_SETTINGS } from '../constants/room-settings.constant';
import { emitLeaveRoom, emitEndGame } from '../services/socket.service';
import { clearSession } from '../services/localStorage.service';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import type { RoomData, MyPlayer } from '../game/types';

export function GamePage() {
  const navigate = useNavigate();
  const { room, myPlayer, clearGame, connectionStatus } = useGameStore();
  const [showChat, setShowChat] = useState(false);
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  useEffect(() => {
    if (!room || !myPlayer) { navigate('/'); return; }
    if (room.gameState.status === 'waiting') navigate('/lobby');
  }, [room, myPlayer, navigate]);

  if (!room || !myPlayer) return null;

  const gameState = room.gameState;
  const isMyTurn = gameState.currentTurnPlayerId === myPlayer.id;
  const currentTurnPlayer = room.players.find(p => p.id === gameState.currentTurnPlayerId);
  const currentTurnTeam = gameState.teams.find(
    t => t.id === currentTurnPlayer?.teamId
  );
  const roomSettings = room.settings ?? DEFAULT_ROOM_SETTINGS;

  const handleLeave = async () => {
    await emitLeaveRoom(room.code, myPlayer.id);
    clearSession();
    clearGame();
    navigate('/');
  };

  const handleEndGame = async () => {
    const res = await emitEndGame(room.code, myPlayer.id);
    if (res.error) toast.error(res.error);
    setConfirmEnd(false);
  };

  return (
    <GameLayout>
      {/*
        Responsive layout:
          Desktop (≥ 768px): board + right panel side-by-side, no scroll
          Mobile  (< 768px): board full-width, hand strip at bottom, info drawer
      */}
      <div className="h-[100dvh] overflow-hidden bg-slate-950 flex flex-col select-none">

        {/* ── Top bar ── */}
        <header className="h-10 shrink-0 flex items-center justify-between px-3 bg-slate-900/90 border-b border-slate-800 z-20 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-white text-sm tracking-wide shrink-0">🃏</span>
            <span className="font-mono text-xs text-emerald-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 shrink-0">
              {room.code}
            </span>
            {/* Turn pill — hidden on very small screens */}
            <div className={clsx(
              'hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0',
              isMyTurn
                ? 'border-yellow-500/50 bg-yellow-400/10 text-yellow-300'
                : 'border-slate-700 bg-slate-800/60 text-slate-400'
            )}>
              {currentTurnTeam && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: currentTurnTeam.color }}
                />
              )}
              {isMyTurn ? '🎯 Your Turn!' : `${currentTurnPlayer?.name ?? '…'}'s Turn`}
            </div>
            <TurnTimer
              turnStartedAt={gameState.turnStartedAt}
              turnTimerSeconds={roomSettings.turnTimerSeconds}
              isMyTurn={isMyTurn}
            />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <div
              className={clsx('w-2 h-2 rounded-full shrink-0', connectionStatus === 'connected' ? 'bg-emerald-400' : 'bg-red-400 animate-pulse')}
              title={connectionStatus}
            />
            {/* Mobile info toggle */}
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setShowMobilePanel(s => !s)}>
              ℹ️
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowChat(s => !s)}>💬</Button>
            {myPlayer.isHost && (
              <Button variant="danger" size="sm" onClick={() => setConfirmEnd(true)}>End</Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setConfirmLeave(true)}>Leave</Button>
          </div>
        </header>

        {/* ── Desktop: board + right panel side-by-side ── */}
        <div className="hidden md:flex flex-1 min-h-0 overflow-hidden gap-2 p-2">

          {/* Board — fills flex-1 */}
          <div className="flex-1 flex items-center justify-center min-w-0 overflow-hidden">
            <GameBoard />
          </div>

          {/* Right panel — fixed 280px */}
          <aside className="w-[280px] shrink-0 flex flex-col gap-2 overflow-hidden">

            {/* Hand */}
            <div className="flex-1 min-h-0 bg-slate-900/70 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
              <div className="px-2 pt-2 pb-1 shrink-0 flex items-center justify-between border-b border-slate-800/60">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Your Hand</span>
                {isMyTurn && <span className="text-[10px] text-yellow-400 font-bold animate-pulse">Your Turn ↓</span>}
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                <PlayerHand vertical />
              </div>
            </div>

            {/* Teams */}
            <TeamSummary room={room} myPlayer={myPlayer} />

            {/* Players */}
            <PlayerList room={room} myPlayer={myPlayer} />
          </aside>

          {/* Chat overlay */}
          {showChat && (
            <div className="w-52 shrink-0 flex flex-col min-h-0">
              <ChatBox />
            </div>
          )}
        </div>

        {/* ── Mobile: board + bottom hand strip ── */}
        <div className="flex md:hidden flex-1 flex-col min-h-0 overflow-hidden">
          {/* Board area */}
          <div className="flex-1 flex items-center justify-center p-1 min-h-0 overflow-hidden">
            <GameBoard />
          </div>

          {/* Mobile hand strip */}
          <div className="shrink-0 bg-slate-900/80 border-t border-slate-800 px-2 py-2">
            <PlayerHand />
          </div>
        </div>

        {/* Mobile info drawer */}
        {showMobilePanel && (
          <div className="md:hidden absolute inset-x-0 bottom-0 top-10 bg-slate-950/95 z-40 flex flex-col p-4 gap-3 overflow-y-auto">
            <div className="flex justify-between items-center">
              <span className="text-white font-bold">Game Info</span>
              <Button variant="ghost" size="sm" onClick={() => setShowMobilePanel(false)}>✕</Button>
            </div>
            <TeamSummary room={room} myPlayer={myPlayer} />
            <PlayerList room={room} myPlayer={myPlayer} />
            {showChat && <ChatBox />}
          </div>
        )}
      </div>

      <WinnerModal />

      {confirmLeave && (
        <ConfirmModal
          title="Leave Game?"
          message="You can rejoin if the session is still active."
          onConfirm={handleLeave}
          onCancel={() => setConfirmLeave(false)}
        />
      )}
      {confirmEnd && (
        <ConfirmModal
          title="End Game?"
          message="This will end the game for all players."
          confirmLabel="End Game"
          onConfirm={handleEndGame}
          onCancel={() => setConfirmEnd(false)}
        />
      )}
    </GameLayout>
  );
}

/* ── Team summary ── */
function TeamSummary({ room, myPlayer }: { room: RoomData; myPlayer: MyPlayer }) {
  const { gameState } = room;
  const required = gameState.teams.length >= 3 ? 1 : 2;

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-2 shrink-0">
      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-1.5">Teams</p>
      <div className="flex flex-col gap-1">
        {gameState.teams.map(team => (
          <div
            key={team.id}
            className={clsx(
              'flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs',
              myPlayer.teamId === team.id ? 'bg-slate-700/60' : 'bg-slate-800/30'
            )}
          >
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: team.color }} />
            <span className="truncate font-medium" style={{ color: team.color }}>{team.name}</span>
            <div className="flex gap-0.5 ml-auto">
              {Array.from({ length: required }).map((_, i) => (
                <div
                  key={i}
                  className={clsx('w-3 h-3 rounded-full border-2', i < team.sequenceCount ? '' : 'border-slate-600 bg-transparent')}
                  style={i < team.sequenceCount ? { backgroundColor: team.color, borderColor: team.color } : {}}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Player list ── */
function PlayerList({ room, myPlayer }: { room: RoomData; myPlayer: MyPlayer }) {
  const { gameState, players } = room;
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-2 shrink-0">
      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-1.5">Players</p>
      <div className="flex flex-col gap-1">
        {players.map(p => {
          const isCurrentTurn = p.id === gameState.currentTurnPlayerId;
          const team = gameState.teams.find(t => t.id === p.teamId);
          return (
            <div
              key={p.id}
              className={clsx(
                'flex items-center gap-1.5 text-[11px] rounded-lg px-1.5 py-1',
                isCurrentTurn ? 'bg-yellow-400/10' : '',
                !p.connected && 'opacity-40'
              )}
            >
              <div className={clsx('w-1.5 h-1.5 rounded-full shrink-0', p.connected ? 'bg-emerald-400' : 'bg-slate-600')} />
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: team?.color ?? '#888' }} />
              <span className={clsx('truncate', p.id === myPlayer.id ? 'text-emerald-300 font-semibold' : 'text-slate-300')}>
                {p.name}{p.id === myPlayer.id ? ' (you)' : ''}
              </span>
              {isCurrentTurn && <span className="ml-auto text-yellow-400 text-[10px]">●</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
