--- services/supabase.ts (原始)


+++ services/supabase.ts (修改后)
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// [⚠️ ATENÇÃO] Substitua pelas suas credenciais do Supabase
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Serviço para gerenciar operações com o Supabase
 * - Upload de arquivos de áudio
 * - Salvamento de metadados no banco de dados
 */

export interface SOSRecord {
  id?: string;
  user_id: string;
  file_url: string;
  created_at?: string;
  duration: number;
}

export interface User {
  id: string;
  name: string;
  whatsapp_contact: string;
}

/**
 * Faz upload do arquivo de áudio para o bucket 'sos-recordings'
 * @param fileUri - URI local do arquivo de áudio
 * @param userId - ID do usuário
 * @returns URL pública do arquivo ou null em caso de erro
 */
export async function uploadAudioToSupabase(
  fileUri: string,
  userId: string
): Promise<string | null> {
  try {
    // Extrair extensão do arquivo e gerar nome único
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `sos_${userId}_${timestamp}.m4a`;

    // Converter URI para blob (React Native)
    const response = await fetch(fileUri);
    const blob = await response.blob();

    // Upload para o bucket
    const { data, error } = await supabase.storage
      .from('sos-recordings')
      .upload(fileName, blob, {
        contentType: 'audio/m4a',
        upsert: false,
      });

    if (error) {
      console.error('Erro no upload:', error);
      return null;
    }

    // Obter URL pública
    const {  urlData } = supabase.storage
      .from('sos-recordings')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    return null;
  }
}

/**
 * Salva os metadados da gravação no banco de dados
 * @param record - Dados da gravação SOS
 * @returns true se salvo com sucesso
 */
export async function saveSOSRecord(record: SOSRecord): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('sos_records')
      .insert([record]);

    if (error) {
      console.error('Erro ao salvar registro:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao salvar registro:', error);
    return false;
  }
}

/**
 * Busca dados do usuário pelo ID
 * @param userId - ID do usuário
 * @returns Dados do usuário ou null
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as User;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return null;
  }
}
