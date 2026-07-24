export function channelForUsers(a: string, b: string): string { return [a, b].sort().join('-call-'); }
export function startCall(remoteUsername: string, remoteUserId: string, navigation: any, _send: any, currentUserId?: string) {
  if (!currentUserId) return;
  navigation.navigate('IncomingCall', { channelName: channelForUsers(currentUserId, remoteUserId), isCaller: true, remoteUsername, fromUserId: currentUserId });
}
export function startVideoCall(remoteUsername: string, remoteUserId: string, navigation: any, _send: any, currentUserId?: string) {
  if (!currentUserId) return;
  navigation.navigate('CallScreen', { channelName: channelForUsers(currentUserId, remoteUserId), isCaller: true, remoteUsername });
}
