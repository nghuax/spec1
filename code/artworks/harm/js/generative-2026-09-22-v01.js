// HARM v17 refinement. This extends the original scene; it does not replace it.
// The furnace, source geometry, UI, palette, sound mixer and completion rules
// remain the v17 originals. New transformations share the existing object pose.
const GEN_MAX_TRACES = 96;
const GEN_MAX_IMPULSES = 14;
const GEN_AIR_BAND_COUNT = 20;
let genTraces = [];
let genImpulses = [];
let genAirBands = [];
let genPreviousBurn = -Infinity;
let genTempo = 0;

// Independent seeded sampling: additions never consume the original random()
// stream, so the original system's timings and samples remain independent.
function genSample(key, salt = 0) {
  let h = (sceneSeed ^ Math.imul(salt + 1, 0x9e3779b1)) >>> 0;
  const text = String(key);
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619) >>> 0;
  h ^= h >>> 16; h = Math.imul(h, 0x7feb352d); h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function initGenerativeRefinement() {
  genTraces = [];
  artRipples = [];
  genImpulses = [];
  genAirBands = [];
  genPreviousBurn = -Infinity;
  genTempo = 0;
  const items = [...trees, ...houses, ...factories, ...poles];
  items.forEach((o, i) => {
    const key = o.id || `tree-${i}`;
    o.genKey = key;
    o.genHomeX = o.x;
    o.genHomeY = o.y;
    o.genDose = 0;
    o.genPhase = genSample(key, 10) * TWO_PI;
    // Bounded variation around the authored v17 composition, never a new layout.
    const isPole = o.motionType === 'pole';
    const dx = (genSample(key, 1) - .5) * (isPole ? 18 : 64);
    const dy = (genSample(key, 2) - .5) * (isPole ? 12 : 42);
    o.x += dx;
    o.y += dy;
    o.s *= .96 + genSample(key, 3) * .08;
    // v22: no more full-object fly-ins from screen edges. Each object unfolds
    // where it belongs, with a deterministic bias so resets still feel generative.
    o.revealDir = genSample(key, 70) < .5 ? -1 : 1;
    o.revealBiasX = (genSample(key, 71) - .5) * 10;
    o.revealBiasY = 6 + genSample(key, 72) * 10;
    o.genParts = o.appear.map((_, j) => ({
      x: (genSample(key, 20 + j * 5) - .5) * 12,
      y: (genSample(key, 21 + j * 5) - .5) * 9,
      rot: (genSample(key, 22 + j * 5) - .5) * .12,
      sx: .93 + genSample(key, 23 + j * 5) * .14,
      sy: .94 + genSample(key, 24 + j * 5) * .12
    }));
  });
  buildGenerativeAirBands();
}

// v23 — coherent orange/grey airflow field.
// These are not random speed-lines. Every reset creates a bounded family of
// long streamlines that share a common wind direction and respond to pollution.
function buildGenerativeAirBands() {
  genAirBands = [];
  for (let i = 0; i < GEN_AIR_BAND_COUNT; i++) {
    const key = `air-band-${i}`;
    const orange = genSample(key, 1) < .48;
    genAirBands.push({
      key,
      tone: orange ? 'orange' : 'grey',
      y: 105 + genSample(key, 2) * (H - 300),
      amp: 28 + genSample(key, 3) * 118,
      bend: (genSample(key, 4) - .5) * 190,
      phase: genSample(key, 5) * TWO_PI,
      speed: .045 + genSample(key, 6) * .060,
      strands: 3 + floor(genSample(key, 7) * 4),
      spread: 4.5 + genSample(key, 8) * 9.5,
      weight: .38 + genSample(key, 9) * .66,
      alpha: .62 + genSample(key, 10) * .38,
      bias: (genSample(key, 11) - .5) * 90
    });
  }
}

function airFieldBlocked(x, y) {
  // Keep the title/badge zone and the bottom instruction bar visually clean.
  return (x < 565 && y < 98) || (x > W - 350 && y < 190) || y > H - 150;
}

// v25 — a brief completion envelope. It only changes drawing, never simulation.
function completionVisualEnvelope() {
  if (!completionShown || !Number.isFinite(completionAt)) return 0;
  const age = sceneTime - completionAt;
  if (age < 0 || age > 2.35) return 0;
  const q = constrain(age / 2.35, 0, 1);
  // Fast attack, long clean release: one clear visual event instead of a permanent effect.
  const attack = smooth01(constrain(q / .16, 0, 1));
  const release = 1 - smooth01(constrain((q - .22) / .78, 0, 1));
  return attack * release;
}

