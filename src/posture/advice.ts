/** The posture check's words: what each finding means and what to try, the guides behind the measures, and how to take
 * the pictures. General guides with their sources, not targets for the athlete (as in the other analyses). */
import { GUIDES, type Finding, type MeasureKey } from './analysis';

const f1 = (v: number) => `${Math.abs(v).toFixed(1)}°`;
const side = (v: number) => v > 0 ? '左' : '右';

/** A finding in words: a title and what to do with it. */
export function findingText(f: Finding): { title: string; detail: string } {
  const v = f.value, ahead = v - GUIDES[f.key].ideal > 0, both = f.views.length > 1 ? '（正面と後ろの平均）' : '';
  switch (f.key) {
    case 'headForward': return ahead
      ? { title: '頭が前に出ています', detail: `耳が肩より前にあります（肩→耳の線が${f1(v)}前に傾く）。成人では、頭が前に出た姿勢と首の痛みとの関係が報告されています（Mahmoud 2019）。あごを軽く引き、頭のてっぺんを真上に伸ばす意識で立ってみましょう。` }
      : { title: '頭が後ろに引けています', detail: `耳が肩より後ろにあります（${f1(v)}）。あごを引きすぎていないか、撮影のときの立ち方を確かめましょう。` };
    case 'knee': return v < 0
      ? { title: '膝が反っています（過伸展）', detail: `膝が、股関節と足首を結ぶ線より後ろにあります（${f1(v)}）。膝を伸ばし切って立つくせがあるかもしれません。女子選手では、ACL損傷者に膝の反りが多かったという報告があります（Loudon 1996）。膝を軽くゆるめて立つ意識を持ってみましょう。` }
      : { title: '膝が曲がっています', detail: `立った姿勢で膝が${f1(v)}曲がっています。撮影のとき楽に膝を伸ばして立てていたか確かめ、撮り直して比べてみましょう。` };
    case 'shoulderTilt': return { title: `${side(v)}肩が低めです`, detail: `両肩を結ぶ線が${f1(v)}傾いています${both}。小さな左右差は多くの人に見られます（Ferreira 2011）。利き手や荷物を持つ側、その日の立ち方でも変わるので、同じ条件でくり返し撮って、同じ向きに出るか確かめましょう。` };
    case 'bodyAxis': return { title: `体が${side(v)}に傾いています`, detail: `足首の中点から肩の中点への線が${f1(v)}傾いています${both}。片脚に多く体重を乗せて立っているかもしれません。両足に均等に乗って撮り直して比べてみましょう。` };
    case 'pelvisForward': return ahead
      ? { title: '骨盤が前に出ています', detail: `股関節が足首より前に出ています（足首→股関節の線が${f1(v)}前に傾く。理想の姿勢では約2°）。お腹を前に突き出し、上体を後ろに反らす立ち方（スウェイバック）に見られる並びです。お尻を軽く締め、股関節を足首の上に戻す意識で立ってみましょう。` }
      : { title: '骨盤が後ろに引けています', detail: `股関節が足首の真上より後ろにあります（${f1(v)}）。お尻を後ろに引き、上体を前に倒した立ち方に見られる並びです。` };
    case 'trunkLean': return ahead
      ? { title: '上体が前に傾いています', detail: `股関節から肩への線が${f1(v)}前に傾いています。背中が丸まっていないか、横の写真で確かめましょう。` }
      : { title: '上体が後ろに反っています', detail: `股関節から肩への線が${f1(v)}後ろに傾いています。骨盤が前に出て上体が後ろに残る立ち方（スウェイバック）と一緒に見られることがあります。` };
    case 'bodyLean': return ahead
      ? { title: '体全体が前に傾いています', detail: `足首から耳への線が${f1(v)}前に傾いています（理想の姿勢では約1°）。つま先側に体重が乗った立ち方かもしれません。` }
      : { title: '体全体が後ろに傾いています', detail: `足首から耳への線が${f1(v)}後ろに傾いています。かかと側に体重が乗った立ち方かもしれません。` };
    case 'kneeLeft': case 'kneeRight': {
      const name = f.key === 'kneeLeft' ? '左膝' : '右膝';
      return v > 0
        ? { title: `${name}が外向きです（O脚の向き）`, detail: `${name}が、股関節と足首を結ぶ線より外にあります（${f1(v)}${both}）。膝の並びは骨の形にもよります。痛みがあれば専門家に相談しましょう。` }
        : { title: `${name}が内向きです（X脚の向き）`, detail: `${name}が、股関節と足首を結ぶ線より内にあります（${f1(v)}${both}）。着地やスクワットで膝が内に入りやすいかは、動きの中で確かめましょう。` };
    }
    case 'headTilt': return { title: `頭が${side(v)}に傾いています`, detail: `両耳を結ぶ線が${f1(v)}傾いています${both}。撮影のとき首をかしげていないか確かめ、くり返し同じ向きに出るか見てみましょう。` };
    case 'pelvisTilt': return { title: `${side(v)}の腰が低めです`, detail: `左右の股関節を結ぶ線が${f1(v)}傾いています（参考）。` };
  }
}

