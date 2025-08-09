import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface UseWebSocketOptions {
  userId?: string;
  sessionId?: string;
  onMessage?: (message: WebSocketMessage) => void;
  onTyping?: (isTyping: boolean, userId?: string) => void;
}

export const useWebSocket = ({ userId, sessionId, onMessage, onTyping }: UseWebSocketOptions) => {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    if (!userId) return;

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        setConnected(true);
        setError(null);
        
        // Authenticate
        if (userId && sessionId) {
          ws.current?.send(JSON.stringify({
            type: 'authenticate',
            token: userId, // In production, use actual JWT token
            sessionId
          }));
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'typing' && onTyping) {
            onTyping(message.isTyping, message.userId);
          } else if (onMessage) {
            onMessage(message);
          }
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        setConnected(false);
        
        // Attempt to reconnect after 3 seconds
        if (userId) {
          reconnectTimeout.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      ws.current.onerror = (error) => {
        setError('WebSocket connection failed');
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      setError('Failed to create WebSocket connection');
      console.error('WebSocket creation error:', error);
    }
  };

  const disconnect = () => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    
    setConnected(false);
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  const sendTyping = (isTyping: boolean) => {
    sendMessage({
      type: 'typing',
      isTyping
    });
  };

  useEffect(() => {
    if (userId && sessionId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [userId, sessionId]);

  return {
    connected,
    error,
    sendMessage,
    sendTyping,
    connect,
    disconnect
  };
};
