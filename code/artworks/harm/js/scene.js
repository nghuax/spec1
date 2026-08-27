// ------------------------------------------------------------
// CONTROLLED WORLD
// ------------------------------------------------------------

function buildWorld() {
  houses = [
    makeHouse('H0', 362, 742, .50, -.012, 0, 0.20),
    makeHouse('H1', 652, 904, .49, .012, 1, 0.75),
    makeHouse('H2', 896, 714, .56, .004, 2, 1.18),
    makeHouse('H3', 1118, 884, .51, -.016, 3, 1.62),
    makeHouse('H4', 1334, 790, .49, .014, 0, 2.05),
    makeHouse('H5', 1560, 918, .52, -.010, 1, 2.42),
    makeHouse('H6', 1768, 792, .47, .012, 2, 2.78)
  ];

  trees = [
    makeTree(138, 828, .66, -.022, 0, .05),
    makeTree(286, 666, .34, .010, 2, .42),
    makeTree(585, 956, .48, -.016, 1, .83),
    makeTree(790, 934, .49, .018, 2, 1.12),
    makeTree(958, 622, .38, .024, 1, 1.48),
    makeTree(1192, 930, .50, -.016, 0, 1.78),
    makeTree(1338, 646, .43, -.020, 2, 2.05),
    makeTree(1452, 958, .52, .010, 1, 2.35),
    makeTree(1616, 664, .45, -.012, 0, 2.62),
    makeTree(1836, 902, .44, .016, 2, 2.92),
    makeTree(1496, 650, .32, .008, 1, 3.18)
  ];

  poles = [
    makePole('P0', 548, 760, .48, -.008, .56),
    makePole('P1', 988, 724, .54, -.012, 1.42),
    makePole('P2', 1380, 842, .47, .010, 2.18),
    makePole('P3', 1702, 812, .52, -.016, 2.84)
  ];

  factories = [
    makeFactory('F0', 248, 586, .23, 1, -.010, .32),
    makeFactory('F05', 726, 584, .22, 0, .010, .94),
    makeFactory('F1', 1228, 500, .55, 2, -.018, 1.55),
    makeFactory('F2', 1528, 442, .48, 1, .014, 2.08),
    makeFactory('F3', 1466, 716, .28, 0, -.008, 2.54),
    makeFactory('F4', 1778, 620, .26, 1, .008, 3.00)
  ];

  // Ground patches are derived from each building's real baseline instead of
  // manually guessed Y values. This keeps every house/factory physically planted
  // on its island even when scale changes.
  const housePatchSpecs = [
    { w: 144, r: -.01 }, { w: 154, r: .01 }, { w: 144, r: 0 },
    { w: 168, r: -.02 }, { w: 150, r: .01 }, { w: 174, r: .02 },
    { w: 148, r: .01 }
  ];
  const factoryPatchSpecs = [
    { w: 86, r: 0 }, { w: 96, r: 0 }, { w: 226, r: -.03 },
    { w: 202, r: .02 }, { w: 110, r: -.01 }, { w: 96, r: .01 }
  ];

  patches = [
    ...houses.map((h, i) => ({
      ownerId: h.id,
      ownerType: 'house',
      x: h.x,
      // groundPatch's top edge sits ~23 px above its origin; +18 gives a
      // deliberate 5 px overlap with the house baseline so no dark gap appears.
      y: h.y + 18,
      w: housePatchSpecs[i].w,
      r: housePatchSpecs[i].r
    })),
    ...factories.map((f, i) => ({
      ownerId: f.id,
      ownerType: 'factory',
      x: f.x,
      // Factory base ends at local y=80, so convert that baseline by scale and
      // overlap it with the patch by 6 px.
      y: f.y + 80 * f.s + 17,
      w: factoryPatchSpecs[i].w,
      r: factoryPatchSpecs[i].r
    }))
  ];

  // Only real electricity consumers create demand.
  // Poles are infrastructure: they conduct/react, but never ask for coal themselves.
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
    const a = random(TWO_PI);
    const d = random(42, 142);
    appear.push({
      x: cos(a) * d,
      y: sin(a) * d * .72 - random(14, 48),
      r: random(-.82, .82),
      sc: random(.48, .84),
      delay: random(0, .95)
    });
  }
  return {
    x, y, s, rot, birth,
    seed: random(1000),
    formDuration: random(2.0, 3.25),
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
    id, variant, kind: 'house',
    locked: true,
    activationAt: Infinity,
    revealBias: birth,
    charge: 0,
    powerPulse: 0,
    demandFlash: 0,
    demandReady: 0,
    demandQueuedAt: -99,
    lastDemandAt: -99,
    housePuffTimer: random(1.1, 2.6),
    smokeBias: random(.92, 1.18),
    damageThresholds: [.98, .80, .50, .60, .72, .90]
  });
}

