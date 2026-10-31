package com.toalhaver.vermelha.safeaccept

import android.content.Context
import android.os.Build
import android.service.notification.StatusBarNotification
import org.json.JSONArray
import org.json.JSONObject

/** Stores only structural notification metadata, never notification text or intents. */
object DiagnosticStore {
  private const val PREFS = "toalha_vermelha_diagnostics"
  private const val TARGET = "br.com.popmove.driver"
  // A new experimental method must start paused even when upgrading an armed installation.
  private const val ENABLED = "enabled_v2"
  private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  fun isEnabled(context: Context): Boolean = prefs(context).getBoolean(ENABLED, true)

  @Synchronized
  fun begin(context: Context) {
    prefs(context).edit().clear().putBoolean(ENABLED, true)
      .putLong("startedAt", System.currentTimeMillis()).commit()
  }

  fun end(context: Context) {
    prefs(context).edit().putBoolean(ENABLED, false).commit()
  }

  @Synchronized
  fun observeNotification(context: Context, sbn: StatusBarNotification, offerRecognized: Boolean) {
    if (sbn.packageName != TARGET) return
    val actions = sbn.notification.actions.orEmpty()
    val summaries = JSONArray()
    actions.take(12).forEachIndexed { index, action ->
      summaries.put(JSONObject()
        .put("index", index + 1)
        .put("category", DiagnosticPolicy.actionCategory(action.title))
        .put("hasIntent", action.actionIntent != null)
        .put("creatorMatches", action.actionIntent?.creatorPackage == TARGET)
        .put("requiresUnlock", if (Build.VERSION.SDK_INT >= 31) action.isAuthenticationRequired else JSONObject.NULL)
        .put("semanticAction", if (Build.VERSION.SDK_INT >= 28) action.semanticAction else -1)
        .put("remoteInputCount", action.remoteInputs?.size ?: 0))
    }
    val now = System.currentTimeMillis()
    val p = prefs(context)
    val sequence = p.getInt("notificationEvents", 0) + 1
    val sample = JSONObject()
      .put("sequence", sequence)
      .put("at", now)
      .put("postedAt", sbn.postTime)
      .put("offerRecognized", offerRecognized)
      .put("diagnosticMode", isEnabled(context))
      .put("hasOpenIntent", sbn.notification.contentIntent != null)
      .put("actionCount", actions.size)
      .put("actions", summaries)
    val history = prepend(sample, readArray(p.getString("notificationHistory", null)))
    val editor = p.edit()
      .putLong("startedAt", p.getLong("startedAt", now))
      .putInt("notificationEvents", sequence)
      .putString("notificationHistory", history.toString())
      .putString("lastNotification", sample.toString())
    if (offerRecognized) {
      editor.putInt("offerEvents", p.getInt("offerEvents", 0) + 1)
        .putString("lastOffer", sample.toString())
    }
    editor.apply()
  }

  @Synchronized
  fun command(context: Context, kind: String, dispatched: Boolean) {
    if (kind !in listOf("press", "scroll", "open", "longClick")) return
    val p = prefs(context)
    val events = JSONArray().put(JSONObject().put("at", System.currentTimeMillis())
      .put("kind", kind).put("dispatched", dispatched))
    val previous = readArray(p.getString("commands", null))
    for (i in 0 until minOf(previous.length(), 19)) events.put(previous.getJSONObject(i))
    p.edit().putInt("${kind}Count", p.getInt("${kind}Count", 0) + 1)
      .putString("commands", events.toString()).apply()
  }

  @Synchronized
  fun card(context: Context, metadata: JSONObject) {
    prefs(context).edit().putString("lastCard", metadata.toString()).apply()
  }

  @Synchronized
  fun observation(context: Context, result: String, state: JSONObject) {
    require(result in listOf("appeared", "not_observed"))
    val p = prefs(context)
    val item = JSONObject().put("at", System.currentTimeMillis())
      .put("result", result).put("state", state)
      // Freeze the sample known now; future notification updates must not change this link.
      .put("offerAtObservation", readObject(p.getString("lastOffer", null)))
      .put("cardAtObservation", readObject(p.getString("lastCard", null)))
      .put("notificationEventsAtObservation", p.getInt("notificationEvents", 0))
    val events = JSONArray().put(item)
    val previous = readArray(p.getString("observations", null))
    for (i in 0 until minOf(previous.length(), 19)) events.put(previous.getJSONObject(i))
    p.edit().putString("observations", events.toString()).apply()
  }

  @Synchronized
  fun snapshot(context: Context, state: JSONObject): String {
    val p = prefs(context)
    return JSONObject()
      .put("schema", 2)
      .put("appVersion", packageVersion(context, context.packageName))
      .put("popMoveVersion", packageVersion(context, TARGET))
      .put("device", "${Build.MANUFACTURER} ${Build.MODEL}")
      .put("androidVersion", Build.VERSION.RELEASE)
      .put("sdk", Build.VERSION.SDK_INT)
      .put("generatedAt", System.currentTimeMillis())
      .put("startedAt", p.getLong("startedAt", 0L))
      .put("state", state)
      .put("notificationEvents", p.getInt("notificationEvents", 0))
      .put("offerEvents", p.getInt("offerEvents", 0))
      .put("lastNotification", readObject(p.getString("lastNotification", null)))
      .put("lastOffer", readObject(p.getString("lastOffer", null)))
      .put("notificationHistory", readArray(p.getString("notificationHistory", null)))
      .put("lastCard", readObject(p.getString("lastCard", null)))
      .put("pressCount", p.getInt("pressCount", 0))
      .put("longClickCount", p.getInt("longClickCount", 0))
      .put("scrollCount", p.getInt("scrollCount", 0))
      .put("openCount", p.getInt("openCount", 0))
      .put("commands", readArray(p.getString("commands", null)))
      .put("observations", readArray(p.getString("observations", null)))
      .toString()
  }

  @Suppress("DEPRECATION")
  private fun packageVersion(context: Context, name: String): String = runCatching {
    context.packageManager.getPackageInfo(name, 0).versionName ?: "indisponível"
  }.getOrDefault("indisponível")

  private fun readObject(value: String?): Any =
    if (value == null) JSONObject.NULL else runCatching<Any> { JSONObject(value) }.getOrDefault(JSONObject.NULL)

  private fun readArray(value: String?): JSONArray =
    runCatching { JSONArray(value ?: "[]") }.getOrDefault(JSONArray())

  private fun prepend(item: JSONObject, previous: JSONArray): JSONArray {
    val events = JSONArray().put(item)
    for (i in 0 until minOf(previous.length(), 19)) events.put(previous.getJSONObject(i))
    return events
  }
}
