import { useState } from 'react';
import clsx from 'clsx';
import type { Card } from '../../game/types';
import { getCardImageUrl } from '../../utils/cardImages';
import { CardFace } from '../../assets/cards/CardFace';

interface PlayingCardProps {
  card: Card;
  isSelected: boolean;
  isDead: boolean;
  isMyTurn: boolean;
  onSelect: (card: Card) => void;
  onReplaceDeadCard: (card: Card) => void;
  /** 'sm' = small horizontal strip, 'md' = medium right-panel grid */
  size?: 'sm' | 'md';
}

export function PlayingCard({
  card,
  isSelected,
  isDead,
  isMyTurn,
  onSelect,
  onReplaceDeadCard,
  size = 'sm',
}: PlayingCardProps) {
  const [imgError, setImgError] = useState(false);

  const handleClick = () => {
    if (!isMyTurn) return;
    if (isDead) onReplaceDeadCard(card);
    else onSelect(card);
  };

  const imageUrl = getCardImageUrl(card.code);

  return (
    <div
      onClick={handleClick}
      className={clsx(
        'relative rounded-lg overflow-hidden cursor-pointer select-none shrink-0',
        'transition-all duration-200',
        /* md = right-panel grid: fills column, portrait aspect ratio */
        size === 'md' ? 'w-full aspect-[2/3] min-h-0' : 'w-[54px] h-[76px] sm:w-[62px] sm:h-[87px]',
        isSelected && size === 'md' &&
          'ring-2 ring-yellow-400 shadow-[0_6px_24px_rgba(250,204,21,0.5)] scale-[0.96]',
        isSelected && size === 'sm' &&
          '-translate-y-4 scale-110 ring-2 ring-yellow-400 shadow-[0_8px_28px_rgba(250,204,21,0.45)]',
        !isSelected && isMyTurn && !isDead &&
          'hover:scale-[1.04] hover:ring-1 hover:ring-emerald-400/60 hover:shadow-[0_4px_14px_rgba(34,197,94,0.35)]',
        !isMyTurn && 'opacity-55 cursor-not-allowed',
        isDead && !isSelected && 'ring-2 ring-red-500 opacity-80',
      )}
      title={
        card.isTwoEyedJack
          ? 'Wild Jack — place chip anywhere (two-eyed)'
          : card.isOneEyedJack
          ? 'One-eyed Jack — remove an opponent chip'
          : `${card.rank} of ${card.suit}`
      }
    >
      {/* ── Card image from Deck of Cards API ── */}
      {!imgError ? (
        <img
          src={imageUrl}
          alt={card.code}
          className="w-full h-full object-cover block"
          loading="lazy"
          draggable={false}
          onError={() => setImgError(true)}
        />
      ) : (
        /* Fallback to our SVG asset if the API image fails */
        <CardFace suit={card.suit} rank={card.rank} width={64} className="w-full h-full block" />
      )}

      {/* ── Jack type badge (overlaid on top of image) ── */}
      {card.isTwoEyedJack && (
        <div className="absolute bottom-0 inset-x-0 flex justify-center pb-0.5 pointer-events-none">
          <JackBadge type="wild" />
        </div>
      )}
      {card.isOneEyedJack && (
        <div className="absolute bottom-0 inset-x-0 flex justify-center pb-0.5 pointer-events-none">
          <JackBadge type="remove" />
        </div>
      )}

      {/* ── Dead card overlay ── */}
      {isDead && (
        <div className="absolute inset-0 bg-red-100/80 flex items-center justify-center">
          <div className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded text-center leading-tight tracking-tight">
            DEAD<br />TAP
          </div>
        </div>
      )}

      {/* ── Selected tick ── */}
      {isSelected && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg z-10">
          <span className="text-slate-900 text-[9px] font-black">✓</span>
        </div>
      )}
    </div>
  );
}

/* ── Jack badge ── */

function JackBadge({ type }: { type: 'wild' | 'remove' }) {
  const isWild = type === 'wild';
  return (
    <div
      className={clsx(
        'flex items-center gap-0.5 px-1.5 py-[2px] rounded-t text-[7px] font-black tracking-tight leading-none',
        isWild
          ? 'bg-emerald-600 text-white'
          : 'bg-orange-600 text-white'
      )}
    >
      <EyePair type={type} />
      <span className="ml-0.5">{isWild ? 'WILD' : 'REMOVE'}</span>
    </div>
  );
}

function EyePair({ type }: { type: 'wild' | 'remove' }) {
  return (
    <span className="inline-flex gap-[1px]">
      <EyeIcon open />
      <EyeIcon open={type === 'wild'} />
    </span>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 14 9" width="11" height="7">
      {open ? (
        <>
          <ellipse cx="7" cy="4.5" rx="6" ry="3.8" fill="none" stroke="white" strokeWidth="1.4" />
          <circle cx="7" cy="4.5" r="2.2" fill="white" />
          <circle cx="7" cy="4.5" r="1" fill="rgba(0,0,0,0.6)" />
        </>
      ) : (
        <>
          <ellipse cx="7" cy="4.5" rx="6" ry="3.8" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.4" />
          <line x1="2" y1="1.5" x2="12" y2="7.5" stroke="#ff8080" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
