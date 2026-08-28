package com.drivertouch.pop.safeaccept

import android.content.Context
import android.content.Intent
import android.accessibilityservice.AccessibilityServiceInfo
import android.provider.Settings
import android.view.accessibility.AccessibilityManager
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

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
    }

    AsyncFunction("getStatus") {
      val config = SafeAcceptStore.load(context)
      mapOf(
        "serviceEnabled" to isAccessibilityServiceEnabled(),
        "notificationListenerEnabled" to PopMoveNotificationListenerService.listenerIsEnabled,
        "recentOfferNotification" to SafeAcceptStore.recentOfferNotification(context),
        "armed" to config.armed,
        "lastNativeEvent" to SafeAcceptStore.lastEvent(context)
      )
    }

    AsyncFunction("getEvents") {
      SafeAcceptStore.events(context)
    }

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
    }
  }

  private fun isAccessibilityServiceEnabled(): Boolean {
    val manager = context.getSystemService(Context.ACCESSIBILITY_SERVICE) as AccessibilityManager
    return manager.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK).any { service ->
      service.resolveInfo.serviceInfo.packageName == context.packageName &&
        service.resolveInfo.serviceInfo.name == PopMoveAccessibilityService::class.java.name
    }
  }
}
