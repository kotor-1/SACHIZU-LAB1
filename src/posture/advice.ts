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
      ? { title: '頭部が前方に出ています（頭部前方位）', detail: `耳が肩関節より前方にあります（肩関節→耳の線が前方へ${f1(v)}。理想の姿勢では耳は肩の真上）。成人では、頭部前方位と首の痛みとの関係が報告されています（Mahmoud 2019）。あごを軽く引き、頭のてっぺんを真上に伸ばす意識で立ってみましょう。` }
      : { title: '頭部が後方に引けています', detail: `耳（外耳孔）が肩関節より後方にあります（${f1(v)}）。あごを引きすぎていないか、撮影のときの立ち方を確かめましょう。` };
    case 'knee': return v < 0
      ? { title: '膝関節が過伸展しています（反張膝の傾向）', detail: `膝関節が、股関節と足関節を結ぶ線より後方にあります（${f1(v)}）。膝を伸ばし切って立つくせがあるかもしれません。女子選手では、ACL損傷者に膝の過伸展が多かったという報告があります（Loudon 1996）。膝を軽くゆるめて立つ意識を持ってみましょう。` }
      : { title: '膝関節が屈曲しています', detail: `立った姿勢で膝関節が${f1(v)}屈曲しています。撮影のとき楽に膝を伸ばして立てていたか確かめ、撮り直して比べてみましょう。` };
    case 'shoulderTilt': return { title: `${side(v)}肩が低めです（肩の高さの左右差）`, detail: `両肩関節を結ぶ線が水平から${f1(v)}傾いています${both}。小さな左右差は多くの人に見られます（Ferreira 2011）。利き手や荷物を持つ側、その日の立ち方でも変わるので、同じ条件でくり返し撮って、同じ向きに出るか確かめましょう。` };
    case 'bodyAxis': return { title: `体幹が${side(v)}へ傾斜しています`, detail: `両足関節の中点から両肩の中点への線が、鉛直から${f1(v)}傾いています${both}。片脚に多く体重を乗せて立っているかもしれません。両足に均等に乗って撮り直して比べてみましょう。` };
    case 'pelvisForward': return ahead
      ? { title: '骨盤が前方に偏位しています', detail: `股関節が足関節より前方にあります（前方へ${f1(v)}。理想の姿勢では約2°）。骨盤が前方へ、胸郭が後方へ偏位する姿勢（スウェイバック）に見られる並びで、骨盤の傾きは後傾のことが多いとされます。お尻を軽く締め、股関節を足首の上に戻す意識で立ってみましょう。` }
      : { title: '骨盤が後方に偏位しています', detail: `股関節（の中心）が足関節の真上より後方にあります（${f1(v)}）。お尻を後ろに引き、体幹を前傾させた立ち方に見られる並びです。` };
    case 'trunkLean': return ahead
      ? { title: '体幹が前傾しています', detail: `股関節から肩関節への線が、鉛直から前方へ${f1(v)}傾いています。背中の丸まり（胸椎の後弯）は、この線からは測れません。横の写真で確かめましょう。` }
      : { title: '体幹が後傾しています', detail: `股関節から肩関節への線が、鉛直から後方へ${f1(v)}傾いています。骨盤が前方へ偏位し、胸郭が後方に残る姿勢（スウェイバック）と一緒に見られることがあります。腰を反らせている（腰椎の伸展）という意味ではありません。` };
    case 'bodyLean': return ahead
      ? { title: '全身が前傾しています', detail: `足関節から耳への線が、鉛直から前方へ${f1(v)}傾いています（理想の姿勢では、耳は外果のやや前の鉛直線上で約1°）。つま先側に体重が乗った立ち方かもしれません。` }
      : { title: '全身が後傾しています', detail: `足関節から耳への線が、鉛直から後方へ${f1(v)}傾いています。かかと側に体重が乗った立ち方かもしれません。` };
    case 'kneeLeft': case 'kneeRight': {
      const name = f.key === 'kneeLeft' ? '左膝' : '右膝';
      return v > 0
        ? { title: `${name}が内反しています（O脚傾向）`, detail: `${name}が、股関節と足関節を結ぶ線（脚の軸）より外側にあります（${f1(v)}${both}）。お皿の向きではなく脚の並びです。3°以上の内反は、症状のない若い成人の男性の32%、女性の17%に見られます（Bellemans 2012）。痛みがあれば専門家に相談しましょう。` }
        : { title: `${name}が外反しています（X脚傾向）`, detail: `${name}が、股関節と足関節を結ぶ線（脚の軸）より内側にあります（${f1(v)}${both}）。お皿の向きではなく脚の並びです。着地やスクワットで膝が内に入りやすいか（ニーイン）は、動きの中で確かめましょう。` };
    }
    case 'headTilt': return { title: `頭部が${side(v)}へ傾斜しています（${side(v)}耳が低い）`, detail: `両耳を結ぶ線が水平から${f1(v)}傾いています${both}。撮影のとき首をかしげていないか確かめ、くり返し同じ向きに出るか見てみましょう。` };
    case 'pelvisTilt': return { title: `骨盤の${side(v)}側が低めです（参考）`, detail: `左右の股関節を結ぶ線が水平から${f1(v)}傾いています（服の上から推定した股関節の位置による参考値）。` };
  }
}

