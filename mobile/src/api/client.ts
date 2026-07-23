import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE = process.env.EXPO_PUBLIC_API_URL || 'https://nexus-backend.fly.dev';
const WS_BASE = process.env.EXPO_PUBLIC_WS_URL || 'wss://nexus-backend.fly.dev/ws';

async function token() {
  return await AsyncStorage.getItem('nexus_token');
}

async function headers() {
  const t = await token();
  return {
    'Content-Type': 'application/json',
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  };
}

async function handle(res: Response) {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || res.statusText);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  // Auth
  register: (email: string, username: string, password: string) =>
    fetch(`${BASE}/api/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password }),
    }).then(handle),

  login: (email: string, password: string) =>
    fetch(`${BASE}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(handle),

  // Posts
  feed: () =>
    fetch(`${BASE}/api/posts`, { headers: headers() as any }).then(handle),

  post: (id: string) =>
    fetch(`${BASE}/api/posts/${id}`, { headers: headers() as any }).then(handle),

  createPost: (imageUrl: string, caption: string, location: string) => {
    const form = new FormData();
    form.append('image_url', imageUrl);
    form.append('caption', caption);
    form.append('location', location);
    return fetch(`${BASE}/api/posts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token()}` },
      body: form,
    }).then(handle);
  },

  toggleLike: (postId: string) =>
    fetch(`${BASE}/api/posts/${postId}/like`, {
      method: 'POST', headers: headers() as any,
    }).then(handle),

  comments: (postId: string) =>
    fetch(`${BASE}/api/posts/${postId}/comments`, { headers: headers() as any }).then(handle),

  addComment: (postId: string, content: string) =>
    fetch(`${BASE}/api/posts/${postId}/comments`, {
      method: 'POST', headers: headers() as any,
      body: JSON.stringify({ content }),
    }).then(handle),

  // Stories
  stories: () =>
    fetch(`${BASE}/api/stories`, { headers: headers() as any }).then(handle),

  createStory: (mediaUrl: string) => {
    const form = new FormData();
    form.append('media_url', mediaUrl);
    return fetch(`${BASE}/api/stories`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token()}` },
      body: form,
    }).then(handle);
  },

  // Users
  search: (q: string) =>
    fetch(`${BASE}/api/users/search?q=${encodeURIComponent(q)}`, { headers: headers() as any }).then(handle),

  profile: (username: string) =>
    fetch(`${BASE}/api/users/${username}`, { headers: headers() as any }).then(handle),

  userPosts: (username: string) =>
    fetch(`${BASE}/api/users/${username}/posts`, { headers: headers() as any }).then(handle),

  toggleFollow: (username: string) =>
    fetch(`${BASE}/api/users/${username}/follow`, {
      method: 'POST', headers: headers() as any,
    }).then(handle),

  updateProfile: (bio: string, avatar: string) =>
    fetch(`${BASE}/api/users/me`, {
      method: 'PUT', headers: headers() as any,
      body: JSON.stringify({ bio, avatar }),
    }).then(handle),

  // Messages
  sendMessage: (to: string, content: string) =>
    fetch(`${BASE}/api/messages`, {
      method: 'POST', headers: headers() as any,
      body: JSON.stringify({ to, content }),
    }).then(handle),

  thread: (userId: string) =>
    fetch(`${BASE}/api/messages/${userId}`, { headers: headers() as any }).then(handle),

  conversations: () =>
    fetch(`${BASE}/api/conversations`, { headers: headers() as any }).then(handle),

  markRead: (userId: string) =>
    fetch(`${BASE}/api/messages/${userId}/read`, {
      method: 'POST', headers: headers() as any,
    }).then(handle),

  // Notifications
  notifications: () =>
    fetch(`${BASE}/api/notifications`, { headers: headers() as any }).then(handle),

  // Upload
  upload: async (uri: string) => {
    const t = await token();
    const form = new FormData();
    const filename = uri.split('/').pop() || 'photo.jpg';
    const ext = filename.split('.').pop()?.toLowerCase();
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    form.append('file', { uri, name: filename, type: mime } as any);
    const res = await fetch(`${BASE}/api/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}` },
      body: form,
    });
    return handle(res);
  },

  getToken: token,
  getWSURL: () => `${WS_BASE}?token=${AsyncStorage.getItem('nexus_token')}`,

  // Agora calls
  getCallToken: (channelName: string) =>
    fetch(`${BASE}/api/call/token`, {
      method: 'POST',
      headers: headers() as any,
      body: JSON.stringify({ channelName }),
    }).then(handle),
};
