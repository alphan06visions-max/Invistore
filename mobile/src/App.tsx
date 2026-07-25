import React, { useEffect, useState } from 'react';
import { StatusBar, ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Font from 'expo-font';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './screens/AuthScreen';
import { ConversationsScreen } from './screens/ConversationsScreen';
import { ExploreScreen } from './screens/ExploreScreen';
import { ChatThreadScreen } from './screens/ChatThreadScreen';
import { theme } from './theme';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { user, loading } = useAuth();
  if (loading) return (
    <View style={{flex:1,backgroundColor:'#0a0a0a',justifyContent:'center',alignItems:'center'}}>
      <ActivityIndicator color="#6366f1" size="large"/>
    </View>
  );

  return (
    <Stack.Navigator screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: '#0a0a0a' },
      animation: 'fade',
    }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : (
        <>
          <Stack.Screen name="Conversations" component={ConversationsScreen} />
          <Stack.Screen name="Explore" component={ExploreScreen} />
          <Stack.Screen name="ChatThread" component={ChatThreadScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    (async () => {
      await Font.loadAsync({
        Fraunces: require('../assets/fonts/Fraunces.ttf'),
        Inter: require('../assets/fonts/Inter.ttf'),
      }).catch(() => {});
      setFontsReady(true);
    })();
  }, []);

  if (!fontsReady) return (
    <View style={{flex:1,backgroundColor:'#0a0a0a',justifyContent:'center',alignItems:'center'}}>
      <ActivityIndicator color="#6366f1" size="large"/>
    </View>
  );

  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
