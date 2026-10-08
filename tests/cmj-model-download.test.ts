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
  it('cancels an ongoing download', async () => {
    vi.stubGlobal('fetch', vi.fn((_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('abort', 'AbortError'))))));
    const control = new AbortController(), result = downloadModel('/model', control.signal, vi.fn());
    const assertion = expect(result).rejects.toMatchObject({ name: 'AbortError' }); control.abort(); await assertion;
  });
});
