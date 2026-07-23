import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator,
} from 'react-native';
import { ChevronLeft, Search, User as UserIcon } from '../components/icons';
import { api } from '../api/client';
import { theme } from '../theme';

export function ExploreScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const list = await api.search(q);
      setResults(list);
    } catch { setResults([]); }
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 400);
    return () => clearTimeout(t);
  }, [query, search]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ChevronLeft size={26} color={theme.colors.foreground} /></TouchableOpacity>
        <View style={styles.searchBox}>
          <Search size={16} color={theme.colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search users…"
            placeholderTextColor={theme.colors.muted}
            style={styles.searchInput}
            autoFocus
          />
        </View>
      </View>

      {loading && <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 20 }} />}

      <FlatList
        data={results}
        keyExtractor={(u) => u.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('Profile', { key: item.username })} style={styles.row}>
            <Image source={{ uri: item.avatar }} style={{ width: 44, height: 44, borderRadius: 22 }} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.name}>{item.username}</Text>
              {!!item.bio && <Text style={styles.bio}>{item.bio}</Text>}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          query ? <Text style={styles.empty}>No users found</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, gap: 12 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.surface, borderRadius: 12, paddingHorizontal: 12, height: 40,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  searchInput: { flex: 1, marginLeft: 8, color: theme.colors.foreground, fontFamily: theme.fonts.body, fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.borderSubtle },
  name: { color: theme.colors.foreground, fontFamily: theme.fonts.bodySemi, fontSize: 14 },
  bio: { color: theme.colors.muted, fontFamily: theme.fonts.body, fontSize: 12, marginTop: 2 },
  empty: { color: theme.colors.muted, textAlign: 'center', marginTop: 40, fontFamily: theme.fonts.body },
});
