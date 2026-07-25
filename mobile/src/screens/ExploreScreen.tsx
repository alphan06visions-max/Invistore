import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator,
} from 'react-native';
import { ChevronLeft, Search, MessageCircle } from '../components/icons';
import { streamClient } from '../api/streamClient';
import { useAuth } from '../context/AuthContext';

export function ExploreScreen({ navigation }: any) {
  const { user: me } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await streamClient.queryUsers(
        { name: { $autocomplete: q.trim() }, id: { $ne: me?.id || '' } },
        { name: 1 },
        { limit: 20 }
      );
      setResults(res.users);
    } catch { setResults([]); }
    setLoading(false);
  }, [me?.id]);

  useEffect(() => {
    const t = setTimeout(() => search(query), 400);
    return () => clearTimeout(t);
  }, [query, search]);

  const startChat = async (otherUser: any) => {
    if (!me) return;
    const channel = streamClient.channel('messaging', {
      members: [me.id, otherUser.id],
      created_by_id: me.id,
      name: `${me.name}, ${otherUser.name}`,
    });
    await channel.create();
    navigation.navigate('ChatThread', {
      channelId: channel.id,
      otherUser: {
        id: otherUser.id,
        username: otherUser.id,
        displayName: otherUser.name,
        avatarUrl: otherUser.image || '',
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={st.searchBox}>
          <Search size={16} color="rgba(255,255,255,0.4)" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search people…"
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={st.searchInput}
            autoFocus
            autoCapitalize="none"
          />
        </View>
      </View>

      {loading && <ActivityIndicator color="#6366f1" style={{ marginTop: 24 }} />}

      <FlatList
        data={results}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{ paddingBottom: 32 }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => startChat(item)} style={st.row} activeOpacity={0.7}>
            {item.image ? (
              <View style={st.ava}>
                <Text style={st.avaText}>{item.name?.[0]?.toUpperCase() || '?'}</Text>
              </View>
            ) : (
              <View style={[st.ava, { backgroundColor: '#6366f1' }]}>
                <Text style={st.avaText}>{item.name?.[0]?.toUpperCase() || '?'}</Text>
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={st.name}>{item.name}</Text>
              <Text style={st.bio}>
                {item.online ? '● Online' : 'Tap to start chatting'}
              </Text>
            </View>
            <View style={st.chatBtn}>
              <MessageCircle size={18} color="#6366f1" />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          query.length >= 2 ? (
            <Text style={st.empty}>No one found with that name</Text>
          ) : null
        }
      />
    </View>
  );
}

const st = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.08)' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  searchInput: { flex: 1, marginLeft: 8, color: '#fff', fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.05)' },
  ava: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(99,102,241,0.3)' },
  avaText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  name: { color: '#fff', fontSize: 16, fontWeight: '600' },
  bio: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 3 },
  chatBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(99,102,241,0.1)', justifyContent: 'center', alignItems: 'center' },
  empty: { color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 48, fontSize: 14 },
});
