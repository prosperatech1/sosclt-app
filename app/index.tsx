--- app/index.tsx (原始)


+++ app/index.tsx (修改后)
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { SOSButton } from '../components/SOSButton';

/**
 * Tela Home do app SOSCLT
 * - Exibe saudação personalizada
 * - Botão SOS para gravação de emergência
 */

// [⚠️ ATENÇÃO] Em produção, estes dados viriam do Supabase ou armazenamento local
const MOCK_USER = {
  id: 'user_123',
  name: 'João Silva',
  whatsapp_contact: '5511999999999',
};

export default function HomeScreen() {
  const [isRecording, setIsRecording] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>SOSCLT</Text>
        <Text style={styles.appSubtitle}>Proteção Trabalhista</Text>
      </View>

      {/* Conteúdo Principal */}
      <View style={styles.content}>
        {/* Saudação */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>
            Olá, {MOCK_USER.name}.
          </Text>
          <Text style={styles.protectionText}>
            Você está protegido. 🛡️
          </Text>
        </View>

        {/* Botão SOS */}
        <View style={styles.sosContainer}>
          <SOSButton
            userId={MOCK_USER.id}
            whatsappContact={MOCK_USER.whatsapp_contact}
            onRecordingStart={() => setIsRecording(true)}
            onRecordingStop={() => setIsRecording(false)}
          />
        </View>

        {/* Instruções */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Como usar:</Text>
          <Text style={styles.instructionItem}>
            1️⃣ Segure o botão por 3 segundos
          </Text>
          <Text style={styles.instructionItem}>
            2️⃣ A gravação iniciará automaticamente
          </Text>
          <Text style={styles.instructionItem}>
            3️⃣ Solte quando terminar
          </Text>
          <Text style={styles.instructionItem}>
            4️⃣ Escolha enviar para seu contato
          </Text>
        </View>

        {/* Status */}
        {isRecording && (
          <View style={styles.statusContainer}>
            <View style={styles.recordingIndicator} />
            <Text style={styles.statusText}>Gravando áudio...</Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Seus direitos trabalhistas protegidos
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#16213e',
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF0000',
    letterSpacing: 2,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 5,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  greetingContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  greetingText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  protectionText: {
    fontSize: 18,
    color: '#4CAF50',
    marginTop: 10,
    fontWeight: '500',
  },
  sosContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  instructionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  instructionItem: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
    lineHeight: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF0000',
    marginRight: 10,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: '#16213e',
  },
  footerText: {
    color: '#888888',
    fontSize: 14,
  },
});
