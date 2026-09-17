// BACKGROUND / ATMOSPHERE
// ------------------------------------------------------------

// Reset-driven graphic-field variation. These are curated compositions rather
// than fully free random coordinates, so every reset feels different while the
// background remains balanced and never interferes with the main scene/UI.
const GRAPHIC_FIELD_LAYOUTS = [
  {
    blueA: [[-.03,-.02],[.30,-.02],[.23,.22],[-.03,.34]],
    darkA: [[.15,.06],[.58,.08],[.75,.39],[.31,.49]],
    blueB: [[.76,.55],[1.03,.46],[1.03,.78],[.86,.84]],
    darkB: [[.00,.60],[.23,.55],[.36,.92],[.08,1.02]]
  },
  {
    blueA: [[-.04,.08],[.22,-.03],[.34,.17],[.08,.39]],
    darkA: [[.38,-.04],[.78,.00],[.66,.30],[.29,.34]],
    blueB: [[.66,.68],[.96,.57],[1.03,.88],[.78,1.02]],
    darkB: [[-.02,.48],[.17,.40],[.31,.68],[.05,.82]]
  },
  {
    blueA: [[.08,-.03],[.43,-.02],[.35,.22],[-.02,.30]],
    darkA: [[.54,.03],[.92,.10],[.78,.42],[.43,.34]],
    blueB: [[-.03,.71],[.23,.62],[.35,.92],[.04,1.02]],
    darkB: [[.64,.58],[1.03,.50],[1.03,.83],[.80,.92]]
  },
  {
    blueA: [[-.04,.00],[.20,-.02],[.31,.20],[.02,.31]],
    darkA: [[.20,.15],[.61,.04],[.71,.32],[.35,.47]],
    blueB: [[.73,.00],[1.03,-.02],[1.03,.26],[.85,.20]],
    darkB: [[.43,.65],[.74,.54],[.86,.84],[.55,.97]]
  },
  {
    blueA: [[.00,-.03],[.34,.00],[.22,.27],[-.03,.38]],
    darkA: [[.47,-.03],[.81,.12],[.67,.43],[.31,.31]],
    blueB: [[.78,.61],[1.03,.54],[1.03,.90],[.89,1.01]],
    darkB: [[-.03,.67],[.28,.57],[.42,.89],[.12,1.03]]
  }
];

let graphicFieldVariant = -1;
let graphicFieldLayout = null;

function randomizeGraphicField() {
  const count = GRAPHIC_FIELD_LAYOUTS.length;
  let next = floor(random(count));
  if (count > 1 && next === graphicFieldVariant) next = (next + 1 + floor(random(count - 1))) % count;
  graphicFieldVariant = next;

  // A small reset-only jitter prevents exact repetition while preserving the
  // proportions of the curated base layout.
  const src = GRAPHIC_FIELD_LAYOUTS[next];
  const jitter = (points, amountX = .014, amountY = .014) => points.map(([x, y], i) => {
    const edgeX = (x <= 0 || x >= 1) ? 0 : random(-amountX, amountX);
    const edgeY = (y <= 0 || y >= 1) ? 0 : random(-amountY, amountY);
    return [x + edgeX, y + edgeY];
  });

  graphicFieldLayout = {
    blueA: jitter(src.blueA, .015, .014),
    darkA: jitter(src.darkA, .014, .016),
    blueB: jitter(src.blueB, .012, .014),
    darkB: jitter(src.darkB, .014, .012),
    tilt: random(-.010, .010),
    alphaShift: random(-2.0, 2.0)
  };
}

function drawFieldPolygon(points, driftX = 0, driftY = 0) {
  polygon(points.map(([x, y]) => [x * W + driftX, y * H + driftY]));
}

function drawBackdrop() {
  const p = pollutionN();
  const clean = color(C.skyClean);
  const mid = color(C.skyMid);
  const dirty = color(C.skyDirty);
  const t = p < .40 ? smooth01(map(p, 0, .40, 0, 1)) : 1;
  let sky = p < .40
    ? lerpColor(clean, mid, t)
    : lerpColor(mid, dirty, smooth01(map(p, .40, 1, 0, 1)));
  background(sky);
}

function drawGraphicField() {
  const p = pollutionN();
  noStroke();

  // Fallback protects unusual load orders; normal builds initialize this in resetScene().
  if (!graphicFieldLayout) randomizeGraphicField();

  const fade = 1 - p * .58;
  const drift = p * 20;
  const aShift = graphicFieldLayout.alphaShift || 0;
  const blueField = lerpColor(color(39, 57, 240), color(52, 63, 122), p * .60);
  const deepBlueField = lerpColor(color(18, 30, 78), color(39, 42, 63), p * .62);
  const inkField = lerpColor(color(7, 10, 20), color(35, 31, 36), p * .56);
  const violetField = lerpColor(color(110, 90, 236), color(77, 69, 108), p * .72);
  const limeField = lerpColor(color(195, 245, 43), color(138, 120, 58), p * .92);
  const orangeField = lerpColor(color(255, 123, 31), color(172, 86, 36), p * .62);
  const paperField = lerpColor(color(244, 241, 236), color(192, 184, 170), p * .54);

  // Main blue + black/navy planes. Only these larger background planes change
  // layout on reset, keeping the interaction field and object positions stable.
  fill(red(blueField), green(blueField), blue(blueField), max(7, 22 * fade + aShift));
  drawFieldPolygon(graphicFieldLayout.blueA, -drift * .22, drift * .06);

  fill(red(inkField), green(inkField), blue(inkField), 36 + p * 7 + aShift);
  drawFieldPolygon(graphicFieldLayout.darkA, drift * .10, -drift * .05);

  fill(red(deepBlueField), green(deepBlueField), blue(deepBlueField), max(8, 18 * (fade + .12) - aShift * .25));
  drawFieldPolygon(graphicFieldLayout.blueB, -drift * .10, drift * .12);

  fill(red(inkField), green(inkField), blue(inkField), 28 + p * 8 - aShift * .30);
  drawFieldPolygon(graphicFieldLayout.darkB, drift * .08, -drift * .08);

  // Secondary accents stay in approximately the same regions so the visual
  // identity remains recognisable across all reset variants.
  fill(red(violetField), green(violetField), blue(violetField), 9 * (fade + p * .10));
  polygon([[W * .70 - drift * .22, H], [W, H], [W, H * .70 + drift], [W * .83 + drift * .15, H * .84]]);

  fill(red(blueField), green(blueField), blue(blueField), 5 * (fade + .16));
  polygon([[W * .20, H * .10], [W * .61, H * .12], [W * .74, H * .36], [W * .28, H * .46]]);

  fill(red(limeField), green(limeField), blue(limeField), 5 * max(.08, fade));
  polygon([[W * .39, H * .73], [W * .55, H * .67], [W * .62, H * .83], [W * .45, H * .89]]);

  fill(red(orangeField), green(orangeField), blue(orangeField), 6 + p * 4);
  polygon([[W * .86, 0], [W, 0], [W, H * .18 + drift * .45], [W * .91 - drift * .08, H * .12]]);

  fill(red(paperField), green(paperField), blue(paperField), 2 + fade * 2.5);
  polygon([[W * .04, H * .78], [W * .16, H * .74], [W * .22, H * .90], [W * .08, H * .96]]);

  for (let i = 0; i < ambientFragments.length; i++) {
    const a = ambientFragments[i];
    const local = samplePollution(a.x, a.y);
    if (local > .82 && noise(i * .13, sceneTime * .02) < .48) continue;
    push();
    translate(a.x + sin(sceneTime * .11 + a.phase) * a.drift, a.y + cos(sceneTime * .14 + a.phase) * a.drift * .7);
    rotate(a.rot + sceneTime * a.spin);
    if (a.kind === 'blue') fill(red(blueField), green(blueField), blue(blueField), 130 * (1 - local * .72));
    else if (a.kind === 'lime') fill(red(limeField), green(limeField), blue(limeField), 100 * (1 - local * .46));
    else if (a.kind === 'paper') fill(244, 241, 236, 118 * (1 - local * .62));
    else fill(red(orangeField), green(orangeField), blue(orangeField), 92 * (1 - local * .52));
    drawShard(a.shape, a.size);
    pop();
  }
}

