package com.toalhaver.vermelha.safeaccept

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.app.ActivityOptions
import android.app.KeyguardManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Path
import android.graphics.PixelFormat
import android.graphics.Rect
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.os.SystemClock
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
  private var lastControlProbeAt = -CONTROL_PROBE_INTERVAL_MS
  private val offerHandler = Handler(Looper.getMainLooper())
  private var foregroundHandoff: ForegroundHandoff? = null
  private val foregroundCheck = Runnable { advanceOfferHandoff() }
  private val monitorHandler = Handler(Looper.getMainLooper())
  private val monitor = object : Runnable {
    override fun run() {
      if (currentInstance !== this@PopMoveAccessibilityService) return
      if (foregroundHandoff == null && SafeAcceptStore.load(this@PopMoveAccessibilityService).armed) {
        evaluateActiveWindow(allowScroll = true)
      }
      monitorHandler.postDelayed(this, 750L)
    }
  }
  private var overlayView: View? = null
  private var gestureInFlight = false
  private var offerResolutionInProgress = false
  private var scrollGestureInFlight = false
  private var scrollOfferFingerprint: String? = null
  private var exhaustedScrollFingerprint: String? = null
  private var scrollAttempts = 0
  private var lastScrollAt = 0L

  private data class ForegroundHandoff(
    val identity: String,
    val openIntent: PendingIntent?,
    var state: OfferForegroundPolicy.State,
    var route: String? = null
  )

  private data class ScreenSnapshot(
    val markerVisible: Boolean,
    val anyOfferVisible: Boolean,
    val idleVisible: Boolean,
    val markerCenterX: Float?,
    val markerCenterY: Float?,
    val fingerprint: String,
    val controlFingerprint: String,
    val safeBounds: Rect,
    val markerBounds: Rect?
  )

  private data class GestureAttempt(
    val identity: String,
    val screenFingerprint: String,
    val x: Float,
    val y: Float,
    val durationMs: Long,
    val retryCount: Int,
    val touchBounds: Rect? = null
  )

  override fun onServiceConnected() {
    serviceIsEnabled = true
    currentInstance = this
    RideSessionStore.invalidateAvailability(this)
    monitorHandler.post(monitor)
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

    if (foregroundHandoff == null) evaluateActiveWindow(allowScroll = true)
    else advanceOfferHandoff()
  }

  override fun onInterrupt() {
    finishOfferHandoff("interrupted", "Verificação da oferta interrompida pelo Android")
    removeOverlay()
    SafeAcceptStore.record(this, "system", "Serviço interrompido pelo Android")
  }

  override fun onDestroy() {
    serviceIsEnabled = false
    finishOfferHandoff("interrupted", "Acessibilidade desconectada durante a abertura")
    offerHandler.removeCallbacksAndMessages(null)
    monitorHandler.removeCallbacksAndMessages(null)
    removeOverlay()
    if (currentInstance === this) currentInstance = null
    super.onDestroy()
  }

  private fun evaluateActiveWindow(allowScroll: Boolean = false) {
    val config = SafeAcceptStore.load(this)
    if (!config.armed || config.mode == "off") return
    if (offerResolutionInProgress || overlayView != null) return

    val root = rootInActiveWindow ?: return
    if (root.packageName?.toString() != POP_DRIVER_PACKAGE) {
      root.recycle()
      return
    }

    val snapshot = buildScreenSnapshot(root)
    observeOfferScreen(snapshot)
    if (!RideSessionPolicy.mayAccept(config.rideMode, RideSessionStore.load(this))) {
      root.recycle()
      return
    }
    val notificationFingerprint = SafeAcceptStore.currentOfferNotificationFingerprint(this)
    if (!snapshot.markerVisible) {
      root.recycle()
      if (allowScroll && RideSessionPolicy.mayScroll(config.rideMode, notificationFingerprint != null, snapshot.markerVisible)) {
        attemptOfferScroll(notificationFingerprint ?: return, snapshot.safeBounds)
      }
      return
    }
    root.recycle()

    if (gestureInFlight || scrollGestureInFlight) {
      return
    }

    if (config.inputMethod == "control") {
      val now = SystemClock.elapsedRealtime()
      if (now - lastControlProbeAt < CONTROL_PROBE_INTERVAL_MS) return
      val identity = "control:${snapshot.controlFingerprint}"
      if (SafeAcceptStore.wasOfferHandled(this, identity)) return
      lastControlProbeAt = now
      dispatchControlLongClick(identity)
      return
    }

    val now = System.currentTimeMillis()
    val minimumInterval = config.longPressDurationMs + config.detectionDelayMs + 200L
    if (now - lastGestureAt < minimumInterval) return
    val identity = notificationFingerprint?.let { "notification:$it" } ?: "screen:${snapshot.fingerprint}"
    if (!SafeAcceptStore.claimOfferIdentity(this, identity)) return

    val x = snapshot.markerCenterX ?: return
    val y = snapshot.markerCenterY ?: return
    if (!containsPoint(snapshot.safeBounds, x, y)) {
      if (allowScroll && RideSessionPolicy.mayScroll(config.rideMode, notificationFingerprint != null, snapshot.markerVisible)) {
        attemptOfferScroll(notificationFingerprint ?: return, snapshot.safeBounds)
      }
      return
    }
    lastGestureAt = now
    SafeAcceptStore.record(
      this,
      "gesture",
      "Frase real visível; toque longo confinado ao cartão da nova viagem"
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
    if (overlayView != null || !SafeAcceptStore.canDispatch(this, attempt.identity, attempt.retryCount > 0)) {
      offerResolutionInProgress = false
      return
    }
    val currentConfig = SafeAcceptStore.load(this)
    if (currentConfig.inputMethod == "control") {
      dispatchControlLongClick(attempt.identity)
      return
    }
    val safeAttempt = resolveVisibleMarkerAttempt(attempt)
    if (safeAttempt == null) {
      offerResolutionInProgress = false
      SafeAcceptStore.releaseOfferIdentity(this, attempt.identity)
      SafeAcceptStore.record(
        this,
        "gesture",
        "Pressão impedida: a frase da nova viagem não está visível na área segura"
      )
      return
    }
    offerResolutionInProgress = true
    gestureInFlight = true
    lastGestureAt = System.currentTimeMillis()
    val bounds = safeAttempt.touchBounds ?: run {
      gestureInFlight = false
      offerResolutionInProgress = false
      return
    }
    val samples = TouchRegion.stablePath(
      bounds.left.toFloat(), bounds.top.toFloat(), bounds.right.toFloat(), bounds.bottom.toFloat()
    ) ?: run {
      gestureInFlight = false
      offerResolutionInProgress = false
      return
    }
    val path = Path().apply {
      moveTo(samples[0].x, samples[0].y)
      samples.drop(1).forEach { point -> lineTo(point.x, point.y) }
    }
    val stroke = GestureDescription.StrokeDescription(
      path,
      currentConfig.detectionDelayMs,
      attempt.durationMs
    )
    val gesture = GestureDescription.Builder().addStroke(stroke).build()

    val accepted = dispatchGesture(
      gesture,
      object : GestureResultCallback() {
        override fun onCompleted(gestureDescription: GestureDescription?) {
          gestureInFlight = false
          SafeAcceptStore.recordAcceptanceAttempt(this@PopMoveAccessibilityService, safeAttempt.identity)
          SafeAcceptStore.record(
            this@PopMoveAccessibilityService,
            "gesture",
            "Toque prolongado de ${safeAttempt.durationMs} ms concluído no cartão da viagem"
          )
          offerHandler.postDelayed({ verifyGestureResult(config, safeAttempt) }, VERIFY_DELAY_MS)
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

    DiagnosticStore.command(this, "press", accepted)
    if (accepted) SafeAcceptStore.recordAcceptanceAttempt(this, attempt.identity)

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
      buildScreenSnapshot(root)
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
    if (attempt.retryCount >= MAX_GESTURE_RETRIES) {
      offerResolutionInProgress = false
      SafeAcceptStore.record(
        this,
        "gesture",
        "Cartão permaneceu visível; duração protegida mantida em ${learning.durationMs} ms"
      )
      return
    }

    SafeAcceptStore.record(
      this,
      "gesture",
      "Cartão ainda visível; repetindo uma vez sem aumentar os ${learning.durationMs} ms aprendidos"
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

  private fun dispatchControlLongClick(identity: String) {
    val root = rootInActiveWindow ?: return
    if (root.packageName?.toString() != POP_DRIVER_PACKAGE) { root.recycle(); return }
    val currentScreen = buildScreenSnapshot(root)
    observeOfferScreen(currentScreen)
    if (!currentScreen.markerVisible || identity != "control:${currentScreen.controlFingerprint}" ||
        !SafeAcceptStore.canDispatch(this, identity, false)) { root.recycle(); return }
    val scan = try { ControlTargetScanner.inspect(root, calculateSafeBounds(root)) } finally { root.recycle() }
    DiagnosticStore.card(this, scan.metadata)
    val target = scan.target
    if (target == null) {
      SafeAcceptStore.record(this, "system", "Comando do cartão indisponível: ${scan.metadata.optString("reason")}. Nenhum toque substituto enviado.")
      return
    }
    offerResolutionInProgress = true
    try {
      val config = SafeAcceptStore.load(this)
      if (config.inputMethod != "control" || !SafeAcceptStore.canDispatch(this, identity, false) ||
          !isTargetWindowActive() || !target.refresh() || !target.isEnabled || !target.isVisibleToUser ||
          !target.isLongClickable || target.actionList.none { it.id == AccessibilityNodeInfo.ACTION_LONG_CLICK }) {
        DiagnosticStore.card(this, scan.metadata.put("reason", "changed_before_action").put("available", false))
        return
      }
      // The card can appear before its button is ready. Claim it only at the actual command.
      if (!SafeAcceptStore.claimOfferIdentity(this, identity)) return
      // Only invoke the action advertised by the visible card. No coordinate gesture or retry fallback.
      val result = runCatching { target.performAction(AccessibilityNodeInfo.ACTION_LONG_CLICK) }.getOrDefault(false)
      DiagnosticStore.command(this, "longClick", result)
      DiagnosticStore.card(this, scan.metadata.put("at", System.currentTimeMillis()).put("performed", result))
      SafeAcceptStore.recordAcceptanceAttempt(this, identity)
      if (foregroundHandoff != null) {
        finishOfferHandoff(if (result) "command_sent" else "command_refused", null)
      } else {
        SafeAcceptStore.currentOfferNotificationFingerprint(this)?.let { completeOfferSession("notification:$it") }
      }
      SafeAcceptStore.record(this, "system", if (result)
        "O controle respondeu ao pressionamento longo; confirme no PopMove se a corrida foi aceita."
        else "O controle recusou o pressionamento longo; nenhum toque substituto enviado.")
    } finally {
      target.recycle()
      offerResolutionInProgress = false
    }
  }

  private fun attemptOfferScroll(fingerprint: String, safeBounds: Rect) {
    if (SafeAcceptStore.load(this).rideMode != "continuous") return
    if (scrollOfferFingerprint != fingerprint) {
      scrollOfferFingerprint = fingerprint
      exhaustedScrollFingerprint = null
      scrollAttempts = 0
      lastScrollAt = 0L
    }
    if (gestureInFlight || scrollGestureInFlight) return
    if (scrollAttempts >= MAX_SCROLL_ATTEMPTS) {
      if (exhaustedScrollFingerprint != fingerprint) {
        exhaustedScrollFingerprint = fingerprint
        SafeAcceptStore.record(
          this,
          "gesture",
          "Busca vertical encerrada sem a frase real; nenhuma pressão foi executada"
        )
      }
      return
    }

    val now = System.currentTimeMillis()
    if (now - lastScrollAt < MIN_SCROLL_INTERVAL_MS) return
    lastScrollAt = now
    scrollAttempts += 1
    dispatchVerticalScrollGesture(safeBounds)
  }

  private fun dispatchVerticalScrollGesture(safeBounds: Rect) {
    val config = SafeAcceptStore.load(this)
    if (overlayView != null || !config.armed || config.rideMode != "continuous" || !isTargetWindowActive()) return
    if (!SafeAcceptStore.recentOfferNotification(this)) return
    val root = rootInActiveWindow ?: return
    if (root.packageName?.toString() != POP_DRIVER_PACKAGE) { root.recycle(); return }
    val fresh = try { buildScreenSnapshot(root) } finally { root.recycle() }
    if (fresh.markerVisible) return
    val area = fresh.safeBounds
    if (area.width() < dp(MIN_SAFE_WIDTH_DP) || area.height() < dp(MIN_SAFE_HEIGHT_DP)) return
    val curve = ScrollTrajectory.create(area.left.toFloat(), area.top.toFloat(), area.right.toFloat(), area.bottom.toFloat()) ?: return
    val path = Path().apply {
      moveTo(curve.start.x, curve.start.y)
      cubicTo(curve.control1.x, curve.control1.y, curve.control2.x, curve.control2.y, curve.end.x, curve.end.y)
    }
    val gesture = GestureDescription.Builder()
      .addStroke(GestureDescription.StrokeDescription(path, 0L, curve.durationMs))
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
              evaluateActiveWindow(allowScroll = true)
            },
            AFTER_SCROLL_SCAN_DELAY_MS
          )
        }

        override fun onCancelled(gestureDescription: GestureDescription?) {
          scrollGestureInFlight = false
          offerHandler.postDelayed(
            {
              evaluateActiveWindow(allowScroll = true)
            },
            AFTER_SCROLL_SCAN_DELAY_MS
          )
        }
      },
      null
    )
    DiagnosticStore.command(this, "scroll", accepted)
    if (!accepted) {
      scrollGestureInFlight = false
      offerHandler.postDelayed(
        { evaluateActiveWindow(allowScroll = true) },
        AFTER_SCROLL_SCAN_DELAY_MS
      )
    }
  }

  private fun completeOfferSession(identity: String) {
    val prefix = "notification:"
    if (!identity.startsWith(prefix)) return
    val fingerprint = identity.removePrefix(prefix)
    SafeAcceptStore.completeOfferNotification(this, fingerprint)
    if (scrollOfferFingerprint == fingerprint) {
      scrollOfferFingerprint = null
      exhaustedScrollFingerprint = null
      scrollAttempts = 0
      lastScrollAt = 0L
    }
  }

  private fun buildScreenSnapshot(root: AccessibilityNodeInfo): ScreenSnapshot {
    val allTexts = mutableListOf<String>()
    val statusTexts = mutableListOf<String>()
    val visibleTexts = mutableListOf<String>()
    val exactMarkerBounds = mutableListOf<Rect>()
    val markerWordBounds = mutableListOf<Rect>()
    val marker = normalize(OFFER_SCREEN_MARKER)
    val safeBounds = calculateSafeBounds(root)

    var visited = 0
    var truncated = false
    fun visit(node: AccessibilityNodeInfo, depth: Int = 0) {
      if (visited >= 600 || depth >= 40) { truncated = true; return }
      visited++
      val nodeTexts = listOf(node.text, node.contentDescription)
        .filterNotNull()
        .map { normalize(it.toString()) }
        .filter(String::isNotBlank)

      for (text in nodeTexts) {
        allTexts.add(text)
        if (!node.isVisibleToUser) continue

        val statusBounds = Rect().also(node::getBoundsInScreen)
        val metrics = resources.displayMetrics
        if (!statusBounds.isEmpty && statusBounds.intersect(Rect(0, 0, metrics.widthPixels, metrics.heightPixels))) statusTexts.add(text)

        val bounds = clippedNodeBounds(node, safeBounds) ?: continue
        visibleTexts.add(text)
        if (text.contains(marker)) exactMarkerBounds.add(bounds)
        if (OFFER_MARKER_WORDS.any { word -> text.contains(word) }) markerWordBounds.add(bounds)
      }

      if (node.childCount > 600) truncated = true
      for (index in 0 until minOf(node.childCount, 600)) {
        val child = node.getChild(index) ?: continue
        try {
          visit(child, depth + 1)
        } finally {
          child.recycle()
        }
      }
    }

    visit(root)
    val visibleJoinedText = visibleTexts.joinToString(" ")
    val phraseIsVisible = visibleJoinedText.contains(marker)
    val bounds = when {
      !phraseIsVisible -> null
      exactMarkerBounds.isNotEmpty() -> exactMarkerBounds.minByOrNull { it.width() * it.height() }
      else -> unionBounds(markerWordBounds)
    }
    val markerVisible = !truncated && phraseIsVisible && bounds != null && !bounds.isEmpty
    val stableText = allTexts.distinct().sorted().joinToString("|")
    return ScreenSnapshot(
      markerVisible = markerVisible,
      anyOfferVisible = !truncated && statusTexts.joinToString(" ").contains(marker),
      idleVisible = !truncated && statusTexts.joinToString(" ").contains(RideSessionPolicy.IDLE_MARKER),
      markerCenterX = bounds?.exactCenterX(),
      markerCenterY = bounds?.exactCenterY(),
      fingerprint = sha256(stableText),
      controlFingerprint = sha256(ControlActionPolicy.stableOfferText(allTexts)),
      safeBounds = Rect(safeBounds),
      markerBounds = bounds?.let { Rect(it) }
    )
  }

  private fun calculateSafeBounds(root: AccessibilityNodeInfo): Rect {
    val metrics = resources.displayMetrics
    val screenBounds = Rect(
      0,
      (metrics.heightPixels * SAFE_TOP_RATIO).toInt(),
      metrics.widthPixels,
      (metrics.heightPixels * SAFE_BOTTOM_RATIO).toInt()
    )
    val rootBounds = Rect()
    root.getBoundsInScreen(rootBounds)
    if (rootBounds.isEmpty || !rootBounds.intersect(screenBounds)) return screenBounds
    return rootBounds
  }

  private fun clippedNodeBounds(node: AccessibilityNodeInfo, safeBounds: Rect): Rect? {
    val bounds = Rect()
    node.getBoundsInScreen(bounds)
    if (bounds.isEmpty || !bounds.intersect(safeBounds) || bounds.isEmpty) return null
    return bounds
  }

  private fun unionBounds(bounds: List<Rect>): Rect? {
    if (bounds.isEmpty()) return null
    return Rect(bounds.first()).also { result ->
      bounds.drop(1).forEach { next -> result.union(next) }
    }
  }

  private fun containsPoint(bounds: Rect, x: Float, y: Float): Boolean {
    return x >= bounds.left && x < bounds.right && y >= bounds.top && y < bounds.bottom
  }

  private fun resolveVisibleMarkerAttempt(attempt: GestureAttempt): GestureAttempt? {
    val root = rootInActiveWindow ?: return null
    if (root.packageName?.toString() != POP_DRIVER_PACKAGE) {
      root.recycle()
      return null
    }
    val snapshot = try {
      buildScreenSnapshot(root)
    } finally {
      root.recycle()
    }
    val x = snapshot.markerCenterX ?: return null
    val y = snapshot.markerCenterY ?: return null
    if (!snapshot.markerVisible || !containsPoint(snapshot.safeBounds, x, y)) return null
    return attempt.copy(
      screenFingerprint = snapshot.fingerprint,
      x = x,
      y = y,
      touchBounds = snapshot.markerBounds
    )
  }

  private fun observeOfferScreen(snapshot: ScreenSnapshot) {
    val handoff = foregroundHandoff
    val preserveReady = OfferForegroundPolicy.preserveReadyDuringLoad(handoff?.state, SystemClock.elapsedRealtime())
    val offerVisible = snapshot.markerVisible || snapshot.anyOfferVisible
    if (handoff != null && offerVisible && !handoff.state.recognizedScreen) {
      handoff.state = handoff.state.copy(recognizedScreen = true)
    }
    RideSessionStore.observe(this, snapshot.idleVisible, offerVisible, preserveReady)
  }

  private fun deviceReadyForOffer(): Boolean =
    getSystemService(PowerManager::class.java)?.isInteractive == true &&
      getSystemService(KeyguardManager::class.java)?.isKeyguardLocked == false

  private fun offerHandoffBlocker(): Pair<String, String>? {
    val config = SafeAcceptStore.load(this)
    return when {
      !config.armed -> "disabled" to "Nova viagem detectada; a chave está desligada"
      !deviceReadyForOffer() -> "locked" to "Abertura da oferta aguardou tela ligada e desbloqueada"
      overlayView != null -> "calibration" to "Abertura da oferta bloqueada durante a calibração"
      !RideSessionPolicy.mayAccept(config.rideMode, RideSessionStore.load(this)) ->
        "not_available" to "Uma por vez: oferta recebida sem confirmação de disponibilidade"
      else -> null
    }
  }

  private fun beginOfferHandoff(identity: String, postedAt: Long, openIntent: PendingIntent?) {
    if (currentInstance !== this || !OfferForegroundPolicy.isFresh(postedAt, System.currentTimeMillis())) return
    // Coalesce notices while one window transition is already underway.
    if (foregroundHandoff != null) return
    val blocker = offerHandoffBlocker()
    if (blocker != null) {
      DiagnosticStore.foreground(this, blocker.first)
      SafeAcceptStore.record(this, "notification", blocker.second)
      return
    }
    if (!SafeAcceptStore.markOfferNotification(this, identity)) return
    foregroundHandoff = ForegroundHandoff(identity, openIntent, OfferForegroundPolicy.State(SystemClock.elapsedRealtime()))
    advanceOfferHandoff()
  }

  private fun advanceOfferHandoff() {
    val handoff = foregroundHandoff ?: return
    offerHandler.removeCallbacks(foregroundCheck)
    offerHandoffBlocker()?.let { (stage, message) ->
      finishOfferHandoff(stage, message)
      return
    }

    val now = SystemClock.elapsedRealtime()
    val next = OfferForegroundPolicy.next(handoff.state, now, isTargetWindowActive(), handoff.openIntent != null)
    when (next) {
      OfferForegroundPolicy.Next.EXPIRED -> {
        if (handoff.state.windowSeenAt == null) {
          finishOfferHandoff("window_timeout", "A abertura foi solicitada, mas a janela do PopMove não foi confirmada")
        } else {
          finishOfferHandoff("card_timeout", "Janela do PopMove confirmada; nenhum comando do cartão enviado durante a verificação")
        }
      }
      OfferForegroundPolicy.Next.READ_CARD -> {
        if (handoff.state.windowSeenAt == null) {
          handoff.state = handoff.state.copy(windowSeenAt = now)
          reportForeground(handoff, "window_confirmed")
          SafeAcceptStore.record(this, "notification", "Janela do PopMove confirmada; verificando o cartão")
        }
        evaluateActiveWindow(allowScroll = true)
      }
      OfferForegroundPolicy.Next.OPEN_NOTIFICATION, OfferForegroundPolicy.Next.OPEN_LAUNCHER -> {
        val notificationRoute = next == OfferForegroundPolicy.Next.OPEN_NOTIFICATION
        handoff.route = if (notificationRoute) "notification" else "launcher"
        handoff.state = handoff.state.copy(requests = handoff.state.requests + 1, lastRequestAt = now)
        val dispatched = requestPopMoveWindow(if (notificationRoute) handoff.openIntent else null)
        handoff.state = handoff.state.copy(requestDispatched = dispatched)
        DiagnosticStore.command(this, "open", dispatched)
        reportForeground(handoff, if (dispatched) "open_requested" else "open_failed")
        SafeAcceptStore.record(this, "notification", if (dispatched)
          "Abertura do PopMove solicitada; aguardando confirmação da janela"
        else "Não foi possível enviar a solicitação de abertura do PopMove")
      }
      OfferForegroundPolicy.Next.WAIT -> Unit
    }
    if (foregroundHandoff === handoff) offerHandler.postDelayed(foregroundCheck, FOREGROUND_CHECK_INTERVAL_MS)
  }

  @Suppress("DEPRECATION")
  private fun requestPopMoveWindow(openIntent: PendingIntent?): Boolean = runCatching {
    if (openIntent != null) {
      // On Android 14+, opt in for the trusted PopMove activity PendingIntent.
      if (Build.VERSION.SDK_INT >= 34) {
        val options = ActivityOptions.makeBasic()
          .setPendingIntentBackgroundActivityStartMode(ActivityOptions.MODE_BACKGROUND_ACTIVITY_START_ALLOWED)
        openIntent.send(this, 0, null, null, null, null, options.toBundle())
      } else {
        openIntent.send()
      }
    } else {
      val intent = packageManager.getLaunchIntentForPackage(POP_DRIVER_PACKAGE) ?: return@runCatching false
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      startActivity(intent)
    }
    true
  }.getOrDefault(false)

  private fun reportForeground(handoff: ForegroundHandoff, stage: String) {
    DiagnosticStore.foreground(this, stage, handoff.state.requests, handoff.state.windowSeenAt != null,
      handoff.route, SystemClock.elapsedRealtime() - handoff.state.startedAt)
  }

  private fun finishOfferHandoff(stage: String, message: String?) {
    val handoff = foregroundHandoff ?: return
    foregroundHandoff = null
    offerHandler.removeCallbacks(foregroundCheck)
    completeOfferSession("notification:${handoff.identity}")
    reportForeground(handoff, stage)
    if (message != null) SafeAcceptStore.record(this, "notification", message)
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
        text = "Abra a oferta até mostrar PRESSIONE E SEGURE PARA ATENDER e toque em MARCAR AGORA."
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
      text = "Toque sobre a frase PRESSIONE E SEGURE PARA ATENDER"
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
    private val OFFER_MARKER_WORDS = listOf("pressione", "segure", "atender")
    private const val MAX_SCROLL_ATTEMPTS = 3
    private const val MIN_SCROLL_INTERVAL_MS = 140L
    private const val AFTER_SCROLL_SCAN_DELAY_MS = 45L
    private const val SAFE_TOP_RATIO = 0.04f
    private const val SAFE_BOTTOM_RATIO = 0.88f
    private const val MIN_SAFE_WIDTH_DP = 120
    private const val MIN_SAFE_HEIGHT_DP = 240
    private const val VERIFY_DELAY_MS = 350L
    private const val RETRY_DELAY_MS = 60L
    private const val POST_GESTURE_SCAN_DELAY_MS = 30L
    private const val MAX_GESTURE_RETRIES = 1
    private const val FOREGROUND_CHECK_INTERVAL_MS = 180L
    private const val CONTROL_PROBE_INTERVAL_MS = 180L

    @Volatile
    private var currentInstance: PopMoveAccessibilityService? = null

    @Volatile
    var serviceIsEnabled: Boolean = false
      private set

    fun isResolvingOffer(): Boolean {
      val service = currentInstance ?: return false
      return service.offerResolutionInProgress || service.gestureInFlight || service.scrollGestureInFlight
    }

    fun beginOverlayCalibration(): Boolean {
      return currentInstance?.beginCalibrationOverlay() ?: false
    }

    fun prepareDiagnostics(): Boolean {
      if (isResolvingOffer()) return false
      currentInstance?.let {
        it.offerHandler.removeCallbacksAndMessages(null)
        it.removeOverlay()
      }
      return true
    }

    fun isPopDriverWindowActive(): Boolean {
      return currentInstance?.isTargetWindowActive() ?: false
    }

    fun onOfferNotification(context: Context, identity: String, postedAt: Long, openIntent: PendingIntent?) {
      val service = currentInstance
      if (service == null) {
        DiagnosticStore.foreground(context, "accessibility_disconnected")
        return
      }
      service.offerHandler.post { service.beginOfferHandoff(identity, postedAt, openIntent) }
    }

    fun stopOfferHandoff() {
      currentInstance?.finishOfferHandoff("disabled", "Verificação da oferta encerrada pela chave do painel")
    }
  }
}
