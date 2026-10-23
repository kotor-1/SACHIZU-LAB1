import type { Tour, TourStep } from './tour';

/** The words of every screen's guided tours (src/tour/tour.ts): the first visit's (how to set it up and start) and the
 * first result's (how to read it). The parts are found by the screens' own classes and labels; a step whose part a
 * screen does not show now (its other mode, a camera instead of a video) is left out. */

export interface TourSet {
  setup: Tour;
  results?: Tour;
  /** On the screen once there is a result to read. */
  resultsAt?: string;
}

// The analysis screens' shared parts (sprint10.css): the filming notes, the cards 1 動画を選ぶ / 2 lines or points /
// 3 解析する (kept at the foot of the screen), the result card with its numbers, check note, tabs and save button.
const intro = (title: string, text: string): TourStep => ({ at: 'main > header', title, text });
const HOWTO: TourStep = { at: '.sprint10-howto', title: '撮り方を読む', text: '撮る前に一度、ここを開いてください。1080p・1秒120コマが基本です。カメラの置き方や向きなど、撮り方の注意が書いてあります。' };
const VIDEO: TourStep = { at: '.sprint10-card:has(.sprint10-upload)', title: '動画を選ぶ', text: 'スマホに保存した動画を選びます。動画はこの端末の中だけで処理し、どこにも送りません。' };
const LINES = '.sprint10-card:has(.sprint10-player)';
const RUN: TourStep = { at: '.sprint10-run', title: '解析する', text: '準備がそろうと押せます。動画の長さと端末によっては数分かかるので、終わるまでこの画面を開いておいてください。' };
const AGAIN: TourStep = { at: '.tour-open', title: 'いつでも見直せます', text: 'この「使い方」ボタンで、いつでも案内を見られます。結果が出たら、結果の見方も案内します。' };
const MODES: TourStep = { at: '.sprint10-modes', title: '解析の種類を選ぶ', text: 'スタート10m・最高速度区間・クラウチングスタートから選びます。選ぶと、その解析の画面に変わります。' };

const SUMMARY = (text: string): TourStep => ({ at: '.sprint10-result .sprint10-metrics', title: 'まず大事な数値', text });
const CHECK = (moments = '接地・離地などの瞬間'): TourStep => ({ at: '.sprint10-result .crouch-check-note', title: '自動の判定を確かめる',
  text: `${moments}は自動で判定しています。「確認する」で1コマずつ見て、ずれていたら直せます。直すと数値はすぐ変わります。` });
const TABS = (items: NonNullable<TourStep['items']>): TourStep => ({ at: '.sprint10-result [role="tablist"]', title: 'タブで見方を切り替える', text: '押すと、下の表示が変わります。', items });
const POSE = (prefix: string): TourStep => ({ at: `#${prefix}-tab-pose`, title: '骨格がずれていたら',
  text: '「姿勢」の画像で骨格の点が体からずれていたら、画像の下の「骨格を直す」で肩・腰・膝・足首の点を指で動かせます。決めると角度が計算し直されます。' });
const SAVE: TourStep = { at: '.sprint10-result > button:last-child', title: '結果を保存する', text: '結果はファイル（JSON）で端末に保存できます。ページを閉じると、保存していない結果は消えます。' };
const RESULT = '.sprint10-result .sprint10-metrics';

const sprintResults = (id: string, summary: string, advice: string): Tour => ({ id, steps: [
  SUMMARY(summary),
  CHECK('線を越える瞬間と、各歩の接地・離地'),
  TABS([['ポイント', advice], ['力', '1歩ごとに地面を押した力'], ['確認', '判定したコマを1コマずつ直す'], ['歩ごと', '1歩ごとの接地時間と滞空時間'], ['スロー', '判定した瞬間をスローで見る']]),
  SAVE] });
const throwSetup = (id: string, title: string, what: string, choose: string): Tour => ({ id, steps: [
  intro(title, what), HOWTO, VIDEO,
  { at: LINES, title: '選手に線を合わせる', text: `線を、動画の最初のコマの選手に合わせ、${choose}を選びます。身長（任意）を入れると、リリースの速さなども出します。` },
  RUN, AGAIN] });
