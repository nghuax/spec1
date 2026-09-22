// ------------------------------------------------------------
// CONTROLLED WORLD
// Final spacing pass: houses and trees are distributed a little wider and smaller
// so the stage feels more open around the machine, subtitle, and right-side controls.
// ------------------------------------------------------------

function buildWorld() {
  // OPEN ABSTRACT LAYOUT
  // Three visual bands keep factories, infrastructure and domestic elements
  // from colliding while leaving a dedicated clear zone around the machine.
  houses = [
    makeHouse('H0', 190, 800, 0.483, -.012, 0, 0.20),
    makeHouse('H1', 420, 872, 0.425, .010, 1, 0.75),
    makeHouse('H2', 1015, 778, 0.471, .004, 2, 1.18),
    makeHouse('H3', 1215, 886, 0.414, -.014, 3, 1.62),
    makeHouse('H4', 1425, 770, 0.448, .012, 0, 2.05),
    makeHouse('H5', 1630, 878, 0.414, -.010, 1, 2.42),
    makeHouse('H6', 1810, 772, 0.391, .010, 2, 2.78)
  ];

  trees = [
    makeTree(82, 648, 0.437, -.020, 0, .05),
    makeTree(318, 636, 0.380, .010, 2, .42),
    makeTree(526, 852, 0.391, -.014, 1, .83),
    makeTree(882, 882, 0.368, .014, 3, 1.12),
    makeTree(1078, 604, 0.391, .020, 1, 1.48),
    makeTree(1266, 670, 0.345, .008, 2, 1.70),
    makeTree(1492, 604, 0.402, -.014, 0, 1.92),
    makeTree(1698, 646, 0.356, -.016, 3, 2.10),
    makeTree(1860, 896, 0.345, .010, 1, 2.35)
  ];

  poles = [
    makePole('P0', 500, 688, 0.473, -.008, .56),
    makePole('P1', 930, 650, 0.517, -.012, 1.42),
    makePole('P2', 1350, 845, 0.473, .010, 2.18),
    makePole('P3', 1695, 748, 0.506, -.014, 2.84)
  ];

  factories = [
    makeFactory('F0', 225, 486, 0.310, 0, -.010, .32),
    makeFactory('F05', 520, 442, 0.287, 2, .010, .94),
    makeFactory('F1', 980, 430, 0.425, 1, -.018, 1.55),
    makeFactory('F2', 1260, 512, 0.345, 0, .014, 2.08),
    makeFactory('F3', 1540, 428, 0.356, 2, -.008, 2.54),
    makeFactory('F4', 1785, 520, 0.287, 1, .008, 3.00)
  ];

  // One or two factories occupy lower pockets, chosen once for each seed.
  // These slots avoid the furnace, domestic row and right-side controls.
  const lowerSlots = [
    {id:'F0', x:190, y:655}, {id:'F2', x:1170, y:710},
    {id:'F3', x:1550, y:720}, {id:'F4', x:1780, y:665}
  ].sort((a,b) => genSample(a.id,91)-genSample(b.id,91));
  const lowerCount = genSample('lower-count',92) < .5 ? 1 : 2;
  for (const slot of lowerSlots.slice(0,lowerCount)) {
    const f = factories.find(f=>f.id===slot.id);
    f.x=slot.x+(genSample(f.id,93)-.5)*24;
    f.y=slot.y+(genSample(f.id,94)-.5)*24;
    f.lowerPlacement=true;
  }

  // Flat 2D pass: no grey ground/island shapes beneath houses or factories.
  patches = [];

  demandNodes = [
    ...houses.map(ref => ({ id: ref.id, type: 'house', ref })),
    ...factories.map(ref => ({ id: ref.id, type: 'factory', ref }))
  ];

  worldDrawOrder = [];
  for (const t of trees) worldDrawOrder.push({ type: 'tree', ref: t, y: t.y });
  for (const h of houses) worldDrawOrder.push({ type: 'house', ref: h, y: h.y });
  for (const po of poles) worldDrawOrder.push({ type: 'pole', ref: po, y: po.y });
  for (const f of factories) worldDrawOrder.push({ type: 'factory', ref: f, y: f.y });
  worldDrawOrder.push({ type: 'machine', ref: null, y: MACHINE.y });
  worldDrawOrder.sort((a, b) => a.y - b.y);
}

