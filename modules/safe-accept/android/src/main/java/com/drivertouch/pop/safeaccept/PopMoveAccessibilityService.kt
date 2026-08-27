package com.drivertouch.pop.safeaccept

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.content.Intent
import android.graphics.Color
import android.graphics.Path
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import java.util.Locale

class PopMoveAccessibilityService : AccessibilityService() {
  private var lastGestureAt = 0L
  private var lastDiagnosticAt = 0L
  private var offerVisible = false
  private var overlayView: View? = null

  override fun onServiceConnected() {
    serviceIsEnabled = true
    currentInstance = this
    offerVisible = false
    SafeAcceptStore.disarmOnServiceStart(this)
    SafeAcceptStore.record(
      this,
      "system",
      "Serviço conectado com a automação desarmada por segurança"
    )
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event == null || event.packageName?.toString() != POP_DRIVER_PACKAGE) return
    if (
      event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED &&
      event.eventType != AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED
    ) {
      return
    }

    val config = SafeAcceptStore.load(this)
    if (!config.armed || config.mode == "off") {
      offerVisible = false
      return
    }
    if (
      config.x !in 0f..1f ||
      config.y !in 0f..1f ||
      config.acceptMarker.length < 2
    ) {
      return
    }

    val root = rootInActiveWindow
    if (root == null) {
      recordTestDiagnostic(config, "POP driver detectado, mas o Android não forneceu a árvore acessível")
      return
    }
    val markerVisible = try {
      containsMarker(root, config.acceptMarker)
    } finally {
      root.recycle()
    }
    if (!markerVisible) {
      offerVisible = false
      recordTestDiagnostic(
        config,
        "POP driver detectado; o marcador configurado não apareceu na árvore acessível"
      )
      return
    }
    if (offerVisible) return
    offerVisible = true

    if (config.mode == "test") {
      SafeAcceptStore.record(
        this,
        "test",
        "Oferta compatível detectada no modo de teste"
      )
      return
    }
    if (config.mode != "assist") return

