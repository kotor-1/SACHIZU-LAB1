/** The RJ camera's worker, answered in the order asked. Unlike the CMJ camera's client (one request at a time), frames
 * queue here: the worker reads every frame of a set however fast the phone is, and `waiting` says how far behind it is. */
export class RJLiveClient {
  private nextId = 0;
  private pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  private disposed = false;
  constructor(private worker: Worker, private status: (message: string) => void) {
    worker.onmessage = ({ data }) => {
      if (this.disposed) return;
      if (typeof data.status === 'string') { this.status(data.status); return; }
      const pending = this.pending.get(data.id);
      if (!pending) return;
      clearTimeout(pending.timer); this.pending.delete(data.id);
      if (data.error) pending.reject(new Error(data.error)); else pending.resolve(data.result);
    };
    worker.onerror = event => { event.preventDefault(); this.dispose(new Error('CAMERA_WORKER_FAILED')); };
  }
  /** Requests asked and not yet answered. */
  get waiting() { return this.pending.size; }
  get closed() { return this.disposed; }
  /** `timeout` from the time asked: a queued frame waits for the ones before it. */
  request<T>(message: object, transfer: Transferable[] = [], timeout = 30_000): Promise<T> {
    if (this.disposed) return Promise.reject(new Error('CAMERA_WORKER_CLOSED'));
    return new Promise<T>((resolve, reject) => {
      const id = ++this.nextId;
      const timer = setTimeout(() => this.dispose(new Error('CAMERA_WORKER_TIMEOUT')), timeout);
      this.pending.set(id, { resolve: value => resolve(value as T), reject, timer });
      try { this.worker.postMessage({ ...message, id }, transfer); }
      catch (e) { this.dispose(e instanceof Error ? e : new Error(String(e))); }
    });
  }
  dispose(error: Error = new DOMException('中止', 'AbortError')) {
    if (this.disposed) return;
    this.disposed = true; this.worker.terminate(); this.worker.onmessage = null; this.worker.onerror = null;
    for (const pending of this.pending.values()) { clearTimeout(pending.timer); pending.reject(error); }
    this.pending.clear();
  }
}

/** Starts the RJ camera's worker with its model (Full; GPU, else CPU). The first use downloads the model. */
export async function startRJWorker(signal: AbortSignal, status: (message: string) => void) {
  if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap === 'undefined')
    throw new Error('このブラウザでは、カメラで撮りながらRJを解析できません。標準カメラで撮った動画を読み込んでください。');
  const client = new RJLiveClient(new Worker(new URL('./rj-live-worker.ts', import.meta.url)), status);
  const abort = () => client.dispose();
  signal.addEventListener('abort', abort, { once: true });
  try {
    const { backend } = await client.request<{ backend: 'CPU' | 'GPU' }>({ type: 'init' }, [], 120_000);
    if (signal.aborted) throw new DOMException('中止', 'AbortError');
    return { client, backend };
  } catch (error) { client.dispose(); throw error; }
  finally { signal.removeEventListener('abort', abort); }
}
