import React from 'react';
import { GitHubRepo } from '../../types/index.js';
import { Github, GitBranch, Star, GitFork, Plus, CheckCircle2, RefreshCw } from 'lucide-react';

interface RepoManagerProps {
  repos: GitHubRepo[];
  activeRepo: GitHubRepo | null;
  onSelectRepo: (repo: GitHubRepo) => void;
  onOpenAddRepo: () => void;
}

export const RepoManager: React.FC<RepoManagerProps> = ({
  repos,
  activeRepo,
  onSelectRepo,
  onOpenAddRepo
}) => {
  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
          <Github className="w-3.5 h-3.5 text-indigo-400" />
          <span>Shared Context Repositories</span>
        </h3>
        <button
          onClick={onOpenAddRepo}
          className="p-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 transition"
          title="Add GitHub Repository Context"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-2">
        {repos.map((repo) => {
          const isActive = activeRepo?.id === repo.id;
          return (
            <div
              key={repo.id}
              onClick={() => onSelectRepo(repo)}
              className={`p-2.5 rounded-xl border transition cursor-pointer ${
                isActive
                  ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md shadow-indigo-900/20'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold text-xs text-slate-200 flex items-center space-x-1.5 truncate">
                  <Github className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{repo.owner}/{repo.repo}</span>
                </div>
                {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-1" />}
              </div>

              {repo.description && (
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                  {repo.description}
                </p>
              )}

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400 font-mono">
                <div className="flex items-center space-x-2">
                  <span className="flex items-center space-x-0.5">
                    <GitBranch className="w-3 h-3 text-indigo-400" />
                    <span>{repo.branch}</span>
                  </span>
                  {repo.stars !== undefined && (
                    <span className="flex items-center space-x-0.5">
                      <Star className="w-3 h-3 text-amber-400" />
                      <span>{repo.stars}</span>
                    </span>
                  )}
                </div>
                <span className="text-emerald-400 font-sans font-medium flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Synced</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
