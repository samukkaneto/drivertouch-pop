import { NativeModule, requireOptionalNativeModule } from "expo";

export type NativeServiceStatus = {
  serviceEnabled: boolean;
  diagnosticMode: boolean;
  armed: boolean;
  singlePaused: boolean;
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
  resumeSingleRide(): Promise<boolean>;
  getStatus(): Promise<NativeServiceStatus>;
  getEvents(): Promise<NativeEventRecord[]>;
  clearEvents(): Promise<boolean>;
  startOverlayCalibration(): Promise<boolean>;
  consumePendingCalibration(): Promise<{
    x: number;
    y: number;
    updatedAt: number;
  } | null>;
  disableNow(): Promise<boolean>;
  beginDiagnostics(): Promise<boolean>;
  endDiagnostics(): Promise<boolean>;
  getDiagnostics(): Promise<string>;
  recordDiagnosticObservation(
    result: "appeared" | "not_observed",
  ): Promise<boolean>;
}

export default requireOptionalNativeModule<SafeAcceptBridgeModule>(
  "SafeAcceptBridge",
);
