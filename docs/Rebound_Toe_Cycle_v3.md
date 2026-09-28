# Continuous bilateral toe model v3

Model: `rj-toe-constrained-cycle-v3-research`  
Presentation: `rj-toe-cycle-presentation-v5`

This is an unvalidated whole-cycle RSI prediction, not a measurement of ground contact. No height, age, reference RSI, or manual event input is required. Normal RJ, CMJ, and sprint calculations are unchanged.

## Numerical change

The v2 fit imposed a common duration and phase on the two continuous toe trajectories. V3 fits duration and phase independently for each foot. It uses the intersection of the two inferred airborne lobes: bilateral flight requires both feet to be airborne. There is no frame-by-frame observed takeoff/landing detector.

For cycle duration `T` and common inferred airborne fraction `r`, the existing calculation remains `g * T * r² / (8 * (1 - r))`. The changed input is `r`, not a scaling coefficient. Pelvis-derived apex cycles and existing observation-quality conditions are retained. A large linear drift with negligible oscillation is rejected instead of being treated as toe excursion.

Periodic interval geometry rejects disconnected or absent overlap. The full independent duration/phase candidate grid contributes to sensitivity ranges. These ranges describe model settings, not confidence intervals or guaranteed error bounds. They remain in collapsed details; the headline is the arithmetic mean of calculable cycles.

Old synchronized fits remain available in diagnostic profiles and `previousSynchronizedValue`; they do not determine the headline. Exported reports identify `INTERSECTION_OF_INDEPENDENT_TOE_LOBES`. Imports accept v1/v2/v3 and recompute from stored observations, ignoring saved numerical results.

## Checks and limitations

- Unit tests cover identical and asynchronous feet, unequal durations, left/right symmetry, wraparound, invalid intervals, disconnected overlap, and comparison with exhaustive sensitivity searches.
- Saved-data regression covers 19 recordings, 193 candidate cycles, and 187 calculable cycles. Cycle membership is unchanged; repeated calculations from identical observations are deterministic.
- Retrospective ranking against available references improved in this development set. Those references summarize the last three jumps, while this model averages apex-to-apex cycles. This is not matched measurement-accuracy validation or held-out validation.
- Foot rotation, footwear, occlusion, and pose-estimation error can imitate timing differences. The inferred lobe is not proven to equal physical flight. A lower result is not itself evidence of better accuracy. Age-based ordering is not imposed.
- Browser layout tests do not substitute for real-device validation. Different pose inference backends can produce different observations; saved-JSON recalculation isolates the numerical model from that difference.

Release checks: 319 public-app tests and typecheck/build passed. Desktop Chrome and WebKit passed old-JSON recalculation, ignoring tampered saved results, v3 export/reimport, clearing invalid input, and 320/390px layouts. Chrome also passed real-video inference, pose replay, deterministic cached recalculation, cancellation, and 320/390/1280px layouts. Source observations were not uploaded. These are functionality checks, not RSI accuracy validation.

The standard flight-time relation assumes equal whole-body center-of-mass height at takeoff and landing; see [review of jump-height methods](https://pmc.ncbi.nlm.nih.gov/articles/PMC6680983/). This relation does not validate our inferred continuous toe lobes.
