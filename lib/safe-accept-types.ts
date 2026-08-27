export type AssistMode = "off" | "test" | "assist";
export type EventSource = "app" | "android";

export type Calibration = {
  x: number;
  y: number;
  updatedAt: string;
};

export type EventRecord = {
  id: string;
  at: string;
  type: "config" | "test" | "gesture" | "system";
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
  schemaVersion: 2;
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
  schemaVersion: 2,
  appTarget: "popmove",
  mode: "test",
  isArmed: false,
  longPressDurationMs: 2000,
  detectionDelayMs: 400,
  acceptMarker: "aceitar",
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
        !["config", "test", "gesture", "system"].includes(item.type ?? "")
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
  const mode: AssistMode = ["off", "test", "assist"].includes(
    candidate.mode ?? "",
  )
    ? (candidate.mode as AssistMode)
    : DEFAULT_SETTINGS.mode;
  const calibration = sanitizeCalibration(candidate.calibration);
  const marker =
    typeof candidate.acceptMarker === "string" &&
    candidate.acceptMarker.trim().length >= 2
      ? candidate.acceptMarker.trim().toLocaleLowerCase("pt-BR").slice(0, 80)
      : DEFAULT_SETTINGS.acceptMarker;

  return {
    schemaVersion: 2,
    appTarget: "popmove",
    mode,
    isArmed: Boolean(candidate.isArmed && calibration && mode !== "off"),
    longPressDurationMs: numberInRange(
      candidate.longPressDurationMs,
      500,
      4000,
      DEFAULT_SETTINGS.longPressDurationMs,
    ),
    detectionDelayMs: numberInRange(
      candidate.detectionDelayMs,
      0,
      3000,
      DEFAULT_SETTINGS.detectionDelayMs,
    ),
    acceptMarker: marker,
    calibration,
    events: sanitizeEvents(candidate.events),
  };
}