function drawSmokeCeiling() {
  const p = pollutionN();
  if (smokeCeiling < 2 || p < .08) return;

  noStroke();
  for (let layer = 0; layer < 5; layer++) {
    const alpha = 3.3 + p * (6.6 + layer * 1.75) * completionSmokeVisibility();
    const topColor = lerpColor(color(64 - layer * 2.0, 65 - layer * 1.8, 71 - layer * 1.6), color(84, 70, 52), constrain(max(0, p - .42) * 1.15, 0, 1));
    fill(red(topColor), green(topColor), blue(topColor), alpha);
    beginShape();
    vertex(-160, -90);
    vertex(W + 160, -90);
    for (let x = W + 160; x >= -160; x -= 68) {
      vertex(x, getCeilingDepthAtX(x, layer));
    }
    endShape(CLOSE);
  }

  if (p > .42) {
    for (let i = 1; i < FIELD_COLS; i += 4) {
      const x = (i + .5) / FIELD_COLS * W;
      const local = getColumnPollution(x);
      if (local < .22) continue;
      const y = getCeilingDepthAtX(x, 5) * .58;
      const w = 92 + local * 150;
      const h = 28 + local * 60;
      const cloud = lerpColor(color(46, 47, 53), color(82, 66, 48), constrain((p - .4) * 1.2 + local * .2, 0, 1));
      fill(red(cloud), green(cloud), blue(cloud), (local * 8.5 + p * 3.0) * completionSmokeVisibility());
      push(); translate(x, y); rotate((noise(i * 3.2, sceneTime * .01) - .5) * .07);
      scale(1, constrain(h / max(1, w), .28, .62));
      smokeFamily(i % 6, w * .32);
      pop();
    }
  }
}


function drawStains() {
  const p = pollution / 100;
  if (p < .12) return;
  noStroke();
  for (const s of stains) {
    if (s.accent === 'orange') fill(255, 122, 26, s.a * .28 * p);
    else if (s.accent === 'violet') fill(108, 88, 232, s.a * .30 * p);
    else fill(62, 64, 70, s.a * .85 * p);
    ellipse(s.x + sin(sceneTime * .09 + s.phase) * 2, s.y, s.w, s.h);
  }
}

function drawAtmosphereVeil() {
  const p = pollutionN();
  if (p < .28) return;

  push();
  noStroke();
  const bands = 2 + floor(p * 3);
  for (let i = 0; i < bands; i++) {
    const y = 130 + i * (H - 220) / max(1, bands - 1) + sin(sceneTime * .07 + i) * 9;
    const veil = lerpColor(color(74, 76, 82), color(93, 76, 56), constrain(max(0, p - .5) * 1.05, 0, 1));
    fill(red(veil), green(veil), blue(veil), 1.0 + p * 3.4);
    beginShape();
    vertex(-120, y - 16);
    for (let x = -120; x <= W + 120; x += 128) {
      const local = getColumnPollution(x);
      const jag = ((((x / 128) | 0) % 2) ? 8 : -8) + noise(x * .0015 + i * 9, sceneTime * .018 + i) * (8 + local * 18);
      vertex(x, y + jag + local * 16);
    }
    vertex(W + 120, y + 24);
    vertex(-120, y + 28);
    endShape(CLOSE);
  }
  pop();
}


// Flat 2D pass: ground/island patches were removed so architecture sits directly
// in the composition without grey bases or faux depth.
function drawPatches() {}

// ------------------------------------------------------------
// WORLD DRAW
// ------------------------------------------------------------

function drawWorldSorted() {
  // Re-sort by the current wandering Y position so overlaps still layer naturally.
  worldDrawOrder.sort((a, b) => {
    const ay = a.type === 'machine' ? MACHINE.y + machineVisualPose().y : objectVisualPosition(a.ref).y;
    const by = b.type === 'machine' ? MACHINE.y + machineVisualPose().y : objectVisualPosition(b.ref).y;
    return ay - by;
  });
  for (const item of worldDrawOrder) {
    if (item.type === 'tree') drawTree(item.ref);
    else if (item.type === 'house') {
      if (formationProgress(item.ref, 0) > .001) drawHouse(item.ref);
    } else if (item.type === 'pole') drawPole(item.ref);
    else if (item.type === 'factory') {
      if (formationProgress(item.ref, 0) > .001) drawFactory(item.ref);
    } else drawFurnace();
  }
}

function withFormPart(o, index, fn) {
  if (o.detached[index]) return;
  const q = formationProgress(o, index);
  if (q <= .001) return;
  const a = o.appear[index];
  const inv = 1 - q;
  const anchoredArchitectureBase = index === 0 && (o.kind === 'house' || o.kind === 'factory');
  const localFold = o.revealMode === 'fold';

  push();
  if (localFold) {
    // Local "paper-fold" reveal: the form is already in the right place and
    // unfolds from its own anchor instead of flying in from outside the frame.
    // Alternate part directions keep it generative while the distances stay small.
    const dir = (o.revealDir || 1) * (index % 2 === 0 ? 1 : -1);
    const isTree = o.motionType === 'tree';
    const isPole = o.motionType === 'pole';
    const isBase = index === 0;
    const lateral = isPole ? 3 : isTree ? 9 : 11;
    const rise = isPole ? 10 : isTree ? 18 : 14;
    const biasX = o.revealBiasX || 0;
    const biasY = o.revealBiasY || 8;
    const hinge = sin(q * PI) * (isTree ? 3.5 : 2.5);

    translate(
      (dir * lateral + biasX * .25) * inv + dir * hinge,
      (rise + biasY * .35) * inv - hinge * .55
    );
    rotate(dir * inv * (isTree ? .045 : isPole ? .018 : .032));

    if (isBase) {
      // Bases grow from their authored footing; no floating ground contact.
      // Factory geometry uses y=78 as its floor, so scale around that floor line.
      if (o.kind === 'factory') translate(0, 78);
      scale(lerp(isTree ? .72 : .88, 1, q), lerp(isTree ? .32 : .70, 1, smooth01(q)));
      if (o.kind === 'factory') translate(0, -78);
    } else {
      // Crowns/roofs/accent planes open like a restrained hinge rather than scatter.
      scale(lerp(isTree ? .76 : .84, 1, q), lerp(isTree ? .68 : .80, 1, q));
    }
    drawingContext.globalAlpha = constrain(.20 + q * .92, 0, 1);
  } else {
    translate(
      a.x * inv * (anchoredArchitectureBase ? .16 : 1),
      anchoredArchitectureBase ? 0 : a.y * inv
    );
    rotate(a.r * inv * (anchoredArchitectureBase ? .08 : 1));
    scale(lerp(anchoredArchitectureBase ? .90 : a.sc, 1, q));
    drawingContext.globalAlpha = constrain(q * 1.12, 0, 1);
  }

  applyGenerativePart(o, index, q);
  fn(q);
  drawingContext.globalAlpha = 1;
  pop();
}

