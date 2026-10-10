/** Let cancellation settle even if browser permission/model/decode is pending.
 * The caller still owns late resource cleanup; this does not cancel promises. */
export function untilAborted<T>(operation: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const abort = () => { signal.removeEventListener('abort', abort); reject(new DOMException('中止', 'AbortError')); };
    operation.then(value => { signal.removeEventListener('abort', abort); resolve(value); },
      error => { signal.removeEventListener('abort', abort); reject(error); });
    if (signal.aborted) abort();
    else signal.addEventListener('abort', abort, { once: true });
  });
}

/** An operation that has not settled after `ms` milliseconds rejects (with `what` in its message): a model that stops
 * answering (a GPU that hangs, storage that never replies) left an analysis waiting for good. The operation itself goes
 * on; the caller moves past it. */
export function withinTime<T>(operation: Promise<T>, ms: number, what: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${what}が${Math.round(ms / 1000)}秒たっても応答しません。`)), ms);
    operation.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
  });
}
