package com.toalhaver.vermelha.safeaccept

import android.graphics.Rect
import android.os.Build
import android.view.accessibility.AccessibilityNodeInfo
import org.json.JSONObject
import java.text.Normalizer
import java.util.Locale

/** Inspects advertised controls; does not dispatch gestures or perform any action. */
object ControlTargetScanner {
  data class Result(val target: AccessibilityNodeInfo?, val metadata: JSONObject)
  private fun bounds(r: Rect) = ControlBounds(r.left, r.top, r.right, r.bottom)
  private fun normalize(value: String) = Normalizer.normalize(value, Normalizer.Form.NFD)
    .replace(Regex("\\p{M}+"), "").lowercase(Locale.ROOT).replace(Regex("\\s+"), " ").trim()

  fun inspect(root: AccessibilityNodeInfo, safeBounds: Rect): Result {
    val candidates = mutableListOf<Pair<AccessibilityNodeInfo, ControlBounds>>()
    var visited = 0
    var markers = 0
    var longClickNodes = 0
    var holdNodes = 0
    var truncated = false
    fun visit(node: AccessibilityNodeInfo, depth: Int): String {
      if (visited >= 600 || depth >= 40) { truncated = true; return "" }
      visited++
      val parts = mutableListOf(normalize(listOfNotNull(node.text, node.contentDescription).joinToString(" ").take(8192)))
      for (i in 0 until minOf(node.childCount, 600)) {
        if (visited >= 600) { truncated = true; break }
        val child = node.getChild(i) ?: continue
        try { parts.add(visit(child, depth + 1)) } finally { child.recycle() }
      }
      val text = parts.joinToString(" ").take(16384)
      val marker = text.contains(PopMoveAccessibilityService.OFFER_SCREEN_MARKER)
      if (marker) {
        markers++
        val advertised = node.actionList.any { it.id == AccessibilityNodeInfo.ACTION_LONG_CLICK }
        if (advertised) longClickNodes++
        if (Build.VERSION.SDK_INT >= 30 && node.actionList.any {
            it.id == AccessibilityNodeInfo.AccessibilityAction.ACTION_PRESS_AND_HOLD.id
          }) holdNodes++
        val rectangle = Rect().also(node::getBoundsInScreen)
        if (ControlActionPolicy.eligible(bounds(rectangle), bounds(safeBounds), node.isVisibleToUser,
            node.isEnabled, node.packageName?.toString() == PopMoveAccessibilityService.POP_DRIVER_PACKAGE,
            marker, node.isLongClickable, advertised)) {
          candidates.add(AccessibilityNodeInfo.obtain(node) to bounds(rectangle))
        }
      }
      return text
    }
    try { visit(root, 0) } catch (_: RuntimeException) { truncated = true }
    val index = if (truncated) null else ControlActionPolicy.select(candidates.map { it.second })
    val target = index?.let { candidates[it].first }
    candidates.forEachIndexed { i, candidate -> if (i != index) candidate.first.recycle() }
    val reason = when {
      truncated -> "incomplete_tree"
      markers == 0 -> "marker_not_found"
      candidates.isEmpty() -> "no_eligible_long_click"
      index == null -> "ambiguous_cards"
      else -> "available"
    }
    return Result(target, JSONObject().put("at", System.currentTimeMillis())
      .put("reason", reason).put("markerNodes", markers).put("longClickNodes", longClickNodes)
      .put("pressAndHoldNodes", holdNodes).put("eligibleNodes", candidates.size)
      .put("available", target != null))
  }
}
