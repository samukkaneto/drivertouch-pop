import { describe, expect, it } from "vitest";

import { clampNormalized, getReadiness, isValidCalibration } from "../lib/calibration";
import { DEFAULT_SETTINGS } from "../lib/safe-accept-types";

describe("calibration helpers", () => {
  it("limits normalized coordinates to the screen range", () => {
    expect(clampNormalized(-0.2)).toBe(0);
    expect(clampNormalized(0.42)).toBe(0.42);
    expect(clampNormalized(1.4)).toBe(1);
  });

  it("requires a valid point before the assistant can be armed", () => {
    expect(isValidCalibration(null)).toBe(false);
    expect(isValidCalibration({ x: 0.5, y: 0.7, updatedAt: "2026-08-26T00:00:00.000Z" })).toBe(true);
    expect(getReadiness(DEFAULT_SETTINGS).label).toBe("Calibração pendente");
  });

  it("reports test mode without claiming a gesture will be sent", () => {
    const readiness = getReadiness({ ...DEFAULT_SETTINGS, calibration: { x: 0.5, y: 0.7, updatedAt: "2026-08-26T00:00:00.000Z" }, isArmed: true, mode: "test" });
    expect(readiness.label).toBe("Modo de teste ativo");
    expect(readiness.detail).toContain("nenhum gesto");
  });
});
