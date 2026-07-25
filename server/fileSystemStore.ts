import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SharedFile, GitCommitLog } from '../src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const WORKSPACE_DIR = path.join(__dirname, '../workspace');

class FileSystemStore {
  private files: Map<string, SharedFile> = new Map();
  private commits: GitCommitLog[] = [];

  constructor() {
    this.ensureWorkspaceDir();
    this.syncFromDisk();
  }

  public ensureWorkspaceDir() {
    if (!fs.existsSync(WORKSPACE_DIR)) {
      fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
    }
  }

  public syncFromDisk() {
    this.files.clear();
    this.readDirRecursive(WORKSPACE_DIR, '');
  }

  private readDirRecursive(dir: string, relativePath: string) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

      const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        this.readDirRecursive(fullPath, relPath);
      } else {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          this.files.set(relPath, {
            path: relPath,
            name: entry.name,
            content,
            type: 'file',
            language: this.detectLanguage(entry.name),
            lastModifiedBy: 'workspace',
            lastModifiedAt: new Date().toISOString(),
            gitStatus: 'unmodified'
          });
        } catch (err) {
          console.error(`Error reading ${fullPath}:`, err);
        }
      }
    }
  }

  public getFile(relPath: string): SharedFile | undefined {
    this.syncFromDisk();
    return this.files.get(relPath);
  }

  public getAllFiles(): SharedFile[] {
    this.syncFromDisk();
    return Array.from(this.files.values());
  }

  public updateFile(relPath: string, content: string, modifiedBy: string): SharedFile {
    this.ensureWorkspaceDir();
    const fullPath = path.join(WORKSPACE_DIR, relPath);
    const parentDir = path.dirname(fullPath);

    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    const existing = this.files.get(relPath);
    fs.writeFileSync(fullPath, content, 'utf-8');

    const updated: SharedFile = {
      path: relPath,
      name: relPath.split('/').pop() || relPath,
      content,
      type: 'file',
      language: existing?.language || this.detectLanguage(relPath),
      lastModifiedBy: modifiedBy,
      lastModifiedAt: new Date().toISOString(),
      gitStatus: existing ? 'modified' : 'added'
    };

    this.files.set(relPath, updated);
    return updated;
  }

  public deleteFile(relPath: string): boolean {
    const fullPath = path.join(WORKSPACE_DIR, relPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    return this.files.delete(relPath);
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
    this.syncFromDisk();
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
      case 'sh': return 'bash';
      default: return 'text';
    }
  }

  public getTree(): SharedFile[] {
    this.syncFromDisk();
    const fileList = Array.from(this.files.values());
    const tree: SharedFile[] = [];
    const folderMap = new Map<string, SharedFile>();

    for (const file of fileList) {
      const parts = file.path.split('/');
      if (parts.length === 1) {
        tree.push(file);
      } else {
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
