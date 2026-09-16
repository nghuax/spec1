# Reference asset integration

The attached photograph is a design reference only. No image is loaded or copied into the sketch. Changes target the live website artwork in `code/artworks/adapt`; archived exports remain untouched.

## Existing behavior inspected before replacement

| Asset | Generation and placement | Inputs and behavior retained |
| --- | --- | --- |
| Solar house / array | `buildModules`, rendered by `drawModules`; array at the shared solar habitat, rooftop panels on satellite houses | SUN brushing supplies `m.sun`; paired sun/wind charge drives recovery, energy links and final assembly. Existing habitat hit areas and count remain unchanged. This version has no panel-placement interaction. |
| Wind turbine | Wind habitats; tower and rotor share the same original ground anchor | `tm * m.wind * 0.38` rotates only the rotor; recovery repairs displaced blades. Pause and reduced-motion still control the shared clock. |
| Trees / clusters | Forest, solar, water and wildlife habitats; original offsets and scales | `moduleRecovery` controls crown growth and color. Added slight crown sway uses `tm`, habitat phase and recovery; trunks stay anchored. Wildlife still returns at its original threshold. |
| Buildings | Community and renewable habitats; same footprints and baseline | Recovery rejoins damaged facade sections. Windows now explicitly receive the habitat energy value; solar buildings forward their solar charge. |
| Pollution | The original five selected habitat IDs, at their existing offsets | The factory silhouette replaces rubble and fades using the original recovery thresholds of 0.12–0.9. |

The water habitats in this version contain a landmark and vegetation, not a water wheel. No decorative wheel, roads, utility poles or machinery were added. Existing terrain, wildlife, atmosphere, energy links, audio and scene transitions remain connected to their original systems.

## Drawing changes

- Flat facades with gabled, stepped and sloping roofs, actual open-door silhouettes and energy-responsive windows.
- Three-tier triangular trees, circular orange crowns and red polygonal branching trees; charcoal trunks.
- Shared framed cobalt panel surface used by both rooftop and ground arrays, retaining damaged assembly and energy activation.
- Angular turbine blades with a circular hub and charcoal support.
- Sawtooth and sloping-roof factory variants with chimneys and simple windows.

All renderers use the existing `adaptAssetDraw` transform wrapper for position, scale, rotation, alpha, recovery and state isolation. Recovered reference accents are separate from the existing environment palette so the atmosphere retains its established color transitions.

## Verification

`node --test tests/stage3-*.test.cjs`: 26 passing tests. Coverage includes drawing at three scales and recovery levels, all variants, finite coordinates, balanced drawing state, energy activation, independent rotor/crown motion, 100 seeded compositions, touch mapping, reset, energy balance and guided completion.

Browser checks: sketch loads; manual solar and wind drags each supplied 34% energy and initiated recovery; reset launched guided playback; playback reached 100% with the network-ready transition. Polluted, partial and restored scenes were visually inspected. Browser warning/error log was empty during these checks.
