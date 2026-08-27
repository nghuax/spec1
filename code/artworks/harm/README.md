# HARM — STAGE 1 / SEMANTIC SOUND MIX

This build keeps the visual and interaction systems intact while replacing the previous crowded audio timing with a quieter, more stable hierarchy.

## Sound logic
- **Mouse Click** — foreground cue for real canvas presses, including coal and UI/info interactions. Hover demand is silent so clicks do not appear randomly.
- **Microwave** — a long, quiet central-machine bed. Its natural ting is removed from ordinary operation and plays only once at true 100% (20 burns).
- **Water Tap** — very low smoke/air atmosphere that follows active factory chimneys and ducks under the machine.
- **Rice** — very light factory-formation texture, delayed by a fixed 0.65 s for stable rhythm.
- **Oral Irrigator** — tiny secondary factory/mechanical accent at a fixed 1.80 s after formation begins.
- **Plastic Bag** — clearer environmental-damage texture, limited by cooldown and controlled pollution milestones so it is noticeable without becoming repetitive.

## Mixer
Six semantic user-facing controls:
- **CLICK** — interaction feedback.
- **MACHINE** — central coal-machine hum and the 100% completion ting.
- **SMOKE** — very low factory chimney ambience.
- **CONSTRUCTION** — light factory-forming texture.
- **FACTORY** — subtle mechanical factory accent.
- **DAMAGE** — environmental damage texture.

The percentage in parentheses is the recommended starting point. `M` toggles mute. Settings are stored in localStorage.

## Performance / safety
Audio is isolated in `sound.js`. The p5 loop only passes existing visual state (factory-smoke activity and pollution level) into the sound system; it does not run decoding, audio DSP or restart samples per frame. Smoke ambience is smoothed on a lightweight 100 ms timer. Visual animation, particle budgets, pollution simulation and object timing are unchanged.

## Existing controls
- Click coal: burn coal.
- Drag coal into the hopper: burn coal.
- Hover a formed house/factory: create demand.
- Move pointer: gently influence the shared air field.
- R: reset.
- S: save PNG.
- M: mute/unmute.

## V7 six-channel sound mix
- All six designed recordings now have independent volume sliders in the MIX panel.
- Recommended starting levels are displayed beside each source name and can be restored with RESET RECOMMENDED.
- Mouse Click is the foreground interaction cue.
- Microwave starts immediately when coal is committed to the machine, but normal operation stops before the recording's natural bell.
- The Microwave bell/ting is isolated from the same recording and plays only once when the machine reaches its visual 100% threshold (20 burns / full 8-cell indicator).
- Water Tap is reserved for a low, continuous factory-smoke background bed.
- Rice is a quiet factory-formation texture; Oral Irrigator is a small secondary industrial accent; Plastic Bag is a rare damage texture.
- Sound scheduling remains outside the p5 draw/particle loops, preserving animation timing and performance.

## V8 semantic sound mix
- Sound settings now use semantic roles instead of recording filenames: CLICK, MACHINE, SMOKE, CONSTRUCTION, FACTORY, DAMAGE.
- All six designed recordings remain independently adjustable; the value in parentheses is the recommended mix.
- Recommended mix: CLICK 70%, MACHINE 38%, SMOKE 8%, CONSTRUCTION 14%, FACTORY 12%, DAMAGE 26%.
- Microwave is pre-shaped into one longer, quiet machine bed (~6.1 s) with a crossfaded continuation of its pre-bell material; the natural bell/tail is preserved later in the same WAV for the 100% cue.
- The natural Microwave bell/ting is isolated from normal machine playback and is triggered only once when the machine reaches its true 100% threshold (20 burns).
- Water Tap is reduced to a very quiet factory-smoke ambience and ducks further while the machine/ting is active.
- Plastic Bag is more audible and is also triggered at controlled pollution milestones so the environmental-damage sound is not missed.
- These audio changes read existing visual state only; smoke, pollution, particles, physics, architecture formation and animation timing are unchanged.


## Damage sound + visual synchronization
- The **DAMAGE** channel (Plastic Bag recording) is now paired with a dedicated wind-blown litter/plastic animation.
- Structural damage releases small plastic bags, wrappers and torn strips from the exact damage position.
- Pollution milestones at 28%, 55% and 78% also create a restrained litter gust near an active factory/machine.
- Damage audio milestone playback is controlled inside `js/systems.js`, so every scheduled Plastic Bag damage cue has a corresponding visual event.
- The litter layer is capped at 105 lightweight sprites and is separate from the existing debris/smoke physics.


## Damage shape variation
- Expanded the DAMAGE visual from 3 litter silhouettes to 8 stylised waste/industrial-fragment families.
- Added bags, wrappers, film ribbons, crushed cans, bottle/label shards, loop fragments, jagged foil and hooked strap shapes.
- Shape variation is visual-only: the approved machine/factory sound mapping and audio mix are unchanged.
- Damage particles remain capped and lightweight so the main smoke/animation system keeps its existing performance.

## V9 factory smoke refinement
- Factory smoke is intentionally only **slightly denser**, not redesigned, so the approved composition remains intact.
- Factory chimney cadence is about 10–12% more continuous, reducing empty gaps between puffs without making both chimneys pulse together.
- Factory smoke particles begin a little fuller, grow to a moderately larger plume, remain visible slightly longer, and have a small opacity lift.
- The global smoke cap is raised from 560 to 620 to give the extra factory exhaust headroom without removing the existing performance guard.
- Machine smoke, sound logic, six WAV files, DAMAGE shapes, pollution logic, object formation and interaction timings are unchanged.

## Compact code structure — behavior preserved
The artwork uses four compact feature bundles instead of many small nested modules. No function body, constant, animation value, particle rule, timing value, random call, sound cue or interaction rule was rewritten. `sketch.js` contains shared configuration/state and setup; the four files inside `js/` are loaded in the exact original order.

```text
code/
├── index.html
├── style.css
├── p5.js                    # vendor library — unchanged
├── sound.js                 # six-channel audio system — unchanged
├── sketch.js                # constants, shared state, setup/reset
└── js/
    ├── scene.js             # world creation, draw loop, demand
    ├── systems.js           # coal, energy, environment, damage, smoke
    ├── render.js            # backdrop, world and particle rendering
    └── interface.js         # HUD, input events and shared helpers
```

### Compact-structure validation
- Concatenating the compact sketch files in HTML load order reproduces the previous modular source **byte-for-byte** (same SHA-256).
- Every JavaScript file passes `node --check`.
- Sound files and `sound.js` are not modified by this structure pass.
- The browser loads the scripts as classic scripts, preserving the shared global lexical scope used by the original p5 global-mode sketch.
