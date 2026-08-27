# Third-Party Licences

HEAL includes local, unmodified runtime copies of p5.js inside the isolated artwork packages. p5.js is developed by the Processing Foundation and contributors and is licensed under the GNU Lesser General Public License version 2.1 (LGPL-2.1).

Official project: <https://github.com/processing/p5.js>  
Official licence text: <https://github.com/processing/p5.js/blob/main/license.txt>

## Included copies

| Dependency | Version | Location | Used by |
|---|---:|---|---|
| p5.js | 1.9.0 | `artworks/harm/p5.js` | HARM |
| p5.js | 2.3.2 | `artworks/exhaust/p5.js` | EXHAUST |
| p5.sound | 0.4.1 | `artworks/exhaust/p5.sound.min.js` | EXHAUST |
| p5.js | 1.9.0 | `artworks/adapt/p5.js` | ADAPT |
| p5.js | 1.11.13 | `artworks/liven/p5.min.js` | LIVEN |

The p5.js library is not owned by the HEAL group. No ownership claim is made over it. The copies are kept local so that the artworks can run without a network connection and are not merged into the website JavaScript.

The EXHAUST package also includes p5.sound 0.4.1. Its bundled Tone.js components identify Tone.js 15.0.2 and the MIT licence in the distributed source. No ownership claim is made over either dependency.

## Stack Sans Notch

HEAL self-hosts the variable Stack Sans Notch webfont for the website interface and artwork typography.

- **Typeface:** Stack Sans Notch
- **Version:** 1.000 (official repository release dated 3 October 2025)
- **Designer:** Koto
- **Copyright:** The Stack Sans Project Authors
- **Licence:** SIL Open Font License 1.1 (OFL-1.1)
- **Font file:** `assets/fonts/stack-sans-notch-variable.woff2`
- **Bundled licence:** `assets/fonts/OFL.txt`
- **Official source:** <https://github.com/DylanYoungKoto/Stack-Sans>

The font is redistributed without modification. Its licence remains separate from the website's GPL-3.0 licence.

## Artwork and site code

The HEAL website code is covered by the GNU General Public License version 3 in `LICENSE`. The supplied student artwork source remains attributed to its original group creators; final individual credit details must be added by the group when approved.