function makeBaseObject(x, y, s, rot, birth, partCount) {
  const appear = [];
  for (let i = 0; i < partCount; i++) {
    // The old build scattered pieces 40–140 px away and made them fly back in.
    // Keep only tiny per-part offsets; render-2026-09-22-v01.js now unfolds them locally.
    const a = random(TWO_PI);
    const d = random(6, 22);
    appear.push({
      x: cos(a) * d,
      y: sin(a) * d * .55,
      r: random(-.10, .10),
      sc: random(.82, .94),
      delay: i * random(.045, .085) + random(0, .10)
    });
  }
  return {
    x, y, s, rot, birth,
    seed: random(1000),
    motionSeedX: random(1000),
    motionSeedY: random(1000),
    motionSpeedX: random(.075, .135),
    motionSpeedY: random(.064, .118),
    motionAmp: random(.86, 1.12),
    motionPhase: random(TWO_PI),
    revealMode: 'fold',
    revealDir: random() < .5 ? -1 : 1,
    formDuration: random(1.15, 1.65),
    appear,
    activationAt: birth,
    locked: false,
    unlockPulse: 0,
    detached: new Array(partCount).fill(false),
    damageTriggered: new Array(partCount).fill(false),
    exposure: 0,
    soot: 0,
    stress: 0,
    localAir: 0
  };
}

function makeHouse(id, x, y, s, rot, variant, birth) {
  return Object.assign(makeBaseObject(x, y, s, rot, birth, 6), {
    id, variant, kind: 'house', motionType: 'house',
    locked: true,
    activationAt: Infinity,
    revealBias: birth,
    charge: 0,
    powerPulse: 0,
    demandFlash: 0,
    demandReady: 0,
    demandQueuedAt: -99,
    lastDemandAt: -99,
    motionAmp: random(1.08, 1.34),
    motionSpeedX: random(.082, .145),
    motionSpeedY: random(.072, .128),
    housePuffTimer: random(1.1, 2.6),
    smokeBias: random(.92, 1.18),
    damageThresholds: [.98, .80, .50, .60, .72, .90]
  });
}

function makeTree(x, y, s, rot, variant, birth) {
  return Object.assign(makeBaseObject(x, y, s, rot, birth, 5), {
    variant, motionType: 'tree',
    motionAmp: random(1.12, 1.42),
    motionSpeedX: random(.085, .152),
    motionSpeedY: random(.074, .132),
    health: 1,
    damageThresholds: [.99, .48, .59, .72, .86]
  });
}

function makePole(id, x, y, s, rot, birth) {
  return Object.assign(makeBaseObject(x, y, s, rot, birth, 5), {
    id, motionType: 'pole',
    energy: 0,
    lastDemandAt: -99,
    damageThresholds: [.99, .88, .74, .80, .93]
  });
}

function makeFactory(id, x, y, s, variant, rot, birth) {
  return Object.assign(makeBaseObject(x, y, s, rot, birth, 7), {
    id, variant, kind: 'factory', motionType: 'factory',
    locked: true,
    activationAt: Infinity,
    revealBias: birth,
    energy: 0,
    activity: 0,
    demandFlash: 0,
    demandReady: 0,
    demandQueuedAt: -99,
    powerPulse: 0,
    lastDemandAt: -99,
    soot: 0,
    smokeBias: random(1.00, 1.32),
    chimneyPhase: random(TWO_PI),
    startupBurst: 0,
    emissionClock: random(10),
    // Each chimney now has its own cadence instead of frame-random popping.
    puffTimers: [random(.18, .95), random(.48, 1.25)],
    dustTimer: random(.65, 1.65),
    plumeSeed: random(1000),
    plumeBias: random(-.08, .08),
    damageThresholds: [.99, .92, .66, .76, .86, .94, .82]
  });
}

