import React, { useState } from 'react';
import { ToolExecution } from '../../types/index.js';
import { FileText, Edit3, Terminal, GitCommit, CheckCircle2, Loader2, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';

interface AgentToolCardProps {
  tool: ToolExecution;
}

export const AgentToolCard: React.FC<AgentToolCardProps> = ({ tool }) => {
  const [showDiff, setShowDiff] = useState(true);

  const getToolIcon = () => {
    switch (tool.toolName) {
      case 'read_file': return <FileText className="w-3.5 h-3.5 text-cyan-400" />;
      case 'write_file': return <Edit3 className="w-3.5 h-3.5 text-indigo-400" />;
      case 'run_command': return <Terminal className="w-3.5 h-3.5 text-amber-400" />;
      case 'git_commit': return <GitCommit className="w-3.5 h-3.5 text-emerald-400" />;
      default: return <FileText className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getStatusBadge = () => {
    if (tool.status === 'running') {
      return (
        <span className="flex items-center space-x-1 text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>EXECUTING</span>
        </span>
      );
    }
    if (tool.status === 'success') {
      return (
        <span className="flex items-center space-x-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" />
          <span>SUCCESS</span>
        </span>
      );
    }
    return (
      <span className="flex items-center space-x-1 text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
        <AlertCircle className="w-3 h-3" />
        <span>FAILED</span>
      </span>
    );
  };

  return (
    <div className="glass-card rounded-lg p-2.5 my-2 border border-slate-800 font-sans text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getToolIcon()}
          <span className="font-mono font-semibold text-slate-200">{tool.toolName}</span>
          <span className="text-slate-400 font-mono text-[11px] truncate max-w-[200px] sm:max-w-[300px]">
            {tool.args.path || tool.args.command || tool.args.message || JSON.stringify(tool.args)}
          </span>
        </div>
        {getStatusBadge()}
      </div>

      {tool.result && (
        <div className="mt-2 font-mono text-[11px] bg-dark-950/80 p-2 rounded border border-slate-800 text-slate-300 max-h-32 overflow-y-auto whitespace-pre-wrap">
          {tool.result}
        </div>
      )}

      {tool.diff && (
        <div className="mt-2 border-t border-slate-800 pt-2">
          <button
            onClick={() => setShowDiff(!showDiff)}
            className="flex items-center space-x-1 text-[11px] font-mono text-indigo-400 hover:text-indigo-300 transition"
          >
            {showDiff ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <span>View Inline Code Diff ({tool.diff.path})</span>
          </button>

          {showDiff && (
            <div className="mt-1 font-mono text-[10px] bg-dark-950 p-2 rounded border border-slate-800 overflow-x-auto">
              <div className="text-rose-400 bg-rose-950/20 p-1 rounded mb-1 whitespace-pre-wrap">
                - {tool.diff.oldContent.slice(0, 150)}...
              </div>
              <div className="text-emerald-400 bg-emerald-950/20 p-1 rounded whitespace-pre-wrap">
                + {tool.diff.newContent.slice(0, 150)}...
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
