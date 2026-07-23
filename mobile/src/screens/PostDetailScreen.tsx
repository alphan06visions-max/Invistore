import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, Image, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Heart, MessageCircle, Send } from '../components/icons';
import { api } from '../api/client';
import { theme } from '../theme';
import { timeAgo } from '../components/util';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

export function PostDetailScreen({ route, navigation }: any) {
  const { postId } = route.params;
  const { user: me } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([api.post(postId), api.comments(postId)]);
      setPost(p);
      setComments(c);
    } catch {}
  }, [postId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  async function toggleLike() {
    if (!post) return;
    const wasLiked = post.liked;
    setPost({ ...post, liked: !wasLiked, likes: post.likes + (wasLiked ? -1 : 1) });
    try { await api.toggleLike(post.id); } catch { setPost({ ...post, liked: wasLiked }); }
  }

  async function submitComment() {
    const c = input.trim();
    if (!c) return;
    setSending(true);
    const optimistic = { id: 'tmp-' + Date.now(), username: me?.username, avatar: me?.avatar, content: c, created_at: new Date().toISOString() };
    setComments((prev) => [...prev, optimistic]);
    setInput('');
    try {
      await api.addComment(postId, c);
      const fresh = await api.comments(postId);
      setComments(fresh);
      if (post) setPost({ ...post, comments: (post.comments || 0) + 1 });
    } catch {
      setComments((prev) => prev.filter((x) => x.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  }

  if (loading || !post) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={theme.colors.primary} /></View>;
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ChevronLeft size={26} color={theme.colors.foreground} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Chapter</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView>
        <TouchableOpacity onPress={() => navigation.navigate('Profile', { key: post.username })} style={styles.author}>
          <Image source={{ uri: post.avatar }} style={{ width: 40, height: 40, borderRadius: 20 }} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.username}>{post.username}</Text>
            <Text style={styles.meta}>{post.location || 'NEXUS'} · {timeAgo(post.created_at)}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.imageWrap}>
          <Image source={{ uri: post.image_url }} style={{ width, height: width * 1.25 }} />
          <LinearGradient colors={['transparent', 'transparent', 'rgba(0,0,0,0.85)']} style={StyleSheet.absoluteFill} />
          {!!post.caption && <Text style={styles.caption}>{post.caption}</Text>}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={toggleLike} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Heart size={26} color={post.liked ? theme.colors.accent : theme.colors.foreground} fill={post.liked ? theme.colors.accent : 'none'} />
            <Text style={styles.actionCount}>{post.likes}</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MessageCircle size={26} color={theme.colors.foreground} />
            <Text style={styles.actionCount}>{comments.length}</Text>
          </View>
        </View>

        <View style={{ padding: 16, paddingTop: 0 }}>
          <Text style={styles.commentsTitle}>WHISPERS</Text>
          {comments.length === 0 && <Text style={styles.emptyComments}>Be the first to whisper.</Text>}
          {comments.map((cc) => (
            <View key={cc.id} style={styles.commentRow}>
              <Image source={{ uri: cc.avatar }} style={{ width: 32, height: 32, borderRadius: 16 }} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.commentText}>
                  <Text style={styles.commentUser}>{cc.username}</Text>  {cc.content}
                </Text>
                <Text style={styles.commentTime}>{timeAgo(cc.created_at)}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput value={input} onChangeText={setInput} placeholder="Add a whisper…" placeholderTextColor={theme.colors.muted} style={styles.input} />
        <TouchableOpacity onPress={submitComment} disabled={sending || !input.trim()} style={styles.sendBtn}>
          <Send size={18} color={theme.colors.white} style={{ transform: [{ rotate: '-12deg' }] }} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 },
  headerTitle: { color: theme.colors.foreground, fontFamily: theme.fonts.displayBold, fontSize: 18 },
  author: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  username: { color: theme.colors.foreground, fontFamily: theme.fonts.bodySemi, fontSize: 14 },
  meta: { color: theme.colors.muted, fontFamily: theme.fonts.body, fontSize: 12, marginTop: 2 },
  imageWrap: { position: 'relative' },
  caption: { position: 'absolute', left: 20, right: 20, bottom: 24, color: theme.colors.foreground, fontFamily: theme.fonts.displayBold, fontSize: 22, lineHeight: 28, textShadowColor: 'rgba(0,0,0,0.95)', textShadowRadius: 12 },
  actions: { flexDirection: 'row', gap: 24, padding: 16 },
  actionCount: { color: theme.colors.foreground, fontFamily: theme.fonts.bodySemi, fontSize: 14 },
  commentsTitle: { color: theme.colors.primaryGlow, fontFamily: theme.fonts.display, fontSize: 11, letterSpacing: 4, marginBottom: 12 },
  emptyComments: { color: theme.colors.muted, fontFamily: theme.fonts.body, fontSize: 13, marginTop: 8 },
  commentRow: { flexDirection: 'row', paddingVertical: 8 },
  commentText: { color: theme.colors.foreground, fontFamily: theme.fonts.body, fontSize: 14, lineHeight: 20 },
  commentUser: { fontFamily: theme.fonts.bodySemi },
  commentTime: { color: theme.colors.muted, fontFamily: theme.fonts.body, fontSize: 11, marginTop: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border },
  input: { flex: 1, backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 10 : 8, color: theme.colors.foreground, fontFamily: theme.fonts.body, fontSize: 14 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
});
