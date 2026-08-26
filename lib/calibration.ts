import type { Calibration, SafeAcceptSettings } from "./safe-accept-types";

export function clampNormalized(value: number) {
  return Math.min(1, Math.max(0, value));
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
      label: "Pronto para teste",
      detail: "O serviço permanece desligado até você armar o modo escolhido.",
      tone: "ready" as const,
    };
  }

  if (settings.mode === "test") {
    return {
      label: "Modo de teste ativo",
      detail: "Eventos podem ser registrados, mas nenhum gesto é enviado.",
      tone: "test" as const,
    };
  }

  return {
    label: "Modo assistido armado",
    detail: "O gesto só pode ocorrer no POP driver após um evento compatível.",
    tone: "active" as const,
  };
}
