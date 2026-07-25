import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { connectStreamUser, disconnectStreamUser, streamClient } from '../api/streamClient';

export type MemoriaUser = { id: string; name: string };
type AuthCtx = {
  user: MemoriaUser | null;
  loading: boolean;
  signIn: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MemoriaUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('memoria_user');
        if (raw) {
          const u: MemoriaUser = JSON.parse(raw);
          const token = await AsyncStorage.getItem('memoria_token');
          if (token) {
            await streamClient.connectUser(
              { id: u.id, name: u.name, image: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=6366f1&color=fff&size=200&bold=true` },
              token
            );
          }
          setUser(u);
        }
      } catch (e) { console.warn('Auth restore:', e); }
      setLoading(false);
    })();
  }, []);

  const signIn = async (name: string) => {
    const id = `user-${name.toLowerCase().replace(/[^a-z0-9]/g,'')}-${Date.now().toString(36)}`;
    await connectStreamUser(id, name);
    setUser({ id, name });
  };

  const signOut = async () => {
    await disconnectStreamUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