/** A measure near the guide's edge in a few words: what, which way, how much. */
export function nearText(f: Finding): string {
  const v = f.value, way = (ahead: string, behind: string) => `${v - GUIDES[f.key].ideal > 0 ? ahead : behind}${f1(v)}`;
  switch (f.key) {
    case 'headForward': return `頭部 ${way('前方偏位', '後方偏位')}`;
    case 'trunkLean': return `体幹 ${way('前傾', '後傾')}`;
    case 'pelvisForward': return `骨盤 ${way('前方偏位', '後方偏位')}`;
    case 'knee': return `膝関節 ${way('屈曲', '過伸展')}`;
    case 'bodyLean': return `全身 ${way('前傾', '後傾')}`;
    case 'headTilt': return `頭部の側方傾斜 ${side(v)}${f1(v)}`;
    case 'shoulderTilt': return `肩の高さ ${side(v)}が低い${f1(v)}`;
    case 'pelvisTilt': return `骨盤の側方傾斜 ${side(v)}が低い${f1(v)}`;
    case 'bodyAxis': return `体幹の側方傾斜 ${side(v)}${f1(v)}`;
    case 'kneeLeft': case 'kneeRight': return `${f.key === 'kneeLeft' ? '左膝' : '右膝'} ${v > 0 ? '内反（O脚傾向）' : '外反（X脚傾向）'}${f1(v)}`;
  }
}

