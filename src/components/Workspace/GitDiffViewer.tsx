import React from 'react';
import { GitCommitLog, SharedFile } from '../../types/index.js';
import { GitCommit, GitBranch, FileCode, CheckCircle2, History, GitPullRequest } from 'lucide-react';

interface GitDiffViewerProps {
  commits: GitCommitLog[];
  files: SharedFile[];
}

export const GitDiffViewer: React.FC<GitDiffViewerProps> = ({ commits, files }) => {
  const modifiedFiles = files.filter((f) => f.gitStatus && f.gitStatus !== 'unmodified');

  return (
    <div className="flex-1 flex flex-col h-full bg-dark-950/90 font-mono text-xs overflow-hidden">
      {/* Header Bar */}
      <div className="h-10 px-4 border-b border-slate-800 bg-dark-900 flex items-center justify-between text-xs select-none">
        <div className="flex items-center space-x-2">
          <GitCommit className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-200">Git History & Repository Diff Stream</span>
        </div>
        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          Branch: main
        </span>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Uncommitted Modified Files */}
        {modifiedFiles.length > 0 && (
          <div className="p-3 glass-card rounded-xl border border-amber-500/30">
            <h4 className="text-xs font-semibold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-sans">
              <FileCode className="w-3.5 h-3.5 text-amber-400" />
              Staged / Working Tree Changes ({modifiedFiles.length})
            </h4>
            <div className="space-y-1">
              {modifiedFiles.map((f) => (
                <div key={f.path} className="flex items-center justify-between p-2 bg-dark-950 rounded border border-slate-800 text-slate-300">
                  <span className="font-mono text-xs">{f.path}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    {f.gitStatus?.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Commit Log Timeline */}
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-sans">
            <History className="w-3.5 h-3.5 text-indigo-400" />
            Recent Repository Commits
          </h4>
          <div className="space-y-2">
            {commits.map((c) => (
              <div key={c.hash} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-semibold text-indigo-300 text-xs flex items-center space-x-1.5">
                    <GitCommit className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{c.hash}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">{new Date(c.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-xs text-slate-200 font-sans font-medium">{c.message}</p>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400">
                  <span>Author: <strong className="text-slate-300">{c.author}</strong></span>
                  <span>{c.filesChanged} file(s) changed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
