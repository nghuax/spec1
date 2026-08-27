// BACKGROUND / ATMOSPHERE
// ------------------------------------------------------------

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

  const fade = 1 - p * .58;
  const drift = p * 20;
  const blueField = lerpColor(color(43, 62, 255), color(57, 68, 128), p * .68);
  const violetField = lerpColor(color(110, 90, 236), color(77, 69, 108), p * .72);
  const limeField = lerpColor(color(195, 245, 43), color(138, 120, 58), p * .92);
  const orangeField = lerpColor(color(255, 123, 31), color(172, 86, 36), p * .62);
  const paperField = lerpColor(color(244, 241, 236), color(192, 184, 170), p * .54);

  fill(red(blueField), green(blueField), blue(blueField), 28 * fade);
  polygon([[0, 0], [548 - drift, 0], [430 + drift * .22, 212 + drift * .25], [0, 344]]);

  fill(red(violetField), green(violetField), blue(violetField), 18 * (fade + p * .12));
  polygon([[W * .70 - drift * .22, H], [W, H], [W, H * .70 + drift], [W * .83 + drift * .15, H * .84]]);

  fill(red(blueField), green(blueField), blue(blueField), 10 * (fade + .16));
  polygon([[W * .20, H * .10], [W * .61, H * .12], [W * .74, H * .36], [W * .28, H * .46]]);

  fill(red(limeField), green(limeField), blue(limeField), 9 * max(.08, fade));
  polygon([[W * .39, H * .73], [W * .55, H * .67], [W * .62, H * .83], [W * .45, H * .89]]);

  fill(red(orangeField), green(orangeField), blue(orangeField), 11 + p * 6);
  polygon([[W * .86, 0], [W, 0], [W, H * .18 + drift * .45], [W * .91 - drift * .08, H * .12]]);

  fill(red(paperField), green(paperField), blue(paperField), 4 + fade * 5);
  polygon([[W * .04, H * .78], [W * .16, H * .74], [W * .22, H * .90], [W * .08, H * .96]]);

  for (let i = 0; i < ambientFragments.length; i++) {
    const a = ambientFragments[i];
    const local = samplePollution(a.x, a.y);
    if (local > .82 && noise(i * .13, sceneTime * .02) < .48) continue;
    push();
    translate(a.x + sin(sceneTime * .11 + a.phase) * a.drift, a.y + cos(sceneTime * .14 + a.phase) * a.drift * .7);
    rotate(a.rot + sceneTime * a.spin);
    if (a.kind === 'blue') fill(red(blueField), green(blueField), blue(blueField), 190 * (1 - local * .72));
    else if (a.kind === 'lime') fill(red(limeField), green(limeField), blue(limeField), 150 * (1 - local * .46));
    else if (a.kind === 'paper') fill(244, 241, 236, 175 * (1 - local * .62));
    else fill(red(orangeField), green(orangeField), blue(orangeField), 135 * (1 - local * .52));
    drawShard(a.shape, a.size);
    pop();
  }
}


function drawSmokeCeiling() {
  const p = pollutionN();
  if (smokeCeiling < 2 || p < .08) return;

  noStroke();
  for (let layer = 0; layer < 6; layer++) {
    const alpha = 4 + p * (8 + layer * 2.2);
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
    for (let i = 0; i < FIELD_COLS; i += 3) {
      const x = (i + .5) / FIELD_COLS * W;
      const local = getColumnPollution(x);
      if (local < .22) continue;
      const y = getCeilingDepthAtX(x, 5) * .58;
      const w = 120 + local * 220;
      const h = 34 + local * 92;
      const cloud = lerpColor(color(46, 47, 53), color(82, 66, 48), constrain((p - .4) * 1.2 + local * .2, 0, 1));
      fill(red(cloud), green(cloud), blue(cloud), (local * 12 + p * 4));
      push(); translate(x, y); rotate((noise(i * 3.2, sceneTime * .01) - .5) * .07);
      scale(1, constrain(h / max(1, w), .28, .62));
      smokeFamily(i % 6, w * .38);
      pop();
    }
  }
}


