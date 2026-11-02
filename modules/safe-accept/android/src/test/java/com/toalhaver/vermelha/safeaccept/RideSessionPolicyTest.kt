package com.toalhaver.vermelha.safeaccept

import org.junit.Assert.*
import org.junit.Test

class RideSessionPolicyTest {
  private fun free(state: RideSession, time: Long): RideSession {
    val first = RideSessionPolicy.observe(state, true, false, time)
    return RideSessionPolicy.observe(first, true, false, time + 1100L)
  }

  @Test fun oneAtATimeAutomaticallyAcceptsAgainAfterEachTripReturnsToIdle() {
    var state = RideSession()
    repeat(10) { trip ->
      val time = 10_000L + trip * 60_000L
      state = free(state, time)
      assertTrue(RideSessionPolicy.mayAccept("single", state))
      state = RideSessionPolicy.observe(state, false, true, time + 1500L)
      assertTrue(RideSessionPolicy.mayAccept("single", state))
      state = RideSessionPolicy.afterAttempt(time + 2000L)
      assertFalse(RideSessionPolicy.mayAccept("single", state))
      state = RideSessionPolicy.observe(state, false, false, time + 3000L)
      assertEquals("busy", state.phase)
      state = RideSessionPolicy.observe(state, false, true, time + 5000L)
      assertFalse(RideSessionPolicy.mayAccept("single", state))
    }
  }

  @Test fun timeoutMissingCardAndIdleBehindAnOfferCannotReleaseAnOccupiedTrip() {
    val occupied = RideSessionPolicy.afterAttempt(1000L)
    assertFalse(RideSessionPolicy.mayAccept("single", RideSessionPolicy.observe(occupied, false, false, 900_000L)))
    assertFalse(RideSessionPolicy.mayAccept("single", RideSessionPolicy.observe(occupied, true, true, 900_000L)))
    val staleIdle = RideSessionPolicy.observe(occupied, true, false, 1200L)
    assertFalse(RideSessionPolicy.mayAccept("single", RideSessionPolicy.observe(staleIdle, true, false, 2300L)))
  }

  @Test fun startupWithAnExistingCardRemainsUnknownUntilIdleIsConfirmed() {
    var state = RideSessionPolicy.observe(RideSession(), false, true, 1000L)
    assertFalse(RideSessionPolicy.mayAccept("single", state))
    state = free(state, 5000L)
    assertTrue(RideSessionPolicy.mayAccept("single", state))
  }

  @Test fun onlySimultaneousModeMayScrollForAnUnseenPendingOffer() {
    for (pending in listOf(false, true)) for (visible in listOf(false, true)) {
      assertFalse(RideSessionPolicy.mayScroll("single", pending, visible))
    }
    assertTrue(RideSessionPolicy.mayAccept("continuous", RideSessionPolicy.afterAttempt(1000L)))
    assertTrue(RideSessionPolicy.mayScroll("continuous", true, false))
    assertFalse(RideSessionPolicy.mayScroll("continuous", false, false))
    assertFalse(RideSessionPolicy.mayScroll("continuous", true, true))
  }
}
