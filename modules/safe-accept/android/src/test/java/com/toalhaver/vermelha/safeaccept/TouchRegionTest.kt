package com.toalhaver.vermelha.safeaccept

import org.junit.Assert.*
import org.junit.Test
import kotlin.math.hypot
import kotlin.random.Random

class TouchRegionTest {
  @Test fun pointsStayInsideVisibleMarkerAndRadius() {
    val random = Random(42)
    val starts = mutableSetOf<TouchPoint>()
    repeat(10000) {
      val points = TouchRegion.samplePath(30f, 80f, 230f, 140f, 80f, 2f, random)!!
      starts.add(points.first())
      points.forEach { point ->
        assertTrue(point.x > 30f && point.x < 230f)
        assertTrue(point.y > 80f && point.y < 140f)
        assertTrue(hypot(point.x - 130f, point.y - 110f) <= 29.001f)
        assertTrue(hypot(point.x - points[0].x, point.y - points[0].y) <= 2.001f)
      }
    }
    assertTrue(starts.size > 9900)
    assertTrue(starts.any { it.x < 120f } && starts.any { it.x > 140f })
    assertTrue(starts.any { it.y < 100f } && starts.any { it.y > 120f })
  }

  @Test fun honorsSmallRequestedRadius() {
    val random = Random(7)
    repeat(1000) {
      TouchRegion.samplePath(0f, 0f, 200f, 200f, 10f, 2f, random)!!.forEach {
        assertTrue(hypot(it.x - 100f, it.y - 100f) <= 10.001f)
      }
    }
  }

  @Test fun rejectsInvalidOrTinyRegions() {
    assertNull(TouchRegion.samplePath(0f, 0f, 0f, 10f, 10f, 2f))
    assertNull(TouchRegion.samplePath(0f, 0f, 10f, 2f, 10f, 2f))
    assertNull(TouchRegion.samplePath(0f, 0f, 10f, 10f, Float.NaN, 2f))
  }

  @Test fun singleModeOnlyAllowsTheSameOfferRetryUntilExplicitResume() {
    assertTrue(RidePolicy.allows("single", null, "a", false))
    assertFalse(RidePolicy.allows("single", "a", "b", false))
    assertFalse(RidePolicy.allows("single", "a", "a", false))
    assertFalse(RidePolicy.allows("single", "a", "b", true))
    assertTrue(RidePolicy.allows("single", "a", "a", true))
    assertTrue(RidePolicy.allows("continuous", "a", "b", false))
    assertTrue(RidePolicy.allows("single", null, "b", false))
  }
}
