package com.toalhaver.vermelha.safeaccept

import org.junit.Assert.*
import org.junit.Test

class ControlActionPolicyTest {
  @Test fun notificationRefreshesAndCountdownsDoNotChangeCardIdentity() {
    val first = listOf("pressione e segure para atender", "rua a", "20 s", "14:30")
    val later = listOf("14:31", "19 s", "rua a", "pressione e segure para atender")
    assertEquals(ControlActionPolicy.stableOfferText(first), ControlActionPolicy.stableOfferText(later))
    assertNotEquals(ControlActionPolicy.stableOfferText(first), ControlActionPolicy.stableOfferText(first + "rua b"))
  }

  private val screen = ControlBounds(0, 40, 1080, 2000)
  private val card = ControlBounds(20, 180, 1060, 700)
  private fun allowed(b: ControlBounds = card, visible: Boolean = true, enabled: Boolean = true,
                      correctPackage: Boolean = true, marker: Boolean = true, clickable: Boolean = true,
                      advertised: Boolean = true) = ControlActionPolicy.eligible(
    b, screen, visible, enabled, correctPackage, marker, clickable, advertised)

  @Test fun acceptsOnlyAVisibleEnabledAdvertisedCard() {
    assertTrue(allowed())
    assertFalse(allowed(visible = false))
    assertFalse(allowed(enabled = false))
    assertFalse(allowed(correctPackage = false))
    assertFalse(allowed(marker = false))
    assertFalse(allowed(clickable = false))
    assertFalse(allowed(advertised = false))
  }

  @Test fun rejectsRootOffscreenAndInvalidBounds() {
    assertFalse(allowed(screen))
    assertFalse(allowed(ControlBounds(0, -20, 1080, 500)))
    assertFalse(allowed(ControlBounds(50, 100, 40, 300)))
    assertFalse(allowed(ControlBounds(0, 40, 1080, 1800)))
  }

  @Test fun selectsClosestNestedControlButRejectsDistinctCards() {
    val inner = ControlBounds(40, 500, 800, 650)
    assertEquals(1, ControlActionPolicy.select(listOf(card, inner)))
    assertNull(ControlActionPolicy.select(listOf(card, ControlBounds(20, 800, 1060, 1300))))
    assertNull(ControlActionPolicy.select(emptyList()))
  }
}
