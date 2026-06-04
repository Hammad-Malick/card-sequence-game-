import { create } from 'zustand';
import { getSocket, disconnectSocket } from '../services/socket.service';
import { useGameStore } from './gameStore';
import { appendChatMessage } from '../services/localStorage.service';
import type { ServerRoomView, ChatMessage, RoomData, MyPlayer } from '../game/types';
import toast from 'react-hot-toast';

interface SocketStore {
  isConnected: boolean;
  isInitialized: boolean;
  initializeSocket: () => void;
  teardownSocket: () => void;
}

export const useSocketStore = create<SocketStore>(set => ({
  isConnected: false,
  isInitialized: false,

  initializeSocket: () => {
    const socket = getSocket();
    const gameStore = useGameStore.getState;

    socket.on('connect', () => {
      set({ isConnected: true });
      gameStore().setConnectionStatus('connected');
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
      gameStore().setConnectionStatus('disconnected');
    });

    socket.on('connect_error', () => {
      set({ isConnected: false });
      gameStore().setConnectionStatus('disconnected');
    });

    socket.on('reconnecting', () => {
      gameStore().setConnectionStatus('reconnecting');
    });

    socket.on('reconnect', () => {
      set({ isConnected: true });
      gameStore().setConnectionStatus('connected');
    });

    // Room updates (server pushes updated room to all players)
    socket.on('room:update', (data: ServerRoomView) => {
      if (!data?.room || !data?.myPlayer) return;
      gameStore().updateRoom(data.room as RoomData);
      if (data.myPlayer) {
        gameStore().updateMyPlayer(data.myPlayer as MyPlayer);
      }
    });

    socket.on('player:disconnect', (data: { playerId: string; playerName: string }) => {
      toast(`${data.playerName} disconnected`, { icon: '🔌' });
    });

    socket.on('player:connected', (data: { playerId: string; playerName: string }) => {
      toast.success(`${data.playerName} reconnected`);
    });

    socket.on('player:left', () => {
      // Room update will reflect the removal
    });

    socket.on('player:kicked', (data: { playerId: string }) => {
      const myPlayer = gameStore().myPlayer;
      if (myPlayer?.id === data.playerId) {
        toast.error('You have been removed from the room by the host.');
        gameStore().clearGame();
      }
    });

    socket.on('game:chat-message', (msg: ChatMessage) => {
      gameStore().addChatMessage(msg);
      appendChatMessage(msg);
    });

    socket.on('game:error', (data: { reason: string }) => {
      toast.error(data.reason ?? 'An error occurred.');
    });

    set({ isInitialized: true });
  },

  teardownSocket: () => {
    disconnectSocket();
    set({ isConnected: false, isInitialized: false });
  },
}));
