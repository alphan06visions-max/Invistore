import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { streamClient } from '../api/streamClient';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, Send, CheckCheck, Check, Phone, Video } from '../components/icons';

export function ChatThreadScreen({ route, navigation }: any) {
  const { channelId, otherUser } = route.params || {};
  const { user: me } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const listRef = useRef<FlatList<any>>(null);
  const chRef = useRef<any>(null);

  useEffect(() => {
    if (!me || !channelId) return;
    let dead = false;
    (async () => {
      setLoading(true);
      const ch = streamClient.channel('messaging', channelId);
      chRef.current = ch; await ch.watch();
      const res = await ch.query({ messages: { limit: 50 } });
      const ms = res.messages.map((m: any) => ({ id: m.id, user: m.user, text: m.text, created_at: m.created_at, readBy: m.read_by?.length || 0 }));
      if (!dead) { setMessages(ms.reverse()); setLoading(false); }
      await ch.markRead();
      ch.on('message.new', (e: any) => {
        if (dead) return; const m = e.message;
        setMessages(prev => prev.some(p=>p.id===m.id)?prev:[...prev,{id:m.id,user:m.user,text:m.text,created_at:m.created_at,readBy:m.read_by?.length||0}]);
        ch.markRead();
      });
      ch.on('typing.start', (e: any) => { if (e.user.id !== me.id) { setTyping(true); setTimeout(() => setTyping(false), 3000); } });
    })();
    return () => { dead = true; };
  }, [channelId, me]);

  useEffect(() => { setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100); }, [messages.length]);

  const send = async () => { const t=input.trim(); if(!t||!chRef.current)return; setInput(''); try{await chRef.current.sendMessage({text:t});}catch(e){} };

  const cn = (a: string, b: string) => [a, b].sort().join('-call-');

  if (!otherUser) return <View style={{flex:1,backgroundColor:'#0a0a0a',justifyContent:'center',alignItems:'center'}}><ActivityIndicator color="#6366f1" size="large"/></View>;

  return (
    <KeyboardAvoidingView style={{flex:1,backgroundColor:'#0a0a0a'}} behavior={Platform.OS==='ios'?'padding':undefined} keyboardVerticalOffset={Platform.OS==='ios'?60:0}>
      <LinearGradient colors={['#0d1117','#0a1628','#09060d']} style={StyleSheet.absoluteFill}/>
      <View style={h.header}>
        <TouchableOpacity onPress={()=>navigation.goBack()} style={{padding:6}}><ChevronLeft size={24} color="#fff"/></TouchableOpacity>
        <TouchableOpacity onPress={()=>navigation.navigate('Profile',{key:otherUser.username})} style={{flexDirection:'row',alignItems:'center',flex:1,marginLeft:6}}>
          {otherUser.avatarUrl?<Image source={{uri:otherUser.avatarUrl}} style={h.ava}/>:<View style={[h.ava,{backgroundColor:'rgba(99,102,241,0.3)',justifyContent:'center',alignItems:'center'}]}><Text style={{color:'#fff',fontSize:16,fontWeight:'700'}}>{(otherUser.displayName||'?')[0].toUpperCase()}</Text></View>}
          <View style={{marginLeft:10}}><Text style={h.un}>{otherUser.displayName||otherUser.username}</Text><Text style={[h.st,typing&&{color:'#4ade80'}]}>{typing?'typing…':'online'}</Text></View>
        </TouchableOpacity>
        <View style={{flexDirection:'row',gap:8}}>
          <TouchableOpacity onPress={()=>navigation.navigate('IncomingCall',{channelName:cn(me?.id||'',otherUser.id),isCaller:true,remoteUsername:otherUser.username,fromUserId:me?.id})} style={h.cb}><Phone size={20} color="#fff"/></TouchableOpacity>
          <TouchableOpacity onPress={()=>navigation.navigate('CallScreen',{channelName:cn(me?.id||'',otherUser.id),isCaller:true,remoteUsername:otherUser.username})} style={h.cb}><Video size={20} color="#fff"/></TouchableOpacity>
        </View>
      </View>
      {loading?<View style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator color="#6366f1" size="large"/></View>:(
        <FlatList ref={listRef} data={messages} keyExtractor={m=>m.id} contentContainerStyle={{padding:16,paddingBottom:20}} renderItem={({item})=>{
          const mine = item.user?.id===me?.id;
          return <View style={[h.row,mine?{justifyContent:'flex-end'}:{justifyContent:'flex-start'}]}><View style={[h.bub,mine?h.mine:h.theirs]}><Text style={h.bt}>{item.text}</Text><View style={h.meta}><Text style={h.time}>{new Date(item.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</Text>{mine&&(item.readBy>0?<CheckCheck size={12} color="rgba(255,255,255,0.7)"/>:<Check size={12} color="rgba(255,255,255,0.4)"/>)}</View></View></View>;
        }}/>
      )}
      <View style={h.comp}>
        <View style={h.inpRow}>
          <TextInput value={input} onChangeText={t=>{setInput(t);chRef.current?.keystroke().catch(()=>{});}} placeholder="Message…" placeholderTextColor="rgba(255,255,255,0.3)" style={h.inp} multiline/>
          <TouchableOpacity onPress={send} style={[h.sb,!input.trim()&&{backgroundColor:'rgba(255,255,255,0.1)'}]} disabled={!input.trim()}><Send size={18} color={input.trim()?'#0a0a0a':'rgba(255,255,255,0.3)'}/></TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const h=StyleSheet.create({
  header:{flexDirection:'row',alignItems:'center',paddingHorizontal:12,paddingTop:Platform.OS==='ios'?56:36,paddingBottom:12,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:'rgba(255,255,255,0.08)'},
  ava:{width:36,height:36,borderRadius:18},
  un:{color:'#fff',fontSize:15,fontWeight:'600'},
  st:{color:'rgba(255,255,255,0.5)',fontSize:11,marginTop:1},
  cb:{width:38,height:38,borderRadius:19,backgroundColor:'rgba(255,255,255,0.08)',justifyContent:'center',alignItems:'center'},
  row:{flexDirection:'row',marginVertical:3},
  bub:{maxWidth:'78%',paddingHorizontal:14,paddingVertical:10,borderRadius:20},
  mine:{backgroundColor:'#6366f1',borderBottomRightRadius:6},
  theirs:{backgroundColor:'rgba(255,255,255,0.08)',borderBottomLeftRadius:6,borderWidth:1,borderColor:'rgba(255,255,255,0.06)'},
  bt:{color:'#fff',fontSize:15,lineHeight:21},
  meta:{flexDirection:'row',alignItems:'center',justifyContent:'flex-end',gap:4,marginTop:3},
  time:{color:'rgba(255,255,255,0.4)',fontSize:10},
  comp:{paddingHorizontal:12,paddingBottom:Platform.OS==='ios'?32:12,paddingTop:8,borderTopWidth:StyleSheet.hairlineWidth,borderTopColor:'rgba(255,255,255,0.08)'},
  inpRow:{flexDirection:'row',alignItems:'flex-end',gap:8,backgroundColor:'rgba(255,255,255,0.05)',borderRadius:24,paddingLeft:16,paddingRight:6,paddingVertical:6,borderWidth:1,borderColor:'rgba(255,255,255,0.08)'},
  inp:{flex:1,color:'#fff',fontSize:15,maxHeight:120,paddingVertical:Platform.OS==='ios'?6:2},
  sb:{width:38,height:38,borderRadius:19,backgroundColor:'#fff',justifyContent:'center',alignItems:'center'},
});
