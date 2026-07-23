import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { ChevronLeft, Heart, MessageCircle, User } from '../components/icons';
import { api } from '../api/client';
import { theme } from '../theme';
import { timeAgo } from '../components/util';

export function NotificationsScreen({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { const list = await api.notifications(); setItems(list); } catch {}
  }, []);

  useEffect(() => {
    (async () => { setLoading(true); await load(); setLoading(false); })();
  }, [load]);

  function iconFor(t: string) {
    if (t === 'like') return <Heart size={20} color={theme.colors.accent} fill={theme.colors.accent} />;
    if (t === 'comment') return <MessageCircle size={20} color={theme.colors.primaryGlow} />;
    if (t === 'follow') return <User size={20} color={theme.colors.primary} />;
    return <Heart size={20} color={theme.colors.foreground} />;
  }
  function textFor(n: any) {
    if (n.type === 'like') return 'liked your moment.';
    if (n.type === 'comment') return 'whispered on your moment.';
    if (n.type === 'follow') return 'started following you.';
    return 'sent you a signal.';
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ChevronLeft size={26} color={theme.colors.foreground} /></TouchableOpacity>
        <Text style={styles.title}>Signals</Text>
        <View style={{ width: 26 }} />
      </View>

      {loading ? (
        <View style={{ padding: 40, alignItems: 'center' }}><ActivityIndicator color={theme.colors.primary} /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={theme.colors.primary} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                if (item.type === 'follow') navigation.navigate('Profile', { key: item.from_username });
                else if (item.reference_id) navigation.navigate('PostDetail', { postId: item.reference_id });
              }}
              style={styles.row}
            >
              <View style={styles.iconWrap}>{iconFor(item.type)}</View>
              <Image source={{ uri: item.from_avatar }} style={styles.avatar} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.text}><Text style={styles.name}>{item.from_username}</Text> {textFor(item)}</Text>
                <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<View style={{ paddingTop: 60, alignItems: 'center' }}><Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.body }}>No signals yet</Text></View>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  title: { color: theme.colors.foreground, fontFamily: theme.fonts.displayBold, fontSize: 20 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.borderSubtle },
  iconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  text: { color: theme.colors.foreground, fontFamily: theme.fonts.body, fontSize: 14 },
  name: { fontFamily: theme.fonts.bodySemi },
  time: { color: theme.colors.muted, fontFamily: theme.fonts.body, fontSize: 11, marginTop: 3 },
});
