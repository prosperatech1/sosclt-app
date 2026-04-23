--- android/app/src/main/java/com/sosclt/SOSService.kt (原始)


+++ android/app/src/main/java/com/sosclt/SOSService.kt (修改后)
package com.sosclt.app

import android.app.*
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.sosclt.app.R

/**
 * [⚠️ ATENÇÃO] Serviço em foreground para gravação de áudio em background no Android
 *
 * Este serviço mantém a gravação ativa mesmo com a tela desligada ou app em segundo plano.
 * Requer Android 12+ para foregroundServiceType="microphone"
 *
 * Funcionalidades:
 * - Notificação persistente durante gravação
 * - Mantém processo vivo durante gravação
 * - Gerencia ciclo de vida da gravação
 */
class SOSService : Service() {

    companion object {
        const val CHANNEL_ID = "sos_recording_channel"
        const val NOTIFICATION_ID = 1001
        const val ACTION_START_RECORDING = "com.sosclt.app.START_RECORDING"
        const val ACTION_STOP_RECORDING = "com.sosclt.app.STOP_RECORDING"

        // Singleton para acesso ao serviço
        var isRunning: Boolean = false
            private set
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_RECORDING -> {
                startForeground(NOTIFICATION_ID, createNotification("Iniciando gravação SOS..."))
                isRunning = true
                // Aqui você integraria com o módulo de gravação do React Native
                // via ReactContext ou broadcast
            }
            ACTION_STOP_RECORDING -> {
                isRunning = false
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
        }

        // Manter serviço rodando - START_STICKY reinicia se killed pelo sistema
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onDestroy() {
        isRunning = false
        super.onDestroy()
    }

    /**
     * Cria canal de notificação para Android O+
     */
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Gravação SOS",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Notificação durante gravação de emergência"
                setShowBadge(false)
                enableVibration(false)
                setSound(null, null)
            }

            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }

    /**
     * Cria notificação persistente do serviço em foreground
     */
    private fun createNotification(message: String): Notification {
        // Intent para abrir o app ao clicar na notificação
        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }

        val openAppPendingIntent = PendingIntent.getActivity(
            this,
            0,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Intent para parar gravação
        val stopIntent = Intent(this, SOSService::class.java).apply {
            action = ACTION_STOP_RECORDING
        }

        val stopPendingIntent = PendingIntent.getService(
            this,
            1,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("🆘 SOSCLT - Gravando")
            .setContentText(message)
            .setSmallIcon(R.drawable.ic_notification) // [⚠️ ATENÇÃO] Criar ícone em res/drawable
            .setOngoing(true)
            .setSilent(true)
            .setContentIntent(openAppPendingIntent)
            .addAction(R.drawable.ic_stop, "Parar", stopPendingIntent)
            .build()
    }

    /**
     * Inicia o serviço de gravação
     * Chamar isso do React Native ou Widget
     */
    fun startRecording(context: android.content.Context) {
        val intent = Intent(context, SOSService::class.java).apply {
            action = ACTION_START_RECORDING
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
        }
    }

    /**
     * Para o serviço de gravação
     */
    fun stopRecording(context: android.content.Context) {
        val intent = Intent(context, SOSService::class.java).apply {
            action = ACTION_STOP_RECORDING
        }
        context.startService(intent)
    }
}
