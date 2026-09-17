# ADAPTS — Regeneration Field

Version 3.7 — 16 September 2026

Nguyen Gia Toan Phu Nghia — S4099019  
COMM2754 Digital Media Specialisation 1 — Assignment 2, Week 8

## Concept

ADAPTS is a 1920 × 1080 generative and animated p5.js artwork about SDG 7: Affordable and Clean Energy. Each run creates a new damaged field of floating habitat fragments. Solar and wind energy gradually reconnect the pieces, clear the grey atmosphere and reveal a vivid network of restored habitats. The artwork belongs to Stage 3 of the HEAL sequence: HARM → EXHAUST → ADAPT → LIVEN.

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
- Generation: 8–10 readable habitat groups per reset; 11–13 independent habitat modules because four systems combine on the large shared land.
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

## Latest group consistency revision
Use **v3.9** as the current build. See `REVISION_V39_FULL_CONSISTENCY.md` for the synchronization pass based on the supplied Stage 1 HARM and Stage 2 EXHAUST samples.
