/** The screen kept on while an analysis runs, released by the function returned. An analysis takes minutes on a phone,
 * and a screen that locks (Auto-Lock is 30 s on many iPhones) suspends the page: its timers and its video decoder stop
 * part way. Where the browser cannot keep it on (Safari before 16.4), nothing changes. */
export async function keepAwake(): Promise<() => void> {
  let lock: { release: () => Promise<void> } | null = null;
  try {
    lock = await (navigator as Navigator & { wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request('screen') ?? null;
  } catch { lock = null; }
  return () => { void lock?.release().catch(() => undefined); };
}
