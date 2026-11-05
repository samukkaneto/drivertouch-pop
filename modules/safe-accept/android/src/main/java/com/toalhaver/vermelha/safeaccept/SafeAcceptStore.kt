package com.toalhaver.vermelha.safeaccept

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.util.Locale
import java.util.UUID

data class SafeAcceptConfig(
  val armed: Boolean,
  val mode: String,
  val x: Float,
  val y: Float,
  val longPressDurationMs: Long,
  val detectionDelayMs: Long,
  val acceptMarker: String,
  val rideMode: String,
  val touchRadius: Float,
  val tripState: String,
  val inputMethod: String
)

data class GestureLearningResult(
  val durationMs: Long,
  val changed: Boolean
)

object SafeAcceptStore {
  private const val PREFS = "toalha_vermelha_native"
  private const val KEY_RIDE_MODE = "ride_mode"
  private const val KEY_TOUCH_RADIUS = "touch_radius"
  private const val KEY_SINGLE_IDENTITY = "single_identity"
  private const val KEY_ENABLED = "automation_enabled_v4"
  private const val KEY_X = "x"
  private const val KEY_Y = "y"
  private const val KEY_DURATION = "duration"
  private const val KEY_DELAY = "delay"
  private const val KEY_MARKER = "marker"
  private const val KEY_LAST_EVENT = "last_event"
  private const val KEY_EVENTS = "events"
  private const val KEY_PENDING_X = "pending_calibration_x"
  private const val KEY_PENDING_Y = "pending_calibration_y"
  private const val KEY_PENDING_AT = "pending_calibration_at"
  private const val KEY_OFFER_NOTIFICATION_FINGERPRINT = "offer_notification_fingerprint"
  private const val KEY_OFFER_NOTIFICATION_AT = "offer_notification_at"
  private const val KEY_OFFER_NOTIFICATION_SEQUENCE = "offer_notification_sequence"
  private const val KEY_HANDLED_OFFER_IDENTITY = "handled_offer_identity"
  private const val KEY_HANDLED_OFFER_AT = "handled_offer_at"
  private const val KEY_LEARNED_DURATION = "learned_duration"
  private const val KEY_LEARNING_SUCCESS_STREAK = "learning_success_streak"
  private const val KEY_SPEED_PROFILE_MIGRATED = "speed_profile_migrated_v1"
  private const val KEY_MONOTONIC_LEARNING_MIGRATED = "monotonic_learning_migrated_v2"
  private const val MAX_EVENTS = 50
  private const val DEFAULT_DURATION_MS = 1600L
  private const val DEFAULT_DELAY_MS = 0L
  private const val MIN_ADAPTIVE_DURATION_MS = 1450L
  private const val MAX_DURATION_MS = 4000L

  fun load(context: Context): SafeAcceptConfig {
    val preferences = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    migrateActivation(preferences)
    migrateSpeedProfile(preferences)
    migrateMonotonicLearning(preferences)
    val x = preferences.getFloat(KEY_X, -1f)
    val y = preferences.getFloat(KEY_Y, -1f)
    val enabled = preferences.getBoolean(KEY_ENABLED, false)
    val mode = if (enabled) "assist" else "off"
    val rideMode = preferences.getString(KEY_RIDE_MODE, "single") ?: "single"
    return SafeAcceptConfig(
      armed = enabled,
      mode = mode,
      x = x,
      y = y,
      longPressDurationMs = preferences
        .getLong(KEY_LEARNED_DURATION, preferences.getLong(KEY_DURATION, DEFAULT_DURATION_MS))
        .coerceIn(500L, MAX_DURATION_MS),
      detectionDelayMs = preferences.getLong(KEY_DELAY, DEFAULT_DELAY_MS),
      acceptMarker = preferences
        .getString(KEY_MARKER, "pressione e segure para atender")
        ?.trim()
        ?.lowercase(Locale.ROOT)
        ?: "pressione e segure para atender",
      rideMode = rideMode,
      touchRadius = preferences.getFloat(KEY_TOUCH_RADIUS, 0.04f).coerceIn(0.01f, 0.12f),
      tripState = RideSessionStore.load(context).phase,
      inputMethod = "control"
    )
  }

