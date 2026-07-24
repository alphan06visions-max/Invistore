import React, { useEffect, useState } from 'react';
import { StatusBar, ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Font from 'expo-font';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './screens/AuthScreen';
import { FeedScreen } from './screens/FeedScreen';
import { ExploreScreen } from './screens/ExploreScreen';
import { ComposeScreen } from './screens/ComposeScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { PostDetailScreen } from './screens/PostDetailScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { ConversationsScreen } from './screens/ConversationsScreen';
import { ChatThreadScreen } from './screens/ChatThreadScreen';
import { StoryViewerScreen } from './screens/StoryViewerScreen';
import { CallScreen } from './screens/CallScreen';
import { IncomingCallScreen } from './screens/IncomingCallScreen';
import { theme } from './theme';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { user, loading } = useAuth();
  if (loading) return <View style={{flex:1,backgroundColor:theme.colors.background,justifyContent:'center',alignItems:'center'}}><ActivityIndicator color={theme.colors.primary} size="large"/></View>;
  return (
    <Stack.Navigator screenOptions={{headerShown:false,contentStyle:{backgroundColor:theme.colors.background},animation:'fade'}}>
      {!user ? <Stack.Screen name="Auth" component={AuthScreen}/> : <>
        <Stack.Screen name="Feed" component={FeedScreen}/>
        <Stack.Screen name="Explore" component={ExploreScreen}/>
        <Stack.Screen name="Compose" component={ComposeScreen}/>
        <Stack.Screen name="Profile" component={ProfileScreen}/>
        <Stack.Screen name="PostDetail" component={PostDetailScreen}/>
        <Stack.Screen name="Notifications" component={NotificationsScreen}/>
        <Stack.Screen name="Conversations" component={ConversationsScreen}/>
        <Stack.Screen name="ChatThread" component={ChatThreadScreen}/>
        <Stack.Screen name="StoryViewer" component={StoryViewerScreen} options={{animation:'slide_from_bottom'}}/>
        <Stack.Screen name="CallScreen" component={CallScreen} options={{animation:'slide_from_bottom',gestureEnabled:false}}/>
        <Stack.Screen name="IncomingCall" component={IncomingCallScreen} options={{animation:'slide_from_bottom',gestureEnabled:false}}/>
      </>}
    </Stack.Navigator>
  );
}

export default function App() {
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => { (async()=>{await Font.loadAsync({Fraunces:require('../assets/fonts/Fraunces.ttf'),Inter:require('../assets/fonts/Inter.ttf')}).catch(()=>{});setFontsReady(true);})(); }, []);
  if (!fontsReady) return <View style={{flex:1,backgroundColor:theme.colors.background,justifyContent:'center',alignItems:'center'}}><ActivityIndicator color={theme.colors.primary} size="large"/></View>;
  return <AuthProvider><NavigationContainer><StatusBar barStyle="light-content" backgroundColor={theme.colors.background}/><AppNavigator/></NavigationContainer></AuthProvider>;
}