// A tiny registration mark makes the reveal feel designed rather than like a
// stock spawn animation. It only exists during formation and never becomes UI.
function drawFormationRegister(o, halfWidth = 50, y = 4) {
  const q = formationProgress(o, 0);
  if (q <= .01 || q >= .985) return;
  const pulse = sin(q * PI);
  const dir = o.revealDir || 1;
  const reach = halfWidth * (.20 + q * .58);
  push();
  strokeWeight(1.05);
  stroke(244, 241, 236, 24 * pulse);
  line(-halfWidth * .42, y, halfWidth * .42, y);
  stroke(255, 121, 0, 46 * pulse);
  line(-dir * halfWidth * .10, y, dir * reach, y);
  noStroke();
  fill(179, 255, 54, 58 * pulse);
  rect(dir * reach, y, 3.2, 3.2);
  pop();
}


function housePalette(v, soot = 0, damage = 0) {
  const i = ((v % 4) + 4) % 4;
  const defs = [
    { body: '#2930FF', roofA: '#FF7900' },
    { body: '#B3FF36', roofA: '#2930FF' },
    { body: '#FF7900', roofA: '#141414' },
    { body: '#FF2424', roofA: '#141414' }
  ];
  const d = defs[i];
  const grime = constrain(soot * .42 + damage * .24, 0, .34);
  return {
    body: lerpColor(color(d.body), color('#5F534C'), grime),
    roofA: lerpColor(color(d.roofA), color('#5A4E48'), grime * .62),
    roofB: lerpColor(color(d.roofA), color('#5A4E48'), grime * .62),
    cutout: lerpColor(color('#F6F0E8'), color('#D9CCBE'), grime * .44)
  };
}

function houseFeatureLayout(v) {
  const i = ((v % 4) + 4) % 4;
  // v25: one graphic aperture / notch per building. Enough to read as habitation,
  // but less literal than a conventional door-window facade.
  if (i === 1) return { w1: [-18,-24,22,12], w2:[0,0,0,0], door:[27,-8,10,16], cap:[0,0,0,0] };
  if (i === 2) return { w1: [11,-34,10,24],  w2:[0,0,0,0], door:[0,0,0,0],     cap:[0,0,0,0] };
  if (i === 3) return { w1: [-6,-21,24,10],  w2:[0,0,0,0], door:[-30,-8,12,12],cap:[0,0,0,0] };
  return { w1: [10,-29,10,24], w2:[0,0,0,0], door:[0,0,0,0], cap:[0,0,0,0] };
}

function houseMotionAccent(h, demand, hovered) {
  const t = sceneTime;
  const base = t * (.78 + (h.seed % 7) * .018) + h.seed * .013;
  const roofFloat = sin(base * 1.24 + .8) * .6;
  const bodyBob = sin(base) * 1.4 + cos(base * .62) * .7;
  const bodyLean = sin(base * .92) * .007 + cos(base * .54) * .003;
  const roofLean = -bodyLean * .48 + sin(base * 1.38) * .008;
  const stretch = 1 + sin(base * 1.02) * .012;
  const cutShift = sin(base * 1.18) * 1.3;
  return { roofFloat, bodyBob, bodyLean, roofLean, stretch, cutShift };
}

function drawHouseRoof(v, palette, glowCharge = 0, damage = 0) {
  const i = ((v % 4) + 4) % 4;
  const heatBoost = constrain(glowCharge * .18 + damage * .08, 0, .24);
  const roofA = lerpColor(palette.roofA, color(C.heat), heatBoost);
  fill(roofA);
  // Offset planes instead of conventional peaked roofs: still architectural,
  // but now they share the same cut-paper language as the airflow and machine.
  if (i === 0) polygon([[-60,-43],[-14,-73],[48,-53],[38,-37],[-8,-55],[-52,-31]]);
  else if (i === 1) polygon([[-54,-46],[-8,-70],[58,-57],[48,-38],[-20,-38]]);
  else if (i === 2) polygon([[-38,-37],[12,-80],[48,-56],[33,-38],[12,-57],[-27,-25]]);
  else polygon([[-54,-35],[-2,-61],[62,-18],[42,-8],[0,-39],[-46,-23]]);
}

function drawHouseCutouts(v, palette, glowCharge, damage, soot, ft, cutShift = 0) {
  const warmWin = lerpColor(palette.cutout, color(255, 212, 132), constrain(glowCharge * 1.15, 0, 1));
  const warm = lerpColor(warmWin, color(C.sootDeep), damage * .12);
  const neutral = lerpColor(palette.cutout, color(90, 74, 56), constrain(soot * .22 + damage * .34, 0, 1));

  if (ft.w1[2] > 0) {
    fill(warm);
    push();
    translate(ft.w1[0], ft.w1[1] + cutShift * .22);
    const w = ft.w1[2] / 2, h = ft.w1[3] / 2;
    polygon([[-w,-h],[w,-h*.78],[w*.78,h],[-w,h*.8]]);
    pop();
  }
  if (ft.door[2] > 0) {
    fill(neutral);
    rect(ft.door[0], ft.door[1], ft.door[2], ft.door[3]);
  }
}

function drawHouse(h) {
  const damage = getObjectDamageLevel(h);
  const charge = constrain(h.charge, 0, 1);
  const hovered = hoveredNode && hoveredNode.id === h.id && !dragState;
  const hoverProgress = hovered ? constrain((sceneTime - hoverStarted) / DEMAND_HOLD, 0, 1) : 0;
  const demand = max(h.demandReady || 0, h.demandFlash * .65, hoverProgress);
  const soot = constrain(h.soot || 0, 0, 1);
  const vitality = objectVitality(damage);
  const liveCharge = charge * (.34 + vitality * .92);
  const glowCharge = max(liveCharge, demand * .20);
  const palette = housePalette(h.variant, soot, damage);
  const ft = houseFeatureLayout(h.variant);
  const pose = objectVisualPose(h);
  const motion = houseMotionAccent(h, demand, hovered);

  push();
  translate(h.x + pose.x, h.y + pose.y + motion.bodyBob);
  rotate(h.rot + pose.rot + motion.bodyLean + (hovered ? sin(sceneTime * 3 + h.seed) * .0026 : 0));
  scale(h.s * motion.stretch * (pose.scale || 1));
  noStroke();

  withFormPart(h, 3, () => {
    const c = houseChimney(h.variant);
    fill(palette.cutout);
    rect(c.x, (c.top + c.bottom) / 2, 10, c.bottom - c.top);
    fill(palette.roofA);
    rect(c.x, c.top, 15, 5);
  });
  withFormPart(h, 0, () => {
    push();
    translate(0, motion.cutShift * .12);
    fill(palette.body);
    houseBody(h.variant);
    pop();
  });

  withFormPart(h, 1, () => {
    push();
    translate(0, motion.roofFloat - demand * .8);
    rotate(motion.roofLean * (.70 + hoverProgress * .55));
    drawHouseRoof(h.variant, palette, glowCharge, damage);
    pop();
  });

  withFormPart(h, 2, () => drawHouseCutouts(h.variant, palette, glowCharge, damage, soot, ft, motion.cutShift));
  withFormPart(h, 3, () => {});
  withFormPart(h, 4, () => {});
  withFormPart(h, 5, () => {});
  drawFormationRegister(h, 50, 5);

  if (demand > .08) {
    for (let i = 0; i < 2; i++) {
      const a = sceneTime * (.62 + i * .08) + h.seed + i * PI;
      const ember = emberAccentColor(demand);
      fill(red(ember), green(ember), blue(ember), 52 + demand * 68);
      diamond(cos(a) * (34 + i * 7), -24 + sin(a * 1.18) * 12, 3.8 + demand * 2);
    }
  }

  if (glowCharge > .03 && !h.detached[0]) {
    const pulse = .84 + .16 * sin(sceneTime * 3.1 + h.seed);
    const barCol = energyGlowColor(glowCharge, damage);
    fill(red(barCol), green(barCol), blue(barCol), 10 + glowCharge * 18 * pulse);
    rect(0, -6, 56, 4);
  }

  if (h.powerPulse > .02) {
    const pulseCol = energyGlowColor(h.powerPulse, damage);
    noFill(); stroke(red(pulseCol), green(pulseCol), blue(pulseCol), 58 * h.powerPulse); strokeWeight(2);
    line(-42, 8, 44 + 8 * h.powerPulse, 8);
    noStroke();
  }
  pop();
}

