import React, { useState } from 'react';
import { SharedFile } from '../../types/index.js';
import { Folder, FolderOpen, FileCode, FileText, ChevronRight, ChevronDown, FilePlus, Sparkles } from 'lucide-react';

interface FileExplorerProps {
  files: SharedFile[];
  selectedFile: SharedFile | null;
  onSelectFile: (file: SharedFile) => void;
  onCreateFile: () => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  selectedFile,
  onSelectFile,
  onCreateFile
}) => {
  return (
    <div className="space-y-2 p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
          <Folder className="w-3.5 h-3.5 text-indigo-400" />
          <span>Shared Workspace Files</span>
        </h3>
        <button
          onClick={onCreateFile}
          className="p-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 transition"
          title="Create New File in Workspace"
        >
          <FilePlus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-0.5 mt-1 font-mono text-xs">
        {files.map((node) => (
          <FileNodeItem
            key={node.path}
            node={node}
            depth={0}
            selectedFile={selectedFile}
            onSelectFile={onSelectFile}
          />
        ))}
      </div>
    </div>
  );
};

interface FileNodeItemProps {
  node: SharedFile;
  depth: number;
  selectedFile: SharedFile | null;
  onSelectFile: (file: SharedFile) => void;
}

const FileNodeItem: React.FC<FileNodeItemProps> = ({ node, depth, selectedFile, onSelectFile }) => {
  const [isOpen, setIsOpen] = useState(true);
  const isSelected = selectedFile?.path === node.path;
  const isDirectory = node.type === 'directory';

  const paddingLeft = `${depth * 12 + 8}px`;

  if (isDirectory) {
    return (
      <div>
        <div
          onClick={() => setIsOpen(!isOpen)}
          style={{ paddingLeft }}
          className="flex items-center space-x-1.5 py-1 px-2 rounded-md hover:bg-slate-800/80 cursor-pointer text-slate-300 transition select-none"
        >
          {isOpen ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
          {isOpen ? <FolderOpen className="w-3.5 h-3.5 text-amber-400" /> : <Folder className="w-3.5 h-3.5 text-amber-400" />}
          <span className="font-semibold text-[11px] text-slate-200">{node.name}</span>
        </div>
        {isOpen && node.children && (
          <div>
            {node.children.map((child) => (
              <FileNodeItem
                key={child.path}
                node={child}
                depth={depth + 1}
                selectedFile={selectedFile}
                onSelectFile={onSelectFile}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelectFile(node)}
      style={{ paddingLeft }}
      className={`flex items-center justify-between py-1 px-2 rounded-md cursor-pointer transition select-none ${
        isSelected
          ? 'bg-indigo-600/30 text-indigo-200 font-semibold border-l-2 border-indigo-400'
          : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
      }`}
    >
      <div className="flex items-center space-x-1.5 truncate">
        {node.name.endsWith('.ts') || node.name.endsWith('.tsx') || node.name.endsWith('.js') ? (
          <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        ) : (
          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        )}
        <span className="truncate text-[11px]">{node.name}</span>
      </div>

      {node.gitStatus && node.gitStatus !== 'unmodified' && (
        <span className={`text-[9px] font-mono px-1 rounded ${
          node.gitStatus === 'modified' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
        }`}>
          {node.gitStatus === 'modified' ? 'M' : 'A'}
        </span>
      )}
    </div>
  );
};
