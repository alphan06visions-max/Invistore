// ChatThreadScreen — Supabase Realtime + design immersif cinématique
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, Image,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Send, CheckCheck, Check, Phone, Video } from '../components/icons';
import { db, Message, Conversation } from '../api/client';
import { supabase } from '../api/supabase';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { channelForUsers, startCall, startVideoCall } from '../components/callUtils';

export function ChatThreadScreen({ route, navigation }: any) {
  const { conversationId, otherUser } = route.params;
  const { user: me } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherTyping, setOtherTyping] = useState(false);
  const listRef = useRef<FlatList<any>>(null);
  const typingChannelRef = useRef<any>(null);

  // Load messages
  useEffect(() => {
    (async () => {
      setLoading(true);
      const msgs = await db.thread(conversationId);
      setMessages(msgs);
      setLoading(false);
      // Mark as read
      if (me) await db.markRead(conversationId, me.id);
    })();
  }, [conversationId]);

  // Realtime subscription
  useEffect(() => {
    if (!me) return;
    const unsub = db.subscribeToMessages(
      conversationId,
      (msg) => {
        // New message
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        // Auto mark read
        if (msg.sender_id !== me.id) db.markRead(conversationId, me.id);
      },
      (msg) => {
        // Updated (e.g., read receipt)
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, ...msg } : m)));
      },
    );

    // Typing presence
    const typingChannel = db.subscribeTyping(conversationId, me.id, (uid) => {
      if (uid !== me.id) {
        setOtherTyping(true);
        setTimeout(() => setOtherTyping(false), 3000);
      }
    });
    typingChannelRef.current = typingChannel;

    return () => {
      unsub();
      if (typingChannelRef.current) supabase.removeChannel(typingChannelRef.current);
    };
  }, [conversationId, me]);

  // Scroll to bottom on new messages
  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages.length]);

  const send = async () => {
    const content = input.trim();
    if (!content || !me) return;
    setInput('');
    try {
      await db.sendMessage(conversationId, me.id, content);
    } catch (e) {
      console.error('Send failed:', e);
    }
  };

  const handleTyping = (text: string) => {
    setInput(text);
    if (typingChannelRef.current) db.sendTyping(typingChannelRef.current);
  };

  if (!otherUser) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0a0a0a' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      {/* Immersive gradient background */}
      <LinearGradient
        colors={['#0d1117', '#0a1628', '#0d0a06']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile', { key: otherUser.username })}
          style={styles.headerUser}
        >
          {otherUser.avatar_url ? (
            <Image source={{ uri: otherUser.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {(otherUser.display_name || otherUser.username || '?')[0].toUpperCase()}
              </Text>
            </View>
          )}
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.username}>{otherUser.display_name || otherUser.username}</Text>
            <Text style={styles.status}>
              {otherTyping ? 'typing…' : 'online'}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={() => me && startCall(otherUser.username, otherUser.id, navigation, () => {}, me.id)}
            style={styles.callBtn}
          >
            <Phone size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => me && startVideoCall(otherUser.username, otherUser.id, navigation, () => {}, me.id)}
            style={styles.callBtn}
          >
            <Video size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
          renderItem={({ item }) => {
            const mine = item.sender_id === me?.id;
            return (
              <View style={[styles.bubbleRow, mine ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
                <View
                  style={[
                    styles.bubble,
                    mine ? styles.bubbleMine : styles.bubbleTheirs,
                  ]}
                >
                  <Text style={styles.bubbleText}>{item.content}</Text>
                  <View style={styles.bubbleMeta}>
                    <Text style={styles.timeText}>
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {mine && (
                      item.read_at
                        ? <CheckCheck size={12} color="rgba(255,255,255,0.7)" />
                        : <Check size={12} color="rgba(255,255,255,0.4)" />
                    )}
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Composer */}
      <View style={styles.composer}>
        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={handleTyping}
            placeholder="Message…"
            placeholderTextColor="rgba(255,255,255,0.35)"
            style={styles.input}
            multiline
          />
          <TouchableOpacity onPress={send} style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]} disabled={!input.trim()}>
            <Send size={18} color={input.trim() ? '#0a0a0a' : 'rgba(255,255,255,0.3)'} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerBtn: { padding: 6, borderRadius: 20 },
  headerUser: { flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 6 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  username: { color: '#fff', fontSize: 15, fontWeight: '600' },
  status: { color: '#4ade80', fontSize: 11, marginTop: 1 },
  callBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  bubbleRow: { flexDirection: 'row', marginVertical: 3 },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  bubbleMine: {
    backgroundColor: 'rgba(59,130,246,0.25)',
    borderBottomRightRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
  },
  bubbleTheirs: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  bubbleText: { color: 'rgba(255,255,255,0.92)', fontSize: 15, lineHeight: 21 },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 3,
  },
  timeText: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
  composer: {
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    maxHeight: 120,
    paddingVertical: Platform.OS === 'ios' ? 6 : 2,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.1)' },
});
