import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  sessionId?: string;
}

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<string, AuthenticatedWebSocket[]> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws',
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
  }

  private verifyClient(info: any): boolean {
    // In production, verify JWT token from query params or headers
    return true;
  }

  private handleConnection(ws: AuthenticatedWebSocket, request: any) {
    console.log('New WebSocket connection');

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        this.handleMessage(ws, data);
      } catch (error) {
        console.error('Invalid message format:', error);
      }
    });

    ws.on('close', () => {
      this.removeClient(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.removeClient(ws);
    });
  }

  private handleMessage(ws: AuthenticatedWebSocket, data: any) {
    switch (data.type) {
      case 'authenticate':
        this.authenticateClient(ws, data.token, data.sessionId);
        break;
      case 'typing':
        this.broadcastToSession(ws.sessionId!, {
          type: 'typing',
          userId: ws.userId,
          isTyping: data.isTyping
        }, ws);
        break;
      case 'message':
        this.broadcastToSession(ws.sessionId!, {
          type: 'message',
          message: data.message
        });
        break;
    }
  }

  private authenticateClient(ws: AuthenticatedWebSocket, token: string, sessionId: string) {
    try {
      // In production, verify JWT token
      // const payload = jwt.verify(token, process.env.JWT_SECRET!);
      // ws.userId = payload.userId;
      
      // For now, extract from token (in real app, decode JWT)
      ws.userId = token; // This should be the actual user ID
      ws.sessionId = sessionId;
      
      this.addClient(ws);
      
      ws.send(JSON.stringify({
        type: 'authenticated',
        success: true
      }));
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'authentication_error',
        error: 'Invalid token'
      }));
      ws.close();
    }
  }

  private addClient(ws: AuthenticatedWebSocket) {
    if (!ws.sessionId) return;
    
    if (!this.clients.has(ws.sessionId)) {
      this.clients.set(ws.sessionId, []);
    }
    
    this.clients.get(ws.sessionId)!.push(ws);
  }

  private removeClient(ws: AuthenticatedWebSocket) {
    if (!ws.sessionId) return;
    
    const sessionClients = this.clients.get(ws.sessionId);
    if (sessionClients) {
      const index = sessionClients.indexOf(ws);
      if (index > -1) {
        sessionClients.splice(index, 1);
      }
      
      if (sessionClients.length === 0) {
        this.clients.delete(ws.sessionId);
      }
    }
  }

  private broadcastToSession(sessionId: string, message: any, exclude?: AuthenticatedWebSocket) {
    const sessionClients = this.clients.get(sessionId);
    if (!sessionClients) return;

    const messageStr = JSON.stringify(message);
    
    sessionClients.forEach(client => {
      if (client !== exclude && client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  public sendToUser(userId: string, message: any) {
    const messageStr = JSON.stringify(message);
    
    this.clients.forEach(sessionClients => {
      sessionClients.forEach(client => {
        if (client.userId === userId && client.readyState === WebSocket.OPEN) {
          client.send(messageStr);
        }
      });
    });
  }

  public sendToSession(sessionId: string, message: any) {
    this.broadcastToSession(sessionId, message);
  }
}

export let websocketService: WebSocketService;

export const initializeWebSocket = (server: Server) => {
  websocketService = new WebSocketService(server);
  return websocketService;
};
