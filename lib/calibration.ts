import type { Calibration, SafeAcceptSettings } from "./safe-accept-types";

export function clampNormalized(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function parseNormalizedInput(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) return null;
  return parsed;
}

export function touchPositionToNormalized(position: number, size: number) {
  if (!Number.isFinite(position) || !Number.isFinite(size) || size <= 0)
    return 0;
  return clampNormalized(position / size);
}

export function isValidCalibration(value: Calibration | null) {
  return Boolean(
    value &&
    Number.isFinite(value.x) &&
    Number.isFinite(value.y) &&
    value.x >= 0 &&
    value.x <= 1 &&
    value.y >= 0 &&
    value.y <= 1,
  );
}

export function getReadiness(settings: SafeAcceptSettings) {
  if (!isValidCalibration(settings.calibration)) {
    return {
      label: "Calibração pendente",
      detail: "Defina o ponto de toque antes de armar o assistente.",
      tone: "neutral" as const,
    };
  }

  if (!settings.isArmed || settings.mode === "off") {
    return {
      label: "Execução desligada",
      detail: "Nenhuma corrida será aceita enquanto a execução estiver desligada.",
      tone: "ready" as const,
    };
  }

  return {
    label: "Execução automática ativa",
    detail:
      "Uma oferta real dispara um único toque prolongado no cartão da viagem.",
    tone: "active" as const,
  };
}