function houseBody(v) {
  const i = ((v % 4) + 4) % 4;
  // v25: clip one corner / skew the footprint so these read as spatial symbols,
  // not miniature cartoon houses.
  if (i === 1) polygon([[-58,0],[-52,-39],[-17,-47],[51,-39],[58,-5],[42,0]]);
  else if (i === 2) polygon([[-30,0],[-31,-30],[-13,-49],[18,-69],[42,-47],[38,-8],[28,0]]);
  else if (i === 3) polygon([[-51,0],[-44,-29],[1,-45],[51,-14],[44,0],[15,-4]]);
  else polygon([[-53,0],[-51,-39],[-9,-59],[47,-40],[43,-5],[25,0]]);
}


function flatTreeColor(baseHex, health, damage) {
  // Keep the reference palette vivid and flat. Pollution only darkens the
  // solid fill slightly so the interaction still reads without turning the
  // trees into muddy gradients or shaded forms.
  const stress = constrain((1 - health) * .14 + damage * .10, 0, .22);
  return lerpColor(color(baseHex), color(C.sootDeep), stress);
}

function drawTree(t) {
  const damage = getObjectDamageLevel(t);
  const health = constrain(t.health, 0, 1);
  const pose = objectVisualPose(t);
  const sway = sin(sceneTime * .52 + t.seed) * (.005 + health * .0032);
  const breathe = 1 + sin(sceneTime * .58 + t.seed * .22) * .010;
  const v = ((t.variant % 4) + 4) % 4;

  push();
  translate(t.x + pose.x, t.y + pose.y);
  rotate(t.rot + pose.rot + sway);
  scale(t.s * breathe * (pose.scale || 1));
  noStroke();

  withFormPart(t, 0, q => {
    const trunk = lerpColor(color('#8A3F00'), color('#3E2412'), constrain((1 - health) * .24 + damage * .34, 0, .52));
    fill(trunk);
    if (v === 3) {
      polygon([[-14,0],[-12,-56*q],[-28*q,-92*q],[-18*q,-98*q],[-4,-76*q],[14*q,-120*q],[26*q,-114*q],[12,-66*q],[12,0]]);
    } else if (v === 1) {
      polygon([[-10,0],[-6,-112*q],[6,-112*q],[10,0]]);
    } else {
      polygon([[-10,0],[-6,-108*q],[5,-108*q],[10,0]]);
    }
  });

  if (v === 0) {
    const c = flatTreeColor(C.blue, health, damage);
    withFormPart(t, 1, q => { fill(c); push(); scale(q); polygon([[-54,-94],[-18,-154],[46,-118],[30,-101],[-6,-112]]);  pop(); });
    withFormPart(t, 2, q => { fill(c); push(); scale(q); polygon([[-62,-68],[-18,-123],[58,-86],[37,-67],[-12,-78]]);  pop(); });
    withFormPart(t, 3, q => { fill(c); push(); scale(q); polygon([[-66,-42],[-10,-96],[61,-54],[39,-39],[-18,-49]]);  pop(); });
  } else if (v === 1) {
    const c = flatTreeColor(C.orange, health, damage);
    withFormPart(t, 1, q => { fill(c); push(); translate(-20, -100); scale(q); polygon([[-42,14],[-34,-26],[-6,-46],[30,-30],[42,8],[16,40],[-20,38]]);  pop(); });
    withFormPart(t, 2, q => { fill(c); push(); translate(9, -142); scale(q); polygon([[-34,16],[-26,-32],[12,-42],[38,-8],[24,30],[-8,38]]);  pop(); });
    withFormPart(t, 3, q => { fill(c); push(); translate(38, -105); scale(q); polygon([[-28,-20],[4,-36],[34,-8],[22,30],[-16,34],[-34,8]]);  pop(); });
  } else if (v === 2) {
    const c = flatTreeColor(C.lime, health, damage);
    withFormPart(t, 1, q => { fill(c); push(); scale(q); polygon([[-50,-112],[-11,-158],[41,-143],[49,-111],[9,-98],[-23,-101]]);  pop(); });
    withFormPart(t, 2, q => { fill(c); push(); scale(q); polygon([[-61,-80],[-31,-117],[31,-106],[61,-73],[18,-51],[-45,-57]]);  pop(); });
    withFormPart(t, 3, q => { fill(c); push(); scale(q); polygon([[-48,-47],[-5,-82],[44,-63],[45,-33],[-14,-25]]);  pop(); });
  } else {
    const c = flatTreeColor(C.lime, health, damage);
    withFormPart(t, 1, q => { fill(c); push(); translate(24, -118); scale(q); polygon([[-22,-34],[34,-44],[64,-8],[46,34],[-12,22]]);  pop(); });
    withFormPart(t, 2, q => { fill(c); push(); translate(-38, -90); scale(q); polygon([[-30,-18],[-4,-42],[30,-24],[34,12],[8,28],[-28,18]]);  pop(); });
    withFormPart(t, 3, q => { fill(c); push(); translate(54, -66); scale(q * .66); polygon([[-18,-16],[8,-24],[24,-4],[14,18],[-14,14],[-24,-2]]);  pop(); });
  }

  drawFormationRegister(t, 44, 3);

  if (health > .42) {
    fill(255, 255, 255, 18 + health * 12);
    rect(0, -34, 10, 3);
  }
  pop();
}

function treeCrownParts(v) {
  return TREE_CROWN_SETS[v % TREE_CROWN_SETS.length];
}

function drawTreePlate(w, h, cut, seed, damage) {
  const j = (noise(seed * .019) - .5) * .10;
  const crush = 1 - damage * .08;
  const pts = TREE_PLATE_POINTS[cut % TREE_PLATE_POINTS.length];
  beginShape();
  for (let i = 0; i < pts.length; i++) {
    const px = pts[i][0] * w + (i % 2 ? j * w : -j * w * .4) * damage;
    const py = pts[i][1] * h * crush;
    vertex(px, py);
  }
  endShape(CLOSE);
}


// Lightweight debris crown. Older versions referenced irregularCrown() after tree parts
// detached, but the helper had been removed, causing a late runtime crash at high pollution.
function irregularCrown(s, pointHint = 6, seed = 0, integrity = 1) {
  const family = floor(abs(seed)) % TREE_PLATE_POINTS.length;
  const pts = TREE_PLATE_POINTS[family];
  const wobble = constrain(1 - integrity, 0, 1) * .10;
  beginShape();
  for (let i = 0; i < pts.length; i++) {
    const n = (noise(seed * .013 + i * 1.71) - .5) * wobble;
    vertex((pts[i][0] + n) * s, (pts[i][1] - n * .5) * s);
  }
  endShape(CLOSE);
}