function formationProgress(o, partIndex = 0) {
  if (!o || o.locked || !Number.isFinite(o.activationAt)) return 0;
  if (o.entryDX !== undefined) return smooth01(constrain((sceneTime-o.activationAt)/.65,0,1));
  const a = o.appear[partIndex] || { delay: 0 };
  const t = (sceneTime - o.activationAt - a.delay) / o.formDuration;
  return easeOutCubic(constrain(t, 0, 1));
}

function objectReady(o) {
  return !o.locked && formationProgress(o, 0) > .94 && objectArrival(o).progress > .94;
}

function findArchitectureById(id) {
  return houses.find(h => h.id === id) || factories.find(f => f.id === id) || null;
}

function unlockArchitecture(o, delay = 0) {
  if (!o || !o.locked) return false;
  o.locked = false;
  o.activationAt = sceneTime + delay;
  o.unlockPulse = 1;
  return true;
}

function unlockArchitectureForBurn(count) {
  const wave = ARCHITECTURE_WAVES[count - 1];
  if (!wave) return null;

  let firstNode = null;
  let unlocked = 0;
  let factoriesUnlocked = 0;
  for (let i = 0; i < wave.length; i++) {
    const o = findArchitectureById(wave[i]);
    if (!unlockArchitecture(o, i * .16)) continue;
    unlocked++;
    const type = houses.includes(o) ? 'house' : 'factory';
    if (type === 'factory') factoriesUnlocked++;
    if (!firstNode) firstNode = { id: o.id, type, ref: o };
  }

  if (unlocked > 0) {
    setStatus(`BURN ${nf(count, 2)} · ${unlocked} STRUCTURE${unlocked > 1 ? 'S' : ''} COMING ONLINE`, 2.8, 2);
  }

  // Factory construction gets one quiet Rice background bed plus a soft
  // industrial accent. Both stay under the visual formation rather than acting as hits.
  if (factoriesUnlocked > 0 && window.HarmSound) {
    window.HarmSound.cues.factoryForm(factoriesUnlocked);
  }
  return firstNode;
}


// ------------------------------------------------------------
// LOCAL AIR FIELD + ABSTRACT AMBIENT FRAGMENTS
// ------------------------------------------------------------

function initPollutionField() {
  pollutionField = new Array(FIELD_COLS * FIELD_ROWS).fill(0);
  pollutionFieldNext = new Array(FIELD_COLS * FIELD_ROWS).fill(0);
}

function fieldIndex(cx, cy) {
  return constrain(cy, 0, FIELD_ROWS - 1) * FIELD_COLS + constrain(cx, 0, FIELD_COLS - 1);
}

function depositPollution(x, y, amount) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || amount <= 0) return;
  const fx = constrain(x / W * FIELD_COLS, 0, FIELD_COLS - .001);
  const fy = constrain(y / H * FIELD_ROWS, 0, FIELD_ROWS - .001);
  const cx = floor(fx);
  const cy = floor(fy);
  const tx = fx - cx;
  const ty = fy - cy;
  const targets = [
    [cx, cy, (1 - tx) * (1 - ty)],
    [min(FIELD_COLS - 1, cx + 1), cy, tx * (1 - ty)],
    [cx, min(FIELD_ROWS - 1, cy + 1), (1 - tx) * ty],
    [min(FIELD_COLS - 1, cx + 1), min(FIELD_ROWS - 1, cy + 1), tx * ty]
  ];
  for (const [ix, iy, w] of targets) {
    const idx = fieldIndex(ix, iy);
    pollutionField[idx] = constrain(pollutionField[idx] + amount * w, 0, 1);
  }
}

function samplePollution(x, y) {
  if (!pollutionField.length) return 0;
  const fx = constrain(x / W * (FIELD_COLS - 1), 0, FIELD_COLS - 1);
  const fy = constrain(y / H * (FIELD_ROWS - 1), 0, FIELD_ROWS - 1);
  const x0 = floor(fx), y0 = floor(fy);
  const x1 = min(FIELD_COLS - 1, x0 + 1), y1 = min(FIELD_ROWS - 1, y0 + 1);
  const tx = fx - x0, ty = fy - y0;
  const a = lerp(pollutionField[fieldIndex(x0, y0)], pollutionField[fieldIndex(x1, y0)], tx);
  const b = lerp(pollutionField[fieldIndex(x0, y1)], pollutionField[fieldIndex(x1, y1)], tx);
  return lerp(a, b, ty);
}

