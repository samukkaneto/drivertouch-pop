package com.toalhaver.vermelha.safeaccept

data class ControlBounds(val left: Int, val top: Int, val right: Int, val bottom: Int) {
  val width get() = right.toLong() - left
  val height get() = bottom.toLong() - top
  val area get() = width * height
  fun contains(other: ControlBounds) = left <= other.left && top <= other.top && right >= other.right && bottom >= other.bottom
}

object ControlActionPolicy {
  /** Notification refreshes and countdown labels must not turn one card into another attempt. */
  fun stableOfferText(texts: List<String>): String = texts.map {
    it.replace(Regex("\\b\\d+\\s*(min|minuto|minutos|seg|segundo|segundos|s)\\b"), "")
      .trim()
  }.filter { it.isNotBlank() && !it.matches(Regex("[\\d\\s:]+")) }.distinct().sorted().joinToString("|")

  fun eligible(bounds: ControlBounds, safe: ControlBounds, visible: Boolean, enabled: Boolean,
               correctPackage: Boolean, markerPresent: Boolean, longClickable: Boolean, advertised: Boolean): Boolean =
    visible && enabled && correctPackage && markerPresent && longClickable && advertised &&
      bounds.width > 0 && bounds.height > 0 && safe.width > 0 && safe.height > 0 &&
      safe.contains(bounds) && bounds.height <= safe.height * 0.65 && bounds.area <= safe.area * 0.65

  /** Nested controls can describe the same card. Distinct cards are ambiguous. */
  fun select(bounds: List<ControlBounds>): Int? {
    val index = bounds.indices.minByOrNull { bounds[it].area } ?: return null
    val selected = bounds[index]
    return if (bounds.all { it.contains(selected) || selected.contains(it) }) index else null
  }
}
