// A synthetic crouch start filmed from the side, 240 fps, 1920x1080, running to the right: three contacts after the
// blocks; RTMPose's pose (refined) a copy of MediaPipe's. Shared by tests of the skeleton's points.
import type { CrouchFrame, CrouchPoint } from '../src/sprint10/crouch';

export const W = 1920, H = 1080;
export function syntheticRun(): CrouchFrame[] {
  const frames: CrouchFrame[] = [];
  const contacts = [[.76, .93, 700], [.98, 1.13, 950], [1.19, 1.33, 1230]];
  for (let frame = 0; frame / 240 <= 1.5; frame++) {
    const t = frame / 240, at = (side: number) => {
      const mine = [{ from: -1, to: side ? .7 : .55, x: side ? 480 : 400 }, ...contacts.filter((_, i) => i % 2 === side).map(([from, to, x]) => ({ from, to, x }))];
      const i = mine.findIndex(s => t >= s.from && t <= s.to);
      if (i >= 0) return { x: mine[i].x, y: 800 };
      const prev = [...mine].reverse().find(s => s.to < t), next = mine.find(s => s.from > t);
      if (!prev) return { x: mine[0].x, y: 800 };
      if (!next) return { x: prev.x + 1500 * (t - prev.to), y: 800 - 60 * Math.sqrt(Math.min(1, (t - prev.to) / .15)) };
      const s = (t - prev.to) / (next.from - prev.to);
      return { x: prev.x + (next.x - prev.x) * s, y: 800 - 60 * Math.sqrt(Math.sin(Math.PI * s)) };
    };
    const dt = Math.max(0, t - .5), toes = [at(0), at(1)];
    const hip = { x: Math.min(500 + 300 * dt + 900 * dt * dt, Math.max(500, (toes[0].x + toes[1].x) / 2 + 120)), y: Math.max(600, 650 - 200 * dt) };
    const lean = (t < .5 ? 110 : Math.max(45, 110 - 130 * dt)) * Math.PI / 180;
    const p: CrouchPoint[] = Array.from({ length: 33 }, () => ({ x: hip.x / W, y: (hip.y - 150) / H, visibility: .9 }));
    const put = (k: number, x: number, y: number) => { p[k] = { x: x / W, y: y / H, visibility: .9 }; };
    put(11, hip.x + 200 * Math.sin(lean), hip.y - 200 * Math.cos(lean)); put(12, hip.x + 204 * Math.sin(lean), hip.y - 198 * Math.cos(lean));
    put(23, hip.x, hip.y); put(24, hip.x + 4, hip.y + 2);
    toes.forEach((toe, side) => {
      const heel = { x: toe.x - 50, y: toe.y - 15 }, ankle = { x: heel.x + 10, y: heel.y - 25 };
      put(25 + side, (hip.x + ankle.x) / 2 + 35, (hip.y + ankle.y) / 2); put(27 + side, ankle.x, ankle.y); put(29 + side, heel.x, heel.y); put(31 + side, toe.x, toe.y);
    });
    frames.push({ frame, pts: t, pose: p, refined: p.map(q => ({ ...q })) });
  }
  return frames;
}
