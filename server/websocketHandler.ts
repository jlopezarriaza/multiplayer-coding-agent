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

  public seedRoomMessages(roomId: string) {
    const initialMessages: Message[] = [
      {
        id: 'msg-welcome-1',
        roomId,
        sender: {
          id: 'user-system',
          name: 'Agenty Room Engine',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=system&backgroundColor=6366f1',
          role: 'agent',
          color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
        },
        content: `👋 **Welcome to your clean multiplayer workspace!**\n\n- **Chat**: Discuss requirements with your team in this room.\n- **Agents**: Tag \`@gemini\`, \`@architect\`, \`@reviewer\`, or \`@debugger\` (press **Tab** to autocomplete).\n- **Agent Handoff**: Agents can tag each other (e.g. \`@architect\` tags \`@gemini\` -> \`@reviewer\`).\n- **Files & Repos**: Create files via the File Explorer **\`+\`** button or connect a GitHub repo.`,
        timestamp: new Date().toISOString(),
        mentions: []
      }
    ];
    this.messagesByRoom.set(roomId, initialMessages);
  }

  public clearRoomMessages(roomId: string = 'room-dev-1') {
    this.seedRoomMessages(roomId);
    this.broadcastToRoom(roomId, {
      type: 'ROOM_STATE_SYNC',
      payload: {
        roomId,
        messages: this.messagesByRoom.get(roomId) || [],
        activeUsers: Array.from(this.activeUsersByRoom.get(roomId)?.values() || []),
        files: fileSystemStore.getTree(),
        allFileObjects: fileSystemStore.getAllFiles(),
        repos: githubService.getRepos(),
        commits: fileSystemStore.getCommits(),
        availableAgents: AVAILABLE_AGENTS,
        hasApiKey: !!agentEngine.getApiKey()
      }
    });
  }

  private async triggerAgentHandoffChain(
    agents: ReturnType<typeof agentEngine.detectMentions>,
    triggerMessage: Message,
    roomId: string,
    depth: number = 0
  ) {
    const MAX_HANDOFF_DEPTH = 3;
    if (depth >= MAX_HANDOFF_DEPTH) return;

    const roomMsgs = this.messagesByRoom.get(roomId) || [];

    for (const agent of agents) {
      if (triggerMessage.sender.role === 'agent' && triggerMessage.sender.handle === agent.handle) {
        continue;
      }

      const finalAgentMsg = await agentEngine.processAgentResponse(
        agent,
        triggerMessage,
        roomMsgs,
        (partialMsg) => {
          this.broadcastToRoom(roomId, {
            type: 'AGENT_STREAM_UPDATE',
            payload: { message: partialMsg }
          });
          this.broadcastToRoom(roomId, {
            type: 'WORKSPACE_FILES_UPDATE',
            payload: {
              files: fileSystemStore.getTree(),
              allFileObjects: fileSystemStore.getAllFiles(),
              commits: fileSystemStore.getCommits()
            }
          });
        }
      );

      roomMsgs.push(finalAgentMsg);
      this.messagesByRoom.set(roomId, roomMsgs);

      // Detect agent-to-agent mentions in the output content
      const nextAgents = agentEngine.detectMentions(finalAgentMsg.content).filter(a => a.handle !== agent.handle);
      if (nextAgents.length > 0) {
        console.log(`🔄 Agent Handoff Chain (Depth ${depth + 1}): ${agent.handle} -> ${nextAgents.map(a => a.handle).join(', ')}`);
        this.triggerAgentHandoffChain(nextAgents, finalAgentMsg, roomId, depth + 1);
      }
    }
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

              if (!this.activeUsersByRoom.has(roomId)) {
                this.activeUsersByRoom.set(roomId, new Map());
              }
              const roomUsers = this.activeUsersByRoom.get(roomId)!;
              roomUsers.set(user.id, user);

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

              this.broadcastToRoom(roomId, {
                type: 'USER_PRESENCE_UPDATE',
                payload: { activeUsers: Array.from(roomUsers.values()) }
              });
              break;
            }

            case 'SEND_MESSAGE': {
              const { message } = payload as { message: Message };
              const roomId = message.roomId || 'room-dev-1';

              const roomMsgs = this.messagesByRoom.get(roomId) || [];
              roomMsgs.push(message);
              this.messagesByRoom.set(roomId, roomMsgs);

              this.broadcastToRoom(roomId, {
                type: 'NEW_MESSAGE',
                payload: { message }
              });

              // Check for agent mentions & trigger handoff chain
              const mentionedAgents = agentEngine.detectMentions(message.content);
              if (mentionedAgents.length > 0) {
                this.triggerAgentHandoffChain(mentionedAgents, message, roomId, 0);
              }
              break;
            }

            case 'TYPING_STATUS': {
              const { roomId, isTyping } = payload;
              if (clientConnection) {
                this.broadcastToRoom(roomId, {
                  type: 'USER_TYPING',
                  payload: {
                    user: clientConnection.user,
                    isTyping
                  }
                }, ws);
              }
              break;
            }

            case 'CREATE_FILE': {
              const { path, content, author } = payload;
              fileSystemStore.updateFile(path, content || '', author || clientConnection?.user.name || 'User');
              this.broadcastToRoom(payload.roomId || 'room-dev-1', {
                type: 'WORKSPACE_FILES_UPDATE',
                payload: {
                  files: fileSystemStore.getTree(),
                  allFileObjects: fileSystemStore.getAllFiles(),
                  commits: fileSystemStore.getCommits()
                }
              });
              break;
            }

            case 'UPDATE_FILE': {
              const { path, content, author } = payload;
              fileSystemStore.updateFile(path, content, author || clientConnection?.user.name || 'User');
              this.broadcastToRoom(payload.roomId || 'room-dev-1', {
                type: 'WORKSPACE_FILES_UPDATE',
                payload: {
                  files: fileSystemStore.getTree(),
                  allFileObjects: fileSystemStore.getAllFiles(),
                  commits: fileSystemStore.getCommits()
                }
              });
              break;
            }

            case 'DELETE_FILE': {
              const { path } = payload;
              fileSystemStore.deleteFile(path);
              this.broadcastToRoom(payload.roomId || 'room-dev-1', {
                type: 'WORKSPACE_FILES_UPDATE',
                payload: {
                  files: fileSystemStore.getTree(),
                  allFileObjects: fileSystemStore.getAllFiles(),
                  commits: fileSystemStore.getCommits()
                }
              });
              break;
            }

            case 'CONNECT_REPO': {
              const { owner, repo } = payload as GitHubRepo;
              await githubService.fetchRepoDetails(owner, repo);
              this.broadcastToRoom(payload.roomId || 'room-dev-1', {
                type: 'REPOS_UPDATE',
                payload: { repos: githubService.getRepos() }
              });
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
