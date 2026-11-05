package com.toalhaver.vermelha.safeaccept

import android.content.Context
import android.content.ComponentName
import android.content.Intent
import android.accessibilityservice.AccessibilityServiceInfo
import android.provider.Settings
import android.view.accessibility.AccessibilityManager
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONObject

class SafeAcceptBridgeModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("O contexto Android não está disponível")

  override fun definition() = ModuleDefinition {
    Name("SafeAcceptBridge")

    AsyncFunction("openAccessibilitySettings") {
      context.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      })
      true
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("openNotificationSettings") {
      context.startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      })
      true
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("updateConfig") {
      armed: Boolean,
      mode: String,
      x: Double,
      y: Double,
      longPressDurationMs: Int,
      detectionDelayMs: Int,
      acceptMarker: String ->
      SafeAcceptStore.save(
        context,
        armed,
        mode,
        x,
        y,
        longPressDurationMs,
        detectionDelayMs,
        acceptMarker
      )
      true
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("updateBehavior") { rideMode: String, radius: Double ->
      SafeAcceptStore.saveBehavior(context, rideMode, radius)
      true
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("getStatus") {
      val config = SafeAcceptStore.load(context)
      mapOf(
        "serviceEnabled" to isAccessibilityServiceEnabled(),
        "serviceConnected" to PopMoveAccessibilityService.serviceIsEnabled,
        "diagnosticMode" to DiagnosticStore.isEnabled(context),
        "inputMethod" to config.inputMethod,
        "notificationListenerEnabled" to isNotificationListenerEnabled(),
        "recentOfferNotification" to SafeAcceptStore.recentOfferNotification(context),
        "armed" to config.armed,
        "tripState" to config.tripState,
        "rideMode" to config.rideMode,
        "effectiveDurationMs" to config.longPressDurationMs,
        "lastNativeEvent" to SafeAcceptStore.lastEvent(context)
      )
    }

    AsyncFunction("getEvents") {
      SafeAcceptStore.events(context)
    }

    AsyncFunction("clearDiagnosticReport") {
      DiagnosticStore.clear(context)
      true
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("getDiagnostics") {
      DiagnosticStore.snapshot(context, diagnosticState())
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("setAutomationEnabled") { enabled: Boolean, rideMode: String ->
      val blocker = when {
        enabled && !isAccessibilityServiceEnabled() -> "accessibility_disabled"
        enabled && !PopMoveAccessibilityService.serviceIsEnabled -> "accessibility_disconnected"
        else -> null
      }
      if (blocker == null) {
        SafeAcceptStore.setAutomationEnabled(context, enabled, rideMode)
        if (!enabled) PopMoveAccessibilityService.stopOfferHandoff()
      }
      mapOf("enabled" to SafeAcceptStore.load(context).armed, "reason" to (blocker ?: "updated"))
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("recordDiagnosticObservation") { result: String ->
      DiagnosticStore.observation(context, result, diagnosticState())
      true
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("clearEvents") {
      SafeAcceptStore.clearEvents(context)
      true
    }

    AsyncFunction("startOverlayCalibration") {
      PopMoveAccessibilityService.beginOverlayCalibration()
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("consumePendingCalibration") {
      SafeAcceptStore.consumePendingCalibration(context)
    }

    AsyncFunction("disableNow") {
      SafeAcceptStore.disable(context)
      true
    }.runOnQueue(Queues.MAIN)
  }

  private fun isAccessibilityServiceEnabled(): Boolean {
    val manager = context.getSystemService(Context.ACCESSIBILITY_SERVICE) as AccessibilityManager
    return manager.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK).any { service ->
      service.resolveInfo.serviceInfo.packageName == context.packageName &&
        service.resolveInfo.serviceInfo.name == PopMoveAccessibilityService::class.java.name
    }
  }

  private fun diagnosticState(): JSONObject = JSONObject()
    .put("diagnosticMode", DiagnosticStore.isEnabled(context))
    .put("automationArmed", SafeAcceptStore.load(context).armed)
    .put("inputMethod", SafeAcceptStore.load(context).inputMethod)
    .put("rideMode", SafeAcceptStore.load(context).rideMode)
    .put("tripState", SafeAcceptStore.load(context).tripState)
    .put("accessibilityGranted", isAccessibilityServiceEnabled())
    .put("accessibilityConnected", PopMoveAccessibilityService.serviceIsEnabled)
    .put("notificationGranted", isNotificationListenerEnabled())
    .put("notificationConnected", PopMoveNotificationListenerService.listenerIsEnabled)

  private fun isNotificationListenerEnabled(): Boolean {
    val enabledServices = Settings.Secure.getString(
      context.contentResolver,
      "enabled_notification_listeners"
    ) ?: return false

    return enabledServices
      .split(':')
      .mapNotNull(ComponentName::unflattenFromString)
      .any { component ->
        component.packageName == context.packageName &&
          component.className == PopMoveNotificationListenerService::class.java.name
      }
  }
}
