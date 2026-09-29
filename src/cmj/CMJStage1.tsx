import { useEffect, useRef, useState } from 'react';
import type { HeightEstimate, TimeBracket } from './stage1-analysis';
import { runStage1Recording, type Stage1RecordingRun } from './stage1-recording';
import './cmj.css';

const rangeText = ([lower, upper]: [number, number]) => `${(Math.floor(lower * 10) / 10).toFixed(1)}〜${(Math.ceil(upper * 10) / 10).toFixed(1)} cm`;
const REASON_DESCRIPTIONS: Record<string, string> = {
  TAKEOFF_BRACKET_UNRESOLVED: '接地している画像から、両足が床を離れた画像までの時間帯を確認できませんでした。',
  LANDING_BRACKET_UNRESOLVED: '空中の画像から、最初に足が床に接する画像までの時間帯を確認できませんでした。',
  INVALID_COM_COORDINATES: '重心計算に使える全身の姿勢情報が不足しているか、座標が不正です。',
  INSUFFICIENT_AIRBORNE_APEX_WINDOWS: '両足が空中にある間の重心頂点を、必要な複数の時間幅で確認できませんでした。',
  HEIGHT_BAND_TOO_WIDE: '時刻帯と計算条件による高さの幅が8cmを超えたため、数値を保留しました。',
  INSUFFICIENT_RECORDING: '解析に必要な元動画のフレーム数が不足しています。',
  INVALID_TIMELINE: '元動画のフレーム番号・時刻・観測の対応を確認できませんでした。',
  SOLE_BASELINE_UNRESOLVED: '開始時の静止画像から、左右の靴底と床の位置を安定して確認できませんでした。',
  STANDING_BASELINE_UNSTABLE: '開始時の静止姿勢を重心の観測から確認できませんでした。',
  NO_BILATERAL_AIR_EVIDENCE: '両足が床を離れている画像と、その時点の重心を確認できませんでした。',
  NO_COM_RISE: '跳躍として判定できる重心の上昇を確認できませんでした。',
  COM_TRACKING_OR_HORIZONTAL_DRIFT: '重心の追跡が途切れたか、身体の横移動が判定条件を超えました。',
  MULTIPLE_JUMPS_OR_FALSE_AIR: '複数の跳躍、または靴底の誤検出を区別できませんでした。1動画に1回の跳躍を含めてください。',
  AIR_INTERVAL_TOO_SHORT: '確認できた空中の時間帯が短く、跳躍として判定できませんでした。',
  APEX_NOT_BRACKETED: '重心頂点の前後を十分に観測できませんでした。',
  APEX_SOURCE_GAP: '重心頂点の近くに、フレームや時刻の欠落があります。',
  APEX_RESAMPLING_UNRESOLVED: '使用する観測を一部変えると重心頂点を確認できず、安定性が不足しています。',
  NON_BALLISTIC_OR_UNSTABLE_APEX: '重心頂点付近の動きが空中の放物線に合わないか、推定が不安定です。',
  TIME_BRACKET_UNAVAILABLE: '高さの計算に必要な時刻帯を確認できませんでした。',
  INVALID_EVENT_ORDER: '離地・頂点・着地の時間帯の順序を確認できませんでした。',
  NOT_EVALUATED: '高さの計算に必要な観測をまだ確認できていません。',
  INVALID_BASELINE: '重心計算の基準となる全身の姿勢情報を確認できませんでした。',
  INSUFFICIENT_SAMPLES: '重心計算に必要な観測数が不足しています。',
  COM_TRACKING_LOST: '重心計算に必要な全身の姿勢情報が不足しているか、途中で追跡が途切れました。',
  SUBJECT_DRIFT: '身体の横移動が判定条件を超えました。',
};
const reasonDescription = (reason: string | undefined) => reason && REASON_DESCRIPTIONS[reason]
  || '判定に必要な観測を十分に確認できませんでした。詳細の診断コードを確認してください。';

export function Stage1Height({ estimate }: { estimate: HeightEstimate }) {
  return <div data-estimate-status={estimate.status}>
    {estimate.status === 'POINT' && estimate.heightCm !== null && estimate.rangeCm ? <>
      <p className="cmj-number">中点 {estimate.heightCm.toFixed(1)} cm</p>
      <p>範囲 {rangeText(estimate.rangeCm)}</p>
    </> : estimate.status === 'RANGE' && estimate.rangeCm ? <p className="cmj-number">範囲のみ {rangeText(estimate.rangeCm)}</p>
      : <p className="cmj-number">数値を保留</p>}
    {estimate.reason && <><p>理由：{reasonDescription(estimate.reason)}</p>
      <details><summary>理由の診断コード</summary><p>{estimate.reason}</p></details></>}
    {estimate.status === 'HOLD' && estimate.rangeCm && <details><summary>保留した診断範囲</summary><p>{rangeText(estimate.rangeCm)}</p></details>}
  </div>;
}

function Bracket({ label, bracket }: { label: string; bracket: TimeBracket | null }) {
  return <p>{label}：{bracket ? `${bracket.lower.toFixed(5)}〜${bracket.upper.toFixed(5)} 秒（フレーム ${bracket.frames[0]}〜${bracket.frames[1]}）` : '確認できません'}</p>;
}

