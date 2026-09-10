# Liven

Liven is an interactive p5.js artwork connected to Sustainable Development Goal 7: Affordable and Clean Energy.

The project uses a puzzle-game interaction to communicate environmental cause and effect. Renewable-energy pieces help restore Earth, while waste pieces darken it. Completing all three renewable-energy elements brings the planet back to life.

A white storytelling panel at the bottom of the artwork advances through the narrative sequence as the user clicks and interacts. After all ten messages have appeared, later interactions continue showing the messages in random order without immediately repeating the same line.

## Display and Technical Requirements

- Design coordinate system: 1920 × 1080
- Full-screen responsive browser presentation
- Press `F` to toggle full screen in browsers supporting the Fullscreen API.
- Landscape retains the 1920 × 1080 composition. Portrait rearranges orbital paths around Earth and gives the title, controls, mixer and storytelling panel dedicated screen positions.
- Animation frame rate: 30 FPS
- Built with HTML, CSS, JavaScript and p5.js
- Artwork elements are drawn directly in `sketch.js`
- No PNG or SVG image assets are required

## Files

- `index.html`
- `style.css`
- `sketch.js`
- `ui.js` — HTML interface connected to the p5.js artwork
- `assets/fonts/` — Stack Sans Notch and its SIL Open Font License
- `assets/figma-ui/` — shared HEAL paper layers from ADAPTS
- `assets/sounds/*.wav`
- `README.md`
- `LICENSE`

## How to Run

Extract the complete ZIP before opening `index.html`. Keep `ui.js`, `sketch.js`, `style.css` and the entire `assets` folder together. p5.js, fonts and sounds are bundled locally, so no Internet connection is required. For the most reliable preview, use the local server below.

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
- Drag renewable-energy pieces onto Earth.
- Drag waste pieces onto Earth to darken the planet.
- Click a waste piece placed on Earth to remove it and return it to orbit.
- Complete the solar panel, wind turbine and water wheel pieces to restore Earth.
- Use the speaker button to open Sound Mix and adjust each interaction sound independently.
- Use `M` to mute or unmute all sound effects. The Sound Mix panel also includes a recommended preset.
- The clickable `MUTE` / `UNMUTE` button uses the same style as `USE RECOMMENDED`. Control tooltips appear to the left, at their original text size.
- Use the reload button to regenerate the composition.
- Use the `!` utility button to open or close Project Information.
- Click the flashing `!` puzzle piece to open Project Information.
- Press `I` to open or close Project Information.
- Press `R` to regenerate the composition.
- Press `S` to save the current artwork as a PNG.

The interface shares ADAPTS' Stack Sans Notch typeface, layered title and subtitle assets, blue paper controls, compact sound panel and light information dialog. The HTML interface is separate from the artwork canvas; PNG export saves the canvas artwork. Use Tab to focus controls, arrow keys to change a focused sound slider, and Escape to close a panel. The sound mixer retains each channel's recommended level and preview sound.

## Interaction Sounds

- `drag-element.wav`: starts when a renewable-energy or waste piece is picked up.
- `correct-element.wav`: plays when a renewable-energy piece is placed correctly.
- `earth-restore.wav`: plays when the third renewable-energy piece restores Earth.
- `trash-element.wav`: plays when waste is placed on Earth.
- `trash-remove.wav`: plays when placed waste is removed.
- `wrong-placement.wav`: plays when a piece is released outside a valid target.

## Storytelling Sequence

1. Earth is waiting for a cleaner source of energy.
2. Drag a renewable energy piece toward the planet.
3. Every clean-energy choice helps Earth recover.
4. Solar, wind and water can restore what was damaged.
5. Be careful — not every piece brings life.
6. Waste and pollution will make the planet darker.
7. Placed the wrong piece? Click it to remove the damage.
8. Keep restoring Earth with renewable energy.
9. Complete all three clean-energy pieces to bring life back.
10. A renewable future begins with the choices we make.

## Project Brief

Sustainable Development Goal 7 promotes access to affordable, reliable, and sustainable energy for all. Through our HEAL concept, we show the journey from environmental damage to recovery: traditional energy causes harm, pollution weakens nature and human wellbeing, renewable energy offers a cleaner alternative, and clean energy helps bring life back to the planet. The project highlights how shifting to renewable energy can support both healthier communities and a more sustainable future.

## Call to Action

Help HEAL the planet by choosing cleaner energy & supporting a renewable future.

## Open Source Software

This project uses p5.js:
https://p5js.org/

Source repository:
https://github.com/processing/p5.js

## Project License

The original project code in this package is released under the GNU General Public License v3.0.

See the included `LICENSE` file for the complete license text.
