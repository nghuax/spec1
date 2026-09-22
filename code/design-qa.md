Motion polish — 14 September 2026: Continuous velocity-aware section travel replaces the earlier two-stage wheel/snap movement. Shared button/navigation animation tokens and completion departure are implemented. 54 targeted tests pass. See repository-root design-audit/motion-polish/qa-report.md for the reference study, browser evidence and frame-cadence/device limits. Earlier audits below are preserved.

---

Magnetic scrolling update — 14 September 2026: The site now uses a shared section controller with artwork holds, controlled settling, momentum protection and consistent navigation/Next alignment. 50 targeted tests pass. Current scroll QA and device-testing limitations are documented in design-audit/magnetic-scroll/qa-report.md at repository root. The fullscreen visual audit below is preserved; its proximity-scrolling description is superseded.

---

# HEAL fullscreen revision — design and interaction QA

Date: 13 September 2026

final result: passed

## Source and comparison evidence

The revision brief is `C:/Users/ASUS/.codex/attachments/02d715a9-71fd-47b5-a8b2-f9877aefcead/pasted-text.txt`. It authorizes fullscreen chapters, smaller landing chapter controls, transparent navigation, floating geometry and new completion messages while preserving the artworks.

Visual truth: Figma MAIN SITE `0Lq7wYIzEhyDNLO5r8iFDj`, node 1:3; Navigation Bar 19:509; SCROLLING BAR 30:617; COMPONENT 19:560 and TEST ZONE 19:561. Saved source images: `design-audit/final-heal/figma-landing.png` (1920 × 1080) and `figma-full.png` (1920 × 3449). Original UPDATES sources and hashes remain in `design-audit/final-heal/sources/` and `source-manifest.json`.

Implementation: `http://127.0.0.1:8137/code/index-2026-09-22-v01.html`. Screenshots are in `design-audit/fullscreen/`. Actual browser screenshots were captured at their named CSS viewport sizes with `visualViewport.scale === 1`, normalized to one image pixel per CSS pixel. No screenshot is shipped as a website visual.

- Full landing comparison: `landing-comparison.png`, 3840 × 1124, containing Figma and the revised 1920 × 1080 landing together at identical scale.
- Full exhibition comparison: `liven-comparison.png`, 3840 × 1124, containing the previous 1920 × 1080 exhibition and revised LIVEN at the same scale. The changed scene state (initial versus completed) is explicit; this compares the surrounding presentation and artwork size, not random particle positions.
- Focused identity comparison: `logo-comparison.png`, using the exact unchanged HEAL logo bounds from both 1920px captures.
- Individual source-size evidence: `harm-final.png`, `landing-1920.png`, `landing-390.png`, and each `{stage}-{width}x{height}.png`.
- Overview evidence: `contact-{width}x{height}.jpg`, one sheet per viewport showing all four actual completed artworks. These 1280 × 800 sheets use contained thumbnails only for review; individual PNGs retain full viewport resolution.
- Measurements: `viewport-results.json`; fresh browser load/network check: `final-smoke.json`.

## Findings and iteration history

No unresolved P0, P1 or P2 findings remain in the tested layouts.