export function Stage1Results({ run }: { run: Stage1RecordingRun }) {
  const { analysis } = run;
  return <section aria-label="第1段階の解析結果">
    <h2>主計算B：離地から重心頂点まで</h2>
    <Stage1Height estimate={analysis.B} />
    <p>この範囲は時間帯と固定した計算条件の変動です。信頼区間でも、真値を含む保証でもありません。</p>
    <h2>比較A：離地から着地まで</h2>
    <Stage1Height estimate={analysis.A} />
    <h2>比較：旧COM方式</h2>
    <p>{analysis.legacy.heightCm !== null ? `旧COM推定 ${analysis.legacy.heightCm.toFixed(1)} cm`
      : `旧COM方式は保留：${reasonDescription(analysis.legacy.reason)}`}</p>
    <p>同じ観測列から3方式を計算しています。Aは離地・着地時の重心高が等しいという仮定を含みます。</p>
    <details><summary>時刻帯・取得条件・診断</summary>
      {analysis.legacy.reason && <p>旧COM方式の診断コード：{analysis.legacy.reason}</p>}
      <Bracket label="離地" bracket={analysis.takeoff} />
      <Bracket label="重心頂点" bracket={analysis.apex} />
      <Bracket label="着地" bracket={analysis.landing} />
      <p>{run.file.name} · 元動画 {run.frameCount}フレーム · Full姿勢モデル · 処理 {run.elapsedSeconds.toFixed(1)}秒</p>
      <p>全元フレーム・実PTSを使用。間引きなし。名目FPSから時刻を作りません。靴底は画像の明暗輪郭から求め、足点は探索場所にだけ使います。</p>
      <p>B = 50g（頂点−離地）² cm、A = 12.5g（着地−離地）² cm、g = 9.80665 m/s²。両時刻帯の端を組み合わせた上下限を使います。</p>
      <p>SHA-256: {run.file.sha256}</p>
      <p>モデルSHA-256: {run.modelSha256}</p>
      <pre>{JSON.stringify(analysis.diagnostics, null, 2)}</pre>
    </details>
  </section>;
}

export default function CMJStage1() {
  const [file, setFile] = useState<File | null>(null), [url, setUrl] = useState('');
  const [run, setRun] = useState<Stage1RecordingRun | null>(null);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('');
  const owner = useRef<AbortController | null>(null), canvas = useRef<HTMLCanvasElement>(null);
  const downloads = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  useEffect(() => () => {
    owner.current?.abort(); owner.current = null;
    for (const [uri, timeout] of downloads.current) { clearTimeout(timeout); URL.revokeObjectURL(uri); }
    downloads.current.clear();
  }, []);
  useEffect(() => {
    if (!file) { setUrl(''); return; }
    const next = URL.createObjectURL(file); setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  function select(next: File | undefined) {
    owner.current?.abort(); owner.current = null;
    setBusy(false); setRun(null); setError(''); setMessage(''); setFile(next ?? null);
  }
  function cancel() {
    owner.current?.abort(); owner.current = null;
    setBusy(false); setRun(null); setMessage('解析を中止しました。');
  }
  async function analyze() {
    if (!file || !canvas.current) return;
    owner.current?.abort(); const control = new AbortController(); owner.current = control;
    const current = () => owner.current === control && !control.signal.aborted;
    setBusy(true); setRun(null); setError(''); setMessage('解析を準備しています。');
    try {
      const result = await runStage1Recording(file, canvas.current, control.signal, (done, total, text) => {
        if (current()) setMessage(total ? `${text} ${done} / ${total} フレーム` : text);
      });
      if (current()) { setRun(result); setMessage('録画解析が完了しました。'); }
    } catch (e) {
      if (current()) setError(e instanceof Error ? e.message : String(e));
    } finally { if (current()) { owner.current = null; setBusy(false); } }
  }
  function download() {
    if (!run) return;
    const uri = URL.createObjectURL(new Blob([JSON.stringify(run, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = uri; link.download = 'cmj-stage1-recording.json';
    link.click();
    const timeout = setTimeout(() => { URL.revokeObjectURL(uri); downloads.current.delete(uri); }, 1000);
    downloads.current.set(uri, timeout);
  }
  return <main className="cmj-lab">
    <a href="/?dev=1">アプリに戻る</a>
    <h1>CMJ 第1段階・録画検証</h1>
    <p className="cmj-note">研究用・精度未検証。録画だけの独立した試験画面です。±2cmは開発目標であり、精度保証ではありません。</p>
    <p>第2段階のライブ機能は未導入です。現在は精度目標の達成を確認する前の、録画検証の段階です。</p>
    <p>固定カメラで全身と両足の靴底を撮影し、静止→1回のジャンプ→着地を1動画に含めてください。腰に手を置き、足元と床が見分けられる場所で撮影します。</p>
    <p>30秒以内・3600フレーム以内・150MB以内の元動画を使用します。スロー書き出しで時間を伸ばした動画は使えません。実際の撮影時間かどうかは映像だけでは保証できません。</p>
    <label>録画済みCMJ動画<input type="file" accept="video/mp4,video/quicktime,.mp4,.mov,.m4v" onChange={e => select(e.target.files?.[0])} /></label>
    <p>動画は端末内で解析します。離地の手動指定や身長入力・校正は不要です。</p>
    {url && <video src={url} controls playsInline preload="metadata" />}
    <canvas ref={canvas} hidden />
    <button disabled={!file || busy} onClick={() => void analyze()}>全元フレームで解析</button>
    {busy && <button onClick={cancel}>中止</button>}
    {message && <p role="status">{message}</p>}
    {error && <p role="alert">{error}</p>}
    <p>事前固定した表示条件：幅4cm以下は中点と範囲、4cm超〜8cm以下は範囲のみ、8cm超は数値を保留します。中点は上下限の算術平均です。表示は小数1桁で、範囲の端は外向きに丸めます。</p>
    {run && <><Stage1Results run={run} /><button onClick={download}>結果・時刻列・観測診断をJSON保存</button></>}
  </main>;
}
