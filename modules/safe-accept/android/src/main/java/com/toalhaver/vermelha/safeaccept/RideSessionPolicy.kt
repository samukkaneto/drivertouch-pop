package com.toalhaver.vermelha.safeaccept

data class RideSession(val phase: String = "unknown", val attemptedAt: Long = 0L, val idleSince: Long = 0L)

/** Availability requires the known idle screen, never merely a disappearing offer or a timeout. */
object RideSessionPolicy {
  const val IDLE_MARKER = "aguarde uma solicitacao"
  fun observe(previous: RideSession, idleVisible: Boolean, offerVisible: Boolean, now: Long): RideSession {
    if (idleVisible && !offerVisible) {
      val since = if (previous.idleSince > 0L) previous.idleSince else now
      val stable = now - since >= 1000L && (previous.attemptedAt == 0L || now - previous.attemptedAt >= 3000L)
      return previous.copy(phase = if (stable) "ready" else previous.phase, idleSince = since)
    }
    if (offerVisible) return previous.copy(idleSince = 0L)
    return previous.copy(phase = if (previous.phase in listOf("awaiting_trip", "busy")) "busy" else "unknown", idleSince = 0L)
  }

  fun afterAttempt(now: Long) = RideSession("awaiting_trip", now)
  fun mayAccept(mode: String, session: RideSession) = mode == "continuous" || session.phase == "ready"
  fun mayScroll(mode: String, hasOfferNotification: Boolean, offerVisible: Boolean) =
    mode == "continuous" && hasOfferNotification && !offerVisible
}
