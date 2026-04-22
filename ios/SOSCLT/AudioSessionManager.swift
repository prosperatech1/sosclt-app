--- ios/SOSCLT/AudioSessionManager.swift (原始)


+++ ios/SOSCLT/AudioSessionManager.swift (修改后)
import AVFoundation
import UIKit

/**
 * [⚠️ ATENÇÃO] Configuração de sessão de áudio para gravação em background no iOS
 *
 * Este arquivo deve ser integrado ao AppDelegate ou módulo nativo do React Native.
 * Configura o AVAudioSession para permitir gravação contínua mesmo com app em background.
 */

class AudioSessionManager {

    static let shared = AudioSessionManager()

    private init() {}

    /**
     * Configura a sessão de áudio para gravação em background
     * Deve ser chamado antes de iniciar qualquer gravação
     */
    func configureBackgroundAudio() -> Bool {
        let audioSession = AVAudioSession.sharedInstance()

        do {
            // Configurar categoria para PlayAndRecord - permite gravar e reproduzir
            try audioSession.setCategory(
                .playAndRecord,
                mode: .default,
                options: [
                    .allowBluetooth,           // Permitir dispositivos Bluetooth
                    .allowBluetoothA2DP,       // Permitir A2DP
                    .allowAirPlay,             // Permitir AirPlay
                    .defaultToSpeaker,         // Usar alto-falante por padrão
                    .mixWithOthers             // Misturar com outros áudios
                ]
            )

            // Ativar sessão
            try audioSession.setActive(true)

            print("✅ Sessão de áudio configurada para background")
            return true

        } catch {
            print("❌ Erro ao configurar sessão de áudio: \(error)")
            return false
        }
    }

    /**
     * Verifica se permissão de microfone foi concedida
     */
    func checkMicrophonePermission(completion: @escaping (Bool) -> Void) {
        switch AVAudioSession.sharedInstance().recordPermission {
        case .granted:
            completion(true)
        case .denied, .undetermined:
            AVAudioSession.sharedInstance().requestRecordPermission { granted in
                completion(granted)
            }
        @unknown default:
            completion(false)
        }
    }

    /**
     * Inicia gravação em background
     * Retorna URL do arquivo gravado
     */
    func startRecording(userId: String, completion: @escaping (URL?) -> Void) {
        checkMicrophonePermission { granted in
            guard granted else {
                print("❌ Permissão de microfone negada")
                completion(nil)
                return
            }

            // Configurar sessão
            self.configureBackgroundAudio()

            // Gerar nome do arquivo com timestamp
            let timestamp = ISO8601DateFormatter().string(from: Date())
                .replacingOccurrences(of: ":", with: "-")
                .replacingOccurrences(of: ".", with: "-")
            let fileName = "sos_\(userId)_\(timestamp).m4a"

            // Obter diretório de documentos
            let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            let fileURL = documentsPath.appendingPathComponent(fileName)

            completion(fileURL)
        }
    }

    /**
     * Para gravação e retorna metadados
     */
    func stopRecording() -> [String: Any]? {
        do {
            try AVAudioSession.sharedInstance().setActive(false)
            print("✅ Gravação parada")
            return nil // Implementar retorno de metadados conforme necessidade
        } catch {
            print("❌ Erro ao parar gravação: \(error)")
            return nil
        }
    }
}

// MARK: - AppDelegate Integration
/*
 [⚠️ ATENÇÃO] Adicionar ao AppDelegate.swift:

 import AVFoundation

 func application(_ application: UIApplication,
                  didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {

     // Configurar áudio em background
     AudioSessionManager.shared.configureBackgroundAudio()

     return true
 }
 */
