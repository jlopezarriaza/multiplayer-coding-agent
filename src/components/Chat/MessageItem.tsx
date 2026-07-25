import React, { useEffect, useRef } from 'react';
import { Message } from '../../types/index.js';
import { AgentToolCard } from './AgentToolCard.js';
import { marked } from 'marked';
import mermaid from 'mermaid';
import { Copy, Check, Sparkles, User as UserIcon, Bot } from 'lucide-react';

interface MessageItemProps {
  message: Message;
  onSelectDiagram?: (diagram: string) => void;
}

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  themeVariables: {
    fontFamily: 'Inter, sans-serif',
    primaryColor: '#4f46e5',
    primaryTextColor: '#fff',
    lineColor: '#06b6d4',
  }
});

export const MessageItem: React.FC<MessageItemProps> = ({ message, onSelectDiagram }) => {
  const [copied, setCopied] = React.useState(false);
  const diagramRef = useRef<HTMLDivElement>(null);

  const isAgent = message.sender.role === 'agent';

  useEffect(() => {
    if (message.architectureDiagram && diagramRef.current) {
      const renderId = `mermaid-${message.id.replace(/[^a-zA-Z0-9]/g, '')}`;
      diagramRef.current.innerHTML = '';
      mermaid.render(renderId, message.architectureDiagram).then((result) => {
        if (diagramRef.current) {
          diagramRef.current.innerHTML = result.svg;
        }
      }).catch((err) => {
        console.error('Mermaid render error:', err);
      });
    }
  }, [message.architectureDiagram]);

  const renderContent = () => {
    let rawHtml = marked.parse(message.content) as string;

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
