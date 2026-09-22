# HEAL — Damage to Recovery

Catalogue + optional installations · final refinement 16 September 2026

Landing → HARM → EXHAUST → ADAPT → LIVEN → HEAL → ABOUT.

Each chapter contains a stage title, short brief and live artwork preview. Click the preview to expand the original artwork into an optional fullscreen installation. Close or Esc returns to the same preview without resetting progress. Navigation and Next land on the complete chapter composition.

The final audit removes duplicate preview badges, restores EXHAUST's instruction typography, corrects heading order and nested Escape handling, and hardens cached-navigation and storage-denial recovery. Exact chapter/CTA copy and original artwork logic are preserved. Run `node --test tests/*.test.cjs` from the repository root; the Pages workflow runs this suite before publishing. Current results and limitations are in repository-root `tests/production-qa.md`; older reports below describe earlier revisions.

## Run and host

Serve this directory with any static HTTP server, for example `python -m http.server 8137` from `code/`. Open `http://localhost:8137/`. JavaScript modules require HTTP; opening the HTML through `file://` is unsupported.

Publish the contents of `code/` to GitHub Pages or another static host. The repository's existing Pages workflow already uses `code/`. All site and artwork paths are relative, including when hosted under a repository subpath. There is no build step, backend, framework, database or external runtime request. GitHub Pages publishes this directory when main is updated.

## Editable implementation

- `index-2026-09-22-v01.html`: semantic opening, navigation, six-node progress rail, conclusion and About.
- `css/journey-2026-09-22-v01.css`: Figma colours, geometry, spacing, typography and responsive rules.
- `css/fullscreen-2026-09-22-v01.css`: viewport chapters, transparent navigation, proportional fitting, floating geometry and endings.
- `js/artwork-endings-2026-09-22-v01.js`: editable completion messages; add one or two lines through each `detail` field.
- `js/heal-mark-2026-09-22-v01.js`: inline, editable SVG paths from Figma node 19:479.
- `js/journey-2026-09-22-v01.js`: chapter rendering, anchors, active navigation, scroll progress, lazy loading and controls.
- `js/section-scroll-2026-09-22-v01.js`: shared magnetic section controller for manual scrolling, anchors and Next.
- `js/stage-intros-2026-09-22-v01.js` and `css/stage-intros-2026-09-22-v01.css`: brief copy, pinned title composition, scroll-driven zoom/reveal and one resting composition per chapter.
- `js/motion-2026-09-22-v01.js`: continuous section interpolation, velocity tangent and distance-based timing.
- `css/motion-2026-09-22-v01.css`: shared UI timing/easing, layered button feedback, navigation presence and completion departure.
- `js/exhibition-content-2026-09-22-v01.js`: shared artwork titles and author credits.
- `artworks/exhibition-bridge-2026-09-22-v01.js` and `.css`: same-origin integration adapters. They run only with `?exhibition=heal`.
- `artworks/{harm,exhaust,adapt,liven}/`: isolated original p5 worlds, assets and interfaces; each `index-2026-09-22-v01.html` also runs independently.
- `works/*.html` and `about-2026-09-22-v01.html`: compatibility redirects into the continuous exhibition.

Older shell modules and source directories remain for reference but are not loaded by the final entry point.

## Sources and visual specification

Figma `0Lq7wYIzEhyDNLO5r8iFDj`: MAIN SITE 1:3, COMPONENT 19:560, Navigation Bar 19:509, SCROLLING BAR 30:617, TEST ZONE 19:561 and ARTWORK SCREENSHOT 19:562. The opening uses the original custom vector letterforms, angled CSS labels, #d26c00 orange, #1d39b7 blue, and self-hosted Stack Sans Notch. No Figma screenshot is used by the site.

The authoritative artwork sources are under `HEAL-Latest-2026-09-10/UPDATES`: STAGE 1 - HARM.zip, STAGE 2 - EXHAUST.zip, the newer unpacked STAGE 3 - ADAPT folder, and STAGE 4 - LIVEN.zip. ADAPT's sketch and environment pack replace the older repository variant. HARM, EXHAUST and LIVEN sketches already matched these updates. Original UPDATES folders and archives remain intact.

Source hashes, extracted references, Figma measurements, the pre-integration backup and QA evidence are in `design-audit/final-heal/` at repository root. `source-manifest.json` records the source versions before integration edits.

## Interaction and accessibility

The catalogue uses one magnetic anchor per chapter. A chapter shows its title, brief and real p5 preview together. Primary interaction is reserved for fullscreen, entered with the transparent preview button (Enter/Space supported). A native modal dialog expands the same iframe without reparenting/reloading, isolates focus and suspends background scrolling. Close/Esc restores the preview trigger; Next closes before navigating. The current visible preview runs muted at 24fps; other previews pause. Fullscreen restores normal source frame rates and interaction.

At a chapter anchor, vertical wheel input accumulates to a viewport-dependent 54–108px release threshold; editorial anchors use 28px. Accepted intent starts a continuous trajectory immediately, without a raw wheel jump or delayed second acceleration. Native touch/keyboard movement can hand off to proximity settling (32% artwork / 22% editorial range) after movement ends. The curve carries compatible current velocity into a brief acceleration and long gentle deceleration. Distance and velocity determine timing: roughly 280–440ms for small corrections, 650–750ms for adjacent travel, and up to 940ms for long navigation. Strong input retimes or reverses the current trajectory without queuing destinations. Bounds are cached and one requestAnimationFrame loop owns programmed travel. Previews keep their last composition while rendering pauses during page travel, then resume at rest. The URL changes at settlement; navigation and the progress rail follow actual visible overlap.

