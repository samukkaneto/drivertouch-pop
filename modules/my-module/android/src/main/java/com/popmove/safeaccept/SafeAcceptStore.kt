package com.popmove.safeaccept

import android.content.Context

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
  private const val PREFS = "popmove_safe_accept_native"
  private const val KEY_ARMED = "armed"
  private const val KEY_MODE = "mode"
  private const val KEY_X = "x"
  private const val KEY_Y = "y"
  private const val KEY_DURATION = "duration"
  private const val KEY_DELAY = "delay"
  private const val KEY_MARKER = "marker"
  private const val KEY_LAST_EVENT = "last_event"

  fun load(context: Context): SafeAcceptConfig {
    val preferences = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    return SafeAcceptConfig(
      armed = preferences.getBoolean(KEY_ARMED, false),
      mode = preferences.getString(KEY_MODE, "test") ?: "test",
      x = preferences.getFloat(KEY_X, -1f),
      y = preferences.getFloat(KEY_Y, -1f),
      longPressDurationMs = preferences.getLong(KEY_DURATION, 2000L),
      detectionDelayMs = preferences.getLong(KEY_DELAY, 400L),
      acceptMarker = preferences.getString(KEY_MARKER, "aceitar")?.trim()?.lowercase() ?: "aceitar"
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
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
      .putBoolean(KEY_ARMED, armed)
      .putString(KEY_MODE, mode)
      .putFloat(KEY_X, x.coerceIn(0.0, 1.0).toFloat())
      .putFloat(KEY_Y, y.coerceIn(0.0, 1.0).toFloat())
      .putLong(KEY_DURATION, longPressDurationMs.coerceIn(500, 4000).toLong())
      .putLong(KEY_DELAY, detectionDelayMs.coerceIn(0, 3000).toLong())
      .putString(KEY_MARKER, acceptMarker.trim().lowercase())
      .apply()
  }

  fun disable(context: Context) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
      .putBoolean(KEY_ARMED, false)
      .putString(KEY_MODE, "off")
      .apply()
    record(context, "Assistente desligado no painel")
  }

  fun record(context: Context, message: String) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
      .putString(KEY_LAST_EVENT, "${System.currentTimeMillis()}: $message")
      .apply()
  }

  fun lastEvent(context: Context): String? {
    return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_LAST_EVENT, null)
  }
}
