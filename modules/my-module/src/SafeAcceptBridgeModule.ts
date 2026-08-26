import { NativeModule, requireOptionalNativeModule } from 'expo';

export type NativeServiceStatus = {
  serviceEnabled: boolean;
  lastNativeEvent: string | null;
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
  disableNow(): Promise<boolean>;
}

export default requireOptionalNativeModule<SafeAcceptBridgeModule>('SafeAcceptBridge');
