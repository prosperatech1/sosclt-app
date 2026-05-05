--- components/SOSButton.tsx (原始)


+++ components/SOSButton.tsx (修改后)
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { CountdownAnimation } from './CountdownAnimation';
import { audioRecordingService } from '../services/audioRecording';
import { sendSOSRecordingToWhatsApp } from '../services/whatsapp';
import { uploadAudioToSupabase, saveSOSRecord } from '../services/supabase';

/**
 * Botão SOS principal do app
 * - Segure por 3 segundos para iniciar gravação
 * - Solte para parar e salvar
 * - Opção de enviar para WhatsApp
 */

interface SOSButtonProps {
  userId: string;
  whatsappContact?: string;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
}

export const SOSButton: React.FC<SOSButtonProps> = ({
  userId,
  whatsappContact,
  onRecordingStart,
  onRecordingStop,
}) => {
  const [isPressing, setIsPressing] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [lastRecording, setLastRecording] = useState<{
    fileUri: string;
    duration: number;
  } | null>(null);

  // Timer para segurar o botão
  let holdTimer: NodeJS.Timeout;

  /**
   * Inicia a pressão no botão SOS
   */
  const handlePressIn = () => {
    setIsPressing(true);
    setShowCountdown(true);

    // Iniciar timer de 3 segundos
    holdTimer = setTimeout(() => {
      // Após 3 segundos, iniciar gravação
      startRecording();
    }, 3000);
  };

  /**
   * Para a pressão no botão SOS
   */
  const handlePressOut = async () => {
    clearTimeout(holdTimer);

    if (isRecording) {
      // Se estava gravando, parar
      await stopRecording();
    } else {
      // Se não chegou a gravar, apenas esconder countdown
      setShowCountdown(false);
    }

    setIsPressing(false);
  };

  /**
   * Inicia a gravação de áudio
   */
  const startRecording = async () => {
    setShowCountdown(false);
    setIsRecording(true);

    const success = await audioRecordingService.startRecording(userId);

    if (success) {
      onRecordingStart?.();
      console.log('Gravação iniciada com sucesso');
    } else {
      Alert.alert('Erro', 'Não foi possível iniciar a gravação');
      setIsRecording(false);
    }
  };

  /**
   * Para a gravação de áudio
   */
  const stopRecording = async () => {
    const metadata = await audioRecordingService.stopRecording();
    setIsRecording(false);
    onRecordingStop?.();

    if (metadata) {
      setLastRecording({
        fileUri: metadata.fileUri,
        duration: metadata.duration,
      });

      // Upload opcional para Supabase
      const fileUrl = await uploadAudioToSupabase(metadata.fileUri, userId);

      if (fileUrl) {
        await saveSOSRecord({
          user_id: userId,
          file_url: fileUrl,
          duration: metadata.duration,
          created_at: metadata.createdAt,
        });
      }

      // Mostrar modal de envio
      setShowSendModal(true);
    }
  };

  /**
   * Envia gravação para WhatsApp
   */
  const handleSendToWhatsApp = async () => {
    if (!lastRecording || !whatsappContact) {
      Alert.alert('Erro', 'Contato não configurado');
      return;
    }

    const success = await sendSOSRecordingToWhatsApp(
      whatsappContact,
      lastRecording.fileUri,
      lastRecording.duration
    );

    if (success) {
      Alert.alert('Sucesso', 'Gravação enviada para WhatsApp');
      setShowSendModal(false);
    } else {
      Alert.alert('Erro', 'Não foi possível enviar');
    }
  };

  /**
   * Cancela o envio
   */
  const handleCancelSend = () => {
    setShowSendModal(false);
  };

  return (
    <>
      {/* Botão SOS */}
      <TouchableOpacity
        style={[
          styles.button,
          isRecording && styles.buttonRecording,
          isPressing && styles.buttonPressed,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isRecording}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          {isRecording ? '🔴 GRAVANDO...' : '🆘 ACIONAR SOS\nSegure 3 segundos'}
        </Text>
      </TouchableOpacity>

      {/* Animação de contagem */}
      {showCountdown && (
        <CountdownAnimation
          isActive={showCountdown}
          onComplete={() => {
            // Callback quando completa 3 segundos
          }}
        />
      )}

      {/* Modal de envio */}
      <Modal
        visible={showSendModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelSend}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Gravação Salva! 🎉</Text>
            <Text style={styles.modalText}>
              Deseja enviar esta gravação para seu contato de emergência?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelSend}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.sendButton]}
                onPress={handleSendToWhatsApp}
              >
                <Text style={styles.sendButtonText}>Enviar WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FF0000',
    borderRadius: 100,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    minWidth: 280,
  },
  buttonPressed: {
    transform: [{ scale: 0.95 }],
  },
  buttonRecording: {
    backgroundColor: '#CC0000',
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#25D366',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