/** A measure near the guide's edge in a few words: what, which way, how much. */
export function nearText(f: Finding): string {
  const v = f.value, way = (ahead: string, behind: string) => `${v - GUIDES[f.key].ideal > 0 ? ahead : behind}${f1(v)}`;
  switch (f.key) {
    case 'headForward': return `頭の位置 ${way('前', '後ろ')}`;
    case 'trunkLean': return `上体 ${way('前', '後ろ')}`;
    case 'pelvisForward': return `骨盤の位置 ${way('前', '後ろ')}`;
    case 'knee': return `膝 ${way('曲がり', '反り')}`;
    case 'bodyLean': return `全身の傾き ${way('前', '後ろ')}`;
    case 'headTilt': return `頭の傾き ${side(v)}${f1(v)}`;
    case 'shoulderTilt': return `肩の高さ ${side(v)}が低い${f1(v)}`;
    case 'pelvisTilt': return `腰の高さ ${side(v)}が低い${f1(v)}`;
    case 'bodyAxis': return `体の軸 ${side(v)}${f1(v)}`;
    case 'kneeLeft': case 'kneeRight': return `${f.key === 'kneeLeft' ? '左膝' : '右膝'} ${v > 0 ? 'O脚の向き' : 'X脚の向き'}${f1(v)}`;
  }
}

/** What each measure is and its guide (the app's own; see analysis.ts). */
export const MEASURE_GUIDE: Record<MeasureKey, string> = {
  headTilt: '両耳を結ぶ線の傾き。2°未満を目安の範囲としています。後ろからは耳が髪に隠れやすく読みが揺れるため、後ろの値は参考とし、ポイントには正面の値を使います。',
  shoulderTilt: '両肩（肩の関節の中心）を結ぶ線の傾き。1.5°未満を目安の範囲としています。',
  pelvisTilt: '左右の股関節を結ぶ線の傾き（参考）。骨盤の骨の目印ではなく、服の上から推定した股関節の位置です。',
  bodyAxis: '両足首の中点から両肩の中点への線の傾き。1.5°未満を目安の範囲としています。',
  kneeLeft: '股関節・膝・足首の並び。膝が線より外ならO脚の向き、内ならX脚の向き。4°未満を目安の範囲としています。',
  kneeRight: '股関節・膝・足首の並び。膝が線より外ならO脚の向き、内ならX脚の向き。4°未満を目安の範囲としています。',
  headForward: '肩から耳への線の鉛直からの傾き。理想の姿勢（Kendall）では耳は肩のほぼ真上。10°未満を目安の範囲としています。',
  trunkLean: '股関節から肩への線の鉛直からの傾き。4°未満を目安の範囲としています。',
  pelvisForward: '足首から股関節への線の鉛直からの傾き。理想の姿勢では股関節は足首のわずかに前（約2°）。±3°を目安の範囲としています。',
  knee: '股関節・膝・足首の並び。膝が線より後ろなら反り（過伸展）、前なら曲がり。反りは5°未満、曲がりは8°未満を目安の範囲としています。',
  bodyLean: '足首から耳への線の鉛直からの傾き。理想の姿勢では耳は足首のわずかに前（約1°）。±2°を目安の範囲としています。',
};

/** Always told with the findings. */
export const READING = [
  '小さな左右差やずれは、多くの人に見られます（Ferreira 2011：若い成人115人の写真で、頭・肩・骨盤の小さな傾きがふつう）。',
  '立った姿勢とケガ・記録との関係は、研究でもはっきりしていません（サッカー選手263人で、立った姿勢のずれと下肢のケガに関係なし：Snodgrass 2021）。診断ではありません。痛みやしびれがある場合は医療機関へ。',
  '骨格の点は、皮膚に貼る目印（マーカー）とは少し位置が違います。アプリで測る姿勢は、3次元の計測とずれることが報告されています（Hopkins 2019）。値は目安として、同じ条件で定期的に撮って変化を見るのに使ってください。',
];

/** How to take the pictures. */
export const SHOOTING = [
  'スマホは縦に、まっすぐ立てて（三脚や水平器があると確実）。高さは腰くらい、2.5〜3m離れて頭から足先まで写します。',
  '体にフィットした服で。ゆったりした服だと肩や腰の位置がずれます。髪は耳が見えるようにまとめ、裸足か靴下で。',
  '腕は体の横に自然に下ろし、足は腰幅に開いて、まっすぐ前を見て、いつも通り楽に立ちます。',
  '正面・横・後ろは同じ場所に立ったまま、体の向きだけ変えます。横は右向き・左向きどちらでも。',
];

export const SOURCES = [
  'Kendall FP, et al. Muscles: Testing and Function with Posture and Pain. 5th ed. 2005（理想の姿勢の基準線）',
  'Ferreira EA, et al. J Manipulative Physiol Ther 2011;34:371-380（若い成人115人の写真による姿勢の基準値）',
  'Singla D, Veqar Z. J Chiropr Med 2017;16:131-138（写真で測る姿勢の角度の信頼性）',
  'Hopkins BB, et al. J Manipulative Physiol Ther 2019;42:132-140（姿勢アプリと3次元計測のずれ）',
  'Park SC, et al. Diagnostics 2025;15:1340（AIの写真解析とX線：頭の前方位置 r=-0.71、膝の並び r=0.75）',
  'Mahmoud NF, et al. Curr Rev Musculoskelet Med 2019;12:562-577（頭が前に出た姿勢と首の痛み）',
  'Loudon JK, et al. J Orthop Sports Phys Ther 1996;24:91-97（膝の反りとACL損傷・女子選手）',
  'Snodgrass SJ, et al. Int J Environ Res Public Health 2021;18:6424（立った姿勢と下肢のケガ・サッカー選手）',
];
