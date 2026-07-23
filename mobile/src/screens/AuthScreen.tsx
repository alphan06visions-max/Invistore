import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, username, password);
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.logo}>NEXUS</Text>
        <Text style={styles.subtitle}>Shot like film. Felt like life.</Text>

        <View style={{ height: 32 }} />

        {mode === 'register' && (
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor={theme.colors.muted}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={theme.colors.muted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={theme.colors.muted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.btn} onPress={submit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={theme.colors.background} />
          ) : (
            <Text style={styles.btnText}>{mode === 'login' ? 'Enter Nexus' : 'Join Nexus'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}>
          <Text style={styles.switch}>
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1, backgroundColor: theme.colors.background,
    justifyContent: 'center', paddingHorizontal: 32,
  },
  card: { width: '100%', maxWidth: 360, alignSelf: 'center' },
  logo: {
    color: theme.colors.foreground,
    fontFamily: theme.fonts.display,
    fontSize: 42,
    textAlign: 'center',
    letterSpacing: 8,
  },
  subtitle: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: theme.colors.foreground,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    marginTop: 12,
  },
  btn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  btnText: {
    color: theme.colors.background,
    fontFamily: theme.fonts.bodySemi,
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: theme.colors.accent,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  switch: {
    color: theme.colors.primaryGlow,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 20,
  },
});
