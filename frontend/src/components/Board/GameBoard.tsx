import { useCallback, useEffect, useRef, useState } from 'react';
import { BoardCellComponent } from './BoardCell';
import { BoardFeltPattern } from '../../assets/board/BoardTexture';
import { useGameStore } from '../../store/gameStore';
import { emitMakeMove } from '../../services/socket.service';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import type { Card } from '../../game/types';
import type { ValidCellHighlightMode } from '../../game/board-cell-highlight.type';

function getValidHighlightMode(
  cellId: string,
  selectedCard: Card | null,
  validCellIds: string[]
): ValidCellHighlightMode | null {
  if (!selectedCard || !validCellIds.includes(cellId)) {
    return null;
  }
  if (selectedCard.isTwoEyedJack) {
    return 'wild';
  }
  if (selectedCard.isOneEyedJack) {
    return 'remove';
  }
  return 'place';
}

function revealDelay(row: number, col: number): number {
  const dr = row - 4.5;
  const dc = col - 4.5;
  return Math.round(Math.sqrt(dr * dr + dc * dc) * 45);
}

export function GameBoard() {
  const { room, myPlayer, selectedCard, validCellIds, selectCard } = useGameStore();
  const [revealed, setRevealed] = useState(false);
  const prevStatus = useRef<string>('waiting');

  useEffect(() => {
    const status = room?.gameState.status ?? 'waiting';
    if (status === 'playing' && prevStatus.current !== 'playing') {
      setRevealed(false);
      const t = setTimeout(() => setRevealed(true), 30);
      return () => clearTimeout(t);
    }
    prevStatus.current = status;
  }, [room?.gameState.status]);

  const handleCellClick = useCallback(
    async (cellId: string) => {
      if (!room || !myPlayer || !selectedCard) return;
      if (room.gameState.currentTurnPlayerId !== myPlayer.id) {
        toast.error("It's not your turn!");
        return;
      }
      const res = await emitMakeMove(room.code, myPlayer.id, selectedCard, cellId);
      if (res.error) toast.error(res.error);
      else selectCard(null);
    },
    [room, myPlayer, selectedCard, selectCard]
  );

  if (!room) return null;

  const { board, teams } = room.gameState;
  const isMyTurn = room.gameState.currentTurnPlayerId === myPlayer?.id;

  /*
   * Landscape board sizing — always maintains a strict 3:2 (W:H) ratio.
   *
   * Right panel = 280px, padding = 16px → subtract 300px from vw.
   * Top bar = 40px, padding = 24px → subtract 64px from vh.
   *
   * boardW = min(available-vw, available-vh × 1.5, 1060px)
   * boardH = min(available-vw / 1.5, available-vh, 707px)
   *
   * 1024×548:  boardW = min(724, 726, 1060) = 724  boardH = 483 → 3:2 ✓
   * 1280×800:  boardW = min(980, 1104, 1060) = 980  boardH = 653 → 3:2 ✓
   * 1920×1080: boardW = min(1620, 1524, 1060) = 1060 boardH = 707 → 3:2 ✓
   */
  const boardW = 'min(calc(100vw - 300px), calc((100vh - 64px) * 1.5), 1060px)';
  const boardH = 'min(calc((100vw - 300px) / 1.5), calc(100vh - 64px), 707px)';

  const FRAME_PAD = 10;
  const FELT_PAD  = 7;

  return (
    <div className="flex flex-col items-center justify-center gap-1.5 w-full h-full">
      <BoardFeltPattern />

      {/* Action hint */}
      {selectedCard ? (
        <div className={clsx(
          'text-xs font-semibold px-3 py-1 rounded-full border shrink-0',
          selectedCard.isTwoEyedJack ? 'text-emerald-300 bg-emerald-950/80 border-emerald-600/40'
            : selectedCard.isOneEyedJack ? 'text-orange-300 bg-orange-950/80 border-orange-600/40'
            : 'text-yellow-300 bg-yellow-950/80 border-yellow-600/40'
        )}>
          {selectedCard.isTwoEyedJack ? '⭐ Wild Jack — click any empty cell'
            : selectedCard.isOneEyedJack ? '👁 One-eyed Jack — remove an opponent chip'
            : 'Click a highlighted cell to place your chip'}
        </div>
      ) : isMyTurn && room.gameState.status === 'playing' && (
        <p className="text-emerald-400/80 text-xs font-semibold animate-pulse shrink-0">
          Select a card from your hand →
        </p>
      )}

      {/* ── Wood frame ── */}
      <div
        className={clsx('rounded-2xl shadow-2xl shrink-0', revealed && 'board-reveal')}
        style={{
          width: boardW,
          height: boardH,
          background: 'linear-gradient(145deg,#5c3410 0%,#7a4a1e 20%,#9b6a35 40%,#7a4a1e 60%,#5c3410 100%)',
          padding: `${FRAME_PAD}px`,
          border: isMyTurn ? '2px solid rgba(250,204,21,0.6)' : '2px solid rgba(120,80,30,0.9)',
          boxShadow: isMyTurn
            ? '0 0 36px 5px rgba(250,204,21,0.16), 0 10px 40px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,220,120,0.35)'
            : '0 10px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,220,120,0.18)',
        }}
      >
        {/* Felt surface */}
        <div
          className="w-full h-full rounded-xl overflow-hidden flex flex-col"
          style={{
            background: `
              radial-gradient(ellipse at 15% 15%, rgba(255,255,255,0.04) 0%, transparent 55%),
              radial-gradient(ellipse at 85% 85%, rgba(0,0,0,0.25) 0%, transparent 55%),
              repeating-linear-gradient(45deg,transparent,transparent 2px,rgba(0,0,0,0.03) 2px,rgba(0,0,0,0.03) 4px),
              linear-gradient(160deg,#0a2e16 0%,#0f4422 35%,#0d3d1e 65%,#092712 100%)
            `,
            padding: `${FELT_PAD}px`,
            boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.5)',
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-1 px-0.5 shrink-0">
            <span className="text-amber-400/55 text-[8px] font-serif tracking-[0.3em] uppercase">Sequence</span>
            <span className="text-amber-400/40 text-[8px] font-mono">10 × 10</span>
          </div>

          {/* Grid — fills the felt, 3:2 landscape cells via gridTemplateRows */}
          <div
            className="flex-1 grid"
            style={{
              gridTemplateColumns: 'repeat(10, 1fr)',
              gridTemplateRows: 'repeat(10, 1fr)',
              gap: '2px',
            }}
          >
            {board.map(row =>
              row.map(cell => (
                <BoardCellComponent
                  key={cell.id}
                  cell={cell}
                  highlightMode={getValidHighlightMode(cell.id, selectedCard, validCellIds)}
                  teams={teams}
                  onClick={handleCellClick}
                  revealDelay={revealed ? revealDelay(cell.row, cell.col) : 0}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-center gap-3 mt-1 shrink-0">
            {['✦','✦','✦'].map((s, i) => <span key={i} className="text-amber-400/25 text-[7px]">{s}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}
