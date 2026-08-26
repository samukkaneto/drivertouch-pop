import { Platform } from "react-native";

import SafeAcceptBridgeModule from "@/modules/my-module/src/SafeAcceptBridgeModule";
import type { SafeAcceptSettings } from "@/lib/safe-accept-types";

type NativeStatus = {
  serviceEnabled: boolean;
  nativeModuleAvailable: boolean;
  lastNativeEvent: string | null;
};

const bridge = SafeAcceptBridgeModule;

export function isNativeBridgeAvailable() {
  return Platform.OS === "android" && Boolean(bridge);
}

export async function syncSettingsToNative(settings: SafeAcceptSettings) {
  if (!bridge || !settings.calibration) return false;

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
    return { serviceEnabled: false, nativeModuleAvailable: false, lastNativeEvent: null };
  }

  const status = await bridge.getStatus();
  return { ...status, nativeModuleAvailable: true };
}

export async function disableNativeService() {
  if (!bridge) return false;
  return bridge.disableNow();
}
