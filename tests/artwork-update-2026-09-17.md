# Supplied artwork integration — 17 September 2026

Source: `HEAL - No Ending Popups (1).zip` supplied by the user.

| Source entry | Published artwork |
| --- | --- |
| STAGE 01 HARM/HARM | code/artworks/harm |
| STAGE 02 EXHAUST/code | code/artworks/exhaust |
| STAGE 03 ADAPT/code | code/artworks/adapt |
| STAGE 04 LIVEN | code/artworks/liven |

Original directories are retained in `output/artwork-backup-2026-09-17`.
Extracted source is retained in `output/artwork-source-2026-09-17`.

## Integration

- Each source remains inside its existing isolated iframe, with its own p5 runtime.
- Preserved supplied sketches, internal controls, graphics and mastered audio.
- Added the existing exhibition bridge to each entry point, relocated sibling
  audio/assets into each artwork directory and corrected relative references.
- Reused the local Stack Sans Notch font for HARM and EXHAUST.
- HARM completion follows `completionShown` and critical pollution; EXHAUST
  follows `artworkComplete`. ADAPT and LIVEN retain their source recovery flags.
- Restored HARM sound availability and mute synchronization with its source API.
- Kept the current site completion overlay and its actions. No ending redesign.
- Existing chapter composition, UI sounds, navigation, scrolling, fullscreen,
  background, conclusion and ABOUT were not redesigned.

## Verification

- Browser: all four previews loaded, opened fullscreen and ran without reported
  console errors. The complete landscape canvases remained fitted to the viewport.
- HARM: seven real coal-transfer actions reached critical pollution/completion.
- EXHAUST: real fossil-energy actions reached 100% environmental destruction.
- ADAPT: source guided recovery reached 100% and triggered completion.
- LIVEN: all three matching placements reached 100%; keyboard RESTART returned
  recovery to 0% while remaining fullscreen; close returned to the chapter.
- NEXT from HARM, EXHAUST and ADAPT returned to the following chapter preview.
- LIVEN mobile portrait fullscreen and resize checked at 390 × 844; close and
  website controls remained reachable. This is browser testing, not physical
  touchscreen or speaker listening verification.
- Active automated suite: 81 passing tests, including source ADAPT recovery,
  reset, audio routing, input, bridge lifecycle and static asset path casing.
- Fourteen tests for retired ADAPT composition/environment modules were moved
  to `tests/legacy-adapt`; current runtime tests target the supplied sketch.

Changes are local; this pass does not publish a new GitHub Pages deployment.
