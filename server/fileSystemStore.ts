import { SharedFile, GitCommitLog } from '../src/types/index.js';

class FileSystemStore {
  private files: Map<string, SharedFile> = new Map();
  private commits: GitCommitLog[] = [];

  constructor() {
    this.seedInitialWorkspace();
  }

  private seedInitialWorkspace() {
    // Start every session clean with no pre-loaded sample files
    this.files.clear();
    this.commits = [];
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
