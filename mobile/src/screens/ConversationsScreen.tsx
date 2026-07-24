import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { streamClient } from '../api/streamClient';
import { ChevronLeft, MessageCircle } from '../components/icons';

type Prev = { id:string; name:string; avatar:string; lastMessage:string; lastMessageAt:Date; unread:number; otherUserId:string };

export function ConversationsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [chans, setChans] = useState<Prev[]>([]);
  const [loading, setLoading] = useState(true);
  const [r, setR] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const res = await streamClient.queryChannels({ type:'messaging', members:{ $in:[user.id] } }, { last_message_at:-1 }, { limit:30 });
      const p: Prev[] = res.map(ch => {
        const members = Object.values(ch.state?.members||{});
        const o: any = members.find((m:any)=>m.user_id!==user.id);
        const last = ch.state?.messages?.[ch.state.messages.length-1];
        return { id:ch.id||'', name:o?.user?.name||'?', avatar:o?.user?.image||'', lastMessage:last?.text||'', lastMessageAt:new Date(ch.state?.last_message_at||Date.now()), unread:ch.countUnread(), otherUserId:o?.user_id||'' };
      });
      setChans(p);
    } catch(e) { console.error(e); }
  }, [user]);

  useEffect(() => { (async()=>{setLoading(true);await load();setLoading(false);})(); }, [load]);

  const open = (c:Prev) => navigation.navigate('ChatThread',{ channelId:c.id, otherUser:{ id:c.otherUserId||c.id, username:c.name, displayName:c.name, avatarUrl:c.avatar } });
  const ago = (d:Date) => { const s=Math.floor((Date.now()-d.getTime())/1000); if(s<60)return'now';if(s<3600)return Math.floor(s/60)+'m';if(s<86400)return Math.floor(s/3600)+'h';return Math.floor(s/86400)+'d'; };

  return (
    <View style={{flex:1,backgroundColor:'#0a0a0a'}}>
      <LinearGradient colors={['#0d1117','#0a1628','#09060d']} style={StyleSheet.absoluteFill}/>
      <View style={ss.header}>
        <TouchableOpacity onPress={()=>navigation.goBack()}><ChevronLeft size={24} color="#fff"/></TouchableOpacity>
        <Text style={ss.title}>Messages</Text><View style={{width:40}}/>
      </View>
      {loading?<View style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator color="#6366f1" size="large"/></View>:
      chans.length===0?<View style={{flex:1,justifyContent:'center',alignItems:'center',padding:40}}><MessageCircle size={48} color="rgba(255,255,255,0.15)"/><Text style={{color:'rgba(255,255,255,0.4)',fontSize:16,marginTop:16,textAlign:'center'}}>No messages yet{'\n'}Start one from a profile!</Text></View>:
      <FlatList data={chans} keyExtractor={c=>c.id} refreshControl={<RefreshControl refreshing={r} onRefresh={async()=>{setR(true);await load();setR(false);}} tintColor="#6366f1"/>} contentContainerStyle={{paddingBottom:20}}
        renderItem={({item})=>(
          <TouchableOpacity style={ss.row} onPress={()=>open(item)} activeOpacity={0.7}>
            {item.avatar?<Image source={{uri:item.avatar}} style={ss.ava}/>:<View style={[ss.ava,{backgroundColor:'rgba(99,102,241,0.3)',justifyContent:'center',alignItems:'center'}]}><Text style={{color:'#fff',fontSize:20,fontWeight:'700'}}>{item.name[0]?.toUpperCase()||'?'}</Text></View>}
            <View style={{flex:1}}>
              <View style={ss.tl}><Text style={ss.name} numberOfLines={1}>{item.name}</Text><Text style={ss.ta}>{ago(item.lastMessageAt)}</Text></View>
              <View style={ss.bl}><Text style={ss.lm} numberOfLines={1}>{item.lastMessage||'No messages yet'}</Text>{item.unread>0&&<View style={ss.badge}><Text style={ss.badgeT}>{item.unread>99?'99+':item.unread}</Text></View>}</View>
            </View>
          </TouchableOpacity>
        )}
      />}
    </View>
  );
}

const ss=StyleSheet.create({
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingTop:56,paddingBottom:16,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:'rgba(255,255,255,0.08)'},
  title:{color:'#fff',fontSize:20,fontWeight:'700'},
  row:{flexDirection:'row',alignItems:'center',padding:16,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:'rgba(255,255,255,0.05)'},
  ava:{width:50,height:50,borderRadius:25,marginRight:14},
  tl:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:4},
  name:{color:'#fff',fontSize:16,fontWeight:'600',flex:1},
  ta:{color:'rgba(255,255,255,0.4)',fontSize:12,marginLeft:8},
  bl:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  lm:{color:'rgba(255,255,255,0.5)',fontSize:14,flex:1},
  badge:{backgroundColor:'#6366f1',borderRadius:10,minWidth:20,height:20,justifyContent:'center',alignItems:'center',paddingHorizontal:6,marginLeft:8},
  badgeT:{color:'#fff',fontSize:11,fontWeight:'700'},
});
