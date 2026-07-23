// IncomingCallScreen.tsx — Shows when someone is calling you
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration } from 'react-native';
import { Phone, PhoneOff } from '../components/icons';
import { theme } from '../theme';

export function IncomingCallScreen({ route, navigation }: any) {
  const { channelName, caller, fromUserId } = route.params;
  const vibrateRef = useRef<any>(null);

  useEffect(() => {
    // Vibrate pattern: 400ms on, 200ms off, repeat
    vibrateRef.current = setInterval(() => {
      Vibration.vibrate([400, 200, 400]);
    }, 1200);

    // Auto-dismiss after 45s
    const t = setTimeout(() => {
      clearInterval(vibrateRef.current);
      navigation.goBack();
    }, 45000);

    return () => {
      clearInterval(vibrateRef.current);
      clearTimeout(t);
    };
  }, []);

  const accept = () => {
    clearInterval(vibrateRef.current);
    Vibration.cancel();
    navigation.replace('CallScreen', {
      channelName,
      isCaller: false,
      remoteUsername: caller,
    });
  };

  const decline = () => {
    clearInterval(vibrateRef.current);
    Vibration.cancel();
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>INCOMING CALL</Text>
      <Text style={styles.caller}>{caller}</Text>
      <Text style={styles.sub}>wants to connect</Text>

      <View style={styles.actions}>
        <TouchableOpacity onPress={decline} style={styles.declineBtn}>
          <PhoneOff size={28} color="#fff" />
          <Text style={styles.btnLabel}>Decline</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={accept} style={styles.acceptBtn}>
          <Phone size={28} color="#fff" />
          <Text style={styles.btnLabel}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  label: { color: theme.colors.primaryGlow, fontFamily: theme.fonts.body, fontSize: 12, letterSpacing: 6, textTransform: 'uppercase', marginBottom: 16 },
  caller: { color: theme.colors.foreground, fontFamily: theme.fonts.displayBold, fontSize: 36, textAlign: 'center' },
  sub: { color: theme.colors.muted, fontFamily: theme.fonts.body, fontSize: 15, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 48, marginTop: 60 },
  declineBtn: { alignItems: 'center' },
  acceptBtn: { alignItems: 'center' },
  btnLabel: { color: theme.colors.foreground, fontFamily: theme.fonts.body, fontSize: 12, marginTop: 8, letterSpacing: 1 },
});
