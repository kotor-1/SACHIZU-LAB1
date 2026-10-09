import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadModel } from '../src/cmj/model-download';
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
describe('model download', () => {
  it('reports real bytes and preserves the exact model for hash checking', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-length': '3' } })));
    const status = vi.fn();
    expect(await downloadModel('/model', new AbortController().signal, status)).toEqual(new Uint8Array([1, 2, 3]));
    expect(status.mock.calls.at(-1)?.[0]).toContain('MB');
  });
  it('writes a model of known size straight into one buffer, and copes with a size that was wrong', async () => {
    const body = (...parts: number[][]) => new ReadableStream({ start(c) { for (const p of parts) c.enqueue(new Uint8Array(p)); c.close(); } });
    vi.stubGlobal('fetch', vi.fn(async () => new Response(body([1, 2], [3, 4, 5], [6]), { headers: { 'content-length': '6' } })));
    const exact = await downloadModel('/model', new AbortController().signal, vi.fn());
    expect(exact).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6])); expect(exact.buffer.byteLength).toBe(6);
    vi.stubGlobal('fetch', vi.fn(async () => new Response(body([1, 2], [3, 4, 5], [6, 7]), { headers: { 'content-length': '6' } })));
    expect(await downloadModel('/model', new AbortController().signal, vi.fn())).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6, 7]));
    vi.stubGlobal('fetch', vi.fn(async () => new Response(body([1, 2], [3]), { headers: { 'content-length': '6' } })));
    expect(await downloadModel('/model', new AbortController().signal, vi.fn())).toEqual(new Uint8Array([1, 2, 3]));
  });
  it('reports an HTTP failure without trying to use an HTML page as a model', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('missing', { status: 404 })));
    await expect(downloadModel('/model', new AbortController().signal, vi.fn())).rejects.toThrow('HTTP 404');
  });
  it('does not compare decompressed progress with compressed Content-Length', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array(30), { headers: { 'content-length': '10', 'content-encoding': 'gzip' } })));
    const status = vi.fn();
    expect((await downloadModel('/model', new AbortController().signal, status)).length).toBe(30);
    expect(status.mock.calls.at(-1)?.[0]).not.toContain(' / ');
  });
  it('times out inactivity and leaves a retryable error', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('abort', 'AbortError'))))));
    const assertion = expect(downloadModel('/model', new AbortController().signal, vi.fn())).rejects.toThrow('45秒');
    await vi.advanceTimersByTimeAsync(45001); await assertion;
  });
  it('keeps a checked model on the device and uses it while it still matches', async () => {
    const hex = async (b: Uint8Array<ArrayBuffer>) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', b)), v => v.toString(16).padStart(2, '0')).join('');
    const store = new Map<string, Response>(), deleted: string[] = [];
    vi.stubGlobal('caches', { open: async () => ({
      match: async (url: string) => store.get(url)?.clone(), put: async (url: string, r: Response) => { store.set(url, r); },
      delete: async (url: string) => { deleted.push(url); return store.delete(url); } }) });
    const model = new Uint8Array([1, 2, 3]), sha = await hex(model);
    const fetch = vi.fn(async () => new Response(model, { headers: { 'content-length': '3' } }));
    vi.stubGlobal('fetch', fetch);
    expect(await downloadModel('/model', new AbortController().signal, vi.fn(), sha)).toEqual(model);
    expect(fetch).toHaveBeenCalledTimes(1); expect(store.has('/model')).toBe(true);
    const status = vi.fn();
    expect(await downloadModel('/model', new AbortController().signal, status, sha)).toEqual(model);
    expect(fetch).toHaveBeenCalledTimes(1); expect(status.mock.calls.at(-1)?.[0]).toContain('端末に保存した');
    // a kept copy that no longer matches (the model changed) is let go and downloaded again
    store.set('/model', new Response(new Uint8Array([9, 9])));
    expect(await downloadModel('/model', new AbortController().signal, vi.fn(), sha)).toEqual(model);
    expect(deleted).toEqual(['/model']); expect(fetch).toHaveBeenCalledTimes(2); expect(new Uint8Array(await store.get('/model')!.clone().arrayBuffer())).toEqual(model);
    // a download that does not match is not kept (the caller's check reports it); no hash given, nothing is kept
    store.clear();
    expect(await downloadModel('/model', new AbortController().signal, vi.fn(), '0'.repeat(64))).toEqual(model);
    expect(await downloadModel('/other', new AbortController().signal, vi.fn())).toEqual(model);
    expect(store.size).toBe(0);
  });
  it('downloads as before where the device cannot keep it', async () => {
    vi.stubGlobal('caches', { open: async () => { throw new DOMException('denied', 'SecurityError'); } });
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array([4, 5]))));
    expect(await downloadModel('/model', new AbortController().signal, vi.fn(), 'a'.repeat(64))).toEqual(new Uint8Array([4, 5]));
    vi.stubGlobal('caches', { open: async () => ({ match: async () => undefined, put: async () => { throw new DOMException('full', 'QuotaExceededError'); }, delete: async () => true }) });
    const bytes = new Uint8Array([4, 5]), sha = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), v => v.toString(16).padStart(2, '0')).join('');
    expect(await downloadModel('/model', new AbortController().signal, vi.fn(), sha)).toEqual(bytes);
  });
  it('cancels an ongoing download', async () => {
    vi.stubGlobal('fetch', vi.fn((_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('abort', 'AbortError'))))));
    const control = new AbortController(), result = downloadModel('/model', control.signal, vi.fn());
    const assertion = expect(result).rejects.toMatchObject({ name: 'AbortError' }); control.abort(); await assertion;
  });
});