function updatePollutionField(dt) {
  if (!pollutionField.length) return;
  const diffuse = constrain(FIELD_DIFFUSION * dt * 60, 0, .18);
  const decay = FIELD_DECAY * dt * 60;
  for (let y = 0; y < FIELD_ROWS; y++) {
    for (let x = 0; x < FIELD_COLS; x++) {
      const idx = fieldIndex(x, y);
      const center = pollutionField[idx];
      let sum = 0;
      let count = 0;
      if (x > 0) { sum += pollutionField[fieldIndex(x - 1, y)]; count++; }
      if (x < FIELD_COLS - 1) { sum += pollutionField[fieldIndex(x + 1, y)]; count++; }
      if (y > 0) { sum += pollutionField[fieldIndex(x, y - 1)]; count++; }
      if (y < FIELD_ROWS - 1) { sum += pollutionField[fieldIndex(x, y + 1)]; count++; }
      const neighbor = count ? sum / count : center;
      // Pollution diffuses and receives a small buoyant contribution from the cell below.
      // Smaller y is higher on screen, so sampling y + 1 produces an actual upward bias.
      const below = y < FIELD_ROWS - 1 ? pollutionField[fieldIndex(x, y + 1)] : center;
      const buoyancy = max(0, below - center) * .010 * dt * 60;
      const mixed = lerp(center, neighbor, diffuse) + buoyancy;
      pollutionFieldNext[idx] = constrain(mixed - decay, 0, 1);
    }
  }
  const swap = pollutionField;
  pollutionField = pollutionFieldNext;
  pollutionFieldNext = swap;
}

function getColumnPollution(x) {
  if (!pollutionField.length) return 0;
  const cx = constrain(floor(x / W * FIELD_COLS), 0, FIELD_COLS - 1);
  let sum = 0;
  let wsum = 0;
  for (let y = 0; y < FIELD_ROWS; y++) {
    const weight = lerp(1.8, .55, y / max(1, FIELD_ROWS - 1));
    sum += pollutionField[fieldIndex(cx, y)] * weight;
    wsum += weight;
  }
  return wsum ? sum / wsum : 0;
}

function getCeilingDepthAtX(x, layer = 0) {
  const p = pollution / 100;
  if (p < .08) return 0;
  const local = getColumnPollution(x);
  const sourceBias = local * (90 + p * 155);
  const broad = smokeCeiling * (0.56 + layer * .055);
  const n = noise(x * .0017 + layer * 13.7, sceneTime * .014 + layer * 3.1);
  const wave = sin(x * .0048 + layer * .76 + sceneTime * .028) * (8 + p * 18);
  return broad + sourceBias + n * (28 + p * 76) + wave;
}

function ambientFragmentSpawnValid(x, y) {
  const inAirHudZone = x > W - 330 && y < 170;
  const inControlZone = x > W - 215 && y > H - 390;
  const inSubtitleZone = x > 420 && x < 1510 && y > H - 170;
  return !(inAirHudZone || inControlZone || inSubtitleZone);
}

function buildAmbientFragments() {
  ambientFragments = [];
  let guard = 0;
  while (ambientFragments.length < MAX_AMBIENT_FRAGMENTS && guard < MAX_AMBIENT_FRAGMENTS * 24) {
    guard++;
    const x = random(20, W - 20);
    const y = random(55, H - 40);
    if (!ambientFragmentSpawnValid(x, y)) continue;
    ambientFragments.push({
      x,
      y,
      vx: random(-.16, .16),
      vy: random(-.11, .11),
      size: random(2.8, 9.5),
      shape: floor(random(5)),
      seed: random(1000),
      rot: random(TWO_PI),
      rv: random(-.012, .012),
      tone: random(),
      mode: floor(random(4)),
      phase: random(TWO_PI),
      speedBias: random(.68, 1.22),
      hero: random() < .06,
      depth: random() < .72 ? 0 : 1
    });
  }
}