1. **P1 — Wrapper reduced the artwork presentation.** The previous exhibition included captions, instructions and a toolbar surrounding each canvas. The revision removes that material, uses one `100dvh` chapter, and calculates the full 16:9 composition from available viewport dimensions. The transparent header and source-aware background replace the opaque orange band. Evidence: `liven-comparison.png`, `harm-final.png`, desktop contact sheets.
2. **P1 — EXHAUST p5 version compatibility.** The first background integration attempted a p5 1.x internal colour property absent in EXHAUST's p5 2.x. Replaced it with public `red/green/blue` accessors. EXHAUST now loads, completes at its source counter and resets. A fresh final load of all four chapters produced no script errors or failed network requests (`final-smoke.json`). Earlier error entries from the superseded code were excluded by the fresh-load timestamp.
3. **P2 — Small-screen source HUD minimum sizes.** Initial phone screenshots showed ADAPT's fixed minimum control/text sizes competing with its fitted composition. Scoped integration CSS now scales those controls and HARM's HUD with their artwork while retaining full-size accessible controls on demand. Desktop artwork styling stays intact.
4. **P2 — Portrait completion obscured the scene.** `contact-390x844-before.jpg` shows the first overlay centred over the small landscape composition. The final layout places it below the artwork when available space can contain it. At 390 × 844 all four artworks end at y=539.69; ending messages begin at y=553.69 and finish by y=696.48, above the bottom rail. Evidence: final `contact-390x844.jpg` and `contact-768x1024.jpg`.
5. **P2 — Landscape ending density and navigation clearance.** `contact-844x390-before.jpg` showed large endings and the rail starting beside ABOUT. The final landscape ending is smaller and the rail begins below navigation. Evidence: final `contact-844x390.jpg`.

## Fidelity surfaces

- **Fonts and typography:** self-hosted Stack Sans Notch remains the identity and interface family. Weight hierarchy, original artwork text and source subtitles are preserved. The landing logo remains exactly 1513 × 544.5 CSS pixels at x=175, y≈48 in a 1920 × 1080 viewport. Chapter labels are intentionally 78% of their previous desktop size, repositioned along the same diagonal, as requested. Compact phone controls are available independently of the proportionally scaled source text.
- **Spacing and layout:** every artwork chapter equals viewport height. All four source compositions remain 1920:1080 and are proportionally fitted; no crop, stretch or browser zoom reduction. Small top/right safe areas protect navigation and the rail; portrait uses spare space beneath the composition for endings. Native artwork controls remain inside the visible artboard.
- **Colours and tokens:** HEAL orange #d26c00, blue #1d39b7, black and white are unchanged. Navigation is computed transparent. The unused background follows each original source palette; ADAPT changes navigation contrast with its background. New completion plates and floating blocks use the existing HEAL geometry and palette.
- **Assets:** original editable p5, HTML, CSS and SVG remain. The HEAL logo is the same source vector. No PNG/JPG/WebP substitutes for the logo, navigation, chapter labels, completion UI or backgrounds. This follows the user's explicit code-native asset requirement.
- **Copy:** website-level chapter explanations, duplicate visible headings and instruction bars are removed. Source artwork text remains. Four concise requested completion messages live in `js/artwork-endings-2026-09-22-v01.js`, with optional detail lines supported by the layout. About and the conclusion remain.

## Viewport checks

All four chapters and actual completion overlays were checked at each size below at 100% zoom. `viewport-results.json` records canvas presence, chapter height, bounding boxes, aspect ratio, navigation clearance, overlay bounds, active state and page overflow. Maximum ratio deviation from 16:9 is subpixel rounding (<0.00002). All page overflow checks are false; all artboards fit below navigation and within viewport height.

| Viewport | Four artboards fit | Endings fit | Navigation and rail clear |
|---|---|---|---|
| 1920 × 1080 | Pass | Pass | Pass |
| 1440 × 900 | Pass | Pass | Pass |
| 1366 × 768 | Pass | Pass | Pass |
| 390 × 844 | Pass | Pass, below artwork | Pass |
| 844 × 390 | Pass | Pass, compact | Pass |
| 768 × 1024 | Pass | Pass, below artwork | Pass |
| 1024 × 768 | Pass | Pass | Pass |

## Interaction checks

