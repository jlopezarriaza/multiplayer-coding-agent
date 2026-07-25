import { User, Room } from '../types/index.js';

export const SAMPLE_USERS: User[] = [
  {
    id: 'user-alice',
    name: 'Alice (Frontend Lead)',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
    role: 'human',
    color: '#ec4899',
    isOnline: true,
    status: 'Discussing state engine'
  },
  {
    id: 'user-bob',
    name: 'Bob (Backend Eng)',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
    role: 'human',
    color: '#3b82f6',
    isOnline: true,
    status: 'Editing src/index.ts'
  },
  {
    id: 'user-carol',
    name: 'Carol (DevOps Lead)',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carol',
    role: 'human',
    color: '#10b981',
    isOnline: true,
    status: 'Monitoring GitHub workflows'
  }
];

export const SAMPLE_ROOMS: Room[] = [
  {
    id: 'room-dev-1',
    name: 'State Engine & Agent Router',
    description: 'Collaborative development room for state synchronization and multi-agent routing.',
    connectedRepos: [
      {
        id: 'repo-1',
        owner: 'jlopezarriaza',
        repo: 'multiplayer-coding-agent',
        branch: 'main',
        url: 'https://github.com/jlopezarriaza/multiplayer-coding-agent',
        description: 'Multiplayer AI Coding Agent with real-time room collaboration',
        stars: 142,
        isSynced: true
      }
    ],
    activeUsers: SAMPLE_USERS,
    createdAt: new Date().toISOString()
  },
  {
    id: 'room-dev-2',
    name: 'GitHub Repos & Workspace Sync',
    description: 'System design room for shared filesystem context and GitHub API integration.',
    connectedRepos: [],
    activeUsers: [SAMPLE_USERS[0]],
    createdAt: new Date().toISOString()
  }
];
