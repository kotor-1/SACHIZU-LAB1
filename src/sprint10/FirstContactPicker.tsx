import ExactFramePicker, { type FirstContact } from '../cmj/ExactFramePicker';
export type { FirstContact } from '../cmj/ExactFramePicker';
export default function FirstContactPicker(props: {
  file: File; disabled: boolean; getTime: () => number; onRegister: (contact: FirstContact) => void; registered: FirstContact | null;
}) {
  return <ExactFramePicker file={props.file} disabled={props.disabled} getTime={props.getTime}
    instructions="最初から接地している前足は0歩です。遊脚が前に出て初めて接地したコマを1歩目として登録してください。"
    frameLabel="1歩目の接地確認フレーム"
    registrations={[{ label: 'ここを1歩目にする', value: props.registered, onRegister: props.onRegister }]} />;
}
