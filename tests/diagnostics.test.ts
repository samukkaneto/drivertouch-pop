import { describe, expect, it } from "vitest";
import {
  diagnosticConclusion,
  formatDiagnosticReport,
} from "../lib/diagnostics";
import type {
  DiagnosticSnapshot,
  NotificationSample,
} from "../lib/diagnostics";

const snapshot: DiagnosticSnapshot = {
  schema: 1,
  appVersion: "0.12.0",
  popMoveVersion: "indisponível",
  device: "motorola moto g84 5G",
  androidVersion: "15",
  sdk: 35,
  generatedAt: 1793400000000,
  startedAt: 1793399000000,
  state: {
    diagnosticMode: true,
    automationArmed: false,
    accessibilityGranted: false,
    accessibilityConnected: false,
    notificationGranted: true,
    notificationConnected: false,
  },
  notificationEvents: 0,
  offerEvents: 0,
  lastOffer: null,
  lastNotification: null,
  pressCount: 0,
  scrollCount: 0,
  openCount: 0,
  commands: [],
  observations: [],
};

const offer: NotificationSample = {
  at: snapshot.generatedAt,
  postedAt: snapshot.generatedAt,
  offerRecognized: true,
  diagnosticMode: true,
  hasOpenIntent: true,
  actionCount: 0,
  actions: [],
};

describe("diagnostic evidence", () => {
  it("does not confuse no received offer with an offer without actions", () => {
    expect(diagnosticConclusion(snapshot)).toContain("Ainda não foi observada");
    expect(diagnosticConclusion({ ...snapshot, lastOffer: offer })).toContain(
      "não publicou botões",
    );
  });

  it("an unrelated notification cannot rule out acceptance actions on an offer", () => {
    expect(
      diagnosticConclusion({
        ...snapshot,
        notificationEvents: 1,
        lastNotification: { ...offer, offerRecognized: false },
      }),
    ).toContain("Ainda não foi observada");
  });

  it("requires a real command from PopMove even to report a candidate", () => {
    const candidate = {
      index: 1,
      category: "possible_accept" as const,
      hasIntent: true,
      creatorMatches: true,
      requiresUnlock: false,
      semanticAction: 0,
      remoteInputCount: 0,
    };
    const result = (action = candidate) =>
      diagnosticConclusion({
        ...snapshot,
        lastOffer: { ...offer, actionCount: 1, actions: [action] },
      });
    expect(result()).toContain("funcionamento ainda precisa ser validado");
    expect(result({ ...candidate, hasIntent: false })).toContain(
      "inconclusivo",
    );
    expect(result({ ...candidate, creatorMatches: false })).toContain(
      "inconclusivo",
    );
  });

  it("exports connection states and manual observations without copying arbitrary notification fields", () => {
    const privateText = "Rua Exemplo 123; Maria; R$ 25";
    const extraSample = { ...offer, rawText: privateText };
    const report = formatDiagnosticReport({
      ...snapshot,
      lastOffer: extraSample,
      observations: [
        {
          at: snapshot.generatedAt,
          result: "not_observed",
          state: snapshot.state,
        },
      ],
    });
    expect(report).not.toContain(privateText);
    expect(report).toContain("notificações autorizadas/conectadas: sim/não");
    expect(report).toContain("não observou aviso");
    expect(report).toContain("não comprova indetectabilidade");
  });
});