function updateAmbientFragments(dt) {
  const mouseSpeed = dist(mouseX, mouseY, pmouseX, pmouseY);
  updateArtRipples(dt);
  for (const a of ambientFragments) {
    applyArtRipple(a, dt);
    const local = samplePollution(a.x, a.y);
    const s = a.speedBias || 1;
    const n = noise(a.seed, sceneTime * .17 * s) - .5;
    const n2 = noise(a.seed + 91, sceneTime * .15 * s) - .5;
    a.vx += n * .008 * dt * 60;
    a.vy += n2 * .007 * dt * 60;

    // Four movement personalities keep the particles from reading as one system.
    if (a.mode === 1) {
      a.vx += cos(sceneTime * .9 * s + a.phase) * .004 * dt * 60;
      a.vy += sin(sceneTime * .76 * s + a.phase) * .0036 * dt * 60;
    } else if (a.mode === 2) {
      a.vx += sin(sceneTime * 1.25 * s + a.y * .012 + a.phase) * .0038 * dt * 60;
      a.vy += cos(sceneTime * .95 * s + a.x * .009 + a.phase) * .003 * dt * 60;
    } else if (a.mode === 3) {
      const turn = sin(sceneTime * .62 * s + a.phase);
      a.vx += turn * .006 * dt * 60;
      a.vy -= turn * .0028 * dt * 60;
    }

    const dx = a.x - mouseX;
    const dy = a.y - mouseY;
    const dd = sqrt(dx * dx + dy * dy);
    if (dd < 150 && dd > 1 && mouseSpeed > 1.2) {
      const force = (1 - dd / 150) * min(1.2, mouseSpeed / 24);
      a.vx += dx / dd * force * .10;
      a.vy += dy / dd * force * .10;
    }

    if (local > .36) a.vy += local * .0032 * dt * 60;
    a.x += a.vx * dt * 60 * s;
    a.y += a.vy * dt * 60 * s;
    a.rot += a.rv * dt * 60 * s;
    a.vx *= .994;
    a.vy *= .994;

    if (a.x < -36) a.x = W + 36;
    else if (a.x > W + 36) a.x = -36;
    if (a.y > H + 42) { a.y = random(18, 150); a.vy *= .22; }
    if (a.y < -42) a.y = H + 28;
  }
}

function drawAmbientFragments(frontLayer) {
  for (const a of ambientFragments) {
    if ((frontLayer ? 1 : 0) !== a.depth) continue;
    const local = samplePollution(a.x, a.y);
    const speed = sqrt(a.vx * a.vx + a.vy * a.vy);
    push();
    translate(a.x, a.y);
    rotate(a.rot);

    let c;
    if (local > .34) c = color(151, 143, 134, 62 + local * 38);
    else if (a.tone < .22) c = color(47, 57, 255, a.hero ? 92 : 65);
    else if (a.tone < .40) c = color(255, 123, 0, a.hero ? 86 : 59);
    else if (a.tone < .58) c = color(182, 242, 48, a.hero ? 60 : 38);
    else if (a.tone < .72) c = color(255, 26, 18, a.hero ? 58 : 36);
    else c = color(11, 11, 16, a.hero ? 48 : 30);

    // Velocity streak: turns random drift into a readable kinetic gesture.
    const trail = constrain(speed * 34, 3, a.hero ? 36 : 20);
    stroke(red(c), green(c), blue(c), alpha(c) * .38);
    strokeWeight(a.hero ? 1.7 : 1.0);
    line(-trail, 0, 0, 0);
    noStroke();
    fill(c);
    const sz = a.size * (a.hero ? 1.45 : 1);
    drawShard(a.shape, sz);

    if (a.hero) {
      fill(red(c), green(c), blue(c), alpha(c) * .34);
      rotate(.42);
      drawShard((a.shape + 2) % 5, sz * .55);
    }
    pop();
  }
}

