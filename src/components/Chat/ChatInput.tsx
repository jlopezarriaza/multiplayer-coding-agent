import React, { useState, useRef, useEffect } from 'react';
import { AgentInfo, User } from '../../types/index.js';
import { Send, Command } from 'lucide-react';

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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [tagMatchRange, setTagMatchRange] = useState<{ start: number; end: number } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Compute matching agents based on current @ query
  const getFilteredAgents = (): { agents: AgentInfo[]; start: number; end: number } => {
    if (!textareaRef.current) return { agents: [], start: -1, end: -1 };

    const cursorPos = textareaRef.current.selectionStart || content.length;
    const textBeforeCursor = content.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      // Ensure @ is at start of string or preceded by whitespace
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
      if (/\s/.test(charBeforeAt) || lastAtIndex === 0) {
        const query = textBeforeCursor.slice(lastAtIndex).toLowerCase();
        // Match handles starting with or containing query
        const matches = availableAgents.filter((ag) =>
          ag.handle.toLowerCase().includes(query) || ag.name.toLowerCase().includes(query.replace('@', ''))
        );
        return { agents: matches, start: lastAtIndex, end: cursorPos };
      }
    }
    return { agents: [], start: -1, end: -1 };
  };

  const { agents: filteredAgents, start: matchStart, end: matchEnd } = getFilteredAgents();

  useEffect(() => {
    if (insertedTag) {
      setContent((prev) => (prev ? `${prev} ${insertedTag} ` : `${insertedTag} `));
      textareaRef.current?.focus();
    }
  }, [insertedTag]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredAgents.length]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    const { agents } = getFilteredAgents();
    setShowMentionPopup(agents.length > 0);
    onTyping(val.length > 0);
  };

  const insertAgentMention = (handle: string, startIdx?: number, endIdx?: number) => {
    const s = startIdx !== undefined && startIdx !== -1 ? startIdx : matchStart;
    const e = endIdx !== undefined && endIdx !== -1 ? endIdx : matchEnd;

    let newText = '';
    let newCursorPos = 0;

    if (s !== -1 && e !== -1 && s <= e) {
      const before = content.slice(0, s);
      const after = content.slice(e);
      newText = `${before}${handle} ${after}`;
      newCursorPos = (before + handle + ' ').length;
    } else {
      newText = content ? `${content} ${handle} ` : `${handle} `;
      newCursorPos = newText.length;
    }

    setContent(newText);
    setShowMentionPopup(false);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionPopup && filteredAgents.length > 0) {
      if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault();
        const selectedAgent = filteredAgents[selectedIndex] || filteredAgents[0];
        if (selectedAgent) {
          insertAgentMention(selectedAgent.handle);
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredAgents.length);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredAgents.length) % filteredAgents.length);
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentionPopup(false);
        return;
      }
    }

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

      {/* Autocomplete Mention Popup with Tab Autoselect */}
      {showMentionPopup && filteredAgents.length > 0 && (
        <div className="absolute bottom-full mb-2 left-4 w-72 glass-panel rounded-xl p-2 shadow-2xl z-50 border border-indigo-500/40">
          <div className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider px-2 py-1 border-b border-slate-800 flex items-center justify-between">
            <span>Mention Agent Worker</span>
            <span className="text-[9px] text-slate-400 font-sans">Press <strong>Tab</strong> to autocomplete</span>
          </div>
          {filteredAgents.map((ag, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={ag.handle}
                onClick={() => insertAgentMention(ag.handle)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                  isSelected ? 'bg-indigo-600/30 border border-indigo-500/40' : 'hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <img src={ag.avatar} alt={ag.name} className="w-5 h-5 rounded-md" />
                  <div>
                    <span className="font-semibold text-xs text-slate-200">{ag.name}</span>
                    <span className="text-[10px] text-slate-400 block">{ag.roleDescription.slice(0, 32)}...</span>
                  </div>
                </div>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${ag.badgeColor}`}>
                  {ag.handle}
                </span>
              </div>
            );
          })}
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
              <Command className="w-3 h-3 text-indigo-400" /> Type @ tag + <strong>Tab</strong> to autocomplete
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