function drawPole(po) {
  const lit = po.energy > .05;
  const damage = getObjectDamageLevel(po);
  const soot = po.soot || 0;
  const pulse = constrain(po.energy, 0, 1);
  const powerColor = lerpColor(color(82, 100, 255), color(150, 120, 255), pulse * .24 + damage * .06);
  const currentAlive = lit ? pulse * (.55 + objectVitality(damage) * 1.08) : 0;
  const poleBody = lerpColor(color(C.paper), color(C.lime), lit ? .32 : .08);
  const crossBody = color(C.orange);

  const pose = objectVisualPose(po);
  push();
  translate(po.x + pose.x, po.y + pose.y);
  rotate(po.rot + pose.rot + sin(sceneTime * .18 + po.seed) * .003 * damage);
  scale(po.s * (pose.scale || 1));
  noStroke();

  if (lit) {
    const glowA = 34 + currentAlive * 58;
    stroke(red(powerColor), green(powerColor), blue(powerColor), glowA);
    strokeWeight(10 + currentAlive * 6.5);
    line(0, -154, 0, -98);
    const crossGlow = lerpColor(powerColor, color(255, 235, 170), .08);
    stroke(red(crossGlow), green(crossGlow), blue(crossGlow), glowA * .76);
    strokeWeight(6 + currentAlive * 3.2);
    line(-42, -145, 42, -145);
    noStroke();
  }

  withFormPart(po, 0, q => {
    fill(poleBody);
    beginShape();
    vertex(-6, 0);
    vertex(-4.2, -151 * q);
    vertex(4.5, -151 * q);
    vertex(6.5, 0);
    endShape(CLOSE);
    fill(lit ? lerpColor(color(C.paper), powerColor, .42) : lerpColor(color(C.grey), color(C.ink), .55));
    rect(0, -54 * q, 14, 5);
  });

  withFormPart(po, 1, q => {
    fill(crossBody);
    polygon([[-54*q,-145],[-42*q,-153],[18*q,-151],[55*q,-143],[34*q,-136],[-49*q,-139]]);
    stroke(crossBody); strokeWeight(3.2);
    line(-4, -143, -29 * q, -125);
    line(7, -143, 27 * q, -126);
    noStroke();
  });

  withFormPart(po, 2, q => drawPoleInsulator(-31, -139, q, lit, currentAlive, damage));
  withFormPart(po, 3, q => drawPoleInsulator(31, -139, q, lit, currentAlive, damage));

  withFormPart(po, 4, q => {
    const flicker = damage > .78 && floor(sceneTime * 9 + po.seed) % 6 === 0;
    if (!flicker) {
      fill(lit ? lerpColor(powerColor, color(255, 216, 120), .20) : C.grey);
      diamond(0, -151, 11 + pulse * 5 * q);
      fill(lit ? lerpColor(color(emberAccentColor(pulse)), powerColor, .38) : C.ink);
      rect(0, -128, 10, 22 * q);
      fill(C.ink);
      rect(0, -115, 18 * q, 5);
    }
  });

  if (lit) {
    for (let i = 0; i < 4; i++) {
      const a = sceneTime * (2.0 + i * .18) + po.seed + i * 1.8;
      const cc = i === 1 ? emberAccentColor(currentAlive) : powerColor;
      fill(red(cc), green(cc), blue(cc), 220);
      rect(cos(a) * (18 + i * 7), -150 + sin(a) * 8, 7 + pulse * 4, 2.4);
    }
  }
  pop();
}

function drawPoleInsulator(x, y, q, lit, pulse, damage = 0) {
  push();
  translate(x, y);
  const insulatorColor = lit ? lerpColor(lerpColor(energyGlowColor(pulse, damage), color(148, 122, 255), .20), color(255, 235, 176), .18) : color(C.grey);
  fill(insulatorColor);
  rect(0, 8 * (1 - q), 7, 18 * q);
  fill(C.ink);
  rect(0, -2, 15, 3);
  rect(0, 4, 12, 3);
  fill(lit ? lerpColor(insulatorColor, color(emberAccentColor(pulse)), pulse * .22) : color(C.ink));
  circle(0, -10, 8 + pulse * 3);
  pop();
}


function poleInsulatorWorldPoint(po, side = 1) {
  return localToWorld(po, side < 0 ? -31 : 31, -149);
}

function drawPowerGridCables() {
  if (poles.length < 2) return;
  push();
  noFill();
  strokeWeight(2.2);
  for (let i = 0; i < poles.length - 1; i++) {
    const a = poles[i];
    const b = poles[i + 1];
    if (!objectReady(a) || !objectReady(b) || a.detached[1] || b.detached[1]) continue;
    const p1 = poleInsulatorWorldPoint(a, 1);
    const p2 = poleInsulatorWorldPoint(b, -1);
    const energy = max(a.energy, b.energy);
    const damage = max(getObjectDamageLevel(a), getObjectDamageLevel(b));
    const vitality = objectVitality(damage);
    const cableWave = sin(sceneTime * (.78 + i * .12) + a.seed * .01) * 10
      + (noise(a.seed * .017 + b.seed * .013, sceneTime * .16) - .5) * 18;
    const sag = 22 + abs(p2.x - p1.x) * .022 + damage * 30 + cableWave;
    const midX = (p1.x + p2.x) * .5 + sin(sceneTime * .44 + i * 1.7) * 10;
    const flicker = damage > .78 && floor(sceneTime * 10 + a.seed + b.seed) % 7 === 0;
    if (flicker) continue;

    const liveStrength = energy * (.36 + vitality * 1.04);
    const mainColor = energy > .08 ? lerpColor(energyGlowColor(liveStrength, damage), color(155, 132, 255), .18) : color(C.ink);
    if (energy > .08) {
      stroke(red(mainColor), green(mainColor), blue(mainColor), 48 + liveStrength * 44);
      strokeWeight(6.2);
      bezier(p1.x, p1.y, lerp(p1.x, midX, .72), p1.y + sag, lerp(midX, p2.x, .28), p2.y + sag, p2.x, p2.y);
      stroke(255, 245, 210, 14 + liveStrength * 20);
      strokeWeight(2.0);
      bezier(p1.x, p1.y, lerp(p1.x, midX, .72), p1.y + sag, lerp(midX, p2.x, .28), p2.y + sag, p2.x, p2.y);
    }
    stroke(mainColor);
    strokeWeight(2.6);
    bezier(p1.x, p1.y, lerp(p1.x, midX, .72), p1.y + sag, lerp(midX, p2.x, .28), p2.y + sag, p2.x, p2.y);

  }
  pop();
}



function factoryPalette(v, soot = 0, damage = 0) {
  const i = ((v % 3) + 3) % 3;
  const defs = [
    { body: '#FF7900', accent: '#141414' },
    { body: '#2930FF', accent: '#FF7900' },
    { body: '#B3FF36', accent: '#2930FF' }
  ];
  const d = defs[i];
  const grime = constrain(soot * .34 + damage * .22, 0, .30);
  return {
    body: lerpColor(color(d.body), color('#5C514A'), grime),
    accent: lerpColor(color(d.accent), color('#675C55'), grime * .60),
    accent2: lerpColor(color(d.accent), color('#5C514A'), grime * .54),
    cut: lerpColor(color('#F6F0E8'), color('#D8CBB8'), grime * .46),
    dark: lerpColor(color('#141414'), color('#383942'), grime * .34)
  };
}

