# HEAL

**Version:** 1.0.0  
**Date:** 20 August 2026

HEAL is a responsive static exhibition website for COMM2748 / Digital Specialisation 1 at RMIT University Vietnam. It presents four p5.js artworks as one sequential environmental journey:

**HARM → EXHAUST → ADAPT → LIVEN**

One connected journey from damage to recovery.

## Project description

The experience moves from the consequences of traditional energy, through pollution and environmental exhaustion, toward renewable adaptation and recovery. Each artwork remains an independently runnable p5.js package and is loaded into its chapter page through a same-origin iframe.

No stock media, externally hosted fonts, analytics, framework, backend, database or build process is used. Stack Sans Notch is self-hosted under the SIL Open Font License 1.1. All visual material is typography, CSS geometry or artwork produced inside the supplied p5.js sketches.

## Website structure

- `index.html` — HEAL introduction and chapter sequence
- `works/harm.html` — HARM chapter and industrial-energy artwork
- `works/exhaust.html` — EXHAUST chapter and pollution artwork
- `works/adapt.html` — ADAPT chapter and ADAPTS artwork
- `works/liven.html` — LIVEN chapter and renewable-energy puzzle
- `about.html` — shared concept, four stages, visual identity and licences
- `css/` — reset, variables, global layout, homepage and artwork styles
- `js/content.js` — canonical project and chapter content
- `js/navigation.js` — persistent navigation and footer
- `js/site.js` — page rendering, artwork loading states and progressive reveal
- `artworks/` — four isolated p5.js packages
- `assets/fonts/` — self-hosted Stack Sans Notch variable font and OFL licence

## How to run

The site uses JavaScript modules, so it must be served through HTTP.

1. Open a terminal inside the `code` directory.
2. Start any standard static web server, for example:

   ```bash
   python -m http.server 8000
   ```

3. Open `http://localhost:8000/index.html` in a browser.

Do not open the site directly with a `file://` URL.

## How to navigate

- Select **ENTER THE JOURNEY** on the homepage to begin with HARM.
- Use the persistent H / E / A / L chapter navigation to move directly between works.
- Each work page includes journey progress and previous/next navigation.
- On mobile, select **MENU** to open the full chapter navigation. Press Escape to close it.
- After LIVEN, **COMPLETE THE JOURNEY** opens the About page.

The website navigation is keyboard accessible with Tab, Shift+Tab, Enter and Space. Keyboard input inside a focused artwork iframe is handled by that artwork.

## Artwork controls

### H — HARM

- Click a coal piece to burn it.
- Drag coal into the hopper to burn it.
- Hover over a formed house or factory to create demand.
- Move the pointer to influence the shared air field.
- Use **MIX** to adjust the six semantic sound channels.
- `M` mutes or unmutes the artwork.
- `R` resets the artwork.
- `S` saves a PNG.

### E — EXHAUST

- Press the central **FOSSIL ENERGY** control to launch guided pollutant particles at the floating natural forms.
- Select **!** or press `I` for project information; press Escape to close it.
- Use **MUTE** to control the generative ambience.
- `R` regenerates the artwork.

### A — ADAPT

- Select **SUN** or **WIND** on the artwork, or press `1` / `2`.
- Drag across the field and use both sources until recovery reaches 100%.
- Use the optional **SOUND** control for interaction and completion cues.
- `R` resets the artwork.
- `S` saves a PNG.

### L — LIVEN

- Drag renewable-energy pieces into the matching Earth slots.
- Trash pieces can be moved but cannot restore the planet.
- `R` regenerates the scene.
- `S` saves a PNG.

## Browser requirements

Use a current version of Chrome, Edge, Firefox or Safari with JavaScript enabled. The layout supports desktop, laptop, tablet and mobile viewports in portrait and landscape. Reduced-motion preferences are respected.

## Directory structure

```text
code/
├── index.html
├── about.html
├── README.md
├── LICENSE
├── THIRD-PARTY-LICENSES.md
├── works/
│   ├── harm.html
│   ├── exhaust.html
│   ├── adapt.html
│   └── liven.html
├── css/
│   ├── reset.css
│   ├── variables.css
│   ├── site.css
│   ├── home.css
│   └── artwork.css
├── js/
│   ├── content.js
│   ├── navigation.js
│   └── site.js
├── artworks/
│   ├── harm/
│   ├── exhaust/
│   ├── adapt/
│   └── liven/
└── assets/
```

## Content configuration

Canonical shared copy and artwork controls live in `js/content.js`. The following fields intentionally remain empty because final information was not supplied:

- `project.quote`
- `project.callToAction`
- `project.members`
- `project.credits`
- each chapter's `credit`

Empty fields are omitted from production rendering. Add approved final content to these fields before submission; do not add placeholder copy directly to the HTML pages.

## Third-party and open-source code

The artwork packages use local copies of p5.js, and the full system uses a local copy of Stack Sans Notch. Versions and licensing are listed in `THIRD-PARTY-LICENSES.md`. The website does not require an internet connection during normal use.

## Licence

The website code is provided under the GNU General Public License version 3. See `LICENSE`. Third-party libraries remain under their respective licences.

## Credits

Group member names, student numbers and final individual artwork credits were not supplied and are therefore not displayed. Add approved credits through `js/content.js` before final submission.
