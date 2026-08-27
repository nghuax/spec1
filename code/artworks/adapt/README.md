# ADAPT — Modular Clean-Energy Field

Stage 3 uses the selected modular p5.js primitive asset system while retaining the original SUN/WIND recovery interaction.

Current presentation:

- 1920 × 1080 canvas with the exact Figma title badge, subtitle banner, and information control layered above the artwork
- no background cross-grid and no central Earth/orb
- open composition with 8–10 randomly selected modular habitats and no orbit rings
- a freshly randomized damaged-habitat layout on every load and `R` reset, with minimum spacing and protected UI zones
- a state-aware subtitle that appears after one second: the ADAPT clean-energy prompt in State 1 and the LIVEN recovery message in State 2
- State 1 regenerates the silhouettes of its charcoal planes and nested polygons on every reset while keeping one fixed grey palette; the former cobalt lower-left wedge has been removed
- depth-linked damaged assets: distant groups are darker and restrained, nearer groups are lighter and float more
- State 1 converts the blue, orange and green interface accents into layered greys, then restores the approved interface colours in State 2
- State 2 uses a darker fixed blue shade family with newly generated primitive silhouettes on every load or reset
- damaged habitats now reshuffle their type/scale hierarchy and include additional free-falling ambient fragments plus 6–9 loose fragments per habitat
- every reset retains all six habitat families, then adds randomized duplicates up to the selected 8–10 total
- centre-based p5 primitive geometry keeps walls, roofs, panels, turbines, trees, wildlife and split platforms precisely assembled in State 2
- flat, outline-free assets with no diagonal bands, corner wedges, grid, rings, or orb
- exported Figma SVG assets are stored locally in `assets/figma-ui/` so the interface does not depend on expiring remote asset links

The `!` control opens a compact information bubble with the Stage 3 message, SUN/WIND interaction guide, reset shortcut, and save shortcut. It closes through the `CLOSE` action, `Escape`, or a click outside the bubble.

Interaction remains available directly on the canvas:

- press `1` for SUN
- press `2` for WIND
- drag with an equal 580-pixel SUN or WIND brush to restore the field; the transparent brush zone shows the active reach
- balanced completion now unfolds as a staggered multi-second assembly instead of snapping directly to State 2
- the p5 canvas targets 60fps at all motion-preference settings
- press `R` to reset and generate a new falling-apart composition
- press `S` to save a PNG

Sound is enabled by the first user gesture. The artwork uses six local 48 kHz WAV masters: three revised A1 sounds for confirmation and solar energy, plus three new original paper, water and keyboard recordings. Paper supports the WIND brush, keyboard typing begins with the dramatic assembly, and water marks the arrival of State 2.
