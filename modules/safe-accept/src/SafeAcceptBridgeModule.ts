import { NativeModule, requireOptionalNativeModule } from "expo";

export type NativeServiceStatus = {
  serviceEnabled: boolean;
  armed: boolean;
  lastNativeEvent: string | null;
};

export type NativeEventRecord = {
  id: string;
  at: number;
  type: "config" | "test" | "gesture" | "system";
  message: string;
};

declare class SafeAcceptBridgeModule extends NativeModule {
  openAccessibilitySettings(): Promise<boolean>;
  updateConfig(
    armed: boolean,
    mode: string,
    x: number,
    y: number,
    longPressDurationMs: number,
    detectionDelayMs: number,
    acceptMarker: string,
  ): Promise<boolean>;
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
}

export default requireOptionalNativeModule<SafeAcceptBridgeModule>(
  "SafeAcceptBridge",
);
