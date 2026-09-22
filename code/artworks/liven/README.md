# Liven

Liven is an interactive p5-2026-09-22-v01.js artwork connected to Sustainable Development Goal 7: Affordable and Clean Energy.

The project uses a puzzle-game interaction to communicate environmental cause and effect. Clean-energy home continents restore Earth, while polluting factories temporarily darken it and bounce back to orbit. Completing all three clean-home continents brings the planet back to life.

A white storytelling panel at the bottom of the artwork advances through the narrative sequence as the user clicks and interacts. After all ten messages have appeared, later interactions continue showing the messages in random order without immediately repeating the same line.

## Display and Technical Requirements

- Design coordinate system: 1920 × 1080
- Full-screen responsive browser presentation
- Press `F` to toggle full screen in browsers supporting the Fullscreen API.
- Landscape retains the 1920 × 1080 composition. Portrait rearranges orbital paths around Earth and gives the title, controls, mixer and storytelling panel dedicated screen positions.
- Animation frame rate: 30 FPS
- Built with HTML, CSS, JavaScript and p5-2026-09-22-v01.js
- Artwork elements are drawn directly in `sketch-2026-09-22-v01.js` and `graphics-2026-09-22-v01.js`; the interface uses bundled SVG assets.

## Files

- `index-2026-09-22-v01.html`
- `style-2026-09-22-v01.css`
- `sketch-2026-09-22-v01.js`
- `ui-2026-09-22-v01.js` — HTML interface connected to the p5-2026-09-22-v01.js artwork
- `graphics-2026-09-22-v01.js` — continent outlines, geometric clean homes and factories, recovering trees and ocean, and the completion circle of people
- `assets/fonts/` — Stack Sans Notch and its SIL Open Font License
- `assets/figma-ui/` — shared HEAL paper layers from ADAPTS
- `assets/sounds/*.wav`
- `README.md`
- `LICENSE`

## How to Run

Extract the complete ZIP before opening `index-2026-09-22-v01.html`. Keep `ui-2026-09-22-v01.js`, `sketch-2026-09-22-v01.js`, `graphics-2026-09-22-v01.js`, `style-2026-09-22-v01.css` and the entire `assets` folder together. p5-2026-09-22-v01.js, fonts and sounds are bundled locally, so no Internet connection is required. For the most reliable preview, use the local server below.

Open a terminal in the `code` directory and start a local web server.

Using Python 3:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

## Interaction

- Click or interact with the artwork to advance the storytelling text. After the full sequence has appeared, later interactions continue with randomized storytelling messages.
- Hover interactive puzzle pieces to see them react.
- Drag clean-home continents into their matching spaces on Earth.
- Drop a factory onto Earth to trigger its sound and temporarily darken the planet. It automatically bounces back to orbit.
- Complete all three clean-home continents to restore Earth and reveal the circle of people holding hands.
- Use the speaker button to open Sound Mix and adjust each interaction sound independently.
- Use `M` to mute or unmute all sound effects. The Sound Mix panel also includes a recommended preset.
- The clickable `MUTE` / `UNMUTE` button uses the same style as `USE RECOMMENDED`. Control tooltips appear to the left, at their original text size.
- Use the reload button to regenerate the composition.
- Use the `!` utility button to open or close Project Information.
- Press `I` to open or close Project Information.
- Press `R` to regenerate the composition.
- Press `S` to save the current artwork as a PNG.

The interface shares ADAPTS' Stack Sans Notch typeface, layered title and subtitle assets, blue paper controls, compact sound panel and light information dialog. The HTML interface is separate from the artwork canvas; PNG export saves the canvas artwork. Use Tab to focus controls, arrow keys to change a focused sound slider, and Escape to close a panel. The sound mixer retains each channel's recommended level and preview sound.

## Interaction Sounds

- `drag-element.wav`: starts when a clean-home or factory piece is picked up.
- `correct-element.wav`: plays when a clean-home piece is placed correctly.
- `earth-restore.wav`: plays when the third clean-home piece restores Earth.
- `trash-element.wav`: plays when a factory is dropped onto Earth, before it returns to orbit.
- `trash-remove.wav`: retained as a previewable channel in Sound Mix; manual factory removal is no longer needed.
- `wrong-placement.wav`: plays when a piece is released outside a valid target.

## Storytelling Sequence

1. Earth is waiting for clean-energy homes to bring life back.
2. Drag a clean home into its matching continent on Earth.
3. Each clean-energy home helps the planet recover.
4. As clean homes return, dry trees grow back to life.
5. Be careful — polluting factories harm the planet.
6. Factory emissions temporarily darken Earth.
7. Factories bounce away and return to orbit automatically.
8. Choose clean homes to keep restoring the planet.
9. Complete all three clean-home continents to bring Earth back to life.
10. A living planet brings everyone together.

## Project Brief

Sustainable Development Goal 7 promotes access to affordable, reliable, and sustainable energy for all. Through our HEAL concept, we show the journey from environmental damage to recovery: traditional energy causes harm, pollution weakens nature and human wellbeing, renewable energy offers a cleaner alternative, and clean energy helps bring life back to the planet. The project highlights how shifting to renewable energy can support both healthier communities and a more sustainable future.

## Call to Action

Help HEAL the planet by choosing cleaner energy & supporting a renewable future.

## Open Source Software

This project uses p5-2026-09-22-v01.js:
https://p5js.org/

Source repository:
https://github.com/processing/p5-2026-09-22-v01.js

## Project License

The original project code in this package is released under the GNU General Public License v3.0.

See the included `LICENSE` file for the complete license text.
