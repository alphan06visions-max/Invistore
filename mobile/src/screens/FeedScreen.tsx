import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, Image, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, MessageCircle, Send, Bookmark } from '../components/icons';
import { api } from '../api/client';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

export function FeedScreen({ navigation }: any) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await api.feed();
      setPosts(list);
    } catch {}
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  const toggleLike = async (post: any) => {
    const was = post.liked;
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, liked: !was, likes: p.likes + (was ? -1 : 1) } : p)));
    try { await api.toggleLike(post.id); } catch {
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, liked: was } : p)));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.header}>
        <Text style={styles.logo}>NEXUS</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <Heart size={22} color={theme.colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Conversations')}>
            <Send size={22} color={theme.colors.foreground} style={{ transform: [{ rotate: '-12deg' }] }} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={{ padding: 40, alignItems: 'center' }}><ActivityIndicator color={theme.colors.primary} /></View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={theme.colors.primary} />}
          renderItem={({ item }) => (
            <View style={{ marginBottom: 40 }}>
              <TouchableOpacity onPress={() => navigation.navigate('Profile', { key: item.username })} style={styles.author}>
                <Image source={{ uri: item.avatar }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.username}>{item.username}</Text>
                  <Text style={styles.meta}>{item.location || 'NEXUS'}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('PostDetail', { postId: item.id })}>
                <View style={{ position: 'relative' }}>
                  <Image source={{ uri: item.image_url }} style={{ width, height: width * 1.25 }} />
                  <LinearGradient colors={['transparent', 'transparent', 'rgba(0,0,0,0.85)']} style={StyleSheet.absoluteFill} />
                  {!!item.caption && (
                    <Text style={styles.caption}>{item.caption}</Text>
                  )}
                </View>
              </TouchableOpacity>

              <View style={styles.actions}>
                <TouchableOpacity onPress={() => toggleLike(item)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Heart size={26} color={item.liked ? theme.colors.accent : theme.colors.foreground} fill={item.liked ? theme.colors.accent : 'none'} />
                  <Text style={styles.actionCount}>{item.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('PostDetail', { postId: item.id })} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MessageCircle size={26} color={theme.colors.foreground} />
                  <Text style={styles.actionCount}>{item.comments}</Text>
                </TouchableOpacity>
                <Send size={26} color={theme.colors.foreground} style={{ transform: [{ rotate: '-12deg' }] }} />
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={{ paddingTop: 60, alignItems: 'center' }}>
              <Text style={{ color: theme.colors.muted, fontFamily: theme.fonts.body }}>No moments yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 },
  logo: { color: theme.colors.foreground, fontFamily: theme.fonts.display, fontSize: 28, letterSpacing: 6 },
  author: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  username: { color: theme.colors.foreground, fontFamily: theme.fonts.bodySemi, fontSize: 13 },
  meta: { color: theme.colors.muted, fontFamily: theme.fonts.body, fontSize: 11, marginTop: 1 },
  caption: {
    position: 'absolute', left: 20, right: 20, bottom: 24,
    color: theme.colors.foreground, fontFamily: theme.fonts.displayBold, fontSize: 22, lineHeight: 28,
  },
  actions: { flexDirection: 'row', gap: 24, padding: 12, paddingHorizontal: 16 },
  actionCount: { color: theme.colors.foreground, fontFamily: theme.fonts.bodySemi, fontSize: 14 },
});