const throwResults = (id: string, summary: string): Tour => ({ id, steps: [
  SUMMARY(summary), CHECK('接地とリリースの瞬間'),
  TABS([['ポイント', '見方のポイントと参考値'], ['確認', '接地とリリースのコマを直す'], ['姿勢', '局面ごとの角度の画像'], ['数値', '局面の時間と姿勢の表'],
    ['リリース', '手を離れる速さと角度（目安）'], ['スロー', '判定した瞬間をスローで見る']]),
  POSE('throw'), SAVE] });

export const SETS: Record<string, TourSet> = {
  home: { setup: { id: 'home', steps: [
    { title: 'SACHIZU LAB へようこそ', text: '撮った動画やカメラの映像から、動きを数値で確かめるアプリです。映像はこの端末の中だけで処理し、どこにも送りません。' },
    { at: '.public-filter', title: '種類でしぼる', text: 'ジャンプ・スプリント・種目解析・トレーニング・からだから選ぶと、その種類の解析だけが並びます。' },
    { at: '.public-tiles .public-tile', title: '解析を選ぶ', text: 'タイルを押すと、その解析の画面が開きます。どの画面も、初めて開いたときに使い方を案内します。' },
    { at: '.public-info', title: '使う前に読む', text: '撮り方のコツ（明るい場所でスマホを固定し、全身と足元を映す。1080p・1秒120コマが基本）と、動画の扱いは、ここを開くと読めます。' },
    { at: '.tour-open', title: 'いつでも見直せます', text: 'この「使い方」ボタンで、いつでもこの案内をもう一度見られます。' }] } },

  cmj: {
    setup: { id: 'cmj', steps: [
      { at: '.cmj-heading', title: 'CMJ（垂直跳び）', text: '全身の動きから、ジャンプの高さを推定します。録画した動画でも、カメラでその場でも測れます。' },
      { at: '.cmj-mode[aria-label="入力方法"]', title: '録画か、カメラか', text: '「録画を解析」は保存した動画から、「カメラで計測」はその場で跳ぶたびに高さを出します。' },
      { at: '.cmj-legs', title: '跳び方を選ぶ', text: '両脚か、片脚（右・左）かを選びます。' },
      { at: '.cmj-primary-actions', title: '始める', text: '録画は「動画を読み込む」で選んで「動画を解析する」。カメラは「カメラを起動する」を押して、好きなタイミングで跳びます。' },
      { at: '.cmj-result-panel', title: '結果はここに並ぶ', text: 'ジャンプごとの高さが並びます。押すと、そのジャンプの高さを上の画面に表示します。' },
      { at: '.cmj-setup', title: '撮る前の3つの準備', text: '正面から全身を、明るい場所で。スマホは動かさないように固定し、腰に手を置いて跳びます。' },
      AGAIN] },
    results: { id: 'cmj-results', steps: [
      { at: '.cmj-result-list', title: 'ジャンプごとの高さ', text: '離地から重心の最高点までの高さ（推定）です。押すと、そのジャンプの高さを上の画面に表示します。測れなかった回には理由を書きます。' },
      { at: '.cmj-export', title: '解析データを保存する', text: '結果と解析データをファイル（JSON）で端末に保存できます。' },
      { at: '.cmj-method', title: '測定方法と精度', text: '高さの求め方と注意は、ここを開くと読めます。' }] },
    resultsAt: '.cmj-result-list' },

  rj: {
    setup: { id: 'rj', steps: [
      { at: '.rj-title', title: 'RJ（リバウンドジャンプ）', text: '連続ジャンプの動画から、平均RSIを推定します。身長や物差しを入れたり、コマを指定したりする必要はありません。' },
      { at: '.rj-legs', title: '跳び方を選ぶ', text: '両脚か、片脚（右・左）かを選びます。' },
      { at: '.rj-source', title: '録画かカメラか', text: '撮った動画を読み込むか、カメラで撮りながら測るかを選びます。カメラは1秒60コマで撮り、跳び終わるとすぐ結果が出ます。' },
      { at: '.rj-capture', title: '動画を選ぶ', text: '全身と左右の靴、床が映る動画を選びます。正面から、靴と床の色がはっきり違う場所で撮ると正確です。' },
      { at: 'section[aria-label="保存済み骨格から再計算"]', title: '保存したJSONから', text: '前に保存したJSONを選ぶと、動画を読み直さずに計算し直せます。' },
      { at: '.rj-lab > .rj-button', title: '解析する', text: '「入力なしでRJを解析」を押すと解析が始まります。終わるまでこの画面を開いておいてください。' },
      AGAIN] },
    results: { id: 'rj-results', steps: [
      { at: '.rj-auto-headline', title: '平均RSI', text: '平均RSI（推定）と、最後の3回の平均・最高です。計算できた周期の数と、平均の接地時間も出します。' },
      { at: '.rj-result .rj-table', title: '周期ごとの値', text: '周期ごとの接地時間とRSIの推定です。計算できなかった周期は、状態の欄に理由を書きます。' },
      { at: '.rj-lab > button:last-of-type', title: '結果を保存する', text: '予測結果と骨格をファイル（JSON）で保存できます。あとで「保存済みJSONから再計算」に使えます。' }] },
    resultsAt: '.rj-result .rj-auto-headline' },

  sprint10: {
    setup: { id: 'sprint10', steps: [
      intro('10m スプリント解析', 'スタートから10mの通過時間・歩数・ピッチと、1歩ごとの接地・滞空の時間を出します。'), MODES, HOWTO, VIDEO,
      { at: LINES, title: 'スタートとゴールに線を合わせる', text: '動画を選ぶと最初のコマが出ます。2本の線を走路のスタートと10mの目印に合わせ（ドラッグと◀▶）、「この2本のラインで決定」を押します。' },
      RUN, AGAIN] },
    results: sprintResults('sprint10-results', '10mの通過時間・歩数・ピッチと、平均の接地時間・滞空時間です。', '数値の見方'), resultsAt: RESULT },
  flying: {
    setup: { id: 'flying', steps: [
      intro('最高速度区間の解析', '例えば50〜60mの区間の通過時間・ピッチと、1歩ごとの接地・滞空の時間を出します。'), MODES,
      { at: '.sprint10-section', title: '区間を入れる', text: '区間の入口（スタートから何m地点か）と長さを入れます。長さは2本の線の実際の間隔です。' },
      HOWTO, VIDEO,
      { at: LINES, title: '入口と出口に線を合わせる', text: '動画を選ぶと最初のコマが出ます。2本の線を区間の入口と出口の目印（白線・コーン）に合わせ、「この2本のラインで決定」を押します。' },
      RUN, AGAIN] },
    results: sprintResults('flying-results', '区間の通過時間・歩数・ピッチ、目標50mタイム、平均の接地時間・滞空時間です。', '数値の見方と、目標50mタイムの求め方'), resultsAt: RESULT },
  crouch: {
    setup: { id: 'crouch', steps: [
      intro('クラウチングスタートの解析', 'ブロックから5歩目まで、各歩の接地・滞空・ピッチと、姿勢の角度を出します。'), MODES, HOWTO, VIDEO,
      { at: LINES, title: 'スタートラインに線を合わせる', text: '動画を選ぶと最初のコマが出ます。線を走路のスタートラインに合わせます（ドラッグと◀▶）。選手はこの線の近くの人として選ばれます。' },
      RUN, AGAIN] },
    results: { id: 'crouch-results', steps: [
      SUMMARY('解析した歩数と、ブロックを離れてから1歩目の接地までの時間です。'), CHECK(),
      TABS([['ポイント', '参考値と比べる・歩ごとの流れ'], ['力', 'ブロックと各歩で地面を押した力'], ['確認', '接地・離地などのコマを直す'], ['姿勢', '局面ごとの角度の画像'],
        ['歩ごと', '1歩ごとの表とグラフ'], ['スロー', '判定した瞬間をスローで見る']]),
      { at: '.crouch-research', title: '参考値と比べる', text: '参考値と比べて、良いところと直すところ（順番とコツ）を出します。項目を押すと、下の画像でこの選手と参考値の範囲を比べられます。' },
      { at: ['.crouch-research .pose-edit-row', '#crouch-tab-pose'], title: '骨格がずれていたら',
        text: '画像の骨格が体からずれていたら、画像の下の「骨格を直す」で肩・腰・膝・足首の点を指で動かせます（「姿勢」の画像でも）。決めると値が計算し直されます。' },
      SAVE] },
    resultsAt: RESULT },

  hurdle: {
    setup: { id: 'hurdle', steps: [
      intro('ハードルの解析', '踏切から着地まで、重心が最高点になる位置、接地と空中の時間、姿勢の角度を出します。'), HOWTO, VIDEO,
      { at: LINES, title: 'ハードルに線を合わせる', text: '縦の線をハードルに、上の横線をバーの上端に、下の横線を足元に合わせ、ハードルの高さを選びます。高さが距離の物差しになります。' },
      RUN, AGAIN] },
    results: { id: 'hurdle-results', steps: [
      SUMMARY('重心が最高点になる位置（ハードルの手前か先か）、空中時間、踏切の接地時間、踏切と着地の距離の割合です。'), CHECK(),
      TABS([['ポイント', '見方のポイントと参考値'], ['確認', '接地・離地のコマを直す'], ['姿勢', '局面ごとの角度の画像'], ['時間', '局面ごとの時間'], ['スロー', '判定した瞬間をスローで見る']]),
      POSE('hurdle'), SAVE] },
    resultsAt: RESULT },

  jav: { setup: throwSetup('jav', 'やり投げの解析', 'ブロック脚（前足）の接地からリリースまで、ブロック脚の膝の角度と投げの時間を出します。', '投げる手'),
    results: throwResults('jav-results', 'ブロック脚の膝の角度（接地・最も曲がった時・リリース時）と、投げの時間です。'), resultsAt: RESULT },
  shot: { setup: throwSetup('shot', '砲丸投の解析', 'グライドまたは立ち投げの、局面ごとの時間とパワーポジションの姿勢を出します。', '投げる手と投法'),
    results: throwResults('shot-results', '局面ごとの時間と、パワーポジション・リリースの膝の角度などです。'), resultsAt: RESULT },

  highjump: {
    setup: { id: 'highjump', steps: [
      intro('走高跳（はさみ跳び）の解析', '踏切で得た上向きの速さ、空中で上がった高さ、最後の2歩のリズム、踏切の後傾を出します。'), HOWTO, VIDEO,
      { at: LINES, title: '支柱とバーに点を合わせる', text: '左右の支柱で、上の点をバーがのっている所に、下の点を支柱の根元に合わせ、バーの高さを入れます。支柱とバーが物差しになります。' },
      RUN, AGAIN] },
    results: { id: 'highjump-results', steps: [
      SUMMARY('離地の上向きの速さ、空中で上がった高さ、最後の2歩の時間、踏切接地の後傾です。'), CHECK(),
      TABS([['ポイント', '見方のポイントと参考値'], ['確認', '接地・離地のコマを直す'], ['姿勢', '踏切の姿勢の画像'], ['リズム', '最後の数歩の時間'], ['スロー', '判定した瞬間をスローで見る']]),
      POSE('highjump'), SAVE] },
    resultsAt: RESULT },

  longjump: {
    setup: { id: 'longjump', steps: [
      intro('走り幅跳びの解析', '踏切に入る最後の数歩の助走速度（目安）とリズム、踏切の姿勢、離地の速さと角度を出します。'), HOWTO,
      { at: VIDEO.at, title: '動画を選び、身長を入れる', text: '動画を選びます。身長（任意）を入れると、胴の長さから速さの物差しを決めます。走る向きと選手は自動で見つけます。' },
      RUN, AGAIN] },
    results: { id: 'longjump-results', steps: [
      SUMMARY('助走速度（最後の2歩）、踏切接地の瞬間の速さ、離地の鉛直速度と角度です。速さは動画からの目安です。'), CHECK(),
      TABS([['ポイント', '速さのグラフと見方'], ['確認', '接地・離地のコマを直す'], ['姿勢', '接地ごとの姿勢の画像'], ['数値', '1歩ごとの値'], ['スロー', '判定した瞬間をスローで見る']]),
      POSE('lj'), SAVE,
      { at: 'section[aria-label="物差し"]', title: '物差しで正確に（任意）', text: '踏切板と砂場が映っていれば、4つの点を合わせると、速さをより正確に出せます。' }] },
    resultsAt: RESULT },

  curve: {
    setup: { id: 'curve', steps: [
      intro('カーブスタートの解析', 'ブロックからまっすぐ出られたか、その後カーブに沿って内傾して走れたかを、走った軌跡で見ます。'), HOWTO, VIDEO,
      { at: LINES, title: 'レーンの白線に点を合わせる', text: '選手のレーンの内側と外側の白線に、スタートラインと交わる所で点を合わせます。見つかった白線が線で表示されます。' },
      RUN, AGAIN] },
    results: { id: 'curve-results', steps: [
      SUMMARY('理想の道より内側へ入った量、出た向き、接点の後のラインからの距離、曲がってからの内傾です。'),
      TABS([['ポイント', '見方のポイント'], ['軌跡', '走った道と理想の道'], ['内傾', '体の内側への傾き'], ['スロー', '走りをスローで見る']]),
      SAVE] },
    resultsAt: RESULT },

  strength: {
    setup: { id: 'strength', steps: [
      intro('スクワット・RDLのフォーム解析', '真横から撮って、1回ごとの姿勢の角度と、上げ下げの時間を確かめます。'), HOWTO,
      { at: '.sprint10-card:has(.strength-seg)', title: '種目と方法を選ぶ', text: 'スクワット・RDL（両脚）・RDL（片脚）から選び、録画した動画か、カメラでその場で測るかを選びます。' },
      { at: '.sprint10-card:has(.sprint10-upload)', title: '動画を選んで解析する', text: '1セット分（90秒まで）の動画を選び、「解析する」を押します。' },
      { at: '.sprint10-card:has(.strength-options)', title: 'カメラで測る', text: '「カメラを起動する」で計測が始まり、1回ごとに回数とひとことを声で知らせます。セットが終わったら「計測を終える」を押します。' },
      AGAIN] },
    results: { id: 'strength-results', steps: [
      SUMMARY('回数と、セット全体の角度と時間のまとめです。'),
      TABS([['ポイント', '見方のポイントと目安'], ['回ごと', '1回ごとの表とグラフ'], ['姿勢', '各回の最も深い所の画像', '#strength-tab-pose'], ['スロー', '各回をスローで見る', '#strength-tab-replay']]),
      POSE('strength'), SAVE] },
    resultsAt: RESULT },

  posture: {
    setup: { id: 'posture', steps: [
      intro('姿勢解析', '正面・横・後ろの立ち姿勢から、左右の傾きと前後のずれを角度で見ます。'),
      { at: '.posture-mode', title: '撮り方を選ぶ', text: 'カメラの枠に立って自動で撮るか、撮ってある写真を選ぶかを選びます。' },
      { at: '.sprint10-card:has(.posture-options)', title: 'カメラで撮る', text: '使うカメラと撮る向きを選んで「カメラを起動する」。スマホを置いて離れ、枠の中に立つと、まっすぐ止まったところで自動で撮ります。' },
      { at: '.posture-slots', title: '写真を選ぶ', text: '正面・横・後ろの枠を押して、向きごとに1枚選びます。選ぶとすぐ解析します。1枚だけでも見られます。' },
      { at: '.sprint10-card > details.sprint10-more', title: '撮り方', text: '立ち方やスマホの高さ・距離、服装など、撮り方のコツはここを開くと読めます。' },
      AGAIN] },
    results: { id: 'posture-results', steps: [
      { at: '.sprint10-result [role="tablist"]', title: 'タブで見方を切り替える', text: '押すと、下の表示が変わります。',
        items: [['ポイント', '目安から外れた所のまとめ'], ['正面・横・後ろ', '写真の上の線と、項目ごとの表。写真が傾いていたら「写真の傾きを直す」で合わせます']] },
      { at: '#posture-panel-points .sprint10-advice', title: '気づいた点', text: '目安の範囲から外れた所を書きます。目安との差が読み取りの誤差より小さい値は、「目安の境目」として別にまとめます。' },
      SAVE] },
    resultsAt: '.sprint10-result[aria-label="姿勢の結果"]' },
};

/** A screen's tours as it is now (the sprint screen by its chosen mode), or null. */
export function setOf(page: string): TourSet | null {
  if (page === 'sprint10') {
    const chosen = document.querySelector('.sprint10-modes [aria-pressed="true"]')?.textContent ?? '';
    return chosen.includes('クラウチング') ? SETS.crouch : chosen.includes('最高速度') ? SETS.flying : SETS.sprint10;
  }
  return SETS[page === 'rj-toe-cycle' ? 'rj' : page] ?? null;
}

/** Something is running (an analysis, a camera, photos being read): no tour opens by itself then. */
export const BUSY = 'progress, [role="progressbar"], .cmj-stop, .strength-stop, .rj-secondary, .posture-camera, [data-busy="true"]';
