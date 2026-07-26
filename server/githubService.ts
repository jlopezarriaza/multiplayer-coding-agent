import { GitHubRepo } from '../src/types/index.js';
import { fileSystemStore } from './fileSystemStore.js';

export class GitHubService {
  private repos: Map<string, GitHubRepo> = new Map();

  constructor() {
    // Start clean with no pre-loaded sample repositories
    this.repos.clear();
  }

  public getRepos(): GitHubRepo[] {
    return Array.from(this.repos.values());
  }

  public async fetchRepoDetails(owner: string, repo: string): Promise<GitHubRepo> {
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: { 'User-Agent': 'Agenty-Multiplayer-Engine' }
      });
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }
      const data: any = await response.json();
      const newRepo: GitHubRepo = {
        id: `repo-${Date.now()}`,
        owner: data.owner?.login || owner,
        repo: data.name || repo,
        branch: data.default_branch || 'main',
        url: data.html_url || `https://github.com/${owner}/${repo}`,
        description: data.description || '',
        stars: data.stargazers_count || 0,
        forks: data.forks_count || 0,
        openIssues: data.open_issues_count || 0,
        defaultBranch: data.default_branch || 'main',
        isSynced: true
      };
      this.repos.set(newRepo.id, newRepo);
      return newRepo;
    } catch (err) {
      // Fallback repo object if offline or unauthenticated
      const fallback: GitHubRepo = {
        id: `repo-${Date.now()}`,
        owner,
        repo,
        branch: 'main',
        url: `https://github.com/${owner}/${repo}`,
        description: `Imported repository ${owner}/${repo}`,
        stars: 0,
        forks: 0,
        openIssues: 0,
        defaultBranch: 'main',
        isSynced: true
      };
      this.repos.set(fallback.id, fallback);
      return fallback;
    }
  }

  public async syncRepoFiles(owner: string, repo: string, branch: string = 'main') {
    try {
      console.log(`🐙 Syncing GitHub repository files for ${owner}/${repo} (${branch})...`);
      const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, {
        headers: { 'User-Agent': 'Agenty-Multiplayer-Engine' }
      });
      if (!treeRes.ok) {
        console.warn(`Could not fetch git tree for ${owner}/${repo}: ${treeRes.statusText}`);
        return;
      }

      const treeData: any = await treeRes.json();
      if (!treeData.tree || !Array.isArray(treeData.tree)) return;

      // Filter top files (blobs) excluding hidden files & node_modules
      const fileBlobs = treeData.tree
        .filter((item: any) => item.type === 'blob' && !item.path.startsWith('.') && !item.path.includes('node_modules'))
        .slice(0, 40);

      console.log(`📦 Found ${fileBlobs.length} files to sync from ${owner}/${repo}`);

      for (const file of fileBlobs) {
        try {
          const rawRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file.path}`, {
            headers: { 'User-Agent': 'Agenty-Multiplayer-Engine' }
          });
          if (rawRes.ok) {
            const content = await rawRes.text();
            fileSystemStore.updateFile(file.path, content, `${owner}/${repo}`);
          }
        } catch (e) {
          console.error(`Failed to fetch raw file ${file.path}:`, e);
        }
      }

      fileSystemStore.createGitCommit(`Imported ${owner}/${repo} (${branch})`, `${owner}/${repo}`);
      console.log(`✅ Finished syncing ${fileBlobs.length} files from ${owner}/${repo}`);
    } catch (err) {
      console.error(`Error syncing repo files for ${owner}/${repo}:`, err);
    }
  }
}

export const githubService = new GitHubService();
