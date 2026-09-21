import { Component, lazy, Suspense, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './public.css';

const CMJ = lazy(() => import('../cmj/CMJLab'));
const Sprint = lazy(() => import('../sprint10/Sprint10Lab'));
const RJ = lazy(() => import('./ReboundPublic'));
const home = import.meta.env.BASE_URL;
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <main className="public-home"><h1>画面を読み込めませんでした</h1><p>通信を確認し、ページを再読み込みしてください。未保存の解析結果は失われます。</p><a href={home}>メニューに戻る</a></main> : this.props.children; }
}
function Home() {
  return <main className="public-home">
    <header><span className="public-mark">S</span><strong>SACHIZU LAB</strong><span className="public-badge">無料・ベータ版</span></header>
    <section className="public-hero"><p className="public-eyebrow">JUMP & SPRINT ANALYSIS</p><h1>動きを撮る。<br />変化を確かめる。</h1><p>CMJ・リバウンドジャンプ・10m走。<br />いつもの動画から、次の練習につながる記録を。</p></section>
    <nav className="public-cards" aria-label="解析種目">
      {[['cmj', '01', 'CMJ', '垂直跳び', 'カメラ・録画から、跳躍高を推定。'], ['rj', '02', 'RJ', 'リバウンドジャンプ', '認識した回数の平均・最大RSI。離地・着地を確認して修正。'], ['sprint10', '03', '10m', 'スプリント', '2本のラインと最初の1歩を設定。通過時間・歩数・各歩の距離。']].map(([id, n, title, subtitle, text]) => <a key={id} href={`${home}?lab=${id}`}><span>{n} / {subtitle}</span><h2>{title}<b aria-hidden="true">↗</b></h2><p>{text}</p><strong>解析をはじめる →</strong></a>)}
    </nav>
    <section className="public-info"><h2>使う前に</h2><ul><li>明るい場所でスマホを固定。全身と足元を映してください。</li><li>録画は通常の時間軸を保った120/240fps推奨。スロー書き出し倍率は自動補正しません。</li><li>最新のブラウザを推奨。動画形式・端末によって解析できない場合があります。iPhone・Android全機種での動作は未検証です。</li><li>数値は動画からの推定です。研究・試験機能であり、測定器同等の精度や医療・競技公式判定用途を保証しません。</li></ul></section>
    <section className="public-info"><h2>動画とプライバシー</h2><p>選んだ動画はブラウザ内で処理し、このアプリからサーバーへ送信しません。会員登録・広告・アクセス解析はありません。初回のモデル取得には通信が必要です。結果は保存ボタンから端末に保存してください。ページを閉じると未保存の結果は失われます。</p><p>サイト配信時のIPアドレス等はホスティング事業者が処理する場合があります。<a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noreferrer">GitHubのプライバシーポリシー</a></p></section>
    <footer>SACHIZU LAB · CMJ / RJ / 10m · 公開テスト版 · <a href={`${home}THIRD_PARTY_NOTICES.md`}>利用ライブラリ・ライセンス</a></footer>
  </main>;
}
const lab = new URLSearchParams(location.search).get('lab');
createRoot(document.getElementById('root')!).render(<Boundary><Suspense fallback={<p role="status" className="public-loading">解析画面を読み込み中…</p>}>
  {lab === 'cmj' ? <CMJ /> : lab === 'rj' ? <RJ /> : lab === 'sprint10' ? <Sprint /> : <Home />}
</Suspense></Boundary>);