- HARM: completion stays absent at 18/19 burns and appears at 20, matching `MACHINE_SOUND_COMPLETE_BURNS` and the source full-machine indicator/cue. Restart clears burn count, pollution and ending, resumes rendering, and leaves the other three endings unchanged.
- EXHAUST: completion absent at 20 actions, present at 21. Native fossil-energy button and accessible equivalent both call the original action. Restart clears the original destruction counter and ending.
- ADAPT: original guided reset/replay reaches `globalRecovery === 1` with its source completion flag; then the ending appears. Restart returns recovery to zero, clears completion and starts the original guided damage phase.
- LIVEN: all three renewable pieces were placed by real pointer drag in the proportionally fitted canvas. `earthIsRestored()` became true and revealed the ending. Accessible slot placement also worked. Restart cleared all renewable placements and restoration without resetting ADAPT.
- All four Next controls use the existing anchors: HARM → EXHAUST → ADAPT → LIVEN → HEAL. Natural wheel scrolling over the artwork moved to the next chapter without using Next.
- Leaving HARM preserved burn count and stopped rendering; its frame counter remained 2010 across subsequent observations. Other ready offscreen artworks were inactive. Native audio mute preferences and source resets remain covered by tests.
- Completion is keyboard focusable and announced. Keyboard Restart worked on phone layout, restored focus to the chapter heading and cleared only its source. Escape closes the optional controls and returns focus to its button. Native controls remain accessible within each iframe.
- Optional browser fullscreen entered/exited successfully with transparent navigation and a fitting artboard.
- Reduced motion produces `animation-name: none` for floating graphics and stops initial rendering; explicit interaction resumes the current chapter. Normal mode produces `heal-drift`. Background geometry is pointer-transparent.

## Validation and remaining limits

34 targeted Node tests passed: bridge lifecycle/authentication, source completion thresholds, isolated resets, mismatch rejection, wheel forwarding, deliberate resume, and existing ADAPT runtime/composition/environment tests. Static reference audit checked 73 linked files with zero missing or remote runtime references. Source hash differences are unchanged from the previous delivery: entry-point integration, HARM's absent-audio guard, and EXHAUST's local font URL. No original gameplay file was changed in this revision.

The fresh final browser run loaded all four artworks without script errors, HTTP errors or failed network requests. No deployment was performed; the package remains static-host/GitHub Pages compatible.

Physical touch hardware, Safari/iOS browser chrome and screen-reader speech were not available for direct testing. Phone/tablet viewport layouts, keyboard equivalents, ARIA/focus behaviour and the existing ADAPT touch-coordinate test were checked. Original fine-detail artwork text scales down in portrait to preserve the complete composition; large interaction equivalents remain in the control menu.

The six HARM audio recordings are still absent from the supplied UPDATES package; sound remains explicitly unavailable, with no replacement audio or failed requests. This existing source limitation is documented in `code/artworks/designed-sounds/README.md`.

Implementation checklist: fullscreen fitting, transparent navigation, source completion, isolated restart, Next sequence, ordinary scrolling, keyboard controls, reduced motion, responsive visual comparisons, fresh console/network check and static package audit are complete.


## Living exhibition revision — 14 September 2026


1. Landing — improved. The original HEAL backing geometry now drifts at three scales, with 12 shapes on desktop and six on mobile. The logo backing, white lettering, chapter controls and supporting copy enter in sequence. The identity, colours and layout are retained.
2. Artwork entry and handoff — healthy in the checked browser. The single magnetic controller retains continuous travel and exact viewport alignment. Navigation and rail follow actual progress. Ambient geometry recedes behind the iframe and remains pointer-transparent. All seven sections aligned at top 0 in forward and reverse wheel checks; five 3px deltas held HARM at top 0.
3. Completion and actions — improved. A short pause precedes the message, followed by actions. Actual LIVEN completion at three placed pieces revealed the ending. Pointer Restart faded the overlay and cleared source recovery in about 174ms; actual Next aligned HEAL, then About aligned. Explicit commands now remain accepted if focus-induced settling has temporarily suspended the source. Source artwork files are unchanged.
4. HEAL / About — improved. Content reveals in small groups; ambient geometry becomes more visible around the editorial content. Text, credits and SDG information are retained. Long About content remains freely readable.

Why the earlier page felt static: the browser requests reduced motion by default; five low-opacity decorative pieces also sat behind opaque chapter backgrounds. Landing and About lacked hierarchical entrance sequences. The existing section controller already supplied one continuous trajectory, so it was retained rather than layered with native snapping.

