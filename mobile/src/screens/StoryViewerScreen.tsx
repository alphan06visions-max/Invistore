import React, { useEffect, useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X } from '../components/icons';
import { theme } from '../theme';

const { width, height } = Dimensions.get('window');

export function StoryViewerScreen({ route, navigation }: any) {
  const { story } = route.params;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const duration = 5000;
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / duration);
      setProgress(p);
      if (p >= 1) { clearInterval(id); navigation.goBack(); }
    }, 50);
    return () => clearInterval(id);
  }, [navigation]);

  return (
    <TouchableOpacity activeOpacity={1} onPress={() => navigation.goBack()} style={{ flex: 1, backgroundColor: '#000' }}>
      <Image source={{ uri: story.media_url }} style={{ width, height }} resizeMode="cover" />
      <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.topFade} />
      <View style={styles.progressWrap}>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>
      <View style={styles.userRow}>
        <Image source={{ uri: story.avatar }} style={styles.avatar} />
        <Text style={styles.username}>{story.username}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 'auto' }}>
          <X size={22} color={theme.colors.white} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 140 },
  progressWrap: { position: 'absolute', top: 44, left: 12, right: 12 },
  progressBg: { height: 3, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: theme.colors.white },
  userRow: { position: 'absolute', top: 60, left: 16, right: 16, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 34, height: 34, borderRadius: 17 },
  username: { marginLeft: 10, color: theme.colors.white, fontFamily: theme.fonts.bodySemi, fontSize: 15 },
});