function completionSmokeVisibility() {
  // Briefly opens the atmosphere so the airflow field reads at the exact 100% moment.
  return 1 - completionVisualEnvelope() * .20;
}

function drawGenerativeAirField() {
  if (!genAirBands.length) return;
  const p = pollutionN();
  const burnN = constrain(burnCount / max(1, COMPLETION_BURNS), 0, 1);
  // A faint field exists from the start; interaction makes it denser/stronger.
  const completionHit = completionVisualEnvelope();
  const field = constrain(.15 + burnN * .68 + p * .48 + (completionShown ? .10 : 0) + completionHit * .16, .15, 1);
  const visibleBands = floor(lerp(8, GEN_AIR_BAND_COUNT, field));
  const grey = lerpColor(color(206, 207, 204), color(135, 126, 116), p * .55);
  const orange = lerpColor(color(255, 121, 0), color(194, 81, 26), p * .40);

  push();
  noFill();
  for (let b = 0; b < visibleBands; b++) {
    const band = genAirBands[b];
    const ink = band.tone === 'orange' ? orange : grey;
    const baseAlpha = (band.tone === 'orange' ? 12 : 9) * band.alpha * (.55 + field * .95) * (1 + completionHit * .72);
    const strandCount = band.strands + (field > .72 && b % 3 === 0 ? 1 : 0);

    for (let strand = 0; strand < strandCount; strand++) {
      const centered = strand - (strandCount - 1) * .5;
      const strandSeed = genSample(band.key, 30 + strand);
      stroke(red(ink), green(ink), blue(ink), baseAlpha * (.72 + strandSeed * .48));
      strokeWeight(max(.34, band.weight * (.62 + strandSeed * .72)));

      let open = false;
      for (let step = 0; step <= 34; step++) {
        const u = step / 34;
        const x = -150 + u * (W + 300);
        const time = sceneTime * band.speed;
        const broad = sin(u * TWO_PI * (1.02 + genSample(band.key, 13) * .45) + band.phase + time) * band.amp;
        const curl = sin(u * TWO_PI * 2.2 + band.phase * .73 - time * 1.35) * band.amp * .20;
        const n = (noise(b * .37 + strand * .09, u * 1.45 + time * .10) - .5) * band.amp * .42;
        const machinePull = Math.exp(-sq((x - MACHINE.x) / 520)) * band.bend * (u - .42);
        const completionWarp = completionHit * Math.exp(-sq((x - MACHINE.x) / 760))
          * sin(u * PI) * (band.tone === 'orange' ? -22 : 18);
        const y = band.y + broad + curl + n + machinePull + completionWarp + band.bias * (u - .5)
          + centered * band.spread * (1 + sin(u * PI + band.phase) * .25);

        if (airFieldBlocked(x, y)) {
          if (open) { endShape(); open = false; }
          continue;
        }
        if (!open) { beginShape(); open = true; }
        curveVertex(x, y);
      }
      if (open) endShape();
    }
  }
  pop();
}

// One short, open-line transformation at 100%. The composition does not gain a new
// object; the existing air language briefly converges on the machine and releases.
function drawCompletionSurge() {
  const e = completionVisualEnvelope();
  if (e <= .001) return;
  const age = sceneTime - completionAt;
  const pose = machineRenderPose();
  const grey = lerpColor(color(226, 224, 216), color(158, 148, 136), pollutionN() * .45);
  const orange = lerpColor(color(C.orange), color(214, 86, 24), pollutionN() * .28);

  push();
  noFill();
  // Two directional families, deliberately open and asymmetrical — no ring, no frame.
  for (let side = -1; side <= 1; side += 2) {
    for (let lane = 0; lane < 6; lane++) {
      const ink = (lane + (side < 0 ? 1 : 0)) % 3 === 0 ? orange : grey;
      const alpha = (18 + lane * 3.4) * e;
      stroke(red(ink), green(ink), blue(ink), alpha);
      strokeWeight(.65 + (lane % 3) * .28 + e * .34);
      beginShape();
      const steps = 16;
      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        const x = pose.x + side * u * (W * .62 + lane * 34);
        const lift = pow(u, .72) * (86 + lane * 18);
        const bow = sin(u * PI) * (34 + lane * 7) * (side < 0 ? .62 : 1);
        const micro = sin(u * 10.5 + lane * .82 + age * 1.5) * (2.2 + lane * .22);
        const y = pose.y - 116 - lift + bow * (lane % 2 ? 1 : -1) + micro;
        if (!airFieldBlocked(x, y)) curveVertex(x, y);
      }
      endShape();
    }
  }

  // A few vertical exhaust contours make the moment legible without turning it into a burst icon.
  for (let lane = 0; lane < 4; lane++) {
    const ink = lane === 1 ? orange : grey;
    stroke(red(ink), green(ink), blue(ink), (26 - lane * 3) * e);
    strokeWeight(.8 + lane * .18);
    beginShape();
    for (let i = 0; i <= 10; i++) {
      const u = i / 10;
      const spread = (18 + lane * 14) * u;
      curveVertex(
        pose.x + sin(i * .72 + lane + age * 1.1) * spread,
        pose.y - 150 - u * (150 + lane * 34)
      );
    }
    endShape();
  }
  pop();
}

