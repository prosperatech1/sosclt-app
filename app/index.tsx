import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Vibration } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const handleSOSPress = () => {
    // Inicia contagem de 3 segundos
    setIsRecording(true);
    setCountdown(3);
    
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          activateSOS();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const activateSOS = () => {
    Vibration.vibrate([0, 200, 100, 200]);
    Alert.alert(
      '🆘 SOS Ativado!',
      'Gravação iniciada. Mantenha o app aberto para sua segurança.',
      [{ text: 'Entendi', onPress: () => setIsRecording(false) }]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Olá, Carlos e Kauan.</Text>
        <Text style={styles.status}>Você está protegido.</Text>
      </View>

      {/* Botão SOS */}
      <View style={styles.sosContainer}>
        <TouchableOpacity 
          style={[styles.sosButton, isRecording && styles.sosButtonActive]}
          onPress={handleSOSPress}
          disabled={isRecording}
        >
          {isRecording ? (
            <Text style={styles.sosCountdown}>{countdown}</Text>
          ) : (
            <>
              <Text style={styles.sosIcon}>🆘</Text>
              <Text style={styles.sosLabel}>ACIONAR SOS</Text>
              <Text style={styles.sosSub}>Segure 3 segundos para ativar</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Grade de Ferramentas */}
      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.cardIcon}>⚖️</Text>
          <Text style={styles.cardTitle}>Meus Direitos</Text>
          <Text style={styles.cardSub}>Buscar por situação</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardIcon}>🧮</Text>
          <Text style={styles.cardTitle}>Calculadora</Text>
          <Text style={styles.cardSub}>Férias · 13° · Extras</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardIcon}>👨‍⚖️</Text>
          <Text style={styles.cardTitle}>Jurídico</Text>
          <Text style={[styles.cardSub, {color: '#FFB74D'}]}>⭐ Premium</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardIcon}>📄</Text>
          <Text style={styles.cardTitle}>Documentos</Text>
          <Text style={styles.cardSub}>Gerar e guardar</Text>
        </View>
      </View>

      {/* Barra de Diagnóstico */}
      <View style={styles.diagBar}>
        <View style={styles.diagTop}>
          <Text style={styles.diagTitle}>📋 Diagnóstico trabalhista</Text>
          <Text style={styles.diagBadge}>40% feito</Text>
        </View>
        <View style={styles.diagProgress}>
          <View style={[styles.diagFill, {width: '40%'}]} />
        </View>
        <Text style={styles.diagSub}>Continue para ver se está sendo lesado →</Text>
      </View>

      {/* Alerta */}
      <View style={styles.alert}>
        <Text style={styles.alertIcon}>⚠️</Text>
        <Text style={styles.alertText}>
          <Text style={styles.alertStrong}>ALERTA DA SEMANA</Text>
          {'\n'}Nova súmula do TST sobre hora extra. Pode te afetar.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  header: { padding: 20, paddingTop: 50 },
  greeting: { color: '#fff', fontSize: 18, fontFamily: 'System' },
  status: { color: '#81C784', fontSize: 14, fontStyle: 'italic', marginTop: 4 },
  
  sosContainer: { alignItems: 'center', padding: 16 },
  sosButton: {
    width: '90%', backgroundColor: '#C62828', borderRadius: 20,
    padding: 24, alignItems: 'center',
    shadowColor: '#C62828', shadowOffset: {width:0, height:4},
    shadowOpacity: 0.5, shadowRadius: 8, elevation: 6
  },
  sosButtonActive: { backgroundColor: '#8B0000' },
  sosIcon: { fontSize: 32, marginBottom: 8 },
  sosLabel: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  sosSub: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 4, fontStyle: 'italic' },
  sosCountdown: { color: '#fff', fontSize: 48, fontWeight: '900' },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
  card: {
    width: '48%', backgroundColor: '#1E1E1E', borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },
  cardIcon: { fontSize: 18, marginBottom: 4 },
  cardTitle: { color: '#F0F0F0', fontSize: 13, fontWeight: '700' },
  cardSub: { color: 'rgba(255,255,255,0.35)', fontSize: 9, marginTop: 2 },
  
  diagBar: { margin: 16, backgroundColor: '#1E3A1E', borderRadius: 14, padding: 14, borderColor: 'rgba(46,125,50,0.3)', borderWidth: 1 },
  diagTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  diagTitle: { color: '#81C784', fontSize: 12, fontWeight: '700' },
  diagBadge: { color: '#81C784', fontSize: 9, backgroundColor: 'rgba(46,125,50,0.3)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100 },
  diagProgress: { height: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10 },
  diagFill: { height: '100%', backgroundColor: '#2E7D32', borderRadius: 10 },
  diagSub: { color: 'rgba(255,255,255,0.3)', fontSize: 9, marginTop: 5, fontStyle: 'italic' },
  
  alert: { margin: 16, backgroundColor: '#1A1500', borderRadius: 14, padding: 12, flexDirection: 'row', gap: 10, borderColor: 'rgba(255,143,0,0.3)', borderWidth: 1 },
  alertIcon: { fontSize: 16 },
  alertText: { color: '#FFB74D', fontSize: 10, flex: 1 },
  alertStrong: { fontWeight: '700', fontSize: 11 }
});
