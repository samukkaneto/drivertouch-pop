import { describe, expect, it } from "vitest";
import { automationStatus } from "../lib/automation-status";

describe("one activation switch", () => {
  it("shows enabled while waiting for a trip to end, then ready without another activation", () => {
    const state = {
      armed: true,
      serviceConnected: true,
      rideMode: "single" as const,
      tripState: "ready",
    };
    expect(automationStatus(state).title).toContain(
      "Ligado · aguardando oferta",
    );
    expect(automationStatus({ ...state, tripState: "busy" }).title).toContain(
      "Ligado · aguardando ficar livre",
    );
    expect(
      automationStatus({ ...state, tripState: "unknown" }).title,
    ).toContain("Ligado · verificando");
    expect(automationStatus({ ...state, armed: false }).title).toBe(
      "Desligado",
    );
  });
  it("distinguishes lost permission from the user turning the switch off", () => {
    expect(
      automationStatus({
        armed: true,
        serviceConnected: false,
        rideMode: "single",
        tripState: "busy",
      }).title,
    ).toBe("Ligado · aguardando Acessibilidade");
  });
});
