// Get backend URL from the backendService module
const BACKEND_URL = 'http://localhost:3002';

// WebSocket service for real-time communication with the backend
class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectInterval = 5000; // 5 seconds
  private reconnectTimer: number | null = null;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();

  constructor() {
    this.connect();
  }

  connect() {
    const wsUrl = `${BACKEND_URL.replace('http', 'ws')}`;
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.subscribe('video_generated');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.scheduleReconnect();
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      return;
    }
    
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectInterval);
  }

  private handleMessage(data: any) {
    const type = data.type;
    
    if (type && this.listeners.has(type)) {
      this.listeners.get(type)?.forEach(callback => {
        callback(data);
      });
    }
  }

  private subscribe(channel: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'subscribe', channel }));
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  off(event: string, callback: (data: any) => void) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  close() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Create a singleton instance
export const webSocketService = new WebSocketService();