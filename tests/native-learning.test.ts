import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const storeSource = readFileSync(
  resolve(
    process.cwd(),
    "modules/safe-accept/android/src/main/java/com/toalhaver/vermelha/safeaccept/SafeAcceptStore.kt",
  ),
  "utf8",
);

const serviceSource = readFileSync(
  resolve(
    process.cwd(),
    "modules/safe-accept/android/src/main/java/com/toalhaver/vermelha/safeaccept/PopMoveAccessibilityService.kt",
  ),
  "utf8",
);

describe("native monotonic gesture learning", () => {
  it("migrates inflated values to the fastest safe existing value", () => {
    expect(storeSource).toContain("monotonic_learning_migrated_v2");
    expect(storeSource).toContain(
      "minOf(\n      configuredDuration,\n      storedLearnedDuration,\n      DEFAULT_DURATION_MS",
    );
  });

  it("never increases or resets learning after an inconclusive response", () => {
    const failurePolicy = storeSource.slice(
      storeSource.indexOf("fun recordGestureFailure"),
      storeSource.indexOf("fun disable"),
    );

    expect(failurePolicy).not.toContain("+ 150L");
    expect(failurePolicy).not.toContain("putLong(KEY_LEARNED_DURATION");
    expect(failurePolicy).not.toContain("putInt(KEY_LEARNING_SUCCESS_STREAK");
    expect(failurePolicy).toContain(
      "return GestureLearningResult(currentDuration, false)",
    );
  });

  it("retries at the locked duration without making future gestures slower", () => {
    expect(serviceSource).toContain(
      "repetindo uma vez sem aumentar os ${learning.durationMs} ms aprendidos",
    );
    expect(serviceSource).toContain(
      "duração protegida mantida em ${learning.durationMs} ms",
    );
  });
});