  fun saveBehavior(context: Context, rideMode: String, radius: Double) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
      .putString(KEY_RIDE_MODE, if (rideMode == "continuous") "continuous" else "single")
      .putFloat(KEY_TOUCH_RADIUS, (if (radius.isFinite()) radius else 0.04).coerceIn(0.01, 0.12).toFloat())
      .apply()
  }

  private fun migrateActivation(preferences: android.content.SharedPreferences) {
    if (preferences.contains(KEY_ENABLED)) return
    preferences.edit().putBoolean(KEY_ENABLED, false).putString(KEY_RIDE_MODE, "single")
      .putString("input_method", "control").remove(KEY_SINGLE_IDENTITY).commit()
  }

  fun setAutomationEnabled(context: Context, enabled: Boolean, rideMode: String) {
    val p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    migrateActivation(p)
    if (p.getBoolean(KEY_ENABLED, false) != enabled) RideSessionStore.invalidateAvailability(context)
    p.edit().putBoolean(KEY_ENABLED, enabled).putString("input_method", "control")
      .putString(KEY_RIDE_MODE, if (rideMode == "continuous") "continuous" else "single").commit()
    record(context, "system", if (enabled) "Ligado pelo painel" else "Desligado pelo painel")
  }

  fun canDispatch(context: Context, identity: String, retry: Boolean): Boolean {
    val config = load(context)
    return config.armed && RideSessionPolicy.mayAccept(config.rideMode, RideSessionStore.load(context))
  }

  fun recordAcceptanceAttempt(context: Context, identity: String) {
    RideSessionStore.afterAttempt(context)
  }

  fun clearHandledOffer(context: Context) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
      .remove(KEY_HANDLED_OFFER_IDENTITY).remove(KEY_HANDLED_OFFER_AT).apply()
  }

  fun save(
    context: Context,
    armed: Boolean,
    mode: String,
    x: Double,
    y: Double,
    longPressDurationMs: Int,
    detectionDelayMs: Int,
    acceptMarker: String
  ) {
    val preferences = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    migrateActivation(preferences)
    migrateSpeedProfile(preferences)
    migrateMonotonicLearning(preferences)
    val safeDuration = longPressDurationMs.coerceIn(500, MAX_DURATION_MS.toInt()).toLong()
    val currentLearnedDuration = preferences
      .getLong(KEY_LEARNED_DURATION, safeDuration)
      .coerceIn(500L, MAX_DURATION_MS)
    val lockedDuration = minOf(currentLearnedDuration, safeDuration)
    val editor = preferences.edit()
      .putFloat(KEY_X, (if (x.isFinite() && x in 0.0..1.0) x else -1.0).toFloat())
      .putFloat(KEY_Y, (if (y.isFinite() && y in 0.0..1.0) y else -1.0).toFloat())
      .putLong(KEY_DURATION, safeDuration)
      .putLong(KEY_DELAY, detectionDelayMs.coerceIn(0, 3000).toLong())
      .putString(KEY_MARKER, acceptMarker.trim().lowercase(Locale.ROOT).take(80))
    if (lockedDuration != currentLearnedDuration || !preferences.contains(KEY_LEARNED_DURATION)) {
      editor
        .putLong(KEY_LEARNED_DURATION, lockedDuration)
        .putInt(KEY_LEARNING_SUCCESS_STREAK, 0)
    }
    editor.apply()
  }

  private fun migrateSpeedProfile(preferences: android.content.SharedPreferences) {
    if (preferences.getBoolean(KEY_SPEED_PROFILE_MIGRATED, false)) return
    val storedDuration = preferences.getLong(KEY_DURATION, 2000L)
    val storedDelay = preferences.getLong(KEY_DELAY, 400L)
    val migratedDuration = if (storedDuration == 2000L) DEFAULT_DURATION_MS else storedDuration
    val migratedDelay = if (storedDelay == 400L) DEFAULT_DELAY_MS else storedDelay
    preferences.edit()
      .putLong(KEY_DURATION, migratedDuration)
      .putLong(KEY_DELAY, migratedDelay)
      .putLong(KEY_LEARNED_DURATION, migratedDuration)
      .putInt(KEY_LEARNING_SUCCESS_STREAK, 0)
      .putBoolean(KEY_SPEED_PROFILE_MIGRATED, true)
      .commit()
  }

  private fun migrateMonotonicLearning(preferences: android.content.SharedPreferences) {
    if (preferences.getBoolean(KEY_MONOTONIC_LEARNING_MIGRATED, false)) return
    val configuredDuration = preferences
      .getLong(KEY_DURATION, DEFAULT_DURATION_MS)
      .coerceIn(500L, MAX_DURATION_MS)
    val storedLearnedDuration = preferences
      .getLong(KEY_LEARNED_DURATION, configuredDuration)
      .coerceIn(500L, MAX_DURATION_MS)
    val recoveredDuration = minOf(
      configuredDuration,
      storedLearnedDuration,
      DEFAULT_DURATION_MS
    )
    preferences.edit()
      .putLong(KEY_LEARNED_DURATION, recoveredDuration)
      .putInt(KEY_LEARNING_SUCCESS_STREAK, 0)
      .putBoolean(KEY_MONOTONIC_LEARNING_MIGRATED, true)
      .commit()
  }

  @Synchronized
  fun recordGestureSuccess(context: Context, successfulDurationMs: Long): GestureLearningResult {
    val preferences = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val configuredDuration = preferences.getLong(KEY_DURATION, DEFAULT_DURATION_MS)
    val currentDuration = preferences
      .getLong(KEY_LEARNED_DURATION, successfulDurationMs)
      .coerceIn(500L, MAX_DURATION_MS)
    val nextStreak = preferences.getInt(KEY_LEARNING_SUCCESS_STREAK, 0) + 1
    val floor = minOf(MIN_ADAPTIVE_DURATION_MS, configuredDuration)
    val nextDuration = if (nextStreak >= 3) {
      (minOf(currentDuration, successfulDurationMs) - 25L).coerceAtLeast(floor)
    } else {
      currentDuration
    }
    preferences.edit()
      .putLong(KEY_LEARNED_DURATION, nextDuration)
      .putInt(KEY_LEARNING_SUCCESS_STREAK, if (nextStreak >= 3) 0 else nextStreak)
      .apply()
    return GestureLearningResult(nextDuration, nextDuration != currentDuration)
  }

  @Synchronized
  fun recordGestureFailure(context: Context, failedDurationMs: Long): GestureLearningResult {
    val preferences = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val currentDuration = preferences
      .getLong(KEY_LEARNED_DURATION, minOf(failedDurationMs, DEFAULT_DURATION_MS))
      .coerceIn(500L, MAX_DURATION_MS)
    return GestureLearningResult(currentDuration, false)
  }

  fun disable(context: Context) {
    setAutomationEnabled(context, false, load(context).rideMode)
  }

  @Synchronized
  fun record(context: Context, type: String, message: String) {
    val preferences = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val current = try {
      JSONArray(preferences.getString(KEY_EVENTS, "[]") ?: "[]")
    } catch (_: Exception) {
      JSONArray()
    }
    val now = System.currentTimeMillis()
    val event = JSONObject()
      .put("id", UUID.randomUUID().toString())
      .put("at", now)
      .put("type", type)
      .put("message", message)
    val updated = JSONArray().put(event)

    for (index in 0 until minOf(current.length(), MAX_EVENTS - 1)) {
      current.optJSONObject(index)?.let(updated::put)
    }

    preferences.edit()
      .putString(KEY_EVENTS, updated.toString())
      .putString(KEY_LAST_EVENT, "$now: $message")
      .apply()
  }

  fun events(context: Context): List<Map<String, Any>> {
    val preferences = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val stored = try {
      JSONArray(preferences.getString(KEY_EVENTS, "[]") ?: "[]")
    } catch (_: Exception) {
      JSONArray()
    }

    return buildList {
      for (index in 0 until stored.length()) {
        val event = stored.optJSONObject(index) ?: continue
        add(
          mapOf(
            "id" to event.optString("id", "native-$index"),
            "at" to event.optLong("at", 0L),
            "type" to event.optString("type", "system"),
            "message" to event.optString("message", "Evento nativo")
          )
        )
      }
    }
  }

  fun clearEvents(context: Context) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
      .remove(KEY_EVENTS)
      .remove(KEY_LAST_EVENT)
      .apply()
  }

  fun savePendingCalibration(context: Context, x: Float, y: Float) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
      .putFloat(KEY_PENDING_X, x.coerceIn(0f, 1f))
      .putFloat(KEY_PENDING_Y, y.coerceIn(0f, 1f))
      .putLong(KEY_PENDING_AT, System.currentTimeMillis())
      .apply()
    record(context, "config", "Ponto de calibração capturado sobre o POP driver")
  }

  fun consumePendingCalibration(context: Context): Map<String, Any>? {
    val preferences = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    if (!preferences.contains(KEY_PENDING_X) || !preferences.contains(KEY_PENDING_Y)) return null

    val result = mapOf(
      "x" to preferences.getFloat(KEY_PENDING_X, 0.5f).toDouble(),
      "y" to preferences.getFloat(KEY_PENDING_Y, 0.7f).toDouble(),
      "updatedAt" to preferences.getLong(KEY_PENDING_AT, System.currentTimeMillis())
    )
    preferences.edit()
      .remove(KEY_PENDING_X)
      .remove(KEY_PENDING_Y)
      .remove(KEY_PENDING_AT)
      .apply()
    return result
  }

  @Synchronized
  fun markOfferNotification(context: Context, fingerprint: String): Boolean {
    val preferences = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val now = System.currentTimeMillis()
    if (preferences.getString("completed_notification", null) == fingerprint && now - preferences.getLong("completed_notification_at", 0L) < 120_000L) return false
    val previousFingerprint = preferences.getString(KEY_OFFER_NOTIFICATION_FINGERPRINT, null)
    val previousAt = preferences.getLong(KEY_OFFER_NOTIFICATION_AT, 0L)
    if (previousFingerprint == fingerprint && now - previousAt < 120_000L) return false

    val nextSequence = preferences.getLong(KEY_OFFER_NOTIFICATION_SEQUENCE, 0L) + 1L
    preferences.edit()
      .putString(KEY_OFFER_NOTIFICATION_FINGERPRINT, fingerprint.take(160))
      .putLong(KEY_OFFER_NOTIFICATION_AT, now)
      .putLong(KEY_OFFER_NOTIFICATION_SEQUENCE, nextSequence)
      .commit()
    return true
  }

  fun recentOfferNotification(context: Context, maxAgeMs: Long = OfferForegroundPolicy.HANDOFF_TIMEOUT_MS): Boolean {
    val preferences = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val at = preferences.getLong(KEY_OFFER_NOTIFICATION_AT, 0L)
    return at > 0L && System.currentTimeMillis() - at in 0L..maxAgeMs
  }

  fun currentOfferNotificationFingerprint(context: Context): String? {
    if (!recentOfferNotification(context)) return null
    return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .getString(KEY_OFFER_NOTIFICATION_FINGERPRINT, null)
  }

  @Synchronized
  fun completeOfferNotification(context: Context, fingerprint: String) {
    val preferences = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    if (preferences.getString(KEY_OFFER_NOTIFICATION_FINGERPRINT, null) != fingerprint) return
    preferences.edit().putString("completed_notification", fingerprint).putLong("completed_notification_at", System.currentTimeMillis())
      .remove(KEY_OFFER_NOTIFICATION_FINGERPRINT)
      .remove(KEY_OFFER_NOTIFICATION_AT)
      .apply()
  }

  @Synchronized
  fun claimOfferIdentity(context: Context, identity: String): Boolean {
    val preferences = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val now = System.currentTimeMillis()
    if (wasOfferHandled(context, identity, now)) return false

    preferences.edit()
      .putString(KEY_HANDLED_OFFER_IDENTITY, identity.take(160))
      .putLong(KEY_HANDLED_OFFER_AT, now)
      .commit()
    return true
  }

  fun wasOfferHandled(context: Context, identity: String, now: Long = System.currentTimeMillis()): Boolean {
    val preferences = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    return preferences.getString(KEY_HANDLED_OFFER_IDENTITY, null) == identity &&
      now - preferences.getLong(KEY_HANDLED_OFFER_AT, 0L) in 0L until 120_000L
  }

  @Synchronized
  fun releaseOfferIdentity(context: Context, identity: String) {
    val preferences = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    if (preferences.getString(KEY_HANDLED_OFFER_IDENTITY, null) != identity) return
    preferences.edit()
      .remove(KEY_HANDLED_OFFER_IDENTITY)
      .remove(KEY_HANDLED_OFFER_AT)
      .commit()
  }

  fun lastEvent(context: Context): String? {
    return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .getString(KEY_LAST_EVENT, null)
  }
}
