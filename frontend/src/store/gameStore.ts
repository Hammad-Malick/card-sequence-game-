import { create } from 'zustand';
import type {
  RoomData,
  MyPlayer,
  ChatMessage,
  Card,
} from '../game/types';
import { getValidPlacementCells, getRemovableCells } from '../game/board';
import { isDeadCard } from '../game/deck';
import { saveSession, updateLastGameState } from '../services/localStorage.service';
import { DEFAULT_ROOM_SETTINGS } from '../constants/room-settings.constant';

function normalizeRoom(room: RoomData): RoomData {
  return {
    ...room,
    settings: room.settings ?? DEFAULT_ROOM_SETTINGS,
    gameState: {
      ...room.gameState,
      turnStartedAt: room.gameState.turnStartedAt ?? null,
    },
  };
}

interface GameStore {
  room: RoomData | null;
  myPlayer: MyPlayer | null;
  selectedCard: Card | null;
  validCellIds: string[];
  chatMessages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';

  setRoomView: (room: RoomData, myPlayer: MyPlayer) => void;
  updateRoom: (room: RoomData) => void;
  updateMyPlayer: (player: MyPlayer) => void;
  selectCard: (card: Card | null) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setChatMessages: (msgs: ChatMessage[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setConnectionStatus: (status: GameStore['connectionStatus']) => void;
  clearGame: () => void;
  getDeadCards: () => Card[];
}

export const useGameStore = create<GameStore>((set, get) => ({
  room: null,
  myPlayer: null,
  selectedCard: null,
  validCellIds: [],
  chatMessages: [],
  isLoading: false,
  error: null,
  connectionStatus: 'disconnected',

  setRoomView: (room, myPlayer) => {
    const normalizedRoom = normalizeRoom(room);
    set({ room: normalizedRoom, myPlayer, error: null });
    saveSession({
      playerId: myPlayer.id,
      playerName: myPlayer.name,
      roomCode: normalizedRoom.code,
      teamId: myPlayer.teamId,
      isHost: myPlayer.isHost,
      reconnectToken: myPlayer.reconnectToken,
    });
    if (normalizedRoom.gameState.status === 'playing') {
      updateLastGameState(normalizedRoom.gameState);
    }
  },

  updateRoom: (room) => {
    const normalizedRoom = normalizeRoom(room);
    set(state => {
      const publicSelf = normalizedRoom.players.find(p => p.id === state.myPlayer?.id);
      return {
        room: normalizedRoom,
        myPlayer: state.myPlayer
          ? {
              ...state.myPlayer,
              name: publicSelf?.name ?? state.myPlayer.name,
              teamId: publicSelf?.teamId ?? state.myPlayer.teamId,
              isHost: publicSelf?.isHost ?? state.myPlayer.isHost,
              hand: publicSelf?.hand?.length ? publicSelf.hand : state.myPlayer.hand,
              reconnectToken: state.myPlayer.reconnectToken,
            }
          : state.myPlayer,
        selectedCard: null,
        validCellIds: [],
      };
    });
    if (normalizedRoom.gameState.status === 'playing') {
      updateLastGameState(normalizedRoom.gameState);
    }
  },

  updateMyPlayer: (player) => {
    set({ myPlayer: player });
    saveSession({
      playerId: player.id,
      playerName: player.name,
      teamId: player.teamId,
      isHost: player.isHost,
      reconnectToken: player.reconnectToken,
    });
  },

  selectCard: (card) => {
    const { room, myPlayer } = get();
    if (!card || !room || !myPlayer) {
      set({ selectedCard: null, validCellIds: [] });
      return;
    }

    const board = room.gameState.board;
    let validCellIds: string[] = [];

    if (card.isTwoEyedJack) {
      // Two-eyed Jack: any empty non-corner cell
      validCellIds = board.flat()
        .filter(c => !c.isCorner && c.occupiedByTeamId === null)
        .map(c => c.id);
    } else if (card.isOneEyedJack) {
      validCellIds = getRemovableCells(board, myPlayer.teamId);
    } else {
      validCellIds = getValidPlacementCells(board, card.code);
    }

    set({ selectedCard: card, validCellIds });
  },

  addChatMessage: (msg) => {
    set(state => ({
      chatMessages: [...state.chatMessages.slice(-199), msg],
    }));
  },

  setChatMessages: (msgs) => set({ chatMessages: msgs }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  clearGame: () => {
    set({
      room: null,
      myPlayer: null,
      selectedCard: null,
      validCellIds: [],
      chatMessages: [],
      error: null,
    });
  },

  getDeadCards: () => {
    const { myPlayer, room } = get();
    if (!myPlayer || !room) return [];
    return myPlayer.hand.filter(card => isDeadCard(card, room.gameState.board));
  },
}));