// A shared air field, driven by the real burn history. It adds a restrained
// horizontal curl to existing rising smoke; it cannot reverse its buoyancy.
function genAirFlow(x, y) {
  const a = noise(x * .0016 + (sceneSeed % 997) * .01, y * .002 + sceneTime * .025) * TWO_PI;
  let flow = sin(a) * .28;
  for (const impulse of genImpulses) {
    const dx = x - impulse.x, dy = y - impulse.y;
    const falloff = Math.exp(-(dx * dx + dy * dy) / 260000);
    const decay = Math.exp(-(sceneTime - impulse.at) * .027);
    flow += sin(dy * .010 + impulse.phase) * falloff * decay * (.22 + impulse.tempo * .54);
  }
  return constrain(flow, -1, 1);
}

function generativeObjectMotion(o) {
  if (!o.genParts) return { x: 0, y: 0, rot: 0 };
  const amount = .2 + (o.genDose || 0) * .8;
  const phase = o.genPhase || 0;
  const field = genAirFlow(o.x, o.y);
  return {
    x: field * amount * 9,
    y: sin(sceneTime * .31 + phase) * amount * 3,
    rot: field * amount * .016
  };
}

// Transform the original canopy / roof / accent drawings about their own
// centres. Trunks, body bases, chimneys and poles stay attached to their anchors.
function applyGenerativePart(o, index, q) {
  if (!o.genParts || index === 0) return;
  const isTree = o.motionType === 'tree';
  const isRoof = o.kind === 'house' && index === 1;
  const isAccent = o.kind === 'factory' && index === 1;
  if (!(isTree && index >= 1 && index <= 3) && !isRoof && !isAccent) return;
  const g = o.genParts[index];
  if (!g) return;
  const dose = o.genDose || 0;
  const wave = sin(sceneTime * (.24 + index * .035) + o.genPhase + index);
  let px = 0, py = -54;
  if (isTree) {
    const v = ((o.variant % 4) + 4) % 4;
    const centres = [
      [[-4,-120],[-3,-92],[-1,-64]],
      [[-20,-100],[9,-142],[38,-105]],
      [[0,-126],[0,-84],[0,-52]],
      [[24,-118],[-38,-90],[54,-66]]
    ];
    [px, py] = centres[v][index - 1];
  } else if (isAccent) { px = -20; py = -40; }
  const abstraction = smooth01(pollutionN()) * dose;
  const spread = (isTree ? dose * 16 : dose * 8) + abstraction * (isTree ? 32 : 18);
  const sx = (g.x + wave * (1.5 + dose * 3) + (index % 2 ? -1 : 1) * spread) * q;
  const sy = (g.y - spread * .25) * q;
  translate(px + sx, py + sy);
  rotate((g.rot + wave * dose * .025 + wave * abstraction * .18) * q);
  scale(lerp(1, g.sx + dose * .035, q), lerp(1, g.sy - dose * .04, q));
  translate(-px, -py);
}

