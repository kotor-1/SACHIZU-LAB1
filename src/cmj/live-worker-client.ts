/** One RPC at a time; never accumulate an unbounded queue of camera frames. */
export class LiveWorkerClient {
  private nextId = 0;
  private pending: { id: number; resolve: (value: unknown) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> } | null = null;
  private disposed = false;
  constructor(private worker: Worker, private status: (message: string) => void) {
    worker.onmessage = ({ data }) => {
      if (this.disposed) return;
      if (typeof data.status === 'string') { this.status(data.status); return; }
      const pending = this.pending;
      if (!pending || pending.id !== data.id) return;
      clearTimeout(pending.timer); this.pending = null;
      if (data.error) pending.reject(new Error(data.error)); else pending.resolve(data.result);
    };
    worker.onerror = event => { event.preventDefault(); this.dispose(new Error('CAMERA_WORKER_FAILED')); };
  }
  request<T>(message: object, transfer: Transferable[] = [], timeout = 15_000): Promise<T> {
    if (this.disposed) return Promise.reject(new Error('CAMERA_WORKER_CLOSED'));
    if (this.pending) return Promise.reject(new Error('CAMERA_WORKER_BUSY'));
    return new Promise<T>((resolve, reject) => {
      const id = ++this.nextId;
      const timer = setTimeout(() => this.dispose(new Error('CAMERA_WORKER_TIMEOUT')), timeout);
      this.pending = { id, resolve: value => resolve(value as T), reject, timer };
      try { this.worker.postMessage({ ...message, id }, transfer); }
      catch (e) { this.dispose(e instanceof Error ? e : new Error(String(e))); }
    });
  }
  dispose(error: Error = new DOMException('中止', 'AbortError')) {
    if (this.disposed) return;
    this.disposed = true; this.worker.terminate(); this.worker.onmessage = null; this.worker.onerror = null;
    if (this.pending) { clearTimeout(this.pending.timer); this.pending.reject(error); this.pending = null; }
  }
}
