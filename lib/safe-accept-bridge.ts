import { Platform } from "react-native";

import SafeAcceptBridgeModule from "@/modules/safe-accept/src/SafeAcceptBridgeModule";
import type {
  NativeEventRecord,
  SafeAcceptSettings,
} from "@/lib/safe-accept-types";

type NativeStatus = {
  serviceEnabled: boolean;
  nativeModuleAvailable: boolean;
  armed: boolean;
  lastNativeEvent: string | null;
};

const bridge = SafeAcceptBridgeModule;

export function isNativeBridgeAvailable() {
  return Platform.OS === "android" && Boolean(bridge);
}

export async function syncSettingsToNative(settings: SafeAcceptSettings) {
  if (!bridge) return false;
  if (!settings.calibration) {
    await bridge.disableNow();
    return false;
  }

  return bridge.updateConfig(
    settings.isArmed,
    settings.mode,
    settings.calibration.x,
    settings.calibration.y,
    settings.longPressDurationMs,
    settings.detectionDelayMs,
    settings.acceptMarker.trim().toLowerCase(),
  );
}

export async function openNativeAccessibilitySettings() {
  if (!bridge) return false;
  return bridge.openAccessibilitySettings();
}

export async function getNativeStatus(): Promise<NativeStatus> {
  if (!bridge) {
    return {
      serviceEnabled: false,
      nativeModuleAvailable: false,
      armed: false,
      lastNativeEvent: null,
    };
  }

  const status = await bridge.getStatus();
  return { ...status, nativeModuleAvailable: true };
}

export async function disableNativeService() {
  if (!bridge) return false;
  return bridge.disableNow();
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
