package com.toalhaver.vermelha.safeaccept

/** A short handoff from a new offer notification to the confirmed PopMove window. */
internal object OfferForegroundPolicy {
  const val MAX_NOTIFICATION_AGE_MS = 10_000L
  const val HANDOFF_TIMEOUT_MS = 5_500L
  const val FALLBACK_DELAY_MS = 1_000L
  const val LOADING_GRACE_MS = 2_500L

  enum class Next { OPEN_NOTIFICATION, OPEN_LAUNCHER, READ_CARD, WAIT, EXPIRED }

  data class State(
    val startedAt: Long,
    val requests: Int = 0,
    val lastRequestAt: Long = 0L,
    val requestDispatched: Boolean = false,
    val windowSeenAt: Long? = null,
    val recognizedScreen: Boolean = false
  )

  fun isFresh(postedAt: Long, now: Long): Boolean =
    postedAt > 0L && now - postedAt in 0L..MAX_NOTIFICATION_AGE_MS

  fun next(state: State, now: Long, targetVisible: Boolean, hasOpenIntent: Boolean): Next = when {
    now - state.startedAt >= HANDOFF_TIMEOUT_MS -> Next.EXPIRED
    targetVisible -> Next.READ_CARD
    // Once the window appeared, never pull it back for this offer if the user leaves it.
    state.windowSeenAt != null -> Next.WAIT
    state.requests == 0 -> if (hasOpenIntent) Next.OPEN_NOTIFICATION else Next.OPEN_LAUNCHER
    state.requests == 1 && (!state.requestDispatched || now - state.lastRequestAt >= FALLBACK_DELAY_MS) ->
      Next.OPEN_LAUNCHER
    else -> Next.WAIT
  }

  fun preserveReadyDuringLoad(state: State?, now: Long): Boolean {
    val seenAt = state?.windowSeenAt ?: return false
    return state.requests > 0 && !state.recognizedScreen &&
      now - seenAt in 0L until LOADING_GRACE_MS &&
      now - state.startedAt < HANDOFF_TIMEOUT_MS
  }
}

/** Suppress updates to a live notification, without conflating two distinct notifications. */
internal class OfferNotificationDeduper {
  private data class Notice(val content: String, val seenAt: Long)
  private val active = linkedMapOf<String, Notice>()

  fun shouldStart(key: String, content: String, now: Long): Boolean {
    val previous = active[key]
    if (previous != null && previous.content == content && now - previous.seenAt in 0L until 120_000L) return false
    active.remove(key)
    active[key] = Notice(content, now)
    if (active.size > 32) active.remove(active.keys.first())
    return true
  }

  fun forget(key: String) {
    active.remove(key)
  }
}
