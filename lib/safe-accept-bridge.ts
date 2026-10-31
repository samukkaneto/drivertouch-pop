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
  singlePaused: boolean;
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
    if (!settings.calibration) {
      await bridge.disableNow();
      return false;
    }

    await bridge.updateBehavior(settings.rideMode, settings.touchRadius);
    return bridge.updateConfig(
      settings.isArmed,
      settings.mode,
      settings.calibration.x,
      settings.calibration.y,
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
      singlePaused: false,
      lastNativeEvent: null,
      notificationListenerEnabled: false,
      recentOfferNotification: false,
      effectiveDurationMs: 1600,
    };
  }

  const status = await bridge.getStatus();
  return { ...status, nativeModuleAvailable: true };
}

export async function resumeSingleRide() {
  return bridge ? bridge.resumeSingleRide() : false;
}

export async function beginDiagnostics() {
  return enqueueConfig(async () =>
    bridge ? bridge.beginDiagnostics() : false,
  );
}

export async function endDiagnostics() {
  return enqueueConfig(async () => (bridge ? bridge.endDiagnostics() : false));
}

export async function setNativeInputMethod(method: "control" | "gesture") {
  return enqueueConfig(async () =>
    bridge ? bridge.setInputMethod(method) : false,
  );
}

export async function startNativeSingleControlTest(
  settings: SafeAcceptSettings,
) {
  return enqueueConfig(async () =>
    bridge
      ? bridge.startSingleControlTest(
          settings.calibration?.x ?? -1,
          settings.calibration?.y ?? -1,
        )
      : { started: false, reason: "native_unavailable" },
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

export async function disableNativeService() {
  return enqueueConfig(async () => (bridge ? bridge.disableNow() : false));
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
