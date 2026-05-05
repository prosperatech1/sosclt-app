--- services/whatsapp.ts (原始)


+++ services/whatsapp.ts (修改后)
import * as Linking from 'expo-linking';

/**
 * Serviço para integração com WhatsApp
 * - Abre conversas no WhatsApp com mensagens pré-preenchidas
 * - Compartilha links de gravações SOS
 */

/**
 * Abre o WhatsApp com uma mensagem pré-preenchida
 * @param phoneNumber - Número do contato (com código do país, ex: 5511999999999)
 * @param message - Mensagem a ser enviada
 * @returns true se abriu com sucesso
 */
export async function sendToWhatsApp(
  phoneNumber: string,
  message: string
): Promise<boolean> {
  try {
    // Remover caracteres não numéricos do número
    const cleanNumber = phoneNumber.replace(/\D/g, '');

    // Criar URL do WhatsApp
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;

    // Verificar se pode abrir a URL
    const canOpen = await Linking.canOpenURL(whatsappUrl);

    if (!canOpen) {
      console.error('Não foi possível abrir o WhatsApp');
      return false;
    }

    // Abrir WhatsApp
    await Linking.openURL(whatsappUrl);
    return true;
  } catch (error) {
    console.error('Erro ao abrir WhatsApp:', error);
    return false;
  }
}

/**
 * Envia link de gravação SOS via WhatsApp
 * @param phoneNumber - Número do contato de emergência
 * @param fileUrl - URL da gravação (local ou remota)
 * @param duration - Duração da gravação em segundos
 * @returns true se enviou com sucesso
 */
export async function sendSOSRecordingToWhatsApp(
  phoneNumber: string,
  fileUrl: string,
  duration: number
): Promise<boolean> {
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  const durationStr = `${minutes}m ${seconds}s`;

  const message = `🆘 SOSCLT - Gravação de Emergência\n\n` +
    `⏱️ Duração: ${durationStr}\n` +
    `📁 Arquivo: ${fileUrl}\n\n` +
    `Esta é uma gravação de emergência do app SOSCLT. ` +
    `Por favor, verifique imediatamente.`;

  return await sendToWhatsApp(phoneNumber, message);
}

/**
 * Formata número de telefone para o padrão WhatsApp
 * @param phone - Número no formato brasileiro (ex: 11999999999)
 * @returns Número formatado com código do país
 */
export function formatPhoneNumberForWhatsApp(phone: string): string {
  // Remove todos os caracteres não numéricos
  const clean = phone.replace(/\D/g, '');

  // Se já tiver código do país (55), retorna
  if (clean.startsWith('55') && clean.length >= 12) {
    return clean;
  }

  // Adiciona código do Brasil (55)
  return `55${clean}`;
}
