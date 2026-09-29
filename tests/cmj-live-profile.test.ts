import { expect, it } from 'vitest';
import { LiveProfile } from '../src/cmj/live-profile';
it('waits for 12 single-person observations before allowing readiness', () => {
  const profile = new LiveProfile();
  for (let i = 0; i < 50; i++) expect(profile.observe(10, 0)).toBe('wait');
  expect(profile.observe(NaN, 1)).toBe('wait');
  for (let i = 0; i < 11; i++) expect(profile.observe(20, 1)).toBe('wait');
  expect(profile.observe(20, 1)).toBe('ready');
  expect(profile.reason).toBe('FULL_WITHIN_BUDGET');
  expect(profile.observe(500, 1)).toBe('ready'); // No mid-jump change.
});
it('switches to Lite only once when the measured median exceeds the budget', () => {
  const profile = new LiveProfile();
  for (let i = 0; i < 11; i++) profile.observe(35, 1);
  expect(profile.observe(35, 1)).toBe('lite');
  expect(profile.reason).toBe('LITE_FOR_SPEED');
  expect(profile.observe(35, 1)).toBe('ready');
});
it('does not select a model from one startup spike or a second person', () => {
  const profile = new LiveProfile(); profile.observe(400, 1);
  for (let i = 0; i < 20; i++) expect(profile.observe(100, 2)).toBe('wait');
  for (let i = 0; i < 10; i++) profile.observe(16, 1);
  expect(profile.observe(16, 1)).toBe('ready');
});
it('includes copying and worker round-trip cost rather than trusting a fast inference alone', () => {
  const profile = new LiveProfile();
  for (let i = 0; i < 11; i++) expect(profile.observe(10, 1, { previousProcessingMs: 48 })).toBe('wait');
  expect(profile.observe(10, 1, { previousProcessingMs: 48 })).toBe('lite');
  expect(profile.reason).toBe('LITE_FOR_SPEED');
});
it('defers a later slow Full profile until an explicit safe movement boundary', () => {
  const profile = new LiveProfile();
  for (let i = 0; i < 12; i++) profile.observe(10, 1);
  for (let i = 0; i < 20; i++) expect(profile.observe(10, 1, { previousProcessingMs: 60, canSwitch: false })).toBe('ready');
  expect(profile.reason).toBe('FULL_SLOW_SWITCH_PENDING');
  expect(profile.observe(10, 1, { canSwitch: true })).toBe('lite');
  for (let i = 0; i < 20; i++) expect(profile.observe(100, 1, { canSwitch: true })).toBe('ready');
  expect(profile.reason).toBe('LITE_FOR_SPEED');
});
it('never assumes a safe late boundary when the caller omits it', () => {
  const profile = new LiveProfile();
  for (let i = 0; i < 12; i++) profile.observe(10, 1);
  for (let i = 0; i < 20; i++) expect(profile.observe(80, 1)).toBe('ready');
  expect(profile.reason).toBe('FULL_SLOW_SWITCH_PENDING');
});
it('ignores absent or invalid round-trip times and does not infer a budget from camera cadence', () => {
  const profile = new LiveProfile();
  for (const previousProcessingMs of [null, undefined, NaN, Infinity, -1, null, undefined, NaN, Infinity, -1, null, 10])
    profile.observe(10, 1, { previousProcessingMs });
  expect(profile.reason).toBe('FULL_WITHIN_BUDGET');
});
it('clears timing observations on geometry/clock reset without switching a selected model back', () => {
  const profile = new LiveProfile();
  for (let i = 0; i < 11; i++) profile.observe(50, 1);
  profile.resetTiming();
  for (let i = 0; i < 11; i++) expect(profile.observe(10, 1)).toBe('wait');
  expect(profile.observe(10, 1)).toBe('ready');
  const lite = new LiveProfile();
  for (let i = 0; i < 12; i++) lite.observe(50, 1);
  lite.resetTiming(); expect(lite.observe(10, 1)).toBe('ready'); expect(lite.reason).toBe('LITE_FOR_SPEED');
});
