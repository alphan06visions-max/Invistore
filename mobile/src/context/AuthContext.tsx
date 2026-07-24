import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';
import { streamClient } from '../api/streamClient';

type User = { id: string; username: string; email: string; avatar?: string; bio?: string };
type AuthCtx = {
  user: User | null; loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, username: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('nexus_token');
        const u = await AsyncStorage.getItem('nexus_user');
        if (token && u) { const p = JSON.parse(u); setUser(p); await connect(p); }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const connect = async (u: User) => {
    try {
      const { token } = await api.getStreamToken();
      await streamClient.connectUser({ id: u.id, name: u.username, image: u.avatar }, token);
      await AsyncStorage.setItem('nexus_stream_token', token);
    } catch (e) { console.warn('Stream:', e); }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const d = await api.login(email, password);
      const u: User = { id: d.user.id, username: d.user.username, email: d.user.email, avatar: d.user.avatar||'', bio: d.user.bio||'' };
      await AsyncStorage.setItem('nexus_token', d.token); await AsyncStorage.setItem('nexus_user', JSON.stringify(u));
      await connect(u); setUser(u); return {};
    } catch (e: any) { return { error: e.message }; }
  };

  const signUp = async (email: string, username: string, password: string) => {
    try {
      const d = await api.register(email, username, password);
      const u: User = { id: d.user.id, username: d.user.username, email: d.user.email, avatar: d.user.avatar||'', bio: d.user.bio||'' };
      await AsyncStorage.setItem('nexus_token', d.token); await AsyncStorage.setItem('nexus_user', JSON.stringify(u));
      await connect(u); setUser(u); return {};
    } catch (e: any) { return { error: e.message }; }
  };

  const signOut = async () => {
    try { await streamClient.disconnectUser(); } catch {}
    await AsyncStorage.multiRemove(['nexus_token', 'nexus_user', 'nexus_stream_token']);
    setUser(null);
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user) return; const u = { ...user, ...data }; setUser(u);
    await AsyncStorage.setItem('nexus_user', JSON.stringify(u));
  };

  return <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updateUser }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
