import { User, Room } from '../types/index.js';

export const DEFAULT_GUEST_USER: User = {
  id: 'user-guest',
  name: 'Developer Guest',
  title: 'Contributor',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest',
  role: 'human',
  color: '#6366f1',
  isOnline: true,
  status: 'Online'
};

export const SAMPLE_USERS: User[] = [];

export const SAMPLE_ROOMS: Room[] = [
  {
    id: 'room-dev-1',
    name: 'Multiplayer Workspace',
    description: 'Collaborative development room for state synchronization and multi-agent routing.',
    connectedRepos: [],
    activeUsers: [],
    createdAt: new Date().toISOString()
  }
];
