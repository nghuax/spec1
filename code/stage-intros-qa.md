# HEAL stage introductions — 15 September 2026

Implemented on the existing local website. Each chapter now follows INTRODUCE → EXPLAIN → EXPERIENCE: a large HEAL stage banner, a connected zoom-out/brief reveal, then the original fullscreen artwork. The reference site's title/content pacing was inspected; the existing HEAL colours, type, offset geometry, artwork presentation and ambient system were retained.

## Behaviour

- One sticky composition connects title and brief. Scroll progress drives scale (1 to .73), position and opacity. No whole-page zoom or added scroll library.
- Each chapter has three resting positions in the existing magnetic controller. Navigation, URL and progress rail retain one chapter identity. Navigation and completion Next open the next introduction.
- Artworks can preload during the introduction but remain paused and inert until exact fullscreen alignment. The brief is fully transparent when the artwork takes over.
- Reduced motion keeps the sequence using a compact static title and immediate settling. The same gesture cooldown prevents rapid wheel events from skipping the brief.
- Mobile uses a shorter introduction distance. Small-phone and short-landscape layouts have separate spacing adjustments.

## Verification

68 Node tests passed across stage introductions, section scrolling, living motion, exhibition lifecycle and the original ADAPT runtime/composition/environment suites. New coverage verifies ordered stops at multiple viewport heights, reversible reveal progress, reduced-motion narrative, paused preloading and activation only at artwork alignment. Controller integration checks cover forward/reverse chapter phases and large wheel momentum without brief skipping.

Browser checks covered all forward/reverse title, brief and artwork stops, direct chapter navigation, Page Down alignment, and actual HARM completion at 20 coal actions. Clicking its Next button landed on the EXHAUST introduction, with all artworks paused. Navigation and hashes stayed synchronized. The recorded 25-step journey is in `browser-qa.json`.

Visual checks: 1366×768 desktop, 390×844 phone, 320×568 small phone, and 844×390 landscape. On the final phone artwork check, scene height was 844px, top error was 0.143px, brief opacity was 0, browser zoom was 1, and there was no horizontal overflow. The complete original 16:9 artwork remained visible. Reduced-motion landscape title/brief overlap was found and corrected. The final browser console contained no error entries.

## Evidence

1. `01-exhaust-title-desktop.png` — dominant opening stage title.
2. `02-exhaust-brief-desktop.png` — smaller title and revealed brief coexist.
3. `03-liven-artwork-desktop.png` — original fullscreen art after the introduction.
4. `04-adapt-brief-phone.png` — 390×844 brief.
5. `05-adapt-brief-landscape.png` — 844×390 brief, full motion.
6. `06-adapt-brief-small-phone.png` — 320×568 brief without cue overlap.
7. `07-adapt-brief-reduced-landscape.png` — compact static reduced-motion title.
8. `08-adapt-artwork-phone.png` — brief removed, complete original art visible.

Screenshots document settled states; controller tests and browser phase/alignment measurements document motion behaviour. Physical touch devices, physical Windows/Mac trackpads and Safari/iOS were not available. Existing simulated touch/momentum checks pass. The supplied HARM package still lacks its six audio recordings, as previously documented. No deployment was performed.
