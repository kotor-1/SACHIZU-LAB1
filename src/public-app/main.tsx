import { Component, Fragment, lazy, Suspense, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import '../theme/tokens.css';
import './public.css';

// Public site: CMJ, RJ and sprint (start 10 m, a maximal-velocity section and the crouch start), and under
// 種目解析 the hurdle and the throws (2026-10-05), the high jump's scissors, the long jump's run-up and the curve start
// (2026-10-06); under トレーニング the squat and Romanian deadlift form (2026-10-08); under からだのチェック the
// standing posture (2026-10-08). The other track-and-field analyses and research screens stay in the development app.
const CMJ = lazy(() => import('../cmj/CMJLab'));
const Sprint = lazy(() => import('../sprint10/Sprint10Lab'));
const RJ = lazy(() => import('../rebound/ToeCycleLab'));
const Hurdle = lazy(() => import('../hurdling/HurdleLab'));
const Throw = lazy(() => import('../throws/ThrowLab'));
const HighJump = lazy(() => import('../highjump/HighJumpLab'));
const LongJump = lazy(() => import('../longjump/LongJumpLab'));
const CurveStart = lazy(() => import('../curvestart/CurveStartLab'));
const Strength = lazy(() => import('../strength/StrengthLab'));
const Posture = lazy(() => import('../posture/PostureLab'));
const home = import.meta.env.BASE_URL;
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <main className="public-home"><h1>画面を読み込めませんでした</h1><p>通信を確認し、ページを再読み込みしてください。未保存の解析結果は失われます。</p><a href={home}>メニューに戻る</a></main> : this.props.children; }
}
/** A tile's line icon (24 px grid, drawn in the accent colour). */
function Icon({ paths, circles = [] }: { paths: string[]; circles?: [number, number, number][] }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {circles.map(([cx, cy, r]) => <circle key={`${cx},${cy}`} cx={cx} cy={cy} r={r} />)}{paths.map(d => <path key={d} d={d} />)}</svg>;
}
type Group = 'jump' | 'sprint' | 'event' | 'body';
// A title's | marks where it may wrap (the tiles keep words whole). The home as tiles in four groups (the user, 2026-10-13: 「UIデザインを大幅に変更してください」, design B 「ナイト」;
// 2026-10-05: 「縦長で使いにくい」): every analysis within about a screen and a half, the notes folded below.
const GROUPS: { id: Group; title: string; tiles: { lab: string; title: string; text: string; icon: ReactNode }[] }[] = [
  { id: 'jump', title: 'ジャンプ', tiles: [
    { lab: 'cmj', title: 'CMJ', text: '垂直跳び。録画でもカメラでも', icon: <Icon paths={['M12 18V5', 'M7 10l5-5 5 5', 'M4 21h16']} /> },
    { lab: 'rj', title: 'RJ', text: 'リバウンドジャンプの平均RSI', icon: <Icon paths={['M3 17l4-10 4 10 4-10 4 10', 'M2 21h20']} /> }] },
  { id: 'sprint', title: 'スプリント', tiles: [
    { lab: 'sprint10', title: '10m・|最高速度区間', text: '通過時間・ピッチ・接地と滞空', icon: <Icon circles={[[12, 14, 7]]} paths={['M12 14l3-3', 'M10 3h4', 'M12 3v4']} /> },
    { lab: 'sprint10&mode=crouch', title: 'クラウチング|スタート', text: 'ブロックから5歩目までの姿勢と接地', icon: <Icon paths={['M5 21V4', 'M5 4h11l-2 4 2 4H5']} /> }] },
  { id: 'event', title: '種目解析', tiles: [
    { lab: 'hurdle', title: 'ハードル', text: '重心が最高点になる位置', icon: <Icon paths={['M6 21V8', 'M18 21V8', 'M4 8h16', 'M6 14h12']} /> },
    { lab: 'jav', title: 'やり投げ', text: 'ジャベリックスロー・やり投げのブロック脚', icon: <Icon paths={['M4 20L20 4', 'M14 4h6v6']} /> },
    { lab: 'shot', title: '砲丸投', text: 'グライド・立ち投げの局面', icon: <Icon circles={[[15, 9, 4]]} paths={['M3 14h6', 'M4 18h7']} /> },
    { lab: 'highjump', title: '走高跳', text: 'はさみ跳びの踏切と上がった高さ', icon: <Icon paths={['M2 11h20', 'M4 21C6 6 16 4 20 21']} /> },
    { lab: 'longjump', title: '走り幅跳び', text: '助走の最後の数歩と踏切', icon: <Icon paths={['M3 18C7 6 15 6 21 18', 'M2 21h20']} /> },
    { lab: 'curve', title: 'カーブ|スタート', text: 'まっすぐ出て、カーブに沿えたか', icon: <Icon paths={['M5 21C5 11 9 5 20 4', 'M10 21c0-7 3-10 10-11']} /> }] },
  { id: 'body', title: 'トレーニング・からだ', tiles: [
    { lab: 'strength', title: 'スクワット・|RDL', text: '深さと角度。声でお知らせ', icon: <Icon paths={['M6 7v10', 'M18 7v10', 'M3 10v4', 'M21 10v4', 'M6 12h12']} /> },
    { lab: 'posture', title: '姿勢解析', text: '正面・横・後ろの立ち姿勢', icon: <Icon circles={[[12, 4.5, 2]]} paths={['M12 7v8', 'M7 10h10', 'M9 21l3-6 3 6']} /> }] },
];
function Home() {
  const [shown, setShown] = useState<Group | 'all'>('all');
  return <main className="public-home">
    <header className="public-top"><strong className="public-brand"><span>SACHIZU</span> LAB</strong><span className="public-badge">無料・ベータ版</span></header>
    <section className="public-hero"><p className="public-eyebrow">MOTION ANALYSIS</p><h1>撮って、<br />数値で確かめる。</h1><p>動画やカメラの映像は、この端末の中だけで処理します。</p></section>
    <div className="public-filter" role="group" aria-label="種類でしぼる">
      {([['all', 'すべて'], ...GROUPS.map(g => [g.id, g.title])] as [Group | 'all', string][]).map(([id, title]) =>
        <button key={id} type="button" aria-pressed={shown === id} onClick={() => setShown(id)}>{title}</button>)}
    </div>
    {GROUPS.filter(g => shown === 'all' || shown === g.id).map(g => <section key={g.id} className="public-group" aria-labelledby={`public-group-${g.id}`}>
      <h2 id={`public-group-${g.id}`}>{g.title}</h2>
      <nav className="public-tiles" aria-label={g.title}>{g.tiles.map(t => <a key={t.lab} className="public-tile" href={`${home}?lab=${t.lab}`}>
        <span className="public-tile-icon">{t.icon}</span><b>{t.title.split('|').map((part, i) => <Fragment key={part}>{i > 0 && <wbr />}{part}</Fragment>)}</b><span>{t.text}</span></a>)}</nav>
    </section>)}
    <section className="public-info" aria-label="案内">
      <details><summary>使う前に</summary><ul><li>明るい場所でスマホを固定。全身と足元を映してください。</li><li>録画は通常の時間軸を保った120/240fps推奨。スロー書き出し倍率は自動補正しません。</li><li>最新のブラウザを推奨。動画形式・端末によって解析できない場合があります。iPhone・Android全機種での動作は未検証です。</li><li>数値は動画からの推定です。研究・試験機能であり、測定器同等の精度や医療・競技公式判定用途を保証しません。</li></ul></details>
      <details><summary>動画とプライバシー</summary><p>選んだ動画・写真とカメラの映像はブラウザ内で処理し、このアプリからサーバーへ送信しません。会員登録・広告・アクセス解析はありません。初回のモデル取得には通信が必要です。結果は保存ボタンから端末に保存してください。ページを閉じると未保存の結果は失われます。</p><p>サイト配信時のIPアドレス等はホスティング事業者が処理する場合があります。<a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noreferrer">GitHubのプライバシーポリシー</a></p></details>
    </section>
    <footer>SACHIZU LAB · CMJ / RJ / Sprint / Hurdle / Throws / High Jump / Long Jump / Curve Start / Squat · RDL / Posture · 公開テスト版 · <a href={`${home}THIRD_PARTY_NOTICES.md`}>利用ライブラリ・ライセンス</a></footer>
  </main>;
}
const lab = new URLSearchParams(location.search).get('lab');
createRoot(document.getElementById('root')!).render(<Boundary><Suspense fallback={<p role="status" className="public-loading">解析画面を読み込み中…</p>}>
  {lab === 'cmj' ? <CMJ /> : lab === 'rj' || lab === 'rj-toe-cycle' ? <RJ /> : lab === 'sprint10' ? <Sprint /> : lab === 'hurdle' ? <Hurdle /> : lab === 'jav' || lab === 'shot' ? <Throw event={lab} /> : lab === 'highjump' ? <HighJump /> : lab === 'longjump' ? <LongJump /> : lab === 'curve' ? <CurveStart /> : lab === 'strength' ? <Strength /> : lab === 'posture' ? <Posture /> : <Home />}
</Suspense></Boundary>);
