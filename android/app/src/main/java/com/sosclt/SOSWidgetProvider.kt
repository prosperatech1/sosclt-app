--- android/app/src/main/java/com/sosclt/SOSWidgetProvider.kt (原始)


+++ android/app/src/main/java/com/sosclt/SOSWidgetProvider.kt (修改后)
package com.sosclt.app

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.sosclt.app.R

/**
 * [⚠️ ATENÇÃO] Widget para ativação rápida do SOS na home screen do Android
 *
 * Permite acionar a gravação sem abrir o app:
 * - Botão SOS diretamente na home
 * - Inicia gravação silenciosa em background
 * - Notifica usuário após acionamento
 *
 * Configuração necessária:
 * 1. Criar layout em res/layout/sos_widget.xml
 * 2. Criar metadados em res/xml/sos_widget_info.xml
 * 3. Adicionar ícones em res/drawable/
 */
class SOSWidgetProvider : AppWidgetProvider() {

    companion object {
        const val ACTION_SOS_CLICKED = "com.sosclt.app.SOS_CLICKED"
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)

        when (intent.action) {
            ACTION_SOS_CLICKED -> {
                // Iniciar gravação SOS
                handleSOSClick(context)
            }
        }
    }

    /**
     * Atualiza o widget com o layout atual
     */
    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val views = RemoteViews(context.packageName, R.layout.sos_widget)

        // Configurar clique no botão SOS
        val sosIntent = Intent(context, SOSWidgetProvider::class.java).apply {
            action = ACTION_SOS_CLICKED
        }
        val sosPendingIntent = android.app.PendingIntent.getBroadcast(
            context,
            0,
            sosIntent,
            android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_sos_button, sosPendingIntent)

        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    /**
     * Handler para clique no botão SOS do widget
     * Inicia gravação em background
     */
    private fun handleSOSClick(context: Context) {
        // 1. Iniciar serviço de gravação em foreground
        val serviceIntent = Intent(context, SOSService::class.java).apply {
            action = SOSService.ACTION_START_RECORDING
        }

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent)
        } else {
            context.startService(serviceIntent)
        }

        // 2. Mostrar notificação de que gravação iniciou
        showRecordingNotification(context)

        // 3. [Opcional] Vibrar dispositivo para feedback tátil
        val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as android.os.Vibrator
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            vibrator.vibrate(android.os.VibrationEffect.createOneShot(500, android.os.VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(500)
        }
    }

    /**
     * Mostra notificação informando que gravação foi iniciada pelo widget
     */
    private fun showRecordingNotification(context: Context) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            val channel = android.app.NotificationChannel(
                SOSService.CHANNEL_ID,
                "Gravação SOS",
                android.app.NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notificação de gravação de emergência"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 500, 200, 500)
            }
            notificationManager.createNotificationChannel(channel)
        }

        val notification = androidx.core.app.NotificationCompat.Builder(context, SOSService.CHANNEL_ID)
            .setContentTitle("🆘 SOS Acionado!")
            .setContentText("Gravação iniciada pelo widget. Toque para abrir o app.")
            .setSmallIcon(R.drawable.ic_notification)
            .setPriority(androidx.core.app.NotificationCompat.PRIORITY_HIGH)
            .setCategory(androidx.core.app.NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)
            .setContentIntent(
                android.app.PendingIntent.getActivity(
                    context,
                    0,
                    Intent(context, MainActivity::class.java),
                    android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
                )
            )
            .build()

        notificationManager.notify(SOSService.NOTIFICATION_ID + 1, notification)
    }

    override fun onEnabled(context: Context) {
        // Widget adicionado pela primeira vez
    }

    override fun onDisabled(context: Context) {
        // Último widget removido
    }
}
