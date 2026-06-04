import type { LocalSession, GameState, ChatMessage } from '../game/types';

const SESSION_KEY = 'sequence_session';

export function saveSession(session: Partial<LocalSession>): void {
  try {
    const existing = loadSession();
    const merged: LocalSession = {
      playerId: '',
      playerName: '',
      roomCode: '',
      teamId: '',
      isHost: false,
      reconnectToken: '',
      lastKnownGameState: null,
      recentChatMessages: [],
      soundEnabled: true,
      ...existing,
      ...session,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(merged));
  } catch {
    // localStorage may be unavailable in some browsers
  }
}

export function loadSession(): LocalSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocalSession;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export function hasActiveSession(): boolean {
  const session = loadSession();
  return !!(session?.roomCode && session?.playerId && session?.reconnectToken);
}

export function updateLastGameState(gameState: GameState): void {
  saveSession({ lastKnownGameState: gameState });
}

export function appendChatMessage(msg: ChatMessage): void {
  const session = loadSession();
  if (!session) return;
  const recent = [...(session.recentChatMessages ?? []), msg].slice(-100);
  saveSession({ recentChatMessages: recent });
}

export function updateSoundEnabled(enabled: boolean): void {
  saveSession({ soundEnabled: enabled });
}
