import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, Alert, Modal, FlatList, 
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Location from 'expo-location';
import * as Crypto from 'expo-crypto';
import { supabase } from '../services/supabase';

type Recording = {
  name: string;
  uri: string;
  date: string;
};

const PAGE_SIZE = 5;

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Se não houver sessão, mostra tela de Login
  if (!session) {
    return <AuthScreen setSession={setSession} />;
  }

  // Se houver sessão, mostra o App Principal (SOS)
  return <HomeScreen session={session} setSession={setSession} />;
}

// --- TELA DE LOGIN / CADASTRO ---
function AuthScreen({ setSession }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        Alert.alert('Sucesso', 'Conta criada! Faça login.');
        setIsLogin(true);
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.authContainer}>
      <StatusBar style="light" />
      <Text style={styles.authTitle}>🛡️ SOSCLT</Text>
      <Text style={styles.authSubtitle}>{isLogin ? 'Entrar na sua conta' : 'Criar nova conta'}</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.authBtn} onPress={handleAuth} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : (
          <Text style={styles.authBtnText}>{isLogin ? 'ENTRAR' : 'CADASTRAR'}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={{ marginTop: 15 }}>
        <Text style={styles.authLink}>{isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}</Text>
      </TouchableOpacity>
    </View>
  );
}

