// CallScreen — Agora React Native SDK (native, pas WebView)
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert,
} from 'react-native';
import { PhoneOff, Mic, MicOff, VideoOff, Video as VideoIcon, CameraSwitch } from '../components/icons';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

type CallParams = {
  channelName: string;
  isCaller: boolean;
  remoteUsername: string;
};

export function CallScreen({ route, navigation }: any) {
  const { channelName, isCaller, remoteUsername } = route.params as CallParams;
  const { user } = useAuth();
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [callState, setCallState] = useState<'connecting' | 'active' | 'ended'>('connecting');
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<any>(null);
  const engineRef = useRef<any>(null);

  useEffect(() => {
    let agoraEngine: any = null;

    const init = async () => {
      try {
        // Dynamically import Agora (only works in native build, not Expo Go)
        const AgoraRTC = require('agora-react-native-rtc');
        const appId = process.env.EXPO_PUBLIC_AGORA_APP_ID || '';

        agoraEngine = await AgoraRTC.default.create(appId);
        engineRef.current = agoraEngine;

        await agoraEngine.enableVideo();
        await agoraEngine.setChannelProfile(1); // live broadcasting
        await agoraEngine.setClientRole(1); // broadcaster

        agoraEngine.addListener('JoinChannelSuccess', () => {
          setCallState('active');
          // Start timer
          timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
        });

        agoraEngine.addListener('UserJoined', (_uid: number, _elapsed: number) => {
          // Remote user joined
        });

        agoraEngine.addListener('UserOffline', () => {
          endCall();
        });

        await agoraEngine.joinChannel('', channelName, null, 0);
      } catch (e: any) {
        console.error('Agora init error:', e);
        Alert.alert('Call Error', 'Failed to initialize call: ' + (e.message || 'unknown'));
        navigation.goBack();
      }
    };

    init();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (engineRef.current) {
        engineRef.current.destroy().catch(() => {});
      }
    };
  }, []);

  const endCall = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCallState('ended');
    setTimeout(() => navigation.goBack(), 500);
  };

  const toggleMute = async () => {
    if (engineRef.current) {
      await engineRef.current.muteLocalAudioStream(!muted);
      setMuted(!muted);
    }
  };

  const toggleCam = async () => {
    if (engineRef.current) {
      await engineRef.current.muteLocalVideoStream(!camOff);
      setCamOff(!camOff);
    }
  };

  const switchCamera = async () => {
    if (engineRef.current) await engineRef.current.switchCamera();
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Remote video (full screen) */}
      <View style={styles.remoteVideo}>
        {callState === 'connecting' && (
          <View style={styles.connectingOverlay}>
            <Text style={styles.callingText}>
              {isCaller ? 'Calling…' : 'Connecting…'}
            </Text>
            <Text style={styles.remoteName}>{remoteUsername}</Text>
          </View>
        )}
      </View>

      {/* Local video (pip) */}
      {callState === 'active' && (
        <View style={styles.localVideo}>
          <Text style={styles.localLabel}>You</Text>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <Text style={styles.duration}>{fmt(duration)}</Text>
        <View style={styles.controlRow}>
          <TouchableOpacity onPress={toggleMute} style={[styles.ctrlBtn, muted && styles.ctrlBtnActive]}>
            {muted ? <MicOff size={22} color="#fff" /> : <Mic size={22} color="#fff" />}
          </TouchableOpacity>
          <TouchableOpacity onPress={endCall} style={styles.endBtn}>
            <PhoneOff size={26} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleCam} style={[styles.ctrlBtn, camOff && styles.ctrlBtnActive]}>
            {camOff ? <VideoOff size={22} color="#fff" /> : <VideoIcon size={22} color="#fff" />}
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={switchCamera} style={styles.switchBtn}>
          <CameraSwitch size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  remoteVideo: { flex: 1 },
  connectingOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  callingText: { color: '#fff', fontSize: 22, fontWeight: '600' },
  remoteName: { color: 'rgba(255,255,255,0.7)', fontSize: 16, marginTop: 8 },
  localVideo: {
    position: 'absolute', top: 60, right: 16,
    width: 120, height: 180, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  localLabel: { color: '#fff', fontSize: 12 },
  controls: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingBottom: 40, paddingTop: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  duration: { color: '#fff', fontSize: 16, marginBottom: 16 },
  controlRow: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  ctrlBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  ctrlBtnActive: { backgroundColor: 'rgba(255,255,255,0.4)' },
  endBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#ef4444',
    justifyContent: 'center', alignItems: 'center',
  },
  switchBtn: { marginTop: 16, padding: 8 },
});
