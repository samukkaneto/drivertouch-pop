package com.drivertouch.pop.safeaccept

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import java.util.Locale

/**
 * Diagnóstico local: observa apenas notificações do PopDriver e guarda metadados
 * técnicos. O texto da corrida nunca é persistido.
 */
class PopMoveNotificationListenerService : NotificationListenerService() {
  override fun onListenerConnected() {
    listenerIsEnabled = true
    SafeAcceptStore.record(this, "notification", "Listener de notificações do PopDriver conectado")
  }

  override fun onNotificationPosted(sbn: StatusBarNotification) {
    if (sbn.packageName != PopMoveAccessibilityService.POP_DRIVER_PACKAGE) return

    val extras = sbn.notification.extras
    val searchable = runCatching {
      listOf(
        extras.getCharSequence(Notification.EXTRA_TITLE),
        extras.getCharSequence(Notification.EXTRA_TEXT),
        extras.getCharSequence(Notification.EXTRA_BIG_TEXT),
        extras.getCharSequenceArray(Notification.EXTRA_TEXT_LINES)?.joinToString(" ")
      ).filterNotNull().joinToString(" ").lowercase(Locale.ROOT)
    }.getOrDefault("")

    val candidate = OFFER_MARKERS.any(searchable::contains)
    SafeAcceptStore.record(
      this,
      "notification",
      if (candidate) {
        "Notificação do PopDriver recebida com sinal compatível"
      } else {
        "Notificação do PopDriver recebida sem sinal de nova corrida"
      }
    )
    if (candidate) {
      SafeAcceptStore.markOfferNotification(this, sbn.key)
    }
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
    private val OFFER_MARKERS = listOf("nova corrida", "nova oferta", "oferta", "corrida", "chamada")

    @Volatile
    var listenerIsEnabled: Boolean = false
      private set
  }
}
