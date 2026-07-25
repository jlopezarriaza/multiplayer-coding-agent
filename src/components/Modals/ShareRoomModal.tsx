import React, { useState } from 'react';
import { Share2, Copy, Check, X, Users, Sparkles } from 'lucide-react';

interface ShareRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

export const ShareRoomModal: React.FC<ShareRoomModalProps> = ({ isOpen, onClose, roomId }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const roomUrl = `${window.location.origin}/?room=${roomId}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl border border-indigo-500/30">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Share2 className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-sm text-slate-100">Invite Collaborators to Room</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <p className="text-slate-300">
            Share this room link with your team. Multiple people can join simultaneously to chat, design architecture, and guide <code className="text-indigo-400 font-mono">@gemini</code> live!
          </p>

          <div className="flex items-center space-x-2 bg-dark-950 p-2 rounded-xl border border-slate-800">
            <input
              type="text"
              readOnly
              value={roomUrl}
              className="flex-1 bg-transparent text-slate-300 text-xs font-mono focus:outline-none"
            />
            <button
              onClick={copyUrl}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold flex items-center space-x-1 transition shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>

          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-slate-300">
            <div className="font-semibold text-indigo-300 flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Multi-User Perspective Switcher
            </div>
            You can also test multi-user collaboration right in this tab by switching perspectives in the top-right header dropdown!
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
