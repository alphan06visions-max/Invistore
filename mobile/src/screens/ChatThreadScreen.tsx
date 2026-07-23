// Chat en temps réel — WebSocket + fallback REST
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, Image, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { ChevronLeft, Send, CheckCheck, Check, Phone, Video } from '../components/icons';
import { api } from '../api/client';
import { theme } from '../theme';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { timeAgo } from '../components/util';
import { startCall, startVideoCall } from '../components/callUtils';

type Msg = { id: string; from_user: string; to_user: string; content: string; created_at: string; read_at?: string | null; optimistic?: boolean };

export function ChatThreadScreen({ route, navigation }: any) {
  const { userId, username, avatar } = route.params;
  const { user: me } = useAuth();
  const { send, subscribe, connected } = useSocket();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherTyping, setOtherTyping] = useState(false);
  const typingTimer = useRef<any>(null);
  const listRef = useRef<FlatList<any>>(null);

  const load = useCallback(async () => { try { const list = await api.thread(userId); setMessages(list); } catch {} }, [userId]);

  useEffect(() => {
    (async () => { setLoading(true); await load(); setLoading(false); send({ type: 'read', to: userId }); })();
  }, [load, send, userId]);

  useEffect(() => {
    const off = subscribe((msg: any) => {
      if (msg.type === 'message' && msg.from === userId) {
        setMessages((prev) => [...prev, { id: msg.id || 'm-' + Date.now(), from_user: msg.from, to_user: msg.to, content: msg.content, created_at: msg.created_at || new Date().toISOString() }]);
        send({ type: 'read', to: userId }); setOtherTyping(false);
      } else if (msg.type === 'message_sent' && msg.to === userId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          const idx = prev.findIndex((m) => m.optimistic && m.content === msg.content);
          if (idx >= 0) { const copy = [...prev]; copy[idx] = { id: msg.id, from_user: me!.id, to_user: msg.to, content: msg.content, created_at: msg.created_at }; return copy; }
          return [...prev, { id: msg.id, from_user: me!.id, to_user: msg.to, content: msg.content, created_at: msg.created_at }];
        });
      } else if (msg.type === 'typing' && msg.from === userId) {
        setOtherTyping(true); if (typingTimer.current) clearTimeout(typingTimer.current); typingTimer.current = setTimeout(() => setOtherTyping(false), 3000);
      } else if (msg.type === 'read' && msg.from === userId) {
        setMessages((prev) => prev.map((m) => (m.from_user === me!.id ? { ...m, read_at: new Date().toISOString() } : m)));
      }
    });
    return off;
  }, [subscribe, userId, send, me]);

  useEffect(() => { setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50); }, [messages.length]);

  async function submit() {
    const content = input.trim(); if (!content) return;
    setInput(''); const tempId = 'tmp-' + Date.now();
    setMessages((prev) => [...prev, { id: tempId, from_user: me!.id, to_user: userId, content, created_at: new Date().toISOString(), optimistic: true }]);
    if (connected) { send({ type: 'message', to: userId, content }); }
    else {
      try { const res: any = await api.sendMessage(userId, content); setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, id: res.id, created_at: res.created_at, optimistic: false } : m))); }
      catch { setMessages((prev) => prev.filter((m) => m.id !== tempId)); }
    }
  }

  function handleTyping(text: string) { setInput(text); send({ type: 'typing', to: userId }); }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ChevronLeft size={26} color={theme.colors.foreground} /></TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Profile', { key: username })} style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 8 }}>
          <Image source={{ uri: avatar }} style={{ width: 34, height: 34, borderRadius: 17 }} />
          <View style={{ marginLeft: 10 }}><Text style={styles.username}>{username}</Text><Text style={styles.status}>{otherTyping ? 'typing…' : connected ? 'live' : 'connecting…'}</Text></View>
        </TouchableOpacity>
        {/* Call buttons */}
        <TouchableOpacity
          onPress={() => startCall(username, userId, navigation, send, me?.id)}
          style={{ marginRight: 10 }}
        >
          <Phone size={22} color={theme.colors.primaryGlow} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => startVideoCall(username, userId, navigation, send, me?.id)}
        >
          <Video size={22} color={theme.colors.primaryGlow} />
        </TouchableOpacity>
      </View>

      {loading ? (<View style={{ padding: 40, alignItems: 'center' }}><ActivityIndicator color={theme.colors.primary} /></View>) : (
        <FlatList ref={listRef} data={messages} keyExtractor={(m) => m.id} contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
          renderItem={({ item, index }) => {
            const mine = item.from_user === me?.id;
            const prev = messages[index - 1];
            const showTime = !prev || (new Date(item.created_at).getTime() - new Date(prev.created_at).getTime() > 10 * 60 * 1000);
            return (
              <View>
                {showTime && <Text style={styles.divider}>{timeAgo(item.created_at).toUpperCase()}</Text>}
                <View style={[styles.bubbleRow, mine ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
                  <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                    <Text style={[styles.bubbleText, mine ? { color: theme.colors.white } : { color: theme.colors.foreground }]}>{item.content}</Text>
                    {mine && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 }}>
                        {item.read_at ? <CheckCheck size={12} color="rgba(255,255,255,0.75)" /> : <Check size={12} color="rgba(255,255,255,0.6)" />}
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      <View style={styles.inputRow}>
        <TextInput value={input} onChangeText={handleTyping} placeholder="Whisper something…" placeholderTextColor={theme.colors.muted} style={styles.input} multiline />
        <TouchableOpacity onPress={submit} style={styles.sendBtn} disabled={!input.trim()}>
          <Send size={20} color={input.trim() ? theme.colors.white : theme.colors.muted} style={{ transform: [{ rotate: '-12deg' }] }} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  username: { color: theme.colors.foreground, fontFamily: theme.fonts.bodySemi, fontSize: 15 },
  status: { color: theme.colors.primaryGlow, fontFamily: theme.fonts.body, fontSize: 11, marginTop: 1 },
  divider: { textAlign: 'center', color: theme.colors.muted, fontSize: 10, letterSpacing: 3, marginVertical: 12 },
  bubbleRow: { flexDirection: 'row', marginVertical: 2 },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  bubbleMine: { backgroundColor: theme.colors.primary, borderBottomRightRadius: 6 },
  bubbleTheirs: { backgroundColor: theme.colors.surfaceElevated, borderBottomLeftRadius: 6 },
  bubbleText: { fontFamily: theme.fonts.body, fontSize: 15, lineHeight: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border, backgroundColor: theme.colors.background },
  input: { flex: 1, backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 22, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 12 : 8, color: theme.colors.foreground, fontFamily: theme.fonts.body, fontSize: 15, maxHeight: 120 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary },
});
