import React from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet } from 'react-native';

type Props = {
  name: string;
  avatar: string;
  onPress?: () => void;
  hasStory?: boolean;
  self?: boolean;
  size?: number;
};

export function StoryRing({ name, avatar, onPress, hasStory = true, self, size = 68 }: Props) {
  const inner = size - 4;
  return (
    <TouchableOpacity onPress={onPress} style={styles.wrap}>
      <View style={[styles.ring, hasStory && styles.ringActive, { width: size, height: size, borderRadius: size / 2 }]}>
        <Image source={{ uri: avatar }} style={{ width: inner, height: inner, borderRadius: inner / 2 }} />
      </View>
      <Text style={styles.label} numberOfLines={1}>{self ? 'You' : name}</Text>
      {self && (
        <View style={styles.plusBadge}>
          <Text style={styles.plusText}>+</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: 72 },
  ring: { padding: 3, alignItems: 'center', justifyContent: 'center' },
  ringActive: {
    background: 'conic-gradient(from 180deg, #d4852c, #e0432f, #f0b854, #d4852c)',
  },
  label: { color: '#7a6f5d', fontSize: 11, marginTop: 6, maxWidth: 72, textAlign: 'center' },
  plusBadge: {
    position: 'absolute', bottom: 22, right: 6,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#f0b854', alignItems: 'center', justifyContent: 'center',
  },
  plusText: { color: '#0d0a06', fontSize: 14, fontWeight: '700' },
});
