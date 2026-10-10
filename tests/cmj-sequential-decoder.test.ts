import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SequentialRecordingDecoder } from '../src/cmj/sequential-decoder';
import type { MP4Sample, MP4VideoTrack } from '../src/frame-engine/mp4-demuxer';
import type { FrameInfo } from '../src/frame-engine/types';

const track = { codec: 'avc1.640028', timescale: 24000, track_width: 1280, track_height: 720 } as MP4VideoTrack;
const frames = (n = 40, offset = 0) => Array.from({ length: n }, (_, i) => ({
  frameIndex: i, rawCts: (i + offset) * 100, pts: i / 240,
})) as FrameInfo[];
const samples = (n = 40) => Array.from({ length: n }, (_, i) => ({
  cts: i * 100, dts: i * 100, duration: 100, is_sync: i === 0, size: 4, data: new ArrayBuffer(4),
})) as MP4Sample[];
let outputs: { timestamp: number; close: ReturnType<typeof vi.fn> }[];
let bitmaps: { close: ReturnType<typeof vi.fn> }[];
let chunks: { timestamp: number }[];
let configures: number, flushes: number;
let behavior: 'normal' | 'stall' | 'unknown' | 'duplicate' | 'missing';
let emit: (frame: VideoFrame) => void;
beforeEach(() => {
  outputs = []; bitmaps = []; chunks = []; configures = 0; flushes = 0; behavior = 'normal';
  vi.stubGlobal('EncodedVideoChunk', class { constructor(init: unknown) { Object.assign(this, init); } });
  vi.stubGlobal('createImageBitmap', vi.fn(async () => {
    const bitmap = { close: vi.fn() }; bitmaps.push(bitmap); return bitmap;
  }));
  vi.stubGlobal('VideoDecoder', class {
    static isConfigSupported = vi.fn(); state = 'configured';
    constructor(init: { output: typeof emit }) { emit = init.output; }
    configure() { configures++; }
    decode(chunk: { timestamp: number }) {
      chunks.push(chunk);
      if (behavior === 'stall' || behavior === 'missing') return;
      const timestamp = behavior === 'unknown' ? 999999 : chunk.timestamp;
      const output = { timestamp, close: vi.fn() }; outputs.push(output); emit(output as unknown as VideoFrame);
      if (behavior === 'duplicate') {
        const duplicate = { timestamp, close: vi.fn() }; outputs.push(duplicate); emit(duplicate as unknown as VideoFrame);
      }
    }
    flush() { flushes++; return behavior === 'stall' ? new Promise<void>(() => {}) : Promise.resolve(); }
    close() { this.state = 'closed'; }
  });
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
const decoder = (f = frames(), s = samples()) => new SequentialRecordingDecoder(new Blob(), track, f, s);

describe('continuous recorded decode without frame thinning', () => {
  it('submits each 240fps source sample once, configures once, and bounds retained frames', async () => {
    const d = decoder();
    for (let i = 0; i < 40; i++) {
      expect(await d.decodeExactFrame(i)).toMatchObject({ actualDecodedFrameIndex: i, status: 'SUCCESS' });
      expect(d.diagnostics.maxRetainedFrames).toBeLessThanOrEqual(SequentialRecordingDecoder.MAX_AHEAD);
    }
    d.dispose();
    expect(chunks.map(c => c.timestamp)).toEqual(frames().map(f => Math.round(f.rawCts! / 24000 * 1e6)));
    expect(configures).toBe(1); expect(flushes).toBe(1);
    for (const resource of [...outputs, ...bitmaps]) expect(resource.close).toHaveBeenCalledTimes(1);
  });
  it('skips frames in order without converting them, and still decodes the next one exactly', async () => {
    const d = decoder();
    for (let i = 0; i < 40; i++) {
      if (i % 2) { await d.skipExactFrame(i); continue; }
      expect(await d.decodeExactFrame(i)).toMatchObject({ actualDecodedFrameIndex: i, status: 'SUCCESS' });
    }
    d.dispose();
    expect(bitmaps).toHaveLength(20);                      // only the analysed frames are converted
    for (const resource of [...outputs, ...bitmaps]) expect(resource.close).toHaveBeenCalledTimes(1);
    await expect(decoder().skipExactFrame(1)).rejects.toThrow('先頭から順番');
  });
  it('maps reordered decode samples by timestamp, not callback/index order', async () => {
    const s = samples(4); [s[1], s[2]] = [s[2], s[1]];
    const d = decoder(frames(4), s);
    for (let i = 0; i < 4; i++) {
      await d.decodeExactFrame(i);
      const frame = vi.mocked(createImageBitmap).mock.calls[i][0] as VideoFrame;
      expect(frame.timestamp).toBe(Math.round(i / 240 * 1e6));
    }
    d.dispose();
  });
  it('decodes but does not measure edit-list preroll and postroll', async () => {
    const d = decoder(frames(3, 2), samples(7));
    for (let i = 0; i < 3; i++) await d.decodeExactFrame(i);
    expect(vi.mocked(createImageBitmap).mock.calls.map(c => (c[0] as VideoFrame).timestamp))
      .toEqual([2, 3, 4].map(i => Math.round(i / 240 * 1e6)));
    d.dispose(); for (const f of outputs) expect(f.close).toHaveBeenCalledTimes(1);
  });
  it.each(['unknown', 'duplicate'] as const)('rejects %s output timestamps', async kind => {
    behavior = kind; const d = decoder(frames(4), samples(4));
    await expect(d.decodeExactFrame(0)).rejects.toThrow('一致しません');
    d.dispose(); for (const f of outputs) expect(f.close).toHaveBeenCalledTimes(1);
  });
  it('rejects missing outputs at EOF instead of relabelling another frame', async () => {
    behavior = 'missing'; const d = decoder(frames(4), samples(4));
    await expect(d.decodeExactFrame(0)).rejects.toThrow('読み出せません'); d.dispose();
  });
  it('wakes a pending read on dispose and closes late output', async () => {
    behavior = 'stall'; const d = decoder(); const pending = d.decodeExactFrame(0);
    const assertion = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    await Promise.resolve(); d.dispose(); await assertion;
    const late = { timestamp: 0, close: vi.fn() }; emit(late as unknown as VideoFrame);
    expect(late.close).toHaveBeenCalledOnce();
  });
  it('closes a bitmap completing after cancellation', async () => {
    let finish!: (bitmap: ImageBitmap) => void;
    vi.mocked(createImageBitmap).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const d = decoder(); const pending = d.decodeExactFrame(0);
    const assertion = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    await vi.waitFor(() => expect(finish).toBeDefined()); d.dispose();
    const late = { close: vi.fn() }; finish(late as unknown as ImageBitmap); await assertion;
    expect(late.close).toHaveBeenCalledOnce();
    for (const f of outputs) expect(f.close).toHaveBeenCalledTimes(1);
  });
  it('fails a stalled bounded queue with a timeout', async () => {
    vi.useFakeTimers(); behavior = 'stall'; const d = decoder();
    const assertion = expect(d.decodeExactFrame(0)).rejects.toThrow('読み出しが停止');
    await vi.advanceTimersByTimeAsync(15001); await assertion; d.dispose();
    expect(chunks).toHaveLength(SequentialRecordingDecoder.MAX_AHEAD);
  });
  it('keeps fewer frames ahead for a 4K picture, and calls a stall the decoder\'s own trouble (tried again)', async () => {
    vi.useFakeTimers(); behavior = 'stall';
    const { DecoderTrouble } = await import('../src/cmj/sequential-decoder');
    const d = new SequentialRecordingDecoder(new Blob(), { ...track, track_width: 3840, track_height: 2160 } as MP4VideoTrack, frames(), samples());
    const assertion = expect(d.decodeExactFrame(0)).rejects.toBeInstanceOf(DecoderTrouble);
    await vi.advanceTimersByTimeAsync(15001); await assertion; d.dispose();
    expect(chunks).toHaveLength(SequentialRecordingDecoder.AHEAD_MIN);
  });
  it('does not call a frame missing from the file the decoder\'s trouble (it would fail again)', async () => {
    const { DecoderTrouble } = await import('../src/cmj/sequential-decoder');
    const s = samples(4); s[0].is_sync = false; const bad = decoder(frames(4), s);
    const e = await bad.decodeExactFrame(0).catch((x: unknown) => x); bad.dispose();
    expect(e).toBeInstanceOf(Error); expect(e).not.toBeInstanceOf(DecoderTrouble);
  });
  it('rejects nonsequential requests and an unproven first key sample', async () => {
    const d = decoder(); await expect(d.decodeExactFrame(1)).rejects.toThrow('順番'); d.dispose();
    const s = samples(4); s[0].is_sync = false; const bad = decoder(frames(4), s);
    await expect(bad.decodeExactFrame(0)).rejects.toThrow('基準フレーム'); bad.dispose();
  });
  it('uses HEVC NAL key authority and preserves CRA-leading RASL in a continuous stream', async () => {
    const description = new Uint8Array(22); description[0] = 1; description[21] = 3;
    const s = samples(4).map((sample, i) => {
      const type = [20, 21, 9, 1][i];
      const data = new Uint8Array([0, 0, 0, 3, type << 1, 1, 0]).buffer;
      return { ...sample, data, size: data.byteLength, is_sync: true };
    });
    [s[1].cts, s[2].cts] = [s[2].cts, s[1].cts];
    const d = new SequentialRecordingDecoder(new Blob(), { ...track, codec: 'hvc1.1.6.L120' }, frames(4), s, description.buffer);
    for (let i = 0; i < 4; i++) await d.decodeExactFrame(i);
    expect(chunks.map(c => (c as { type?: string }).type)).toEqual(['key', 'key', 'delta', 'delta']);
    expect(chunks).toHaveLength(4); expect(configures).toBe(1); d.dispose();
  });
  it('rejects duplicate/invalid source times and mismatched presentation identities', () => {
    const s = samples(4); s[1].cts = 0;
    expect(() => decoder(frames(4), s)).toThrow('重複');
    s[1].cts = NaN; expect(() => decoder(frames(4), s)).toThrow('不正');
    const f = frames(4); f[2].rawCts = 99999;
    expect(() => decoder(f, samples(4))).toThrow('一致しません');
  });
});
