import type { COMSample } from '../../src/cmj/center-of-mass';
import type { Stage1Observation } from '../../src/cmj/stage1-analysis';

/** Frozen before evaluating v1. These are observations, never contact labels. */
export const SYNTHETIC_PROTOCOL = 'cmj-stage1-synthetic-20260929-v1';
export const SYNTHETIC_SEED = 0x20260929;
export const SYNTHETIC_FPS = [30, 45, 60, 120, 240] as const;
export const SYNTHETIC_G = 9.80665;
export const NOISE_PROFILES = [
  ...[0, 1, 3].flatMap(pointPx => [0, 1, 3].map(edgePx => ({
    id: `independent-point${pointPx}-edge${edgePx}`, pointPx, edgePx, correlated: false,
  }))),
  ...[1, 3].map(px => ({ id: `correlated-point${px}-edge${px}`, pointPx: px, edgePx: px, correlated: true })),
] as const;

export type NoiseProfile = (typeof NOISE_PROFILES)[number];
export type Stress = 'none' | 'phase' | 'left-first' | 'heel-only' | 'sole-missing' |
  'com-missing' | 'invalid-time' | 'time-gap' | 'decimated' | 'feet-overlap';
export interface SyntheticFixture {
  id: string;
  archiveAuditId: string | null;
  suite: 'matrix' | 'stress';
  condition: { T: number; p: number; fps: number; phase: number; stress: Stress; noise: NoiseProfile };
  truth: { takeoff: number | null; apex: number | null; landing: number | null; heightCm: number; isJump: boolean };
  observations: Stage1Observation[];
}

function seedFor(text: string): number {
  let hash = SYNTHETIC_SEED;
  for (const char of text) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}
