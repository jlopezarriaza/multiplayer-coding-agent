import React, { useState, useRef, useEffect } from 'react';
import { AgentInfo, User } from '../../types/index.js';
import { Send, Bot, Sparkles, Paperclip, Command, HelpCircle } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  availableAgents: AgentInfo[];
  currentUser: User;
  onTyping: (isTyping: boolean) => void;
  insertedTag?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  availableAgents,
  currentUser,
  onTyping,
  insertedTag
}) => {
  const [content, setContent] = useState('');
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (insertedTag) {
      setContent((prev) => (prev ? `${prev} ${insertedTag} ` : `${insertedTag} `));
      textareaRef.current?.focus();
    }
  }, [insertedTag]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    // Detect @ symbol typing for mention popup
    const lastChar = val.slice(-1);
    if (lastChar === '@') {
      setShowMentionPopup(true);
    } else if (!val.includes('@')) {
      setShowMentionPopup(false);
    }

    onTyping(val.length > 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!content.trim()) return;
    onSendMessage(content.trim());
    setContent('');
    setShowMentionPopup(false);
    onTyping(false);
  };

  const insertAgentMention = (handle: string) => {
    // Replace trailing @ if any, or append handle
    if (content.endsWith('@')) {
      setContent(content.slice(0, -1) + `${handle} `);
    } else {
      setContent(content + ` ${handle} `);
    }
    setShowMentionPopup(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="p-3 bg-dark-900 border-t border-slate-800 relative z-20">
      {/* Quick Agent Mention Action Chips */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-none text-[11px]">
        <span className="text-slate-400 font-mono text-[10px] shrink-0">Quick Tag:</span>
        <button
          onClick={() => setContent('@architect design system architecture diagram for state engine')}
          className="shrink-0 px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition font-mono"
        >
          @architect system design
        </button>
        <button
          onClick={() => setContent('@gemini implement agent action tracking in src/services/stateEngine.ts')}
          className="shrink-0 px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 transition font-mono"
        >
          @gemini implement feature
        </button>
        <button
          onClick={() => setContent('@reviewer check code quality and security risks')}
          className="shrink-0 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition font-mono"
        >
          @reviewer audit code
        </button>
        <button
          onClick={() => setContent('@debugger run test suite and verify state engine')}
          className="shrink-0 px-2 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 transition font-mono"
        >
          @debugger run tests
        </button>
      </div>

      {/* Autocomplete Mention Popup */}
      {showMentionPopup && (
        <div className="absolute bottom-full mb-2 left-4 w-72 glass-panel rounded-xl p-2 shadow-2xl z-50 border border-indigo-500/40">
          <div className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider px-2 py-1 border-b border-slate-800">
            Mention Agent Worker
          </div>
          {availableAgents.map((ag) => (
            <div
              key={ag.handle}
              onClick={() => insertAgentMention(ag.handle)}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-indigo-600/20 cursor-pointer transition"
            >
              <div className="flex items-center space-x-2">
                <img src={ag.avatar} alt={ag.name} className="w-5 h-5 rounded-md" />
                <div>
                  <span className="font-semibold text-xs text-slate-200">{ag.name}</span>
                  <span className="text-[10px] text-slate-400 block">{ag.roleDescription.slice(0, 35)}...</span>
                </div>
              </div>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${ag.badgeColor}`}>
                {ag.handle}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Main Input Box */}
      <div className="relative glass-panel rounded-xl border border-slate-800 focus-within:border-indigo-500/60 transition shadow-inner">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={`Type a message to room or tag an agent (e.g. "@gemini, what do you think of this setup?")`}
          rows={2}
          className="w-full bg-transparent px-3 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none resize-none"
        />

        <div className="flex items-center justify-between px-3 py-1.5 border-t border-slate-800/60 bg-dark-950/40 rounded-b-xl text-xs">
          <div className="flex items-center space-x-2 text-slate-400">
            <span className="text-[10px] font-mono flex items-center gap-1">
              <Command className="w-3 h-3 text-indigo-400" /> Use @ to tag agent
            </span>
          </div>

          <button
            onClick={handleSend}
            disabled={!content.trim()}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 transition flex items-center space-x-1.5"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