Catalogue touch scrolling is not intercepted: settling waits for touch release and the end of momentum. In fullscreen, canvas gestures remain owned by the source sketches and cannot move the background catalogue. Longer editorial sections retain a freely readable internal scroll range. Browser keyboard scrolling remains available, and page-scroll keys inside non-scrolling artwork iframes are relayed to the controller. Forms, sliders, buttons, dialogs, horizontal wheel input and pinch zoom retain their own behaviour. Reduced motion keeps functional settling with immediate alignment.

All four UPDATES artworks use a 1920 × 1080 coordinate system. The site measures the available viewport after a small navigation/rail safe area and fits a 16:9 iframe at `min(availableWidth/1920, availableHeight/1080)`. Each source retains its native proportional canvas scaling and pointer mapping. Compact HARM/ADAPT DOM controls receive scoped scaling corrections. The full composition stays visible at normal browser zoom; unused portrait space remains available for scrolling. Background colour follows the source artwork behind transparent navigation.

Sound starts off. A small keyboard icon opens pause, fullscreen, reset, information and equivalent keyboard/touch controls on demand. Native artwork interactions and artwork text remain intact. Escape closes this menu; Escape from an artwork focuses its menu button. The surrounding website captions and instruction bars are removed.

The ending adapter uses HARM's `MACHINE_SOUND_COMPLETE_BURNS` (20, matching the source full machine indicator and completion cue), EXHAUST's original capped 21-action destruction counter, ADAPT's completed state plus actual `globalRecovery === 1`, and LIVEN's original `earthIsRestored()`. No ending uses a website timer or scroll position. Completion reveals a focused, announced geometric message with Restart/Next while keeping natural scrolling available. On tall portrait screens the message moves below the complete artwork when space permits.

Restart invokes `resetScene`, `regenerateArtwork`, ADAPT's reset command, or `regenerateScene` respectively. In ADAPT, Reset preserves the author's guided recovery behaviour; supplying SUN or WIND takes manual control. Next uses the same in-page navigation, ending at HEAL after LIVEN. The adapter does not change source gameplay or original completion rules.

Reduced motion removes floating geometry and interface transitions and opens artworks as still compositions. The PLAY ARTWORK control or a deliberate interaction resumes the current artwork. Mobile keeps the authored landscape composition, provides large controls in the optional menu, and uses the same progress diamonds horizontally. Browser fullscreen is optional; browser zooming is never required for fitting.

## Known source limitation

The six HARM recordings referenced by the newest package were not supplied in any project folder. The visual artwork works, and sound is explicitly unavailable without failed requests or replacement audio. See `artworks/designed-sounds/README.md` for the exact filenames. To restore the original sound, add all six recordings there, set `RECORDINGS_AVAILABLE` in `artworks/harm/sound-2026-09-22-v01.js` to true, and update HARM's availability/mute guard in `artworks/exhibition-bridge-2026-09-22-v01.js`.

## Credits and validation

RMIT COMM2754 — Digital Media Specialisation 1. HARM: Ngo Dac Phu; EXHAUST: Luong Duc Hung; ADAPT: Nguyen Gia Toan Phu Nghia; LIVEN: Nguyen Tran Phuc Duong. Member-to-chapter credits follow the supplied group documentation. About links SDG 7 to the United Nations source.

See `THIRD-PARTY-LICENSES.md` for dependency/font licences and repository-root `design-qa.md` for the final visual and functional checks. Fullscreen revision screenshots, viewport measurements, comparisons and the previous QA report are in repository-root `design-audit/fullscreen/`.

Magnetic-scroll checks and limitations are recorded in `design-audit/magnetic-scroll/qa-report.md` at repository root. Native touch injection is unavailable in the preview browser: touch lifecycle/momentum were simulated, with no physical phone, Windows Precision Touchpad or Mac trackpad claim. All four Next links were exercised with temporary completion fixtures; source completion thresholds remain covered by the bridge tests.

Motion-polish evidence, reference study and performance limits: `design-audit/motion-polish/qa-report.md` at repository root. 54 targeted tests pass. The source reference uses fixed overlapping pages; HEAL preserves continuous fullscreen scrolling and its own visual design.


## Living motion system

`js/living-motion-2026-09-22-v01.js` and `css/living-motion-2026-09-22-v01.css` provide 12 original HEAL-derived geometric fragments (six on phones), independent drift, bounded scroll response, a staged logo entrance, grouped HEAL/About reveals, and sequenced completion actions. One section controller still owns all page settling; no extra animation library or native mandatory snap was added.

MOTION ON/OFF follows the system preference until the visitor explicitly chooses a mode for the session. Reduced motion stops continuous motion and shows all reveal content. Restart commands remain reliable when the source is temporarily suspended during settling. See the living-exhibition section in `design-qa.md` for validation and limits.

## Catalogue and installation implementation

`js/stage-intros-2026-09-22-v01.js` now provides concise brief copy, one chapter stop, and the approach reveal. `css/stage-intros-2026-09-22-v01.css` lays out title, brief and preview together; `js/installation-2026-09-22-v01.js` manages native-dialog expansion/return, scroll isolation and focus. The preview iframe stays in its original DOM position throughout.

The chapter fills at least one dynamic viewport. Smaller screens may scroll internally to preserve readable type and the complete preview. Fullscreen uses the full browser viewport with proportional artwork fitting and clear Close/controls; optional browser-level fullscreen is not required. Reduced motion uses a static chapter composition and a short installation fade. Evidence: repository-root `design-audit/catalogue-installations/`. 71 targeted checks pass.
