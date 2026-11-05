package com.toalhaver.vermelha.safeaccept

import android.app.Notification
import android.os.Build
import android.os.SystemClock
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import java.security.MessageDigest
import java.text.Normalizer

/**
 * Observa notificações do PopMove. O serviço de acessibilidade cuida da abertura
 * e confirma a janela antes de procurar o cartão. O conteúdo não é salvo.
 */
class PopMoveNotificationListenerService : NotificationListenerService() {
  private val notices = OfferNotificationDeduper()

  override fun onListenerConnected() {
    listenerIsEnabled = true
    SafeAcceptStore.record(this, "notification", "Listener de notificações do PopDriver conectado")
    // A short disconnection can hide a posted callback. Recover only a fresh, still-active offer.
    val now = System.currentTimeMillis()
    runCatching { activeNotifications.orEmpty() }.getOrDefault(emptyArray())
      .asSequence()
      .filter { it.packageName == PopMoveAccessibilityService.POP_DRIVER_PACKAGE &&
        OfferForegroundPolicy.isFresh(it.postTime, now) }
      .sortedByDescending { it.postTime }
      .map { it to notificationText(it) }
      .firstOrNull { (_, text) -> OFFER_MARKERS.any(text::contains) }
      ?.let { (sbn, text) -> observe(sbn, text) }
  }

  override fun onNotificationPosted(sbn: StatusBarNotification) {
    if (sbn.packageName != PopMoveAccessibilityService.POP_DRIVER_PACKAGE) return
    observe(sbn, notificationText(sbn))
  }

  private fun notificationText(sbn: StatusBarNotification): String = normalize(runCatching {
    val extras = sbn.notification.extras
    listOf(
      extras.getCharSequence(Notification.EXTRA_TITLE),
      extras.getCharSequence(Notification.EXTRA_TEXT),
      extras.getCharSequence(Notification.EXTRA_BIG_TEXT),
      extras.getCharSequenceArray(Notification.EXTRA_TEXT_LINES)?.joinToString(" ")
    ).filterNotNull().joinToString(" ")
  }.getOrDefault(""))

  private fun observe(sbn: StatusBarNotification, searchable: String) {
    val candidate = OFFER_MARKERS.any(searchable::contains)
    DiagnosticStore.observeNotification(this, sbn, candidate)
    if (!candidate) {
      notices.forget(sbn.key)
      return
    }
    if (!OfferForegroundPolicy.isFresh(sbn.postTime, System.currentTimeMillis())) return

    val signature = digest(searchable.replace(COUNTDOWN_PATTERN, "").replace(WHITESPACE, " ").trim())
    if (!notices.shouldStart(sbn.key, signature, SystemClock.elapsedRealtime())) return
    val identity = digest("${sbn.key}:${sbn.postTime}:$signature")
    val openIntent = sbn.notification.contentIntent?.takeIf {
      it.creatorPackage == PopMoveAccessibilityService.POP_DRIVER_PACKAGE &&
        (Build.VERSION.SDK_INT < 31 || it.isActivity)
    }
    PopMoveAccessibilityService.onOfferNotification(this, identity, sbn.postTime, openIntent)
  }

  override fun onNotificationRemoved(sbn: StatusBarNotification) {
    if (sbn.packageName == PopMoveAccessibilityService.POP_DRIVER_PACKAGE) {
      notices.forget(sbn.key)
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
    private val WHITESPACE = Regex("\\s+")

    private fun digest(value: String): String = MessageDigest.getInstance("SHA-256")
      .digest(value.toByteArray(Charsets.UTF_8)).take(16).joinToString("") { "%02x".format(it) }

    private fun normalize(value: String): String {
      return Normalizer.normalize(value, Normalizer.Form.NFD)
        .replace(Regex("\\p{M}+"), "")
        .lowercase()
        .replace(WHITESPACE, " ")
        .trim()
    }

    @Volatile
    var listenerIsEnabled: Boolean = false
      private set
  }
}
