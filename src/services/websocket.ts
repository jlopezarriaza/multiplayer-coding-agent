import { User, Message } from '../types/index.js';

export type WebSocketListener = (event: string, payload: any) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private listeners: Set<WebSocketListener> = new Set();
  private reconnectTimer: any = null;
  private currentUser: User | null = null;
  private currentRoomId: string = 'room-dev-1';

  public connect(user: User, roomId: string = 'room-dev-1') {
    // Avoid creating duplicate WebSocket connections if already connected with same user & room
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) &&
      this.currentUser?.id === user.id &&
      this.currentRoomId === roomId
    ) {
      return;
    }

    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
    }

    this.currentUser = user;
    this.currentRoomId = roomId;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('🔌 Connected to Multiplayer Agent WebSocket Server');
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

      // Join room
      this.send('JOIN_ROOM', { user, roomId });
      this.notifyListeners('CONNECTED', { connected: true });
    };

    this.ws.onmessage = (event) => {
      try {
        const packet = JSON.parse(event.data);
        this.notifyListeners(packet.type, packet.payload);
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    this.ws.onclose = () => {
      console.warn('⚠️ WebSocket connection closed. Attempting reconnect in 3s...');
      this.notifyListeners('CONNECTED', { connected: false });
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => {
        if (this.currentUser) {
          this.connect(this.currentUser, this.currentRoomId);
        }
      }, 3000);
    };

    this.ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };
  }

  public subscribe(listener: WebSocketListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(event: string, payload: any) {
    for (const listener of this.listeners) {
      listener(event, payload);
    }
  }

  public send(type: string, payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  public sendMessage(message: Message) {
    this.send('SEND_MESSAGE', { message });
  }

  public updateFile(path: string, content: string, user: User) {
    this.send('UPDATE_FILE', { path, content, user });
  }

  public addRepo(owner: string, repo: string) {
    this.send('ADD_GITHUB_REPO', { owner, repo });
  }

  public setApiKey(apiKey: string) {
    this.send('SET_API_KEY', { apiKey });
  }

  public sendTypingStatus(user: User, isTyping: boolean) {
    this.send('TYPING_STATUS', { user, isTyping });
  }
}

export const wsClient = new WebSocketClient();
