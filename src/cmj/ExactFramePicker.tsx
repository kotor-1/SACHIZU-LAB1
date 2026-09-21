import { useEffect, useRef, useState } from 'react';
import { demuxMP4 } from '../frame-engine/mp4-demuxer';
import { WebCodecsExactDecoder } from '../frame-engine/exact-frame-decoder';
import { trackRotation } from './video-orientation';
import './exact-frame-picker.css';
export interface FirstContact { frame: number; pts: number }
interface PickerOwner {
  decoder: WebCodecsExactDecoder; pts: number[]; rotation: number;
  desired: number; decoding: boolean; closed: boolean;
}

/** Latest requested frame wins. Navigation remains mounted during decode;
 * registration is allowed only for the exact, fully displayed target frame. */
export default function ExactFramePicker({ file, disabled, getTime, instructions, frameLabel, registrations, initialTime, previewRegion }: {
  file: File; disabled: boolean; getTime: () => number; instructions: string; frameLabel: string;
  registrations: { label: string; value: FirstContact | null; onRegister: (contact: FirstContact) => void }[];
  initialTime?: number;
  previewRegion?: { left: number; top: number; right: number; bottom: number };
}) {
  const canvas = useRef<HTMLCanvasElement>(null), owner = useRef<PickerOwner | null>(null);
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [shown, setShown] = useState<FirstContact | null>(null), [target, setTarget] = useState(0);
  const [total, setTotal] = useState(0);
  useEffect(() => {
    let active = true; setReady(false); setShown(null); setTarget(0); setTotal(0); setBusy(false); setError('');
    void (async () => {
      try {
        if (!WebCodecsExactDecoder.isAvailable()) throw new Error('このブラウザでは正確なコマ送りができません。');
        if (file.size > 150 * 1024 * 1024) throw new Error('150MB以内の動画を選んでください。');
        const d = await demuxMP4(file); if (!active) return;
        if (!d.frames.length || d.frames.length > 3600 || d.frames.at(-1)!.pts - d.frames[0].pts > 30) throw new Error('30秒・3600フレーム以内の動画を選んでください。');
        const rotation = trackRotation((d.videoTrack as typeof d.videoTrack & { matrix?: ArrayLike<number> }).matrix);
        const decoder = new WebCodecsExactDecoder(file, d.videoTrack, d.frames, d.rawSamples, d.descriptionBuffer);
        decoder.setCacheLimit(3);
        owner.current = { decoder, pts: d.frames.map(f => f.pts), rotation, desired: 0, decoding: false, closed: false };
        setTotal(d.frames.length); setReady(true);
      } catch (e) { if (active) setError(e instanceof Error ? e.message : String(e)); }
    })();
    return () => {
      active = false;
      if (owner.current) { owner.current.closed = true; owner.current.decoder.dispose(); owner.current = null; }
    };
  }, [file]);
  useEffect(() => {
    if (!ready || initialTime === undefined || !Number.isFinite(initialTime)) return;
    const pts = owner.current?.pts; if (!pts?.length) return;
    const nearest = pts.reduce((best, t, i) => Math.abs(t - initialTime) < Math.abs(pts[best] - initialTime) ? i : best, 0);
    request(nearest);
  }, [ready, initialTime]);

  async function pump(current: PickerOwner) {
    if (current.decoding) return;
    current.decoding = true; setBusy(true);
    const owned = () => !current.closed && owner.current === current;
    try {
      while (owned()) {
        const index = current.desired;
        const r = await current.decoder.decodeExactFrame(index);
        if (!owned()) return;
        // A new button/slider request supersedes the intermediate image.
        if (index !== current.desired) continue;
        if (r.status !== 'SUCCESS' || r.actualDecodedFrameIndex !== index || !r.bitmap) throw new Error('このコマを正確に表示できません。別の位置を選んでください。');
        const image = r.bitmap, element = canvas.current, context = element?.getContext('2d');
        if (!element || !context) throw new Error('確認画像を表示できません。');
        const w = current.rotation % 180 ? image.height : image.width, h = current.rotation % 180 ? image.width : image.height;
        const crop = previewRegion;
        if (crop && (![crop.left, crop.top, crop.right, crop.bottom].every(Number.isFinite) || crop.left < 0 || crop.top < 0 || crop.right > 1 || crop.bottom > 1 || crop.right <= crop.left || crop.bottom <= crop.top)) throw new Error('足元の表示範囲を確認できません。');
        const x = crop ? crop.left * w : 0, y = crop ? crop.top * h : 0;
        const cw = crop ? (crop.right - crop.left) * w : w, ch = crop ? (crop.bottom - crop.top) * h : h;
        const scale = Math.min(1, 1280 / Math.max(cw, ch));
        element.width = Math.round(cw * scale); element.height = Math.round(ch * scale);
        context.translate((w / 2 - x) * scale, (h / 2 - y) * scale); context.rotate(current.rotation * Math.PI / 180); context.scale(scale, scale);
        context.drawImage(image, -image.width / 2, -image.height / 2); context.setTransform(1, 0, 0, 1, 0, 0);
        setShown({ frame: index, pts: current.pts[index] }); setError('');
        break;
      }
    } catch (e) { if (owned()) setError(e instanceof Error ? e.message : String(e)); }
    finally { current.decoding = false; if (owned()) setBusy(false); }
  }
  function request(index: number) {
    const current = owner.current; if (!current || disabled || current.closed) return;
    current.desired = Math.max(0, Math.min(current.pts.length - 1, Math.round(index)));
    setTarget(current.desired); setError(''); void pump(current);
  }
  function move(delta: number) { request((owner.current?.desired ?? 0) + delta); }
  function fromVideo() {
    const pts = owner.current?.pts; if (!pts) return;
    const time = getTime(), next = pts.findIndex(t => t > time);
    request(next < 0 ? pts.length - 1 : Math.max(0, next - 1));
  }
  const canRegister = !!shown && !busy && !error && shown.frame === target && !disabled;
  return <div className="exact-picker">
    <div className="exact-picker-heading"><strong>{registrations.length ? 'コマ送り・登録' : '足元のコマ確認'}</strong>{registrations.length > 0 && <span>{registrations.filter(r => r.value).length} / {registrations.length} 点登録済み</span>}</div>
    <p className="exact-picker-instructions">{instructions}</p>
    <button className="exact-picker-sync" disabled={disabled || !ready} onClick={fromVideo}>この再生位置をコマ送りで確認</button>
    <div className="exact-picker-stage" tabIndex={0} aria-label={frameLabel + 'の操作'} aria-busy={busy}
      onKeyDown={e => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); move((e.key === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 5 : 1)); }
      }}>
      <canvas ref={canvas} aria-label={frameLabel} hidden={!shown} data-frame={shown?.frame} />
      {!shown && <div className="exact-picker-placeholder">{ready ? '再生位置を取り込むか、シークバーで位置を選択' : 'コマ送りを準備しています…'}</div>}
      {busy && <span className="exact-picker-loading" role="status">フレーム {target + 1} を表示中…</span>}
    </div>
    <div className="exact-picker-position" aria-live="polite">
      <strong>{shown ? '表示フレーム ' + (shown.frame + 1) + ' / ' + total : '未選択'}</strong>
      <span>{shown ? shown.pts.toFixed(4) + ' 秒' : ''}{busy ? ' · 移動先 ' + (target + 1) : ''}</span>
    </div>
    <label className="exact-picker-seek">シークバー
      <input aria-label="コマ送りシークバー" type="range" min={1} max={Math.max(1, total)} step={1} value={target + 1}
        disabled={disabled || !ready} onChange={e => request(Number(e.target.value) - 1)} />
    </label>
    <div className="exact-picker-navigation">
      <button disabled={disabled || !ready || target === 0} onClick={() => move(-5)}>5コマ前</button>
      <button disabled={disabled || !ready || target === 0} onClick={() => move(-1)}>1コマ前</button>
      <button disabled={disabled || !ready || target >= total - 1} onClick={() => move(1)}>1コマ後</button>
      <button disabled={disabled || !ready || target >= total - 1} onClick={() => move(5)}>5コマ後</button>
    </div>
    <small className="exact-picker-hint">← → で1コマ、Shift＋← → で5コマ。読み込み中も次の位置を指定できます。</small>
    <div className="exact-picker-registrations">
      {registrations.map((r, i) => <div key={r.label} className={r.value ? 'is-registered' : ''}>
        <button disabled={!canRegister} onClick={() => { if (canRegister && shown) r.onRegister({ ...shown }); }}>{r.label}</button>
        {r.value ? <button className="exact-picker-revisit" disabled={disabled || !ready} aria-label={'登録点' + (i + 1) + 'を見る'} onClick={() => request(r.value!.frame)}>
          登録済み {r.value.pts.toFixed(4)}秒 · F{r.value.frame + 1} ↗</button> : <span>未登録</span>}
      </div>)}
    </div>
    {error && <p role="alert" className="exact-picker-error">{error}</p>}
  </div>;
}
