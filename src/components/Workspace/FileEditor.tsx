import React, { useState, useEffect } from 'react';
import { SharedFile, User } from '../../types/index.js';
import { FileCode, Save, Code, Check, Edit3, User as UserIcon } from 'lucide-react';
import Prism from 'prismjs';

interface FileEditorProps {
  file: SharedFile | null;
  onSaveFile: (path: string, content: string) => void;
  currentUser: User;
}

export const FileEditor: React.FC<FileEditorProps> = ({ file, onSaveFile, currentUser }) => {
  const [content, setContent] = useState(file?.content || '');
  const [isDirty, setIsDirty] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setContent(file?.content || '');
    setIsDirty(false);
  }, [file?.path, file?.content]);

  useEffect(() => {
    Prism.highlightAll();
  }, [content]);

  if (!file) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6">
        <FileCode className="w-10 h-10 text-slate-700 mb-2" />
        <p className="text-xs text-slate-400 font-mono">Select a file from the Shared Workspace to view or edit</p>
      </div>
    );
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsDirty(true);
  };

  const handleSave = () => {
    onSaveFile(file.path, content);
    setIsDirty(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const lines = content.split('\n');

  return (
    <div className="flex-1 flex flex-col h-full bg-dark-950/80 overflow-hidden font-mono text-xs">
      {/* Editor Header Bar */}
      <div className="h-10 px-4 border-b border-slate-800 bg-dark-900 flex items-center justify-between text-xs select-none">
        <div className="flex items-center space-x-2">
          <FileCode className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-slate-200">{file.path}</span>
          {isDirty && (
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" title="Unsaved changes" />
          )}
        </div>

        <div className="flex items-center space-x-3 text-slate-400 text-[11px]">
          {file.lastModifiedBy && (
            <span className="hidden sm:inline text-slate-400 flex items-center gap-1 font-sans">
              <Edit3 className="w-3 h-3 text-slate-400" />
              <span>Last edit by: <strong>{file.lastModifiedBy}</strong></span>
            </span>
          )}

          <button
            onClick={handleSave}
            disabled={!isDirty}
            className={`px-3 py-1 rounded-md font-semibold text-xs transition flex items-center space-x-1 ${
              savedSuccess
                ? 'bg-emerald-600 text-white'
                : isDirty
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            {savedSuccess ? (
              <>
                <Check className="w-3 h-3" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Save className="w-3 h-3" />
                <span>Save File</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Editor Surface */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Line Numbers */}
        <div className="w-12 bg-dark-950 py-3 text-right pr-3 select-none text-slate-400 border-r border-slate-800/60 font-mono text-[11px] leading-relaxed">
          {lines.map((_, idx) => (
            <div key={idx}>{idx + 1}</div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          value={content}
          onChange={handleTextChange}
          spellCheck={false}
          className="flex-1 bg-transparent p-3 text-slate-200 font-mono text-[11px] leading-relaxed focus:outline-none resize-none border-none whitespace-pre overflow-auto"
        />
      </div>
    </div>
  );
};
