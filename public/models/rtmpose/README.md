# RTMPose model asset (crouch start angles)

Source: [OpenMMLab MMPose, RTMPose](https://github.com/open-mmlab/mmpose/tree/main/projects/rtmpose) ONNX SDK release, unmodified:
`https://download.openmmlab.com/mmpose/v1/projects/rtmposev1/onnx_sdk/rtmpose-m_simcc-body7_pt-body7-halpe26_700e-256x192-4d3e73dd_20230605.zip` (`end2end.onnx`).

| Asset | Runtime | SHA-256 |
| --- | --- | --- |
| rtmpose-m-halpe26-256x192.onnx | Crouch start: angles and the skeleton shown (26 keypoints, input 192x256) | 26f3a19e61304a600dfb82d1001d41d24343b89fc70a33ffc84657e0b0bf2ecf |
| rtmpose-l-halpe26-384x288.onnx | Posture check: the graph of RTMPose-l (26 keypoints, input 288x384), its float weights moved out | 7b7fb0efc8f986b9549b4c96b8223f3d6f93b113a0b519294cfb210e82da97ea |
| rtmpose-l-halpe26-384x288.f16.bin | Posture check: those weights as float16, widened back to float32 in the browser | d0ddc25f794e951bd85f2e03eeeb84cbbf95646ec69e66a49ff228d0510f32de |

The posture check's RTMPose-l comes from the same release:
`https://download.openmmlab.com/mmpose/v1/projects/rtmposev1/onnx_sdk/rtmpose-l_simcc-body7_pt-body7-halpe26_700e-384x288-734182ce_20230605.zip` (`end2end.onnx`, SHA-256 8c55b463b44072d68c890e495f670163ced979c4049ed2c599a7f0077670879c, 112.9 MB).
It is stored converted, not unmodified: each float32 weight of 16 values or more was rounded to float16 and moved to external data (`location` rtmpose-l-halpe26-384x288.data, offsets as float32, 64-byte aligned); the page widens the float16 file back to float32 and passes it to ONNX Runtime as that external data. This halves the download (56 MB) and keeps every file under GitHub's 100 MB limit; on the study photos the rounding moved no posture measure by more than 0.02°. The conversion script is `scripts/rtmpose-half.py` in the development repository (onnx 1.23).

The application checks the SHA-256 before use. The crouch start finds and follows the athlete, and times touchdowns and toe-offs, with MediaPipe; RTMPose re-estimates the pose inside that box for the angles.

MMPose and RTMPose are released under Apache-2.0. These weights were trained on the Body7 collection, which includes datasets licensed for non-commercial research only (for example AI Challenger); whether the weights themselves may be used commercially is not settled upstream. This application is free and non-commercial.
