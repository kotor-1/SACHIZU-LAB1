import { Fragment, useState } from 'react';
import type { ResearchSummary, Sex, Verdict } from './crouch-research';

/** The verdicts as shown: a mark and a word (the marks alone were not self-explanatory on a phone). */
export const VERDICT: Record<Verdict, { mark: string; word: string }> = {
  top: { mark: '◎', word: '上位' }, ok: { mark: '○', word: '範囲内' }, improve: { mark: '△', word: '伸びしろ' },
  note: { mark: '', word: '参考' }, none: { mark: '', word: '測れない' },
};
const ORDER = '①②③④⑤⑥⑦⑧';
/** The summary's items, each kept on one line where it fits (a phone broke 「1歩目接地の脛」 in two). */
const items = (labels: string[], numbered: boolean) => labels.map((label, i) =>
  <span key={label} className={numbered ? 'crouch-research-unit numbered' : 'crouch-research-unit'}>{numbered ? ORDER[i] ?? '' : ''}{label}{!numbered && i < labels.length - 1 ? '・' : ''}</span>);

/** The crouch start against the studies (crouch-research.ts): the summary first (good points, what to work on, what could
 * not be measured), then a table in the order of the movement, a row's explanation opened by tapping its name. Narrow
 * enough for a phone: the studies' value takes the line under each item, the whole width. */
export default function CrouchResearch({ summary, sex, onSex }: { summary: ResearchSummary; sex: Sex; onSex: (s: Sex) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  return <section className="crouch-research" aria-label="研究と比べる">
    <div className="crouch-research-head"><h3>研究と比べる</h3>
      <div className="sprint10-seg" role="group" aria-label="比べる研究">{(['female', 'male'] as Sex[]).map(s =>
        <button key={s} type="button" aria-pressed={sex === s} onClick={() => onSex(s)}>{s === 'female' ? '女子' : '男子'}</button>)}</div></div>
    <ul className="crouch-research-summary" aria-label="まとめ">
      {summary.good.length > 0 && <li className="good"><strong>良い点</strong><span>{items(summary.good, false)}</span></li>}
      <li className="improve"><strong>伸びしろ</strong><span>{summary.improve.length ? items(summary.improve, true)
        : '研究と比べて、はっきりした伸びしろはありませんでした。'}</span></li>
      {summary.missing.length > 0 && <li className="missing"><strong>測れなかった所</strong><span>{items(summary.missing, false)}</span></li>}
    </ul>
    <div className="sprint10-table-wrap"><table className="sprint10-table crouch-research-table">
      {/* Fixed widths: an opened explanation (across the row) widened the value column and broke the names in two. */}
      <colgroup><col /><col className="crouch-research-value" /><col className="crouch-research-verdict" /></colgroup>
      <thead><tr><th scope="col">項目</th><th scope="col">この選手</th><th scope="col">判定</th></tr></thead>
      <tbody>{summary.rows.map((row, i) => {
        const shown = open === row.key, v = VERDICT[row.verdict];
        return <Fragment key={row.key}>
          {row.group !== summary.rows[i - 1]?.group && <tr className="crouch-research-group"><th scope="rowgroup" colSpan={3}>{row.group}</th></tr>}
          <tr className="crouch-research-item">
            <th scope="row"><button type="button" aria-expanded={shown} aria-label={`${row.label}の説明`} onClick={() => setOpen(shown ? null : row.key)}>{row.short}</button></th>
            <td>{row.value}</td>
            <td><span className={`crouch-verdict ${row.verdict}`}>{v.mark}{v.word}</span></td></tr>
          <tr className="crouch-research-ref"><td colSpan={3}>研究：{row.research}</td></tr>
          {shown && <tr className="crouch-research-text"><td colSpan={3}>{row.text}</td></tr>}
        </Fragment>;
      })}</tbody></table></div>
    <p className="sprint10-hint">項目を押すと説明が出ます。研究の値は短距離選手の研究の平均や範囲で、選手ごとの目標ではありません。女子の研究がない項目は、男女の研究や世界トップ男子の値と比べています（判定の決め方と出典は「数値の見方」）。</p>
  </section>;
}
