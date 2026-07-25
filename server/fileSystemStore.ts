import { SharedFile, GitCommitLog } from '../src/types/index.js';

class FileSystemStore {
  private files: Map<string, SharedFile> = new Map();
  private commits: GitCommitLog[] = [];

  constructor() {
    this.seedInitialWorkspace();
  }

  private seedInitialWorkspace() {
    // Initial sample repository structure for demo & collaborative coding
    const defaultFiles: { path: string; content: string; language: string }[] = [
      {
        path: 'README.md',
        language: 'markdown',
        content: `# Collaborative Cloud Engine\n\nA distributed microservice architecture for multiplayer collaboration and real-time state synchronization.\n\n## Architecture\n- **Gateway API**: Handles WebSocket handshakes and authentication.\n- **Agent Dispatcher**: Routes @agent mentions to dedicated AI workers.\n- **State Sync Engine**: Conflict-free replicated state engine for live file editing.\n\n## Quick Start\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`
      },
      {
        path: 'src/index.ts',
        language: 'typescript',
        content: `import express from 'express';
import { createServer } from 'http';
import { StateEngine } from './services/stateEngine';
import { AgentRouter } from './agents/router';

const app = express();
const server = createServer(app);
const stateEngine = new StateEngine();
const agentRouter = new AgentRouter();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', activeWorkers: agentRouter.getWorkerCount() });
});

server.listen(4000, () => {
  console.log('Server running on port 4000');
});
`
      },
      {
        path: 'src/services/stateEngine.ts',
        language: 'typescript',
        content: `export interface WorkspaceState {
  roomId: string;
  activeUsers: string[];
  activeRepository: string;
}

export class StateEngine {
  private roomStates: Map<string, WorkspaceState> = new Map();

  public registerRoom(roomId: string, repo: string): WorkspaceState {
    const state: WorkspaceState = {
      roomId,
      activeUsers: [],
      activeRepository: repo
    };
    this.roomStates.set(roomId, state);
    return state;
  }

  public getRoom(roomId: string): WorkspaceState | undefined {
    return this.roomStates.get(roomId);
  }
}
`
      },
      {
        path: 'src/agents/router.ts',
        language: 'typescript',
        content: `export class AgentRouter {
  private registeredAgents = new Set(['gemini', 'architect', 'coder', 'reviewer', 'debugger']);

  public parseMentions(input: string): string[] {
    const matches = input.match(/@[a-zA-Z0-9_-]+/g) || [];
    return matches.map(m => m.toLowerCase());
  }

  public getWorkerCount(): number {
    return this.registeredAgents.size;
  }
}
`
      },
      {
        path: 'package.json',
        language: 'json',
        content: `{\n  "name": "collaborative-cloud-engine",\n  "version": "1.0.0",\n  "scripts": {\n    "dev": "ts-node src/index.ts",\n    "test": "jest"\n  }\n}\n`
      }
    ];

    for (const f of defaultFiles) {
      this.files.set(f.path, {
        path: f.path,
        name: f.path.split('/').pop() || f.path,
        content: f.content,
        type: 'file',
        language: f.language,
        lastModifiedBy: 'system',
        lastModifiedAt: new Date().toISOString(),
        gitStatus: 'unmodified'
      });
    }

    this.commits.push({
      hash: 'a1b2c3d',
      author: 'jlopezarriaza',
      message: 'Initial commit: core architecture setup',
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      filesChanged: 4
    });
  }

  public getFile(path: string): SharedFile | undefined {
    return this.files.get(path);
  }

  public getAllFiles(): SharedFile[] {
    return Array.from(this.files.values());
  }

  public updateFile(path: string, content: string, modifiedBy: string): SharedFile {
    const existing = this.files.get(path);
    const updated: SharedFile = {
      path,
      name: path.split('/').pop() || path,
      content,
      type: 'file',
      language: existing?.language || this.detectLanguage(path),
      lastModifiedBy: modifiedBy,
      lastModifiedAt: new Date().toISOString(),
      gitStatus: existing ? 'modified' : 'added'
    };
    this.files.set(path, updated);
    return updated;
  }

  public deleteFile(path: string): boolean {
    return this.files.delete(path);
  }

  public createGitCommit(message: string, author: string): GitCommitLog {
    const modifiedCount = Array.from(this.files.values()).filter(f => f.gitStatus !== 'unmodified').length;
    const commit: GitCommitLog = {
      hash: Math.random().toString(36).substring(2, 9),
      author,
      message,
      timestamp: new Date().toISOString(),
      filesChanged: modifiedCount || 1
    };

    // Reset git statuses to unmodified
    for (const file of this.files.values()) {
      file.gitStatus = 'unmodified';
    }

    this.commits.unshift(commit);
    return commit;
  }

  public getCommits(): GitCommitLog[] {
    return this.commits;
  }

  public searchCode(query: string): { path: string; matches: { line: number; text: string }[] }[] {
    const results: { path: string; matches: { line: number; text: string }[] }[] = [];
    const qLower = query.toLowerCase();

    for (const file of this.files.values()) {
      const lines = file.content.split('\n');
      const matches: { line: number; text: string }[] = [];

      lines.forEach((lineText, idx) => {
        if (lineText.toLowerCase().includes(qLower)) {
          matches.push({ line: idx + 1, text: lineText.trim() });
        }
      });

      if (matches.length > 0) {
        results.push({ path: file.path, matches });
      }
    }
    return results;
  }

  private detectLanguage(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx': return 'typescript';
      case 'js':
      case 'jsx': return 'javascript';
      case 'json': return 'json';
      case 'md': return 'markdown';
      case 'py': return 'python';
      case 'html': return 'html';
      case 'css': return 'css';
      default: return 'text';
    }
  }

  public getTree(): SharedFile[] {
    const fileList = Array.from(this.files.values());
    const tree: SharedFile[] = [];
    const folderMap = new Map<string, SharedFile>();

    for (const file of fileList) {
      const parts = file.path.split('/');
      if (parts.length === 1) {
        tree.push(file);
      } else {
        // Build nested directories
        let currentPath = '';
        for (let i = 0; i < parts.length - 1; i++) {
          const folderName = parts[i];
          const parentPath = currentPath;
          currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;

          if (!folderMap.has(currentPath)) {
            const folderNode: SharedFile = {
              path: currentPath,
              name: folderName,
              content: '',
              type: 'directory',
              children: []
            };
            folderMap.set(currentPath, folderNode);

            if (parentPath) {
              folderMap.get(parentPath)?.children?.push(folderNode);
            } else {
              tree.push(folderNode);
            }
          }
        }
        folderMap.get(currentPath)?.children?.push(file);
      }
    }
    return tree;
  }
}

export const fileSystemStore = new FileSystemStore();
