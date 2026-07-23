// callUtils.ts — Shared call utilities for ChatThreadScreen
import { Alert, Platform } from 'react-native';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

/**
 * Build a deterministic channel name for a 1-1 call
 */
export function channelForUsers(a: string, b: string): string {
  // Sort IDs so both users generate the same channel name
  const ids = [a, b].sort();
  return `nexus:call:${ids[0].slice(-6)}:${ids[1].slice(-6)}`;
}

/**
 * Start a voice call
 */
export function startCall(
  remoteUsername: string,
  remoteUserId: string,
  navigation: any,
  send: (msg: any) => void,
  currentUserId?: string,
) {
  if (!currentUserId) return;
  const channel = channelForUsers(currentUserId, remoteUserId);
  send({ type: 'call_invite', to: remoteUserId, channel });
  navigation.navigate('IncomingCall', {
    channelName: channel,
    isCaller: true,
    remoteUsername,
    fromUserId: currentUserId,
  });
}

/**
 * Start a video call (same channel, just UI difference)
 */
export function startVideoCall(
  remoteUsername: string,
  remoteUserId: string,
  navigation: any,
  send: (msg: any) => void,
  currentUserId?: string,
) {
  if (!currentUserId) return;
  const channel = channelForUsers(currentUserId, remoteUserId);
  send({ type: 'call_invite', to: remoteUserId, channel });
  navigation.navigate('CallScreen', {
    channelName: channel,
    isCaller: true,
    remoteUsername,
  });
}
