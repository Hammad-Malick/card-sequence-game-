/**
 * Full playing-card SVG renderer.
 * Produces authentic-looking card faces:
 *  - White background, rounded corners, drop shadow
 *  - Red suits (♥ ♦) in #d00, black suits (♣ ♠) in #111
 *  - Standard pip positions for 2–10
 *  - Decorative face-card designs for J / Q / K
 *  - Large centered pip for Aces
 */

import type { CardSuit, CardRank } from '../../game/types';

export interface CardFaceProps {
  suit: CardSuit;
  rank: CardRank;
  /** Width in px – height is calculated at 1.4 ratio */
  width?: number;
  className?: string;
}

const SUIT_CHARS: Record<CardSuit, string> = {
  spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣',
};
const SUIT_COLOR: Record<CardSuit, string> = {
  spades: '#111', hearts: '#cc0000', diamonds: '#cc0000', clubs: '#111',
};

/** Standard pip x positions within a 100-unit wide card interior */
const LEFT = 22;
const MID  = 50;
const RIGHT = 78;

/** Pip layout: array of [cx, cy] for each rank (1–10 = indices 0–9) */
const PIP_LAYOUTS: [number, number][][] = [
  // A: single center pip handled separately
  [],
  // 2
  [[MID,22],[MID,78]],
  // 3
  [[MID,22],[MID,50],[MID,78]],
  // 4
  [[LEFT,22],[RIGHT,22],[LEFT,78],[RIGHT,78]],
  // 5
  [[LEFT,22],[RIGHT,22],[MID,50],[LEFT,78],[RIGHT,78]],
  // 6
  [[LEFT,22],[RIGHT,22],[LEFT,50],[RIGHT,50],[LEFT,78],[RIGHT,78]],
  // 7
  [[LEFT,22],[RIGHT,22],[MID,36],[LEFT,50],[RIGHT,50],[LEFT,78],[RIGHT,78]],
  // 8
  [[LEFT,22],[RIGHT,22],[LEFT,38],[RIGHT,38],[LEFT,62],[RIGHT,62],[LEFT,78],[RIGHT,78]],
  // 9
  [[LEFT,20],[RIGHT,20],[LEFT,37],[RIGHT,37],[MID,50],[LEFT,63],[RIGHT,63],[LEFT,80],[RIGHT,80]],
  // 10
  [[LEFT,20],[RIGHT,20],[LEFT,34],[RIGHT,34],[LEFT,50],[RIGHT,50],[LEFT,66],[RIGHT,66],[LEFT,80],[RIGHT,80]],
];

const RANK_INDEX: Record<CardRank, number> = {
  A:0, '2':1, '3':2, '4':3, '5':4,
  '6':5, '7':6, '8':7, '9':8, '10':9, J:10, Q:11, K:12,
};

export function CardFace({ suit, rank, width = 80, className }: CardFaceProps) {
  const h = Math.round(width * 1.4);
  const sym = SUIT_CHARS[suit];
  const col = SUIT_COLOR[suit];
  const rIdx = RANK_INDEX[rank];
  const isFace = rIdx >= 10; // J Q K
  const isAce  = rIdx === 0;

  // Pip size relative to card width (in SVG units; card is 100 wide, 140 tall)
  const pipR = 5.5;
  const pips = PIP_LAYOUTS[rIdx] ?? [];

  return (
    <svg
      viewBox="0 0 100 140"
      width={width}
      height={h}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="cs" x="-8%" y="-8%" width="116%" height="116%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#00000055" />
        </filter>
        {/* gradient for face-card background */}
        <linearGradient id="faceGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fffef8" />
          <stop offset="100%" stopColor="#f5f0e8" />
        </linearGradient>
      </defs>

      {/* Card body */}
      <rect x="1" y="1" width="98" height="138" rx="5" ry="5"
        fill={isFace ? 'url(#faceGrad)' : '#ffffff'}
        stroke="#cccccc" strokeWidth="0.8"
        filter="url(#cs)" />

      {/* ── Rank + suit corners ── */}
      <text x="5" y="14" fontSize="11" fontWeight="900" fontFamily="Georgia,serif" fill={col}>{rank}</text>
      <text x="5" y="24" fontSize="10" fontFamily="serif" fill={col}>{sym}</text>
      {/* bottom-right (rotated) */}
      <g transform="rotate(180 50 70)">
        <text x="5" y="14" fontSize="11" fontWeight="900" fontFamily="Georgia,serif" fill={col}>{rank}</text>
        <text x="5" y="24" fontSize="10" fontFamily="serif" fill={col}>{sym}</text>
      </g>

      {/* ── Card center ── */}
      {isAce && <AceFace sym={sym} col={col} />}
      {!isAce && !isFace && <PipFace pips={pips} sym={sym} col={col} pipR={pipR} />}
      {isFace && rank === 'J' && <JackFace col={col} sym={sym} suit={suit} />}
      {isFace && rank === 'Q' && <QueenFace col={col} sym={sym} suit={suit} />}
      {isFace && rank === 'K' && <KingFace col={col} sym={sym} suit={suit} />}
    </svg>
  );
}

