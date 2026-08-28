import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const serviceSource = readFileSync(
  resolve(
    process.cwd(),
    "modules/safe-accept/android/src/main/java/com/drivertouch/pop/safeaccept/PopMoveAccessibilityService.kt",
  ),
  "utf8",
);

describe("native queued-offer flow", () => {
  it("uses only a fixed-X vertical gesture for queued offers", () => {
    expect(serviceSource).not.toContain("ACTION_SCROLL_FORWARD");
    expect(serviceSource).toContain("moveTo(fixedX,");
    expect(serviceSource).toContain("lineTo(fixedX,");
  });

  it("does not keep a blind notification fallback", () => {
    expect(serviceSource).not.toContain("allowNotificationFallback");
    expect(serviceSource).toContain(
      'const val OFFER_SCREEN_MARKER = "pressione e segure para atender"',
    );
  });
});
