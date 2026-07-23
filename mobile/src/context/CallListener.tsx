// CallListener.tsx — Global listener for incoming calls via WebSocket
// Mounted at the app root, listens for call_invite events and navigates to IncomingCall

import React, { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useSocket } from '../context/SocketContext';

export function CallListener() {
  const { subscribe } = useSocket();
  const navigation = useNavigation<any>();
  const isInCall = useRef(false);

  useEffect(() => {
    const unsub = subscribe((msg: any) => {
      if (msg.type === 'call_invite' && !isInCall.current) {
        isInCall.current = true;
        navigation.navigate('IncomingCall', {
          channelName: msg.channel,
          caller: msg.caller || 'Unknown',
          fromUserId: msg.from,
        });
      } else if (msg.type === 'call_end') {
        isInCall.current = false;
        navigation.goBack();
      }
    });

    return () => {
      unsub();
      isInCall.current = false;
    };
  }, [subscribe, navigation]);

  return null;
}
