import { describe, expect, it } from "vitest";
import { mapPool } from "../eval/runner/pool";

const tick = () => new Promise((resolve) => setTimeout(resolve, 1));

describe("mapPool", () => {
  it("preserves item order regardless of completion order", async () => {
    const results = await mapPool([30, 10, 20], 3, async (delay) => {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return delay;
    });
    expect(results).toEqual([30, 10, 20]);
  });

  it("never exceeds the concurrency limit", async () => {
    let inFlight = 0;
    let peak = 0;
    await mapPool(Array.from({ length: 10 }, (_, i) => i), 3, async () => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await tick();
      inFlight -= 1;
    });
    expect(peak).toBe(3);
  });

  it("runs serially at limit 1", async () => {
    const order: number[] = [];
    await mapPool([1, 2, 3], 1, async (item) => {
      order.push(item);
      await tick();
    });
    expect(order).toEqual([1, 2, 3]);
  });

  it("propagates a worker rejection", async () => {
    await expect(
      mapPool([1, 2], 2, async (item) => {
        if (item === 2) {
          throw new Error("boom");
        }
      }),
    ).rejects.toThrow("boom");
  });
});