function recordGenerativeBurn(target) {
  const gap = sceneTime - genPreviousBurn;
  genTempo = Number.isFinite(genPreviousBurn) ? constrain(1 - gap / 4.5, 0, 1) : .12;
  genPreviousBurn = sceneTime;
  const origin = machineExhaustPoint();
  const impulse = { x: origin.x, y: origin.y, at: sceneTime, tempo: genTempo,
    phase: genSample(`burn-${burnCount}`, 4) * TWO_PI };
  genImpulses.push(impulse);
  if (genImpulses.length > GEN_MAX_IMPULSES) genImpulses.shift();
  const items = [...trees, ...houses, ...factories, ...poles];
  const targetRef = target && target.ref;
  for (const o of items) {
    const focus = targetRef ? Math.exp(-dist(o.x, o.y, targetRef.x, targetRef.y) / 420) : .3;
    const local = samplePollution(o.x, o.y);
    o.genDose = constrain((o.genDose || 0) + (.012 + genTempo * .036) * (.45 + focus + local), 0, 1);
  }
  const sources = [origin];
  const activeFactories = factories.filter(f => objectReady(f));
  if (activeFactories.length) {
    const index = floor(genSample(`burn-${burnCount}`, 7) * activeFactories.length);
    sources.push(factorySmokeOrigins(activeFactories[index])[0]);
  }
  sources.forEach((source, index) => {
    if (!source || !Number.isFinite(source.x + source.y)) return;
    // A burn now leaves a small family of sibling contours instead of one line.
    // The offsets are tiny and deterministic so the result reads as airflow, not confetti.
    const siblings = index === 0 ? 3 : 2;
    for (let sibling = 0; sibling < siblings; sibling++) {
      const key = `trace-${burnCount}-${index}-${sibling}`;
      let x = source.x + (sibling - (siblings - 1) * .5) * 8;
      let y = source.y + (genSample(key, 90) - .5) * 9;
      const points = [];
      for (let i = 0; i < 27; i++) {
        if (x < 24 || x > W - 24 || y < 30) break;
        points.push([x, y]);
        const flow = genAirFlow(x, y);
        x += flow * (16 + genTempo * 28) + (genSample(key, i) - .5) * 8;
        y -= 8 + genSample(key, i + 40) * 8.5;
      }
      const mixedTone = index === 0 ? (sibling === 2 ? 'paper' : 'orange') : (sibling === 0 ? 'orange' : 'paper');
      genTraces.push({ points, at: sceneTime, tempo: genTempo, tone: mixedTone, seed: genSample(key, 99) });
    }
  });
  if (genTraces.length > GEN_MAX_TRACES) genTraces.splice(0, genTraces.length - GEN_MAX_TRACES);
}

function drawGenerativeResidue() {
  if (!genTraces.length) return;
  const p = pollutionN();
  push();
  noFill();
  for (const trace of genTraces) {
    const count = floor(min(1, (sceneTime - trace.at) / 2.0) * trace.points.length);
    if (count < 2) continue;
    const ink = trace.tone === 'orange'
      ? lerpColor(color(C.orange), color(196, 83, 28), p * .34)
      : lerpColor(color(220, 219, 214), color(137, 132, 126), p * .46);
    const strands = 5 + (trace.tempo > .55 ? 2 : 0);
    const seed = trace.seed || .5;

    for (let strand = 0; strand < strands; strand++) {
      const centered = strand - (strands - 1) * .5;
      const strandAlpha = (7 + trace.tempo * 11) * (.72 + genSample(`res-${seed}`, strand) * .52);
      stroke(red(ink), green(ink), blue(ink), strandAlpha);
      strokeWeight(.42 + trace.tempo * .42 + (strand % 3 === 0 ? .16 : 0));
      let open = false;
      for (let i = 0; i < count; i++) {
        const [x, y] = trace.points[i];
        if (airFieldBlocked(x, y)) {
          if (open) { endShape(); open = false; }
          continue;
        }
        if (!open) { beginShape(); open = true; }
        const fan = centered * (3.6 + i * .17);
        const wobble = sin(i * .34 + trace.at * .8 + strand * .73) * (1.4 + abs(centered) * .45);
        curveVertex(x + fan, y + wobble + centered * 1.8);
      }
      if (open) endShape();
    }
  }
  pop();
}

function applyGenerativeSmokeShape(s) {
  const age = constrain(s.age / max(.001, s.life), 0, 1);
  const flow = s.cachedGenerative || 0;
  // Original polygon families retained; only their proportions stretch with air.
  scale(1 + abs(flow) * age * (.20 + pollutionN() * .65), 1 - age * (.08 + pollutionN() * .16));
}
