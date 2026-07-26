export interface User {
  id: string;
  name: string;
  title?: string;
  avatar: string;
  role: 'human' | 'agent';
  color: string;
  isOnline: boolean;
  currentFile?: string;
  status?: string;
}

export interface AgentInfo {
  handle: string; // e.g. '@gemini', '@architect', '@coder', '@reviewer', '@debugger'
  name: string;
  roleDescription: string;
  avatar: string;
  badgeColor: string;
  capabilities: string[];
}

export interface GitHubRepo {
  id: string;
  owner: string;
  repo: string;
  branch: string;
  url: string;
  description?: string;
  stars?: number;
  forks?: number;
  openIssues?: number;
  defaultBranch?: string;
  isSynced?: boolean;
}

export interface SharedFile {
  path: string;
  name: string;
  content: string;
  type: 'file' | 'directory';
  children?: SharedFile[];
  language?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
  gitStatus?: 'unmodified' | 'modified' | 'added' | 'deleted';
}

export interface ToolExecution {
  id: string;
  toolName: string;
  status: 'running' | 'success' | 'failed';
  args: Record<string, any>;
  result?: string;
  diff?: {
    path: string;
    oldContent: string;
    newContent: string;
  };
}

export interface Message {
  id: string;
  roomId: string;
  sender: {
    id: string;
    name: string;
    avatar: string;
    role: 'human' | 'agent';
    handle?: string;
    color?: string;
  };
  content: string;
  timestamp: string;
  mentions: string[]; // handles like ['@gemini', '@architect']
  toolExecutions?: ToolExecution[];
  reasoningTrace?: string;
  architectureDiagram?: string; // Mermaid markdown diagram string
  attachedFiles?: string[];
  isStreaming?: boolean;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  connectedRepos: GitHubRepo[];
  activeUsers: User[];
  createdAt: string;
}

export interface SharedTerminalLog {
  id: string;
  timestamp: string;
  command: string;
  output: string;
  executedBy: string;
  status: 'success' | 'error';
}

export interface GitCommitLog {
  hash: string;
  author: string;
  message: string;
  timestamp: string;
  filesChanged: number;
}
