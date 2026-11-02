import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS, sanitizeSettings } from "../lib/safe-accept-types";

describe("settings migration and safety", () => {
  it("does not start legacy automation merely because it was previously configured", () => {
    const settings = sanitizeSettings({
      ...DEFAULT_SETTINGS,
      schemaVersion: 5,
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

  it("keeps a legacy calibrated test paused until the single native switch is used", () => {
    const settings = sanitizeSettings({
      mode: "test",
      isArmed: false,
      calibration: {
        x: 0.5,
        y: 0.3,
        updatedAt: "2026-08-28T07:21:00.000Z",
      },
    });

    expect(settings.mode).toBe("off");
    expect(settings.isArmed).toBe(false);
  });

  it("migrates the slow legacy timing to the immediate adaptive profile", () => {
    const settings = sanitizeSettings({
      schemaVersion: 3,
      longPressDurationMs: 2000,
      detectionDelayMs: 400,
    });

    expect(settings.schemaVersion).toBe(6);
    expect(settings.longPressDurationMs).toBe(1600);
    expect(settings.detectionDelayMs).toBe(0);
  });

  it("keeps the observed PopDriver card phrase fixed", () => {
    const settings = sanitizeSettings({ acceptMarker: "qualquer texto" });

    expect(settings.acceptMarker).toBe("pressione e segure para atender");
  });
});

describe("ride mode and touch area", () => {
  it("defaults the clarified ride mode to one at a time on upgrade", () => {
    const settings = sanitizeSettings({ schemaVersion: 4 });
    expect(settings.rideMode).toBe("single");
    expect(settings.touchRadius).toBe(0.04);
  });
  it("keeps the selected mode and constrains malformed radii", () => {
    expect(
      sanitizeSettings({ rideMode: "single", touchRadius: 0.08 }).rideMode,
    ).toBe("single");
    expect(
      sanitizeSettings({ schemaVersion: 6, rideMode: "continuous" }).rideMode,
    ).toBe("continuous");
    expect(sanitizeSettings({ touchRadius: Infinity }).touchRadius).toBe(0.04);
    expect(sanitizeSettings({ touchRadius: -1 }).touchRadius).toBe(0.01);
    expect(sanitizeSettings({ touchRadius: 100 }).touchRadius).toBe(0.12);
  });
});
