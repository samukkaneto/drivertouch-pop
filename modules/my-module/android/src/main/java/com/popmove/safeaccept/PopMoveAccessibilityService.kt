package com.popmove.safeaccept

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

class PopMoveAccessibilityService : AccessibilityService() {
  private var lastGestureAt = 0L

  override fun onServiceConnected() {
    serviceIsEnabled = true
    SafeAcceptStore.record(this, "Serviço de acessibilidade conectado")
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event == null || event.packageName?.toString() != POP_DRIVER_PACKAGE) return
    if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED && event.eventType != AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED) return

    val config = SafeAcceptStore.load(this)
    if (!config.armed || config.mode == "off") return
    if (config.x !in 0f..1f || config.y !in 0f..1f || config.acceptMarker.length < 2) return

    val root = rootInActiveWindow ?: return
    val markerVisible = try {
      containsMarker(root, config.acceptMarker)
    } finally {
      root.recycle()
    }
    if (!markerVisible) return

    if (config.mode == "test") {
      SafeAcceptStore.record(this, "Evento compatível detectado no modo de teste")
      return
    }

    val now = System.currentTimeMillis()
    val minimumInterval = config.longPressDurationMs + config.detectionDelayMs + 2500L
    if (now - lastGestureAt < minimumInterval) return
    lastGestureAt = now
    dispatchLongPress(config)
  }

  override fun onInterrupt() {
    SafeAcceptStore.record(this, "Serviço interrompido pelo Android")
  }

  override fun onDestroy() {
    serviceIsEnabled = false
    super.onDestroy()
  }

  private fun dispatchLongPress(config: SafeAcceptConfig) {
    val displayMetrics = resources.displayMetrics
    val x = config.x * displayMetrics.widthPixels
    val y = config.y * displayMetrics.heightPixels
    val path = Path().apply { moveTo(x, y) }
    val stroke = GestureDescription.StrokeDescription(path, config.detectionDelayMs, config.longPressDurationMs)
    val gesture = GestureDescription.Builder().addStroke(stroke).build()

    val accepted = dispatchGesture(gesture, object : GestureResultCallback() {
      override fun onCompleted(gestureDescription: GestureDescription?) {
        SafeAcceptStore.record(this@PopMoveAccessibilityService, "Toque prolongado enviado ao POP driver")
      }

      override fun onCancelled(gestureDescription: GestureDescription?) {
        SafeAcceptStore.record(this@PopMoveAccessibilityService, "Toque prolongado cancelado pelo Android")
      }
    }, null)

    if (!accepted) {
      SafeAcceptStore.record(this, "Android recusou o gesto solicitado")
    }
  }

  private fun containsMarker(node: AccessibilityNodeInfo, marker: String): Boolean {
    val visibleText = "${node.text ?: ""} ${node.contentDescription ?: ""}".lowercase()
    if (visibleText.contains(marker)) return true

    for (index in 0 until node.childCount) {
      val child = node.getChild(index) ?: continue
      try {
        if (containsMarker(child, marker)) return true
      } finally {
        child.recycle()
      }
    }
    return false
  }

  companion object {
    const val POP_DRIVER_PACKAGE = "br.com.popmove.driver"

    @Volatile
    var serviceIsEnabled: Boolean = false
      private set
  }
}