/* ── Sub-renderers ── */

function AceFace({ sym, col }: { sym: string; col: string }) {
  return (
    <text x="50" y="82" fontSize="44" fontFamily="serif"
      textAnchor="middle" dominantBaseline="middle" fill={col}>
      {sym}
    </text>
  );
}

function PipFace({ pips, sym, col, pipR }: { pips: [number,number][]; sym: string; col: string; pipR: number }) {
  return (
    <>
      {pips.map(([cx, cy], i) => (
        <text key={i} x={cx} y={cy + pipR * 0.4}
          fontSize={pipR * 2.2}
          fontFamily="serif"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={col}>
          {sym}
        </text>
      ))}
    </>
  );
}

function JackFace({ col, sym, suit }: { col: string; sym: string; suit: CardSuit }) {
  const accent = suit === 'spades' || suit === 'clubs' ? '#333' : '#aa0000';
  return (
    <>
      {/* Decorative border */}
      <rect x="14" y="30" width="72" height="80" rx="3" fill="none" stroke={accent} strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />
      {/* Large J */}
      <text x="50" y="75" fontSize="38" fontWeight="900" fontFamily="Georgia,serif"
        textAnchor="middle" dominantBaseline="middle" fill={col} opacity="0.9">J</text>
      {/* Suit below */}
      <text x="50" y="102" fontSize="18" fontFamily="serif"
        textAnchor="middle" dominantBaseline="middle" fill={col} opacity="0.7">{sym}</text>
      {/* One-eye vs two-eye indicator */}
      {(suit === 'hearts' || suit === 'spades') ? (
        /* One-eyed: single eye + slash */
        <g transform="translate(50,60)">
          <ellipse cx="0" cy="0" rx="7" ry="4.5" fill="none" stroke={col} strokeWidth="1.2" opacity="0.7"/>
          <circle cx="0" cy="0" r="2" fill={col} opacity="0.7"/>
          <line x1="-5" y1="-4" x2="5" y2="4" stroke="#cc0000" strokeWidth="1.5" opacity="0.9"/>
        </g>
      ) : (
        /* Two-eyed: two open eyes */
        <g transform="translate(50,60)">
          <ellipse cx="-7" cy="0" rx="5" ry="3.5" fill="none" stroke={col} strokeWidth="1.2" opacity="0.7"/>
          <circle cx="-7" cy="0" r="1.5" fill={col} opacity="0.7"/>
          <ellipse cx="7" cy="0" rx="5" ry="3.5" fill="none" stroke={col} strokeWidth="1.2" opacity="0.7"/>
          <circle cx="7" cy="0" r="1.5" fill={col} opacity="0.7"/>
        </g>
      )}
    </>
  );
}

function QueenFace({ col, sym }: { col: string; sym: string; suit: CardSuit }) {
  const accent = col === '#111' ? '#555' : '#cc5500';
  return (
    <>
      <rect x="14" y="30" width="72" height="80" rx="3" fill={col === '#111' ? '#f0f0f0' : '#fff5f5'} stroke={accent} strokeWidth="1" opacity="0.6"/>
      {/* Crown */}
      <polygon points="50,34 42,44 35,38 38,50 62,50 65,38 58,44"
        fill={col === '#111' ? '#888' : '#cc5500'} opacity="0.8" />
      <text x="50" y="80" fontSize="36" fontWeight="900" fontFamily="Georgia,serif"
        textAnchor="middle" dominantBaseline="middle" fill={col} opacity="0.9">Q</text>
      <text x="50" y="103" fontSize="16" fontFamily="serif"
        textAnchor="middle" dominantBaseline="middle" fill={col} opacity="0.6">{sym}</text>
    </>
  );
}

function KingFace({ col, sym }: { col: string; sym: string; suit: CardSuit }) {
  const accent = col === '#111' ? '#555' : '#aa0000';
  return (
    <>
      <rect x="14" y="30" width="72" height="80" rx="3" fill={col === '#111' ? '#f0f0f0' : '#fff5f5'} stroke={accent} strokeWidth="1" opacity="0.6"/>
      {/* Crown */}
      <polygon points="26,50 34,38 42,46 50,36 58,46 66,38 74,50 70,54 30,54"
        fill={col === '#111' ? '#666' : '#cc2200'} opacity="0.85" />
      <text x="50" y="80" fontSize="36" fontWeight="900" fontFamily="Georgia,serif"
        textAnchor="middle" dominantBaseline="middle" fill={col} opacity="0.9">K</text>
      <text x="50" y="103" fontSize="16" fontFamily="serif"
        textAnchor="middle" dominantBaseline="middle" fill={col} opacity="0.6">{sym}</text>
    </>
  );
}