function drawStains() {
  const p = pollution / 100;
  if (p < .12) return;
  noStroke();
  for (const s of stains) {
    if (s.accent === 'orange') fill(255, 122, 26, s.a * .42 * p);
    else if (s.accent === 'violet') fill(108, 88, 232, s.a * .45 * p);
    else fill(62, 64, 70, s.a * 1.2 * p);
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
    fill(red(veil), green(veil), blue(veil), 1.5 + p * 4.8);
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


function drawPatches() {
  const p = pollution / 100;
  for (const g of patches) {
    const owner = g.ownerType === 'house'
      ? houses.find(h => h.id === g.ownerId)
      : g.ownerType === 'factory'
        ? factories.find(f => f.id === g.ownerId)
        : null;
    const q = owner ? formationProgress(owner, 0) : 1;
    if (q <= .001) continue;
    groundPatch(g.x, g.y, g.w, g.r, p, q);
  }
}

// ------------------------------------------------------------
// WORLD DRAW
// ------------------------------------------------------------

function drawWorldSorted() {
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
  // Keep the structural base of houses/factories pinned to the ground while it
  // assembles. Other parts can still fly in, preserving the generative motion.
  const anchoredArchitectureBase = index === 0 && (o.kind === 'house' || o.kind === 'factory');
  push();
  translate(
    a.x * inv * (anchoredArchitectureBase ? .16 : 1),
    anchoredArchitectureBase ? 0 : a.y * inv
  );
  rotate(a.r * inv * (anchoredArchitectureBase ? .08 : 1));
  scale(lerp(anchoredArchitectureBase ? .90 : a.sc, 1, q));
  drawingContext.globalAlpha = constrain(q * 1.12, 0, 1);
  fn(q);
  drawingContext.globalAlpha = 1;
  pop();
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

  const driftX = sin(sceneTime * .22 + h.seed * .73) * (.35 + damage * .25)
    + (noise(h.seed * .011, sceneTime * .08) - .5) * .55;
  const driftY = cos(sceneTime * .18 + h.seed * .41) * (.22 + damage * .16)
    + (noise(h.seed * .017 + 40, sceneTime * .07) - .5) * .38;

  push();
  translate(h.x + driftX, h.y + driftY);
  rotate(h.rot + sin(sceneTime * .11 + h.seed) * .0018 * damage + sin(sceneTime * .19 + h.seed * .31) * .0015 + (hovered ? sin(sceneTime * 3 + h.seed) * .0018 : 0));
  scale(h.s);
  noStroke();

  fill(20, 20, 20, 16 + soot * 28);
  ellipse(0, 8, 108, 12);

  withFormPart(h, 0, () => {
    push(); translate(5, 5); fill(lerpColor(color(110, 116, 128), color(45, 48, 56), soot)); houseBody(h.variant); pop();
    fill(structuralBodyColor(C.paper, soot, damage));
    houseBody(h.variant);
  });

  withFormPart(h, 1, () => {
    push();
    translate(0, -demand * 4.5);
    rotate((hovered ? sin(sceneTime * 4.4 + h.seed) : 0) * .008 * hoverProgress);
    const roofIdle = mixColor(C.blue, C.heatDeep, demand * .20 + damage * .12);
    const roofLive = lerpColor(color(C.blue), color(C.heat), constrain(glowCharge * .16 + damage * .08, 0, .28));
    fill(charge > .03 ? roofLive : roofIdle);
    polygon([[-55, -42], [-18, -76], [57, -51], [55, -36], [-18, -60]]);
    pop();
  });

  const warmWin = lerpColor(color(C.ink), color(255, 212, 132), constrain(glowCharge * 1.15, 0, 1));
  const coolWin = lerpColor(color(C.ink), energyGlowColor(glowCharge, damage), constrain(glowCharge * 1.10, 0, 1));
  withFormPart(h, 2, () => { fill(lerpColor(warmWin, color(C.sootDeep), damage * .24)); rect(-26, -44, 16, 18); });
  withFormPart(h, 3, () => { fill(lerpColor(coolWin, color(C.sootDeep), damage * .20)); rect(2, -47, 18, 18); });
  withFormPart(h, 4, () => { fill(lerpColor(color(C.ink), color(90, 74, 56), constrain(soot * .34 + damage * .46, 0, 1))); rect(18, -16, 23, 38); });
  withFormPart(h, 5, () => { fill(damage > .62 ? C.heatDeep : C.ink); rect(32, -50 - demand * 2, 8, 17 + demand * 4); });

  if (demand > .08) {
    for (let i = 0; i < 3; i++) {
      const a = sceneTime * (.7 + i * .12) + h.seed + i * TWO_PI / 3;
      const ember = emberAccentColor(demand);
      fill(red(ember), green(ember), blue(ember), 70 + demand * 90);
      diamond(cos(a) * (46 + i * 5), -39 + sin(a) * 18, 4 + demand * 3);
    }
  }

  if (glowCharge > .03 && !h.detached[0]) {
    const pulse = .82 + .18 * sin(sceneTime * 3.5 + h.seed);
    const barCol = energyGlowColor(glowCharge, damage);
    fill(red(barCol), green(barCol), blue(barCol), 18 + glowCharge * 34 * pulse);
    rect(-10, -43, 67, 31);
  }

  if (h.powerPulse > .02) {
    const pulseCol = energyGlowColor(h.powerPulse, damage);
    noFill(); stroke(red(pulseCol), green(pulseCol), blue(pulseCol), 82 * h.powerPulse); strokeWeight(2);
    line(-62, -7, 60 + 18 * h.powerPulse, -7);
    line(-50, 7, 35 + 12 * h.powerPulse, 7);
    noStroke();
  }
  pop();
}


function houseBody(v) {
  beginShape();
  if (v === 1) {
    vertex(-54, 0); vertex(-54, -42); vertex(-20, -72); vertex(53, -54); vertex(58, -13); vertex(22, 0);
  } else if (v === 2) {
    vertex(-56, 0); vertex(-54, -45); vertex(-10, -72); vertex(56, -48); vertex(54, -12); vertex(20, 0);
  } else if (v === 3) {
    vertex(-54, 0); vertex(-52, -39); vertex(-18, -76); vertex(54, -51); vertex(58, -15); vertex(25, 0);
  } else {
    vertex(-54, 0); vertex(-54, -42); vertex(-16, -74); vertex(56, -50); vertex(56, -12); vertex(24, 0);
  }
  endShape(CLOSE);
  rect(-18, -8, 38, 20);
}

function drawTree(t) {
  const damage = getObjectDamageLevel(t);
  const local = t.localAir || 0;
  const health = constrain(t.health, 0, 1);
  const sway = sin(sceneTime * .38 + t.seed) * (.006 + health * .004);
  const driftX = sin(sceneTime * .26 + t.seed * .52) * (.65 + (1 - health) * .35)
    + (noise(t.seed * .014, sceneTime * .09) - .5) * .72;
  const driftY = cos(sceneTime * .21 + t.seed * .36) * (.32 + (1 - health) * .18)
    + (noise(t.seed * .019 + 23, sceneTime * .08) - .5) * .42;

  push();
  translate(t.x + driftX, t.y + driftY);
  rotate(t.rot + sway + sin(sceneTime * 1.9 + t.seed) * damage * .004 + sin(sceneTime * .27 + t.seed * .18) * .0032);
  scale(t.s);
  noStroke();

  fill(15, 16, 18, 10 + local * 24);
  ellipse(2, 2, 76, 11);

  withFormPart(t, 0, q => {
    const trunkBase = treeLifeColor(max(.02, health * .42), damage);
    const trunkTone = lerpColor(color(72, 51, 28), trunkBase, .34);
    fill(trunkTone);
    beginShape();
    vertex(-6, 0);
    vertex(-4.5, -72 * q);
    vertex(1.5, -91 * q);
    vertex(6, -70 * q);
    vertex(5, 0);
    endShape(CLOSE);

    stroke(trunkTone);
    strokeWeight(7);
    line(0, -54 * q, -23 * q, -77 * q);
    line(1, -62 * q, 25 * q, -88 * q);
    strokeWeight(4);
    line(-15 * q, -69 * q, -29 * q, -88 * q);
    noStroke();
  });

  const crowns = treeCrownParts(t.variant);
  for (let i = 0; i < crowns.length; i++) {
    withFormPart(t, i + 1, q => {
      const c = crowns[i];
      const micro = sin(sceneTime * (.20 + i * .025) + t.seed + i * 1.41);
      push();
      translate(c.x + micro * (1.4 + damage * 4.5), c.y + damage * c.drop);
      rotate(c.r + micro * .012 * health + damage * c.breakDir);

      const crownColor = treeLifeColor(health - i * .03, damage);
      fill(crownColor);
      drawTreePlate(c.w * q, c.h * q, c.cut, t.seed + i * 53, damage);

      if (q > .68 && health > .12) {
        fill(lerpColor(color(C.ink), color(C.treeBrown), constrain(damage * .52 + (1 - health) * .30, 0, 1)));
        const notch = c.cut % 3;
        if (notch === 0) polygon([[-c.w*.10,-c.h*.04],[c.w*.10,-c.h*.15],[c.w*.02,c.h*.08]]);
        else if (notch === 1) polygon([[c.w*.06,-c.h*.20],[c.w*.25,-c.h*.08],[c.w*.13,c.h*.06]]);
        else polygon([[-c.w*.22,-c.h*.06],[-c.w*.03,-c.h*.15],[-c.w*.08,c.h*.08]]);
      }
      pop();
    });
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
  const poleBody = lit
    ? lerpColor(color(17, 20, 34), color(40, 50, 88), currentAlive * .34)
    : lerpColor(color(C.ink), color(70, 71, 76), soot * .60 + damage * .16);
  const crossBody = lit
    ? lerpColor(color(22, 24, 36), color(54, 68, 118), currentAlive * .38)
    : color(C.ink);

  push();
  translate(po.x, po.y);
  rotate(po.rot + sin(sceneTime * .18 + po.seed) * .003 * damage);
  scale(po.s);
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
    polygon([[-52*q,-145],[-46*q,-151],[40*q,-151],[54*q,-144],[40*q,-138],[-47*q,-139]]);
    stroke(crossBody); strokeWeight(4);
    line(-3, -143, -31 * q, -123);
    line(3, -143, 30 * q, -124);
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
    const sag = 22 + abs(p2.x - p1.x) * .022 + damage * 30;
    const midX = (p1.x + p2.x) * .5;
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

    stroke(8, 9, 13, 95);
    strokeWeight(1.8);
    bezier(p1.x, p1.y + 8, lerp(p1.x, midX, .68), p1.y + sag + 12, lerp(midX, p2.x, .32), p2.y + sag + 12, p2.x, p2.y + 8);
  }
  pop();
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

  push();
  translate(f.x, f.y);
  const shake = hot ? sin(sceneTime * 8 + f.seed) * (.06 + f.activity * .10 + overdrive * .05) : 0;
  translate(shake, 0);
  rotate(f.rot + (hovered ? sin(sceneTime * 3.2 + f.seed) * .002 * hoverProgress : 0));
  scale(f.s);
  noStroke();

  fill(20, 20, 20, 17 + f.soot * 26);
  ellipse(0, 82, 270, 18);

  const chimneys = factoryChimneys(f.variant);
  withFormPart(f, 2, q => drawFactoryChimney(chimneys[0], min(1, q + demand * .08), hot || demand > .6, f.soot));
  withFormPart(f, 3, q => { if (chimneys[1]) drawFactoryChimney(chimneys[1], min(1, q + demand * .12), hot || demand > .6, f.soot); });

  withFormPart(f, 0, () => {
    push(); translate(5, 5); fill(lerpColor(color(104, 109, 120), color(42, 45, 54), f.soot)); factoryBaseBody(f.variant); pop();
    fill(structuralBodyColor(C.light, f.soot, damage));
    factoryBaseBody(f.variant);
  });

  withFormPart(f, 1, () => {
    push(); translate(0, -demand * 3);
    fill(lerpColor(structuralBodyColor(C.light, f.soot * .92, damage), color(120, 102, 84), constrain(max(0, pollutionN() - .62) * .60, 0, 1)));
    polygon([[-136,-34],[-108,-58],[-108,-96],[-72,-72],[-34,-106],[0,-78],[28,-104],[68,-66],[136,-40],[136,4],[-136,4]]);
    pop();
  });

  const moduleColor = energyGlowColor(currentLive, damage);
  withFormPart(f, 4, () => { const cc = hot ? emberAccentColor(currentLive) : live ? moduleColor : lerpColor(color(C.ink), color(emberAccentColor(demand)), demand * .55); fill(cc); rect(-72, 18, 22, 23); });
  withFormPart(f, 5, () => { const cc = hot ? emberAccentColor(currentLive) : live ? moduleColor : lerpColor(color(C.ink), color(emberAccentColor(demand)), demand * .36); fill(cc); rect(-34, 18, 22, 23); rect(4, 18, 22, 23); });
  withFormPart(f, 6, () => { fill(hot ? emberAccentColor(currentLive) : live ? lerpColor(moduleColor, color(C.violet), .35) : C.ink); rect(78, 28, 28, 48); });

  if (!f.detached[0]) {
    const lineCol = energyGlowColor(currentLive, damage);
    fill(red(lineCol), green(lineCol), blue(lineCol));
    rect(0, 80, 240 * (1 - damage * .28), 6);
    if (demand > .04) {
      const demandCol = emberAccentColor(demand);
      fill(red(demandCol), green(demandCol), blue(demandCol));
      rect(-106 + demand * 64, 60, 42 + demand * 64, 5);
    }
  }

  if (demand > .08) {
    for (let i = 0; i < 4; i++) {
      const a = sceneTime * (.55 + i * .09) + f.seed + i * 1.8;
      push();
      translate(-42 + i * 28 + cos(a) * 5, -48 + sin(a * 1.2) * 9);
      rotate(a * .18);
      const ember = emberAccentColor(demand);
      fill(red(ember), green(ember), blue(ember), 60 + demand * 85);
      drawShard(i % 4, 4 + demand * 3 + sin(a) * 1.2);
      pop();
    }
  }

  if (f.powerPulse > .02) {
    const pulseCol = energyGlowColor(f.powerPulse, damage);
    noFill(); stroke(red(pulseCol), green(pulseCol), blue(pulseCol), 86 * f.powerPulse); strokeWeight(2);
    line(-145, 92, 145 + f.powerPulse * 18, 92);
    noStroke();
  }
  pop();
}


function factoryBaseBody(v) {
  beginShape();
  vertex(-136, 80);
  vertex(-136, -34);
  vertex(136, -40);
  vertex(136, 80);
  endShape(CLOSE);
}

function factoryChimneys(v) {
  if (v === 1) return [{x:34,y:-124,w:24,h:126},{x:72,y:-111,w:20,h:104}];
  if (v === 2) return [{x:62,y:-142,w:27,h:160}, null];
  return [{x:58,y:-128,w:25,h:142}, null];
}

function drawFactoryChimney(c, q, hot, soot = 0) {
  if (!c) return;
  const h = c.h * q;
  const stack = lerpColor(color(C.ink), color(54, 55, 60), soot * .45 + pollutionN() * .12);
  fill(stack);
  beginShape();
  vertex(c.x - c.w * .50, c.y + c.h * .50);
  vertex(c.x - c.w * .40, c.y + c.h * .50 - h);
  vertex(c.x + c.w * .40, c.y + c.h * .50 - h);
  vertex(c.x + c.w * .50, c.y + c.h * .50);
  endShape(CLOSE);
  const cap = hot ? emberAccentColor(.75) : mixColor(C.grey, C.soot, pollutionN() * .38);
  fill(cap);
  rect(c.x, c.y + c.h * .50 - h - 2, c.w * .86, 5);
  fill(C.ink);
  rect(c.x, c.y + c.h * .50 - h - 5, c.w * .62, 3);
}


function machineHopperPoint() {
  return { x: MACHINE.x, y: MACHINE.y - 218 * MACHINE.scale };
}

function machineDemandPoint() {
  return { x: MACHINE.x + 64 * MACHINE.scale, y: MACHINE.y - 32 * MACHINE.scale };
}

function machineEnergyPoint() {
  return { x: MACHINE.x + 108 * MACHINE.scale, y: MACHINE.y + 14 * MACHINE.scale };
}

function drawFurnace() {
  const p = pollution / 100;
  const hover = dist(mouseX, mouseY, MACHINE.x, MACHINE.y - 50 * MACHINE.scale) < 138;
  const active = burnCount > 0 || burnPulse > .02;
  const level = active ? constrain(.20 + burnPulse * .70 + min(1, burnCount / 12) * .24 + overdrive * .35, 0, 1) : 0;
  const shakeX = active ? (sin(sceneTime * 10.8) * (.45 + level * .65 + overdrive * .75) + sin(sceneTime * 23.0) * (.08 + level * .12 + overdrive * .22)) : 0;
  const shakeY = active ? cos(sceneTime * 12.4) * (.15 + level * .26 + overdrive * .32) : 0;
  const tilt = active ? sin(sceneTime * 5.8) * (.002 + level * .005 + overdrive * .006) : 0;
  const pump = 1 + feedPulse * .005;

  push();
  translate(MACHINE.x + shakeX, MACHINE.y + feedPulse * 1.7 + shakeY);
  rotate(tilt);
  scale(MACHINE.scale * pump);
  noStroke();

  fill(12, 12, 15, 18 + p * 18);
  ellipse(0, 170, 320, 26);

  fill(C.blue);
  rect(0, 160, 262, 9);

  push(); translate(5, 5); fill(104, 109, 120); furnaceBody(); hopperShape(); pop();
  fill(C.light);
  furnaceBody();

  fill(C.ink);
  rect(0, 30, 126, 96);
  fill(burnPulse > .02 ? C.orange : burnCount > 0 ? lerpColor(color(C.violet), color(C.orange), .44) : C.grey);
  rect(0, 30, 82 + burnPulse * 8, 54 + burnPulse * 6);

  fill(C.paper);
  hopperShape();
  fill(C.ink);
  quad(-68, -218, 68, -218, 51, -187, -51, -187);
  fill(C.blue);
  rect(0, -203, 74 + feedPulse * 8, 6);

  push();
  translate(-92, -10);
  for (let i = 0; i < 8; i++) {
    const on = i < min(8, floor(map(burnCount, 0, 20, 0, 8)));
    fill(on ? (i % 3 === 0 ? C.orange : C.blue) : C.grey);
    rect(0, 98 - i * 13, 14, 5);
  }
  fill(C.ink); textAlign(CENTER, TOP); textStyle(BOLD); textSize(9); text(`${burnCount}`, 0, 112);
  fill(burnCount ? C.orange : C.grey); textSize(7); text(burnPulse > .1 ? 'BURN' : burnCount ? 'ONLINE' : 'IDLE', 0, 128);
  pop();

  fill(C.ink); rect(82, 92, 34, 12);
  if (active) {
    fill(C.orange); rect(82, 92, 18 + level * 12, 4);
    stroke(C.ink); strokeWeight(2);
    line(-146, 122, -158 + sin(sceneTime * 16) * 5, 130);
    line(148, 120, 160 + cos(sceneTime * 17) * 5, 128);
    noStroke();
  }
  if (burnPulse > .02) drawSpark(0, 30, 21 + sin(sceneTime * 8) * 2 + burnPulse * 5 + overdrive * 6);
  if (overdrive > .12) {
    for (let i = 0; i < 6; i++) {
      const a = sceneTime * (1.6 + i * .08) + i * TWO_PI / 6;
      push(); translate(cos(a) * (105 + overdrive * 22), -15 + sin(a) * (75 + overdrive * 18)); rotate(a);
      fill(i % 2 ? C.orange : C.blue); drawShard(i % 5, 4 + overdrive * 5); pop();
    }
  }
  if (hover && !dragState) {
    noFill(); stroke(C.blue); strokeWeight(2); line(-55, -250, 55, -250); noStroke();
  }
  pop();
}

function furnaceBody() {
  beginShape();
  vertex(-126, 138); vertex(-126, -72); vertex(-88, -108); vertex(86, -108); vertex(126, -70); vertex(126, 138);
  endShape(CLOSE);
  rect(0, 150, 284, 24);
}

function hopperShape() {
  quad(-92, -242, 92, -242, 58, -176, -58, -176);
  rect(0, -142, 54, 68);
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

  push();
  translate(3.5, 3.5);
  fill(lerpColor(emberDeep, ember, .45));
  coalShape(c.type, c.size * 1.02);
  pop();

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
    translate(f.x, f.y);
    rotate(f.rot);
    fill(C.ink); noStroke(); coalShape(f.type, f.size);
    fill(C.orange); rect(-f.size * .08, -f.size * .04, f.size * .20, max(2, f.size * .07));
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
      const alpha = fadeIn * fadeOut * (61 + pollution * .36) * (frontLayer ? 1.03 : .96);
      drawIndustrySmokeV21(s, alpha);
      continue;
    }

    const fadeIn = constrain(s.age / .30, 0, 1);
    const fadeOut = 1 - constrain((s.age / s.life - .72) / .28, 0, 1);
    const alpha = fadeIn * fadeOut * (38 + p * 48) * (frontLayer ? .94 : .76);
    drawSmokeGlyph(s, alpha);
  }
}

