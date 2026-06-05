import { useState } from 'react';
import clsx from 'clsx';
import type { BoardCell as BoardCellType, Team } from '../../game/types';
import type { ValidCellHighlightMode } from '../../game/board-cell-highlight.type';
import { PokerChip } from '../../assets/chips/PokerChip';
import { getCardImageUrl } from '../../utils/cardImages';

interface BoardCellProps {
  cell: BoardCellType;
  highlightMode: ValidCellHighlightMode | null;
  teams: Team[];
  onClick: (cellId: string) => void;
  revealDelay?: number;
}

export function BoardCellComponent({ cell, highlightMode, teams, onClick, revealDelay = 0 }: BoardCellProps) {
  const isHighlighted = highlightMode !== null;
  const [imgError, setImgError] = useState(false);

  const occupyingTeam = cell.occupiedByTeamId
    ? teams.find(t => t.id === cell.occupiedByTeamId)
    : null;

  const imgUrl = cell.cardCode ? getCardImageUrl(cell.cardCode) : null;

  const handleClick = () => { if (isHighlighted) onClick(cell.id); };

  /* ── Corner (free space) ── */
  if (cell.isCorner) {
    return (
      <div
        className="cell-reveal relative w-full h-full rounded-[2px] overflow-hidden flex items-center justify-center"
        style={{
          '--cell-delay': `${revealDelay}ms`,
          background: 'linear-gradient(135deg,#f59e0b,#d97706)',
          border: '1px solid #b45309',
        } as React.CSSProperties}
      >
        <span style={{ fontSize: 'clamp(9px,1.4vw,18px)', color: '#7c2d12', fontWeight: 900 }}>★</span>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={clsx(
        'cell-reveal relative w-full h-full rounded-[2px] overflow-hidden select-none',
        isHighlighted && 'cell-heartbeat cursor-pointer',
        isHighlighted && highlightMode === 'wild' && 'cell-heartbeat-wild',
        isHighlighted && highlightMode === 'remove' && 'cell-heartbeat-remove',
      )}
      style={{
        '--cell-delay': `${revealDelay}ms`,
        background: '#fff',
        border: cell.isSequenceCell
          ? '1px solid rgba(255,255,255,0.4)'
          : '1px solid #e5e7eb',
      } as React.CSSProperties}
      title={cell.cardCode ?? undefined}
    >
      {/*
        Card image — rotated 90° to fill a landscape (3:2) cell.

        The board is 3:2 landscape, so each cell is also 3:2 (W:H = 3:2).
        The card image is portrait (natural aspect ratio 2:3 = width:height).

        Before rotation we set:
          CSS width  = H  = (2/3) × W  → 66.67% of cell width
          CSS height = W  = (3/2) × H  → 150%  of cell height

        After rotate(90deg):
          visual width  = CSS height = W  → fills cell width  ✓
          visual height = CSS width  = H  → fills cell height ✓

        Result: portrait card perfectly fills the landscape cell with no white-space.
      */}
      {imgUrl && !imgError && (
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={imgUrl}
            alt={cell.cardCode ?? ''}
            draggable={false}
            loading="lazy"
            onError={() => setImgError(true)}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '66.67%',
              height: '150%',
              objectFit: 'fill',
              transform: 'translate(-50%, -50%) rotate(90deg)',
              opacity: occupyingTeam ? (isHighlighted ? 0.45 : 0.25) : (isHighlighted ? 1 : 0.92),
            }}
          />
        </div>
      )}

      {/* Sequence glow */}
      {cell.isSequenceCell && (
        <div
          className="absolute inset-0 pointer-events-none animate-pulse-slow z-10"
          style={{ backgroundColor: occupyingTeam?.color ?? '#fff', opacity: 0.2 }}
        />
      )}

      {/* Poker chip */}
      {occupyingTeam && (
        <div className="chip-drop absolute inset-[10%] flex items-center justify-center z-20">
          <PokerChip color={occupyingTeam.color} isSequence={cell.isSequenceCell} size={99} className="w-full h-full" />
        </div>
      )}

      {/* Valid-move heartbeat glow + ring */}
      {isHighlighted && (
        <>
          <div className="cell-heartbeat-glow absolute inset-0 pointer-events-none z-20" />
          <div className="cell-heartbeat-ring absolute rounded-[2px] pointer-events-none z-30" />
        </>
      )}
    </div>
  );
}
