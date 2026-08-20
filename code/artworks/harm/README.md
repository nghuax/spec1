# BURN V32.7 — Larger Bottom Bar

This version fixes the V32 runtime/package errors while preserving the V30.2 visual system.

## Fixes
- Fixed machine-smoke runtime ReferenceError (`y is not defined`).
- Smoke particles now store their source origin explicitly.
- Restored local `p5.js` so the project opens offline without a missing-library error.
- Corrected the pollution-field buoyancy direction.
- Kept factory V20/V21-style polygon smoke, with calmer plume motion.
- Kept machine smoke smaller and trail-free.
- Reduced atmosphere density to avoid grey visual overload.
- Preserved coal interaction, architecture unlock waves, local pollution, damage, trees, poles, houses and factories.

## Controls
- Click coal: burn coal.
- Drag coal into the hopper: burn coal.
- Hover a formed house/factory: create demand.
- Move pointer: gently influence the shared air field.
- R: reset.
- S: save PNG.

## Validation
- `node --check sketch.js`
- Runtime simulation: setup + draw + 8 burns + particle finite-value checks + reset + coal click path.


## V32.2 performance fix
- Lower live particle budgets without reducing factory plume scale.
- Settled carbon/ash/debris leave the active simulation after depositing pollution.
- Reusable polygon templates eliminate per-frame geometry allocation and GC spikes.
- Smoke turbulence/noise is sampled less often while positions still update every frame.
- Machine burst count is capped to prevent click-induced frame spikes.


## V32.5 subtitle fix
- Restored the required local `p5.js` library.
- Rebuilt from the stable V32.3 codebase.
- Interaction subtitle is HTML/CSS only and does not touch the p5 render loop.
- Dynamic status and static interaction help are contained inside the 16:9 canvas holder.
