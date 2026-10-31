/** Keep a delayed settings sync from overwriting a newer explicit start/stop. */
export function createNativeConfigQueue() {
  let pending: Promise<unknown> = Promise.resolve();
  return function enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = pending.then(operation);
    pending = result.catch(() => undefined);
    return result;
  };
}
