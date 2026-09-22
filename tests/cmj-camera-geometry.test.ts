import { describe, expect, it } from 'vitest';
import { cameraConstraints, cameraDimensions } from '../src/cmj/camera-geometry';

describe('camera geometry', () => {
  it('does not force portrait capture constraints or a crop', () => {
    const constraints = cameraConstraints({ resizeMode: true });
    expect(constraints).toMatchObject({ audio: false, video: { facingMode: { ideal: 'environment' }, resizeMode: 'none' } });
    expect(constraints.video).not.toHaveProperty('width');
    expect(constraints.video).not.toHaveProperty('height');
    expect(constraints.video).not.toHaveProperty('aspectRatio');
    expect(cameraConstraints().video).not.toHaveProperty('resizeMode');
  });
  it('uses delivered dimensions unchanged in either orientation, not screen or track settings', () => {
    expect(cameraDimensions({ videoWidth: 480, videoHeight: 640 })).toEqual({ w: 480, h: 640 });
    expect(cameraDimensions({ videoWidth: 640, videoHeight: 480 })).toEqual({ w: 640, h: 480 });
    expect(cameraDimensions({ videoWidth: 0, videoHeight: 0 })).toBeNull();
  });
});