// ------------------------------------------------------------
// KINETIC ART RIBBONS — sparse, fast-moving geometric gestures
// ------------------------------------------------------------
function drawKineticRibbons(frontLayer = false) {
  const count = frontLayer ? 3 : 5;
  push();
  noFill();
  for (let i = 0; i < count; i++) {
    const seed = (sceneSeed % 9973) * .001 + i * 17.31 + (frontLayer ? 90 : 0);
    const speed = .22 + (i % 4) * .045;
    const t = sceneTime * speed + seed;
    const baseX = ((noise(seed, t * .12) * (W + 520) + t * 145) % (W + 520)) - 260;
    const baseY = 130 + noise(seed + 21.4, t * .16) * (H - 260);
    const len = 36 + noise(seed + 42.8, t * .22) * (frontLayer ? 92 : 136);
    const ang = -0.75 + noise(seed + 75.1, t * .19) * 1.5;
    const palette = i % 4;
    let cc = palette === 0 ? color(47,57,255) : palette === 1 ? color(255,123,0) : palette === 2 ? color(182,242,48) : color(255,26,18);
    const aa = frontLayer ? 42 : 24;
    stroke(red(cc), green(cc), blue(cc), aa);
    strokeWeight(frontLayer ? 2.0 : 1.4);
    line(baseX, baseY, baseX + cos(ang) * len, baseY + sin(ang) * len);
    noStroke();
    fill(red(cc), green(cc), blue(cc), frontLayer ? 72 : 42);
    push();
    translate(baseX + cos(ang) * len, baseY + sin(ang) * len);
    rotate(ang + sceneTime * .18 * (i % 2 ? 1 : -1));
    if (i % 3 === 0) diamond(0, 0, frontLayer ? 7 : 5);
    else polygon([[-7,-3],[7,0],[-5,4]]);
    pop();
  }
  pop();
}

// ------------------------------------------------------------
// MAIN LOOP
// ------------------------------------------------------------

function draw() {
  const dt = min(deltaTime / 1000, .05);
  sceneTime += dt;

  updatePressure(dt);
  updateHover();
  updateCoal(dt);
  updateFragments(dt);
  updateDemandSignals(dt);
  updateEnergy(dt);
  updateSmoke(dt);
  updateCarbon(dt);
  updateAsh(dt);
  updateDebris(dt);
  updateDamageWaste(dt);
  updatePollutionField(dt);
  updateAmbientFragments(dt);
  updateWorld(dt);
  updateGlobal(dt);

  // Audio-only environmental milestones. This reads the existing pollution value
  // without changing animation timing, physics, particles or visual state.
  if (window.HarmSound && typeof window.HarmSound.setPollutionLevel === 'function') {
    window.HarmSound.setPollutionLevel(pollution / 100);
  }

  drawBackdrop();
  drawGraphicField();
  drawGenerativeAirField();
  drawGenerativeResidue();
  drawArtRipples();
  drawKineticRibbons(false);
  drawSmokeCeiling();
  drawStains();
  drawAmbientFragments(false);
  drawCarbon(false);
  drawSmoke(false);
  drawPowerGridCables();
  drawWorldSorted();
  drawDemandSignals();
  drawEnergy();
  drawAsh();
  drawCoal();
  drawFragments();
  drawDebris();
  drawDamageWaste();
  drawAmbientFragments(true);
  drawKineticRibbons(true);
  drawCarbon(true);
  drawSmoke(true);
  drawAtmosphereVeil();
  drawCompletionSurge();
  drawPressureWake();
  drawHUD();
  updateCompletion();
  image(grainLayer, 0, 0);
  if (infoOpen) drawInformationOverlay();
}

// ------------------------------------------------------------
// INTERACTION / DEMAND
// ------------------------------------------------------------

function updateHover() {
  if (infoOpen || pressure.holding) {
    hoveredCoal = -1;
    hoveredNode = null;
    hoverStarted = 0;
    return;
  }
  hoveredCoal = findCoalAt(mouseX, mouseY);

  // Coal drag is a direct interaction. It must not accidentally create demand.
  if (dragState) {
    hoveredNode = null;
    hoverStarted = 0;
    return;
  }

  const n = findDemandNodeAt(mouseX, mouseY);
  if (!n) {
    hoveredNode = null;
    hoverStarted = 0;
    return;
  }

  if (!hoveredNode || hoveredNode.id !== n.id) {
    hoveredNode = n;
    hoverStarted = sceneTime;
    return;
  }

  if (sceneTime - hoverStarted >= DEMAND_HOLD && sceneTime - n.ref.lastDemandAt >= DEMAND_COOLDOWN) {
    n.ref.lastDemandAt = sceneTime;
    hoverStarted = sceneTime + .22;
    requestDemand(n);
  }
}

