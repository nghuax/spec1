# Performance and release check — 2026-09-17

Measured in the local Chromium in-app browser, on this Windows computer (120 Hz display), with full motion enabled. Six-second requestAnimationFrame / p5 frameCount samples after loading. Phone dimensions emulate layout, not phone hardware. These measurements are not a universal frame-rate guarantee.

| Scene | 1440×900 canvas FPS | 390×844 canvas FPS |
| --- | ---: | ---: |
| HARM | 60.0 | 59.9 |
| EXHAUST | 56.0 (particle activity) | 59.8 |
| ADAPT | 59.8 (guided recovery) | 59.6 |
| LIVEN | 30.0 | 30.1 |

LIVEN retains its authored 30 FPS cap. Offscreen canvases recorded zero frame advancement during steady fullscreen samples. The landing shell measured 120 FPS; a chapter navigation sample measured 116.5 FPS with an 8.4 ms 95th-percentile animation frame interval. EXHAUST under particle load had a 25 ms shell p95 interval. No >50 ms long tasks occurred in the sampled windows. No HTTP resource errors or horizontal overflow were detected in the final desktop check.

Motion toggles and saved session overrides were removed. Normal browsing keeps motion enabled; operating-system reduced-motion accessibility support remains intact. No artwork speed or completion logic was changed for the performance pass.

82 automated tests pass, including source-owned completion, UI sounds, sequence/reset handling, relative asset paths and case-sensitive GitHub Pages paths. Two obsolete toggle tests were removed/replaced as part of the new preference behavior.
