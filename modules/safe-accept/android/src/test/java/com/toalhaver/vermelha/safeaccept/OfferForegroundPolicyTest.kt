package com.toalhaver.vermelha.safeaccept

import com.toalhaver.vermelha.safeaccept.OfferForegroundPolicy.Next
import org.junit.Assert.*
import org.junit.Test

class OfferForegroundPolicyTest {
  private val start = 12_000L
  private val initial = OfferForegroundPolicy.State(start)

  @Test fun requestReturningNormallyDoesNotReplaceWindowConfirmation() {
    assertEquals(Next.OPEN_NOTIFICATION, OfferForegroundPolicy.next(initial, start, false, true))
    val sent = initial.copy(requests = 1, lastRequestAt = start, requestDispatched = true)
    assertEquals(Next.WAIT, OfferForegroundPolicy.next(sent, start + 500L, false, true))
    assertEquals(Next.OPEN_LAUNCHER, OfferForegroundPolicy.next(sent, start + 1_000L, false, true))
    val retried = sent.copy(requests = 2, lastRequestAt = start + 1_000L)
    assertEquals(Next.WAIT, OfferForegroundPolicy.next(retried, start + 4_000L, false, true))
    assertEquals(Next.EXPIRED, OfferForegroundPolicy.next(retried, start + 5_500L, false, true))
  }

  @Test fun fallsBackWhenTheNotificationHasNoUsableIntentOrSendingFails() {
    assertEquals(Next.OPEN_LAUNCHER, OfferForegroundPolicy.next(initial, start, false, false))
    val failed = initial.copy(requests = 1, lastRequestAt = start, requestDispatched = false)
    assertEquals(Next.OPEN_LAUNCHER, OfferForegroundPolicy.next(failed, start + 180L, false, true))
  }

  @Test fun readsAnOpenWindowWithoutRequestingAnotherLaunch() {
    assertEquals(Next.READ_CARD, OfferForegroundPolicy.next(initial, start, true, true))
    val opened = initial.copy(requests = 1, windowSeenAt = start + 200L, requestDispatched = true)
    assertEquals(Next.READ_CARD, OfferForegroundPolicy.next(opened, start + 2_000L, true, true))
    assertEquals(Next.WAIT, OfferForegroundPolicy.next(opened, start + 2_000L, false, true))
  }

  @Test fun shortLoadingScreenPreservesOnlyPreviouslyConfirmedAvailability() {
    val opened = initial.copy(requests = 1, windowSeenAt = start + 100L)
    val now = start + 1_000L
    val grace = OfferForegroundPolicy.preserveReadyDuringLoad(opened, now)
    assertTrue(grace)
    val ready = RideSession("ready")
    assertTrue(RideSessionPolicy.mayAccept("single", RideSessionPolicy.observe(ready, false, false, now, grace)))
    for (unavailable in listOf(RideSession(), RideSessionPolicy.afterAttempt(start), RideSession("busy"))) {
      assertFalse(RideSessionPolicy.mayAccept("single",
        RideSessionPolicy.observe(unavailable, false, false, now, grace)))
    }
    assertFalse(OfferForegroundPolicy.preserveReadyDuringLoad(opened, start + 2_600L))
    assertFalse(OfferForegroundPolicy.preserveReadyDuringLoad(opened.copy(recognizedScreen = true), now))
  }

  @Test fun repeatedUpdatesDoNotSuppressAnotherNotificationWithIdenticalContent() {
    val notices = OfferNotificationDeduper()
    assertTrue(notices.shouldStart("first", "same", start))
    assertFalse(notices.shouldStart("first", "same", start + 500L))
    assertTrue(notices.shouldStart("second", "same", start + 600L))
    notices.forget("first")
    assertTrue(notices.shouldStart("first", "same", start + 700L))
    assertTrue(notices.shouldStart("first", "new offer", start + 800L))
  }

  @Test fun doesNotRecoverAnOldOrFutureNotification() {
    assertTrue(OfferForegroundPolicy.isFresh(start - 9_000L, start))
    assertFalse(OfferForegroundPolicy.isFresh(start - 10_001L, start))
    assertFalse(OfferForegroundPolicy.isFresh(start + 1L, start))
  }
}
