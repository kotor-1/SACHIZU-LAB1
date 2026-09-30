import { useEffect, useRef, useState } from 'react';
import { FileJson, Upload } from 'lucide-react';
import { measureRecording, supportsExactRecording } from '../cmj/recording-session';
import type { PoseFrame } from './prediction-observations';
import { predictionSignals } from './prediction-observations';
import { AUTOMATIC_REGION } from './automatic-foot';
import { wholeCycleReport } from './whole-cycle-research';
import { toeCycleReport } from './toe-cycle-research';
import { createLowerSubjectSelector } from './lower-body';
import { measureSoleBoxes, soleBoxes, soleContactReport, soleRegion, SOLE_CONTACT_SETTINGS, type SoleContactReport, type SoleFrame } from './sole-contact';
import { parseToeCycleImport, MAX_TOE_CYCLE_IMPORT_BYTES } from './toe-cycle-import';
import PoseReplay from './PoseReplay';
import './rebound.css';

type Report = ReturnType<typeof toeCycleReport>;
type Observation = { file: File | null; filename: string; sourceBytes: number; hash: string;
  poses: PoseFrame[]; soles: SoleFrame[] | null; origin: 'VIDEO' | 'SAVED_JSON' };
export const TOE_CYCLE_PRESENTATION_VERSION = 'rj-toe-cycle-presentation-v7';
const fmt = (v: number | null | undefined, digits = 2) => v == null ? '—' : v.toFixed(digits);
const reasons: Record<string, string> = {
  TRACKING_GAP: 'つま先の追跡が不足', TOE_TRACKING_GAP: 'つま先の追跡が不足',
  INSUFFICIENT_MOTION: 'つま先の上下動が小さい', WAVEFORM_MISMATCH: 'つま先の軌跡がモデルと合わない',
  INSUFFICIENT_PEAKS: '周期を作る頂点が不足', FRAME_RATE_TOO_LOW: '元動画のフレームレートが不足',
  PERIOD_OUT_OF_RANGE: '周期が条件外', INVALID_TIMELINE: '動画の時刻が不正',
  LEFT_TOE_TRACKING_GAP: '左つま先の追跡が不足', RIGHT_TOE_TRACKING_GAP: '右つま先の追跡が不足',
  LEFT_TOE_INSUFFICIENT_MOTION: '左つま先の上下動が小さい', RIGHT_TOE_INSUFFICIENT_MOTION: '右つま先の上下動が小さい',
  TOE_WAVEFORM_MISMATCH: 'つま先の軌跡がモデルと合わない', TOES_DISAGREE: '左右のつま先で推定が一致しない',
  TOE_WAVEFORM_UNIDENTIFIABLE: 'つま先の軌跡から時間割合を絞れない', LOWER_SCALE_UNAVAILABLE: '下肢の追跡が不足',
  BILATERAL_FLIGHT_UNRESOLVED: '左右の軌跡から共通の空中区間を推定できない',
  LOWER_POINTS_UNAVAILABLE: '下肢の追跡が不足', INSUFFICIENT_SAMPLES: '動画のコマ数が不足',
  PELVIS_TRACKING_GAP: '骨盤の追跡が不足', PELVIS_WAVEFORM_MISMATCH: '骨盤の軌跡がモデルと合わない',
  PELVIS_SUBJECT_DRIFT: '頂点は残していますが、横移動が大きいためRSIは計算保留', PELVIS_INSUFFICIENT_EXCURSION: '骨盤の上下動が小さい',
  APEX_RECORDING_EDGE: '録画端で左右の上昇・下降の軌跡を確認できない',
  APEX_NO_BILATERAL_RISE_FALL: '左右のつま先にそろった上昇・下降が見られない',
  APEX_LEFT_TOE_GAP: '左つま先の確認用軌跡が不足', APEX_RIGHT_TOE_GAP: '右つま先の確認用軌跡が不足',
  APEX_PERIOD_UNAVAILABLE: '頂点の確認に必要な周期が不足', APEX_SCALE_UNAVAILABLE: '下肢の大きさを確認できない',
  APEX_INVALID_OBSERVATIONS: '頂点確認用の骨格・時刻が不正',
  SOLE_OBSERVATIONS_UNAVAILABLE: '靴底の画像データがありません（以前の保存JSONなど）。動画から解析し直してください',
  SOLE_OBSERVATIONS_INVALID: '靴底の画像データの時刻が不正', SOLE_EDGE_GAP: '離地・着地の付近で靴底の輪郭が途切れた',
  SOLE_TAKEOFF_UNRESOLVED: '靴底が床から離れる瞬間を確認できない', SOLE_LANDING_UNRESOLVED: '靴底が床に着く瞬間を確認できない',
  SOLE_EVENT_FAR_FROM_MODEL: '靴底の離地・着地がつま先の軌跡と大きく食い違う', SOLE_CONTACT_OUT_OF_RANGE: '接地時間が条件外',
  SOLE_CONTACT_INSUFFICIENT_CYCLES: `靴底で接地を測れた周期が${SOLE_CONTACT_SETTINGS.minimumCycles}未満。靴と床の色が近い・足元が暗い・両足が重なる場合に起こります`,
  MODEL_CONTACT_UNAVAILABLE: 'つま先の軌跡から接地の目安を作れない', NO_ACCEPTED_TOE_CYCLES: 'つま先の軌跡から計算できる周期がない',
};
export function ToeCycleResults({ report: r, sole, pelvisMean }: { report: Report; sole: SoleContactReport; pelvisMean: number | null }) {
  const byId = new Map(sole.cycles.map(c => [c.id, c]));
  const reason = sole.mean === null ? (r.mean === null ? r.reason : sole.reason) : null;
  return <section aria-label="つま先軌跡によるRJ予測結果">
    <div className="rj-auto-headline">
      <p>平均RSI（推定）</p>
      <strong data-testid="toe-cycle-rsi">{fmt(sole.mean)} <small>m/s</small></strong>
      <p>靴底で接地を測れた周期 {sole.measuredCycles} / {r.totalCycles} · 解析対象 {r.detected} 頂点{sole.meanContactSeconds !== null && ` · 平均接地 ${Math.round(sole.meanContactSeconds * 1000)} ms`}</p>
      <p data-testid="toe-cycle-model">解析 v5 · 離地・着地を靴底の画像で測定（周期の型 v3・頂点選択 v4）</p>
    </div>
    {reason !== null && <p role="alert" className="rj-warning">{reasons[reason ?? ''] ?? reason ?? 'この動画では予測を算出できませんでした。下の各周期の理由を確認してください。'}。数値を0や過去の平均、つま先の型だけの値で補っていません。</p>}
    {sole.mean !== null && sole.measuredCycles < r.totalCycles && <p className="rj-warning">全周期の平均ではありません。算出周期：{sole.measuredCycleIds.join('・') || 'なし'}。</p>}
    {!!r.excludedCandidateIndices.length && <p className="rj-warning">骨盤の候補 {r.candidateDetected} 箇所のうち、前後の両足軌跡を確認できない {r.excludedCandidateIndices.length} 箇所は集計対象外です。実際に跳んでいないと断定した数ではありません。</p>}
    {!!r.unresolvedCandidateIndices.length && <p className="rj-warning">追跡不足などで頂点確認を保留した候補があります。候補を消さず、各周期の計算条件でも確認します。</p>}
    <p className="rj-warning">精度未検証の推定です。接地時間は靴底が床から離れる・床に着く瞬間を画像から測った値で、測定器の実測値ではありません。PUSHなど他の機器とは定義や集計が異なります。</p>
    {!!r.boundaryCycles.length && <p className="rj-warning">つま先の型が探索範囲の端に達した周期：{r.boundaryCycles.join('・')}。周期の区切りが不安定な可能性があります。</p>}
    {!!r.phaseBoundaryCycles.length && <p className="rj-warning">骨盤とつま先のタイミング差が探索範囲の端に達した周期：{r.phaseBoundaryCycles.join('・')}。接地の目安を十分に絞れていない可能性があります。</p>}
    <details><summary>各周期の値・算出できなかった理由</summary>
      <div style={{ overflowX: 'auto' }}><table className="rj-table"><thead><tr><th>頂点間</th><th>周期 秒</th><th>接地 ms</th><th>RSI推定 m/s</th><th>型のみ m/s</th><th>状態</th></tr></thead><tbody>
        {r.cycles.map(c => { const s = byId.get(c.id); return <tr key={c.id}><th>{c.fromPeak}→{c.toPeak}</th><td>{fmt(c.period, 3)}</td>
          <td>{s?.contactSeconds != null ? Math.round(s.contactSeconds * 1000) : '—'}</td><td>{fmt(s?.value)}</td><td>{fmt(c.result?.value)}</td>
          <td>{c.reason ? reasons[c.reason] ?? c.reason : s?.reason ? reasons[s.reason] ?? s.reason : '靴底で測定'}</td></tr>; })}
      </tbody></table></div>
    </details>
    <details><summary>解析対象にした頂点・対象外の理由</summary>
      <p>全候補の前後で左右のつま先の上昇・下降を確認します。対象外の候補を飛び越えて周期を作りません。</p>
      <div style={{ overflowX: 'auto' }}><table className="rj-table"><thead><tr><th>骨盤候補</th><th>時刻 秒</th><th>状態</th></tr></thead><tbody>
        {r.apexChecks.map(c => <tr key={c.candidateIndex}><th>{c.candidateIndex + 1}</th><td>{fmt(c.apex.pts, 3)}</td>
          <td>{c.reason ? `${c.included ? '確認保留・候補を維持' : '集計対象外'}：${reasons[c.reason] ?? c.reason}` : '両足の軌跡が条件を満たす候補'}</td></tr>)}
      </tbody></table></div>
    </details>
    <details><summary>測り方の詳細</summary>
      <p>骨盤の頂点で周期を区切り、つま先の軌跡に当てはめた型から接地の目安を作ります。その前後で、骨格から決めた足元の小さな範囲だけ靴の輪郭を調べ、靴底の一番下が速く上がり始めた瞬間を離地、速い下降が止まった瞬間を着地とします。踵が上がってつま先で床を押している間は、靴底はゆっくりしか動かないため離地に数えません。両足のうち最初に着いた足から最後に離れた足までを接地時間とし、周期から接地時間を引いた時間を滞空として、高さ＝g×滞空²÷8、RSI＝高さ÷接地時間を周期ごとに計算して平均します。</p>
      <p>靴底の輪郭を確認できない周期は、つま先の型の値で補わずに集計から外します。数値モデル：靴底接地 v1（{SOLE_CONTACT_SETTINGS.version}）。</p>
    </details>
    <details><summary>つま先の型だけの値（参考）</summary>
      <p>つま先の型だけで計算した平均：<span data-testid="toe-cycle-template">{fmt(r.mean)}</span> m/s。つま先の骨格点は踵が上がると床に着いたまま上がり始めるため、離地を早く取り、高めに出る傾向があります。</p>
      <p>型の設定による候補幅：<span data-testid="toe-cycle-range">{r.meanProfileRange ? `${fmt(r.meanProfileRange[0])}～${fmt(r.meanProfileRange[1])}` : '—'} m/s</span>。信頼区間・誤差保証ではありません。</p>
      <p>同じ骨格データの従来の骨盤モデル：{fmt(pelvisMean)} m/s。高い方を正解として選んだり、値を混ぜたりしていません。隣接する対象頂点間を1周期とします。各跳躍の実測RSIや「最後3回平均」と同じ集計ではありません。</p>
    </details>
  </section>;
}

