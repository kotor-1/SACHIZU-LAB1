import { PickFoot, StickFigure, type Joints } from '../sprint10/CrouchPickGuide';

/** The sample picture for each moment of the long jump from the stands (stand-pick.ts), as the crouch start's light mode
 * shows them (sprint10/CrouchPickGuide.tsx): a stick figure of a saved jump at that moment (RTMPose's joints at the
 * analysis' frames of すずね幅跳び２, dev-validation/longjump-pick/sample-poses.ts; leg lengths from the stance foot's toe,
 * the ground at 0, running right), the foot to look at in the accent colour, and that foot enlarged. A drawing, not
 * anyone's picture. */
type Sample = 'takeoffDown' | 'takeoffOff';
const SAMPLES: Record<Sample, Joints> = {
  takeoffDown: { 0: [-.71, -1.84], 11: [-.93, -1.55], 12: [-.68, -1.57], 13: [-1.19, -1.38], 14: [-.62, -1.36], 15: [-1, -1.13], 16: [-.44, -1.42], 23: [-.77, -.95], 24: [-.75, -.95],
    25: [-.44, -.58], 26: [-.89, -.48], 27: [-.25, -.07], 28: [-1.32, -.63], 29: [-.29, -.01], 30: [-1.37, -.71], 31: [-.01, -.02], 32: [-1.58, -.56] },
  takeoffOff: { 0: [.48, -2.08], 11: [.46, -1.79], 12: [.31, -1.78], 13: [.69, -1.56], 14: [.14, -1.54], 15: [.67, -1.86], 16: [.05, -1.3], 23: [.4, -1.2], 24: [.51, -1.24],
    25: [.21, -.73], 26: [.94, -1.18], 27: [-.03, -.27], 28: [.75, -.75], 29: [-.11, -.24], 30: [.67, -.7], 31: [.06, -.04], 32: [.84, -.54] },
};
/** What to set at each moment (a touchdown is the first frame with the foot down, a toe-off the last; crouch.ts frameEdge). */
export const STAND_TEXT = {
  tap: { title: '跳ぶ選手をタップ', text: '下のつまみで踏切板の近くのコマにして、跳ぶ選手の体をタップします。その選手のまわりを拡大し、AIもその選手を見ます。', zoom: '' },
  takeoffDown: { title: '踏切足が板に着いた最初のコマ', text: '1つ前のコマでは、まだ足が浮いています。', zoom: '靴が板に着いた' },
  takeoffOff: { title: '踏切足のつま先が板に着いている最後のコマ', text: '次のコマで、つま先が板から離れて空中に出ます。', zoom: 'つま先だけ板に着いている' },
} as const;

/** The sample and the words for the moment being set; `tapping` while the athlete is not tapped yet. */
export function StandGuide({ m, tapping }: { m: { kind: string }; tapping: boolean }) {
  const which: Sample | 'tap' = tapping ? 'tap' : m.kind === 'touchdown' ? 'takeoffDown' : 'takeoffOff';
  const t = STAND_TEXT[which], down = which === 'takeoffDown';
  return <div className="pick-guide">
    <div className="pick-guide-pictures">
      <StickFigure j={SAMPLES[which === 'tap' ? 'takeoffDown' : which]} label={`見本：${t.title}`} accent={which !== 'tap'} />
      {which !== 'tap' && <PickFoot kind={down ? 'touchdown' : 'toeOff'} label={t.zoom} />}
    </div>
    <div className="pick-guide-words"><small>{which === 'tap' ? '最初に' : '見本'}</small><strong>{t.title}</strong><p>{t.text}</p></div>
  </div>;
}
