import { afterEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ ms: 12, people: 1, push: vi.fn(), variants: [] as string[],
  backends: [] as string[], streams: [] as { phase: string }[] }));
vi.mock('../src/cmj/mobile-pose', () => ({ MobileCMJPose: class {
  constructor(readonly variant: string, _selector: unknown, readonly backend: string) { mocks.variants.push(variant); mocks.backends.push(backend); }
  async initialize() {}
  warm() {} dispose() {}
  estimate() { return { landmarks: Array.from({length:mocks.people}, () => []), comSample: { comY: mocks.people ? 500 : null }, inferenceMs: mocks.ms }; }
} }));
vi.mock('../src/cmj/com-stream', () => ({ COMStream: class {
  phase = 'PREPARING'; push = mocks.push;
  diagnostics = { prepared:false, preparationSampleCount:0, preparationSpanSeconds:0, observationReason:'PREPARATION_NOT_CONFIRMED' };
  constructor() { mocks.streams.push(this); }
} }));
afterEach(() => {
  vi.unstubAllGlobals(); vi.resetModules(); mocks.push.mockReset(); mocks.variants.length = 0;
  mocks.backends.length = 0; mocks.streams.length = 0; mocks.people = 1;
});
async function worker(ms: number) {
  mocks.ms = ms; mocks.push.mockReturnValue(null);
  const scope = { postMessage: vi.fn(), onmessage: null as null | ((event: {data: unknown}) => Promise<void>) };
  vi.stubGlobal('self', scope); await import('../src/cmj/live-worker');
  await scope.onmessage!({data:{id:0,type:'init'}});
  const frame = async (i: number, previousProcessingMs?: number | null, reset = false, allowMovement = true) => {
    const image = {close:vi.fn()};
    await scope.onmessage!({data:{id:i,type:'frame',image,frame:i,inferencePts:i/60,measurementPts:i/60,previousProcessingMs,reset,allowMovement}});
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
it('keeps the Full model and its stream when the device is slow', async () => {
  const w = await worker(35);
  for (let i = 1; i <= 11; i++) await w.frame(i, 80);
  expect(await w.frame(12, 80)).toMatchObject({poseModel:'full',warmingUp:false,profileChanged:false,profileReason:'FULL_SLOW'});
  const count = mocks.streams.length;
  mocks.streams.at(-1)!.phase = 'MOVING';
  for (let i = 13; i <= 30; i++) expect(await w.frame(i, 80)).toMatchObject({poseModel:'full',profileChanged:false});
  expect(mocks.variants).toEqual(['full']);
  expect(mocks.streams.length).toBe(count);
});
it('does not interpret a person leaving a previously working GPU as backend failure', async () => {
  const w = await worker(10); await w.frame(1);
  mocks.people = 0;
  for (let i = 2; i <= 35; i++) await w.frame(i);
  expect(mocks.backends).toEqual(['GPU']);
});
it('still probes CPU once when GPU has never detected anyone', async () => {
  const w = await worker(10); mocks.people = 0;
  for (let i = 1; i <= 14; i++) await w.frame(i);
  expect(await w.frame(15)).toMatchObject({backend:'CPU',profileChanged:true,warmingUp:true});
  for (let i = 16; i <= 35; i++) await w.frame(i);
  expect(mocks.backends).toEqual(['GPU','CPU']);
});
it('propagates the countdown gate to COM segmentation after warming up', async () => {
  const w = await worker(12);
  for (let i = 1; i <= 12; i++) await w.frame(i, 10, false, false);
  expect(mocks.push.mock.calls.at(-1)?.[1]).toBe(false);
  await w.frame(13, 10, false, true);
  expect(mocks.push.mock.calls.at(-1)?.[1]).toBe(true);
});
