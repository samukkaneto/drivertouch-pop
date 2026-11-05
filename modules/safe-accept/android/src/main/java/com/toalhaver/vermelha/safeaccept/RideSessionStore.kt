package com.toalhaver.vermelha.safeaccept

import android.content.Context

object RideSessionStore {
  private fun prefs(context: Context) = context.getSharedPreferences("toalha_vermelha_trip_state", Context.MODE_PRIVATE)
  fun load(context: Context): RideSession {
    val p = prefs(context)
    return RideSession(p.getString("phase", "unknown") ?: "unknown", p.getLong("attemptedAt", 0L), p.getLong("idleSince", 0L))
  }
  private fun save(context: Context, state: RideSession) {
    prefs(context).edit().putString("phase", state.phase).putLong("attemptedAt", state.attemptedAt)
      .putLong("idleSince", state.idleSince).commit()
  }
  fun invalidateAvailability(context: Context) {
    val current = load(context)
    save(context, current.copy(phase = if (current.phase in listOf("busy", "awaiting_trip")) current.phase else "unknown", idleSince = 0L))
  }
  fun observe(context: Context, idleVisible: Boolean, offerVisible: Boolean, preserveReadyDuringLoad: Boolean = false) {
    val previous = load(context)
    val next = RideSessionPolicy.observe(previous, idleVisible, offerVisible, System.currentTimeMillis(), preserveReadyDuringLoad)
    if (next == previous) return
    save(context, next)
    if (next.phase == "ready" && previous.phase != "ready") {
      SafeAcceptStore.clearHandledOffer(context)
      SafeAcceptStore.record(context, "system", "Tela de espera confirmada; disponível para a próxima corrida")
    }
  }
  fun afterAttempt(context: Context) {
    save(context, RideSessionPolicy.afterAttempt(System.currentTimeMillis()))
    SafeAcceptStore.record(context, "system", "Comando enviado; uma por vez aguarda a volta à tela de espera")
  }
}