function drawFactory(f) {
  const hot = f.activity > .12;
  const live = f.energy > .08;
  const damage = getObjectDamageLevel(f);
  const hovered = hoveredNode && hoveredNode.id === f.id && !dragState;
  const hoverProgress = hovered ? constrain((sceneTime - hoverStarted) / DEMAND_HOLD, 0, 1) : 0;
  const demand = max(f.demandReady || 0, f.demandFlash * .65, hoverProgress);
  const vitality = objectVitality(damage);
  const currentLive = max(f.energy, f.activity * .55) * (.28 + vitality * .92);
  const pal = factoryPalette(f.variant, f.soot, damage);
  const v = ((f.variant % 3) + 3) % 3;

  const pose = factoryRenderPose(f);
  push();
  translate(pose.x, pose.y);
  rotate(pose.rot);
  scale(pose.scale);
  noStroke();

  // Chimneys sit behind the colored building silhouette, matching the flat reference.
  const chimneys = factoryChimneys(f.variant);
  withFormPart(f, 2, q => drawFactoryChimney(chimneys[0], min(1, q + demand * .08), hot || demand > .6, f.soot));
  withFormPart(f, 3, q => { if (chimneys[1]) drawFactoryChimney(chimneys[1], min(1, q + demand * .12), hot || demand > .6, f.soot); });

  withFormPart(f, 0, () => {
    fill(pal.body);
    factoryBaseBody(v);
  });

  // One bold secondary plane instead of the old literal roof/base construction.
  withFormPart(f, 1, q => {
    fill(pal.accent);
    push();
    scale(.96 + q * .04);
    factoryAccentBody(v);
    pop();
    // no extra third color plane
  });

  // One cut-out is enough to suggest function without turning the factory into an icon.
  withFormPart(f, 4, () => {
    fill(pal.cut);
    if (v === 0) rect(-18, 30, 20, 18);
    else if (v === 1) rect(-10, 22, 18, 18);
    else rect(-14, 30, 22, 16);
  });

  withFormPart(f, 5, () => {});
  withFormPart(f, 6, () => {});
  drawFormationRegister(f, 104, 84);

  if (f.powerPulse > .02) {
    const pulseCol = energyGlowColor(f.powerPulse, damage);
    noFill(); stroke(red(pulseCol), green(pulseCol), blue(pulseCol), 72 * f.powerPulse); strokeWeight(2);
    line(-116, 92, 116 + f.powerPulse * 14, 92);
    noStroke();
  }
  pop();
}

function factoryBaseBody(v) {
  if (v === 0) {
    // Low saw-tooth factory.
    polygon([[-116,78],[-116,18],[-83,-4],[-78,-45],[-33,-17],[-28,-55],[18,-29],[116,-7],[116,78]]); } else if (v === 1) {
    // Tower + base, very clean.
    polygon([[-112,78],[-112,2],[-55,-5],[-31,-104],[14,-98],[8,-36],[112,-15],[112,78]]); } else {
    // Simple stepped block.
    polygon([[-116,78],[-116,22],[-64,15],[-58,-25],[-12,-28],[-4,-70],[58,-65],[51,-16],[116,-14],[116,78]]); }
}

function factoryAccentBody(v) {
  if (v === 0) {
    polygon([[-116,12],[-82,-8],[-82,-50],[-38,-18],[-38,8],[-116,26]]);
  } else if (v === 1) {
    polygon([[-50,-2],[-34,-104],[10,-104],[10,-34],[-8,-20]]);
  } else {
    polygon([[-116,18],[-60,18],[-60,-24],[-8,-24],[-8,8],[-116,28]]);
  }
}

function factoryChimneys(v) {
  const i = ((v % 3) + 3) % 3;
  if (i === 0) return [
    { x: 30, y: -92, w: 18, h: 108, cap: 7, lip: 6, embed: 14 },
    { x: 58, y: -108, w: 20, h: 122, cap: 8, lip: 6, embed: 16 }
  ];
  if (i === 1) return [
    { x: 44, y: -126, w: 24, h: 136, cap: 9, lip: 7, embed: 16 },
    { x: 18, y: -90, w: 14, h: 88, cap: 6, lip: 5, embed: 12 }
  ];
  return [
    { x: 44, y: -102, w: 18, h: 106, cap: 7, lip: 6, embed: 14 },
    { x: 72, y: -116, w: 20, h: 118, cap: 8, lip: 6, embed: 16 }
  ];
}

function drawFactoryChimney(c, q, hot, soot = 0) {
  if (!c) return;
  const h = c.h * q;
  const embed = c.embed || 12;
  const topY = c.y + c.h * .50 - h;
  const bottomY = max(24, c.y + c.h * .50 + embed);
  const bodyCol = lerpColor(color('#FFFDF6'), color('#E8E0CF'), constrain(soot * .16 + pollutionN() * .05, 0, .20));

  // Main chimney body — slightly thicker and sunk into the factory body.
  fill(bodyCol);
  beginShape();
  vertex(c.x - c.w * .54, bottomY);
  vertex(c.x - c.w * .42, topY + 6);
  vertex(c.x - c.w * .30, topY);
  vertex(c.x + c.w * .30, topY);
  vertex(c.x + c.w * .42, topY + 6);
  vertex(c.x + c.w * .54, bottomY);
  endShape(CLOSE);


  // Top rim.
  fill('#F1EBDD');
  rect(c.x, topY - 2, c.w * 1.02, max(4, c.cap || 6));
  fill('#141414');
  rect(c.x, topY + 1, c.w * .34, max(3, (c.cap || 6) * .36));

  // Base collar overlaps into the building so the pipe does not float.
  fill('#EDE5D6');
  rect(c.x, bottomY - 8, c.w * 1.08, max(5, c.lip || 5));
  fill(255, 255, 255, 54);
  rect(c.x, bottomY - max(14, h * .16), c.w * .20, max(14, h * .18));

  if (hot) {
    fill(C.orange);
    rect(c.x, topY + 7, c.w * .46, 4);
  }
}

// Draw and interaction anchors share the same moving coordinate system.
function machineRenderPose() {
  const p = machineVisualPose();
  return {x: MACHINE.x + p.x, y: MACHINE.y + p.y, rot: p.rot,
    sx: 1 + pressure.compression * .05 - pressure.kick * .035,
    sy: 1 - pressure.compression * .07 + pressure.kick * .05,
    scale: MACHINE.scale * (p.scale || 1) * (1 + feedPulse * .0018)};
}
function machineLocalToWorld(x, y) {
  const p = machineRenderPose();
  x *= p.sx; y *= p.sy;
  return {x:p.x+(x*cos(p.rot)-y*sin(p.rot))*p.scale,
    y:p.y+(x*sin(p.rot)+y*cos(p.rot))*p.scale};
}
function machineHopperPoint() { return machineLocalToWorld(-70, -128); }
function machineDemandPoint() { return machineLocalToWorld(-4, -8); }
function machineEnergyPoint() { return machineLocalToWorld(140, 6); }

function drawFurnace() {
  const pose = machineRenderPose();
  const hover = dist(mouseX, mouseY, pose.x, pose.y - 10 * pose.scale) < 180 * pose.scale;
  const active = burnCount > 0 || burnPulse > .02;
  const level = active ? constrain(.18 + burnPulse * .72 + min(1, burnCount / COMPLETION_BURNS) * .24 + overdrive * .30, 0, 1) : 0;
  push();
  translate(pose.x, pose.y);
  rotate(pose.rot);
  scale(pose.scale * pose.sx, pose.scale * pose.sy);
  noStroke();

  // v23: no large backing panel behind the hero machine.
  // The negative space remains open so the airflow lines can pass behind it.
  // Dark shapes below are only structural details *inside* the machine itself.

  // Separate exhaust: smoke emerges from the dark mouth at (54,-160).
  fill(C.paper);
  polygon([[40,-67],[44,-160],[64,-160],[72,-70]]);
  fill(C.violet);
  polygon([[58,-154],[64,-160],[72,-70],[61,-74]]);
  fill(C.ink);
  polygon([[39,-164],[68,-164],[66,-156],[41,-156]]);

  // Wide lime hopper centered on the actual coal target (-70,-128).
  fill(C.lime);
  polygon([[-110,-138],[-28,-131],[-49,-106],[-88,-110]]);
  polygon([[-84,-111],[-51,-106],[-58,-70],[-77,-76]]);
  fill(C.ink);
  polygon([[-99,-132],[-40,-128],[-49,-120],[-90,-123]]);


  // Off-axis paper planes, with one clear coal inlet and exhaust.
  fill(C.ink);
  polygon([[-122,62],[102,56],[116,77],[-114,80]]);
  fill(C.violet);
  polygon([[8,-88],[96,-66],[106,52],[70,66],[-8,12]]);

  fill(C.blue);
  stroke(C.paper); strokeWeight(2);
  polygon([[-118,62],[-108,-48],[-74,-58],[-62,-86],[66,-68],[78,58],[-18,70]]);
  noStroke();



  // A single framed opening keeps the focal point clear at small scales.
  fill(C.ink);
  polygon([[-86,-35],[-27,-47],[-2,10],[-29,44],[-88,25]]);
  fill(C.paper);
  polygon([[-78,-29],[-32,-38],[-12,8],[-34,34],[-80,19]]);
  fill(C.orange);
  polygon([[-64,-6],[-40,-15],[-25,9],[-43,26],[-67,15]]);


  // Slim dark control plane separates the indicators from the blue body.
  fill(C.ink);
  polygon([[20,-43],[60,-47],[70,45],[31,51]]);

  // Three slanted indicator plates retain readable machine progress.
  for (let i = 0; i < 3; i++) {
    const on = i < min(3, floor(map(burnCount, 0, COMPLETION_BURNS, 0, 3)));
    fill(on ? C.lime : C.blue);
    const y = -30 + i * 27;
    polygon([[28,y],[53,y-5],[59,y+9],[34,y+14]]);
  }

  fill(C.lime);
  polygon([[72,-3],[140,-4],[145,14],[80,22]]);
  fill(C.ink);
  polygon([[134,-4],[145,-4],[145,14],[134,16]]);

  if (burnPulse > .02) {
    fill('#FF2424');
    diamond(-46, 7, 4 + burnPulse * 5);
  }

  if (hover && !dragState) {
    noFill();
    stroke('#B3FF36');
    strokeWeight(2);
    line(-102, -150, 102, -150);
    noStroke();
  }
  pop();
}

