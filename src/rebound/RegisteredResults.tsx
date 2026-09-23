import type { RegisteredAnalysis } from './registered-template';
import { reviewSummary } from './auto-review';
export default function RegisteredResults({ result, seek, saveJSON, saveCSV, reviewed = false }: {
  result: RegisteredAnalysis; seek: (pts: number) => void; saveJSON: () => void; saveCSV: () => void; reviewed?: boolean;
}) {
  const confirmed = reviewSummary(result);
  const count = reviewed ? confirmed.count : result.validRSICount;
  const mean = reviewed ? confirmed.mean : result.meanRSI, max = reviewed ? confirmed.max : result.maxRSI;
  const value = (n: number | null, digits = 3) => n === null ? '—' : n.toFixed(digits);
  const target = Math.max(0, result.jumps.length - 1);
  const complete = target > 0 && count === target;
  const heights = result.jumps.flatMap(j => j.heightM === null || (reviewed && j.flightSource !== 'MANUAL') ? [] : [j.heightM]);
  const label = reviewed ? '確認済み' : '認識';
  return <section className="rj-registered" aria-label={reviewed ? '確認済みの集計結果' : '3点登録の予測結果'}><h2>{result.jumps.length}跳躍の集計結果</h2>
    <p>RSIは各回の「跳躍高 ÷ その跳躍直前の接地時間」を計算し、算出できた回数で平均します。1回目の静止開始はRSI対象外です。予測を含む結果は精度未検証です。</p>
    {result.reason && <p role="alert" className="rj-warning">{result.reason}</p>}
    <div className="rj-template-metrics"><div>平均RSI（{label} {count} 回）<strong>{value(mean, 2)} <small>m/s</small></strong></div>
      <div>最大RSI（同じ {count} 回）<strong>{value(max, 2)} <small>m/s</small></strong></div><div>採用回数<strong>{count} / {target}</strong><small>静止開始の1回目は除外</small></div>
      <div>平均跳躍高（{label} {heights.length} 回）<strong>{value(heights.length ? heights.reduce((a, b) => a + b, 0) / heights.length * 100 : null, 1)} <small>cm</small></strong></div></div>
    {reviewed && <p className="rj-partial-note">仮解析（未確認を含む {result.validRSICount} 回）：平均 {value(result.meanRSI, 2)} ／ 最大 {value(result.maxRSI, 2)} m/s。上の確認済み結果とは別の値です。確認済みでも、手動のコマ選択と撮影条件による誤差は残ります。</p>}
    {!complete && <p className="rj-warning">{reviewed ? '必要な3箇所（直前の着地・今回の離地・今回の着地）を確認した' : 'RSIを算出できた'}{count}回だけの平均・最大です。不成立を0で埋めません。採用回数・対象の異なる結果との比較には注意してください。</p>}
    <div className="rj-table-wrap"><table><caption>跳躍ごとの手動値・予測値</caption><thead><tr><th>跳躍</th><th>高さ cm</th><th>接地 秒</th><th>滞空 秒</th><th>RSI m/s</th><th>動画で確認</th></tr></thead><tbody>
      {result.jumps.map(j => <tr key={j.jump}><th>{j.jump}回目</th><td>{value(j.heightM === null ? null : j.heightM * 100, 1)}<small>時間からの推定</small></td>
        <td>{value(j.contactSeconds)}<small>{j.contactSource === 'MANUAL' ? '手動登録' : j.contactSource ? '予測' : '対象外／不成立'}</small></td>
        <td>{value(j.flightSeconds)}<small>{j.flightSource === 'MANUAL' ? '手動登録' : j.flightSource ? '予測' : '不成立'}</small></td>
        <td>{value(j.rsi, 2)}{reviewed && j.rsi !== null && <small>{confirmed.jumpNumbers.includes(j.jump) ? '確認済み' : '未確認の仮値'}</small>}{j.reason && <small>{j.reason}</small>}</td><td>{j.takeoff && <button onClick={() => seek(j.takeoff!.pts)}>離地</button>} {j.landing && <button onClick={() => seek(j.landing!.pts)}>着地</button>}</td></tr>)}
    </tbody></table></div>
    <details className="rj-details"><summary>自動候補の成立条件・波形のずれ</summary><p>以下は修正前の自動候補の診断です。誤差は振幅で正規化した波形差です。接地時間幅は似た適合度の候補の範囲で、統計的な信頼区間ではありません。</p>
      {result.warnings.map(w => <p key={w}>{w}</p>)}
      {result.fits.map(f => <p key={f.afterJump}>{f.afterJump}回目の着地側：{f.reason ?? (f.afterJump === 1 ? '手動登録' : '予測成立（精度未検証）')} / 波形差 {value(f.error)}
        {f.contactRange && ` / 接地候補幅 ${f.contactRange[0].toFixed(3)}〜${f.contactRange[1].toFixed(3)}秒`}</p>)}</details>
    <div className="rj-downloads"><button className="rj-button" onClick={saveJSON}>確認・修正結果をJSON保存</button><button className="rj-button rj-secondary" onClick={saveCSV}>跳躍別の結果をCSV保存</button></div>
  </section>;
}
