import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Vibration, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [savedUri, setSavedUri] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão Negada', 'Ative o microfone nas configurações do app.');
      }
    })();
    return () => stopRecordingSilently();
  }, []);

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
      
      // Salvar permanentemente no diretório do app
      const fileName = `SOS_${Date.now()}.m4a`;
      const finalPath = FileSystem.documentDirectory + fileName;
      
      await FileSystem.copyAsync({ from: tempUri!, to: finalPath });
      setSavedUri(finalPath);
      
      console.log('✅ Arquivo salvo em:', finalPath);
      
      Alert.alert(
        '✅ Gravação Salva!',
        'O áudio foi guardado com segurança no seu celular.',
        [{ text: 'OK' }]
      );
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

  const shareFile = async () => {
    if (!savedUri) return;
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Indisponível', 'Compartilhamento não suportado neste dispositivo.');
        return;
      }
      await Sharing.shareAsync(savedUri, {
        mimeType: 'audio/mp4',
        dialogTitle: 'Enviar gravação SOS',
        UTI: 'public.audio' // iOS fallback
      });
    } catch (err) {
      console.error('Erro ao compartilhar:', err);
      Alert.alert('Erro', 'Não foi possível abrir o menu de compartilhamento.');
    }
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

      {savedUri && (
        <View style={styles.savedCard}>
          <Text style={styles.savedIcon}>📂</Text>
          <View style={{flex: 1}}>
            <Text style={styles.savedTitle}>Áudio salvo com sucesso!</Text>
            <Text style={styles.savedSub}>Toque para enviar ou guardar</Text>
          </View>
          <TouchableOpacity style={styles.shareBtn} onPress={shareFile}>
            <Text style={styles.shareText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      )}

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
  
  savedCard: { margin: 16, padding: 14, backgroundColor: '#1E3A1E', borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderColor: '#2E7D32', borderWidth: 1 },
  savedIcon: { fontSize: 24 },
  savedTitle: { color: '#81C784', fontWeight: '600' },
  savedSub: { color: '#aaa', fontSize: 10 },
  shareBtn: { backgroundColor: '#FFB74D', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  shareText: { color: '#000', fontWeight: '700', fontSize: 12 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
  card: { width: '48%', backgroundColor: '#1E1E1E', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cIcon: { fontSize: 18, marginBottom: 4 },
  cTitle: { color: '#F0F0F0', fontSize: 13, fontWeight: '700' },
  cSub: { color: 'rgba(255,255,255,0.35)', fontSize: 9, marginTop: 2 }
});
