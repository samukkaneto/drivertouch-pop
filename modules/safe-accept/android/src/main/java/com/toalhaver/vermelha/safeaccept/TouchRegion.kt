package com.toalhaver.vermelha.safeaccept

import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt
import kotlin.random.Random

data class TouchPoint(val x: Float, val y: Float)

/** All points stay inside both the requested disk and the visible marker. */
object TouchRegion {
  fun samplePath(
    left: Float, top: Float, right: Float, bottom: Float,
    requestedRadius: Float, maxDrift: Float, random: Random = Random.Default
  ): List<TouchPoint>? {
    if (listOf(left, top, right, bottom, requestedRadius, maxDrift).any { !it.isFinite() }) return null
    val radius = minOf(requestedRadius, (right - left) / 2f - 1f, (bottom - top) / 2f - 1f)
    if (radius <= 0f || maxDrift < 0f) return null
    val drift = minOf(maxDrift, radius / 4f)
    val distance = sqrt(random.nextFloat()) * (radius - drift)
    val angle = random.nextDouble() * Math.PI * 2
    val start = TouchPoint(
      (left + right) / 2f + (cos(angle) * distance).toFloat(),
      (top + bottom) / 2f + (sin(angle) * distance).toFloat()
    )
    return listOf(start) + List(2) {
      val localAngle = random.nextDouble() * Math.PI * 2
      val localDistance = random.nextFloat() * drift
      TouchPoint(start.x + (cos(localAngle) * localDistance).toFloat(),
        start.y + (sin(localAngle) * localDistance).toFloat())
    }
  }
}

object RidePolicy {
  fun allows(mode: String, consumedIdentity: String?, identity: String, retry: Boolean): Boolean {
    return mode == "continuous" || consumedIdentity == null || (retry && consumedIdentity == identity)
  }
}
