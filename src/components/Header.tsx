import React, { useState } from 'react';
import { User, GitHubRepo, AgentInfo } from '../types/index.js';
import {
  Sparkles,
  Users,
  Github,
  Key,
  Share2,
  ChevronDown,
  Layers,
  CheckCircle2,
  Radio,
  UserCheck,
  Edit3,
  Trash2
} from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  onSwitchUser: (user: User) => void;
  onEditProfile: () => void;
  onClearRoom: () => void;
  users: User[];
  activeRepo: GitHubRepo | null;
  onOpenAddRepo: () => void;
  onOpenSettings: () => void;
  onOpenShare: () => void;
  availableAgents: AgentInfo[];
  isConnected: boolean;
  hasApiKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSwitchUser,
  onEditProfile,
  onClearRoom,
  users,
  activeRepo,
  onOpenAddRepo,
  onOpenSettings,
  onOpenShare,
  availableAgents,
  isConnected,
  hasApiKey
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);

  const handleClearClick = () => {
    if (confirmingClear) {
      onClearRoom();
      setConfirmingClear(false);
    } else {
      setConfirmingClear(true);
      setTimeout(() => setConfirmingClear(false), 4000);
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-dark-900/90 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Room Info */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-brand-500 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-dark-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                Agenty
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  MULTIPLAYER
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 flex items-center space-x-1.5">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span>{isConnected ? 'Real-time WebSocket Sync' : 'Connecting...'}</span>
            </p>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-800 hidden md:block" />

        {/* GitHub Context Pill */}
        <div className="hidden lg:flex items-center space-x-2 bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 hover:border-slate-700 transition">
          <Github className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-slate-200">
            {activeRepo ? `${activeRepo.owner}/${activeRepo.repo}` : 'No repo connected'}
          </span>
          <span className="font-mono text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
            {activeRepo?.branch || 'main'}
          </span>
          <button
            onClick={onOpenAddRepo}
            className="ml-1 text-indigo-400 hover:text-indigo-300 text-[11px] font-medium underline underline-offset-2"
          >
            + Change
          </button>
        </div>
      </div>

      {/* Agents & Presence */}
      <div className="flex items-center space-x-3">
        {/* Agent Badges */}
        <div className="hidden md:flex items-center space-x-1.5 bg-slate-950/60 p-1 rounded-lg border border-slate-800/80">
          <span className="text-[11px] font-mono text-slate-400 px-1.5">Agents:</span>
          {availableAgents.map((ag) => (
            <span
              key={ag.handle}
              title={ag.roleDescription}
              className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded border ${ag.badgeColor} flex items-center space-x-1 cursor-help transition`}
            >
              <Radio className="w-2.5 h-2.5 animate-pulse" />
              <span>{ag.handle}</span>
            </span>
          ))}
        </div>

        {/* User Profile Button */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center space-x-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg px-3 py-1.5 transition text-xs"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-5 h-5 rounded-full ring-1 ring-indigo-500/50"
            />
            <div className="text-left hidden sm:block">
              <span className="font-medium text-slate-200 block leading-tight">{currentUser.name}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-64 glass-panel rounded-xl p-2 shadow-2xl z-50 border border-slate-800">
              <div className="px-2 py-1.5 border-b border-slate-800/80 mb-1 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Your Profile
                  </p>
                  <p className="text-xs text-slate-200 font-medium">{currentUser.name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onEditProfile();
                  }}
                  className="px-2 py-1 bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 rounded border border-brand-500/30 text-[11px] font-medium transition flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  Edit Profile
                </button>
              </div>

              <div className="px-2 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Simulate Teammates
              </div>

              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    onSwitchUser(u);
                    setShowUserDropdown(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition ${
                    u.id === currentUser.id ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full" />
                    <div className="text-left">
                      <div className="font-medium">{u.name}</div>
                      <div className="text-[10px] text-slate-400">{u.status || 'Active in room'}</div>
                    </div>
                  </div>
                  {u.id === currentUser.id && <UserCheck className="w-4 h-4 text-indigo-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* API Key Modal Button */}
        <button
          onClick={onOpenSettings}
          className={`p-2 rounded-lg border text-xs font-medium flex items-center space-x-1.5 transition ${
            hasApiKey
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20'
          }`}
          title={hasApiKey ? 'Gemini API Key Connected' : 'Configure Gemini API Key'}
        >
          <Key className="w-4 h-4" />
          <span className="hidden sm:inline">{hasApiKey ? 'API Key Active' : 'Set API Key'}</span>
        </button>

        {/* Clear Room Session Button */}
        <button
          onClick={handleClearClick}
          className={`p-2 rounded-lg border text-xs font-medium flex items-center space-x-1.5 transition ${
            confirmingClear
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-rose-500/40 hover:text-rose-400'
          }`}
          title="Clear room chat and start fresh"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">{confirmingClear ? 'Click to Confirm Reset' : 'Clear Fresh'}</span>
        </button>

        {/* Share Room Button */}
        <button
          onClick={onOpenShare}
          className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-md shadow-indigo-600/20 transition flex items-center space-x-1.5 text-xs font-medium"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Invite</span>
        </button>
      </div>
    </header>
  );
};
