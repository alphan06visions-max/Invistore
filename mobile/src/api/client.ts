// Friðr API client — REST calls to Go backend
import AsyncStorage from '@react-native-async-storage/async-storage';
const BASE_URL = 'https://memoria-kthh.onrender.com';

async function authHeaders(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem('nexus_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function _req(path: string, options: RequestInit = {}) {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers: { ...headers, ...options.headers } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  request: _req,
  feed: () => _req('/api/posts'),
  search: (q: string) => _req(`/api/users/search?q=${encodeURIComponent(q)}`),
  profile: (u: string) => _req(`/api/users/${u}`),
  post: (id: string) => _req(`/api/posts/${id}`),
  comments: (id: string) => _req(`/api/posts/${id}/comments`),
  userPosts: (u: string) => _req(`/api/users/${u}/posts`),
  toggleLike: (id: string) => _req(`/api/posts/${id}/like`, { method: 'POST' }),
  addComment: (id: string, c: string) => _req(`/api/posts/${id}/comments`, { method: 'POST', body: JSON.stringify({ content: c }) }),
  createPost: (image_url: string, caption?: string, location?: string) =>
    _req('/api/posts', { method: 'POST', body: JSON.stringify({ image_url, caption: caption || '', location: location || '' }) }),
  toggleFollow: (u: string) => _req(`/api/users/${u}/follow`, { method: 'POST' }),
  notifications: () => _req('/api/notifications'),
  upload: async (uri: string) => {
    const fd = new FormData(); fd.append('file', { uri, name: 'photo.jpg', type: 'image/jpeg' } as any);
    const token = await AsyncStorage.getItem('nexus_token');
    const res = await fetch(`${BASE_URL}/api/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
    const d = await res.json(); if (!res.ok) throw new Error(d.error); return d;
  },
  uploadImage: async (uri: string) => {
    const fd = new FormData(); fd.append('file', { uri, name: 'photo.jpg', type: 'image/jpeg' } as any);
    const token = await AsyncStorage.getItem('nexus_token');
    const res = await fetch(`${BASE_URL}/api/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
    const d = await res.json(); if (!res.ok) throw new Error(d.error); return d;
  },
  register: (email: string, username: string, password: string) =>
    _req('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, username, password }) }),
  login: (email: string, password: string) =>
    _req('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getStreamToken: async () => {
    const token = await AsyncStorage.getItem('nexus_token');
    const res = await fetch(`${BASE_URL}/api/stream/token`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }});
    const d = await res.json(); if (!res.ok) throw new Error(d.error); return d;
  },
};
export const BASE_URL_CONST = BASE_URL;
