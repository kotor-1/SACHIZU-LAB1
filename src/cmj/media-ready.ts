export function waitForCurrentFrame(element: HTMLVideoElement, signal: AbortSignal, timeoutMs = 15_000) {
  if (signal.aborted) return Promise.reject(new DOMException('中止', 'AbortError'));
  if (element.readyState >= 2 && !element.seeking) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout>;
    const clean = () => {
      for (const event of ['loadeddata', 'canplay', 'seeked']) element.removeEventListener(event, changed);
      element.removeEventListener('error', failed); signal.removeEventListener('abort', aborted); clearTimeout(timer);
    };
    const changed = () => { if (element.readyState >= 2 && !element.seeking) { clean(); resolve(); } };
    const failed = () => { clean(); reject(new Error('この動画を再生できません。別の形式で保存してください。')); };
    const aborted = () => { clean(); reject(new DOMException('中止', 'AbortError')); };
    for (const event of ['loadeddata', 'canplay', 'seeked']) element.addEventListener(event, changed);
    element.addEventListener('error', failed, { once: true }); signal.addEventListener('abort', aborted, { once: true });
    timer = setTimeout(() => { clean(); reject(new Error('動画の準備に時間がかかっています。別の形式で保存してください。')); }, timeoutMs);
    changed();
  });
}
