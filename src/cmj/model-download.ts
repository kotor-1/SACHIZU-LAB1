/** Progress is measured from downloaded bytes, never a fake time-based bar. */
export async function downloadModel(url: string, signal: AbortSignal, status: (text: string) => void): Promise<Uint8Array<ArrayBuffer>> {
  const control = new AbortController();
  const abort = () => control.abort();
  let stalled = false, timer: ReturnType<typeof setTimeout>;
  const reset = () => { clearTimeout(timer); timer = setTimeout(() => { stalled = true; control.abort(); }, 45000); };
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) abort();
  reset();
  try {
    status('姿勢モデルをダウンロードしています…');
    const response = await fetch(url, { signal: control.signal });
    if (!response.ok) throw new Error(`姿勢モデルを取得できません（HTTP ${response.status}）。通信を確認して再試行してください。`);
    const expected = Number(response.headers.get('content-length'));
    if (!response.body) return new Uint8Array(await response.arrayBuffer());
    const reader = response.body.getReader(), chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value); size += value.length; reset();
        status(`姿勢モデルをダウンロード中 ${(size / 1048576).toFixed(1)} MB${expected > 0 ? ` / ${(expected / 1048576).toFixed(1)} MB` : ''}。初回は時間がかかります。`);
      }
    } finally { reader.releaseLock(); }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    return bytes;
  } catch (e) {
    if (signal.aborted) throw new DOMException('中止', 'AbortError');
    if (stalled) throw new Error('モデルの受信が45秒間進みませんでした。通信を確認し、もう一度解析してください。');
    throw e;
  } finally { clearTimeout(timer!); signal.removeEventListener('abort', abort); }
}
