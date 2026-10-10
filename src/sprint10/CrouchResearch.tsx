import { useCallback, useMemo, useRef, useState } from 'react';
import { anglePose, type CrouchFrame } from './crouch';
import { markColor, type Mark } from './crouch-figure';
import { firstShown, type ResearchRow, type ResearchSummary, type Sex, type Verdict } from './crouch-research';
import { drawResearchTarget, SWING_COLOR, TARGET_COLOR } from './crouch-research-figure';
import { usePhasePictures, type FigureOverlay } from './CrouchViews';

/** The verdicts in words (the marks ◎○△ were not understood at a glance, the user 2026-10-10). */
const WORDS: Record<Exclude<Verdict, 'top'>, string> = { ok: 'ふつう', improve: '伸びしろ', note: '参考', none: '測れない' };
export const wordOf = (row: ResearchRow) => row.verdict !== 'top' ? WORDS[row.verdict]
  : row.bands.some(b => b.kind === 'top' && b.label.includes('トップ')) ? 'トップ並み' : '良い';
const ORDER = '①②③④⑤⑥⑦⑧';
/** The athlete's line on the picture (as drawCrouchFigure draws it), its colour and name for the legend, and the
 * landmarks the picture is cut round so the angle is large: the trunk with the head, or the leg. */
function markOf(row: ResearchRow): { marks: Mark[]; color: string; name: string; focus: number[] } {
  const f = row.figure, v = row.num ?? 0, none = { marks: [], color: '', name: '', focus: [] };
  if (!f || row.num === null) return none;
  if (f.kind === 'trunk') {
    const mark: Mark = { kind: 'trunk', label: '体幹', value: v };
    return { marks: [mark], color: markColor(mark), name: '体幹', focus: [0, 11, 12, 23, 24, 25, 26] };
  }
  if (f.side === null) return none;
  const leg = [23, 25, 27, 29, 31].map(i => i + f.side!);
  if (f.kind === 'shank') { const mark: Mark = { kind: 'shank', side: f.side, label: '脛', value: v }; return { marks: [mark], color: markColor(mark), name: '脛', focus: leg }; }
  if (f.kind === 'knee') {
    const label = row.key === 'frontKnee' ? '前膝' : '後膝', mark: Mark = { kind: 'knee', side: f.side, label, value: v };
    return { marks: [mark], color: markColor(mark), name: label, focus: leg };
  }
  return { marks: [], color: SWING_COLOR, name: '後ろ足のもも', focus: [23, 24, 25, 26, 27, 28] };
}

/** One value on the athlete's own picture at its moment: the athlete's line and the studies' range in green. The times
 * (no picture) are told as now → the studies. */
function ResearchPicture({ row, url, frames, direction }: { row: ResearchRow; url: string; frames: readonly CrouchFrame[]; direction: number }) {
  const { marks, color, name, focus } = markOf(row);
  const drawn = !!(url && row.moment && row.figure && row.num !== null && marks.length + (row.figure?.kind === 'gap' ? 1 : 0));
  const phases = useMemo(() => drawn && row.moment ? [{ key: row.key, label: row.moment.name, frame: row.moment.frame, pts: row.moment.pts, marks, focus }] : [],
    [drawn, row.key, row.moment?.frame, row.num]);   // eslint-disable-line react-hooks/exhaustive-deps
  const overlay = useCallback<FigureOverlay>((p, ctx, to, unit) => {
    const f = frames.find(q => q.frame === p.frame), pose = f ? anglePose(f) : null;
    if (pose) drawResearchTarget(ctx, pose, to, row, direction || 1, unit);
  }, [row, frames, direction]);
  const { images, failed } = usePhasePictures(url, frames, phases, overlay);
  return <div className="cr-pic" aria-live="polite">
    <div className="cr-pic-head"><strong>{row.moment ? `${row.moment.name}：${row.short}` : row.label}</strong>
      <span className="cr-pic-value">{row.value}</span><span className={`cr-word ${row.verdict}`}>{wordOf(row)}</span></div>
    {drawn ? images[row.key] ? <img src={images[row.key]} alt={`${row.label}：この選手の${name}（${row.value}）と、研究の範囲（${row.target}）`} />
      : <div className="sprint10-phase-wait">{failed ? '画像を作れませんでした' : '画像を作成しています…'}</div>
      : row.num !== null && <p className="cr-time">いま {row.value}<span>→ {row.target}</span></p>}
    {drawn && <p className="cr-key" aria-hidden="true">
      <span><i style={{ background: color }} />この選手の{name}</span>
      <span><i style={{ background: TARGET_COLOR }} />{row.target}</span>
      {row.figure?.kind === 'gap' && <span><i className="white" />支持脚のもも</span>}</p>}
    <p>{row.text}</p>
  </div>;
}

