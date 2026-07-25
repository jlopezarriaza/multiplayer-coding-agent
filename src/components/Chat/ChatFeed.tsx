import React, { useRef, useEffect } from 'react';
import { Message, User } from '../../types/index.js';
import { MessageItem } from './MessageItem.js';
import { Sparkles, MessageSquare, Users, Radio, Bot } from 'lucide-react';

interface ChatFeedProps {
  messages: Message[];
  activeUsers: User[];
  typingUsers: User[];
  onSelectDiagram?: (diagram: string) => void;
}

export const ChatFeed: React.FC<ChatFeedProps> = ({
  messages,
  activeUsers,
  typingUsers,
  onSelectDiagram
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-dark-950/40">
      {/* Presence Bar */}
      <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-semibold text-slate-200">Multiplayer Collaboration Stream</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{activeUsers.length} Online</span>
          </span>
          <div className="flex -space-x-1.5 overflow-hidden">
            {activeUsers.map((u) => (
              <img
                key={u.id}
                src={u.avatar}
                alt={u.name}
                title={u.name}
                className="w-5 h-5 rounded-full ring-2 ring-slate-900"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">Welcome to Agenty Multiplayer Room</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Start chatting with your team or tag an agent like <code className="text-indigo-400 font-mono">@gemini</code> or <code className="text-cyan-400 font-mono">@architect</code> to analyze or implement code live!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} onSelectDiagram={onSelectDiagram} />
          ))
        )}

        {/* Live Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center space-x-2 text-xs text-indigo-400 font-mono px-4 py-1 italic animate-pulse">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            <span>{typingUsers.map((u) => u.name).join(', ')} is typing...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
};
