import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';

type User = { id: string; username: string; email: string; bio: string; avatar: string };

type Ctx = {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (u: Partial<User>) => void;
};

const AuthContext = createContext<Ctx>({} as Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem('nexus_token');
      const u = await AsyncStorage.getItem('nexus_user');
      if (t && u) {
        setToken(t);
        setUser(JSON.parse(u));
      }
      setLoading(false);
    })();
  }, []);

  const signIn = async (email: string, password: string) => {
    const res = await api.login(email, password);
    await AsyncStorage.setItem('nexus_token', res.token);
    await AsyncStorage.setItem('nexus_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
  };

  const signUp = async (email: string, username: string, password: string) => {
    const res = await api.register(email, username, password);
    await AsyncStorage.setItem('nexus_token', res.token);
    await AsyncStorage.setItem('nexus_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
  };

  const signOut = async () => {
    await AsyncStorage.multiRemove(['nexus_token', 'nexus_user']);
    setToken(null);
    setUser(null);
  };

  const updateUser = (u: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...u };
      setUser(updated);
      AsyncStorage.setItem('nexus_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signUp, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
