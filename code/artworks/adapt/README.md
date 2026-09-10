# ADAPTS — Regeneration Field

Version 3.5.1 — 8 September 2026

Nguyen Gia Toan Phu Nghia — S4099019  
COMM2754 Digital Media Specialisation 1 — Assignment 2, Week 8

## Concept

ADAPTS is a 1920 × 1080 animated p5.js artwork about SDG 7: Affordable and Clean Energy. A deterministic composition of damaged habitats becomes a vivid network through solar and wind energy. The same buildings, infrastructure, trees and islands remain recognizable throughout recovery. The artwork belongs to Stage 3 of the HEAL sequence: HARM → EXHAUST → ADAPT → LIVEN.

Stage 3 ends with “A connected clean-energy network is ready.” Its transition establishes the shared renewable-energy system before LIVEN explores life returning to Earth. The guided sequence makes the animation and sound available through one clear starting action; the manual controls let viewers explore how both sources contribute.

## Installation and execution

No build step, plug-in installation or internet connection is required.

1. Unzip the submission folder.
2. Open a terminal in this `code` directory.
3. Start a local web server, for example `python -m http.server 8000`.
4. Open `http://localhost:8000/index.html` in a current browser.
5. Select the **circular reset arrow** or an energy icon to enable the six local WAV sound cues. The **speaker icon** opens Sound Control Panel, with six individual volume sliders, mute, and Use Recommended.

## Controls

- Select the **circular reset arrow** for a guided sequence lasting approximately 20 seconds. It moves through damage, sunlight, wind and network assembly.
- Select the **sun** or **wind** icon, or press `1` / `2`, to choose a manual tool.
- Drag with a mouse or touch across the habitats to supply energy. Use both sources to complete the field; the selected tool and recovery progress remain visible.
- Use the **speaker icon** to open Sound Control Panel. Mute inside the panel or press **M**. Sliders adjust live cue levels and preview on release when unmuted; Use Recommended restores the original balance. Mix levels and mute are preserved when the composition is reset.
- The same **circular arrow**, or `R`, resets the composition and replays the guided sequence from the beginning, including during playback. Select SUN or WIND to return to manual control.
- Press `S` to export the artwork with its title and current subtitle through `exportArtwork()`.
- Select the `!` button for the readable on-screen guide.
- In the HEAL website, use the page’s chapter navigation to continue to LIVEN.

The artwork has five controls: SUN and WIND in their original area, plus sound control panel, reset/replay and information on the right. The separate start, pause, save and continuation buttons are removed. All buttons are icon-only and reuse the original Figma information button silhouette. Hover or keyboard focus reveals the control name; screen readers receive explicit action labels. A check mark identifies the selected energy source, and the small bars show supplied energy. The guide explains every icon.

## Technical details

- Logical canvas: 1920 × 1080 pixels, pixel density 1.
- Presentation: the artwork preserves its 16:9 field and places the energy tools, guided start, recovery indicator and playback options directly on the artwork surface. The exact original blue, black and white Figma information-button silhouette gives every control a consistent shape, shadow and icon scale. The interface follows the artwork from grey to colour, while the active source remains identifiable by a check mark and source colour. Narrow portrait views arrange these controls around the complete field on one continuous surface, with readable text and touch targets. Mouse, touch and keyboard controls are available.
- Animation: target of 60fps; actual frame rate depends on the browser and device.
- Environmental composition: nine habitat groups and twelve independent energy modules; four systems share the large island. Every reset selects a fresh seed, then `composition.js` generates up to 96 deterministic candidate layouts and keeps the highest-scoring valid result. Candidates are built in anchor, primary, support and atmosphere passes with normalized zones, responsive UI exclusion areas, scaled collision bounds, relationship-aware spacing and left/center/right plus top/middle/bottom balance checks. Recovery starts again; each object keeps its generated scale and identity while the polluted and recovered renderers transition the same layout.
- Asset system: exactly ten reusable families in `environment-assets.js`, with ten shared color tokens. Ground, basic house, solar house, solar array, turbine, tree, tree cluster, wildlife, landmark and pollution cluster retain their clean recovered forms. Polluted structures use a few deterministic breaks and offsets, with at most eleven major shapes per asset. Five four-shape pollution clusters remain. Wildlife appears only after its habitat reaches 65% visual recovery.
- Atmosphere: 420 deterministic texture anchors create a rich floating-shape field behind habitats, plus 28 stratified accent pieces distributed across the full work. In the polluted state, `pollutedToneAt()` makes peripheral fragments amber/hot orange and progressively darkens the center toward rust and brown; recovery lerps those same anchors back into the clean accent palette. UI and object clearance checks keep the visible shapes away from primary silhouettes; one fifth of anchors fade during recovery. Movement follows the existing pause and reduced-motion clock.
- v3.6 composition reference: each habitat also has twelve bounded nearby scrap anchors, with ten large translucent edge shapes across the scene. Polluted groups hover above separate platforms with stronger sway and tilt; the central platforms join the shared island during recovery. The recovered scene keeps the current clean asset pack and persistent colorful fragments.
- Ambient motion: `getFloatOffset` adds faster layered render-only drifting, gentle harmonic rotation and up to 0.32% breathing scale. Buildings use roughly 4px vertical movement; lighter forest/wildlife groups use 5.5px; the shared island moves around 3px as one connected structure. Texture varies over 6–14 second authored periods with a 2.56x motion clock, doubling the previous float speed while preserving the same amplitudes and visual restraint. Polluted motion remains visually restrained. Existing wind-brush impulses remain, but idle ambient flow never changes layout coordinates. Pause and reduced motion are respected; turbine rotors turn faster when wind is active.
- Energy network: source-to-habitat connections are generated from the current solar, wind and receiving modules. Moving energy signals show how renewable sources supply the shared system.
- Visual media: original p5.js primitive geometry, original Figma interface silhouettes and local SVG control icons.
- Sound: three revised A1 recordings and three new original A2 recordings are loaded locally and played through the Web Audio API after the first user gesture. The new keyboard cue accompanies the multi-second assembly, while paper and water support wind and recovery. Matching 48 kHz masters, raw sources and untouched originals are supplied in the submission folders.

