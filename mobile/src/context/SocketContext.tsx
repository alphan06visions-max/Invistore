import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

type WSCtx = {
  connected: boolean;
  send: (msg: any) => void;
  subscribe: (cb: (msg: any) => void) => () => void;
};

const defaults: WSCtx = {
  connected: false,
  send: () => {},
  subscribe: () => () => {},
};

const SocketContext = createContext<WSCtx>(defaults);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Set<(msg: any) => void>>(new Set());
  const reconnectTimer = useRef<any>(null);

  const connect = useCallback(() => {
    if (!token) return;
    const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'wss://nexus-backend.fly.dev/ws';
    const ws = new WebSocket(`${WS_URL}?token=${token}`);

    ws.onopen = () => {
      setConnected(true);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        listenersRef.current.forEach((cb) => cb(msg));
      } catch {}
    };

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => ws.close();
    wsRef.current = ws;
  }, [token]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((msg: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const subscribe = useCallback((cb: (msg: any) => void) => {
    listenersRef.current.add(cb);
    return () => { listenersRef.current.delete(cb); };
  }, []);

  return (
    <SocketContext.Provider value={{ connected, send, subscribe }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
