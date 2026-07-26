import React, { useState } from 'react';
import { Github, X, Plus, Sparkles } from 'lucide-react';

interface AddRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRepo: (owner: string, repo: string) => void;
}

export const AddRepoModal: React.FC<AddRepoModalProps> = ({ isOpen, onClose, onAddRepo }) => {
  const [repoInput, setRepoInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoInput.trim()) return;

    let owner = 'jlopezarriaza';
    let repo = repoInput.trim();

    let cleanInput = repoInput.trim().replace(/\/+$/, '');
    if (cleanInput.startsWith('http://') || cleanInput.startsWith('https://')) {
      try {
        const url = new URL(cleanInput);
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) {
          owner = parts[0];
          repo = parts[1];
        }
      } catch (e) {}
    } else if (cleanInput.includes('/')) {
      const parts = cleanInput.split('/').filter(Boolean);
      if (parts.length >= 2) {
        owner = parts[0];
        repo = parts[1];
      }
    }

    onAddRepo(owner, repo);
    setRepoInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl border border-indigo-500/30">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Github className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-sm text-slate-100">Connect GitHub Repository Context</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              GitHub Repository URL or <code className="text-indigo-400">owner/repository</code>
            </label>
            <input
              type="text"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="e.g. jlopezarriaza/multiplayer-coding-agent or https://github.com/..."
              className="w-full bg-dark-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none"
            />
          </div>

          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-slate-300 leading-relaxed">
            <p className="font-medium text-indigo-300 flex items-center gap-1 mb-1">
              <Sparkles className="w-3.5 h-3.5" /> Shared Context Synchronization
            </p>
            When connected, all room participants and active agents (<code className="text-indigo-300 font-mono">@gemini</code>, <code className="text-cyan-300 font-mono">@architect</code>) will share the repository's files, commit history, and code search index.
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!repoInput.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-md shadow-indigo-600/30 disabled:opacity-50"
            >
              Connect Repository
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
