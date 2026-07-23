// callUtils.ts — Shared call utilities
import { supabase } from '../api/supabase';

/**
 * Build a deterministic channel name for a 1-1 call
 */
export function channelForUsers(a: string, b: string): string {
  const ids = [a, b].sort();
  return `nexus:call:${ids[0].slice(-6)}:${ids[1].slice(-6)}`;
}

/**
 * Start a voice call — sends invite via Supabase Realtime
 */
export function startCall(
  remoteUsername: string,
  remoteUserId: string,
  navigation: any,
  _send: (msg: any) => void,
  currentUserId?: string,
) {
  if (!currentUserId) return;
  const channel = channelForUsers(currentUserId, remoteUserId);
  // Send call invite via Supabase Realtime broadcast
  const callChannel = supabase.channel(`call:${remoteUserId}`);
  callChannel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      callChannel.send({
        type: 'broadcast',
        event: 'call_invite',
        payload: {
          channelName: channel,
          caller: currentUserId,
          callerName: remoteUsername,
          fromUserId: currentUserId,
        },
      });
    }
  });
  navigation.navigate('IncomingCall', {
    channelName: channel,
    isCaller: true,
    remoteUsername,
    fromUserId: currentUserId,
  });
}

/**
 * Start a video call
 */
export function startVideoCall(
  remoteUsername: string,
  remoteUserId: string,
  navigation: any,
  _send: (msg: any) => void,
  currentUserId?: string,
) {
  if (!currentUserId) return;
  const channel = channelForUsers(currentUserId, remoteUserId);
  const callChannel = supabase.channel(`call:${remoteUserId}`);
  callChannel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      callChannel.send({
        type: 'broadcast',
        event: 'call_invite',
        payload: {
          channelName: channel,
          caller: currentUserId,
          callerName: remoteUsername,
          fromUserId: currentUserId,
          isVideo: true,
        },
      });
    }
  });
  navigation.navigate('CallScreen', {
    channelName: channel,
    isCaller: true,
    remoteUsername,
  });
}
