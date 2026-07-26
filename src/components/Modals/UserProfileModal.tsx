import React, { useState } from 'react';
import { User } from '../../types/index.js';
import { UserCheck, Sparkles, Shield, User as UserIcon, Briefcase } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onSave: (user: User) => void;
  currentUser?: User | null;
  isInitialSetup?: boolean;
}

const PRESET_EXPERTISE = [
  'Senior Architect',
  'Fullstack Engineer',
  'Frontend Specialist',
  'Backend & Database Lead',
  'DevOps & Cloud Architect',
  'Product Lead & Manager',
  'AI & ML Engineer',
  'QA & Security Auditor'
];

const AVATAR_SEEDS = [
  { name: 'Juan', seed: 'Juan' },
  { name: 'Alex', seed: 'Alex' },
  { name: 'Sarah', seed: 'Sarah' },
  { name: 'Chris', seed: 'Chris' },
  { name: 'Taylor', seed: 'Taylor' },
  { name: 'Jordan', seed: 'Jordan' }
];

export function UserProfileModal({ isOpen, onSave, currentUser, isInitialSetup = false }: UserProfileModalProps) {
  const [name, setName] = useState(currentUser?.name ? currentUser.name.split(' (')[0] : '');
  const [title, setTitle] = useState(currentUser?.title || 'Senior Architect');
  const [avatarSeed, setAvatarSeed] = useState(currentUser?.avatar ? currentUser.avatar.split('seed=')[1] || 'Juan' : 'Juan');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const formattedName = title.trim() ? `${name.trim()} (${title.trim()})` : name.trim();
    const updatedUser: User = {
      id: currentUser?.id || `user-${Date.now()}`,
      name: formattedName,
      title: title.trim(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(avatarSeed)}`,
      role: 'human',
      color: currentUser?.color || '#6366f1',
      isOnline: true,
      status: `Active as ${title.trim() || 'Contributor'}`
    };

    onSave(updatedUser);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-dark-900 border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header gradient banner */}
        <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-cyan-600 px-6 py-5 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl">
              <Sparkles className="w-6 h-6 text-cyan-200" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                {isInitialSetup ? 'Welcome to Agenty Workspace!' : 'Edit Your Profile & Expertise'}
              </h2>
              <p className="text-xs text-white/80 mt-0.5">
                {isInitialSetup ? 'Set up your developer profile to join the multiplayer session' : 'Update how your team sees you in the room'}
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Avatar Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Choose Avatar
            </label>
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
              {AVATAR_SEEDS.map((av) => (
                <button
                  key={av.seed}
                  type="button"
                  onClick={() => setAvatarSeed(av.seed)}
                  className={`relative p-1.5 rounded-xl transition-all border ${
                    avatarSeed === av.seed
                      ? 'border-brand-500 bg-brand-500/15 ring-2 ring-brand-500/30 scale-105'
                      : 'border-slate-800 bg-dark-950/50 hover:border-slate-700'
                  }`}
                >
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${av.seed}`}
                    alt={av.name}
                    className="w-10 h-10 rounded-lg bg-slate-900"
                  />
                  {avatarSeed === av.seed && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 rounded-full flex items-center justify-center text-[10px] text-white">
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-brand-400" />
              Your Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Juan Lopez"
              className="w-full px-3.5 py-2.5 bg-dark-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Role / Expertise Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
              Your Expertise / Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Architect, Fullstack Lead"
              className="w-full px-3.5 py-2.5 bg-dark-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />

            {/* Quick preset chips */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {PRESET_EXPERTISE.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTitle(preset)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors border ${
                    title === preset
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : 'bg-dark-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center space-x-2 active:scale-[0.99]"
            >
              <UserCheck className="w-4 h-4" />
              <span>{isInitialSetup ? 'Enter Multiplayer Workspace' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