function makeTree(x, y, s, rot, variant, birth) {
  return Object.assign(makeBaseObject(x, y, s, rot, birth, 5), {
    variant,
    health: 1,
    damageThresholds: [.99, .48, .59, .72, .86]
  });
}

function makePole(id, x, y, s, rot, birth) {
  return Object.assign(makeBaseObject(x, y, s, rot, birth, 5), {
    id,
    energy: 0,
    lastDemandAt: -99,
    damageThresholds: [.99, .88, .74, .80, .93]
  });
}

function makeFactory(id, x, y, s, variant, rot, birth) {
  return Object.assign(makeBaseObject(x, y, s, rot, birth, 7), {
    id, variant, kind: 'factory',
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
  const a = o.appear[partIndex] || { delay: 0 };
  const t = (sceneTime - o.activationAt - a.delay) / o.formDuration;
  return easeOutCubic(constrain(t, 0, 1));
}

function objectReady(o) {
  return !o.locked && formationProgress(o, 0) > .94;
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
    setStatus(`BURN ${nf(count, 2)} · ${unlocked} STRUCTURE${unlocked > 1 ? 'S' : ''} ARE FORMING`, 2.8);
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

function buildAmbientFragments() {
  ambientFragments = [];
  for (let i = 0; i < MAX_AMBIENT_FRAGMENTS; i++) {
    ambientFragments.push({
      x: random(20, W - 20),
      y: random(55, H - 40),
      vx: random(-.08, .08),
      vy: random(-.05, .05),
      size: random(2.5, 9.5),
      shape: floor(random(5)),
      seed: random(1000),
      rot: random(TWO_PI),
      rv: random(-.006, .006),
      tone: random(),
      depth: random() < .68 ? 0 : 1
    });
  }
}

function updateAmbientFragments(dt) {
  const mouseSpeed = dist(mouseX, mouseY, pmouseX, pmouseY);
  for (const a of ambientFragments) {
    const local = samplePollution(a.x, a.y);
    const n = noise(a.seed, sceneTime * .08) - .5;
    a.vx += n * .004 * dt * 60;
    a.vy += (noise(a.seed + 91, sceneTime * .08) - .5) * .004 * dt * 60;

    const dx = a.x - mouseX;
    const dy = a.y - mouseY;
    const dd = sqrt(dx * dx + dy * dy);
    if (dd < 125 && dd > 1 && mouseSpeed > 1.5) {
      const force = (1 - dd / 125) * min(1, mouseSpeed / 28);
      a.vx += dx / dd * force * .10;
      a.vy += dy / dd * force * .10;
    }

    if (local > .36) a.vy += local * .0032 * dt * 60;
    a.x += a.vx * dt * 60;
    a.y += a.vy * dt * 60;
    a.rot += a.rv * dt * 60;
    a.vx *= .996;
    a.vy *= .996;

    if (a.x < -20) a.x = W + 20;
    else if (a.x > W + 20) a.x = -20;
    if (a.y > H + 30) { a.y = random(20, 130); a.vy *= .2; }
    if (a.y < -30) a.y = H + 20;
  }
}

function drawAmbientFragments(frontLayer) {
  noStroke();
  for (const a of ambientFragments) {
    if ((frontLayer ? 1 : 0) !== a.depth) continue;
    const local = samplePollution(a.x, a.y);
    push();
    translate(a.x, a.y);
    rotate(a.rot);
    if (local > .34) fill(54, 55, 61, 90 + local * 80);
    else if (a.tone < .22) fill(46, 51, 245, 55);
    else if (a.tone < .34) fill(255, 122, 26, 45);
    else if (a.tone < .48) fill(180, 242, 42, 38);
    else fill(8, 9, 13, 35);
    drawShard(a.shape, a.size);
    pop();
  }
}

// ------------------------------------------------------------
// MAIN LOOP
// ------------------------------------------------------------

function draw() {
  const dt = min(deltaTime / 1000, .05);
  sceneTime += dt;

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
  drawSmokeCeiling();
  drawStains();
  drawPatches();
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
  drawCarbon(true);
  drawSmoke(true);
  drawAtmosphereVeil();
  drawHUD();
  image(grainLayer, 0, 0);
  if (infoOpen) drawInformationOverlay();
}

// ------------------------------------------------------------
// INTERACTION / DEMAND
// ------------------------------------------------------------

function updateHover() {
  if (infoOpen) {
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
  if (n.type === 'house') return { x: r.x, y: r.y - 46 * r.s };
  if (n.type === 'pole') return { x: r.x, y: r.y - 128 * r.s };
  return { x: r.x - 34 * r.s, y: r.y - 42 * r.s };
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
  setStatus('ENERGY DEMAND APPEARS · SATISFY IT AND THE AIR LOAD WILL RISE', 2.4);
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
  setStatus('DEMAND IS WAITING · MORE POWER NOW ALSO MEANS MORE HARM LATER', 2.8);
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
