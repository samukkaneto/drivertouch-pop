package com.toalhaver.vermelha.safeaccept

data class TouchPoint(val x: Float, val y: Float)

/** Builds a stationary long-press path at the center of the currently visible marker. */
object TouchRegion {
  fun stablePath(left: Float, top: Float, right: Float, bottom: Float): List<TouchPoint>? {
    if (listOf(left, top, right, bottom).any { !it.isFinite() }) return null
    if (right - left < 2f || bottom - top < 2f) return null
    val center = TouchPoint((left + right) / 2f, (top + bottom) / 2f)
    return listOf(center, center)
  }
}
