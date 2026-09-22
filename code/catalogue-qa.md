# HEAL catalogue + installations — 15 September 2026

Each chapter now contains a stage title, short brief and substantial live artwork preview in one composition. There is one magnetic chapter anchor. Approaching a chapter scales the title from 1.08 to 1 while the brief and preview reveal; all are visible at rest. Short screens retain a readable internal scroll range.

The GitHub reference was inspected at https://s4129129.github.io/SPEC1-A3/Nana/index-2026-09-22-v01.html for combined chapter content, preview affordance, fullscreen entry and return. Its visual design was not copied. HEAL keeps its orange/cobalt palette, Stack Sans Notch, offset plates and floating shapes.

## Fullscreen behaviour

The preview is the real original p5 artwork. A transparent semantic button captures the opening gesture while wheel/touch scrolling stays available. Only the visible chapter preview runs, muted at 24fps; offscreen previews stop. Primary interaction is enabled only inside the open installation. Original fullscreen frame rates are restored (30fps for LIVEN, 60fps for the others).

A native modal dialog promotes the same DOM subtree to the browser top layer without moving or recreating the iframe. A 560ms spatial expansion and 460ms return animate the actual iframe from/to its preview bounds. Reduced motion uses a 100ms fade. Native dialog behaviour provides background inertness and focus containment. Close and Esc restore the preview trigger; page scroll and the magnetic controller are suspended until return. Artwork aspect ratio and pointer mapping remain proportional.

Restart resets only the current artwork and stays fullscreen. Next and Continue close the installation and navigate to the next chapter composition, without opening its artwork. Fullscreen remains optional throughout.

## Validation

71 targeted Node checks pass: chapter stops/reveal, controller intent/momentum/reverse/touch/readable ranges, modal scroll suspension, preview/full lifecycle, muted throttled previews, gameplay rejection in preview, original completion/reset rules, motion preference and original ADAPT runtime/composition/environment.

Browser checks verified:

- Desktop 1366×768 title/brief/live preview composition and mobile 390×844 composition.
- Small phone 320×568: no horizontal overflow, internal chapter scrolling reveals the preview while retaining the chapter. Very short screens are allowed to scroll instead of shrinking text to fit.
- Landscape 844×390 and reduced-motion static title/fully visible copy and preview.
- Live LIVEN progress at 33% survives close/reopen; the iframe document object remains identical. All three real accessible placements produce 100% completion. Restart returns to 0% while staying open. Completing again and Next returns to HEAL.
- HARM's 20 accessible coal actions produce its real completion; Next closes fullscreen and lands on the EXHAUST chapter preview.
- Enter and Space open; Close and Esc return focus. Esc also works from inside the artwork iframe.
- Wheel and Page Down leave the underlying page offset unchanged while fullscreen is open.
- Phone fullscreen preserves the complete 16:9 artwork at browser zoom 1, with clear Close and access to artwork controls.

Anonymous MutationObserver errors were recorded during automated reloads; their stacks have no website URL and the application contains no MutationObserver usage. The checked fullscreen interactions remained functional. This is retained as an unresolved browser diagnostic rather than silently counted as a clean session.

## Preservation and limits

No original artwork sketch, asset, entry point or gameplay source was edited in this revision. The shared exhibition bridge changed only to select preview/full rendering, mute preview audio and keep fullscreen wheel input local. Original source sound/completion limitations remain: six HARM recordings were not supplied. No physical touch device, Windows/Mac trackpad or Safari/iOS hardware was available; touch lifecycle and momentum are covered by existing simulations. No deployment was performed.

Screenshots 01–07 document desktop, mobile, short-screen and reduced-motion layouts. Browser interaction establishes state preservation and transition behaviour; still screenshots alone do not establish motion quality.
