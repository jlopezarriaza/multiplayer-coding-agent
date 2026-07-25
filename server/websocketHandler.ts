import { WebSocket, WebSocketServer } from 'ws';
import { Message, User, GitHubRepo } from '../src/types/index.js';
import { fileSystemStore } from './fileSystemStore.js';
import { githubService } from './githubService.js';
import { agentEngine, AVAILABLE_AGENTS } from './agentEngine.js';

interface ClientConnection {
  ws: WebSocket;
  user: User;
  roomId: string;
}

export class WebSocketHandler {
  private wss: WebSocketServer;
  private clients: Set<ClientConnection> = new Set();
  private messagesByRoom: Map<string, Message[]> = new Map();
  private activeUsersByRoom: Map<string, Map<string, User>> = new Map();

  constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.seedRoomMessages('room-dev-1');
    this.init();
  }

  private seedRoomMessages(roomId: string) {
    const initialMessages: Message[] = [
      {
        id: 'msg-seed-1',
        roomId,
        sender: {
          id: 'user-alice',
          name: 'Alice (Frontend Lead)',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
          role: 'human',
          color: '#ec4899'
        },
        content: `Hey @Bob! I was looking at our architecture for the multiplayer state sync engine. We need a way to track agent actions live across participants.`,
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        mentions: []
      },
      {
        id: 'msg-seed-2',
        roomId,
        sender: {
          id: 'user-bob',
          name: 'Bob (Backend Eng)',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
          role: 'human',
          color: '#3b82f6'
        },
        content: `That sounds right! Let's check with @architect first to get a visual diagram, and then tag @gemini to implement it in our shared repository.`,
        timestamp: new Date(Date.now() - 3600000 * 1.8).toISOString(),
        mentions: ['@architect', '@gemini']
      }
    ];
    this.messagesByRoom.set(roomId, initialMessages);
  }

  private init() {
    this.wss.on('connection', (ws: WebSocket) => {
      let clientConnection: ClientConnection | null = null;

      ws.on('message', async (raw: string) => {
        try {
          const packet = JSON.parse(raw.toString());
          const { type, payload } = packet;

          switch (type) {
            case 'JOIN_ROOM': {
              const { user, roomId = 'room-dev-1' } = payload;
              clientConnection = { ws, user, roomId };
              this.clients.add(clientConnection);

              // Register room user presence
              if (!this.activeUsersByRoom.has(roomId)) {
                this.activeUsersByRoom.set(roomId, new Map());
              }
              const roomUsers = this.activeUsersByRoom.get(roomId)!;
              roomUsers.set(user.id, user);

              // Send initial state sync to joining client
              ws.send(JSON.stringify({
                type: 'ROOM_STATE_SYNC',
                payload: {
                  roomId,
                  messages: this.messagesByRoom.get(roomId) || [],
                  activeUsers: Array.from(roomUsers.values()),
                  files: fileSystemStore.getTree(),
                  allFileObjects: fileSystemStore.getAllFiles(),
                  repos: githubService.getRepos(),
                  commits: fileSystemStore.getCommits(),
                  availableAgents: AVAILABLE_AGENTS,
                  hasApiKey: !!agentEngine.getApiKey()
                }
              }));

              // Broadcast user presence update to room
              this.broadcastToRoom(roomId, {
                type: 'USER_PRESENCE_UPDATE',
                payload: { activeUsers: Array.from(roomUsers.values()) }
              });
              break;
            }

            case 'SEND_MESSAGE': {
              const { message } = payload as { message: Message };
              const roomId = message.roomId || 'room-dev-1';

              // Store human message
              const roomMsgs = this.messagesByRoom.get(roomId) || [];
              roomMsgs.push(message);
              this.messagesByRoom.set(roomId, roomMsgs);

              // Broadcast message to room participants
              this.broadcastToRoom(roomId, {
                type: 'NEW_MESSAGE',
                payload: { message }
              });

              // Check for agent mentions
              const mentionedAgents = agentEngine.detectMentions(message.content);

              if (mentionedAgents.length > 0) {
                for (const agent of mentionedAgents) {
                  // Trigger agent processing loop
                  agentEngine.processAgentResponse(
                    agent,
                    message,
                    roomMsgs,
                    (partialMsg) => {
                      // Broadcast streaming partial update
                      this.broadcastToRoom(roomId, {
                        type: 'AGENT_STREAM_UPDATE',
                        payload: { message: partialMsg }
                      });

                      // Sync updated files tree if files changed
                      this.broadcastToRoom(roomId, {
                        type: 'WORKSPACE_FILES_UPDATE',
                        payload: {
                          files: fileSystemStore.getTree(),
                          allFileObjects: fileSystemStore.getAllFiles(),
                          commits: fileSystemStore.getCommits()
                        }
                      });
                    }
                  ).then((finalAgentMsg) => {
                    roomMsgs.push(finalAgentMsg);
                    this.messagesByRoom.set(roomId, roomMsgs);
                  });
                }
              }
              break;
            }

            case 'UPDATE_FILE': {
              const { path, content, user } = payload;
              const roomId = clientConnection?.roomId || 'room-dev-1';

              fileSystemStore.updateFile(path, content, user?.name || 'User');

              this.broadcastToRoom(roomId, {
                type: 'WORKSPACE_FILES_UPDATE',
                payload: {
                  files: fileSystemStore.getTree(),
                  allFileObjects: fileSystemStore.getAllFiles(),
                  commits: fileSystemStore.getCommits()
                }
              });
              break;
            }

            case 'ADD_GITHUB_REPO': {
              const { owner, repo } = payload;
              const roomId = clientConnection?.roomId || 'room-dev-1';

              const newRepo: GitHubRepo = await githubService.fetchRepoDetails(owner, repo);

              this.broadcastToRoom(roomId, {
                type: 'REPOS_UPDATED',
                payload: { repos: githubService.getRepos(), addedRepo: newRepo }
              });
              break;
            }

            case 'SET_API_KEY': {
              const { apiKey } = payload;
              agentEngine.setApiKey(apiKey);
              ws.send(JSON.stringify({
                type: 'API_KEY_STATUS',
                payload: { hasApiKey: !!apiKey }
              }));
              break;
            }

            case 'TYPING_STATUS': {
              const { user, isTyping } = payload;
              const roomId = clientConnection?.roomId || 'room-dev-1';
              this.broadcastToRoom(roomId, {
                type: 'USER_TYPING',
                payload: { user, isTyping }
              }, ws); // exclude sender
              break;
            }
          }
        } catch (err) {
          console.error('Error handling WebSocket message:', err);
        }
      });

      ws.on('close', () => {
        if (clientConnection) {
          this.clients.delete(clientConnection);
          const { roomId, user } = clientConnection;
          const roomUsers = this.activeUsersByRoom.get(roomId);
          if (roomUsers) {
            roomUsers.delete(user.id);
            this.broadcastToRoom(roomId, {
              type: 'USER_PRESENCE_UPDATE',
              payload: { activeUsers: Array.from(roomUsers.values()) }
            });
          }
        }
      });
    });
  }

  private broadcastToRoom(roomId: string, data: any, excludeWs?: WebSocket) {
    const jsonStr = JSON.stringify(data);
    for (const client of this.clients) {
      if (client.roomId === roomId && client.ws.readyState === WebSocket.OPEN) {
        if (excludeWs && client.ws === excludeWs) continue;
        client.ws.send(jsonStr);
      }
    }
  }
}
