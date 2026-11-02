package com.toalhaver.vermelha.safeaccept

import kotlin.random.Random

data class ScrollCurve(val start: TouchPoint, val control1: TouchPoint, val control2: TouchPoint, val end: TouchPoint, val durationMs: Long)

object ScrollTrajectory {
  /** All control points stay inside the vertical content corridor, away from Android navigation. */
  fun create(left: Float, top: Float, right: Float, bottom: Float, random: Random = Random.Default): ScrollCurve? {
    if (listOf(left, top, right, bottom).any { !it.isFinite() }) return null
    val width = right - left
    val height = bottom - top
    if (width < 100f || height < 160f) return null
    val x = 0.66f + random.nextFloat() * 0.10f
    val startY = 0.75f + random.nextFloat() * 0.06f
    val endY = 0.20f + random.nextFloat() * 0.05f
    val bend = (0.025f + random.nextFloat() * 0.025f) * if (random.nextBoolean()) 1f else -1f
    fun point(px: Float, py: Float) = TouchPoint(left + width * px, top + height * py)
    return ScrollCurve(point(x, startY), point(x + bend, startY - (startY - endY) * 0.33f),
      point(x - bend * 0.5f, startY - (startY - endY) * 0.72f),
      point(x + (random.nextFloat() - 0.5f) * 0.03f, endY), random.nextLong(320L, 521L))
  }
}
