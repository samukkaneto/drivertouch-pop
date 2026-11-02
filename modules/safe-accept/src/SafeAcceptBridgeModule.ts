import { NativeModule, requireOptionalNativeModule } from "expo";

export type NativeServiceStatus = {
  serviceEnabled: boolean;
  diagnosticMode: boolean;
  inputMethod: "control" | "gesture";
  armed: boolean;
  tripState: "unknown" | "ready" | "awaiting_trip" | "busy";
  rideMode: "single" | "continuous";
  serviceConnected: boolean;
  lastNativeEvent: string | null;
  notificationListenerEnabled: boolean;
  recentOfferNotification: boolean;
  effectiveDurationMs: number;
};

export type NativeEventRecord = {
  id: string;
  at: number;
  type: "config" | "test" | "gesture" | "system" | "notification";
  message: string;
};

declare class SafeAcceptBridgeModule extends NativeModule {
  openAccessibilitySettings(): Promise<boolean>;
  openNotificationSettings(): Promise<boolean>;
  updateConfig(
    armed: boolean,
    mode: string,
    x: number,
    y: number,
    longPressDurationMs: number,
    detectionDelayMs: number,
    acceptMarker: string,
  ): Promise<boolean>;
  updateBehavior(rideMode: string, touchRadius: number): Promise<boolean>;
  getStatus(): Promise<NativeServiceStatus>;
  getEvents(): Promise<NativeEventRecord[]>;
  clearEvents(): Promise<boolean>;
  startOverlayCalibration(): Promise<boolean>;
  consumePendingCalibration(): Promise<{
    x: number;
    y: number;
    updatedAt: number;
  } | null>;
  clearDiagnosticReport(): Promise<boolean>;
  setAutomationEnabled(
    enabled: boolean,
    rideMode: "single" | "continuous",
  ): Promise<{ enabled: boolean; reason: string }>;
  getDiagnostics(): Promise<string>;
  recordDiagnosticObservation(
    result: "appeared" | "not_observed",
  ): Promise<boolean>;
}

export default requireOptionalNativeModule<SafeAcceptBridgeModule>(
  "SafeAcceptBridge",
);
