import { describe, expect, it } from "vitest";
import { createNativeConfigQueue } from "../lib/native-config-queue";

describe("native configuration transitions", () => {
  it("finishes a delayed old sync before confirming a newer explicit test start", async () => {
    const enqueue = createNativeConfigQueue();
    const calls: string[] = [];
    let finishSync!: () => void;
    const delayed = new Promise<void>((resolve) => {
      finishSync = resolve;
    });
    let armed = false;
    const sync = enqueue(async () => {
      calls.push("sync began");
      await delayed;
      armed = false;
      calls.push("old paused config applied");
    });
    const start = enqueue(async () => {
      armed = true;
      calls.push("new test armed");
      return armed;
    });
    await Promise.resolve();
    expect(calls).toEqual(["sync began"]);
    finishSync();
    await sync;
    expect(await start).toBe(true);
    expect(armed).toBe(true);
    expect(calls).toEqual([
      "sync began",
      "old paused config applied",
      "new test armed",
    ]);
  });

  it("still processes an explicit stop after a failed settings update", async () => {
    const enqueue = createNativeConfigQueue();
    const failed = enqueue(async () => {
      throw new Error("old sync failed");
    });
    let stopped = false;
    const stop = enqueue(async () => {
      stopped = true;
    });
    await expect(failed).rejects.toThrow("old sync failed");
    await stop;
    expect(stopped).toBe(true);
  });
});
