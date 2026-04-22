--- services/audioRecording.ts (原始)


+++ services/audioRecording.ts (修改后)
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * Serviço de gravação de áudio para o SOSCLT
 * - Gerencia permissões de microfone
 * - Grava áudio em formato M4A
 * - Salva arquivos localmente com nome padronizado
 * - Suporta gravação em background (com configurações nativas)
 */

export interface RecordingMetadata {
  fileUri: string;
  fileName: string;
  duration: number;
  createdAt: string;
  userId: string;
}

class AudioRecordingService {
  private recording: Audio.Recording | null = null;
  private startTime: number = 0;
  private isRecording: boolean = false;

  /**
   * Solicita permissão para usar o microfone
   * @returns true se permissão concedida
   */
  async requestPermission(): Promise<boolean> {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      return granted;
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      return false;
    }
  }

  /**
   * Configura as opções de gravação
   * Formato: M4A (AAC) para melhor compatibilidade iOS/Android
   */
  private getRecordingOptions(): Audio.RecordingOptions {
    return {
      android: {
        extension: '.m4a',
        outputFormat: Audio.AndroidOutputFormat.MPEG_4,
        audioEncoder: Audio.AndroidAudioEncoder.AAC,
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 128000,
      },
      ios: {
        extension: '.m4a',
        outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
        audioQuality: Audio.IOSAudioQuality.HIGH,
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 128000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      web: {
        mimeType: 'audio/webm',
        bitsPerSecond: 128000,
      },
    };
  }

  /**
   * Inicia a gravação de áudio
   * @param userId - ID do usuário para nomear o arquivo
   * @returns true se iniciado com sucesso
   */
  async startRecording(userId: string): Promise<boolean> {
    try {
      // Verificar permissão
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.error('Permissão de microfone negada');
        return false;
      }

      // Gerar nome do arquivo com timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `sos_${userId}_${timestamp}.m4a`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      // Configurar e iniciar gravação
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        staysActiveInBackground: true, // [⚠️ ATENÇÃO] Requer configuração nativa
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      this.recording = recording;
      this.startTime = Date.now();
      this.isRecording = true;

      console.log('Gravação iniciada:', fileUri);
      return true;
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      return false;
    }
  }

  /**
   * Para a gravação e retorna os metadados
   * @returns Metadados da gravação ou null se falhar
   */
  async stopRecording(): Promise<RecordingMetadata | null> {
    try {
      if (!this.recording || !this.isRecording) {
        console.warn('Nenhuma gravação em andamento');
        return null;
      }

      // Parar gravação
      await this.recording.stopAndUnloadAsync();

      // Calcular duração
      const duration = (Date.now() - this.startTime) / 1000; // em segundos
      const uri = this.recording.getURI();

      if (!uri) {
        console.error('URI da gravação não disponível');
        return null;
      }

      // Extrair userId e criar metadados
      const fileName = uri.split('/').pop() || 'unknown.m4a';
      const userId = fileName.split('_')[1] || 'unknown';

      const meta RecordingMetadata = {
        fileUri: uri,
        fileName,
        duration,
        createdAt: new Date().toISOString(),
        userId,
      };

      // Limpar estado
      this.recording = null;
      this.isRecording = false;
      this.startTime = 0;

      console.log('Gravação finalizada:', metadata);
      return metadata;
    } catch (error) {
      console.error('Erro ao parar gravação:', error);
      return null;
    }
  }

  /**
   * Verifica se está gravando no momento
   */
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Obtém duração atual da gravação em segundos
   */
  getCurrentDuration(): number {
    if (!this.isRecording || this.startTime === 0) {
      return 0;
    }
    return (Date.now() - this.startTime) / 1000;
  }

  /**
   * Cancela a gravação atual sem salvar
   */
  async cancelRecording(): Promise<void> {
    try {
      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
      }
      this.isRecording = false;
      this.startTime = 0;
    } catch (error) {
      console.error('Erro ao cancelar gravação:', error);
    }
  }
}

// Exportar instância singleton
export const audioRecordingService = new AudioRecordingService();
