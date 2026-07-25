import React, { useState, useEffect } from 'react';
import { User, Message, SharedFile, GitHubRepo, AgentInfo, GitCommitLog } from './types/index.js';
import { Header } from './components/Header.js';
import { AgentList } from './components/Sidebar/AgentList.js';
import { RepoManager } from './components/Sidebar/RepoManager.js';
import { FileExplorer } from './components/Sidebar/FileExplorer.js';
import { ChatFeed } from './components/Chat/ChatFeed.js';
import { ChatInput } from './components/Chat/ChatInput.js';
import { FileEditor } from './components/Workspace/FileEditor.js';
import { ArchitectureViewer } from './components/Workspace/ArchitectureViewer.js';
import { SharedTerminal } from './components/Workspace/SharedTerminal.js';
import { GitDiffViewer } from './components/Workspace/GitDiffViewer.js';
import { AddRepoModal } from './components/Modals/AddRepoModal.js';
import { SettingsModal } from './components/Modals/SettingsModal.js';
import { ShareRoomModal } from './components/Modals/ShareRoomModal.js';
import { wsClient } from './services/websocket.js';
import { SAMPLE_USERS } from './services/mockData.js';
import {
  Folder,
  Github,
  Bot,
  FileCode,
  Layers,
  Terminal as TerminalIcon,
  GitCommit,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<User>(SAMPLE_USERS[0]);
  const [activeUsers, setActiveUsers] = useState<User[]>(SAMPLE_USERS);
  const [typingUsers, setTypingUsers] = useState<User[]>([]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [activeRepo, setActiveRepo] = useState<GitHubRepo | null>(null);

  const [fileTree, setFileTree] = useState<SharedFile[]>([]);
  const [allFiles, setAllFiles] = useState<SharedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<SharedFile | null>(null);

  const [commits, setCommits] = useState<GitCommitLog[]>([]);
  const [availableAgents, setAvailableAgents] = useState<AgentInfo[]>([]);

  const [isConnected, setIsConnected] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  const [sidebarTab, setSidebarTab] = useState<'files' | 'repos' | 'agents'>('files');
  const [rightTab, setRightTab] = useState<'editor' | 'architecture' | 'terminal' | 'git'>('editor');
  const [selectedDiagram, setSelectedDiagram] = useState<string | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [insertedTag, setInsertedTag] = useState<string>('');

  // Modal controls
  const [isAddRepoOpen, setIsAddRepoOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    wsClient.connect(currentUser, 'room-dev-1');

    const unsubscribe = wsClient.subscribe((event, payload) => {
      switch (event) {
        case 'CONNECTED':
          setIsConnected(payload.connected);
          break;

        case 'ROOM_STATE_SYNC':
          setMessages(payload.messages || []);
          setActiveUsers(payload.activeUsers || []);
          setFileTree(payload.files || []);
          setAllFiles(payload.allFileObjects || []);
          setRepos(payload.repos || []);
          if (payload.repos && payload.repos.length > 0) {
            setActiveRepo(payload.repos[0]);
          }
          setCommits(payload.commits || []);
          setAvailableAgents(payload.availableAgents || []);
          setHasApiKey(payload.hasApiKey || false);

          if (payload.allFileObjects && payload.allFileObjects.length > 0) {
            setSelectedFile(payload.allFileObjects[0]);
          }
          break;

        case 'NEW_MESSAGE':
          setMessages((prev) => [...prev, payload.message]);
          break;

        case 'AGENT_STREAM_UPDATE': {
          const updatedMsg: Partial<Message> = payload.message;
          setMessages((prev) => {
            const index = prev.findIndex((m) => m.id === updatedMsg.id);
            if (index !== -1) {
              const updated = [...prev];
              updated[index] = { ...updated[index], ...updatedMsg };
              return updated;
            } else {
              return [...prev, updatedMsg as Message];
            }
          });

          if (updatedMsg.architectureDiagram) {
            setSelectedDiagram(updatedMsg.architectureDiagram);
          }
          break;
        }

        case 'WORKSPACE_FILES_UPDATE':
          setFileTree(payload.files || []);
          setAllFiles(payload.allFileObjects || []);
          setCommits(payload.commits || []);
          // Refresh selected file content if open
          if (selectedFile) {
            const matching = (payload.allFileObjects as SharedFile[]).find((f) => f.path === selectedFile.path);
            if (matching) setSelectedFile(matching);
          }
          break;

        case 'USER_PRESENCE_UPDATE':
          setActiveUsers(payload.activeUsers || []);
          break;

        case 'USER_TYPING': {
          const { user, isTyping } = payload;
          setTypingUsers((prev) => {
            if (isTyping) {
              if (!prev.some((u) => u.id === user.id)) return [...prev, user];
              return prev;
            } else {
              return prev.filter((u) => u.id !== user.id);
            }
          });
          break;
        }

        case 'REPOS_UPDATED':
          setRepos(payload.repos);
          if (payload.addedRepo) setActiveRepo(payload.addedRepo);
          break;

        case 'API_KEY_STATUS':
          setHasApiKey(payload.hasApiKey);
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  const handleSendMessage = (content: string) => {
    const mentions: string[] = [];
    for (const ag of availableAgents) {
      if (content.toLowerCase().includes(ag.handle.toLowerCase())) {
        mentions.push(ag.handle);
      }
    }

    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      roomId: 'room-dev-1',
      sender: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        role: 'human',
        color: currentUser.color
      },
      content,
      timestamp: new Date().toISOString(),
      mentions
    };

    wsClient.sendMessage(newMessage);
  };

  const handleSaveFile = (path: string, newContent: string) => {
    wsClient.updateFile(path, newContent, currentUser);
  };

  const handleAddRepo = (owner: string, repo: string) => {
    wsClient.addRepo(owner, repo);
  };

  const handleSaveApiKey = (apiKey: string) => {
    wsClient.setApiKey(apiKey);
  };

  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
  };

  const handleSelectDiagramFromChat = (diagram: string) => {
    setSelectedDiagram(diagram);
    setRightTab('architecture');
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-dark-950 overflow-hidden text-slate-100">
      {/* Top Navbar */}
      <Header
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        users={SAMPLE_USERS}
        activeRepo={activeRepo}
        onOpenAddRepo={() => setIsAddRepoOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        availableAgents={availableAgents}
        isConnected={isConnected}
        hasApiKey={hasApiKey}
      />

      {/* Main 3-Column Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className={`${isSidebarOpen ? 'w-64' : 'w-12'} transition-all duration-300 bg-dark-900 border-r border-slate-800 flex flex-col z-20 shrink-0`}>
          {/* Sidebar Tab Selector */}
          <div className="h-10 border-b border-slate-800 flex items-center justify-between px-2 bg-dark-950/40">
            {isSidebarOpen ? (
              <div className="flex items-center space-x-1 text-xs">
                <button
                  onClick={() => setSidebarTab('files')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    sidebarTab === 'files' ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Files
                </button>
                <button
                  onClick={() => setSidebarTab('repos')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    sidebarTab === 'repos' ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Repos
                </button>
                <button
                  onClick={() => setSidebarTab('agents')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    sidebarTab === 'agents' ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Agents
                </button>
              </div>
            ) : (
              <span className="text-[10px] font-mono text-slate-400">NAV</span>
            )}

            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-slate-400 hover:text-slate-200 p-1"
              title={isSidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
            >
              {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
          </div>

          {/* Sidebar Content */}
          {isSidebarOpen && (
            <div className="flex-1 overflow-y-auto">
              {sidebarTab === 'files' && (
                <FileExplorer
                  files={fileTree}
                  selectedFile={selectedFile}
                  onSelectFile={(f) => {
                    setSelectedFile(f);
                    setRightTab('editor');
                  }}
                  onCreateFile={() => {
                    const name = prompt('Enter new file path in workspace:', 'src/components/newModule.ts');
                    if (name) {
                      wsClient.updateFile(name, '// New workspace module\n', currentUser);
                    }
                  }}
                />
              )}

              {sidebarTab === 'repos' && (
                <RepoManager
                  repos={repos}
                  activeRepo={activeRepo}
                  onSelectRepo={(r) => setActiveRepo(r)}
                  onOpenAddRepo={() => setIsAddRepoOpen(true)}
                />
              )}

              {sidebarTab === 'agents' && (
                <AgentList
                  agents={availableAgents}
                  onSelectAgent={(handle) => {
                    setInsertedTag(handle);
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* Center Column: Multiplayer Chat & Agent Stream */}
        <div className="flex-1 flex flex-col min-w-[320px] border-r border-slate-800 bg-dark-950">
          <ChatFeed
            messages={messages}
            activeUsers={activeUsers}
            typingUsers={typingUsers}
            onSelectDiagram={handleSelectDiagramFromChat}
          />
          <ChatInput
            onSendMessage={handleSendMessage}
            availableAgents={availableAgents}
            currentUser={currentUser}
            onTyping={(isTyping) => wsClient.sendTypingStatus(currentUser, isTyping)}
            insertedTag={insertedTag}
          />
        </div>

        {/* Right Panel: Shared Workspace (Editor, Architecture, Terminal, Git) */}
        <div className="hidden lg:flex flex-1 flex-col bg-dark-950 min-w-[380px]">
          {/* Workspace Right Tabs */}
          <div className="h-10 border-b border-slate-800 bg-dark-900 px-3 flex items-center justify-between text-xs select-none">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setRightTab('editor')}
                className={`px-3 py-1 rounded-lg font-medium transition flex items-center space-x-1.5 ${
                  rightTab === 'editor' ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                <span>Code Editor</span>
              </button>

              <button
                onClick={() => setRightTab('architecture')}
                className={`px-3 py-1 rounded-lg font-medium transition flex items-center space-x-1.5 ${
                  rightTab === 'architecture' ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Architecture</span>
              </button>

              <button
                onClick={() => setRightTab('terminal')}
                className={`px-3 py-1 rounded-lg font-medium transition flex items-center space-x-1.5 ${
                  rightTab === 'terminal' ? 'bg-amber-600/30 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TerminalIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>Terminal</span>
              </button>

              <button
                onClick={() => setRightTab('git')}
                className={`px-3 py-1 rounded-lg font-medium transition flex items-center space-x-1.5 ${
                  rightTab === 'git' ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <GitCommit className="w-3.5 h-3.5 text-emerald-400" />
                <span>Git History</span>
              </button>
            </div>
          </div>

          {/* Right Panel Body */}
          <div className="flex-1 flex overflow-hidden">
            {rightTab === 'editor' && (
              <FileEditor
                file={selectedFile}
                onSaveFile={handleSaveFile}
                currentUser={currentUser}
              />
            )}

            {rightTab === 'architecture' && (
              <ArchitectureViewer diagram={selectedDiagram} />
            )}

            {rightTab === 'terminal' && (
              <SharedTerminal />
            )}

            {rightTab === 'git' && (
              <GitDiffViewer commits={commits} files={allFiles} />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddRepoModal
        isOpen={isAddRepoOpen}
        onClose={() => setIsAddRepoOpen(false)}
        onAddRepo={handleAddRepo}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        hasApiKey={hasApiKey}
        onSaveApiKey={handleSaveApiKey}
      />

      <ShareRoomModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        roomId="room-dev-1"
      />
    </div>
  );
}
