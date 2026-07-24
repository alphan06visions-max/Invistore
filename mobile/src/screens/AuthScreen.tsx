import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login'|'register'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setError(''); setLoading(true);
    try {
      const r = mode==='login' ? await signIn(email, password) : await signUp(email, username, password);
      if (r.error) setError(r.error);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS==='ios'?'padding':undefined}>
      <LinearGradient colors={['#0d1117','#0a1628','#09060d']} style={StyleSheet.absoluteFill}/>
      <View style={s.card}>
        <Text style={s.icon}>🕊️</Text>
        <Text style={s.logo}>Friðr</Text>
        <Text style={s.tagline}>Peace in every connection</Text>
        <View style={{height:24}}/>
        {mode==='register'&&<TextInput style={s.inp} placeholder="Username" placeholderTextColor="rgba(255,255,255,0.35)" value={username} onChangeText={setUsername} autoCapitalize="none"/>}
        <TextInput style={s.inp} placeholder="Email" placeholderTextColor="rgba(255,255,255,0.35)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/>
        <TextInput style={s.inp} placeholder="Password" placeholderTextColor="rgba(255,255,255,0.35)" value={password} onChangeText={setPassword} secureTextEntry/>
        {error?<View style={s.err}><Text style={s.et}>{error}</Text></View>:null}
        <TouchableOpacity style={[s.btn,(loading||!email||!password)&&{opacity:0.5}]} onPress={submit} disabled={loading||!email||!password} activeOpacity={0.8}>
          <LinearGradient colors={['#6366f1','#8b5cf6']} style={s.bg} start={{x:0,y:0}} end={{x:1,y:0}}>
            {loading?<ActivityIndicator color="#fff"/>:<Text style={s.bt}>{mode==='login'?'Sign In':'Create Account'}</Text>}
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>{setMode(m=>m==='login'?'register':'login');setError('');}} style={{marginTop:20}}>
          <Text style={s.sw}>{mode==='login'?"Don't have an account? Sign up":"Already have an account? Sign in"}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s=StyleSheet.create({
  root:{flex:1,backgroundColor:'#0a0a0a',justifyContent:'center',paddingHorizontal:32},
  card:{width:'100%',maxWidth:380,alignSelf:'center',alignItems:'center'},
  icon:{fontSize:44},logo:{color:'#fff',fontSize:44,fontWeight:'800',letterSpacing:6,fontFamily:theme.fonts.display},
  tagline:{color:'rgba(255,255,255,0.45)',fontSize:14,fontStyle:'italic'},
  inp:{width:'100%',marginTop:12,borderRadius:14,borderWidth:1,borderColor:'rgba(255,255,255,0.1)',backgroundColor:'rgba(255,255,255,0.04)',paddingHorizontal:18,paddingVertical:15,color:'#fff',fontSize:15},
  btn:{width:'100%',marginTop:20,borderRadius:14,overflow:'hidden'},
  bg:{paddingVertical:16,alignItems:'center',justifyContent:'center'},
  bt:{color:'#fff',fontSize:16,fontWeight:'700'},
  err:{width:'100%',backgroundColor:'rgba(239,68,68,0.1)',borderWidth:1,borderColor:'rgba(239,68,68,0.3)',borderRadius:10,padding:12,marginTop:12},
  et:{color:'#fca5a5',fontSize:13,textAlign:'center'},
  sw:{color:'rgba(255,255,255,0.5)',fontSize:13},
});