/** What each measure is and its guide (the app's own; see analysis.ts). */
export const MEASURE_GUIDE: Record<MeasureKey, string> = {
  headTilt: '頭部の側方傾斜：両耳を結ぶ線の水平からの傾き（低い側を表示）。理想の姿勢では水平。2°未満を目安の範囲としています。後ろからは耳が髪に隠れやすく読みが揺れるため、後ろの値は参考とし、ポイントには正面の値を使います。',
  shoulderTilt: '肩の高さの左右差：両肩関節の中心を結ぶ線の水平からの傾き。理想の姿勢では水平。1.5°未満を目安の範囲としています。',
  pelvisTilt: '骨盤の側方傾斜（参考）：左右の股関節の中心を結ぶ線の傾き。骨盤の骨の目印（腸骨稜・上前腸骨棘）ではなく、服の上から推定した股関節の位置です。',
  bodyAxis: '体幹の側方傾斜：両足関節の中点から両肩の中点への線の鉛直からの傾き。理想の姿勢では、基準線は体の正中を通り鉛直。1.5°未満を目安の範囲としています。',
  kneeLeft: '膝の内反・外反（前額面の脚の軸）：股関節の中心・膝関節の中心・足関節の中心の並び（X線で見る下肢機能軸にあたる線）。膝が線より外側なら内反（O脚傾向）、内側なら外反（X脚傾向）。膝のお皿の向き（回旋）ではありません。理想は中間位ですが、3°以上の内反は症状のない若い成人の男性32%・女性17%に見られます（Bellemans 2012）。写真の点では2〜3°の誤差があるため、正面と後ろの平均で4°未満を目安の範囲としています。',
  kneeRight: '膝の内反・外反（前額面の脚の軸）：股関節の中心・膝関節の中心・足関節の中心の並び（X線で見る下肢機能軸にあたる線）。膝が線より外側なら内反（O脚傾向）、内側なら外反（X脚傾向）。膝のお皿の向き（回旋）ではありません。理想は中間位ですが、3°以上の内反は症状のない若い成人の男性32%・女性17%に見られます（Bellemans 2012）。写真の点では2〜3°の誤差があるため、正面と後ろの平均で4°未満を目安の範囲としています。',
  headForward: '頭部の前方偏位：肩関節から耳への線の鉛直からの傾き。理想の姿勢（Kendall）では、耳（外耳孔）は肩（肩峰）の真上の鉛直線上。臨床の頭蓋脊椎角（耳珠と第7頸椎を結ぶ線）とは別の角度です。10°未満を目安の範囲としています。',
  trunkLean: '体幹の前傾・後傾：股関節の中心から肩関節への線の鉛直からの傾き。理想の姿勢では鉛直。背中の丸まり（胸椎の後弯）や腰の反り（腰椎の前弯）は、この線では測れません。4°未満を目安の範囲としています。',
  pelvisForward: '骨盤の前後の偏位：足関節から股関節の中心への線の鉛直からの傾き。理想の姿勢（Kendall）では、基準線が大転子と外果のやや前を通るため、股関節は足関節のわずかに前（約2°）。骨盤が前方へ、胸郭が後方へ偏位する姿勢をスウェイバックといい、このとき骨盤はむしろ後傾し、腰椎の前弯は減ることが多いとされます。骨盤の傾き（前傾・後傾）とは別のもので、写真の点では測れません。±3°を目安の範囲としています。',
  knee: '膝関節の屈曲・過伸展：股関節・膝関節・足関節の中心の並び。理想の姿勢（Kendall）では、基準線は膝関節のやや前を通り、膝は過伸展しない伸展位。膝が線より後ろなら過伸展（反張膝の傾向）、前なら屈曲。過伸展は5°未満、屈曲は8°未満を目安の範囲としています。',
  bodyLean: '全身の前傾・後傾：足関節から耳への線の鉛直からの傾き。理想の姿勢（Kendall）では、耳は外果のやや前の鉛直線上（約1°）。±2°を目安の範囲としています。',
};

/** Always told with the findings. */
export const READING = [
  '小さな左右差やずれは、多くの人に見られます（Ferreira 2011：若い成人115人の写真で、頭・肩・骨盤の小さな傾きがふつう）。',
  '理想の姿勢（Kendallの基準線：耳・肩・大転子・膝のやや前・外果のやや前が鉛直に並ぶ）は、実際の重心線や、年齢・性別による自然な姿勢とは一致せず、ずれを異常と判定する根拠は十分でないとする総説があります（Barra-López 2024）。目安からのずれは異常の判定ではなく、同じ条件で撮って変化を見るための目安です。',
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
  'Kendall FP, et al. Muscles: Testing and Function with Posture and Pain. 5th ed. 2005（理想の姿勢の基準線、スウェイバック）',
  'Barra-López ME. J Rehabil Med 2024;56:jrm41899（The standard posture is a myth：理想の姿勢の基準の根拠を検討した総説）',
  'Bellemans J, et al. Clin Orthop Relat Res 2012;470:45-53（症状のない若い成人250人のX線：3°以上の内反は男性32%・女性17%）',
  'Ferreira EA, et al. J Manipulative Physiol Ther 2011;34:371-380（若い成人115人の写真による姿勢の基準値）',
  'Singla D, Veqar Z. J Chiropr Med 2017;16:131-138（写真で測る姿勢の角度の信頼性）',
  'Hopkins BB, et al. J Manipulative Physiol Ther 2019;42:132-140（姿勢アプリと3次元計測のずれ）',
  'Park SC, et al. Diagnostics 2025;15:1340（AIの写真解析とX線：頭の前方位置 r=-0.71、膝の並び r=0.75）',
  'Mahmoud NF, et al. Curr Rev Musculoskelet Med 2019;12:562-577（頭が前に出た姿勢と首の痛み）',
  'Loudon JK, et al. J Orthop Sports Phys Ther 1996;24:91-97（膝の反りとACL損傷・女子選手）',
  'Snodgrass SJ, et al. Int J Environ Res Public Health 2021;18:6424（立った姿勢と下肢のケガ・サッカー選手）',
];
