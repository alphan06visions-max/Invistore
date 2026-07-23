import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, Image, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions,
} from 'react-native';
import { ChevronLeft } from '../components/icons';
import { api } from '../api/client';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');
const GRID = (width - 4) / 3;

export function ProfileScreen({ route, navigation }: any) {
  const { key: username } = route.params;
  const { user: me, updateUser, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isMe = me?.username === username;

  const load = useCallback(async () => {
    try {
      const [p, pts] = await Promise.all([api.profile(username), api.userPosts(username)]);
      setProfile(p);
      setPosts(pts);
    } catch {}
  }, [username]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  async function toggle() {
    if (!profile) return;
    const was = profile.is_following;
    setProfile({ ...profile, is_following: !was, followers_count: profile.followers_count + (was ? -1 : 1) });
    try { await api.toggleFollow(username); } catch {
      setProfile({ ...profile, is_following: was });
    }
  }

  if (loading || !profile) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={theme.colors.primary} /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ChevronLeft size={26} color={theme.colors.foreground} /></TouchableOpacity>
        <Text style={styles.headerTitle}>{profile.username}</Text>
        {isMe && <TouchableOpacity onPress={signOut}><Text style={{ color: theme.colors.accent, fontFamily: theme.fonts.body, fontSize: 13 }}>Logout</Text></TouchableOpacity>}
        {!isMe && <View style={{ width: 50 }} />}
      </View>

      <View style={styles.profile}>
        <Image source={{ uri: profile.avatar }} style={{ width: 80, height: 80, borderRadius: 40 }} />
        <View style={styles.stats}>
          <View style={styles.stat}><Text style={styles.statNum}>{profile.posts_count}</Text><Text style={styles.statLabel}>Posts</Text></View>
          <View style={styles.stat}><Text style={styles.statNum}>{profile.followers_count}</Text><Text style={styles.statLabel}>Followers</Text></View>
          <View style={styles.stat}><Text style={styles.statNum}>{profile.following_count}</Text><Text style={styles.statLabel}>Following</Text></View>
        </View>
      </View>

      {!!profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

      {!isMe && (
        <TouchableOpacity onPress={toggle} style={[styles.followBtn, profile.is_following && styles.followingBtn]}>
          <Text style={[styles.followBtnText, profile.is_following && styles.followingBtnText]}>
            {profile.is_following ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      )}

      {isMe && (
        <TouchableOpacity onPress={() => navigation.navigate('Conversations')} style={[styles.followBtn, { backgroundColor: theme.colors.surfaceElevated }]}>
          <Text style={[styles.followBtnText, { color: theme.colors.foreground }]}>Messages</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        numColumns={3}
        contentContainerStyle={{ gap: 2 }}
        columnWrapperStyle={{ gap: 2 }}
        style={{ marginTop: 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('PostDetail', { postId: item.id })}>
            <Image source={{ uri: item.image_url }} style={{ width: GRID, height: GRID }} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 },
  headerTitle: { color: theme.colors.foreground, fontFamily: theme.fonts.displayBold, fontSize: 18 },
  profile: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 24 },
  stats: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statNum: { color: theme.colors.foreground, fontFamily: theme.fonts.bodySemi, fontSize: 18 },
  statLabel: { color: theme.colors.muted, fontFamily: theme.fonts.body, fontSize: 11, marginTop: 2 },
  bio: { color: theme.colors.foreground, fontFamily: theme.fonts.body, fontSize: 14, paddingHorizontal: 20, marginTop: 4 },
  followBtn: {
    marginHorizontal: 20, marginTop: 16, paddingVertical: 10, borderRadius: 10,
    backgroundColor: theme.colors.primary, alignItems: 'center',
  },
  followBtnText: { color: theme.colors.background, fontFamily: theme.fonts.bodySemi, fontSize: 14 },
  followingBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border },
  followingBtnText: { color: theme.colors.foreground },
});