function furnaceBody() {
  // Kept for compatibility with older references; the machine is now drawn
  // directly inside drawFurnace() as a flat abstract industrial composition.
}

function hopperShape() {
  // Compatibility stub — current hopper is part of drawFurnace().
}


function drawSpark(x, y, r) {
  push();
  translate(x, y);
  rotate(sceneTime * .8);
  fill(C.orange);
  noStroke();
  beginShape();
  for (let i = 0; i < 12; i++) {
    const a = TWO_PI * i / 12;
    const rr = i % 2 === 0 ? r : r * .42;
    vertex(cos(a) * rr, sin(a) * rr);
  }
  endShape(CLOSE);
  pop();
}

// ------------------------------------------------------------
// PARTICLE DRAW
// ------------------------------------------------------------

function drawCoal() {
  for (let i = 0; i < coal.length; i++) {
    drawCoalPiece(coal[i], i === hoveredCoal || (dragState && dragState.index === i));
  }
}

function drawCoalPiece(c, active) {
  push();
  translate(c.x, c.y);
  rotate(c.rot);
  scale(active ? 1.10 : 1);

  const ember = color(255, 130, 38);
  const emberDeep = color(214, 84, 20);
  const coalCore = color(235, 232, 224);
  const coalShell = color(198, 190, 178);

  if (active) {
    noFill();
    stroke(C.orange);
    strokeWeight(2);
    circle(0, 0, c.size * 2.7);
    noStroke();
  }

  fill(coalCore);
  coalShape(c.type, c.size * .98);

  fill(coalShell);
  coalShape(c.type, c.size * .82);

  fill(active ? ember : lerpColor(emberDeep, ember, .62));
  rect(-c.size * .08, -c.size * .06, c.size * .34, max(4, c.size * .10));

  fill(255, 210, 150, active ? 190 : 125);
  rect(c.size * .12, -c.size * .18, max(3, c.size * .10), max(3, c.size * .10));
  pop();
}

function coalShape(type, s) {
  polygonFromPoints(COAL_SHAPE_POINTS[type] || COAL_SHAPE_POINTS[0], s);
}

function drawFragments() {
  for (const f of fragments) {
    push();
    if (f.trail.length > 1) {
      noFill(); stroke(255, 145, 60, 90); strokeWeight(1.3);
      beginShape(); for (const pt of f.trail) vertex(pt.x, pt.y); endShape();
    }
    translate(f.x, f.y); rotate(f.rot);
    const shrink = 1 - smooth01(constrain((f.t - .88) / .12, 0, 1)) * .8;
    scale(shrink);
    fill(f.tone); stroke(C.paper); strokeWeight(.8);
    polygon(f.points);
    stroke(C.orange); strokeWeight(1.5);
    line(f.points[0][0], f.points[0][1], f.points[1][0], f.points[1][1]);
    pop();
  }
}

function drawDemandSignals() {
  noStroke();
  for (const s of demandSignals) {
    const a = .72 + .28 * sin(sceneTime * 11 + s.phase);
    fill(255, 122, 26, 190 * a);
    diamond(s.x, s.y, 8);
    for (const f of s.fragments || []) {
      const tq = constrain(s.t - f.lag, 0, 1);
      if (tq <= 0) continue;
      const q = ease(tq);
      const bend = sin(q * PI) * (42 + abs(s.bend) * 36);
      const fx = lerp(s.sx, s.ex, q) + bend * s.bend + cos(f.phase + sceneTime * 2) * 5;
      const fy = lerp(s.sy, s.ey, q) - bend * .55 + sin(f.phase + sceneTime * 2) * 4;
      fill(255, 122, 26, 100 * a);
      push(); translate(fx, fy); rotate(f.phase + sceneTime * .3); drawShard(floor(f.phase * 10) % 5, f.size); pop();
    }
  }
}

function drawEnergy() {
  noStroke();
  for (const e of energyClusters) {
    // Broken electric trail makes energy directional without creating a literal cable route.
    for (let k = 0; k < 7; k++) {
      const tq = constrain(e.t - k * .055, 0, 1);
      if (tq <= 0) continue;
      const q = ease(tq);
      const arc = sin(q * PI) * min(115, dist(e.sx, e.sy, e.ex, e.ey) * .14) * e.arcSign;
      const x = lerp(e.sx, e.ex, q);
      const y = lerp(e.sy, e.ey, q) - abs(arc) * .72;
      fill(46, 51, 245, 35 + (7 - k) * 18);
      push(); translate(x, y); rotate(e.phase + k * .35); diamond(0, 0, max(2, 7 - k * .65)); pop();
    }

    fill(C.blue);
    diamond(e.x, e.y, 9 + overdrive * 3);
    for (const f of e.followers) {
      fill(46, 51, 245, 145);
      diamond(f.x, f.y, f.size);
      fill(180, 242, 42, 90);
      circle(f.x, f.y, max(1.5, f.size * .22));
    }
  }
}

function drawSmoke(frontLayer) {
  const p = pollution / 100;
  for (const s of smoke) {
    if ((frontLayer ? 1 : 0) !== s.depth) continue;

    if (s.legacyFactorySmoke || s.kind === 'factoryV21') {
      const fadeIn = constrain(s.age / .42, 0, 1);
      const fadeOut = 1 - constrain((s.age / s.life - .72) / .28, 0, 1);
      const alpha = fadeIn * fadeOut * (57 + pollution * .33) * (frontLayer ? 1.0 : .91) * completionSmokeVisibility();
      drawIndustrySmokeV21(s, alpha);
      continue;
    }

    const fadeIn = constrain(s.age / .30, 0, 1);
    const fadeOut = 1 - constrain((s.age / s.life - .72) / .28, 0, 1);
    const alpha = fadeIn * fadeOut * (35 + p * 43) * (frontLayer ? .91 : .72) * completionSmokeVisibility();
    drawSmokeGlyph(s, alpha);
  }
}

