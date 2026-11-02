package com.toalhaver.vermelha.safeaccept

import kotlin.random.Random
import org.junit.Assert.*
import org.junit.Test

class ScrollTrajectoryTest {
  @Test fun curvesStayInsideContentAndMoveUpwardWithBoundedDuration() {
    val random = Random(42)
    val variants = mutableSetOf<ScrollCurve>()
    repeat(2000) {
      val c = ScrollTrajectory.create(20f, 80f, 1040f, 2000f, random)!!
      variants.add(c)
      assertTrue(c.durationMs in 320L..520L)
      assertTrue(c.control1.x != c.start.x)
      var previousY = c.start.y + 1f
      for (step in 0..50) {
        val t = step / 50f
        val u = 1f - t
        val x = u*u*u*c.start.x + 3*u*u*t*c.control1.x + 3*u*t*t*c.control2.x + t*t*t*c.end.x
        val y = u*u*u*c.start.y + 3*u*u*t*c.control1.y + 3*u*t*t*c.control2.y + t*t*t*c.end.y
        assertTrue(x in 20f..1040f)
        assertTrue(y in 80f..2000f)
        assertTrue(y < previousY)
        previousY = y
      }
    }
    assertTrue(variants.size > 1900)
  }
  @Test fun invalidBoundsProduceNoGesture() {
    assertNull(ScrollTrajectory.create(0f, 0f, 0f, 1000f))
    assertNull(ScrollTrajectory.create(0f, 0f, 1000f, 20f))
    assertNull(ScrollTrajectory.create(Float.NaN, 0f, 1000f, 1000f))
  }
}
