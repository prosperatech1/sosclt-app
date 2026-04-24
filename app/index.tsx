import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Vibration, FlatList, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

type Recording = {
  name: string;
  uri: string;
  date: string;
  duration?: string; // Futuro: calcular duração real do arquivo
};

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [timer, setTimer] = useState(0);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [playingUri, setPlayingUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão Negada', 'Ative o microfone nas configurações do app.');
      }
      loadRecordings();
    })();
    return () => {
      stopRecordingSilently();
      if (sound) sound.unloadAsync().catch(() => {});
    };
  }, []);

  const loadRecordings = async () => {
    try {
      const dir = FileSystem.documentDirectory!;
      const files = await FileSystem.readDirectoryAsync(dir);
      const sosFiles = files.filter(f => f.startsWith('SOS_') && f.endsWith('.m4a'));
      const sorted = sosFiles.sort((a, b) => b.localeCompare(a));
      
      const mapped: Recording[] = sorted.map(name => {
        const timestamp = parseInt(name.replace('SOS_', '').replace('.m4a', ''));
        return {
          name,
          uri: dir + name,
          date: new Date(timestamp).toLocaleString('pt-BR', { 
            day: '2-digit', month: '2-digit', year: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
          })
        };
      });
      setRecordings(mapped);
    } catch (err) {
      console.error('Erro ao carregar gravações:', err);
    }
  };

  const stopRecordingSilently = async () => {
    if (recording) {
      try { await recording.stopAndUnloadAsync(); } catch {}
      setRecording(null);
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setCountdown(3);
    setTimer(0);
  };

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRec);
      setIsRecording(true);
      setTimer(0);

      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    } catch (err) {
      console.error('Falha ao iniciar gravação:', err);
      Alert.alert('Erro', 'Não foi possível acessar o microfone.');
    }
  };

  const stopAndSave = async () => {
    if (!recording) return;
    try {
      if (timerRef.current) clearInterval(timerRef.current);
      
      await recording.stopAndUnloadAsync();
      const tempUri = recording.getURI();
      
      const fileName = `SOS_${Date.now()}.m4a`;
      const finalPath = FileSystem.documentDirectory + fileName;
      
      await FileSystem.copyAsync({ from: tempUri!, to: finalPath });
      
      Alert.alert('✅ Salvo!', 'Gravação guardada com segurança.');
      loadRecordings();
    } catch (err) {
      console.error('Erro ao salvar:', err);
      Alert.alert('Erro', 'Não foi possível salvar o arquivo.');
    } finally {
      setRecording(null);
      setIsRecording(false);
      setCountdown(3);
      setTimer(0);
    }
  };

  const togglePlay = async (uri: string) => {
    try {
      if (playingUri === uri) {
        await sound?.stopAsync();
        setSound(null);
        setPlayingUri(null);
        return;
      }
      if (sound) await sound.unloadAsync();
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri }, 
        { shouldPlay: true }
      );
      setSound(newSound);
      setPlayingUri(uri);
      
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingUri(null);
          setSound(null);
        }
      });
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível reproduzir o áudio.');
    }
  };

  const shareFile = async (uri: string) => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Indisponível', 'Compartilhamento não suportado.');
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: 'audio/mp4',
        dialogTitle: 'Enviar gravação SOS',
        UTI: 'public.audio'
      });
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível compartilhar.');
    }
  };

  const deleteRecording = async (uri: string, name: string) => {
    Alert.alert(
      '🗑️ Apagar gravação?',
      `Tem certeza que deseja excluir ${name.replace('SOS_', '').replace('.m4a', '')}? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Apagar', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await FileSystem.deleteAsync(uri);
              if (playingUri === uri) {
                await sound?.unloadAsync();
                setSound(null);
                setPlayingUri(null);
              }
              loadRecordings();
              Alert.alert('✅ Removido', 'Arquivo excluído com sucesso.');
            } catch (err) {
              Alert.alert('Erro', 'Não foi possível excluir o arquivo.');
            }
          }
        }
      ]
    );
  };

  const handlePressIn = () => {
    if (isRecording) return;
    setIsRecording(true);
    setCountdown(3);
    
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          startRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const renderRecording = ({ item }: { item: Recording }) => (
    <View style={styles.recItem}>
      <View style={styles.recInfo}>
        <Text style={styles.recDate}>📅 {item.date}</Text>
        <Text style={styles.recName}>{item.name.replace('SOS_', '').replace('.m4a', '')}</Text>
      </View>
      <View style={styles.recActions}>
        <TouchableOpacity 
          style={[styles.actionBtn, playingUri === item.uri && styles.actionBtnActive]} 
          onPress={() => togglePlay(item.uri)}
        >
          <Text style={styles.actionText}>{playingUri === item.uri ? '⏸' : '▶'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => shareFile(item.uri)}>
          <Text style={styles.actionText}>📤</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteRecording(item.uri, item.name)}>
          <Text style={styles.deleteText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.greeting}>Olá, Carlos.</Text>
        <Text style={styles.status}>Você está protegido.</Text>
      </View>

      <View style={styles.sosContainer}>
        <TouchableOpacity 
          style={[styles.sosBtn, isRecording && styles.sosBtnActive]}
          onPressIn={handlePressIn}
          disabled={isRecording && countdown === 0}
        >
          {isRecording && countdown > 0 ? (
            <><Text style={styles.icon}>⏱️</Text><Text style={styles.bigNum}>{countdown}</Text><Text style={styles.sub}>Solte para cancelar</Text></>
          ) : isRecording ? (
            <><Text style={styles.icon}>🔴</Text><Text style={styles.bigNum}>{formatTime(timer)}</Text><Text style={styles.sub}>Gravando... Toque para PARAR</Text></>
          ) : (
            <><Text style={styles.icon}>🆘</Text><Text style={styles.label}>ACIONAR SOS</Text><Text style={styles.sub}>Segure 3s para ativar</Text></>
          )}
        </TouchableOpacity>

        {isRecording && countdown === 0 && (
          <TouchableOpacity style={styles.stopBtn} onPress={stopAndSave}>
            <Text style={styles.stopText}>⏹️ PARAR & SALVAR</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 📂 Lista de Gravações */}
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>📂 Minhas Gravações ({recordings.length})</Text>
        {recordings.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma gravação ainda. Ative o SOS para começar.</Text>
        ) : (
          <FlatList
            data={recordings}
            keyExtractor={item => item.uri}
            renderItem={renderRecording}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <View style={styles.grid}>
        <View style={styles.card}><Text style={styles.cIcon}>⚖️</Text><Text style={styles.cTitle}>Meus Direitos</Text></View>
        <View style={styles.card}><Text style={styles.cIcon}>🧮</Text><Text style={styles.cTitle}>Calculadora</Text></View>
        <View style={styles.card}><Text style={styles.cIcon}>👨‍⚖️</Text><Text style={[styles.cSub, {color:'#FFB74D'}]}>Jurídico ⭐</Text></View>
        <View style={styles.card}><Text style={styles.cIcon}>📄</Text><Text style={styles.cTitle}>Documentos</Text></View>
      </View>
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
  
  listContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  listTitle: { color: '#81C784', fontSize: 16, fontWeight: '700', marginBottom: 12, paddingLeft: 4 },
  listContent: { paddingBottom: 20 },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
  
  recItem: {
    backgroundColor: '#1A1A1A', borderRadius: 12, padding: 12, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },
  recInfo: { flex: 1, marginRight: 8 },
  recDate: { color: '#aaa', fontSize: 11, marginBottom: 2 },
  recName: { color: '#fff', fontSize: 13, fontWeight: '600' },
  recActions: { flexDirection: 'row', gap: 8 },
  
  actionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2196F3', alignItems: 'center', justifyContent: 'center' },
  actionBtnActive: { backgroundColor: '#FF9800' },
  actionText: { color: '#fff', fontSize: 14 },
  
  deleteBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,82,82,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FF5252' },
  deleteText: { fontSize: 14 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
  card: { width: '48%', backgroundColor: '#1E1E1E', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cIcon: { fontSize: 18, marginBottom: 4 },
  cTitle: { color: '#F0F0F0', fontSize: 13, fontWeight: '700' },
  cSub: { color: 'rgba(255,255,255,0.35)', fontSize: 9, marginTop: 2 }
});
