// CallListener — Listen for incoming calls via Supabase Realtime
import React, { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from './AuthContext';
import { supabase } from '../api/supabase';

export function CallListener() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const isInCall = useRef(false);

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(`call:${user.id}`);
    channel.on('broadcast', { event: 'call_invite' }, (payload: any) => {
      if (!isInCall.current) {
        isInCall.current = true;
        const { channelName, callerName, fromUserId, isVideo } = payload.payload || payload;
        if (isVideo) {
          navigation.navigate('CallScreen', {
            channelName,
            isCaller: false,
            remoteUsername: callerName || 'Unknown',
          });
        } else {
          navigation.navigate('IncomingCall', {
            channelName,
            caller: callerName || 'Unknown',
            fromUserId,
          });
        }
      }
    });

    channel.on('broadcast', { event: 'call_end' }, () => {
      isInCall.current = false;
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
      isInCall.current = false;
    };
  }, [user, navigation]);

  return null;
}