function findDemandNodeAt(mx, my) {
  let best = null;
  let bestD = Infinity;

  for (const n of demandNodes) {
    if (!objectReady(n.ref)) continue;
    const p = nodePoint(n);
    const r = n.type === 'factory' ? 105 * n.ref.s : n.type === 'house' ? 82 * n.ref.s : 68 * n.ref.s;
    const d = dist(mx, my, p.x, p.y);
    if (d < r && d < bestD) {
      best = n;
      bestD = d;
    }
  }
  return best;
}

function nodePoint(n) {
  const r = n.ref;
  if (n.type === 'house') return localToWorld(r, 0, -46);
  if (n.type === 'pole') return localToWorld(r, 0, -128);
  return localToWorld(r, -34, -42);
}

function requestDemand(node) {
  if (!node || !node.ref || node.ref.demandReady > .1) return;
  if (demandSignals.some(s => s.node && s.node.id === node.id)) return;

  // Hover demand is intentionally silent. The click recording is reserved for
  // real pointer presses, which keeps the interaction rhythm predictable.

  node.ref.demandFlash = 1;
  const a = nodePoint(node);
  const b = machineDemandPoint();
  demandSignals.push({
    node,
    sx: a.x, sy: a.y,
    ex: b.x, ey: b.y,
    x: a.x, y: a.y,
    t: 0,
    speed: random(.020, .029),
    phase: random(TWO_PI),
    bend: random(-1, 1),
    fragments: Array.from({ length: 3 + floor(random(3)) }, () => ({
      phase: random(TWO_PI),
      lag: random(.04, .18),
      size: random(3, 8)
    }))
  });
  setStatus('ENERGY DEMAND DETECTED · SUPPLYING IT WILL RAISE AIR LOAD', 2.4, 2);
}

function updateDemandSignals(dt) {
  for (let i = demandSignals.length - 1; i >= 0; i--) {
    const s = demandSignals[i];
    s.t += s.speed * dt * 60;
    const q = ease(constrain(s.t, 0, 1));
    const bend = sin(q * PI) * (42 + abs(s.bend) * 36);
    s.x = lerp(s.sx, s.ex, q) + bend * s.bend;
    s.y = lerp(s.sy, s.ey, q) - bend * .55;
    if (s.t >= 1) {
      queueDemand(s.node);
      demandSignals.splice(i, 1);
    }
  }
}


function queueDemand(node) {
  if (!node || !node.ref) return;
  const existing = demandQueue.find(d => d && d.id === node.id);
  if (!existing) demandQueue.push(node);
  node.ref.demandReady = 1;
  node.ref.demandQueuedAt = sceneTime;
  node.ref.demandFlash = max(node.ref.demandFlash, .55);
  setStatus('DEMAND IS QUEUED · MORE POWER NOW ALSO MEANS MORE POLLUTION LATER', 2.8, 2);
}

function updateDemandQueue() {
  for (let i = demandQueue.length - 1; i >= 0; i--) {
    const n = demandQueue[i];
    if (!n || !n.ref || sceneTime - n.ref.demandQueuedAt > DEMAND_LIFETIME) {
      if (n && n.ref) n.ref.demandReady = 0;
      demandQueue.splice(i, 1);
    }
  }
}

function consumeDemandTarget() {
  updateDemandQueue();
  while (demandQueue.length) {
    const node = demandQueue.shift();
    if (!node || !node.ref) continue;
    if (sceneTime - node.ref.demandQueuedAt > DEMAND_LIFETIME) {
      node.ref.demandReady = 0;
      continue;
    }
    node.ref.demandReady = 0;
    return node;
  }

  // If the user acts while the orange demand fragment is still travelling,
  // honor that intent instead of sending the coal to a random load.
  if (demandSignals.length) {
    const signal = demandSignals.pop();
    if (signal && signal.node && signal.node.ref) {
      signal.node.ref.demandReady = 0;
      return signal.node;
    }
  }
  return null;
}

// ------------------------------------------------------------