function random(seed: number): () => number {
  let state = seed;
  return () => {
    state += 0x6d2b79f5;
    let value = Math.imul(state ^ state >>> 15, 1 | state);
    value ^= value + Math.imul(value ^ value >>> 7, 61 | value);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}
function normal(draw: () => number): number {
  return Math.sqrt(-2 * Math.log(Math.max(Number.EPSILON, draw()))) * Math.cos(2 * Math.PI * draw());
}

/** Exactly the final smooth-force block of scripts/cmj-numerical-audit.mjs at phase 0. */
export function smoothForceCOM(T: number, p: number, fps: number, phase = 0): COMSample[] {
  const G = SYNTHETIC_G, v = Math.sqrt(.6 * G), scale = .003, t0 = 1.2;
  const lambda = G * T / v;
  const integral = (u: number) => (p + 1 + lambda) * u ** (p + 1) / (p + 1) - (p + lambda) * u ** (p + 2) / (p + 2);
  const depth = v * T * integral(1) / scale;
  return Array.from({ length: Math.round(2.6 * fps) + 1 }, (_, frame) => {
    const pts = (frame + phase) / fps, u = (pts - (t0 - T)) / T;
    let y = 500;
    if (pts > t0 - T - .3 && u < 0) y += depth * (1 - Math.cos(Math.PI * (pts - (t0 - T - .3)) / .3)) / 2;
    else if (u >= 0 && u < 1) y = 500 + depth - v * T * integral(u) / scale;
    else if (u >= 1) y = Math.min(500, 500 - v * (pts - t0) / scale + .5 * G * (pts - t0) ** 2 / scale);
    return { frame, pts, comX: 480, comY: y, bodyScale: 400 };
  });
}

export function makeSyntheticFixture(options: {
  T?: number; p?: number; fps?: number; phase?: number; noise?: NoiseProfile; stress?: Stress;
} = {}): SyntheticFixture {
  const { T = .25, p = 3, fps = 120, phase = 0, noise = NOISE_PROFILES[0], stress = 'none' } = options;
  const departure = 1.2, velocity = Math.sqrt(.6 * SYNTHETIC_G), apex = departure + velocity / SYNTHETIC_G;
  const landing = departure + 2 * velocity / SYNTHETIC_G, floor = 850, scale = .003;
  const draw = random(seedFor(`${T}/${p}/${fps}/${phase}/${stress}`));
  let sharedError = normal(draw);
  let observations: Stage1Observation[] = smoothForceCOM(T, p, fps, phase).map(sample => {
    // AR(1), rho=.8, common to both feet and all channels for correlated cases.
    // Independent draws are still consumed in every profile, retaining paired comparisons.
    sharedError = .8 * sharedError + .6 * normal(draw);
    const feet = [0, 1].map(side => {
      const footDeparture = departure - (stress === 'left-first' && side === 0 ? .008 : 0);
      const footLanding = landing + (stress === 'left-first' && side === 0 ? .008 : 0);
      const elapsed = sample.pts - footDeparture;
      const normalizedFlight = elapsed / (footLanding - footDeparture);
      const lift = stress === 'heel-only' || normalizedFlight <= 0 || normalizedFlight >= 1
        ? 0 : .3 * 4 * normalizedFlight * (1 - normalizedFlight) / scale;
      const heelRise = sample.pts < footDeparture
        ? 18 * Math.max(0, Math.min(1, (sample.pts - footDeparture + .16) / .16))
        : stress === 'heel-only' ? 18 * Math.max(0, 1 - elapsed / .3) : 18 * Math.max(0, 1 - elapsed / .08);
      const toeSoleY = floor - lift, heelSoleY = toeSoleY - heelRise;
      const toeX = 435 + side * 105, heelX = toeX - 60;
      const errors = Array.from({ length: 5 }, () => normal(draw));
      const error = (index: number, amplitude: number) => amplitude * (noise.correlated ? sharedError : errors[index]);
      const edgeCenter = Math.max(toeSoleY, heelSoleY) + error(4, noise.edgePx);
      return {
        edge: [edgeCenter - 1, edgeCenter + 1] as [number, number],
        toe: { x: toeX + error(0, noise.pointPx), y: toeSoleY - 8 + error(1, noise.pointPx), visibility: 1 },
        heel: { x: heelX + error(2, noise.pointPx), y: heelSoleY - 10 + error(3, noise.pointPx), visibility: 1 },
      };
    }) as Stage1Observation['feet'];
    const row: Stage1Observation = { ...sample, feet };
    if (stress === 'heel-only') row.comY = 500 - 6 * Math.exp(-(((sample.pts - departure) / .18) ** 2));
    if (stress === 'com-missing' && Math.abs(sample.pts - apex) <= .025) {
      row.comY = null; row.reason = 'SYNTHETIC_COM_OCCLUDED';
    }
    if ((stress === 'sole-missing' && Math.abs(sample.pts - departure) <= .05) ||
      (stress === 'feet-overlap' && sample.pts >= departure - .12 && sample.pts <= landing + .05)) {
      row.feet = feet.map(foot => ({ ...foot, edge: null, reason: stress === 'feet-overlap' ? 'FEET_OVERLAP' : 'SOLE_OCCLUDED' })) as Stage1Observation['feet'];
    }
    return row;
  });
  if (stress === 'invalid-time') {
    const index = observations.findIndex(row => row.pts >= departure);
    observations[index] = { ...observations[index], pts: observations[index - 1].pts };
  }
  if (stress === 'time-gap') observations = observations.filter(row => row.pts < departure - .05 || row.pts > departure + .12);
  // Retain source frame numbers and PTS; this is deliberately not re-timed footage.
  if (stress === 'decimated') observations = observations.filter(row => row.frame % 3 !== 1);
  const archiveAuditId = stress === 'none' && phase === 0 && noise.pointPx === 0 && noise.edgePx === 0 && fps <= 60
    ? `audit54-T${T}-fps${fps}-p${p}` : null;
  return {
    id: `T${T}-p${p}-fps${fps}-phase${phase}-${noise.id}-${stress}`,
    archiveAuditId, suite: stress === 'none' ? 'matrix' : 'stress',
    condition: { T, p, fps, phase, noise, stress },
    truth: { takeoff: stress === 'heel-only' ? null : departure, apex: stress === 'heel-only' ? null : apex,
      landing: stress === 'heel-only' ? null : landing, heightCm: stress === 'heel-only' ? 0 : 30, isJump: stress !== 'heel-only' },
    observations,
  };
}

export function* stage1SyntheticFixtures(): Generator<SyntheticFixture> {
  for (const T of [.15, .25, .35]) for (const fps of SYNTHETIC_FPS) for (const p of [1, 2, 3, 4, 5, 6]) {
    for (const noise of NOISE_PROFILES) yield makeSyntheticFixture({ T, p, fps, noise });
  }
  // Phase .37 is intentionally a separate, noiseless 90-condition stress suite.
  for (const T of [.15, .25, .35]) for (const fps of SYNTHETIC_FPS) for (const p of [1, 2, 3, 4, 5, 6]) {
    yield makeSyntheticFixture({ T, p, fps, phase: .37, stress: 'phase' });
  }
  for (const fps of SYNTHETIC_FPS) for (const stress of [
    'left-first', 'heel-only', 'sole-missing', 'com-missing', 'invalid-time', 'time-gap', 'decimated', 'feet-overlap',
  ] as const) yield makeSyntheticFixture({ fps, stress });
}
