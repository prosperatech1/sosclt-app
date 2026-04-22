--- ios/SOSCLTWidget/SOSCLTWidget.swift (原始)


+++ ios/SOSCLTWidget/SOSCLTWidget.swift (修改后)
import WidgetKit
import SwiftUI
import AVFoundation

/**
 * [⚠️ ATENÇÃO] Widget do iOS para ativação rápida do SOS
 *
 * Requer:
 * 1. App Group configurado: group.com.sosclt.app
 * 2. Widget extension adicionada ao projeto Xcode
 * 3. Background Audio mode habilitado no Info.plist
 *
 * Funcionalidades:
 * - Botão SOS na home screen do iOS
 * - Inicia gravação silenciosa em background
 * - Comunicação via AppGroup com app principal
 */

struct SOSWidgetEntryView: View {
    var entry: Provider.Entry

    var body: some View {
        Button(action: {
            triggerSOSRecording()
        }) {
            VStack {
                ZStack {
                    Circle()
                        .fill(Color.red)
                        .frame(width: 50, height: 50)

                    Circle()
                        .stroke(Color.white, lineWidth: 3)
                        .frame(width: 50, height: 50)

                    Text("🆘")
                        .font(.system(size: 28))
                }

                Text("SOS")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
            }
        }
        .background(Color.red.opacity(0.9))
    }

    /**
     * Aciona gravação SOS quando widget é clicado
     */
    private func triggerSOSRecording() {
        // Notificar app principal via AppGroup
        let sharedDefaults = UserDefaults(suiteName: "group.com.sosclt.app")
        sharedDefaults?.set(Date().timeIntervalSince1970, forKey: "sos_triggered_timestamp")
        sharedDefaults?.set(true, forKey: "sos_triggered")

        // Vibrar dispositivo (feedback tátil)
        let impactFeedback = UIImpactFeedbackGenerator(style: .heavy)
        impactFeedback.impactOccurred()

        // Agendar notificação local
        scheduleLocalNotification()
    }

    /**
     * Agenda notificação local informando que gravação iniciou
     */
    private func scheduleLocalNotification() {
        let content = UNMutableNotificationContent()
        content.title = "🆘 SOS Acionado!"
        content.body = "Gravação iniciada pelo widget. Abra o app para verificar."
        content.sound = .default

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 0.5, repeats: false)
        let request = UNNotificationRequest(
            identifier: "SOS_WIDGET_TRIGGER",
            content: content,
            trigger: trigger
        )

        UNUserNotificationCenter.current().add(request)
    }
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date())
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> Void) {
        let entry = SimpleEntry(date: Date())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        let entry = SimpleEntry(date: Date())
        let timeline = Timeline(entries: [entry], policy: .never)
        completion(timeline)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
}

@main
struct SOSCLTWidget: Widget {
    let kind: String = "SOSCLTWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            SOSWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("SOS Rápido")
        .description("Acione gravação de emergência diretamente da home screen.")
        .supportedFamilies([.accessoryCircular, .systemSmall])
    }
}

#if DEBUG
struct SOSCLTWidget_Previews: PreviewProvider {
    static var previews: some View {
        SOSWidgetEntryView(entry: SimpleEntry(date: Date()))
            .previewContext(WidgetPreviewContext(family: .accessoryCircular))
    }
}
#endif

// MARK: - App Group Setup
/*
 [⚠️ ATENÇÃO] Configurar App Group no Xcode:

 1. Abrir projeto no Xcode
 2. Selecionar target principal e target do Widget
 3. Ir em "Signing & Capabilities"
 4. Adicionar capability "App Groups"
 5. Criar grupo: group.com.sosclt.app
 6. Marcar o mesmo grupo em ambos os targets

 Para comunicar com o app principal e iniciar gravação:

 // No AppDelegate ou módulo nativo:
 let sharedDefaults = UserDefaults(suiteName: "group.com.sosclt.app")
 NotificationCenter.default.addObserver(
     self,
     selector: #selector(handleSOSTrigger),
     name: UserDefaults.didChangeNotification,
     object: sharedDefaults
 )

 @objc func handleSOSTrigger() {
     let sharedDefaults = UserDefaults(suiteName: "group.com.sosclt.app")
     if sharedDefaults?.bool(forKey: "sos_triggered") == true {
         // Iniciar gravação
         AudioSessionManager.shared.startRecording(userId: "user_123") { url in
             // Salvar URL
         }
         sharedDefaults?.set(false, forKey: "sos_triggered")
     }
 }
 */
