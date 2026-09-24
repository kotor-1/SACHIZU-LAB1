import type { RegisteredAnalysis } from './registered-template';
import { reviewSummary } from './auto-review';
const value = (n: number | null, digits = 3) => n === null ? '—' : n.toFixed(digits);

export function RegisteredSummary({ result, reviewed = false }: { result: RegisteredAnalysis; reviewed?: boolean }) {
  const confirmed = reviewSummary(result);
  const count = result.validRSICount;
  const fullyConfirmed = reviewed && count > 0 && confirmed.count === count;
  const mean = fullyConfirmed ? confirmed.mean : result.meanRSI;
  const max = fullyConfirmed ? confirmed.max : result.maxRSI;
  const target = Math.max(0, result.jumps.length - 1);
  const complete = target > 0 && count === target;
  const heights = result.jumps.flatMap(j => j.heightM === null ? [] : [j.heightM]);
  const heightsConfirmed = reviewed && heights.length > 0 && result.jumps.every(j => j.heightM === null || j.flightSource === 'MANUAL');
  const label = reviewed ? count === 0 ? 'RSI未算出' : fullyConfirmed ? '確認済み' : '暫定・未確認含む' : '予測・精度未検証';
  const heightLabel = reviewed ? heightsConfirmed ? '確認済み' : '暫定・未確認含む' : '認識';
  return <div className="rj-registered-summary">
    {result.reason && <p role="alert" className="rj-warning">{result.reason}</p>}
    <div className="rj-rsi-dashboard">
      <div className="rj-rsi-hero" aria-label="平均RSIの結果">
        <div className="rj-rsi-hero-heading"><span>RJ RESULT</span><span className="rj-rsi-status">{label}</span></div>
        <div className="rj-rsi-hero-main"><span>平均RSI{!reviewed && `（認識 ${count} 回）`}</span><div><strong>{value(mean, 2)}</strong><span>m/s</span></div></div>
        <p>算出 {count} / {target} 回 <small>（静止開始の1回目を除外）</small></p>
      </div>
      <dl className="rj-rsi-secondary"><div><dt>最大RSI</dt><dd>{value(max, 2)} <small>m/s</small></dd><small>平均と同じ {count} 回</small></div>
        <div><dt>平均跳躍高（{heightLabel} {heights.length} 回）</dt><dd>{value(heights.length ? heights.reduce((a, b) => a + b, 0) / heights.length * 100 : null, 1)} <small>cm</small></dd></div></dl>
    </div>
    {reviewed && <div className="rj-partial-note"><strong>手動確認済み：{confirmed.count} / {target} 回</strong><p>{confirmed.count ? `確認済みRSI：平均 ${value(confirmed.mean, 2)} ／ 最大 ${value(confirmed.max, 2)} m/s。` : '確認済みRSIは未算出です。'} {fullyConfirmed ? '表示中のRSIは確認済みの値です。' : '上のRSIは自動候補を含む暫定値です。映像で離地・着地を確認すると、ここに確認済みの結果を表示します。'}手動のコマ選択と撮影条件による誤差は残ります。</p></div>}
    {reviewed && !fullyConfirmed && count > 0 && <p className="rj-warning">未確認を含む{count}回の暫定平均・最大です。靴底と床の接触を確認した測定値ではありません。</p>}
    {!complete && <p className="rj-warning">RSIを算出できた{count}回だけの平均・最大です。不成立を0で埋めません。算出回数・対象の異なる結果との比較には注意してください。</p>}
  </div>;
}

export default function RegisteredResults({ result, seek, saveJSON, saveCSV, reviewed = false, detailsOnly = false }: {
  result: RegisteredAnalysis; seek: (pts: number) => void; saveJSON: () => void; saveCSV: () => void; reviewed?: boolean; detailsOnly?: boolean;
}) {
  const confirmed = reviewSummary(result);
  return <section className="rj-registered" aria-label={detailsOnly ? '跳躍ごとの詳細と保存' : reviewed ? '跳躍の集計結果（暫定値と確認済み値を区別）' : '3点登録の予測結果'}>
    <h2>{detailsOnly ? '跳躍ごとの詳細と保存' : `${result.jumps.length}跳躍の集計結果`}</h2>
    {!detailsOnly && <><p>RSIは各回の「跳躍高 ÷ その跳躍直前の接地時間」を計算し、算出できた回数で平均します。1回目の静止開始はRSI対象外です。予測を含む結果は精度未検証です。</p><RegisteredSummary result={result} reviewed={reviewed} /></>}
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
