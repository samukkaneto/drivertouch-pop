package com.toalhaver.vermelha.safeaccept

import org.junit.Assert.*
import org.junit.Test

class TouchRegionTest {
  @Test fun pathStaysAtTheVisibleMarkerCenter() {
    val points = TouchRegion.stablePath(30f, 80f, 230f, 140f)!!
    assertEquals(listOf(TouchPoint(130f, 110f), TouchPoint(130f, 110f)), points)
  }

  @Test fun rejectsInvalidOrTinyRegions() {
    assertNull(TouchRegion.stablePath(0f, 0f, 0f, 10f))
    assertNull(TouchRegion.stablePath(0f, 0f, 10f, 1f))
    assertNull(TouchRegion.stablePath(0f, 0f, Float.NaN, 10f))
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
