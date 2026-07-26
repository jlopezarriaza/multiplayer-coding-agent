import React, { useEffect, useRef, useState } from 'react';
import { Message } from '../../types/index.js';
import { AgentToolCard } from './AgentToolCard.js';
import { marked } from 'marked';
import { Copy, Check, Sparkles, Brain, ChevronDown, ChevronRight } from 'lucide-react';
import { safeRenderMermaid } from '../../utils/mermaidHelper.js';

interface MessageItemProps {
  message: Message;
  onSelectDiagram?: (diagram: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, onSelectDiagram }) => {
  const [copied, setCopied] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const diagramRef = useRef<HTMLDivElement>(null);

  const isAgent = message.sender.role === 'agent';

  useEffect(() => {
    if (message.architectureDiagram && diagramRef.current) {
      safeRenderMermaid(diagramRef.current, message.architectureDiagram, `chat-${message.id.replace(/[^a-zA-Z0-9]/g, '')}`);
    }
  }, [message.architectureDiagram]);

  const renderContent = () => {
    // Strip mermaid codeblocks from body content if architectureDiagram is present to prevent double rendering
    let textToParse = message.content || '';
    if (message.architectureDiagram) {
      textToParse = textToParse.replace(/```mermaid[\s\S]*?```/gi, '').trim();
    }

    let rawHtml = marked.parse(textToParse) as string;

    // Highlight @mentions in text
    rawHtml = rawHtml.replace(
      /(@[a-zA-Z0-9_-]+)/g,
      '<span class="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">$1</span>'
    );

    return { __html: rawHtml };
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex space-x-3 p-4 rounded-xl transition ${
      isAgent ? 'bg-slate-900/70 border border-slate-800/90 shadow-sm' : 'hover:bg-slate-900/40'
    }`}>
      {/* Sender Avatar */}
      <div className="shrink-0">
        {isAgent ? (
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center p-0.5 shadow-md shadow-indigo-500/10">
            <img src={message.sender.avatar} alt={message.sender.name} className="w-full h-full rounded-md" />
          </div>
        ) : (
          <img src={message.sender.avatar} alt={message.sender.name} className="w-8 h-8 rounded-full ring-2 ring-slate-800" />
        )}
      </div>

      {/* Message Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-xs text-slate-200">{message.sender.name}</span>
            {isAgent && (
              <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border ${message.sender.color || 'bg-indigo-500/20 text-indigo-300'}`}>
                {message.sender.handle || '@agent'}
              </span>
            )}
            <span className="text-[10px] text-slate-400">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <button
            onClick={copyToClipboard}
            className="text-slate-400 hover:text-slate-200 transition opacity-0 group-hover:opacity-100"
            title="Copy Message Text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Reasoning Trace (Collapsible) */}
        {message.reasoningTrace && (
          <div className="mt-2 font-mono text-xs">
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="flex items-center space-x-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition"
            >
              {showReasoning ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <Brain className="w-3.5 h-3.5 text-indigo-400" />
              <span>AGY Reasoning & Thought Trace</span>
            </button>

            {showReasoning && (
              <div className="mt-1 p-2 bg-dark-950/90 rounded border border-indigo-500/20 text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap">
                {message.reasoningTrace}
              </div>
            )}
          </div>
        )}

        {/* Streaming / Tool Executions */}
        {message.toolExecutions && message.toolExecutions.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.toolExecutions.map((tool) => (
              <AgentToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}

        {/* Text Content */}
        {message.content && (
          <div
            className="prose prose-invert prose-xs max-w-none mt-1.5 text-slate-300 leading-relaxed font-sans text-xs space-y-2"
            dangerouslySetInnerHTML={renderContent()}
          />
        )}

        {/* Mermaid System Architecture Diagram */}
        {message.architectureDiagram && (
          <div className="mt-3 p-3 glass-card rounded-xl border border-indigo-500/30">
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-800">
              <span className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Interactive System Architecture Diagram
              </span>
              {onSelectDiagram && (
                <button
                  onClick={() => onSelectDiagram(message.architectureDiagram!)}
                  className="text-[10px] font-mono text-indigo-400 hover:underline"
                >
                  Expand Fullscreen
                </button>
              )}
            </div>
            <div ref={diagramRef} className="flex justify-center overflow-x-auto py-2" />
          </div>
        )}
      </div>
    </div>
  );
};
