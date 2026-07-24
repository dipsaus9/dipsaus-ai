/**
 * Run `worker` over `items` with at most `limit` in flight. Results keep item
 * order regardless of completion order; a worker rejection rejects the pool.
 */
export async function mapPool<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = Array.from({ length: items.length }) as R[];
  let next = 0;
  const lanes = Array.from(
    { length: Math.max(1, Math.min(limit, items.length)) },
    async () => {
      while (true) {
        const index = next;
        next += 1;
        if (index >= items.length) {
          return;
        }
        results[index] = await worker(items[index] as T, index);
      }
    },
  );
  await Promise.all(lanes);
  return results;
}