    val now = System.currentTimeMillis()
    val minimumInterval =
      config.longPressDurationMs + config.detectionDelayMs + 2500L
    if (now - lastGestureAt < minimumInterval) return
    lastGestureAt = now
    dispatchLongPress(config)
  }

  override fun onInterrupt() {
    offerVisible = false
    removeOverlay()
    SafeAcceptStore.disarmOnServiceStart(this)
    SafeAcceptStore.record(this, "system", "Serviço interrompido pelo Android")
  }

  override fun onDestroy() {
    serviceIsEnabled = false
    offerVisible = false
    removeOverlay()
    if (currentInstance === this) currentInstance = null
    super.onDestroy()
  }

  private fun dispatchLongPress(config: SafeAcceptConfig) {
    val displayMetrics = resources.displayMetrics
    val x = config.x * displayMetrics.widthPixels
    val y = config.y * displayMetrics.heightPixels
    val path = Path().apply { moveTo(x, y) }
    val stroke = GestureDescription.StrokeDescription(
      path,
      config.detectionDelayMs,
      config.longPressDurationMs
    )
    val gesture = GestureDescription.Builder().addStroke(stroke).build()

    val accepted = dispatchGesture(
      gesture,
      object : GestureResultCallback() {
        override fun onCompleted(gestureDescription: GestureDescription?) {
          SafeAcceptStore.record(
            this@PopMoveAccessibilityService,
            "gesture",
            "Toque prolongado enviado ao POP driver"
          )
        }

        override fun onCancelled(gestureDescription: GestureDescription?) {
          SafeAcceptStore.record(
            this@PopMoveAccessibilityService,
            "gesture",
            "Toque prolongado cancelado pelo Android"
          )
        }
      },
      null
    )

    if (!accepted) {
      SafeAcceptStore.record(
        this,
        "gesture",
        "Android recusou o gesto solicitado"
      )
    }
  }

  private fun recordTestDiagnostic(config: SafeAcceptConfig, message: String) {
    if (config.mode != "test") return
    val now = System.currentTimeMillis()
    if (now - lastDiagnosticAt < 10_000L) return
    lastDiagnosticAt = now
    SafeAcceptStore.record(this, "test", message)
  }

  private fun containsMarker(
    node: AccessibilityNodeInfo,
    marker: String
  ): Boolean {
    val visibleText =
      "${node.text ?: ""} ${node.contentDescription ?: ""}"
        .lowercase(Locale.ROOT)
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

  private fun beginCalibrationOverlay(): Boolean {
    val launchIntent =
      packageManager.getLaunchIntentForPackage(POP_DRIVER_PACKAGE)
        ?: run {
          SafeAcceptStore.record(
            this,
            "system",
            "POP driver não foi localizado neste aparelho"
          )
          return false
        }

    showCalibrationBubble()
    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
    startActivity(launchIntent)
    return true
  }

  private fun showCalibrationBubble() {
    removeOverlay()
    val panel = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(dp(16), dp(12), dp(16), dp(12))
      background = GradientDrawable().apply {
        setColor(Color.rgb(16, 24, 40))
        cornerRadius = dp(16).toFloat()
      }
    }
    panel.addView(
      TextView(this).apply {
        text = "Abra a tela de oferta e toque em MARCAR AGORA."
        setTextColor(Color.WHITE)
        textSize = 14f
      },
      LinearLayout.LayoutParams(dp(280), WindowManager.LayoutParams.WRAP_CONTENT)
    )

    val actions = LinearLayout(this).apply {
      orientation = LinearLayout.HORIZONTAL
      gravity = Gravity.END
    }
    actions.addView(
      Button(this).apply {
        text = "Cancelar"
        setOnClickListener {
          removeOverlay()
          SafeAcceptStore.record(
            this@PopMoveAccessibilityService,
            "system",
            "Calibração sobre o POP driver cancelada"
          )
        }
      }
    )
    actions.addView(
      Button(this).apply {
        text = "Marcar agora"
        setOnClickListener { showCalibrationTouchLayer() }
      }
    )
    panel.addView(actions)

    val params = WindowManager.LayoutParams(
      WindowManager.LayoutParams.WRAP_CONTENT,
      WindowManager.LayoutParams.WRAP_CONTENT,
      WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
      WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
        WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
      PixelFormat.TRANSLUCENT
    ).apply {
      gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
      y = dp(48)
    }
    addOverlay(panel, params)
  }

  private fun showCalibrationTouchLayer() {
    removeOverlay()
    val layer = FrameLayout(this).apply {
      setBackgroundColor(Color.argb(44, 21, 94, 239))
      isClickable = true
    }
    val instruction = TextView(this).apply {
      text = "Toque no centro exato do botão de aceite"
      gravity = Gravity.CENTER
      setTextColor(Color.WHITE)
      setBackgroundColor(Color.rgb(16, 24, 40))
      textSize = 16f
      setPadding(dp(12), dp(12), dp(12), dp(12))
    }
    layer.addView(
      instruction,
      FrameLayout.LayoutParams(
        WindowManager.LayoutParams.MATCH_PARENT,
        WindowManager.LayoutParams.WRAP_CONTENT,
        Gravity.TOP
      ).apply { topMargin = dp(48) }
    )
    layer.setOnTouchListener { _, event ->
      if (event.action == MotionEvent.ACTION_UP) {
        val metrics = resources.displayMetrics
        val x = (event.rawX / metrics.widthPixels).coerceIn(0f, 1f)
        val y = (event.rawY / metrics.heightPixels).coerceIn(0f, 1f)
        SafeAcceptStore.savePendingCalibration(this, x, y)
        removeOverlay()
        packageManager.getLaunchIntentForPackage(packageName)?.let { intent ->
          intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
          startActivity(intent)
        }
      }
      true
    }

    val params = WindowManager.LayoutParams(
      WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
      WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
      PixelFormat.TRANSLUCENT
    ).apply {
      gravity = Gravity.TOP or Gravity.START
    }
    addOverlay(layer, params)
  }

  private fun addOverlay(view: View, params: WindowManager.LayoutParams) {
    val windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
    windowManager.addView(view, params)
    overlayView = view
  }

  private fun removeOverlay() {
    val view = overlayView ?: return
    overlayView = null
    try {
      val windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
      windowManager.removeView(view)
    } catch (_: IllegalArgumentException) {
      // A janela já foi removida pelo Android.
    }
  }

  private fun dp(value: Int): Int {
    return (value * resources.displayMetrics.density).toInt()
  }

  companion object {
    const val POP_DRIVER_PACKAGE = "br.com.popmove.driver"

    @Volatile
    private var currentInstance: PopMoveAccessibilityService? = null

    @Volatile
    var serviceIsEnabled: Boolean = false
      private set

    fun beginOverlayCalibration(): Boolean {
      return currentInstance?.beginCalibrationOverlay() ?: false
    }
  }
}
