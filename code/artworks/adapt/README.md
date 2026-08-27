# ADAPTS — Regeneration Field

Version 3.0 — 26 August 2026  
Nguyen Gia Toan Phu Nghia — S4099019  
COMM2754 Digital Media Specialisation 1 — Assignment 2, Week 8

## Concept

ADAPTS is a 1920 × 1080 generative and animated p5.js artwork about SDG 7: Affordable and Clean Energy. Each run creates a new damaged field of floating habitat fragments. Solar and wind energy gradually reconnect the pieces, clear the grey atmosphere and reveal a vivid network of restored habitats. The artwork belongs to Stage 3 of the HEAL sequence: HARM → EXHAUST → ADAPT → LIVEN.

## Installation and execution

No build step, plug-in installation or internet connection is required.

1. Unzip the submission folder.
2. Open a terminal in this `code` directory.
3. Start a local web server, for example `python -m http.server 8000`.
4. Open `http://localhost:8000/index.html` in a current desktop browser.
5. Click or press a control once to enable the six local WAV sound cues.

## Controls

- Press `1` to select SUN.
- Press `2` to select WIND.
- Drag across the complete artwork with both tools to regenerate the field.
- Press `R` to create a new randomized composition.
- Press `S` to save the canvas as a PNG.
- Select the `!` button for the on-screen guide.

## Technical details

- Logical canvas: 1920 × 1080 pixels, pixel density 1.
- Presentation: proportionally scaled full-screen with protected 16:9 composition.
- Animation: targeted at 60fps, exceeding the 30fps assessment requirement.
- Generation: 8–10 readable habitat groups per reset; 11–13 independent habitat modules because four systems combine on the large shared land.
- Visual media: original p5.js primitive geometry and original Figma-authored interface assets only.
- Sound: three revised A1 recordings and three new original A2 recordings are loaded locally and played through the Web Audio API after the first user gesture. The new keyboard cue accompanies the multi-second assembly, while paper and water support wind and recovery. Matching 48 kHz masters, raw sources and untouched originals are supplied in the submission folders.

## Runtime files

- `index.html` — standalone browser entry point.
- `style.css` and `fonts.css` — full-screen presentation, interface and local typography.
- `sketch.js` — generation, animation, sample playback, state and optional interaction.
- `ui.js` — subtitle timing and information popover.
- `p5.js` — local p5.js library.
- `assets/figma-ui/` — original interface vector exports.
- `assets/audio/` — six local 48 kHz final WAV cues used by the artwork.
- `assets/fonts/` — Stack Sans Notch and its SIL Open Font License.
- `LICENSE` — GPL 3.0 licence for project code.
- `THIRD-PARTY-LICENSES.md` — p5.js and font attribution.

## Credits and licensing

Concept, visual system, code adaptation, interface assets, original recordings and sound design: Nguyen Gia Toan Phu Nghia. Group identity developed with the HEAL project team. p5.js is used under the GNU Lesser General Public License; Stack Sans Notch is used under the SIL Open Font License. The student project code is released under GPL 3.0. See the included licence files for details.

Contact: s4099019@rmit.edu.vn