Motion accessibility: the system preference remains the default. A visible MOTION ON/OFF control allows an explicit session choice. Reduced mode stops ambient animation and removes prolonged transitions; all reveal content is visible. Motion On resumes only artworks paused by that preference, preserving deliberate pauses.

Verification: 60 Node tests passed (controller, bridge, motion preferences, delayed-command lifecycle and original ADAPT runtime/composition/environment). Browser checks covered real pointer placement, completion, Restart, Next, all forward/reverse stops, navigation, small wheel deltas, motion toggle, and 390x844 phone layout. Phone has six shapes, no horizontal overflow, visual viewport scale 1 and the full 16:9 artwork. An indicative one-second active-HARM sample yielded 242 animation callbacks, median 4.2ms and p95 4.3ms; this is a local observation, not a device performance guarantee.

Evidence limits: screenshots show settled visual states; runtime checks supplied motion/alignment evidence. The before-completion screenshot uses a temporary shell completion fixture over the initial LIVEN scene; the after-completion image shows actual 100% recovery. Browser dimensions changed across the interrupted session. Browser locator clicks sometimes auto-scrolled controls and caused settling; direct pointer actions were verified instead. Physical mobile touch, Safari/iOS and physical Windows/Mac trackpads were not available. Existing automated touch and momentum checks remain passing. The six HARM recordings are still absent from the supplied artwork package.

Files: numbered before/after screenshots, phone screenshot, browser-qa.json, audit.html. No deployment was performed.

## Stage introductions revision — 15 September 2026

All four chapters now open with a large stage title, scroll through a connected zoom-out and concise brief, then settle into the original fullscreen artwork. The brief clears before interaction. ADAPT explicitly connects the renewable transition to SDG 7. Navigation and Next land at the corresponding intro; title, brief and artwork retain one chapter identity on the navigation, progress rail and URL.

The existing section controller owns all settling. Artwork activation now requires exact alignment, preventing prefetched or partially visible scenes from running. The title/brief composition is 1.9 viewports tall on desktop and 1.75 on phones, with a static compact title in reduced motion. No artwork file or source gameplay was changed from the living-exhibition release.

Verification: 68 targeted tests pass. Browser checks covered all forward/reverse chapter phases, navigation, Page Down, actual HARM completion and Next to EXHAUST's intro, desktop, phone, small-phone and landscape layouts. The 390×844 final artwork view had zero horizontal overflow, zoom 1, brief opacity 0 and less than 0.15px top alignment error. Reduced-motion landscape spacing was corrected after visual inspection. The final browser console had no error entries. Physical touch/trackpad and Safari/iOS remain untested; existing simulated touch and momentum checks pass.

Evidence: repository-root `design-audit/stage-intros/qa-report.md`, eight screenshots and `browser-qa.json`. New release: `HEAL-Stage-Intros-2026-09-15.zip`. The six HARM recordings remain absent from the supplied package. No deployment was performed.


## Catalogue + optional installations revision — 15 September 2026

This revision supersedes the prior three-stop stage sequence. Each chapter now presents its stage title, brief and live artwork preview together with one magnetic anchor. Scrolling never automatically launches fullscreen. Click to Fullscreen expands the same live artwork; Close/Esc contracts it back without reloading or resetting progress. Native dialog focus containment and background scroll suspension keep the installation isolated. Restart stays fullscreen; Next closes and moves to the next chapter preview.

Only the current visible preview animates at 24fps, muted and with primary input disabled; offscreen artworks pause. Fullscreen restores primary interaction and the original frame rate. Desktop, phone, short-screen, landscape, keyboard, reduced-motion, real LIVEN completion/reset and HARM completion/Next were checked. 71 targeted tests pass. Original artwork sources are unchanged; only the shared integration bridge handles the new lifecycle. Evidence and limits: `design-audit/catalogue-installations/qa-report.md` at repository root. No deployment performed.
