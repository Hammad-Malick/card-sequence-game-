import { useGameStore } from '../store/gameStore';
import { emitDevCheatCard } from '../services/socket.service';
import type { CheatCardMode } from '../game/cheat-card.type';

type CheatTarget = number | string | undefined;

interface SequenceCheatApi {
  hand: () => void;
  wild: (target?: CheatTarget) => Promise<void>;
  remove: (target?: CheatTarget) => Promise<void>;
  wildAll: () => Promise<void>;
  removeAll: () => Promise<void>;
  help: () => void;
}

function getSession() {
  const { room, myPlayer } = useGameStore.getState();
  if (!room || !myPlayer) {
    throw new Error('Join a game first — cheats only work while you are in a room.');
  }
  return { room, myPlayer };
}

function normalizeTarget(target?: CheatTarget): { handIndex?: number; cardCode?: string; all?: boolean } {
  if (target === undefined) {
    return { all: true };
  }
  if (typeof target === 'number') {
    return { handIndex: target };
  }
  return { cardCode: target.toUpperCase() };
}

async function runCheat(mode: CheatCardMode, target?: CheatTarget): Promise<void> {
  const { room, myPlayer } = getSession();
  const options = normalizeTarget(target);
  const result = await emitDevCheatCard({
    roomCode: room.code,
    playerId: myPlayer.id,
    mode,
    ...options,
  });

  if (result.error) {
    console.error(`[cheat] ${result.error}`);
    return;
  }

  console.log(`[cheat] Upgraded: ${result.upgradedCodes?.join(', ') ?? 'none'}`);
}

function printHand(): void {
  const { myPlayer } = getSession();
  myPlayer.hand.forEach((card, index) => {
    const jackLabel = card.isTwoEyedJack
      ? ' (wild jack)'
      : card.isOneEyedJack
      ? ' (one-eyed jack)'
      : '';
    console.log(`${index}: ${card.code} — ${card.rank} of ${card.suit}${jackLabel}`);
  });
}

function printHelp(): void {
  console.log(`
Sequence dev cheats (local server only, NODE_ENV !== production)

  __SEQ__.hand()           List your hand with indexes
  __SEQ__.wild(0)          Turn hand card #0 into a wild jack
  __SEQ__.wild('AH')       Turn Ace of Hearts into a wild jack
  __SEQ__.wild()           Turn ALL non-jack cards into wild jacks
  __SEQ__.wildAll()        Same as __SEQ__.wild()
  __SEQ__.remove(1)        Turn hand card #1 into a one-eyed jack
  __SEQ__.remove('KS')     Turn King of Spades into a one-eyed jack
  __SEQ__.removeAll()      Turn ALL non-jack cards into one-eyed jacks
  __SEQ__.help()           Show this help
`);
}

export function registerSequenceCheatConsole(): void {
  const api: SequenceCheatApi = {
    hand: printHand,
    wild: (target?: CheatTarget) => runCheat('wild', target),
    remove: (target?: CheatTarget) => runCheat('remove', target),
    wildAll: () => runCheat('wild'),
    removeAll: () => runCheat('remove'),
    help: printHelp,
  };

  window.__SEQ__ = api;
  console.log('[dev] Sequence cheats ready — run __SEQ__.help()');
}
