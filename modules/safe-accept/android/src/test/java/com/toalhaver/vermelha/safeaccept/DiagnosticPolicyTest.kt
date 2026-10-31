package com.toalhaver.vermelha.safeaccept

import org.junit.Assert.*
import org.junit.Test

class DiagnosticPolicyTest {
  @Test fun diagnosisBlocksRestoredAndRearmedModes() {
    listOf(null, "assist", "off", "test", "unexpected").forEach {
      assertEquals("off", DiagnosticPolicy.effectiveMode(it, true))
    }
  }

  @Test fun leavingDiagnosisDoesNotOverrideExplicitOff() {
    assertEquals("off", DiagnosticPolicy.effectiveMode("off", false))
    assertEquals("assist", DiagnosticPolicy.effectiveMode("assist", false))
  }

  @Test fun onlyKnownLabelsProduceAnAcceptanceCandidate() {
    assertEquals("possible_accept", DiagnosticPolicy.actionCategory(" ACEITAR   CORRIDA "))
    assertEquals("possible_accept", DiagnosticPolicy.actionCategory("Atender"))
    assertEquals("decline", DiagnosticPolicy.actionCategory("Não aceitar"))
    assertEquals("other", DiagnosticPolicy.actionCategory("Aceitar permissões"))
  }

  @Test fun arbitraryTextIsNeverRetained() {
    listOf(null, "Rua Exemplo, 123", "João · R$ 25,00", "Aceitar viagem de Maria").forEach {
      assertEquals("other", DiagnosticPolicy.actionCategory(it))
    }
  }
}
