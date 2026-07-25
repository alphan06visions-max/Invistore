import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';

export function AuthScreen() {
  const { signIn } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function enter() {
    const n = name.trim();
    if (!n || n.length < 2) { setError('Enter at least 2 characters'); return; }
    setError(''); setLoading(true);
    try {
      await signIn(n);
    } catch (e: any) { setError(e.message || 'Connection failed'); }
    finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['#0d1117', '#0a0f1a', '#06090f']} style={StyleSheet.absoluteFill} />

      <View style={s.card}>
        {/* Icône Memoria */}
        <View style={s.iconWrap}>
          <Image
            source={require('../../assets/icon.png')}
            style={s.icon}
            resizeMode="contain"
          />
        </View>

        <Text style={s.logo}>Memoria</Text>
        <Text style={s.tagline}>Speak. Remember. Connect.</Text>

        <View style={{ height: 32 }} />

        <TextInput
          style={s.inp}
          placeholder="Your name"
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="go"
          onSubmitEditing={enter}
        />

        {error ? (
          <View style={s.err}>
            <Text style={s.et}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[s.btn, (loading || name.trim().length < 2) && { opacity: 0.5 }]}
          onPress={enter}
          disabled={loading || name.trim().length < 2}
          activeOpacity={0.8}
        >
          <LinearGradient colors={['#6366f1', '#8b5cf6']} style={s.bg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.bt}>Enter Memoria</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={s.hint}>
          Enter your name to start chatting with friends
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#06090f', justifyContent: 'center', paddingHorizontal: 32 },
  card: { width: '100%', maxWidth: 380, alignSelf: 'center', alignItems: 'center' },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: 'rgba(99,102,241,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: { width: 64, height: 64, borderRadius: 16 },
  logo: { color: '#fff', fontSize: 36, fontWeight: '800', letterSpacing: 4 },
  tagline: { color: 'rgba(255,255,255,0.4)', fontSize: 14, fontStyle: 'italic', marginTop: 6 },
  inp: {
    width: '100%', marginTop: 12, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 20, paddingVertical: 16,
    color: '#fff', fontSize: 16, textAlign: 'center',
  },
  btn: { width: '100%', marginTop: 16, borderRadius: 16, overflow: 'hidden' },
  bg: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  bt: { color: '#fff', fontSize: 17, fontWeight: '700' },
  err: {
    width: '100%', backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 12, padding: 12, marginTop: 12,
  },
  et: { color: '#fca5a5', fontSize: 13, textAlign: 'center' },
  hint: { color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 24, textAlign: 'center' },
});