/** The crouch start against the studies (crouch-research.ts), in plain words first (the user, 2026-10-10: the table was
 * 「長いし文章ばかり」, the chips with ◎○△ and a scale 「まだわかりにくい」: which angle, what to do, how to read it):
 * what is good, what to work on in order with how, the chosen value on the athlete's own picture with the studies'
 * range in green, and every value in a list folded away. The first shown is what to work on first. */
export default function CrouchResearch({ summary, sex, onSex, url, frames, direction }: { summary: ResearchSummary; sex: Sex; onSex: (s: Sex) => void;
  url: string; frames: readonly CrouchFrame[]; direction: number }) {
  const [picked, setPicked] = useState<string | null>(null), picture = useRef<HTMLDivElement>(null);
  const key = picked !== null && summary.rows.some(r => r.key === picked) ? picked : firstShown(summary);
  const row = summary.rows.find(r => r.key === key) ?? null, groups = [...new Set(summary.rows.map(r => r.group))];
  const byLabel = (labels: string[]) => labels.map(label => summary.rows.find(r => r.label === label)).filter((r): r is ResearchRow => !!r);
  const good = byLabel(summary.good).filter(r => r.plain), fix = byLabel(summary.improve);
  // A value picked: its picture, brought into view when it is off the screen.
  const pick = (k: string) => { setPicked(k); requestAnimationFrame(() => picture.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })); };
  return <section className="crouch-research" aria-label="研究と比べる">
    <div className="crouch-research-head"><h3>研究と比べる</h3>
      <div className="sprint10-seg" role="group" aria-label="比べる研究">{(['female', 'male'] as Sex[]).map(s =>
        <button key={s} type="button" aria-pressed={sex === s} onClick={() => onSex(s)}>{s === 'female' ? '女子' : '男子'}</button>)}</div></div>
    {good.length > 0 && <div className="cr-good"><h4>良いところ</h4><ul>{good.map(r =>
      <li key={r.key}><button type="button" aria-pressed={r.key === key} onClick={() => pick(r.key)}>{r.plain}</button></li>)}</ul></div>}
    <div className="cr-fix"><h4>直すところ{fix.length > 1 ? '（この順に）' : ''}</h4>
      {fix.length ? <ol>{fix.map((r, i) => <li key={r.key}>
        <button type="button" aria-pressed={r.key === key} onClick={() => pick(r.key)}>{ORDER[i] ?? ''} {r.plain ?? r.label}</button>
        <span className="cr-now">いま {r.value} → {r.target}</span>{r.cue && <span className="cr-cue">コツ：{r.cue}</span>}</li>)}</ol>
        : <p>研究と比べて、はっきり直すところはありません。</p>}</div>
    <p className="cr-hint">項目を押すと、下の画像が変わります。</p>
    {row && <div ref={picture}><ResearchPicture row={row} url={url} frames={frames} direction={direction} /></div>}
    <details className="cr-all"><summary>全部の項目を見る（{summary.rows.length}）</summary>
      <ul>{groups.map(g => <li key={g}><span className="cr-phase">{g.split(' ').map(part => <span key={part}>{part}</span>)}</span><div className="cr-items">
        {summary.rows.filter(r => r.group === g).map(r => <button key={r.key} type="button" className={`cr-item ${r.verdict}`} aria-pressed={r.key === key}
          onClick={() => pick(r.key)}>{r.short} <b>{r.value}</b> <em>{wordOf(r)}</em></button>)}</div></li>)}</ul>
    </details>
  </section>;
}
