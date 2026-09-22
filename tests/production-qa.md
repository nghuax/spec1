# HEAL final production audit — 16 September 2026

Scope: refine the existing exhibition, preserving its approved visual direction, exact copy, four UPDATES artworks, magnetic catalogue, and optional fullscreen installations.

## Corrections made

- Removed duplicate source title badges from embedded previews. The website corner pins remain; original badges return in fullscreen and standalone artworks.
- Scoped HARM's proportional subtitle correction to its own canvas holder. It previously shrank EXHAUST's caption twice, making the instruction almost illegible.
- Put chapter titles before their supporting headings in document order, preserving the existing artwork-left/brief-right CSS layout.
- Fixed Escape ownership for nested artwork information/sound panels. Closing a source panel no longer also exits the installation.
- Restored artwork lifecycle and completion publishing after a cached browser navigation, without resetting progress or creating duplicate polling intervals.
- Kept the exhibition functional when access to the sessionStorage property itself is denied.
- Matched browser theme chrome to the current dark background.
- Added a Pages deployment gate for the dependency-free regression suite, including exact copy and case-sensitive relative asset resolution.

## References checked

Live Figma: MAIN SITE `1:3`, Navigation Bar `19:509`, SCROLLING BAR `30:617` in `0Lq7wYIzEhyDNLO5r8iFDj`. The original orange background is intentionally superseded by the user's later LIVEN-inspired dark background request. Existing source vector logo, Stack Sans Notch, angled plates, white nav, and diamond rail were retained.

Motion reference: `https://s4129129.github.io/SPEC1-A3/Nana/index-2026-09-22-v01.html`. Inspected its fixed-page handoff, preview invitation, transition guard, and 900 ms timing. HEAL retains its continuous magnetic catalogue rather than copying the reference's rigid page structure.

The supplied out-of-frame reference remains implemented as straight outlines with angular shards outside the boundaries and a rotated two-plate title pin. No screenshots replace coded UI or live artworks.

## Journey and visual evidence

Screenshots from this audit are in `output/final-audit-2026-09-16/` at the repository root. `audit.html` presents them with notes.

| Step | Screen | Result |
| --- | --- | --- |
| 1 | Landing | Large HEAL identity, dark purple forms, animated arrow and exact scroll hint retained. |
| 2 | HARM | One corner pin; hover label, pointer cursor and 18% dim verified; real 20-burn completion reached. |
| 3 | EXHAUST | One corner pin and readable restored source caption; native p5 button advances progress; real 21-action completion reached. |
| 4 | ADAPT | White navigation retained; source guided recovery reached actual 100% completion. |
| 5 | LIVEN | Solar, water and wind placed through accessible controls using original drop logic; actual recovery reached 100%. |
| 6 | Final HEAL | Single shared logo returns at the conclusion; exact bridge and CTA retained. |
| 7 | ABOUT | Existing supplied member credits, four-chapter context and SDG information retained. |
| 8 | Fullscreen | Native modal, proportional complete artwork, original badge, Close/Escape and focus return verified. |
| 9 | Mobile | Attached corner pin, readable stacked brief and horizontal progress rail; no page overflow. |

## Interaction and technical checks

- Forward wheel journey and reverse LIVEN → ADAPT → EXHAUST → HARM → landing settle correctly. Four tiny 4 px deltas hold HARM; an 800 px wheel gesture advances one chapter.
- Navigation links, direct hash loading, scroll-bar active chapter, transparent white nav and shared-logo endpoints checked. Pure reverse logo interpolation and scroll velocity/intent rules are covered by regression tests.
- Live previews remain noninteractive behind semantic opening buttons. Hover has no permanent bottom fullscreen label. External geometry retains its restrained hover scale/rotation.
- Enter opens the installation. Close and Escape return focus to the preview. EXHAUST's information panel consumes the first Escape; a subsequent Escape closes fullscreen.
- HARM RESTART cleared its real 20-burn completion while retaining fullscreen. EXHAUST → ADAPT, ADAPT → LIVEN and LIVEN → HEAL NEXT actions exit to catalogue sections, without opening another installation. Source reset and completion invariants for all four artworks are covered by tests.
- Preview frame rate is limited to 24; settled offscreen artworks stop. Fullscreen interaction remains in the same iframe; no source reload/reparent is introduced.
- Reduced motion and full motion both inspected. Storage denial, nested Escape, cached navigation and duplicate polling regressions covered.
- 1920×1080, 1440×900, 1366×768, 1024×768, 768×1024, 390×844 and 844×390: no horizontal overflow; every preview retained 16:9. Normal desktop/mobile resizing preserved the anchored chapter.
- Stack Sans Notch loaded; no duplicate top-level IDs; no native snap system conflicts. No console warnings/errors or failed requests observed during inspected reload/navigation. Relative asset graph checked with exact filename casing for GitHub Pages.
- 91 automated tests pass, including original artwork/runtime, magnetic scroll, logo flight, lifecycle, asset graph and verbatim copy checks.

## Source integrity

Compared installed source files with the recorded newest UPDATES manifest. HARM sketch and its four scene modules match. ADAPT sketch/composition/environment/UI/styles and LIVEN sketch/UI/styles match. EXHAUST's only existing sketch difference is its local font stylesheet URL. HARM's pre-existing sound adapter disables unavailable recordings. This refinement pass does not modify any original artwork sketch.

## Limits and supplied-material issue

- The six original HARM sound recordings are absent from the supplied package. Sound stays explicitly unavailable; no replacement sounds were invented and no missing audio requests are sent.
- No physical phone, Windows Precision Touchpad, Mac trackpad or screen reader was available. Touch/keyboard momentum rules are regression-tested; native touch injection is unsupported in this in-app browser. These checks do not establish full accessibility conformance or universal 60 FPS performance.
- Viewport testing uses Chromium emulation at 100% browser zoom. Safari/Firefox and hardware-specific GPU performance remain unverified.
- Old standalone HTML/PDF exports are historical snapshots; the current deployable source is `code/`.
