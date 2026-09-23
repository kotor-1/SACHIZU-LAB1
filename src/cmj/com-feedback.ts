/** Actionable capture feedback; detailed model diagnostics stay in details. */
export function comFeedback(reason?: string | null): string {
  switch (reason) {
    case 'LIVE_MODEL_WARMUP': return 'ライブ解析の処理速度を確認中です。全身を映して静止してお待ちください。';
    case 'INSUFFICIENT_ARC_SAMPLES':
    case 'INSUFFICIENT_SHORT_ARC_EVIDENCE': return '空中の動きを計算するためのコマ数が足りませんでした。';
    case 'GRAVITY_ARC_UNRESOLVED': return '空中の重心軌道が不安定で、高さを計算できませんでした。';
    case 'INSUFFICIENT_RISE': return '重心の上昇を十分に確認できませんでした。';
    case 'CAMERA_TIME_UNAVAILABLE': return '骨格表示中。カメラの撮影時刻を取得できないため、高さの計測には録画解析をお使いください。';
    case 'POSE_NOT_UNIQUE': return '1人だけが映る位置で撮影してください。';
    case 'BODY_POINT_OUTSIDE_IMAGE':
    case 'BODY_TOO_SMALL_OR_NOT_UPRIGHT': return '頭から足先まで全身が映る位置で、正面を向いてください。';
    case 'BODY_POINT_OCCLUDED': return '腕や脚の一部を確認できません。明るい場所で正面から撮影してください。';
    case 'COM_TRACKING_OR_SAMPLE_GAP':
    case 'COM_TRACKING_LOST':
    case 'COM_SAMPLE_GAP': return '映像または身体の追跡が途切れました。全身が映る録画で再計測してください。';
    case 'PROPULSION_TRANSITION_AMBIGUOUS':
    case 'PROPULSION_TRANSITION_UNRESOLVED':
    case 'FIT_WINDOWS_DISAGREE': return '蹴り出しの速度を十分に絞り込めず、高さを確定できませんでした。';
    case 'SUBJECT_DRIFT': return '身体の横移動が大きいため、同じ場所でジャンプしてください。';
    case 'RECORDING_ENDED_BEFORE_RECOVERY': return 'ジャンプ後まで映った動画を選んでください。';
    case 'PREPARATION_NOT_CONFIRMED': return 'ジャンプ前の静止を確認できませんでした。最初に1秒ほど静止して撮影してください。';
    case 'NO_JUMP_DETECTED': return '準備完了後のジャンプを確認できませんでした。最初に静止し、ジャンプ後まで撮影してください。';
    default: return '身体の軌道を十分に確認できず、高さを確定できませんでした。';
  }
}
