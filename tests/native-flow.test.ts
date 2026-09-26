import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const serviceSource = readFileSync(
  resolve(
    process.cwd(),
    "modules/safe-accept/android/src/main/java/com/toalhaver/vermelha/safeaccept/PopMoveAccessibilityService.kt",
  ),
  "utf8",
);

describe("native queued-offer flow", () => {
  it("uses only a fixed-X upward finger gesture for queued offers", () => {
    expect(serviceSource).not.toContain("ACTION_SCROLL_FORWARD");
    expect(serviceSource).toContain("moveTo(fixedX,");
    expect(serviceSource).toContain("lineTo(fixedX,");
    expect(serviceSource).toContain("VERTICAL_SCROLL_START_Y = 0.78f");
    expect(serviceSource).toContain("VERTICAL_SCROLL_END_Y = 0.20f");
    expect(serviceSource).toContain("MAX_SCROLL_ATTEMPTS = 3");
  });

  it("requires a visible exact phrase and never falls back to calibration", () => {
    expect(serviceSource).not.toContain("allowNotificationFallback");
    expect(serviceSource).not.toContain(
      "snapshot.markerCenterX ?: config.x",
    );
    expect(serviceSource).not.toContain(
      "snapshot.markerCenterY ?: config.y",
    );
    expect(serviceSource).toContain("node.isVisibleToUser");
    expect(serviceSource).toContain("calculateSafeBounds(root)");
    expect(serviceSource).toContain("SAFE_BOTTOM_RATIO = 0.88f");
    expect(serviceSource).toContain("resolveVisibleMarkerAttempt(attempt)");
    expect(serviceSource).toContain(
      'const val OFFER_SCREEN_MARKER = "pressione e segure para atender"',
    );
  });
});
