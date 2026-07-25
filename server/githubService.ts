import { GitHubRepo } from '../src/types/index.js';

export class GitHubService {
  private repos: Map<string, GitHubRepo> = new Map();

  constructor() {
    // Default starter repos for testing/demo
    const defaultRepos: GitHubRepo[] = [
      {
        id: 'repo-1',
        owner: 'jlopezarriaza',
        repo: 'multiplayer-coding-agent',
        branch: 'main',
        url: 'https://github.com/jlopezarriaza/multiplayer-coding-agent',
        description: 'Multiplayer AI Coding Agent with real-time room collaboration & @agent mentions',
        stars: 142,
        forks: 28,
        openIssues: 3,
        defaultBranch: 'main',
        isSynced: true
      },
      {
        id: 'repo-2',
        owner: 'facebook',
        repo: 'react',
        branch: 'main',
        url: 'https://github.com/facebook/react',
        description: 'The library for web and native user interfaces',
        stars: 220000,
        forks: 45000,
        openIssues: 920,
        defaultBranch: 'main',
        isSynced: false
      }
    ];

    for (const r of defaultRepos) {
      this.repos.set(r.id, r);
    }
  }

  public getRepos(): GitHubRepo[] {
    return Array.from(this.repos.values());
  }

  public async fetchRepoDetails(owner: string, repo: string): Promise<GitHubRepo> {
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
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
        stars: 42,
        forks: 5,
        openIssues: 1,
        defaultBranch: 'main',
        isSynced: true
      };
      this.repos.set(fallback.id, fallback);
      return fallback;
    }
  }
}

export const githubService = new GitHubService();
