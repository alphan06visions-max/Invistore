import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ChevronLeft } from '../components/icons';
import { api } from '../api/client';
import { theme } from '../theme';

export function ComposeScreen({ navigation }: any) {
  const [image, setImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [uploading, setUploading] = useState(false);

  async function pickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'NEXUS needs photo access to post moments.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  }

  async function publish() {
    if (!image) return;
    setUploading(true);
    try {
      const uploadRes = await api.upload(image);
      await api.createPost(uploadRes.url, caption, location);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ChevronLeft size={26} color={theme.colors.foreground} /></TouchableOpacity>
        <Text style={styles.title}>New Moment</Text>
        <TouchableOpacity onPress={publish} disabled={!image || uploading} style={[styles.publishBtn, (!image || uploading) && { opacity: 0.4 }]}>
          {uploading ? <ActivityIndicator color={theme.colors.background} size="small" /> : <Text style={styles.publishText}>Post</Text>}
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={pickImage} style={styles.imageArea}>
        {image ? (
          <Image source={{ uri: image }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>+ Tap to select image</Text>
          </View>
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.captionInput}
        placeholder="Write a caption…"
        placeholderTextColor={theme.colors.muted}
        value={caption}
        onChangeText={setCaption}
        multiline
      />
      <TextInput
        style={styles.locationInput}
        placeholder="Location (optional)"
        placeholderTextColor={theme.colors.muted}
        value={location}
        onChangeText={setLocation}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border,
  },
  title: { color: theme.colors.foreground, fontFamily: theme.fonts.displayBold, fontSize: 18 },
  publishBtn: { backgroundColor: theme.colors.primary, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8 },
  publishText: { color: theme.colors.background, fontFamily: theme.fonts.bodySemi, fontSize: 14 },
  imageArea: { width: '100%', aspectRatio: 1, backgroundColor: theme.colors.surface },
  imagePlaceholder: {
    flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.colors.border, borderStyle: 'dashed',
  },
  imagePlaceholderText: { color: theme.colors.muted, fontFamily: theme.fonts.body, fontSize: 15 },
  captionInput: {
    color: theme.colors.foreground, fontFamily: theme.fonts.body, fontSize: 16,
    padding: 16, minHeight: 100,
  },
  locationInput: {
    color: theme.colors.foreground, fontFamily: theme.fonts.body, fontSize: 14,
    paddingHorizontal: 16, paddingBottom: 16,
  },
});