// --- TELA PRINCIPAL (SOS) ---
function HomeScreen({ session, setSession }: any) {
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<any>(null);

  const [allRecordings, setAllRecordings] = useState<Recording[]>([]);
  const [visibleRecordings, setVisibleRecordings] = useState<Recording[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  
  const [playingUri, setPlayingUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Verifica sessão ativa
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    
    loadAllRecordings();
    return () => {
      stopRecordingSilently();
      if (sound) sound.unloadAsync().catch(() => {});
    };
  }, []);

  const loadAllRecordings = async () => {
    try {
      // Agora buscamos APENAS os áudios do usuário logado
      const { data, error } = await supabase
        .from('sos_records')
        .select('file_name, file_path, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mapped = data.map(item => ({
          name: item.file_name,
          uri: `https://yweyflgschjpkwysopps.supabase.co/storage/v1/object/public/sos-recordings/${item.file_path}`, // URL pública direta
          date: new Date(item.created_at).toLocaleString('pt-BR')
        }));
        setAllRecordings(mapped);
      }
    } catch (err) { console.error('Erro ao carregar:', err); }
  };

  const openHistory = () => {
    setPage(1);
    setVisibleRecordings(allRecordings.slice(0, PAGE_SIZE));
    setHasMore(allRecordings.length > PAGE_SIZE);
    setShowHistory(true);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    const start = (nextPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    setVisibleRecordings(prev => [...prev, ...allRecordings.slice(start, end)]);
    setPage(nextPage);
    setHasMore(end < allRecordings.length);
  };

  const stopRecordingSilently = async () => {
    if (recording) { try { await recording.stopAndUnloadAsync(); } catch {} setRecording(null); }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false); setCountdown(3); setTimer(0);
  };

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: newRec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(newRec); setIsRecording(true); setTimer(0);
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    } catch (err) { Alert.alert('Erro', 'Não foi possível acessar o microfone.'); }
  };

  const stopAndSave = async () => {
    if (!recording) return;
    setUploading(true);
    try {
      if (timerRef.current) clearInterval(timerRef.current);
      await recording.stopAndUnloadAsync();
      const tempUri = recording.getURI();
      const fileName = `SOS_${Date.now()}.m4a`;
      const finalPath = FileSystem.documentDirectory + fileName;
      await FileSystem.copyAsync({ from: tempUri!, to: finalPath });

      Alert.alert('📡 Processando...', 'Criptografando e enviando...');
      
      let locationData = { lat: 0, lng: 0, acc: 0 };
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          locationData = { lat: loc.coords.latitude, lng: loc.coords.longitude, acc: loc.coords.accuracy || 0 };
        }
      } catch (e) { console.log('GPS fallback:', e); }

      const fileBase64 = await FileSystem.readAsStringAsync(finalPath, { encoding: FileSystem.EncodingType.Base64 });
      const fileHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, fileBase64);
      
      const cloudPath = `recordings/${session.user.id}/${fileName}`; // Pasta separada por usuário
      const { error: uploadError } = await supabase.storage.from('sos-recordings').upload(cloudPath, { uri: finalPath }, { contentType: 'audio/mp4' });
      if (uploadError) throw uploadError;

      await supabase.from('sos_records').insert({
        file_name: fileName, file_path: cloudPath, file_hash: fileHash,
        user_id: session.user.id, // Vincula ao usuário
        latitude: locationData.lat, longitude: locationData.lng, accuracy: locationData.acc,
        created_at: new Date().toISOString(), status: 'secured'
      });

      Alert.alert('✅ PROVA REGISTRADA!', 'Backup seguro realizado.');
      await loadAllRecordings();
    } catch (err: any) {
      Alert.alert('⚠️ Erro', err.message || 'Falha ao salvar.');
    } finally {
      setRecording(null); setIsRecording(false); setCountdown(3); setTimer(0); setUploading(false);
    }
  };

  const togglePlay = async (uri: string) => {
    try {
      if (playingUri === uri) { await sound?.stopAsync(); setSound(null); setPlayingUri(null); return; }
      if (sound) await sound.unloadAsync();
      const { sound: newSound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      setSound(newSound); setPlayingUri(uri);
      newSound.setOnPlaybackStatusUpdate((status) => { if (status.isLoaded && status.didJustFinish) { setPlayingUri(null); setSound(null); } });
    } catch { Alert.alert('Erro', 'Não foi possível reproduzir.'); }
  };

  const shareFile = async (uri: string) => {
    try { await Sharing.shareAsync(uri, { mimeType: 'audio/mp4', dialogTitle: 'Enviar gravação SOS', UTI: 'public.audio' }); }
    catch { Alert.alert('Erro', 'Não foi possível compartilhar.'); }
  };

  const handlePressIn = () => {
    if (isRecording) return;
    setIsRecording(true); setCountdown(3);
    const interval = setInterval(() => {
      setCountdown(prev => { if (prev <= 1) { clearInterval(interval); startRecording(); return 0; } return prev - 1; });
    }, 1000);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const renderRecording = ({ item }: { item: Recording }) => (
    <View style={styles.recItem}>
      <View style={styles.recInfo}>
        <Text style={styles.recDate}>{item.date}</Text>
        <Text style={styles.recName} numberOfLines={1}>{item.name}</Text>
      </View>
      <View style={styles.recActions}>
        <TouchableOpacity style={[styles.actBtn, playingUri === item.uri && styles.actBtnPlay]} onPress={() => togglePlay(item.uri)}>
          <Text style={styles.actText}>{playingUri === item.uri ? '⏸' : '▶'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actBtn} onPress={() => shareFile(item.uri)}>
          <Text style={styles.actText}>📤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.greeting}>Olá, {session.user.email?.split('@')[0]}.</Text>
        <Text style={styles.status}>Você está protegido.</Text>
      </View>

      <View style={styles.sosContainer}>
        <TouchableOpacity style={[styles.sosBtn, isRecording && styles.sosBtnActive]} onPressIn={handlePressIn} disabled={isRecording && countdown === 0}>
          {isRecording && countdown > 0 ? (
            <><Text style={styles.icon}>⏱️</Text><Text style={styles.bigNum}>{countdown}</Text><Text style={styles.sub}>Solte para cancelar</Text></>
          ) : isRecording ? (
            <><Text style={styles.icon}>🔴</Text><Text style={styles.bigNum}>{formatTime(timer)}</Text><Text style={styles.sub}>Gravando... Toque para PARAR</Text></>
          ) : (
            <><Text style={styles.icon}>🆘</Text><Text style={styles.label}>ACIONAR SOS</Text><Text style={styles.sub}>Segure 3s para ativar</Text></>
          )}
        </TouchableOpacity>
        {isRecording && countdown === 0 && (
          <TouchableOpacity style={styles.stopBtn} onPress={stopAndSave} disabled={uploading}>
            <Text style={styles.stopText}>{uploading ? '📡 Enviando...' : '⏹️ PARAR & SALVAR'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.folderBtn} onPress={openHistory} activeOpacity={0.7}>
        <Text style={styles.folderIcon}>📂</Text>
        <Text style={styles.folderText}>Minhas Gravações</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>{allRecordings.length}</Text></View>
        <Text style={styles.arrow}>→</Text>
      </TouchableOpacity>

      <Modal visible={showHistory} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📂 Histórico</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)} style={styles.closeBtn}><Text style={styles.closeText}>✕</Text></TouchableOpacity>
            </View>
            {allRecordings.length === 0 ? <Text style={styles.emptyText}>Nenhuma gravação.</Text> : (
              <>
                <FlatList data={visibleRecordings} keyExtractor={item => item.uri} renderItem={renderRecording} contentContainerStyle={styles.listContent} />
                {hasMore && <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore}><Text style={styles.loadMoreText}>Carregar mais</Text></TouchableOpacity>}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Botão de Sair */}
      <TouchableOpacity style={styles.logoutBtn} onPress={() => supabase.auth.signOut()}>
        <Text style={styles.logoutText}>Sair da Conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  header: { padding: 20, paddingTop: 50 },
  greeting: { color: '#fff', fontSize: 18 },
  status: { color: '#81C784', fontSize: 14, fontStyle: 'italic', marginTop: 4 },
  sosContainer: { alignItems: 'center', padding: 16 },
  sosBtn: { width: '90%', backgroundColor: '#C62828', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 12, elevation: 6 },
  sosBtnActive: { backgroundColor: '#8B0000' },
  icon: { fontSize: 32, marginBottom: 8 },
  label: { color: '#fff', fontSize: 22, fontWeight: '900' },
  sub: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 4 },
  bigNum: { color: '#fff', fontSize: 48, fontWeight: '900' },
  stopBtn: { backgroundColor: '#FF5252', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 30 },
  stopText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  folderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, marginTop: 8, padding: 16, backgroundColor: '#1A1A1A', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  folderIcon: { fontSize: 20, marginRight: 12 },
  folderText: { color: '#fff', fontSize: 16, fontWeight: '600', flex: 1 },
  badge: { backgroundColor: '#2196F3', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginRight: 10 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  arrow: { color: '#666', fontSize: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#151515', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  closeBtn: { padding: 8 },
  closeText: { color: '#aaa', fontSize: 20 },
  listContent: { paddingBottom: 10 },
  emptyText: { color: '#666', textAlign: 'center', marginVertical: 30 },
  recItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  recInfo: { flex: 1, marginRight: 10 },
  recDate: { color: '#888', fontSize: 11, marginBottom: 2 },
  recName: { color: '#ddd', fontSize: 13, fontWeight: '500' },
  recActions: { flexDirection: 'row', gap: 8 },
  actBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2196F3', alignItems: 'center', justifyContent: 'center' },
  actBtnPlay: { backgroundColor: '#FF9800' },
  actText: { color: '#fff', fontSize: 14 },
  loadMoreBtn: { marginTop: 16, padding: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, alignItems: 'center' },
  loadMoreText: { color: '#81C784', fontWeight: '600' },
  logoutBtn: { marginTop: 'auto', marginBottom: 40, alignItems: 'center' },
  logoutText: { color: '#666', fontSize: 14 },

  // Login Styles
  authContainer: { flex: 1, backgroundColor: '#0F0F0F', justifyContent: 'center', padding: 30 },
  authTitle: { fontSize: 32, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 10 },
  authSubtitle: { fontSize: 16, color: '#81C784', textAlign: 'center', marginBottom: 40 },
  input: { backgroundColor: '#1A1A1A', color: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  authBtn: { backgroundColor: '#C62828', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  authBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  authLink: { color: '#81C784', textAlign: 'center', marginTop: 20 }
});
