import { describe, expect, it } from 'vitest';
import {
  MAX_TOE_CYCLE_IMPORT_BYTES, parseToeCycleImport, ToeCycleImportError,
  type ToeCycleImportErrorCode,
} from '../src/rebound/toe-cycle-import';

function saved(version = 'rj-toe-constrained-cycle-v2-research') {
  return { version: 'rj-toe-cycle-export-v1', observationModel: 'full', manualInputsUsed: false, videoUploaded: false,
    result: { version, filename: '両足RJ.mov', sourceVideoSHA256: 'a'.repeat(64), mean: 1234, cycles: [{ value: 1234 }] },
    pelvisComparison: { mean: 9876 },
    environment: { sourceFrames: 3, sourceBytes: 1024, userAgent: 'private diagnostic' },
    poses: Array.from({ length: 3 }, (_, frame) => ({ frame, pts: frame / 120,
      poses: [Array.from({ length: 33 }, (_, index) => ({ x: .4 + index / 100, y: .5, z: -.2, visibility: .99 }))] })) };
}
type Saved = ReturnType<typeof saved>;
function failure(text: string, code: ToeCycleImportErrorCode, bytes?: number) {
  let caught: unknown;
  try { parseToeCycleImport(text, bytes); } catch (error) { caught = error; }
  expect(caught).toBeInstanceOf(ToeCycleImportError);
  expect((caught as ToeCycleImportError).code).toBe(code);
}
function altered(change: (value: Saved) => void) { const value = saved(); change(value); return JSON.stringify(value); }

