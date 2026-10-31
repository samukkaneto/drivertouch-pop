package com.toalhaver.vermelha.safeaccept

import java.text.Normalizer
import java.util.Locale

/** Pure rules: diagnostics must win over restored/calibrated automation settings. */
object DiagnosticPolicy {
  fun effectiveMode(storedMode: String?, diagnostic: Boolean): String =
    if (diagnostic || storedMode == "off") "off" else "assist"

  // Only a fixed category is retained. Unknown labels may contain personal data.
  fun actionCategory(title: CharSequence?): String {
    val normalized = Normalizer.normalize(title?.toString().orEmpty().take(160), Normalizer.Form.NFD)
      .replace(Regex("\\p{M}+"), "")
      .lowercase(Locale.ROOT).trim().replace(Regex("\\s+"), " ")
    return when (normalized) {
      "aceitar", "aceitar corrida", "aceitar viagem", "atender", "atender corrida", "atender viagem" -> "possible_accept"
      "recusar", "recusar corrida", "recusar viagem", "rejeitar", "cancelar", "nao aceitar" -> "decline"
      "abrir", "abrir aplicativo", "ver corrida", "ver viagem", "visualizar" -> "open"
      else -> "other"
    }
  }
}
