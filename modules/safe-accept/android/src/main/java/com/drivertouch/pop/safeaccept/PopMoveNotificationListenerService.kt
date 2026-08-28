package com.drivertouch.pop.safeaccept

import android.app.Notification
import android.content.Intent
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import java.text.Normalizer

/**
 * Reconhece o aviso real do PopDriver, leva o aplicativo ao primeiro plano e
 * acorda o serviço de acessibilidade. O texto e os endereços nunca são salvos.
 */
class PopMoveNotificationListenerService : NotificationListenerService() {
  override fun onListenerConnected() {
    listenerIsEnabled = true
    SafeAcceptStore.record(this, "notification", "Listener de notificações do PopDriver conectado")
  }

  override fun onNotificationPosted(sbn: StatusBarNotification) {
    if (sbn.packageName != PopMoveAccessibilityService.POP_DRIVER_PACKAGE) return

    val extras = sbn.notification.extras
    val searchable = normalize(runCatching {
      listOf(
        extras.getCharSequence(Notification.EXTRA_TITLE),
        extras.getCharSequence(Notification.EXTRA_TEXT),
        extras.getCharSequence(Notification.EXTRA_BIG_TEXT),
        extras.getCharSequenceArray(Notification.EXTRA_TEXT_LINES)?.joinToString(" ")
      ).filterNotNull().joinToString(" ")
    }.getOrDefault(""))

    val candidate = OFFER_MARKERS.any(searchable::contains)
    if (!candidate) return

    val stableNotificationText = searchable.replace(COUNTDOWN_PATTERN, "").trim()
    val fingerprint = Integer.toHexString(stableNotificationText.hashCode())
    if (!SafeAcceptStore.markOfferNotification(this, fingerprint)) return

    SafeAcceptStore.record(
      this,
      "notification",
      "Nova viagem reconhecida pela notificação real do PopDriver"
    )

    val config = SafeAcceptStore.load(this)
    if (!config.armed || config.mode == "off") {
      SafeAcceptStore.record(this, "system", "Nova viagem detectada; execução automática está desligada")
      return
    }

    val openedFromNotification = runCatching {
      val pendingIntent = sbn.notification.contentIntent ?: return@runCatching false
      pendingIntent.send()
      true
    }.getOrDefault(false)

    if (!openedFromNotification) {
      packageManager.getLaunchIntentForPackage(PopMoveAccessibilityService.POP_DRIVER_PACKAGE)?.let { intent ->
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
        startActivity(intent)
      }
    }

    SafeAcceptStore.record(this, "system", "PopDriver aberto para atender a nova viagem")
    PopMoveAccessibilityService.onOfferNotification()
  }

  override fun onNotificationRemoved(sbn: StatusBarNotification) {
    if (sbn.packageName == PopMoveAccessibilityService.POP_DRIVER_PACKAGE) {
      SafeAcceptStore.record(this, "notification", "Notificação do PopDriver removida")
    }
  }

  override fun onListenerDisconnected() {
    listenerIsEnabled = false
    SafeAcceptStore.record(this, "notification", "Listener de notificações desconectado pelo Android")
  }

  companion object {
    private val OFFER_MARKERS = listOf(
      "voce tem uma nova viagem proxima",
      "nova viagem proxima"
    )
    private val COUNTDOWN_PATTERN = Regex("\\b\\d+\\s*(min|minuto|minutos|seg|segundo|segundos|s)\\b")

    private fun normalize(value: String): String {
      return Normalizer.normalize(value, Normalizer.Form.NFD)
        .replace(Regex("\\p{M}+"), "")
        .lowercase()
        .replace(Regex("\\s+"), " ")
        .trim()
    }

    @Volatile
    var listenerIsEnabled: Boolean = false
      private set
  }
}
