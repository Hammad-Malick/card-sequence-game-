import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useGameStore } from '../../store/gameStore';
import { emitChatMessage } from '../../services/socket.service';
import clsx from 'clsx';

export function ChatBox() {
  const { chatMessages, myPlayer, room } = useGameStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = () => {
    const msg = input.trim();
    if (!msg || !myPlayer || !room) return;
    emitChatMessage(room.code, myPlayer.id, myPlayer.name, msg);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/80 rounded-xl border border-slate-700/50">
      <div className="px-3 py-2 border-b border-slate-700/50">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Chat</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0" style={{ maxHeight: '200px' }}>
        {chatMessages.length === 0 && (
          <p className="text-slate-600 text-xs text-center py-4">No messages yet</p>
        )}
        {chatMessages.map((msg, i) => {
          const isMe = msg.playerId === myPlayer?.id;
          return (
            <div key={i} className={clsx('flex flex-col', isMe ? 'items-end' : 'items-start')}>
              <span className="text-[10px] text-slate-500 mb-0.5">{msg.playerName}</span>
              <div
                className={clsx(
                  'text-xs px-2.5 py-1.5 rounded-xl max-w-[85%] break-words',
                  isMe
                    ? 'bg-emerald-700/60 text-emerald-100'
                    : 'bg-slate-700/60 text-slate-200'
                )}
              >
                {msg.message}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="px-2 py-2 border-t border-slate-700/50 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          maxLength={300}
          className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-white text-xs font-semibold transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
