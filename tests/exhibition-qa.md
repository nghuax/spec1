# HEAL group exhibition QA — 10 September 2026

Scope: local Landing → HARM → EXHAUST → ADAPT → LIVEN → About revision. The four original artworks remain isolated in their original packages. No deployment was performed for this revision.

## Automated checks

- Existing website-shell and ADAPT environment, composition and runtime suites: 28 passing tests.
- Gallery integration: 6 passing tests covering same-origin/source/stage validation, saved mute and native-state synchronization, actual-completion messaging, dismissal and new attempts, reset, timeout/retry, standalone isolation, and EXHAUST’s p5 mixer handler.
- JavaScript syntax checks passed for the exhibition renderer, research renderer, frame controller and artwork bridge.
- Rendered About local links and six image paths resolve to files.

## Browser checks

- All four artwork packages initialized and acknowledged readiness; loading overlays cleared.
- All four desktop chapters measured at 1440×900, 1024×600 and 840×650: document dimensions fit the viewport, no horizontal or vertical page overflow. Additional 1280×720 visual checks confirmed the original artwork, instructions and navigation remain visible.
- 1280×720 landing page: 849 px document height (1.18 viewports).
- All four chapters at 390×844: no horizontal overflow, mobile artwork frame around 639 px tall, scrolling permitted.
- About reviewed at desktop and 390 px mobile width. Artist previews, section anchors, research hierarchy and process evidence included.
- Shared HARM, EXHAUST and ADAPT Sound Mix controls opened native panels. HARM → ADAPT mute preference remained OFF. ADAPT reset entered the original guided regeneration sequence.
- Mobile menu opens and Escape closes it. Existing focus-isolation behavior retained.
- LIVEN’s completion bridge is tested against completion/reset events; a full manual puzzle solve was not performed in this pass.

## Existing source limitation

HARM references six WAV recordings absent from the supplied sound folder. The shared mixer can open, but those recordings cannot play. Their filenames are retained in `code/artworks/designed-sounds/README.md` and the limitation is documented on About. No replacement recordings were fabricated.
