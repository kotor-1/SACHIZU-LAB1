import { expect, it } from 'vitest';
import { LiveProfile } from '../src/cmj/live-profile';
it('waits for 12 single-person observations before allowing readiness', () => {
  const profile = new LiveProfile();
  for (let i = 0; i < 50; i++) expect(profile.observe(10, 0)).toBe('wait');
  expect(profile.observe(NaN, 1)).toBe('wait');
  for (let i = 0; i < 11; i++) expect(profile.observe(20, 1)).toBe('wait');
  expect(profile.observe(20, 1)).toBe('ready');
  expect(profile.reason).toBe('FULL_WITHIN_BUDGET');
  expect(profile.observe(500, 1)).toBe('ready');
});
it('never switches models; a slow Full profile is only reported', () => {
  const profile = new LiveProfile();
  for (let i = 0; i < 12; i++) expect(profile.observe(10, 1, { previousProcessingMs: 80 })).toBe(i < 11 ? 'wait' : 'ready');
  expect(profile.reason).toBe('FULL_SLOW');
  for (let i = 0; i < 20; i++) expect(profile.observe(100, 1)).toBe('ready');
});
it('does not judge speed from one startup spike or a second person', () => {
  const profile = new LiveProfile(); profile.observe(400, 1);
  for (let i = 0; i < 20; i++) expect(profile.observe(100, 2)).toBe('wait');
  for (let i = 0; i < 10; i++) profile.observe(16, 1);
  expect(profile.observe(16, 1)).toBe('ready');
  expect(profile.reason).toBe('FULL_WITHIN_BUDGET');
});
it('ignores absent or invalid round-trip times', () => {
  const profile = new LiveProfile();
  for (const previousProcessingMs of [null, undefined, NaN, Infinity, -1, null, undefined, NaN, Infinity, -1, null, 10])
    profile.observe(10, 1, { previousProcessingMs });
  expect(profile.reason).toBe('FULL_WITHIN_BUDGET');
});
it('re-measures after a timing reset', () => {
  const profile = new LiveProfile();
  for (let i = 0; i < 12; i++) profile.observe(80, 1);
  expect(profile.reason).toBe('FULL_SLOW');
  profile.resetTiming();
  for (let i = 0; i < 12; i++) profile.observe(10, 1);
  expect(profile.reason).toBe('FULL_WITHIN_BUDGET');
});