function drawIndustrySmokeV21(s, alpha) {
  push();
  translate(s.x, s.y);
  rotate(s.rot);
  applyGenerativeSmokeShape(s);
  noStroke();

  const p = pollutionN();
  const greyA = alpha * .92;
  const family = floor(abs(s.plumeSeed || s.seed)) % INDUSTRY_SMOKE_OUTER.length;
  const warmBias = constrain(max(0, p - .35) * .85 + max(0, 1 - s.age / max(.001, s.life)) * .22, 0, 1);
  const outerGrey = lerpColor(color(82, 87, 98), color(92, 77, 58), warmBias);
  const midGrey = lerpColor(color(104, 110, 122), color(112, 92, 65), warmBias);

  if (s.accent === 'orange') fill(255, 122, 26, alpha * .20);
  else if (s.accent === 'violet') fill(108, 88, 232, alpha * .15);
  else fill(red(outerGrey), green(outerGrey), blue(outerGrey), greyA * .26);
  polygonFromPoints(INDUSTRY_SMOKE_OUTER[family], s.size * .92);

  if (s.accent === 'orange') fill(255, 122, 26, alpha * .30);
  else if (s.accent === 'violet') fill(108, 88, 232, alpha * .22);
  else fill(red(midGrey), green(midGrey), blue(midGrey), greyA * .42);
  polygonFromPoints(INDUSTRY_SMOKE_MID[family], s.size * .90);

  if (alpha > 22 && s.size < 88) {
    const core = lerpColor(color(30, 31, 40), color(50, 40, 28), warmBias * .65);
    fill(red(core), green(core), blue(core), alpha * .16);
    polygonFromPoints(INDUSTRY_SMOKE_CORE[family], s.size * .88);
  }
  pop();
}



function drawSmokeGlyph(s, alpha) {
  push();
  translate(s.x, s.y);
  rotate(s.rot);
  applyGenerativeSmokeShape(s);
  noStroke();

  const p = pollutionN();
  const sourceHeat = smooth01(map(s.age / max(.001, s.life), 0, .26, 1, 0));
  const outerA = alpha * .24;
  const innerA = alpha * .46;
  const outerGrey = lerpColor(color(72, 78, 92), color(88, 74, 56), constrain(max(0, p - .36) * .88 + sourceHeat * .16, 0, 1));
  const innerGrey = lerpColor(color(96, 103, 116), color(110, 90, 64), constrain(max(0, p - .34) * .94 + sourceHeat * .22, 0, 1));

  if (s.accent === 'orange') fill(255, 122, 26, outerA * .54);
  else if (s.accent === 'violet') fill(108, 88, 232, outerA * .48);
  else fill(red(outerGrey), green(outerGrey), blue(outerGrey), outerA * .96);
  smokeFamily(s.family, s.size * .94);

  if (s.accent === 'orange') fill(255, 122, 26, innerA * .52);
  else if (s.accent === 'violet') fill(108, 88, 232, innerA * .44);
  else fill(red(innerGrey), green(innerGrey), blue(innerGrey), innerA * .92);
  smokeFamily((s.family + 2) % 6, s.size * .65);

  const core = lerpColor(color(30, 31, 36), color(54, 42, 30), constrain(sourceHeat * .36 + max(0, p - .46) * .40, 0, 1));
  fill(red(core), green(core), blue(core), alpha * .15);
  smokeFamily((s.family + 4) % 6, s.size * .24);
  pop();
}


function smokeFamily(family, s) {
  polygonFromPoints(SMOKE_FAMILY_POINTS[family] || SMOKE_FAMILY_POINTS[0], s);
}

function drawCarbon(frontLayer) {
  noStroke();
  for (const c of carbonDust) {
    if ((frontLayer ? 1 : 0) !== c.depth) continue;
    const fade = c.settled ? 1 : 1 - constrain((c.age / c.life - .80) / .20, 0, 1);
    const dustColor = c.settled
      ? color(205, 198, 188)
      : lerpColor(color(248, 246, 240), color(224, 217, 205), constrain(c.age / c.life, 0, 1));
    fill(red(dustColor), green(dustColor), blue(dustColor), (frontLayer ? 192 : 148) * fade);
    push(); translate(c.x, c.y); rotate(c.rot); drawShard(c.shape, c.size); pop();
  }
}

function drawAsh() {
  noStroke();
  for (const a of ash) {
    fill(a.settled ? 55 : 88, a.settled ? 55 : 88, a.settled ? 61 : 94, 175);
    push(); translate(a.x, a.y); rotate(a.rot); drawShard(2, a.size); pop();
  }
}

function drawDebris() {
  noStroke();
  for (const d of debris) {
    push();
    translate(d.x, d.y);
    rotate(d.rot);
    drawDebrisIdentity(d);
    pop();
  }
}

function drawDebrisIdentity(d) {
  const s = d.size;
  if (d.source === 'tree') {
    fill(lerpColor(color(103, 111, 77, 185), color(66, 68, 63, 190), constrain(pollution / 100, 0, 1)));
    irregularCrown(s * 1.35, 5 + (d.partIndex % 3), d.identitySeed, .7);
    return;
  }

  if (d.source === 'house') {
    fill(82, 83, 90, 185);
    if (d.partIndex === 1) polygon([[-1.25*s,.15*s],[-.35*s,-.82*s],[1.15*s,-.30*s],[.92*s,.42*s],[-.36*s,.72*s]]);
    else if (d.partIndex === 2 || d.partIndex === 3) rect(0, 0, s * .92, s * 1.08);
    else if (d.partIndex === 4) rect(0, 0, s * .86, s * 1.55);
    else if (d.partIndex === 5) rect(0, 0, s * .42, s * 1.35);
    else polygon([[-1.1*s,-.55*s],[.85*s,-.70*s],[1.02*s,.38*s],[-.72*s,.75*s]]);
    return;
  }

  if (d.source === 'pole') {
    fill(60, 61, 67, 190);
    if (d.partIndex === 1 || d.partIndex === 4) rect(0, 0, s * 2.4, s * .34);
    else if (d.partIndex === 2 || d.partIndex === 3) rect(0, 0, s * .42, s * 1.35);
    else rect(0, 0, s * .46, s * 2.3);
    return;
  }

  fill(47, 48, 54, 192);
  if (d.partIndex === 2 || d.partIndex === 3 || d.partIndex === 6) rect(0, 0, s * .62, s * 2.2);
  else if (d.partIndex === 1) polygon([[-1.2*s,.34*s],[-.5*s,-.7*s],[.1*s,-.15*s],[.6*s,-.82*s],[1.2*s,.28*s]]);
  else if (d.partIndex === 4 || d.partIndex === 5) rect(0, 0, s * 1.05, s * .82);
  else polygon([[-1.25*s,-.62*s],[1.05*s,-.45*s],[1.15*s,.56*s],[-.95*s,.72*s]]);
}

function drawShard(shape, s) {
  if (shape === 0) rect(0, 0, s * 1.25, s * .55);
  else if (shape === 1) diamond(0, 0, s);
  else polygonFromPoints(SHARD_SHAPE_POINTS[shape] || SHARD_SHAPE_POINTS[4], s);
}

// ------------------------------------------------------------

function houseChimney(v) {
  return [{x:24,top:-78,bottom:-36},{x:34,top:-78,bottom:-35},
    {x:26,top:-87,bottom:-42},{x:22,top:-67,bottom:-20}][((v%4)+4)%4];
}

// One transform for the factory silhouette and its emission origins.
function factoryRenderPose(f) {
  const pose = objectVisualPose(f);
  const hovered = hoveredNode && hoveredNode.id === f.id && !dragState;
  const progress = hovered ? constrain((sceneTime - hoverStarted) / DEMAND_HOLD, 0, 1) : 0;
  const shake = f.activity > .12 ? sin(sceneTime * 8 + f.seed) * (.09 + f.activity * .10 + overdrive * .03) : 0;
  return {
    x: f.x + pose.x + shake, y: f.y + pose.y,
    rot: f.rot + pose.rot + (hovered ? sin(sceneTime * 3.2 + f.seed) * .002 * progress : 0),
    scale: f.s * (pose.scale || 1)
  };
}
