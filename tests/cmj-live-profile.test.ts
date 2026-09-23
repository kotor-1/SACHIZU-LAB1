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
