import type { PoseComparison } from './model-comparison';
const value = (v: number | null, digits = 2) => v === null ? '—' : v.toFixed(digits);

export default function PoseModelComparison({ comparison: c }: { comparison: PoseComparison }) {
  return <section aria-label="FullとHeavyの比較結果" className="rj-capture" data-testid="pose-comparison">
    <h2>FullとHeavyの比較結果</h2>
    <p>同じ動画・全元フレーム・同じRSI計算。姿勢モデルだけを変更しています。通常解析はFullのままです。</p>
    <div style={{ overflowX: 'auto' }}><table className="rj-table">
      <thead><tr><th>見る項目</th><th>Full（現行）</th><th>Heavy（比較用）</th></tr></thead>
      <tbody>
        <tr><th>認識した跳躍</th>{[c.full, c.heavy].map(r => <td key={r.poseModel}>{r.recognizedJumps}回</td>)}</tr>
        <tr><th>RSI採用</th>{[c.full, c.heavy].map(r => <td key={r.poseModel}>{r.acceptedRSICount} / {r.expectedRSICount}回</td>)}</tr>
        <tr><th>採用した回</th>{[c.full, c.heavy].map(r => <td key={r.poseModel}>{r.acceptedJumpNumbers.join('・') || 'なし'}</td>)}</tr>
        <tr><th>平均RSI m/s<br />各モデルの採用分</th>{[c.full, c.heavy].map(r => <td key={r.poseModel}>{value(r.meanRSI)}</td>)}</tr>
        <tr><th>足点の追跡成立率</th>{[c.full, c.heavy].map(r => <td key={r.poseModel}>{r.frames ? (r.tracking.footFrames / r.frames * 100).toFixed(1) : '—'}%</td>)}</tr>
        <tr><th>準備・初回推論</th>{[c.full, c.heavy].map(r => <td key={r.poseModel}>{value(r.timing.setupSeconds, 0)}秒</td>)}</tr>
        <tr><th>初回推論後の解析</th>{[c.full, c.heavy].map(r => <td key={r.poseModel}>{value(r.timing.processingSeconds, 0)}秒</td>)}</tr>
        <tr><th>合計時間</th>{[c.full, c.heavy].map(r => <td key={r.poseModel}>{value(r.timing.totalSeconds, 0)}秒</td>)}</tr>
      </tbody>
    </table></div>
    <p className="rj-warning">高いRSI・高い追跡率・多い採用回数だけでは正確とは判断できません。準備時間にはモデルの受信を含みます。Full→Heavyの順に実行するため、端末の発熱やキャッシュの影響もあります。</p>
    <h3>時刻で対応付けできた共通採用 {c.commonCount} 回</h3>
    <p>同じ対応回の平均：Full {value(c.commonFullMean)} ／ Heavy {value(c.commonHeavyMean)} m/s</p>
    <p>跳躍の頂点時刻が近い候補を対応付けています（±0.12秒内で互いに候補が1つのみ）。正解映像との照合ではありません。</p>
    <details><summary>各回のRSI・判定時刻の差を見る</summary>
      <div style={{ overflowX: 'auto' }}><table className="rj-table"><thead><tr><th>Full回 / Heavy回</th><th>Full RSI</th><th>Heavy RSI</th><th>離地差 ms</th><th>着地差 ms</th></tr></thead>
        <tbody>{c.pairs.map(p => <tr key={p.fullJump}><td>{p.fullJump} / {p.heavyJump}</td><td>{value(p.fullRSI)}</td><td>{value(p.heavyRSI)}</td><td>{value(p.takeoffDifferenceMs, 1)}</td><td>{value(p.landingDifferenceMs, 1)}</td></tr>)}</tbody></table></div>
      <p>時刻の差はHeavy − Full。プラスはHeavyの判定が遅いことを示します。欠測は0で補いません。</p>
      <p>対応不明：Full {c.unmatchedFull.join('・') || 'なし'} ／ Heavy {c.unmatchedHeavy.join('・') || 'なし'}</p>
    </details>
    <h3>今回見てほしいこと</h3>
    <ol><li>認識した跳躍回数は、動画で数えた回数に合うか。</li><li>HeavyでRSI採用回数と足点の追跡成立率が変わるか。</li><li>動画の上にあるモデル選択を切り替え、足先の点が床や反対の足へ飛ばないか。</li><li>解析時間はスマホで待てる長さか。</li></ol>
    <p>比較JSONには両モデルの結果・不成立理由をまとめて保存します。映像は送信しません。</p>
  </section>;
}
