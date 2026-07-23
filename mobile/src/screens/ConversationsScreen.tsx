import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { ChevronLeft, MessageCircle } from '../components/icons';
import { api } from '../api/client';
import { theme } from '../theme';
import { timeAgo } from '../components/util';

export function ConversationsScreen({ navigation }: any) {
  const [convs, setConvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await api.conversations();
      setConvs(list);
    } catch {}
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ChevronLeft size={26} color={theme.colors.foreground} /></TouchableOpacity>
        <Text style={styles.title}>Whispers</Text>
        <View style={{ width: 26 }} />
      </View>

      {loading ? (
        <View style={{ padding: 40, alignItems: 'center' }}><ActivityIndicator color={theme.colors.primary} /></View>
      ) : (
        <FlatList
          data={convs}
          keyExtractor={(c) => c.user_id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={theme.colors.primary} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('ChatThread', { userId: item.user_id, username: item.username, avatar: item.avatar })}
              style={styles.row}
            >
              <Image source={{ uri: item.avatar }} style={{ width: 48, height: 48, borderRadius: 24 }} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <Text style={styles.name}>{item.username}</Text>
                  {item.unread > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.unread}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.msg} numberOfLines={1}>{item.last_message || 'Start a whisper…'}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={{ paddingTop: 60, alignItems: 'center' }}>
              <MessageCircle size={40} color={theme.colors.muted} />
              <Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.body, marginTop: 12 }}>No whispers yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  title: { color: theme.colors.foreground, fontFamily: theme.fonts.displayBold, fontSize: 20 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.borderSubtle },
  name: { color: theme.colors.foreground, fontFamily: theme.fonts.bodySemi, fontSize: 14 },
  msg: { color: theme.colors.muted, fontFamily: theme.fonts.body, fontSize: 13, marginTop: 3 },
  badge: { backgroundColor: theme.colors.primary, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: theme.colors.background, fontFamily: theme.fonts.bodySemi, fontSize: 11 },
});
