export type AssistMode = "off" | "assist";
export type RideMode = "single" | "continuous";
export type EventSource = "app" | "android";

export type Calibration = {
  x: number;
  y: number;
  updatedAt: string;
};

export type EventRecord = {
  id: string;
  at: string;
  type: "config" | "test" | "gesture" | "system" | "notification";
  source: EventSource;
  message: string;
};

export type NativeEventRecord = {
  id: string;
  at: number;
  type: EventRecord["type"];
  message: string;
};

export type SafeAcceptSettings = {
  schemaVersion: 5;
  rideMode: RideMode;
  touchRadius: number;
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
  schemaVersion: 5,
  rideMode: "continuous",
  touchRadius: 0.04,
  appTarget: "popmove",
  mode: "assist",
  isArmed: false,
  longPressDurationMs: 1600,
  detectionDelayMs: 0,
  acceptMarker: "pressione e segure para atender",
  calibration: null,
  events: [],
};

function numberInRange(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number,
) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;
}

function sanitizeCalibration(value: unknown): Calibration | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<Calibration>;
  if (
    typeof candidate.x !== "number" ||
    typeof candidate.y !== "number" ||
    !Number.isFinite(candidate.x) ||
    !Number.isFinite(candidate.y) ||
    candidate.x < 0 ||
    candidate.x > 1 ||
    candidate.y < 0 ||
    candidate.y > 1
  ) {
    return null;
  }

  return {
    x: candidate.x,
    y: candidate.y,
    updatedAt:
      typeof candidate.updatedAt === "string"
        ? candidate.updatedAt
        : new Date(0).toISOString(),
  };
}

function sanitizeEvents(value: unknown): EventRecord[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Partial<EventRecord> =>
      Boolean(item && typeof item === "object"),
    )
    .flatMap((item) => {
      if (
        typeof item.id !== "string" ||
        typeof item.at !== "string" ||
        typeof item.message !== "string" ||
        !["config", "test", "gesture", "system", "notification"].includes(
          item.type ?? "",
        )
      ) {
        return [];
      }

      return [
        {
          id: item.id,
          at: item.at,
          type: item.type as EventRecord["type"],
          source:
            item.source === "android" ? ("android" as const) : ("app" as const),
          message: item.message,
        },
      ];
    })
    .slice(0, 50);
}

export function sanitizeSettings(value: unknown): SafeAcceptSettings {
  if (!value || typeof value !== "object") return DEFAULT_SETTINGS;
  const candidate = value as Partial<SafeAcceptSettings>;
  const mode: AssistMode = candidate.mode === "off" ? "off" : "assist";
  const calibration = sanitizeCalibration(candidate.calibration);
  const usesLegacyTiming =
    Number(candidate.schemaVersion ?? 0) < 4 &&
    candidate.longPressDurationMs === 2000 &&
    candidate.detectionDelayMs === 400;

  return {
    schemaVersion: 5,
    rideMode: candidate.rideMode === "single" ? "single" : "continuous",
    touchRadius: numberInRange(candidate.touchRadius, 0.01, 0.12, 0.04),
    appTarget: "popmove",
    mode,
    isArmed: Boolean(calibration && mode === "assist"),
    longPressDurationMs: numberInRange(
      usesLegacyTiming
        ? DEFAULT_SETTINGS.longPressDurationMs
        : candidate.longPressDurationMs,
      500,
      4000,
      DEFAULT_SETTINGS.longPressDurationMs,
    ),
    detectionDelayMs: numberInRange(
      usesLegacyTiming
        ? DEFAULT_SETTINGS.detectionDelayMs
        : candidate.detectionDelayMs,
      0,
      3000,
      DEFAULT_SETTINGS.detectionDelayMs,
    ),
    acceptMarker: DEFAULT_SETTINGS.acceptMarker,
    calibration,
    events: sanitizeEvents(candidate.events),
  };
}
