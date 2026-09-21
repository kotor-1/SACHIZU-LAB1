# Pose model assets

Source: [Google MediaPipe Pose Landmarker models](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker#models). These are official float16 task bundles, not custom-trained CMJ models.

| Asset | Runtime | SHA-256 |
| --- | --- | --- |
| pose_landmarker_lite.task | Live camera | 59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a |
| pose_landmarker_full.task | Recorded video | 5134a3aad27a58b93da0088d431f366da362b44e3ccfbe3462b3827a839011b1 |

Pinned Full download: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task`.

Each bundle is hash-checked before model initialization. The application computes its own experimental centre-of-mass proxy and velocity-based estimate; model availability does not imply jump-height accuracy. See `docs/CMJ_COM_Method.md` for measurement assumptions and verification limits.