/** Reads only the two shoe boxes of each decoded source frame, for the same
 * subject the toe model will select (identical selector, frame order). */
function soleMeter() {
  const select = createLowerSubjectSelector({ left: 0, right: 1, top: 0, bottom: 1 }, 'BOTH', { allowSmallInitialSubject: true });
  const canvas = document.createElement('canvas'), context = canvas.getContext('2d', { willReadFrequently: true });
  const height = SOLE_CONTACT_SETTINGS.imageHeight;
  return (bitmap: ImageBitmap, rotation: number, poses: PoseFrame['poses'], frame: number, pts: number): SoleFrame => {
    const selected = select(poses, pts), portrait = rotation % 180 !== 0;
    const w = portrait ? bitmap.height : bitmap.width, h = portrait ? bitmap.width : bitmap.height, scale = height / h;
    const width = Math.round(w * scale), boxes = soleBoxes(selected.length === 1 ? selected[0] : null, width, height);
    const region = soleRegion(boxes, width, height);
    if (!context || !region) return { frame, pts, feet: [null, null] };
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.translate(width / 2, height / 2); context.rotate(rotation * Math.PI / 180); context.scale(scale, scale);
    context.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2); context.setTransform(1, 0, 0, 1, 0, 0);
    const rgba = context.getImageData(region.x, region.y, region.width, region.height).data, pixels = new Uint8Array(region.width * region.height);
    for (let i = 0; i < pixels.length; i++) pixels[i] = (77 * rgba[i * 4] + 150 * rgba[i * 4 + 1] + 29 * rgba[i * 4 + 2]) >> 8;
    return { frame, pts, feet: measureSoleBoxes({ width: region.width, height: region.height, pixels, rgba }, boxes, region.x, region.y) };
  };
}

