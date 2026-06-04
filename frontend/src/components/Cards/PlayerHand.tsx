import { useCallback } from 'react';
import { PlayingCard } from './PlayingCard';
import { useGameStore } from '../../store/gameStore';
import { emitReplaceDeadCard } from '../../services/socket.service';
import { isDeadCard } from '../../game/deck';
import toast from 'react-hot-toast';
import type { Card } from '../../game/types';

interface PlayerHandProps {
  /** When true, renders a 2-column vertical grid (for right-side panel) */
  vertical?: boolean;
}

export function PlayerHand({ vertical = false }: PlayerHandProps) {
  const { room, myPlayer, selectedCard, selectCard } = useGameStore();

  const handleSelect = useCallback(
    (card: Card) => {
      selectCard(selectedCard?.code === card.code ? null : card);
    },
    [selectedCard, selectCard]
  );

  const handleReplaceDeadCard = useCallback(
    async (card: Card) => {
      if (!room || !myPlayer) return;
      if (room.gameState.currentTurnPlayerId !== myPlayer.id) {
        toast.error("It's not your turn.");
        return;
      }
      const res = await emitReplaceDeadCard(room.code, myPlayer.id, card);
      if (res.error) toast.error(res.error);
      else toast.success('Dead card replaced!');
    },
    [room, myPlayer]
  );

  if (!room || !myPlayer) return null;

  const isMyTurn = room.gameState.currentTurnPlayerId === myPlayer.id;
  const board = room.gameState.board;

  if (vertical) {
    /* ── Right-panel 3-column grid (panel is 280px → each card ≈ 84px wide) ── */
    return (
      <div className="grid grid-cols-3 gap-2 w-full">
        {myPlayer.hand.map((card, i) => {
          const dead = isDeadCard(card, board);
          return (
            <PlayingCard
              key={`${card.code}-${i}`}
              card={card}
              isSelected={selectedCard?.code === card.code}
              isDead={dead}
              isMyTurn={isMyTurn}
              onSelect={handleSelect}
              onReplaceDeadCard={handleReplaceDeadCard}
              size="md"
            />
          );
        })}
        {myPlayer.hand.length === 0 && (
          <div className="col-span-2 text-slate-500 text-xs py-4 text-center">No cards</div>
        )}
      </div>
    );
  }

  /* ── Bottom horizontal strip (fallback) ── */
  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Your Hand</span>
        <span className="text-xs text-slate-500">({myPlayer.hand.length})</span>
        {isMyTurn && <span className="text-xs text-yellow-400 font-semibold animate-pulse">← Your Turn</span>}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 px-2 max-w-full">
        {myPlayer.hand.map((card, i) => {
          const dead = isDeadCard(card, board);
          return (
            <PlayingCard
              key={`${card.code}-${i}`}
              card={card}
              isSelected={selectedCard?.code === card.code}
              isDead={dead}
              isMyTurn={isMyTurn}
              onSelect={handleSelect}
              onReplaceDeadCard={handleReplaceDeadCard}
              size="sm"
            />
          );
        })}
        {myPlayer.hand.length === 0 && <div className="text-slate-500 text-sm py-4 px-6">No cards</div>}
      </div>
    </div>
  );
}