## Functional array methods

The student-authored `sketch.js` uses JavaScript's `forEach`, `map` and `filter` in the running artwork. These methods process the generated habitats, network connections and temporary particles.

| Array method | Use in the artwork | Why it fits |
| --- | --- | --- |
| `.forEach()` | Updates every habitat's energy during the guided sequence and updates particle position or lifetime in `updateParticles()`. | Performs an update for each existing array item without creating a replacement array. |
| `.map()` | `buildEnergyNetwork()` converts receiving habitats into connection objects containing a source, target and animation phase. | Creates one new connection object for each receiving habitat. |
| `.filter()` | `buildEnergyNetwork()` selects solar/wind sources and receiving habitats, then removes connections without a source. `updateParticles()` keeps particles whose lifetime remains above zero. | Creates an array containing only items that pass a condition. |

JavaScript's array `.map()` is different from p5.js's numeric `map(value, start1, stop1, start2, stop2)` helper. The array method transforms a collection; the p5.js helper converts a number between ranges. The network implementation uses the array method required by the lecturer.

## Runtime files

- `index.html` — standalone browser entry point.
- `style.css` and `fonts.css` — responsive artboard, readable interface and local typography.
- `sketch.js` — generation, energy network, guided and manual animation, sample playback, state, particle updates and complete PNG export.
- `composition.js` — pure seeded layout generation and validation. It owns normalized safe zones, weighted asset scale ranges, anchor/group placement, viewport and UI clearance, hierarchy, spacing, distribution scoring and deterministic candidate selection.
- `environment-assets.js` — the ten deterministic environmental renderers and centralized palette. Polluted faces use the Desert Sun family from light sand orange and muted clay through burnt amber, ochre, cinnamon, shadow brown and dust shadow; asset variants select controlled midtone differences while the existing recovery lerps return each asset to its clean palette. Each accepts `x`, `y`, `scale`, `rotation`, `state: 'polluted' | 'recovered'`, optional continuous `recovery`, `variant` and `alpha`. Solar assets accept `energy`; turbines accept `angle`; islands accept `width` and `height`. All objects share a horizontal-center / ground-baseline origin.
- `ui.js` — integrated artwork controls, live progress, subtitle timing, information guide and chapter completion messages.
- `p5.js` — local p5.js library.
- `assets/figma-ui/` — original interface vector exports.
- `assets/audio/` — six local 48 kHz final WAV cues used by the artwork.
- `assets/fonts/` — Stack Sans Notch and its SIL Open Font License.
- `LICENSE` — GPL 3.0 licence for project code.
- `THIRD-PARTY-LICENSES.md` — p5.js and font attribution.

## Credits and licensing

Concept, visual system, code adaptation, interface assets, original recordings and sound design: Nguyen Gia Toan Phu Nghia. Group identity developed with the HEAL project team. p5.js is used under the GNU Lesser General Public License; Stack Sans Notch is used under the SIL Open Font License. The student project code is released under GPL 3.0. See the included licence files for details.

Contact: s4099019@rmit.edu.vn

The Sound Control Panel opens as a compact bubble 12 pixels to the left of the speaker, clamped inside the artwork. Click the speaker again, click outside, or press Escape to close it. On narrow screens its sliders scroll within the bubble.
