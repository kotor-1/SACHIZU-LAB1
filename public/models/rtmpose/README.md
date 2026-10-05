# RTMPose model asset (crouch start angles)

Source: [OpenMMLab MMPose, RTMPose](https://github.com/open-mmlab/mmpose/tree/main/projects/rtmpose) ONNX SDK release, unmodified:
`https://download.openmmlab.com/mmpose/v1/projects/rtmposev1/onnx_sdk/rtmpose-m_simcc-body7_pt-body7-halpe26_700e-256x192-4d3e73dd_20230605.zip` (`end2end.onnx`).

| Asset | Runtime | SHA-256 |
| --- | --- | --- |
| rtmpose-m-halpe26-256x192.onnx | Crouch start: angles and the skeleton shown (26 keypoints, input 192x256) | 26f3a19e61304a600dfb82d1001d41d24343b89fc70a33ffc84657e0b0bf2ecf |

The application checks the SHA-256 before use. The crouch start finds and follows the athlete, and times touchdowns and toe-offs, with MediaPipe; RTMPose re-estimates the pose inside that box for the angles.

MMPose and RTMPose are released under Apache-2.0. These weights were trained on the Body7 collection, which includes datasets licensed for non-commercial research only (for example AI Challenger); whether the weights themselves may be used commercially is not settled upstream. This application is free and non-commercial.
