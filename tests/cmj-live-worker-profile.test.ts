import { afterEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ ms: 12, push: vi.fn(), variants: [] as string[] }));
vi.mock('../src/cmj/mobile-pose', () => ({ MobileCMJPose: class {
  constructor(readonly variant: string, _selector: unknown, readonly backend: string) { mocks.variants.push(variant); }
  async initialize() {} warm() {} dispose() {}
  estimate() { return { landmarks: [[]], comSample: { comY: 500 }, inferenceMs: mocks.ms }; }
} }));
vi.mock('../src/cmj/com-stream', () => ({ COMStream: class { phase = 'PREPARING'; push = mocks.push; } }));
afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); mocks.push.mockReset(); mocks.variants.length = 0; });
async function worker(ms: number) {
  mocks.ms = ms;
  const scope = { postMessage: vi.fn(), onmessage: null as null | ((event: {data: unknown}) => Promise<void>) };
  vi.stubGlobal('self', scope); await import('../src/cmj/live-worker');
  await scope.onmessage!({data:{id:0,type:'init'}});
  const frame = async (i: number) => {
    const image = {close:vi.fn()};
    await scope.onmessage!({data:{id:i,type:'frame',image,frame:i,inferencePts:i/60,measurementPts:i/60}});
    expect(image.close).toHaveBeenCalledOnce();
    return scope.postMessage.mock.calls.at(-1)?.[0].result;
  };
  return {frame};
}
it('uses Full and withholds COM calculation until preflight completes', async () => {
  const w = await worker(12);
  for(let i=1;i<=11;i++) expect((await w.frame(i)).warmingUp).toBe(true);
  expect(mocks.push).not.toHaveBeenCalled();
  expect(await w.frame(12)).toMatchObject({poseModel:'full',warmingUp:false,profileReason:'FULL_WITHIN_BUDGET'});
  expect(mocks.push).toHaveBeenCalledOnce();
  mocks.ms = 80;
  await w.frame(13); expect(mocks.variants).toEqual(['full']);
});
it('does not feed the Full probe into the Lite measurement stream', async () => {
  const w = await worker(35);
  for(let i=1;i<=12;i++) await w.frame(i);
  expect(mocks.variants).toEqual(['full','lite']);
  expect(mocks.push).not.toHaveBeenCalled();
  expect(await w.frame(13)).toMatchObject({poseModel:'lite',warmingUp:false,profileReason:'LITE_FOR_SPEED'});
  expect(mocks.push).toHaveBeenCalledOnce();
});
