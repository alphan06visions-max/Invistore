// API client — Supabase for chat/auth, REST fallback for posts/calls
import { supabase } from './supabase';

// ---------- Supabase Messages (Realtime) ----------

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

export type Conversation = {
  id: string;
  participants: string[];
  last_message: string | null;
  last_message_at: string | null;
  other_user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  } | null;
};

export const db = {
  // Conversations
  conversations: async (userId: string) => {
    // Get all conversations where user is a participant
    const { data } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);
    if (!data) return [];
    const ids = data.map((d) => d.conversation_id);

    const { data: convos } = await supabase
      .from('conversations')
      .select('*')
      .in('id', ids)
      .order('last_message_at', { ascending: false });
    return (convos || []) as Conversation[];
  },

  // Messages thread
  thread: async (conversationId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    return (data || []) as Message[];
  },

  // Send message
  sendMessage: async (conversationId: string, senderId: string, content: string) => {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
      })
      .select()
      .single();
    if (error) throw error;
    return data as Message;
  },

  // Mark messages as read
  markRead: async (conversationId: string, userId: string) => {
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .is('read_at', null);
  },

  // Get or create 1-1 conversation
  getOrCreateConversation: async (userId: string, otherUserId: string) => {
    // Check existing
    const { data: myConvos } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);
    const myIds = (myConvos || []).map((c) => c.conversation_id);

    if (myIds.length > 0) {
      const { data: shared } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', otherUserId)
        .in('conversation_id', myIds);
      if (shared && shared.length > 0) return shared[0].conversation_id;
    }

    // Create new
    const { data: conv } = await supabase
      .from('conversations')
      .insert({ is_group: false })
      .select()
      .single();
    if (!conv) throw new Error('Failed to create conversation');

    // Add participants
    await supabase.from('conversation_participants').insert([
      { conversation_id: conv.id, user_id: userId },
      { conversation_id: conv.id, user_id: otherUserId },
    ]);

    return conv.id;
  },

  // Realtime subscription
  subscribeToMessages: (
    conversationId: string,
    onInsert: (msg: Message) => void,
    onUpdate: (msg: Message) => void,
  ) => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => onInsert(payload.new as Message),
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => onUpdate(payload.new as Message),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Typing indicator via Supabase Presence (simplified)
  subscribeTyping: (
    conversationId: string,
    userId: string,
    onTyping: (userId: string) => void,
  ) => {
    const channel = supabase.channel(`typing:${conversationId}`, {
      config: { presence: { key: userId } },
    });
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      Object.keys(state).forEach((key) => {
        if (key !== userId) onTyping(key);
      });
    });
    channel.subscribe();
    return channel;
  },

  sendTyping: (channel: any) => {
    channel.track({ typing: true });
  },
};