function drawIndustrySmokeV21(s, alpha) {
  push();
  translate(s.x, s.y);
  rotate(s.rot);
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
  polygonFromPoints(INDUSTRY_SMOKE_OUTER[family], s.size);

  if (s.accent === 'orange') fill(255, 122, 26, alpha * .30);
  else if (s.accent === 'violet') fill(108, 88, 232, alpha * .22);
  else fill(red(midGrey), green(midGrey), blue(midGrey), greyA * .42);
  polygonFromPoints(INDUSTRY_SMOKE_MID[family], s.size);

  if (alpha > 22 && s.size < 88) {
    const core = lerpColor(color(30, 31, 40), color(50, 40, 28), warmBias * .65);
    fill(red(core), green(core), blue(core), alpha * .16);
    polygonFromPoints(INDUSTRY_SMOKE_CORE[family], s.size);
  }
  pop();
}



function drawSmokeGlyph(s, alpha) {
  push();
  translate(s.x, s.y);
  rotate(s.rot);
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
  smokeFamily(s.family, s.size * 1.02);

  if (s.accent === 'orange') fill(255, 122, 26, innerA * .52);
  else if (s.accent === 'violet') fill(108, 88, 232, innerA * .44);
  else fill(red(innerGrey), green(innerGrey), blue(innerGrey), innerA * .92);
  smokeFamily((s.family + 2) % 6, s.size * .70);

  const core = lerpColor(color(30, 31, 36), color(54, 42, 30), constrain(sourceHeat * .36 + max(0, p - .46) * .40, 0, 1));
  fill(red(core), green(core), blue(core), alpha * .15);
  smokeFamily((s.family + 4) % 6, s.size * .26);
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
