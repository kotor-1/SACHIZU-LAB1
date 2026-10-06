/** The camera's focal length (35 mm equivalent) that iPhone writes into a video's
 * metadata (`com.apple.quicktime.camera.focal_length.35mm_equivalent`, a string such as
 * "25"), read from the movie header at either end of the file. Null when absent. */
const KEY = 'com.apple.quicktime.camera.focal_length.35mm_equivalent';
/** The movie header is at the end of iPhone files (after the frames) or at the start of re-saved ones. */
const SPAN = 4 * 1024 * 1024;

function find(bytes: Uint8Array, text: string, from = 0, back = false) {
  const t = Array.from(text, c => c.charCodeAt(0));
  const match = (i: number) => t.every((c, k) => bytes[i + k] === c);
  if (back) { for (let i = from; i >= 0; i--) if (match(i)) return i; }
  else for (let i = from; i + t.length <= bytes.length; i++) if (match(i)) return i;
  return -1;
}
/** The value for the focal length key in the `meta` box holding it: `keys` lists the keys (1-based), `ilst` the values. */
export function focalFromBytes(bytes: Uint8Array): number | null {
  const k = find(bytes, KEY); if (k < 0) return null;
  const metaType = find(bytes, 'meta', k, true); if (metaType < 4) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), u32 = (i: number) => view.getUint32(i);
  const meta = metaType - 4, metaEnd = meta + u32(meta);
  const keysType = find(bytes, 'keys', meta), ilstType = find(bytes, 'ilst', meta);
  if (keysType < 0 || ilstType < 0 || keysType > metaEnd || ilstType > metaEnd) return null;
  // keys: size, 'keys', version/flags, entry count, then entries of size, namespace, name.
  const keys: string[] = [], count = u32(keysType + 8); let p = keysType + 12;
  for (let i = 0; i < count && p + 8 <= metaEnd; i++) { const n = u32(p); keys.push(String.fromCharCode(...bytes.subarray(p + 8, p + n))); p += n; }
  const want = keys.indexOf(KEY) + 1; if (!want) return null;
  const ilst = ilstType - 4, ilstEnd = ilst + u32(ilst);
  for (let q = ilst + 8; q + 8 <= ilstEnd;) {
    const n = u32(q), index = u32(q + 4);
    if (index === want) {
      const data = q + 8, size = u32(data), type = u32(data + 8) & 0xffffff, raw = bytes.subarray(data + 16, data + size);
      const value = type === 1 ? Number(new TextDecoder().decode(raw)) : type === 23 ? new DataView(raw.buffer, raw.byteOffset, raw.byteLength).getFloat32(0) : raw.length === 4 ? new DataView(raw.buffer, raw.byteOffset, 4).getInt32(0) : NaN;
      return Number.isFinite(value) && value > 10 && value < 200 ? value : null;
    }
    if (n < 8) break; q += n;
  }
  return null;
}
export async function readFocal35(file: Blob): Promise<number | null> {
  for (const [a, b] of [[Math.max(0, file.size - SPAN), file.size], [0, Math.min(file.size, SPAN)]]) {
    const value = focalFromBytes(new Uint8Array(await file.slice(a, b).arrayBuffer())); if (value) return value;
  }
  return null;
}
