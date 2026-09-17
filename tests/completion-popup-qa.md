# Completion popup QA — 2026-09-17

- Reused the existing completion overlay and source-owned completion triggers.
- Exact HARM, EXHAUST and ADAPT messages verified after real completion via the existing accessible artwork controls.
- LIVEN completed through its three real energy placements. Verified all three exact messages, Enter/click activation, stable panel bounds between messages, and continuation to #heal only after the final message.
- HARM → EXHAUST → ADAPT → LIVEN continuation verified without automatically opening the next artwork.
- Checked at 1920×1080, 1440×900, 1366×768, 768×1024, 390×844 and 844×390. Short screens retain scrollable overflow and an accessible CONTINUE button.
- Reopening a completed installation focuses its current completion panel and preserves state.
- Automated suite: 84 tests passed, including double-activation protection, reset during animation, and single-stage continuation.
- No popup reference screenshot was attached to the request; visual implementation follows the detailed written specification.
- Changes are local; deployment was not performed in this task.
