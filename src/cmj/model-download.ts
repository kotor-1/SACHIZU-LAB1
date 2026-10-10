/** Models kept on the device after a checked download (Cache Storage). The site lets a browser keep its files for 10
 * minutes only (GitHub Pages, max-age=600), so a phone could download the 9-56 MB models again for each analysis: the
 * public hurdle screen took 136 s for a 1.35 s video in a fresh WebKit, 24 s with the models at hand (2026-10-08, the
 * user: 「解析に結構時間かかった」). Kept only when the bytes match the model's SHA-256, and a kept copy is used only while
 * it still does (a changed model is downloaded again). Where storage is missing or full, every analysis downloads. */
const KEEP = 'sachizu-models-v1';
const hexOf = async (bytes: Uint8Array<ArrayBuffer>) =>
  Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
/** A kept copy's key: the model's address with its SHA-256. A changed model (another hash) is never taken for the old one,
 * and a page still running the old code (the old hash) neither uses nor deletes the new copy: under the address alone they
 * deleted each other's. */
export const keyOf = (url: string, sha256: string) => `${url}${url.includes('?') ? '&' : '?'}sha256=${sha256}`;
const absolute = (url: string) => new URL(url, globalThis.location?.href).href;
async function kept(url: string, sha256: string): Promise<Uint8Array<ArrayBuffer> | null> {
  try {
    if (typeof caches === 'undefined') return null;
    const store = await caches.open(KEEP), key = keyOf(url, sha256), hit = await store.match(key);
    if (!hit) return null;
    const bytes = new Uint8Array(await hit.arrayBuffer());
    if (await hexOf(bytes) === sha256) return bytes;
    await store.delete(key);
  } catch { /* not allowed here (a private window): downloaded */ }
  return null;
}
/** Keeps bytes already checked against their SHA-256, and lets go the model's older copies (kept under its address alone
 * before 2026-10-10, or with another hash): 56 MB each that would never be used again. */
async function keep(url: string, bytes: Uint8Array<ArrayBuffer>, sha256: string) {
  try {
    if (typeof caches === 'undefined') return;
    const store = await caches.open(KEEP), key = keyOf(url, sha256);
    await store.put(key, new Response(bytes));
    const mine = absolute(key), base = absolute(url), older = absolute(keyOf(url, ''));
    for (const request of await store.keys()) if (request.url !== mine && (request.url === base || request.url.startsWith(older))) await store.delete(request);
  } catch { /* storage full or not allowed: downloaded again next time */ }
}

/** The model's bytes: the copy kept on the device when `sha256` is given and it matches, else downloaded (and kept).
 * With `sha256` the bytes returned always match it, checked once here: the callers hashed them again, and each hash is a
 * copy of up to 56 MB while a phone loads the model beside the other one (the hurdle and long jump). */
export async function downloadModel(url: string, signal: AbortSignal, status: (text: string) => void, sha256?: string): Promise<Uint8Array<ArrayBuffer>> {
  if (sha256) {
    if (signal.aborted) throw new DOMException('中止', 'AbortError');
    const bytes = await kept(url, sha256);
    if (signal.aborted) throw new DOMException('中止', 'AbortError');
    if (bytes) { status('端末に保存した姿勢モデルを読み込みました。'); return bytes; }
  }
  // With a hash the browser asks the site whether its own cached file is still current: after a model changes it kept
  // handing out the old one for up to 10 minutes (max-age=600), which failed the check.
  const bytes = await fetchModel(url, signal, status, sha256 ? 'no-cache' : 'default');
  if (sha256) {
    if (await hexOf(bytes) !== sha256) throw new Error('骨格モデルのファイルが正しくありません（ダウンロードが途中で切れた可能性があります）。通信を確認して、もう一度お試しください。');
    await keep(url, bytes, sha256);
  }
  return bytes;
}

/** Progress is measured from downloaded bytes, never a fake time-based bar. */
async function fetchModel(url: string, signal: AbortSignal, status: (text: string) => void, cache: RequestCache = 'default'): Promise<Uint8Array<ArrayBuffer>> {
  const control = new AbortController();
  const abort = () => control.abort();
  let stalled = false, timer: ReturnType<typeof setTimeout>;
  const reset = () => { clearTimeout(timer); timer = setTimeout(() => { stalled = true; control.abort(); }, 45000); };
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) abort();
  reset();
  try {
    status('姿勢モデルをダウンロードしています…');
    const response = await fetch(url, { signal: control.signal, cache });
    if (!response.ok) throw new Error(`姿勢モデルを取得できません（HTTP ${response.status}）。通信を確認して再試行してください。`);
    // Fetch exposes decompressed bytes; Content-Length may describe compressed wire bytes.
    const encoding = response.headers.get('content-encoding');
    const expected = encoding && encoding !== 'identity' ? 0 : Number(response.headers.get('content-length'));
    if (!response.body) return new Uint8Array(await response.arrayBuffer());
    const reader = response.body.getReader(), chunks: Uint8Array[] = [];
    // With its size known the model is written straight into one buffer: joining chunks at the end held it twice, which
    // a phone's memory feels for a 56 MB model.
    let size = 0, whole: Uint8Array<ArrayBuffer> | null = expected > 0 ? new Uint8Array(expected) : null;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (whole && size + value.length <= whole.length) whole.set(value, size);
        else { if (whole) { chunks.push(whole.subarray(0, size)); whole = null; } chunks.push(value); }
        size += value.length; reset();
        status(`姿勢モデルをダウンロード中 ${(size / 1048576).toFixed(1)} MB${expected > 0 ? ` / ${(expected / 1048576).toFixed(1)} MB` : ''}。初回は時間がかかります。`);
      }
    } finally { reader.releaseLock(); }
    if (whole) return size === whole.length ? whole : whole.slice(0, size);
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    return bytes;
  } catch (e) {
    if (signal.aborted) throw new DOMException('中止', 'AbortError');
    if (stalled) throw new Error('モデルの受信が45秒間進みませんでした。通信を確認し、もう一度解析してください。');
    throw e;
  } finally { clearTimeout(timer!); signal.removeEventListener('abort', abort); }
}
