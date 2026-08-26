export type AssistMode = "off" | "test" | "assist";

export type Calibration = {
  x: number;
  y: number;
  updatedAt: string;
};

export type EventRecord = {
  id: string;
  at: string;
  type: "config" | "test" | "gesture" | "system";
  message: string;
};

export type SafeAcceptSettings = {
  appTarget: "popmove";
  mode: AssistMode;
  isArmed: boolean;
  longPressDurationMs: number;
  detectionDelayMs: number;
  acceptMarker: string;
  calibration: Calibration | null;
  events: EventRecord[];
};

export const DEFAULT_SETTINGS: SafeAcceptSettings = {
  appTarget: "popmove",
  mode: "test",
  isArmed: false,
  longPressDurationMs: 2000,
  detectionDelayMs: 400,
  acceptMarker: "aceitar",
  calibration: null,
  events: [],
};
