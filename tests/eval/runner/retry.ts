/**
 * End-of-run retry pass. Transient failures (API outage windows, CLI
 * timeouts) cluster in time — DIP-3.8 lost 25 runs to two such windows and
 * every one succeeded on manual re-run. Retrying failed runs sequentially
 * *after* the full matrix has drained uses the matrix itself as the backoff:
 * by the time the pass starts, a multi-minute outage window has usually
 * closed. Callers decide what "failed" means (review: unusable output;
 * apply: CLI error) so grading failures are never retried.
 */
export async function retryFailedRuns<J, R extends { error?: string; retried?: boolean }>(
  jobs: readonly J[],
  records: readonly R[],
  options: {
    /** attempts per failed record; 0 disables the pass */
    retries: number;
    failed: (record: R) => boolean;
    /** re-executes the job that produced the record at the same index */
    rerun: (job: J) => Promise<R>;
    describe: (job: J) => string;
    log?: (message: string) => void;
  },
): Promise<R[]> {
  const log = options.log ?? (() => {});
  const out = [...records];
  if (options.retries < 1) {
    return out;
  }
  for (let index = 0; index < out.length; index += 1) {
    let current = out[index] as R;
    if (!options.failed(current)) {
      continue;
    }
    const job = jobs[index] as J;
    for (let attempt = 1; attempt <= options.retries && options.failed(current); attempt += 1) {
      log(`retry ${options.describe(job)} (attempt ${attempt}/${options.retries})`);
      const retried = await options.rerun(job);
      current = options.failed(retried)
        ? // keep the original record so first-attempt diagnostics survive,
          // but record both errors — a double failure is a real signal
          {
            ...current,
            error: `${current.error ?? "failed"} | retry: ${retried.error ?? "failed"}`,
          }
        : { ...retried, retried: true };
    }
    out[index] = current;
  }
  return out;
}
