import { expect, it } from 'vitest';
import { buildPresentationTimeline, type MP4Sample, type MP4VideoTrack } from '../src/frame-engine/mp4-demuxer';
import { buildDisplayTimelineForFrameGridFps } from '../src/frame-engine/display-timeline';

const track: MP4VideoTrack = { id: 1, codec: 'avc1.42c01f', track_width: 404, track_height: 720,
  timescale: 60000, duration: 1684, nb_samples: 720 };
const samples: MP4Sample[] = Array.from({ length: 720 }, (_, i) => ({
  track_id: 1, number: i, cts: i * 1000, dts: i * 1000, duration: 1000,
  is_sync: i === 0, offset: i * 10, size: 10,
}));
it('uses encoded sample ends for short-header camera recordings without changing timestamps', () => {
  const timeline = buildPresentationTimeline(track, samples);
  expect(timeline.presentationDuration).toBe(12);
  expect(timeline.frames.map(f => f.pts)).toEqual(samples.map(s => s.cts / 60000));
  const display = buildDisplayTimelineForFrameGridFps(timeline.frames, timeline.presentationDuration, timeline.detectedFrameGridFps, track.timescale);
  expect(display.frames).toHaveLength(720);
});
it('also handles zero header duration and a nonzero timestamp origin', () => {
  const timeline = buildPresentationTimeline({ ...track, duration: 0 }, samples.map(s => ({ ...s, cts: s.cts + 5000, dts: s.dts + 5000 })));
  expect(timeline.presentationDuration).toBe(12);
  expect(timeline.frames[0].pts).toBe(0); expect(timeline.frames.at(-1)?.pts).toBeCloseTo(719 / 60);
});
it('does not extend an explicitly trimmed edit window to include later samples', () => {
  const timeline = buildPresentationTimeline({ ...track, movie_timescale: 1000,
    edits: [{ segment_duration: 1000, media_time: 60000, media_rate_integer: 1, media_rate_fraction: 0 }] }, samples);
  expect(timeline.presentationDuration).toBe(1); expect(timeline.frames).toHaveLength(60);
  expect(timeline.frames.at(-1)?.rawCts).toBe(119000);
});
