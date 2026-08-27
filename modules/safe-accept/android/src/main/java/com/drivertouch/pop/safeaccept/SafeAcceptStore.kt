package com.drivertouch.pop.safeaccept

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
  val acceptMarker: String
)

object SafeAcceptStore {
  private const val PREFS = "drivertouch_pop_native"
  private const val KEY_ARMED = "armed"
  private const val KEY_MODE = "mode"
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
  private const val MAX_EVENTS = 50

  fun load(context: Context): SafeAcceptConfig {
    val preferences = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    return SafeAcceptConfig(
      armed = preferences.getBoolean(KEY_ARMED, false),
      mode = preferences.getString(KEY_MODE, "test") ?: "test",
      x = preferences.getFloat(KEY_X, -1f),
      y = preferences.getFloat(KEY_Y, -1f),
      longPressDurationMs = preferences.getLong(KEY_DURATION, 2000L),
      detectionDelayMs = preferences.getLong(KEY_DELAY, 400L),
      acceptMarker = preferences
        .getString(KEY_MARKER, "aceitar")
        ?.trim()
        ?.lowercase(Locale.ROOT)
        ?: "aceitar"
    )
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
    val safeMode = if (mode in setOf("off", "test", "assist")) mode else "off"
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
      .putBoolean(KEY_ARMED, armed && safeMode != "off")
      .putString(KEY_MODE, safeMode)
      .putFloat(KEY_X, x.coerceIn(0.0, 1.0).toFloat())
      .putFloat(KEY_Y, y.coerceIn(0.0, 1.0).toFloat())
      .putLong(KEY_DURATION, longPressDurationMs.coerceIn(500, 4000).toLong())
      .putLong(KEY_DELAY, detectionDelayMs.coerceIn(0, 3000).toLong())
      .putString(KEY_MARKER, acceptMarker.trim().lowercase(Locale.ROOT).take(80))
      .apply()
  }

  fun disable(context: Context) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
      .putBoolean(KEY_ARMED, false)
      .putString(KEY_MODE, "off")
      .apply()
    record(context, "system", "Automação desarmada pelo painel")
  }

  fun disarmOnServiceStart(context: Context) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
      .putBoolean(KEY_ARMED, false)
      .apply()
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

  fun lastEvent(context: Context): String? {
    return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .getString(KEY_LAST_EVENT, null)
  }
}