export default function ToeCycleLab() {
  const video = useRef<HTMLVideoElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const owner = useRef<AbortController | null>(null);
  const cached = useRef<Observation | null>(null);
  const [file, setFile] = useState<File | null>(null), [url, setUrl] = useState('');
  const [savedSource, setSavedSource] = useState<string | null>(null);
  const [busy, setBusy] = useState(false), [aspect, setAspect] = useState(9 / 16);
  const [poses, setPoses] = useState<PoseFrame[]>([]), [report, setReport] = useState<Report | null>(null);
  const [pelvisMean, setPelvisMean] = useState<number | null>(null), [exportData, setExportData] = useState<object | null>(null);
  const [sole, setSole] = useState<SoleContactReport | null>(null);
  const [message, setMessage] = useState('両足RJの元動画を選んでください。');
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => {
    const hidden = () => { if (document.hidden) owner.current?.abort(); };
    document.addEventListener('visibilitychange', hidden);
    return () => { owner.current?.abort(); owner.current = null; cached.current = null; document.removeEventListener('visibilitychange', hidden); };
  }, []);
  function clear() { setReport(null); setSole(null); setPoses([]); setPelvisMean(null); setExportData(null); }
  async function loadJSON(selected: File) {
    if (owner.current) return;
    const control = new AbortController(); owner.current = control; setBusy(true);
    cached.current = null; clear(); setFile(null); setUrl(''); setSavedSource(null);
    if (videoInput.current) videoInput.current.value = '';
    setMessage('保存済みJSONの骨格と時刻を検査しています。');
    try {
      if (selected.size > MAX_TOE_CYCLE_IMPORT_BYTES) throw Error('保存済みJSONのサイズが上限を超えています。');
      const text = await selected.text();
      if (owner.current !== control || control.signal.aborted) return;
      const imported = parseToeCycleImport(text, selected.size);
      cached.current = { file: null, filename: imported.filename, sourceBytes: imported.sourceBytes,
        hash: imported.sourceVideoSHA256, poses: imported.poses, soles: imported.soles, origin: 'SAVED_JSON' };
      setSavedSource(imported.filename);
      setMessage('JSONを読み込みました。「入力なしでRJを解析」で、骨格の再取得なしに再計算できます。');
    } catch (e) {
      if (owner.current === control) setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      if (owner.current === control) {
        if (control.signal.aborted) setMessage('停止しました。途中の結果は表示しません。');
        owner.current = null; setBusy(false);
      }
    }
  }
  async function start() {
    if ((!file && !cached.current) || !canvas.current || owner.current) return;
    if (file && file.size > 150 * 1024 * 1024) { setMessage('150MB以内の動画を選んでください。'); return; }
    if (file && !supportsExactRecording(file)) { setMessage('MOV/MP4の元動画と元フレーム解析に対応したブラウザが必要です。'); return; }
    const control = new AbortController(); owner.current = control; setBusy(true); clear(); video.current?.pause();
    const current = () => owner.current === control && !control.signal.aborted;
    const started = performance.now();
    try {
      let observation = cached.current?.file === file ? cached.current : null;
      const reused = !!observation;
      if (!observation) {
        if (!file) throw Error('動画または保存済みJSONを選んでください。');
        setMessage('動画の同一性を確認しています。');
        const bytes = await file.arrayBuffer();
        const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(b => b.toString(16).padStart(2, '0')).join('');
        if (!current()) { setMessage('停止しました。途中の結果は表示しません。'); return; }
        const frames: PoseFrame[] = [], soles: SoleFrame[] = [];
        const measureSoles = soleMeter();
        await measureRecording(file, canvas.current, control.signal, state => {
          if (!current()) return;
          if (canvas.current?.height) setAspect(canvas.current.width / canvas.current.height);
          setMessage(`骨格を取得中：${state.processedFrames} / ${state.totalFrames ?? '—'} コマ`);
        }, text => { if (current()) setMessage(text); }, { analysis: 'OBSERVATIONS', observationModel: 'full',
          onPose: (p, frame, pts) => frames.push({ frame, pts, poses: p }),
          onDecodedFrame: decoded => { soles.push(measureSoles(decoded.bitmap, decoded.rotation, decoded.poses, decoded.sample.frame, decoded.sample.pts)); } });
        if (!current()) { setMessage('停止しました。途中の結果は表示しません。'); return; }
        if (soles.length !== frames.length) throw Error('骨格と靴底の画像のコマ数が一致しません。');
        observation = { file, filename: file.name, sourceBytes: file.size, hash, poses: frames, soles, origin: 'VIDEO' }; cached.current = observation;
      }
      setMessage(reused ? '保存済みの骨格から再計算しています。' : 'つま先の連続軌跡を計算しています。');
      // Yield so the progress message and stop button remain visible before the fit.
      await new Promise<void>(resolve => setTimeout(resolve, 0));
      if (!current()) { setMessage('停止しました。途中の結果は表示しません。'); return; }
      const result = toeCycleReport(observation.poses, observation.hash, observation.filename);
      const soleResult = soleContactReport(result, observation.soles);
      const baseline = wholeCycleReport(predictionSignals(observation.poses, AUTOMATIC_REGION, 'BOTH').PELVIS, observation.hash, observation.filename);
      if (!current()) return;
      setPoses(observation.poses); setReport(result); setSole(soleResult); setPelvisMean(baseline.mean);
      setExportData({ version: 'rj-toe-cycle-export-v1', presentationVersion: TOE_CYCLE_PRESENTATION_VERSION,
        result, soleContact: soleResult, pelvisComparison: baseline, inputProvenance: { kind: observation.origin, sourceVideoVerified: observation.origin === 'VIDEO' },
        observationModel: 'full', manualInputsUsed: false, videoUploaded: false, poses: observation.poses, soles: observation.soles,
        environment: { userAgent: navigator.userAgent, sourceFrames: observation.poses.length, sourceBytes: observation.sourceBytes } });
      setMessage(`解析完了（${Math.round((performance.now() - started) / 1000)}秒）${reused ? ' · 骨格の再取得なし' : ''}。${soleResult.mean === null ? '算出できなかった理由を確認してください。' : '平均RSIを表示しました。精度未検証の推定値です。'}`);
    } catch (e) {
      if (owner.current === control) setMessage(control.signal.aborted ? '停止しました。途中の結果は表示しません。' : e instanceof Error ? e.message : String(e));
    } finally { if (owner.current === control) { owner.current = null; setBusy(false); } }
  }
  function save() {
    if (!exportData) return;
    const objectURL = URL.createObjectURL(new Blob([JSON.stringify(exportData)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = objectURL; a.download = 'rebound-toe-cycle.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(objectURL), 1000);
  }
  return <main className="rj-lab rj-public">
    <header><a href={import.meta.env.BASE_URL}>← 種目を選ぶ</a><span>SACHIZU LAB · RJ</span></header>
    <div className="rj-title"><span>REBOUND JUMP</span><h1>両足RJ · 自動予測</h1><p>動画または保存済みJSONから、平均RSIを推定します。身長・基準物・手動のコマ指定は不要です。</p></div>
    <section className="rj-capture"><h2>動画を選ぶ</h2>
      <p>固定カメラ・全身と左右の靴・床が映る120/240fpsの元動画。正面から、靴と床の色がはっきり違う場所で撮影してください。録画解析です。</p>
      <label className="rj-upload"><input className="rj-file-input" ref={videoInput} type="file" accept="video/*" aria-label="つま先軌跡RJの動画を選ぶ" disabled={busy} onChange={e => {
        const f = e.target.files?.[0] ?? null; cached.current = null; clear(); setSavedSource(null); setFile(f); setUrl(f ? URL.createObjectURL(f) : '');
        setMessage(f ? '動画を選択しました。解析を開始できます。' : '両足RJの元動画を選んでください。');
      }} /><span className="rj-upload-button" aria-hidden="true"><Upload size={19} />{file ? '別の動画を選ぶ' : '動画を選ぶ'}</span></label>
      {file && <p className="rj-filename">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>}
      <div className="rj-viewer" hidden={!!savedSource || !file} style={{ maxWidth: Math.min(720, aspect * 520), aspectRatio: aspect, marginInline: 'auto' }}>
        <video ref={video} src={url || undefined} controls={!!file && !busy} playsInline muted hidden={busy} onLoadedMetadata={e => {
          if (e.currentTarget.videoHeight) setAspect(e.currentTarget.videoWidth / e.currentTarget.videoHeight);
        }} />
        <canvas ref={canvas} hidden={!busy} aria-label="RJの解析中の骨格" />
        {!busy && file && poses.length > 0 && <PoseReplay video={video} frames={poses} />}
      </div>
    </section>
    <section aria-label="保存済み骨格から再計算">
      <h2>保存済みJSONから再計算</h2>
      <p>以前保存した rebound-toe-cycle.json を使えます。動画の再解析・骨格の再取得はしません。保存されていたRSI値は使わず、骨格と靴底の画像データから計算し直します。靴底の画像データがない古いJSONでは、平均RSIを表示できません。</p>
      <label className="rj-upload rj-upload-secondary"><input className="rj-file-input" type="file" accept="application/json,.json" aria-label="保存済みつま先軌跡JSONを選ぶ" disabled={busy} onChange={e => {
        const selected = e.target.files?.[0]; e.target.value = ''; if (selected) void loadJSON(selected);
      }} /><span className="rj-upload-button" aria-hidden="true"><FileJson size={18} />保存済みJSONを選ぶ</span></label>
      {savedSource && <p className="rj-warning" data-testid="toe-cycle-import-source">{savedSource} の保存済み骨格を使用。元動画との同一性や骨格の正確さは、このJSONだけでは検証できません。元動画の再生はありません。</p>}
    </section>
    <button className="rj-button" disabled={(!file && !savedSource) || busy} onClick={() => void start()}>入力なしでRJを解析</button>
    {busy && <button className="rj-button rj-secondary" onClick={() => owner.current?.abort()}>解析を停止</button>}
    <p role="status">{message}</p>
    {report && sole && <ToeCycleResults report={report} sole={sole} pelvisMean={pelvisMean} />}
    {exportData && <button className="rj-button" onClick={save}>予測結果・骨格をJSON保存</button>}
    <footer>靴底接地 v1 / 頂点選択 v4 / 連続軌跡モデル v3 · 動画は端末内で処理。150MB / 30秒 / 3600フレーム以内。ページを閉じると未保存の結果は消えます。</footer>
  </main>;
}
