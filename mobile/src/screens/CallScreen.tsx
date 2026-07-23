// CallScreen.tsx — Agora video/audio call
// Uses a WebView-based approach with Agora Web SDK for maximum compatibility
// No native module linking required — works on Expo Go + EAS Build

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions, Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { PhoneOff, Video, Mic, MicOff, VideoOff } from '../components/icons';
import { api } from '../api/client';
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
  const [callState, setCallState] = useState<'connecting' | 'ringing' | 'active' | 'ended'>(
    isCaller ? 'ringing' : 'connecting'
  );
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [token, setToken] = useState('');
  const [uid, setUid] = useState(0);
  const [appId, setAppId] = useState('');
  const webViewRef = useRef<WebView>(null);

  const YOUR_AGORA_APP_ID = 'YOUR_AGORA_APP_ID'; // Will be fetched dynamically

  // Fetch Agora token from backend
  useEffect(() => {
    (async () => {
      try {
        const res = await api.getCallToken(channelName);
        setToken(res.token);
        setUid(res.uid);
        setAppId(res.appId);
      } catch (e) {
        Alert.alert('Error', 'Failed to get call token');
        navigation.goBack();
      }
    })();
  }, [channelName]);

  // Ringing timeout — auto-hangup after 60s
  useEffect(() => {
    if (callState !== 'ringing') return;
    const t = setTimeout(() => {
      setCallState('ended');
      setTimeout(() => navigation.goBack(), 2000);
    }, 60000);
    return () => clearTimeout(t);
  }, [callState]);

  const endCall = useCallback(() => {
    setCallState('ended');
    setTimeout(() => navigation.goBack(), 1500);
  }, [navigation]);

  const toggleMute = () => {
    setMuted((m) => {
      const newVal = !m;
      webViewRef.current?.injectJavaScript(`
        try { window.agoraLocalAudioTrack?.setEnabled(${!newVal}); } catch(e){}
        true;
      `);
      return newVal;
    });
  };

  const toggleCam = () => {
    setCamOff((c) => {
      const newVal = !c;
      webViewRef.current?.injectJavaScript(`
        try { window.agoraLocalVideoTrack?.setEnabled(${!newVal}); } catch(e){}
        true;
      `);
      return newVal;
    });
  };

  // Agora Web SDK HTML page
  const agoraHTML = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;overflow:hidden}
#remote-video{width:100vw;height:100vh;object-fit:cover}
#local-video{position:fixed;top:40px;right:16px;width:120px;height:160px;border-radius:12px;border:2px solid #d4852c;object-fit:cover;z-index:10}
#status{position:fixed;bottom:120px;left:0;right:0;text-align:center;color:#f0b854;font-family:sans-serif;font-size:14px;z-index:5}
</style>
<script src="https://download.agora.io/sdk/release/AgoraRTC_N-4.22.0.js"></script>
</head>
<body>
<video id="remote-video" autoplay playsinline></video>
<video id="local-video" autoplay playsinline muted></video>
<div id="status">connecting…</div>
<script>
const APP_ID = '${appId}';
const TOKEN = '${token}';
const CHANNEL = '${channelName}';
const UID = ${uid};
let client, localAudioTrack, localVideoTrack;
window.agoraLocalAudioTrack = null;
window.agoraLocalVideoTrack = null;

async function start() {
  client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

  client.on('user-published', async (user, mediaType) => {
    await client.subscribe(user, mediaType);
    if (mediaType === 'video') {
      user.videoTrack.play('remote-video');
      document.getElementById('status').textContent = '';
    }
    if (mediaType === 'audio') {
      user.audioTrack.play();
    }
  });

  client.on('user-unpublished', (user) => {
    document.getElementById('status').textContent = 'call ended';
  });

  client.on('user-joined', () => {
    document.getElementById('status').textContent = '';
  });

  try {
    await client.join(APP_ID, CHANNEL, TOKEN, UID);
    localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    localVideoTrack = await AgoraRTC.createCameraVideoTrack();
    window.agoraLocalAudioTrack = localAudioTrack;
    window.agoraLocalVideoTrack = localVideoTrack;
    await client.publish([localAudioTrack, localVideoTrack]);
    localVideoTrack.play('local-video');
    document.getElementById('status').textContent = '';
  } catch(e) {
    document.getElementById('status').textContent = 'connection failed: ' + e.message;
  }
}

start();
</script>
</body>
</html>`;

  // If token not yet loaded, show loader
  if (!token) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Connecting…</Text>
      </View>
    );
  }

  if (callState === 'ended') {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.endedText}>Call Ended</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.doneBtn}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (callState === 'ringing') {
    return (
      <View style={styles.ringingContainer}>
        <Text style={styles.ringingTitle}>Calling</Text>
        <Text style={styles.ringingName}>{remoteUsername}</Text>
        <ActivityIndicator size="small" color={theme.colors.primaryGlow} style={{ marginTop: 20 }} />
        <View style={styles.ringingActions}>
          <TouchableOpacity onPress={endCall} style={styles.hangupBtn}>
            <PhoneOff size={30} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Active call — WebView with Agora
  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: agoraHTML }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        originWhitelist={['*']}
      />
      <View style={styles.controls}>
        <TouchableOpacity onPress={toggleMute} style={[styles.ctrlBtn, muted && styles.ctrlBtnActive]}>
          {muted ? <MicOff size={22} color="#fff" /> : <Mic size={22} color="#fff" />}
        </TouchableOpacity>
        <TouchableOpacity onPress={endCall} style={styles.hangupBtn}>
          <PhoneOff size={30} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleCam} style={[styles.ctrlBtn, camOff && styles.ctrlBtnActive]}>
          {camOff ? <VideoOff size={22} color="#fff" /> : <Video size={22} color="#fff" />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  webview: { flex: 1 },
  loadingContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: theme.colors.primaryGlow, fontFamily: theme.fonts.body, fontSize: 16, marginTop: 16 },
  endedText: { color: theme.colors.foreground, fontFamily: theme.fonts.displayBold, fontSize: 28, marginBottom: 24 },
  doneBtn: { backgroundColor: theme.colors.primary, borderRadius: 24, paddingHorizontal: 32, paddingVertical: 12 },
  doneBtnText: { color: theme.colors.background, fontFamily: theme.fonts.bodySemi, fontSize: 16 },
  ringingContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  ringingTitle: { color: theme.colors.muted, fontFamily: theme.fonts.body, fontSize: 14, letterSpacing: 4, textTransform: 'uppercase' },
  ringingName: { color: theme.colors.foreground, fontFamily: theme.fonts.displayBold, fontSize: 32, marginTop: 12 },
  ringingActions: { position: 'absolute', bottom: 80 },
  controls: { position: 'absolute', bottom: 60, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 32 },
  ctrlBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  ctrlBtnActive: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  hangupBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#e0432f', alignItems: 'center', justifyContent: 'center' },
});
