package com.drivertouch.pop.safeaccept

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.content.Intent
import android.graphics.Color
import android.graphics.Path
import android.graphics.PixelFormat
import android.graphics.Rect
import android.graphics.drawable.GradientDrawable
import android.os.Handler
import android.os.Looper
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
import java.security.MessageDigest
import java.text.Normalizer

class PopMoveAccessibilityService : AccessibilityService() {
  private var lastGestureAt = 0L
  private val offerHandler = Handler(Looper.getMainLooper())
  private var overlayView: View? = null
  private var gestureInFlight = false
  private var offerResolutionInProgress = false
  private var scrollGestureInFlight = false
  private var scrollOfferFingerprint: String? = null
  private var scrollAttempts = 0
  private var lastScrollAt = 0L

  private data class ScreenSnapshot(
    val markerVisible: Boolean,
    val markerCenterX: Float?,
    val markerCenterY: Float?,
    val fingerprint: String
  )

  private data class GestureAttempt(
    val identity: String,
    val screenFingerprint: String,
    val x: Float,
    val y: Float,
    val durationMs: Long,
    val retryCount: Int
  )

  override fun onServiceConnected() {
    serviceIsEnabled = true
    currentInstance = this
    val config = SafeAcceptStore.load(this)
    SafeAcceptStore.record(
      this,
      "system",
      if (config.armed) {
        "Serviço conectado com execução automática ativa"
      } else {
        "Serviço conectado; execução automática desligada"
      }
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

    evaluateActiveWindow(allowScroll = true)
  }

  override fun onInterrupt() {
    removeOverlay()
    SafeAcceptStore.record(this, "system", "Serviço interrompido pelo Android")
  }

  override fun onDestroy() {
    serviceIsEnabled = false
    offerHandler.removeCallbacksAndMessages(null)
    removeOverlay()
    if (currentInstance === this) currentInstance = null
    super.onDestroy()
  }

  private fun evaluateActiveWindow(
    allowNotificationFallback: Boolean = false,
    allowScroll: Boolean = false
  ) {
    val config = SafeAcceptStore.load(this)
    if (!config.armed || config.mode == "off") return
    if (config.x !in 0f..1f || config.y !in 0f..1f) return
    if (offerResolutionInProgress) return

    val root = rootInActiveWindow ?: return
    if (root.packageName?.toString() != POP_DRIVER_PACKAGE) {
      root.recycle()
      return
    }

    val snapshot = buildScreenSnapshot(root, config.acceptMarker)
    val notificationFingerprint = SafeAcceptStore.currentOfferNotificationFingerprint(this)
    if (!snapshot.markerVisible) {
      val scrollPending = if (allowScroll && notificationFingerprint != null) {
        attemptOfferScroll(root, notificationFingerprint)
      } else {
        false
      }
      root.recycle()
      if (scrollPending || !(allowNotificationFallback && notificationFingerprint != null)) return
    } else {
      root.recycle()
    }

    if (gestureInFlight || scrollGestureInFlight) {
      return
    }

    val now = System.currentTimeMillis()
    val minimumInterval = config.longPressDurationMs + config.detectionDelayMs + 200L
    if (now - lastGestureAt < minimumInterval) return

    val identity = notificationFingerprint?.let { "notification:$it" }
      ?: "screen:${snapshot.fingerprint}"
    if (!SafeAcceptStore.claimOfferIdentity(this, identity)) return

    val displayMetrics = resources.displayMetrics
    val x = snapshot.markerCenterX ?: config.x * displayMetrics.widthPixels
    val y = snapshot.markerCenterY ?: config.y * displayMetrics.heightPixels
    lastGestureAt = now
    SafeAcceptStore.record(
      this,
      "gesture",
      if (snapshot.markerVisible && snapshot.markerCenterX != null) {
        "Oferta real localizada; toque longo direcionado pelo cartão"
      } else if (snapshot.markerVisible) {
        "Oferta real localizada; toque longo direcionado pela calibração"
      } else {
        "Notificação real confirmada; toque longo direcionado pela calibração"
      }
    )
    dispatchLongPress(
      config,
      GestureAttempt(
        identity = identity,
        screenFingerprint = snapshot.fingerprint,
        x = x,
        y = y,
        durationMs = config.longPressDurationMs,
        retryCount = 0
      )
    )
  }

  private fun dispatchLongPress(config: SafeAcceptConfig, attempt: GestureAttempt) {
    if (gestureInFlight || scrollGestureInFlight) return
    offerResolutionInProgress = true
    gestureInFlight = true
    lastGestureAt = System.currentTimeMillis()
    val path = Path().apply { moveTo(attempt.x, attempt.y) }
    val stroke = GestureDescription.StrokeDescription(
      path,
      config.detectionDelayMs,
      attempt.durationMs
    )
    val gesture = GestureDescription.Builder().addStroke(stroke).build()

    val accepted = dispatchGesture(
      gesture,
      object : GestureResultCallback() {
        override fun onCompleted(gestureDescription: GestureDescription?) {
          gestureInFlight = false
          SafeAcceptStore.record(
            this@PopMoveAccessibilityService,
            "gesture",
            "Toque prolongado de ${attempt.durationMs} ms concluído no cartão da viagem"
          )
          offerHandler.postDelayed({ verifyGestureResult(config, attempt) }, VERIFY_DELAY_MS)
        }

        override fun onCancelled(gestureDescription: GestureDescription?) {
          gestureInFlight = false
          offerResolutionInProgress = false
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
      gestureInFlight = false
      offerResolutionInProgress = false
      SafeAcceptStore.record(
        this,
        "gesture",
        "Android recusou o gesto solicitado"
      )
    }
  }

  private fun verifyGestureResult(config: SafeAcceptConfig, attempt: GestureAttempt) {
    if (gestureInFlight || scrollGestureInFlight) return
    val root = rootInActiveWindow
    if (root == null || root.packageName?.toString() != POP_DRIVER_PACKAGE) {
      root?.recycle()
      completeOfferSession(attempt.identity)
      offerResolutionInProgress = false
      SafeAcceptStore.record(
        this,
        "gesture",
        "POP driver saiu da janela após o toque; resultado não usado no aprendizado"
      )
      return
    }

    val snapshot = try {
      buildScreenSnapshot(root, config.acceptMarker)
    } finally {
      root.recycle()
    }
    val cardChanged = !snapshot.markerVisible || snapshot.fingerprint != attempt.screenFingerprint
    if (cardChanged) {
      val learning = SafeAcceptStore.recordGestureSuccess(this, attempt.durationMs)
      completeOfferSession(attempt.identity)
      offerResolutionInProgress = false
      SafeAcceptStore.record(
        this,
        "gesture",
        if (learning.changed) {
          "Cartão respondeu; duração aprendida reduzida para ${learning.durationMs} ms"
        } else {
          "Cartão respondeu ao toque automático"
        }
      )
      offerHandler.postDelayed(
        { evaluateActiveWindow(allowScroll = true) },
        POST_GESTURE_SCAN_DELAY_MS
      )
      return
    }

    val learning = SafeAcceptStore.recordGestureFailure(this, attempt.durationMs)
    if (attempt.retryCount >= MAX_GESTURE_RETRIES || !learning.changed) {
      offerResolutionInProgress = false
      SafeAcceptStore.record(
        this,
        "gesture",
        "Cartão permaneceu visível após a repetição; duração aprendida em ${learning.durationMs} ms"
      )
      return
    }

    SafeAcceptStore.record(
      this,
      "gesture",
      "Cartão não respondeu; repetindo imediatamente com ${learning.durationMs} ms"
    )
    offerHandler.postDelayed(
      {
        dispatchLongPress(
          config.copy(longPressDurationMs = learning.durationMs, detectionDelayMs = 0L),
          attempt.copy(
            durationMs = learning.durationMs,
            retryCount = attempt.retryCount + 1
          )
        )
      },
      RETRY_DELAY_MS
    )
  }

  private fun attemptOfferScroll(root: AccessibilityNodeInfo, fingerprint: String): Boolean {
    if (scrollOfferFingerprint != fingerprint) {
      scrollOfferFingerprint = fingerprint
      scrollAttempts = 0
      lastScrollAt = 0L
    }
    if (gestureInFlight || scrollGestureInFlight) return true
    if (scrollAttempts >= MAX_SCROLL_ATTEMPTS) return false

    val now = System.currentTimeMillis()
    if (now - lastScrollAt < MIN_SCROLL_INTERVAL_MS) return true
    lastScrollAt = now
    scrollAttempts += 1

    if (scrollFirstScrollable(root)) {
      if (scrollAttempts == 1) {
        SafeAcceptStore.record(
          this,
          "gesture",
          "Busca por rolagem iniciada para localizar a corrida em fila"
        )
      }
      offerHandler.postDelayed(
        {
          evaluateActiveWindow(
            allowNotificationFallback = scrollAttempts >= MAX_SCROLL_ATTEMPTS,
            allowScroll = true
          )
        },
        AFTER_SCROLL_SCAN_DELAY_MS
      )
      return true
    }

    return dispatchFallbackScrollGesture()
  }

  private fun scrollFirstScrollable(node: AccessibilityNodeInfo): Boolean {
    if (node.isScrollable && node.performAction(AccessibilityNodeInfo.ACTION_SCROLL_FORWARD)) {
      return true
    }
    for (index in 0 until node.childCount) {
      val child = node.getChild(index) ?: continue
      try {
        if (scrollFirstScrollable(child)) return true
      } finally {
        child.recycle()
      }
    }
    return false
  }

  private fun dispatchFallbackScrollGesture(): Boolean {
    val metrics = resources.displayMetrics
    val path = Path().apply {
      moveTo(metrics.widthPixels * 0.5f, metrics.heightPixels * 0.72f)
      lineTo(metrics.widthPixels * 0.5f, metrics.heightPixels * 0.34f)
    }
    val gesture = GestureDescription.Builder()
      .addStroke(GestureDescription.StrokeDescription(path, 0L, SCROLL_DURATION_MS))
      .build()
    scrollGestureInFlight = true
    val accepted = dispatchGesture(
      gesture,
      object : GestureResultCallback() {
        override fun onCompleted(gestureDescription: GestureDescription?) {
          scrollGestureInFlight = false
          if (scrollAttempts == 1) {
            SafeAcceptStore.record(
              this@PopMoveAccessibilityService,
              "gesture",
              "Busca por gesto de rolagem iniciada para localizar a corrida em fila"
            )
          }
          offerHandler.postDelayed(
            {
              evaluateActiveWindow(
                allowNotificationFallback = scrollAttempts >= MAX_SCROLL_ATTEMPTS,
                allowScroll = true
              )
            },
            AFTER_SCROLL_SCAN_DELAY_MS
          )
        }

        override fun onCancelled(gestureDescription: GestureDescription?) {
          scrollGestureInFlight = false
          offerHandler.postDelayed(
            {
              evaluateActiveWindow(
                allowNotificationFallback = scrollAttempts >= MAX_SCROLL_ATTEMPTS,
                allowScroll = true
              )
            },
            AFTER_SCROLL_SCAN_DELAY_MS
          )
        }
      },
      null
    )
    if (!accepted) scrollGestureInFlight = false
    return accepted
  }

  private fun completeOfferSession(identity: String) {
    val prefix = "notification:"
    if (!identity.startsWith(prefix)) return
    val fingerprint = identity.removePrefix(prefix)
    SafeAcceptStore.completeOfferNotification(this, fingerprint)
    if (scrollOfferFingerprint == fingerprint) {
      scrollOfferFingerprint = null
      scrollAttempts = 0
      lastScrollAt = 0L
    }
  }

  private fun buildScreenSnapshot(
    root: AccessibilityNodeInfo,
    configuredMarker: String
  ): ScreenSnapshot {
    val texts = mutableListOf<String>()
    var markerBounds: Rect? = null
    val markers = listOf(
      configuredMarker,
      OFFER_SCREEN_MARKER,
      "segure para atender",
      "pressione e segure"
    ).map(::normalize).filter { it.length >= 4 }

    fun visit(node: AccessibilityNodeInfo) {
      val nodeTexts = listOf(node.text, node.contentDescription)
        .filterNotNull()
        .map { normalize(it.toString()) }
        .filter(String::isNotBlank)

      for (text in nodeTexts) {
        texts.add(text)
        if (markerBounds == null && markers.any(text::contains)) {
          val bounds = Rect()
          node.getBoundsInScreen(bounds)
          if (!bounds.isEmpty) markerBounds = bounds
        }
      }

      for (index in 0 until node.childCount) {
        val child = node.getChild(index) ?: continue
        try {
          visit(child)
        } finally {
          child.recycle()
        }
      }
    }

    visit(root)
    val joinedText = texts.joinToString(" ")
    val markerVisible = markers.any(joinedText::contains)
    val stableText = texts.distinct().sorted().joinToString("|")
    val bounds = markerBounds
    return ScreenSnapshot(
      markerVisible = markerVisible,
      markerCenterX = bounds?.exactCenterX(),
      markerCenterY = bounds?.exactCenterY(),
      fingerprint = sha256(stableText)
    )
  }

  private fun scheduleOfferChecks(alreadyOpen: Boolean) {
    val fingerprint = SafeAcceptStore.currentOfferNotificationFingerprint(this)
    if (fingerprint != null && fingerprint != scrollOfferFingerprint) {
      scrollOfferFingerprint = fingerprint
      scrollAttempts = 0
      lastScrollAt = 0L
    }

    longArrayOf(0L, 25L, 60L).forEach { delay ->
      offerHandler.postDelayed({ evaluateActiveWindow() }, delay)
    }
    val scrollStart = if (alreadyOpen) 80L else 130L
    longArrayOf(0L, 80L, 170L, 290L, 440L, 630L, 850L).forEach { offset ->
      offerHandler.postDelayed(
        { evaluateActiveWindow(allowScroll = true) },
        scrollStart + offset
      )
    }
    val fallbackDelay = if (alreadyOpen) 1_050L else 1_250L
    offerHandler.postDelayed(
      {
        evaluateActiveWindow(
          allowNotificationFallback = true,
          allowScroll = true
        )
      },
      fallbackDelay
    )
  }

  private fun sha256(value: String): String {
    return MessageDigest.getInstance("SHA-256")
      .digest(value.toByteArray(Charsets.UTF_8))
      .take(12)
      .joinToString("") { byte -> "%02x".format(byte) }
  }

  private fun normalize(value: String): String {
    return Normalizer.normalize(value, Normalizer.Form.NFD)
      .replace(Regex("\\p{M}+"), "")
      .lowercase()
      .replace(Regex("\\s+"), " ")
      .trim()
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
      text = "Toque em qualquer ponto seguro dentro do cartão da viagem"
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

  private fun isTargetWindowActive(): Boolean {
    val root = rootInActiveWindow ?: return false
    return try {
      root.packageName?.toString() == POP_DRIVER_PACKAGE
    } finally {
      root.recycle()
    }
  }

  companion object {
    const val POP_DRIVER_PACKAGE = "br.com.popmove.driver"
    const val OFFER_SCREEN_MARKER = "pressione e segure para atender"
    private const val MAX_SCROLL_ATTEMPTS = 8
    private const val MIN_SCROLL_INTERVAL_MS = 60L
    private const val AFTER_SCROLL_SCAN_DELAY_MS = 20L
    private const val SCROLL_DURATION_MS = 90L
    private const val VERIFY_DELAY_MS = 350L
    private const val RETRY_DELAY_MS = 60L
    private const val POST_GESTURE_SCAN_DELAY_MS = 30L
    private const val MAX_GESTURE_RETRIES = 1

    @Volatile
    private var currentInstance: PopMoveAccessibilityService? = null

    @Volatile
    var serviceIsEnabled: Boolean = false
      private set

    fun beginOverlayCalibration(): Boolean {
      return currentInstance?.beginCalibrationOverlay() ?: false
    }

    fun isPopDriverWindowActive(): Boolean {
      return currentInstance?.isTargetWindowActive() ?: false
    }

    fun onOfferNotification(alreadyOpen: Boolean) {
      currentInstance?.scheduleOfferChecks(alreadyOpen)
    }
  }
}
