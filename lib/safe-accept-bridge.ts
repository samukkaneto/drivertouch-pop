import { Platform } from "react-native";
import type { DiagnosticSnapshot } from "@/lib/diagnostics";
import { createNativeConfigQueue } from "@/lib/native-config-queue";

import SafeAcceptBridgeModule from "@/modules/safe-accept/src/SafeAcceptBridgeModule";
import type {
  NativeEventRecord,
  SafeAcceptSettings,
} from "@/lib/safe-accept-types";

type NativeStatus = {
  serviceEnabled: boolean;
  diagnosticMode: boolean;
  inputMethod: "control" | "gesture";
  nativeModuleAvailable: boolean;
  armed: boolean;
  tripState: "unknown" | "ready" | "awaiting_trip" | "busy";
  rideMode: "single" | "continuous";
  serviceConnected: boolean;
  lastNativeEvent: string | null;
  notificationListenerEnabled: boolean;
  recentOfferNotification: boolean;
  effectiveDurationMs: number;
};

const bridge = SafeAcceptBridgeModule;
const enqueueConfig = createNativeConfigQueue();

export function isNativeBridgeAvailable() {
  return Platform.OS === "android" && Boolean(bridge);
}

export async function syncSettingsToNative(settings: SafeAcceptSettings) {
  return enqueueConfig(async () => {
    if (!bridge) return false;
    await bridge.updateBehavior(settings.rideMode, settings.touchRadius);
    return bridge.updateConfig(
      settings.isArmed,
      settings.mode,
      settings.calibration?.x ?? -1,
      settings.calibration?.y ?? -1,
      settings.longPressDurationMs,
      settings.detectionDelayMs,
      settings.acceptMarker.trim().toLowerCase(),
    );
  });
}

export async function openNativeAccessibilitySettings() {
  if (!bridge) return false;
  return bridge.openAccessibilitySettings();
}

export async function openNativeNotificationSettings() {
  if (!bridge) return false;
  return bridge.openNotificationSettings();
}

export async function getNativeStatus(): Promise<NativeStatus> {
  if (!bridge) {
    return {
      serviceEnabled: false,
      diagnosticMode: true,
      inputMethod: "control",
      nativeModuleAvailable: false,
      armed: false,
      tripState: "unknown",
      rideMode: "single",
      serviceConnected: false,
      lastNativeEvent: null,
      notificationListenerEnabled: false,
      recentOfferNotification: false,
      effectiveDurationMs: 1600,
    };
  }

  const status = await bridge.getStatus();
  return { ...status, nativeModuleAvailable: true };
}

export async function clearDiagnosticReport() {
  return bridge ? bridge.clearDiagnosticReport() : false;
}

export async function setNativeAutomationEnabled(
  enabled: boolean,
  rideMode: "single" | "continuous",
) {
  return enqueueConfig(async () =>
    bridge
      ? bridge.setAutomationEnabled(enabled, rideMode)
      : { enabled: false, reason: "native_unavailable" },
  );
}

export async function getDiagnostics(): Promise<DiagnosticSnapshot> {
  if (!bridge)
    throw new Error("O diagnóstico precisa do APK Android instalado.");
  return JSON.parse(await bridge.getDiagnostics()) as DiagnosticSnapshot;
}

export async function recordDiagnosticObservation(
  result: "appeared" | "not_observed",
) {
  return bridge ? bridge.recordDiagnosticObservation(result) : false;
}

export async function getNativeEvents(): Promise<NativeEventRecord[]> {
  if (!bridge) return [];
  return bridge.getEvents();
}

export async function clearNativeEvents() {
  if (!bridge) return false;
  return bridge.clearEvents();
}

export async function startOverlayCalibration() {
  if (!bridge) return false;
  return bridge.startOverlayCalibration();
}

export async function consumePendingCalibration() {
  if (!bridge) return null;
  return bridge.consumePendingCalibration();
}
