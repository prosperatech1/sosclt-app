import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Vibration, Share } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [recording, setRecording] = useState<any>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    requestPermission();
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  const requestPermission = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'O app precisa do microfone para funcionar.');
      }
    } catch (e) {
      console.log('Erro permissão:', e);
    }
  };

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
      setRecordingTime(0);
      
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      (newRecording as any)._timer = timer;
      
    } catch (e) {
      console.log('Erro ao iniciar:', e);
      Alert.alert('Erro', 'Não foi possível gravar.');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    
    try {
      if ((recording as any)._timer) clearInterval((recording as any)._timer);
      
      await recording.stopAndUnloadAsync();
      const tempUri = recording.getURI();
      
      // --- A MÁGICA ACONTECE AQUI: MOVER O ARQUIVO PARA PASTA PÚBLICA ---
      // Copia do Cache (temporário) para Documentos (permanente)
      const fileName = `SOSCLT_Gravação_${new Date().getTime()}.m4a`;
      const finalPath = FileSystem.documentDirectory + fileName;
      
      await FileSystem.moveAsync({
        from: tempUri!,
        to: finalPath
      });

      setAudioUri(finalPath);
      setRecording(null);
      setIsRecording(false);
      setCountdown(3);
      setRecordingTime(0);
      
      console.log('✅ Arquivo salvo em:', finalPath);
      
      Alert.alert(
        '✅ Sucesso!',
        'Áudio gravado e salvo na pasta Documentos do seu celular.',
        [{ text: 'OK' }]
      );
    } catch (e) {
      console.log('Erro ao salvar:', e);
      Alert.alert('Erro', 'Não foi possível salvar o arquivo.');
      setIsRecording(false);
      setCountdown(3);
    }
  };

  const shareAudio = async () => {
    if (!audioUri) return;
    
    try {
      // Usa o compartilhamento nativo do Android (abre WhatsApp, Email, Drive, etc)
      await Share.share({
        url: audioUri,
        title: 'Gravação SOSCLT',
        message: 'Segue a gravação de emergência.'
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível compartilhar.');
    }
  };

  const handleSOSPressIn = () => {
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
          style={[styles.sosButton, isRecording && countdown === 0 && styles.sosButtonRecording]}
          onPressIn={handleSOSPressIn}
          disabled={isRecording && countdown === 0}
          activeOpacity={0.8}
        >
          {isRecording && countdown > 0 ? (
            <>
              <Text style={styles.sosIcon}>⏱️</Text>
              <Text style={styles.sosCountdown}>{countdown}</Text>
              <Text style={styles.sosSub}>Solte para cancelar</Text>
            </>
          ) : isRecording && countdown === 0 ? (
            <>
              <Text style={styles.sosIcon}>🔴</Text>
              <Text style={styles.sosLabel}>{formatTime(recordingTime)}</Text>
              <Text style={styles.sosSub}>Gravando... Toque para PARAR</Text>
            </>
          ) : (
            <>
              <Text style={styles.sosIcon}>🆘</Text>
              <Text style={styles.sosLabel}>ACIONAR SOS</Text>
              <Text style={styles.sosSub}>Segure 3 segundos para ativar</Text>
            </>
          )}
        </TouchableOpacity>
        
        {isRecording && countdown === 0 && (
          <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
            <Text style={styles.stopText}>⏹️ PARAR GRAVAÇÃO</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Botão de Compartilhar (só aparece se tiver áudio salvo) */}
      {audioUri && (
        <View style={styles.statusCard}>
          <Text style={styles.statusIcon}>📂</Text>
          <View style={{flex: 1}}>
            <Text style={styles.statusText}>Arquivo salvo!</Text>
            <Text style={{color: '#aaa', fontSize: 10}}>Toque abaixo para enviar</Text>
          </View>
          <TouchableOpacity style={styles.shareBtn} onPress={shareAudio}>
            <Text style={styles.shareText}>Compartilhar</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.grid}>
        <View style={styles.card}><Text style={styles.cardIcon}>⚖️</Text><Text style={styles.cardTitle}>Meus Direitos</Text></View>
        <View style={styles.card}><Text style={styles.cardIcon}>🧮</Text><Text style={styles.cardTitle}>Calculadora</Text></View>
        <View style={styles.card}><Text style={styles.cardIcon}>👨‍⚖️</Text><Text style={[styles.cardSub, {color: '#FFB74D'}]}>Jurídico ⭐</Text></View>
        <View style={styles.card}><Text style={styles.cardIcon}>📄</Text><Text style={styles.cardTitle}>Documentos</Text></View>
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
  sosButton: {
    width: '90%', backgroundColor: '#C62828', borderRadius: 20,
    padding: 24, alignItems: 'center', marginBottom: 12,
    shadowColor: '#C62828', shadowOffset: {width:0, height:4},
    shadowOpacity: 0.5, shadowRadius: 8, elevation: 6
  },
  sosButtonRecording: { backgroundColor: '#8B0000' },
  sosIcon: { fontSize: 32, marginBottom: 8 },
  sosLabel: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  sosSub: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 4, fontStyle: 'italic' },
  sosCountdown: { color: '#fff', fontSize: 48, fontWeight: '900' },
  
  stopButton: { backgroundColor: '#FF5252', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 30, marginTop: 8 },
  stopText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  
  statusCard: {
    margin: 16, padding: 14, backgroundColor: '#1E3A1E',
    borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 10,
    borderColor: '#2E7D32', borderWidth: 1
  },
  statusIcon: { fontSize: 20 },
  statusText: { color: '#81C784', fontWeight: '600' },
  shareBtn: { backgroundColor: '#FFB74D', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  shareText: { color: '#000', fontWeight: '700', fontSize: 12 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
  card: { width: '48%', backgroundColor: '#1E1E1E', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardIcon: { fontSize: 18, marginBottom: 4 },
  cardTitle: { color: '#F0F0F0', fontSize: 13, fontWeight: '700' },
  cardSub: { color: 'rgba(255,255,255,0.35)', fontSize: 9, marginTop: 2 }
});
