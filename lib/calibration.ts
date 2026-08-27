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
      label: "Automação desarmada",
      detail: "Nenhum gesto será enviado até você armar o modo escolhido.",
      tone: "ready" as const,
    };
  }

  if (settings.mode === "test") {
    return {
      label: "Modo de teste ativo",
      detail:
        "A primeira aparição compatível será registrada, sem enviar gesto.",
      tone: "test" as const,
    };
  }

  return {
    label: "Modo assistido armado",
    detail:
      "No máximo um gesto será tentado por aparição compatível da oferta.",
    tone: "active" as const,
  };
}
