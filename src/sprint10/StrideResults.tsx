import type { StrideInterval } from './analysis';
export default function StrideResults({ intervals, seek }: { intervals: StrideInterval[]; seek: (pts: number, label: string) => void }) {
  return <section aria-label="1歩ごとのストライド"><h3>1歩ごとのストライド（推定）</h3>
    <p>隣り合う脚の入れ替わり時点で、骨盤中心が進んだ距離です。10mを歩数で等分した値ではありません。</p>
    <p>1歩目の接地と、その直後の入れ替わりは同じ1歩として数えます。距離は各歩に対応する入れ替わり同士で計算します。登録した接地位置を入れ替わり位置に置き換えるものではありません。スタート・ゴール端の部分区間は除外します。</p>
    {!intervals.length && <p>距離を算出できる連続した入れ替わりがありません。</p>}
    <ol className="sprint10-strides">{intervals.map(s => <li key={s.toStep}>
      <div><strong>{s.fromStep} → {s.toStep}歩目候補</strong><span className="sprint10-stride-value">{s.distanceM === null ? '—' : `${s.distanceM.toFixed(2)} m`}</span></div>
      <p>{(s.toPts - s.fromPts).toFixed(3)} 秒{ s.reason ? ` · ${s.reason}` : '' }</p>
      <div className="sprint10-events"><button onClick={() => seek(s.fromPts, `${s.fromStep}歩目候補（入れ替わり）`)}>始点を見る</button>
        <button onClick={() => seek(s.toPts, `${s.toStep}歩目候補（入れ替わり）`)}>終点を見る</button></div>
    </li>)}</ol>
    <p>距離 = 骨盤の水平移動量 ÷ 2本のラインの水平間隔 × 10m。真横に近い固定撮影が前提です。接地間の実測ストライドではありません。</p>
  </section>;
}
