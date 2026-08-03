import { describe, expect, it } from "vitest";
import { retryFailedRuns } from "../eval/runner/retry";

interface FakeRecord {
  run: number;
  ok: boolean;
  error?: string;
  retried?: boolean;
}

const job = (run: number) => ({ run });
const passed = (run: number): FakeRecord => ({ run, ok: true });
const failed = (run: number, error: string): FakeRecord => ({ run, ok: false, error });

const baseOptions = {
  retries: 1,
  failed: (record: FakeRecord) => !record.ok,
  describe: ({ run }: { run: number }) => `run ${run}`,
};

describe("retryFailedRuns", () => {
  it("replaces a failed record with the successful retry, marked retried", async () => {
    const records = [passed(1), failed(2, "timeout after 900000ms"), passed(3)];
    const reruns: number[] = [];
    const result = await retryFailedRuns([job(1), job(2), job(3)], records, {
      ...baseOptions,
      rerun: async ({ run }) => {
        reruns.push(run);
        return passed(run);
      },
    });
    expect(reruns).toEqual([2]);
    expect(result[1]).toEqual({ run: 2, ok: true, retried: true });
    // successful first-pass records are untouched and unflagged
    expect(result[0]).toEqual(passed(1));
    expect(result[2]).toEqual(passed(3));
  });

  it("keeps a double failure failed with both errors recorded", async () => {
    const records = [failed(1, "timeout after 900000ms")];
    const result = await retryFailedRuns([job(1)], records, {
      ...baseOptions,
      rerun: async () => failed(1, "API Error: Connection closed"),
    });
    expect(result[0]?.ok).toBe(false);
    expect(result[0]?.retried).toBeUndefined();
    expect(result[0]?.error).toBe(
      "timeout after 900000ms | retry: API Error: Connection closed",
    );
  });

  it("retries each failed record exactly once with retries: 1", async () => {
    const records = [failed(1, "a"), failed(2, "b")];
    let calls = 0;
    await retryFailedRuns([job(1), job(2)], records, {
      ...baseOptions,
      rerun: async ({ run }) => {
        calls += 1;
        return failed(run, "again");
      },
    });
    expect(calls).toBe(2);
  });

  it("does nothing with retries: 0", async () => {
    const records = [failed(1, "a")];
    let calls = 0;
    const result = await retryFailedRuns([job(1)], records, {
      ...baseOptions,
      retries: 0,
      rerun: async ({ run }) => {
        calls += 1;
        return passed(run);
      },
    });
    expect(calls).toBe(0);
    expect(result).toEqual(records);
  });

  it("does not mutate the input records array", async () => {
    const original = failed(1, "a");
    const records = [original];
    await retryFailedRuns([job(1)], records, {
      ...baseOptions,
      rerun: async ({ run }) => passed(run),
    });
    expect(records[0]).toBe(original);
    expect(original.error).toBe("a");
  });
});
