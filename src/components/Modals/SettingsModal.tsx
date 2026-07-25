import React, { useState } from 'react';
import { Key, X, Check, ShieldCheck, Cpu } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasApiKey: boolean;
  onSaveApiKey: (key: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  hasApiKey,
  onSaveApiKey
}) => {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveApiKey(apiKey.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl border border-indigo-500/30">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-sm text-slate-100">AI Agent Engine Settings</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Google Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={hasApiKey ? '••••••••••••••••••••••••••••' : 'Enter Gemini API Key (AIzaSy...)'}
              className="w-full bg-dark-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              {hasApiKey ? '✅ API key currently active in room session' : 'Provide your API key for live Gemini 2.5/3 Flash execution.'}
            </p>
          </div>

          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-slate-300 leading-relaxed">
            <p className="font-medium text-emerald-300 flex items-center gap-1 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Contextual Agent Engine Included
            </p>
            Agenty includes built-in contextual tool execution for all <code className="text-indigo-300 font-mono">@agents</code> (reading, editing, code checks, Mermaid diagrams, terminal executions) out-of-the-box!
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
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-md shadow-indigo-600/30 flex items-center space-x-1"
            >
              {saved && <Check className="w-3.5 h-3.5" />}
              <span>{saved ? 'Saved!' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
