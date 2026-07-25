import { StreamChat } from 'stream-chat';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const STREAM_KEY = 'tdkqnce9zrxw';
const STREAM_SECRET = 'gjgexvaptnrhsfwy28zcusqrvdddztetbhcnjx7kjakcbtyjch4gyjp2xqhs76yv';
export const streamClient = StreamChat.getInstance(STREAM_KEY);

export function generateStreamToken(userId: string): string {
  // Simple HMAC-like token for dev mode using Stream's secret
  // For production, tokens should be generated server-side
  const header = { typ: 'JWT', alg: 'HS256' };
  const payload = { user_id: userId };
  const enc = (obj: any) => btoa(JSON.stringify(obj)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const hb = enc(header) + '.' + enc(payload);
  
  // Use a simple method — Stream Chat supports dev tokens with secret
  // In dev mode, we'll use the guest token approach
  return streamClient.devToken(userId);
}

export async function connectStreamUser(userId: string, name: string): Promise<void> {
  const token = streamClient.devToken(userId);
  await streamClient.connectUser(
    {
      id: userId,
      name: name,
      image: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=200&bold=true`,
    },
    token
  );
  await AsyncStorage.setItem('memoria_user', JSON.stringify({ id: userId, name }));
  await AsyncStorage.setItem('memoria_token', token);
}

export async function disconnectStreamUser(): Promise<void> {
  await streamClient.disconnectUser();
  await AsyncStorage.multiRemove(['memoria_user', 'memoria_token']);
}
