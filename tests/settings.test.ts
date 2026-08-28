import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS, sanitizeSettings } from "../lib/safe-accept-types";

describe("settings migration and safety", () => {
  it("never restores an armed state without valid calibration", () => {
    const settings = sanitizeSettings({
      ...DEFAULT_SETTINGS,
      mode: "assist",
      isArmed: true,
      calibration: null,
    });

    expect(settings.isArmed).toBe(false);
  });

  it("clamps timing and normalizes the detection marker", () => {
    const settings = sanitizeSettings({
      longPressDurationMs: 50,
      detectionDelayMs: 9000,
      acceptMarker: "  ACEITAR  ",
    });

    expect(settings.longPressDurationMs).toBe(500);
    expect(settings.detectionDelayMs).toBe(3000);
    expect(settings.acceptMarker).toBe("pressione e segure para atender");
  });

  it("migrates old app events with an explicit source", () => {
    const settings = sanitizeSettings({
      events: [
        {
          id: "old",
          at: "2026-08-26T00:00:00.000Z",
          type: "config",
          message: "Evento antigo",
        },
      ],
    });

    expect(settings.events).toEqual([
      expect.objectContaining({ id: "old", source: "app" }),
    ]);
  });

  it("migrates a calibrated legacy test configuration to real execution", () => {
    const settings = sanitizeSettings({
      mode: "test",
      isArmed: false,
      calibration: {
        x: 0.5,
        y: 0.3,
        updatedAt: "2026-08-28T07:21:00.000Z",
      },
    });

    expect(settings.mode).toBe("assist");
    expect(settings.isArmed).toBe(true);
  });
});