describe('saved toe-cycle observation import, without trusting stored results', () => {
  it.each(['rj-toe-constrained-cycle-v1-research', 'rj-toe-constrained-cycle-v2-research', 'rj-toe-constrained-cycle-v3-research'])(
    'accepts %s observations and returns no saved result or video verification', version => {
      const input = saved(version), text = JSON.stringify(input), result = parseToeCycleImport(text, new TextEncoder().encode(text).byteLength);
      expect(result).toEqual({ filename: input.result.filename, sourceBytes: 1024, sourceVideoSHA256: 'a'.repeat(64),
        sourceFrames: 3, poses: input.poses, observationModel: 'full', savedResultVersion: version,
        inputProvenance: 'SAVED_JSON', sourceVideoVerified: false, sourceVideoAvailable: false });
      expect(result).not.toHaveProperty('result'); expect(result).not.toHaveProperty('pelvisComparison');
      expect(result).not.toHaveProperty('mean'); expect(result).not.toHaveProperty('environment');
    },
  );

  it('discards all saved numerical results, manual/provenance claims, and unrecognized properties', () => {
    const input = saved(), text = JSON.stringify({ ...input, sourceVideoVerified: true, sourceVideoAvailable: true,
      inputProvenance: 'VIDEO', result: { ...input.result, mean: 'not a number', cycles: null, samples: 'untrusted' } });
    expect(parseToeCycleImport(text)).toEqual(parseToeCycleImport(JSON.stringify(input)));
  });

  it('retains missing detections, both candidates, low visibility and off-image normalized points without filtering', () => {
    const input = saved(); input.poses[0].poses = []; input.poses[1].poses.push(structuredClone(input.poses[1].poses[0]));
    input.poses[2].poses[0][0] = { x: -0.1, y: 1.2, z: -4, visibility: 0 };
    const result = parseToeCycleImport(JSON.stringify(input));
    expect(result.poses).toEqual(input.poses); expect(result.poses.map(f => f.poses.length)).toEqual([0, 2, 1]);
  });

  it('permits an all-missing trace instead of fabricating detections', () => {
    const text = altered(input => { for (const frame of input.poses) frame.poses = []; });
    expect(parseToeCycleImport(text).poses.map(frame => frame.poses)).toEqual([[], [], []]);
  });

  it('accepts the decoder limits including an offset start time and canonicalizes a hex identifier', () => {
    const input = saved(); input.environment.sourceFrames = 3600; input.environment.sourceBytes = 150 * 1024 * 1024;
    input.result.sourceVideoSHA256 = 'ABCDEF01'.repeat(8);
    input.poses = Array.from({ length: 3600 }, (_, frame) => ({ frame, pts: 5 + 30 * frame / 3599, poses: [] }));
    const result = parseToeCycleImport(JSON.stringify(input));
    expect(result.poses).toHaveLength(3600); expect(result.poses.at(-1)?.pts).toBe(35);
    expect(result.sourceVideoSHA256).toBe('abcdef01'.repeat(8));
  });

  it('accepts a single observed source frame but leaves usefulness to the model', () => {
    const input = saved(); input.poses.length = 1; input.environment.sourceFrames = 1;
    expect(parseToeCycleImport(JSON.stringify(input)).poses).toHaveLength(1);
  });

  it('supports a leading UTF-8 BOM and File.text() BOM removal without claiming identity', () => {
    const text = JSON.stringify(saved()), bytes = new TextEncoder().encode(text).byteLength;
    expect(parseToeCycleImport('\ufeff' + text, bytes + 3)).toEqual(parseToeCycleImport(text, bytes + 3));
  });

  it('does not merge prototype properties or retain unexpected landmark fields', () => {
    const input = saved();
    const text = JSON.stringify(input).replace('"x":0.4', '"__proto__":{"polluted":true},"presence":0.7,"x":0.4');
    expect(parseToeCycleImport(text).poses).toEqual(input.poses);
    expect(Object.prototype).not.toHaveProperty('polluted');
  });

  it('checks the optional file size before JSON parsing', () => {
    failure('{broken', 'IMPORT_TOO_LARGE', MAX_TOE_CYCLE_IMPORT_BYTES + 1);
  });
  it.each([-1, 1.2, Infinity, NaN])('rejects invalid declared byte length %s', size => {
    failure(JSON.stringify(saved()), 'IMPORT_INVALID_BYTE_LENGTH', size);
  });
  it('checks actual UTF-8 bytes even when the declared size is smaller', () => {
    const text = JSON.stringify({ padding: 'あ'.repeat(Math.ceil(MAX_TOE_CYCLE_IMPORT_BYTES / 3)) });
    expect(text.length).toBeLessThan(MAX_TOE_CYCLE_IMPORT_BYTES);
    failure(text, 'IMPORT_TOO_LARGE', 1);
  });
  it('rejects a too-long string before parsing', () => {
    failure(' '.repeat(MAX_TOE_CYCLE_IMPORT_BYTES + 1), 'IMPORT_TOO_LARGE');
  });
  it.each(['', '{', 'null', '[]', '1'])('rejects invalid/unsupported JSON %s', text => {
    failure(text, ['', '{'].includes(text) ? 'IMPORT_INVALID_JSON' : 'IMPORT_UNSUPPORTED_EXPORT');
  });
  it('rejects non-string input at the runtime boundary', () => {
    expect(() => parseToeCycleImport(null as unknown as string)).toThrow(ToeCycleImportError);
  });

  it.each([
    (input: Saved) => { input.version = 'other'; },
    (input: Saved) => { input.observationModel = 'heavy'; },
    (input: Saved) => { input.manualInputsUsed = true; },
    (input: Saved) => { input.videoUploaded = true; },
  ])('rejects a different export contract', change => { failure(altered(change), 'IMPORT_UNSUPPORTED_EXPORT'); });
  it('rejects unknown result versions', () => {
    failure(altered(input => { input.result.version = 'future'; }), 'IMPORT_UNSUPPORTED_RESULT');
  });
  it.each(['', ' ', 'a'.repeat(1025), 'bad\0name.mov', 'bad\nname.mov'])('rejects invalid filename %j', name => {
    failure(altered(input => { input.result.filename = name; }), 'IMPORT_INVALID_METADATA');
  });
  it.each(['', 'a'.repeat(63), 'g'.repeat(64), 'a'.repeat(65)])('rejects invalid SHA-256 identifier %s', hash => {
    failure(altered(input => { input.result.sourceVideoSHA256 = hash; }), 'IMPORT_INVALID_METADATA');
  });
  it.each([0, -1, .5, 150 * 1024 * 1024 + 1, Number.MAX_SAFE_INTEGER + 1])('rejects source byte count %s', bytes => {
    failure(altered(input => { input.environment.sourceBytes = bytes; }), 'IMPORT_INVALID_METADATA');
  });
  it.each([0, -1, 2, 3.5, 3601])('rejects invalid or inconsistent source frame count %s', frames => {
    failure(altered(input => { input.environment.sourceFrames = frames; }), 'IMPORT_INVALID_FRAME_COUNT');
  });
  it('rejects empty observations', () => {
    failure(altered(input => { input.poses = []; input.environment.sourceFrames = 0; }), 'IMPORT_INVALID_FRAME_COUNT');
  });
  it.each([-1, .5, 1, 99])('requires zero-based contiguous source frame numbering: first=%s', frame => {
    failure(altered(input => { input.poses[0].frame = frame; }), 'IMPORT_INVALID_FRAME_SEQUENCE');
  });
  it('rejects skipped frames instead of renumbering them', () => {
    failure(altered(input => { input.poses[2].frame = 3; }), 'IMPORT_INVALID_FRAME_SEQUENCE');
  });
  it.each([-1, 0, -0.1, NaN, Infinity])('rejects non-increasing/nonfinite source time %s', pts => {
    failure(altered(input => { input.poses[1].pts = pts; }), 'IMPORT_INVALID_TIMESTAMPS');
  });
  it('rejects time span beyond 30 seconds', () => {
    failure(altered(input => { input.poses[2].pts = 30.0001; }), 'IMPORT_INVALID_TIMESTAMPS');
  });
  it('rejects an overflowed numeric JSON timestamp', () => {
    failure(JSON.stringify(saved()).replace('"pts":0', '"pts":1e309'), 'IMPORT_INVALID_TIMESTAMPS');
  });
  it('rejects more people than the acquisition model permits', () => {
    failure(altered(input => { input.poses[0].poses.push(input.poses[0].poses[0], input.poses[0].poses[0]); }), 'IMPORT_INVALID_POSES');
  });
  it.each([0, 32, 34])('requires exactly 33 points, not %s', count => {
    failure(altered(input => { input.poses[0].poses[0] = Array.from({ length: count }, () => input.poses[1].poses[0][0]); }), 'IMPORT_INVALID_POSES');
  });
  it.each(['x', 'y', 'z', 'visibility'] as const)('rejects missing/nonfinite %s instead of filling it', key => {
    failure(altered(input => { input.poses[0].poses[0][0][key] = NaN; }), 'IMPORT_INVALID_LANDMARK');
    const input = saved(), text = JSON.stringify(input);
    const point = input.poses[0].poses[0][0];
    const missing = Object.fromEntries(Object.entries(point).filter(([field]) => field !== key));
    failure(text.replace(JSON.stringify(point), JSON.stringify(missing)), 'IMPORT_INVALID_LANDMARK');
  });
  it.each([-0.01, 1.01])('rejects visibility outside [0,1]: %s', visibility => {
    failure(altered(input => { input.poses[0].poses[0][0].visibility = visibility; }), 'IMPORT_INVALID_LANDMARK');
  });
});
