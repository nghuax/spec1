
/*
ADAPTS V24 — BALANCED ECOLOGY

Cleaner rebuild:
- calmer, more balanced composition
- full-frame distribution without obvious zoning
- fewer harsh visuals
- restrained organic drift
- SUN/WIND interaction preserved
*/

const C = {
  ink: '#141414',
  bg0: '#17181C',
  bg1: '#83888C',
  bg2: '#F2EEE6',
  white: '#FFFFFF',
  paper: '#F4F1EA',
  soft: '#DAD7CF',
  grey: '#9EA2A3',
  darkGrey: '#494C50',
  blue: '#2033FF',
  purple: '#6952EB',
  orange: '#FE7D21',
  lime: '#B3FF3B',
  green: '#78C64B',
  leaf: '#4F8C3E',
  red: '#E65454',
  yellow: '#F1D652',
  pink: '#F37BC2',
  teal: '#40CBB5',
  brown: '#8C6346'
};

let modules = [];
let smoke = [];
let pollen = [];
let sunBursts = [];
let windLines = [];

let W = 0;
let H = 0;
let tm = 0;

let activeTool = 'sun';
let dragging = false;
let globalRecovery = 0;
let statusText = '';
let statusUntil = 0;
let finalTriggered = false;

let windFacing = 0;
let windFanAngle = 0;
let windFanSpeed = 0;
let lastMouseX = 0;
let lastMouseY = 0;
let windTrailCooldown = 0;

function setup() {
  pixelDensity(1);
  createCanvas(windowWidth, windowHeight).parent('app');
  frameRate(60);
  // HEAL integration: use the user-selected shared typeface across the system.
  textFont('Stack Sans Notch');
  regenerate();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  regenerate();
}

function regenerate() {
  W = width;
  H = height;
  tm = 0;

  modules = [];
  smoke = [];
  pollen = [];
  sunBursts = [];
  windLines = [];

  activeTool = 'sun';
  dragging = false;
  globalRecovery = 0;
  finalTriggered = false;

  buildModules();
  buildSmoke();

  setStatus('SUN SELECTED · REBUILD THE FIELD GRADUALLY', 3);
}

function randomKind() {
  const r = random();
  return r < 0.18 ? 'house'
    : r < 0.31 ? 'tree'
    : r < 0.45 ? 'flower'
    : r < 0.56 ? 'factory'
    : r < 0.68 ? 'farm'
    : r < 0.79 ? 'store'
    : r < 0.89 ? 'bush'
    : 'garden';
}

function scaleFor(kind) {
  if (kind === 'factory') return random(0.64, 0.88);
  if (kind === 'farm') return random(0.62, 0.86);
  if (kind === 'store') return random(0.60, 0.82);
  if (kind === 'house') return random(0.60, 0.84);
  if (kind === 'tree') return random(0.64, 0.92);
  if (kind === 'flower') return random(0.42, 0.70);
  if (kind === 'bush') return random(0.46, 0.68);
  return random(0.50, 0.76);
}

function spacingFor(kind) {
  if (kind === 'factory') return 84;
  if (kind === 'farm') return 74;
  if (kind === 'house') return 68;
  if (kind === 'store') return 64;
  if (kind === 'tree') return 62;
  if (kind === 'garden') return 52;
  if (kind === 'bush') return 46;
  return 40;
}

function buildModules() {
  const desired = floor(random(46, 58));
  const neededKinds = ['house', 'tree', 'flower', 'factory', 'farm', 'store', 'bush', 'garden'];
  const points = [];

  function valid(x, y, kind) {
    if (x < 395 && y < 175) return false;
    const space = spacingFor(kind);
    for (const p of points) {
      if (dist(x, y, p.x, p.y) < (space + p.space) * 0.5) return false;
    }
    return true;
  }

  let attempts = 0;
  while (modules.length < desired && attempts < 15000) {
    attempts++;
    const kind = modules.length < neededKinds.length ? neededKinds[modules.length] : randomKind();

    // Full-frame distribution with slight vertical weighting toward the center.
    let x = random(64, W - 64);
    let y = random(126, H - 112);
    if (random() < 0.48) y = constrain(randomGaussian(H * 0.58, H * 0.18), 120, H - 110);

    if (!valid(x, y, kind)) continue;

    const s = scaleFor(kind);
    modules.push(makeModule(modules.length, kind, x, y, s));
    points.push({ x, y, space: spacingFor(kind) });
  }
}

function makeModule(id, kind, x, y, s) {
  const partCount =
    kind === 'factory' ? 7 :
    kind === 'house' ? 6 :
    kind === 'store' ? 6 :
    kind === 'farm' ? 6 :
    kind === 'garden' ? 5 :
    kind === 'flower' ? 4 :
    kind === 'bush' ? 4 : 5;

  const mass =
    kind === 'factory' ? 1.15 :
    kind === 'farm' ? 1.00 :
    kind === 'house' ? 0.90 :
    kind === 'store' ? 0.82 :
    kind === 'tree' ? 0.70 :
    kind === 'garden' ? 0.50 :
    kind === 'bush' ? 0.42 : 0.34;

  const parts = [];
  for (let i = 0; i < partCount; i++) {
    parts.push({
      fx: random(-38, 38),
      fy: random(-34, 34),
      fr: random(-0.65, 0.65),
      delay: random(0, 0.16)
    });
  }

  const baseW =
    kind === 'factory' ? random(132, 184) :
    kind === 'farm' ? random(120, 178) :
    kind === 'garden' ? random(88, 132) :
    kind === 'flower' ? random(72, 108) :
    kind === 'bush' ? random(64, 96) :
    random(102, 156);

  const baseH =
    kind === 'flower' ? random(18, 28) :
    kind === 'bush' ? random(18, 28) :
    kind === 'garden' ? random(20, 32) :
    kind === 'tree' ? random(24, 38) :
    random(26, 42);

  return {
    id,
    kind,
    x,
    y,
    vx: random(-0.22, 0.22),
    vy: random(-0.18, 0.18),
    rot: random(-0.04, 0.04),
    s,
    mass,
    parts,
    platform: { w: baseW, h: baseH },
    sun: random(0, 0.02),
    wind: random(0, 0.02),
    seed: random(10000),
    phase: random(TWO_PI),
    floatAmp: random(6, 15),
    orbitAmp: random(3, 9),
    orbitSpeed: random(0.25, 0.8),
    hover: 0
  };
}

function buildSmoke() {
  const count = floor(random(130, 190));
  for (let i = 0; i < count; i++) {
    smoke.push({
      x: random(-50, W + 50),
      y: random(20, H * 0.88),
      vx: random(-0.08, 0.08),
      vy: random(-0.03, 0.04),
      rot: random(TWO_PI),
      vr: random(-0.006, 0.006),
      size: random(14, 42),
      life: random(0.82, 1.12),
      dark: random() > 0.25,
      phase: random(TWO_PI)
    });
  }
}

function draw() {
  const dt = min(deltaTime / 1000, 0.05);
  tm += dt;
  W = width;
  H = height;

  updateWindCursor(dt);
  updateModules(dt);
  updateSmoke(dt);
  updateParticles(dt);

  drawBackground();
  drawSmoke();
  drawPlatforms();
  drawModules();
  drawBurstsAndWind();
  drawPollen();
  drawHUD();
  drawWindCursor();
}

function drawBackground() {
  const bg = lerpColor(
    color(C.bg0),
    lerpColor(color(C.bg1), color(C.bg2), constrain(globalRecovery, 0, 1)),
    constrain(globalRecovery * 1.03, 0, 1)
  );
  background(bg);

  const veil = max(0, 110 - globalRecovery * 120);
  noStroke();
  fill(20, 20, 20, veil);
  rectMode(CORNER);
  rect(0, 0, W, H);
  rectMode(CENTER);

  // Subtle bottom horizon-like softness only.
  noStroke();
  fill(255, 16 + globalRecovery * 16);
  ellipse(W * 0.5, H + 40, W * 0.92, 180);
}

function flowAt(x, y, seedOff = 0) {
  const a = noise(x * 0.00135 + seedOff, y * 0.00125 + seedOff, tm * 0.06) * TWO_PI * 2.5;
  const m = map(noise(x * 0.0009 + 10, y * 0.0008 + 20, tm * 0.05 + seedOff), 0, 1, 0.18, 0.92);
  return { x: cos(a) * m, y: sin(a) * m };
}

function moduleRecovery(m) {
  const dual = min(m.sun, m.wind);
  return constrain(dual * 0.84 + (m.sun + m.wind) * 0.08, 0, 1);
}

function averageCharge(kind) {
  if (!modules.length) return 0;
  let t = 0;
  for (const m of modules) t += kind === 'sun' ? m.sun : m.wind;
  return t / modules.length;
}

function countRecovered() {
  let n = 0;
  for (const m of modules) if (moduleRecovery(m) > 0.72) n++;
  return n;
}

function updateModules(dt) {
  if (!modules.length) return;

  let total = 0;
  let recovered = 0;

  for (const m of modules) {
    const rec = moduleRecovery(m);
    total += rec;
    if (rec > 0.72) recovered++;

    const flow = flowAt(m.x, m.y, m.seed * 0.0001);
    const weight = 1 / (0.7 + m.mass * 0.85);
    const targetVx = flow.x * 1.22 * weight;
    const targetVy = flow.y * 0.92 * weight;

    const chaos = 1 - smoothClamp(rec, 0.12, 0.85);
    const extraX = (noise(m.seed, tm * 0.34) - 0.5) * 0.26 * chaos;
    const extraY = (noise(m.seed + 40, tm * 0.37) - 0.5) * 0.20 * chaos;

    m.vx = lerp(m.vx, targetVx + extraX, 0.04);
    m.vy = lerp(m.vy, targetVy + extraY, 0.04);

    m.x += m.vx * 60 * dt;
    m.y += m.vy * 60 * dt;
    m.rot = lerp(m.rot, sin(tm * 0.25 + m.seed) * 0.018 + m.vx * 0.018, 0.03);

    if (m.x < -80) m.x = W + 80;
    if (m.x > W + 80) m.x = -80;
    if (m.y < 88) m.y = H - 116;
    if (m.y > H - 26) m.y = 110;

    if (dist(mouseX, mouseY, m.x, m.y) < 84 * m.s) {
      m.hover = lerp(m.hover, 1, 0.12);
    } else {
      m.hover = lerp(m.hover, 0, 0.08);
    }

    if (rec > 0.62 && random() < 0.012 * dt * 60) {
      pollen.push({
        x: m.x + random(-10, 10),
        y: m.y - random(10, 32),
        vx: random(-0.12, 0.12),
        vy: random(-0.26, -0.06),
        size: random(4, 8),
        life: 1,
        col: random([C.lime, C.yellow, C.pink, C.teal, C.blue])
      });
    }
  }

  globalRecovery = lerp(globalRecovery, total / modules.length, 0.03);

  if (!finalTriggered && recovered >= ceil(modules.length * 0.82) && globalRecovery > 0.72) {
    finalTriggered = true;
    setStatus('ENVIRONMENT REGENERATED · THE FIELD IS ALIVE', 4);
    for (let i = 0; i < 18; i++) {
      sunBursts.push({
        x: random(80, W - 80),
        y: random(80, H - 120),
        r: random(12, 34),
        life: random(0.65, 1.0)
      });
    }
    for (const m of modules) {
      m.sun = max(m.sun, 0.96);
      m.wind = max(m.wind, 0.96);
    }
  }
}

function updateSmoke(dt) {
  const clear = constrain(averageCharge('wind') * 0.78 + averageCharge('sun') * 0.22 + globalRecovery * 0.42, 0, 1);

  for (const s of smoke) {
    const flow = flowAt(s.x, s.y, 200 + s.phase);
    s.vx += flow.x * 0.005;
    s.vy += flow.y * 0.003 - clear * 0.0007;
    s.vx *= 0.994;
    s.vy *= 0.994;
    s.x += s.vx * 60 * dt;
    s.y += s.vy * 60 * dt;
    s.rot += s.vr * 60 * dt;
    s.life = max(0.03, s.life - dt * (0.002 + clear * 0.018));

    if (s.x < -60) s.x = W + 60;
    if (s.x > W + 60) s.x = -60;
    if (s.y < -30) s.y = H + 20;
    if (s.y > H + 40) s.y = -20;
  }
}

function updateParticles(dt) {
  for (let i = sunBursts.length - 1; i >= 0; i--) {
    sunBursts[i].life -= dt * 1.1;
    sunBursts[i].r += dt * 220;
    if (sunBursts[i].life <= 0) sunBursts.splice(i, 1);
  }

  for (let i = windLines.length - 1; i >= 0; i--) {
    windLines[i].life -= dt * 1.45;
    windLines[i].x += windLines[i].dx * 4.5;
    windLines[i].y += windLines[i].dy * 4.5;
    if (windLines[i].life <= 0) windLines.splice(i, 1);
  }

  for (let i = pollen.length - 1; i >= 0; i--) {
    const p = pollen[i];
    const flow = flowAt(p.x, p.y, 500);
    p.vx = lerp(p.vx, flow.x * 0.75, 0.05);
    p.vy = lerp(p.vy, flow.y * 0.45 - 0.14, 0.05);
    p.x += p.vx * 60 * dt;
    p.y += p.vy * 60 * dt;
    p.life -= dt * 0.28;
    if (p.life <= 0) pollen.splice(i, 1);
  }
}

function smoothClamp(v, a, b) {
  const t = constrain((v - a) / max(0.0001, b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

function displayOffset(m, rec) {
  const t = smoothClamp(rec, 0.28, 1);
  const sway = lerp(m.floatAmp * 0.45, m.floatAmp, t);
  const orbit = lerp(0, m.orbitAmp, t);
  return {
    x:
      sin(tm * (0.42 + m.orbitSpeed * 0.5) + m.phase) * sway * 0.34 +
      cos(tm * (0.28 + m.orbitSpeed) + m.phase * 0.8) * orbit,
    y:
      cos(tm * (0.60 + m.orbitSpeed * 0.3) + m.phase * 1.1) * sway * 0.44 +
      sin(tm * (0.34 + m.orbitSpeed) + m.phase * 0.7) * orbit * 0.72,
    r: sin(tm * 0.32 + m.phase) * (0.015 + t * 0.025)
  };
}

function drawSmoke() {
  const clear = constrain(averageCharge('wind') * 0.78 + averageCharge('sun') * 0.22 + globalRecovery * 0.42, 0, 1);

  for (const s of smoke) {
    const alphaBase = (s.dark ? 96 : 68) * s.life * (1 - clear * 0.9);
    if (alphaBase < 2) continue;

    push();
    translate(s.x, s.y);
    rotate(s.rot);
    noStroke();

    const col = s.dark ? color(24, 24, 24) : color(84, 87, 90);
    col.setAlpha(alphaBase);
    fill(col);

    const w = s.size * (1.03 + sin(tm * 0.26 + s.phase) * 0.05);
    const h = s.size * (0.74 + cos(tm * 0.23 + s.phase) * 0.06);

    beginShape();
    vertex(-w * 0.52, -h * 0.04);
    vertex(-w * 0.36, -h * 0.34);
    vertex(0, -h * 0.46);
    vertex(w * 0.30, -h * 0.30);
    vertex(w * 0.50, -h * 0.04);
    vertex(w * 0.36, h * 0.24);
    vertex(0, h * 0.38);
    vertex(-w * 0.30, h * 0.28);
    vertex(-w * 0.46, h * 0.10);
    endShape(CLOSE);

    pop();
  }
}

function drawPlatforms() {
  const ordered = modules.slice().sort((a, b) => a.y - b.y);
  for (const m of ordered) {
    const rec = moduleRecovery(m);
    const off = displayOffset(m, rec);
    const p = m.platform;
    const gap = (1 - rec) * 24;

    push();
    translate(m.x + off.x, m.y + 40 * m.s + off.y);
    rotate(m.rot + off.r * 0.4);

    noStroke();
    fill(20, 20, 20, 10 + (1 - rec) * 10);
    ellipse(4, 16, p.w * m.s * 0.88, p.h * m.s * 0.34);

    push();
    translate(-gap * 0.5, 0);
    fill(lerpColor(color('#6B6E72'), color(C.paper), rec * 0.94));
    beginShape();
    vertex(-p.w * 0.48 * m.s, 0);
    vertex(-p.w * 0.22 * m.s, -p.h * 0.42 * m.s);
    vertex(p.w * 0.02 * m.s, -p.h * 0.34 * m.s);
    vertex(0, p.h * 0.28 * m.s);
    vertex(-p.w * 0.42 * m.s, p.h * 0.22 * m.s);
    endShape(CLOSE);
    pop();

    push();
    translate(gap * 0.5, 0);
    fill(lerpColor(color('#56585C'), color('#DDDED9'), rec));
    beginShape();
    vertex(0, -p.h * 0.34 * m.s);
    vertex(p.w * 0.38 * m.s, -p.h * 0.42 * m.s);
    vertex(p.w * 0.48 * m.s, 0);
    vertex(p.w * 0.32 * m.s, p.h * 0.28 * m.s);
    vertex(0, p.h * 0.28 * m.s);
    endShape(CLOSE);
    pop();

    if (rec > 0.5) {
      fill(179, 255, 59, 34 + rec * 66);
      rect(0, p.h * 0.22 * m.s, p.w * 0.66 * m.s, 7 * m.s);
    }

    pop();
  }
}

function drawModules() {
  const ordered = modules.slice().sort((a, b) => a.y - b.y);
  for (const m of ordered) {
    const rec = moduleRecovery(m);
    const off = displayOffset(m, rec);

    push();
    translate(m.x + off.x, m.y + off.y);
    rotate(m.rot + off.r);
    scale(m.s);

    if (m.kind === 'house') drawHouse(m, rec);
    else if (m.kind === 'tree') drawTree(m, rec);
    else if (m.kind === 'factory') drawFactory(m, rec);
    else if (m.kind === 'farm') drawFarm(m, rec);
    else if (m.kind === 'store') drawStore(m, rec);
    else if (m.kind === 'bush') drawBush(m, rec);
    else if (m.kind === 'garden') drawGarden(m, rec);
    else drawFlower(m, rec);

    pop();
  }
}

function partTransform(m, idx, rec, fn) {
  const part = m.parts[idx % m.parts.length];
  const t = constrain((rec - part.delay) / max(0.001, 1 - part.delay), 0, 1);
  const pull = 1 - t;
  push();
  translate(part.fx * pull, part.fy * pull);
  rotate(part.fr * pull);
  fn(t);
  pop();
}

function poly(points) {
  beginShape();
  for (const p of points) vertex(p[0], p[1]);
  endShape(CLOSE);
}

function petalColor(seed, idx, rec) {
  const cols = [C.red, C.blue, C.yellow, C.pink, C.teal, C.lime];
  return lerpColor(color('#676B6E'), color(cols[(seed + idx) % cols.length]), rec);
}

function drawHouse(m, rec) {
  noStroke();
  partTransform(m, 0, rec, () => {
    fill(lerpColor(color('#494C50'), color(C.paper), rec));
    rect(0, 10, 82, 50);
  });
  partTransform(m, 1, rec, () => {
    fill(lerpColor(color(C.ink), color(C.orange), rec));
    poly([[-44,-18],[0,-46],[44,-18],[36,-8],[-36,-8]]);
  });
  partTransform(m, 2, rec, () => {
    fill(lerpColor(color(C.ink), color(C.blue), rec));
    rect(-18, 8, 14, 18); rect(10, 8, 14, 18);
  });
  partTransform(m, 3, rec, () => {
    fill(lerpColor(color(C.ink), color(C.white), rec));
    rect(0, 20, 16, 28);
  });
  partTransform(m, 4, rec, () => {
    fill(lerpColor(color('#43464A'), color(C.purple), rec));
    rect(32, -26, 9, 18);
  });
  partTransform(m, 5, rec, () => {
    fill(lerpColor(color(C.ink), color(C.lime), rec * 0.88));
    rect(0, 36, 68, 6);
  });
}

function drawTree(m, rec) {
  noStroke();
  partTransform(m, 0, rec, q => {
    fill(lerpColor(color(C.ink), color(C.brown), rec));
    rect(0, 18, 12, 48 * q);
  });
  partTransform(m, 1, rec, () => {
    fill(lerpColor(color('#575A5D'), color(C.leaf), rec));
    ellipse(0, -12, 62, 46);
  });
  partTransform(m, 2, rec, () => {
    fill(lerpColor(color('#606468'), color(C.green), rec));
    ellipse(-18, 0, 38, 28);
    ellipse(18, 0, 38, 28);
  });
  partTransform(m, 3, rec, () => {
    fill(lerpColor(color('#666A6D'), color(C.lime), rec * 0.88));
    ellipse(0, -26, 26, 22);
  });
  partTransform(m, 4, rec, () => {
    fill(lerpColor(color(C.ink), color(C.yellow), rec * 0.5));
    circle(-8, -16, 5);
    circle(10, -8, 4);
  });
}

function drawFactory(m, rec) {
  noStroke();
  partTransform(m, 0, rec, () => {
    fill(lerpColor(color('#4C4F53'), color(C.paper), rec));
    rect(-12, 8, 92, 48);
  });
  partTransform(m, 1, rec, () => {
    fill(lerpColor(color(C.ink), color(C.orange), rec));
    poly([[-52,-18],[-34,-36],[-14,-18],[-18,-8],[-48,-8]]);
  });
  partTransform(m, 2, rec, () => {
    fill(lerpColor(color(C.ink), color(C.blue), rec));
    rect(-40, 10, 14, 18); rect(-16, 10, 14, 18); rect(8, 10, 14, 18);
  });
  partTransform(m, 3, rec, () => {
    fill(lerpColor(color('#3F4245'), color(C.purple), rec));
    rect(40, -18, 16, 42);
  });
  partTransform(m, 4, rec, () => {
    fill(lerpColor(color(C.ink), color(C.lime), rec * 0.88));
    rect(-8, 34, 90, 7);
  });
  partTransform(m, 5, rec, () => {
    fill(lerpColor(color('#5C5F62'), color(C.white), rec));
    rect(36, 8, 16, 16);
  });
  partTransform(m, 6, rec, () => {
    fill(lerpColor(color('#62666A'), color(C.teal), rec * 0.8));
    rect(-54, 18, 12, 10);
  });
}

function drawFarm(m, rec) {
  noStroke();
  partTransform(m, 0, rec, () => {
    fill(lerpColor(color('#4D5054'), color(C.paper), rec));
    poly([[-60,22],[-60,-18],[-14,-18],[-14,22]]);
  });
  partTransform(m, 1, rec, () => {
    fill(lerpColor(color(C.ink), color(C.orange), rec));
    poly([[-64,-18],[-38,-46],[-10,-18],[-16,-8],[-54,-8]]);
  });
  partTransform(m, 2, rec, () => {
    fill(lerpColor(color('#55595D'), color('#EDE4C7'), rec));
    rect(24, 0, 74, 38);
  });
  partTransform(m, 3, rec, () => {
    fill(lerpColor(color(C.ink), color(C.green), rec));
    for (let i = 0; i < 4; i++) rect(-2 + i * 18, 20, 12, 18);
  });
  partTransform(m, 4, rec, () => {
    fill(lerpColor(color(C.ink), color(C.blue), rec));
    rect(-36, -2, 10, 14);
  });
  partTransform(m, 5, rec, () => {
    fill(lerpColor(color(C.ink), color(C.lime), rec * 0.9));
    rect(4, 30, 104, 8);
  });
}

function drawStore(m, rec) {
  noStroke();
  partTransform(m, 0, rec, () => {
    fill(lerpColor(color('#4F5357'), color(C.paper), rec));
    rect(0, 4, 94, 50);
  });
  partTransform(m, 1, rec, () => {
    fill(lerpColor(color(C.ink), color(C.orange), rec));
    rect(0, -24, 100, 14);
  });
  partTransform(m, 2, rec, () => {
    fill(lerpColor(color(C.ink), color(C.blue), rec));
    rect(-22, 8, 18, 24); rect(6, 8, 18, 24);
  });
  partTransform(m, 3, rec, () => {
    fill(lerpColor(color(C.ink), color(C.white), rec));
    rect(30, 12, 18, 30);
  });
  partTransform(m, 4, rec, () => {
    fill(lerpColor(color('#3E4144'), color(C.purple), rec));
    poly([[-54,-16],[-34,-34],[-12,-16],[-16,-8],[-48,-8]]);
  });
  partTransform(m, 5, rec, () => {
    fill(lerpColor(color(C.ink), color(C.lime), rec * 0.82));
    rect(0, 32, 86, 7);
  });
}

function drawBush(m, rec) {
  noStroke();
  partTransform(m, 0, rec, () => {
    fill(lerpColor(color(C.ink), color(C.leaf), rec));
    ellipse(-12, 0, 32, 24);
    ellipse(10, -2, 36, 28);
    ellipse(0, -12, 36, 26);
  });
  partTransform(m, 1, rec, () => {
    fill(lerpColor(color('#4B4E51'), color(C.green), rec));
    ellipse(-22, 2, 22, 16); ellipse(22, 4, 26, 18);
  });
  partTransform(m, 2, rec, () => {
    fill(lerpColor(color(C.ink), color(C.pink), rec * 0.8));
    circle(-6, -8, 7); circle(8, -2, 6);
  });
  partTransform(m, 3, rec, () => {
    fill(lerpColor(color(C.ink), color(C.yellow), rec * 0.72));
    rect(0, 15, 54, 6);
  });
}

function drawGarden(m, rec) {
  noStroke();
  partTransform(m, 0, rec, () => {
    fill(lerpColor(color('#4E5154'), color('#D8C4A2'), rec));
    rect(0, 8, 70, 22);
  });
  partTransform(m, 1, rec, () => {
    fill(lerpColor(color(C.ink), color(C.green), rec));
    for (let i = 0; i < 4; i++) ellipse(-22 + i * 15, 2, 14, 10);
  });
  partTransform(m, 2, rec, () => {
    fill(lerpColor(color('#666A6D'), color(C.red), rec));
    circle(-18, -2, 7); circle(0, -4, 7); circle(18, -1, 7);
  });
  partTransform(m, 3, rec, () => {
    fill(lerpColor(color('#676B6E'), color(C.blue), rec));
    circle(-10, 4, 6); circle(12, 4, 6);
  });
  partTransform(m, 4, rec, () => {
    fill(lerpColor(color(C.ink), color(C.lime), rec * 0.78));
    rect(0, 18, 66, 5);
  });
}

function drawFlower(m, rec) {
  noStroke();
  partTransform(m, 0, rec, q => {
    fill(lerpColor(color(C.ink), color(C.green), rec));
    rect(0, 14, 6, 42 * q);
  });
  for (let i = 0; i < 4; i++) {
    partTransform(m, min(i + 1, 3), rec, q => {
      push();
      rotate(i * TWO_PI / 4 + sin(tm + m.seed + i) * 0.1);
      fill(petalColor(floor(m.seed) % 6, i, rec));
      ellipse(0, -18, 18 * q, 28 * q);
      pop();
    });
  }
  if (rec > 0.22) {
    fill(lerpColor(color(C.ink), color(C.orange), rec));
    circle(0, -6, 10);
  }
}

function updateWindCursor(dt) {
  const dx = mouseX - lastMouseX;
  const dy = mouseY - lastMouseY;
  const speed = sqrt(dx * dx + dy * dy);
  if (speed > 0.1) windFacing = atan2(dy, dx);

  if (activeTool === 'wind') {
    const target = 0.12 + constrain(speed / 26, 0, 1) * 0.58;
    windFanSpeed = lerp(windFanSpeed, target, 0.18);
    windFanAngle += windFanSpeed * 60 * dt;
    windTrailCooldown -= dt;

    if (speed > 4 && windTrailCooldown <= 0) {
      const len = max(1, speed);
      windLines.push({
        x: mouseX, y: mouseY,
        dx: dx / len, dy: dy / len,
        life: 0.88
      });
      windTrailCooldown = 0.04;
    }
  } else {
    windFanSpeed = lerp(windFanSpeed, 0, 0.12);
  }

  lastMouseX = mouseX;
  lastMouseY = mouseY;
}

function drawWindCursor() {
  if (activeTool !== 'wind') return;
  if (toolAt(mouseX, mouseY)) return;

  push();
  translate(mouseX, mouseY);

  push();
  rotate(windFacing);
  noFill();
  stroke(105, 82, 235, 90);
  strokeWeight(2);
  for (let k = -1; k <= 1; k++) {
    const yy = k * 15;
    bezier(-76, yy, -28, yy - 10, 24, yy + 10, 78, yy);
  }
  pop();

  noFill();
  stroke(255, 80);
  strokeWeight(1.6);
  circle(0, 0, 86);

  rotate(windFanAngle);
  noStroke();
  for (let i = 0; i < 3; i++) {
    push();
    rotate(i * TWO_PI / 3);
    fill(i === 0 ? C.purple : i === 1 ? C.white : C.blue);
    beginShape();
    vertex(-3, -6);
    vertex(18, -14);
    vertex(58, -9);
    vertex(46, 10);
    vertex(18, 16);
    vertex(-3, 9);
    endShape(CLOSE);
    pop();
  }

  fill(C.ink);
  circle(0, 0, 28);
  fill(C.white);
  circle(0, 0, 10);
  fill(C.orange);
  circle(0, 0, 5);
  pop();
}

function drawBurstsAndWind() {
  noFill();
  for (const b of sunBursts) {
    stroke(32, 51, 255, 105 * b.life);
    strokeWeight(2);
    circle(b.x, b.y, b.r);
    stroke(179, 255, 59, 75 * b.life);
    strokeWeight(1);
    circle(b.x, b.y, b.r * 0.74);
  }

  for (const w of windLines) {
    stroke(105, 82, 235, 90 * w.life);
    strokeWeight(2.1);
    line(w.x - w.dx * 30, w.y - w.dy * 30, w.x + w.dx * 18, w.y + w.dy * 18);
    stroke(255, 70 * w.life);
    strokeWeight(1);
    line(w.x - w.dx * 14 + w.dy * 5, w.y - w.dy * 14 - w.dx * 5, w.x + w.dx * 6, w.y + w.dy * 6);
  }
}

function drawPollen() {
  noStroke();
  for (const p of pollen) {
    const c = color(p.col);
    c.setAlpha(110 * p.life);
    fill(c);
    circle(p.x, p.y, p.size);
  }
}

function toolAt(x, y) {
  const tools = [
    { x: 98, y: 106, w: 112, h: 44, key: 'sun' },
    { x: 228, y: 106, w: 124, h: 44, key: 'wind' }
  ];
  for (const t of tools) {
    if (x > t.x - t.w * 0.5 && x < t.x + t.w * 0.5 && y > t.y - t.h * 0.5 && y < t.y + t.h * 0.5) return t.key;
  }
  return null;
}

function drawHUD() {
  const tools = [
    { x: 98, y: 106, w: 112, h: 44, key: 'sun', label: 'SUN' },
    { x: 228, y: 106, w: 124, h: 44, key: 'wind', label: 'WIND' }
  ];

  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  textSize(14);

  for (const t of tools) {
    const active = activeTool === t.key;
    stroke(active ? C.white : 'rgba(255,255,255,0.26)');
    strokeWeight(active ? 1.8 : 1);
    fill(active ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.10)');
    rect(t.x, t.y, t.w, t.h, 10);
    noStroke();
    fill(C.white);
    text(t.label, t.x, t.y + 1);
  }

  textAlign(LEFT, CENTER);
  fill(255, 236);
  noStroke();
  textSize(14);
  text(
    'SUN ' + nf(round(averageCharge('sun') * 100), 2) +
    '   WIND ' + nf(round(averageCharge('wind') * 100), 2) +
    '   RECOVERED ' + countRecovered() + '/' + modules.length,
    24, H - 36
  );

  if (statusUntil > tm) {
    textAlign(CENTER, CENTER);
    textSize(13);
    fill(255, 245);
    text(statusText, W * 0.5, 34);
  }
}

function setStatus(msg, sec) {
  statusText = msg;
  statusUntil = tm + sec;
}

function mousePressed() {
  const hit = toolAt(mouseX, mouseY);
  if (hit) {
    activeTool = hit;
    setStatus(hit === 'sun'
      ? 'SUN SELECTED · REBUILD THE FIELD GRADUALLY'
      : 'WIND SELECTED · CLEAR POLLUTION WITH AIR FLOW', 2.6);
    return false;
  }
  dragging = true;
  return false;
}

function mouseDragged() {
  if (!dragging) return false;
  applyEnergy(activeTool, mouseX, mouseY, mouseX - pmouseX, mouseY - pmouseY);
  return false;
}

function mouseReleased() {
  dragging = false;
  return false;
}

function keyPressed() {
  if (key === '1') {
    activeTool = 'sun';
    setStatus('SUN SELECTED · REBUILD THE FIELD GRADUALLY', 2.6);
  } else if (key === '2') {
    activeTool = 'wind';
    setStatus('WIND SELECTED · CLEAR POLLUTION WITH AIR FLOW', 2.6);
  } else if (key === 'r' || key === 'R') {
    regenerate();
  } else if (key === 's' || key === 'S') {
    saveCanvas('adapts_v24_bigger_assets', 'png');
  }
}

function applyEnergy(tool, x, y, dx, dy) {
  const len = sqrt(dx * dx + dy * dy);
  const ndx = len > 0.01 ? dx / len : cos(windFacing);
  const ndy = len > 0.01 ? dy / len : sin(windFacing);

  if (tool === 'sun') {
    sunBursts.push({ x, y, r: 18, life: 1 });
  } else {
    windLines.push({ x, y, dx: ndx, dy: ndy, life: 1 });
  }

  const radius = tool === 'sun' ? 248 : 274;
  const gain = tool === 'sun' ? 0.17 : 0.20;

  for (const m of modules) {
    const d = dist(x, y, m.x, m.y);
    if (d > radius) continue;
    const f = pow(1 - d / radius, 1.1);

    if (tool === 'sun') {
      m.sun = constrain(m.sun + gain * f, 0, 1);
    } else {
      m.wind = constrain(m.wind + gain * f, 0, 1);
      const push = (0.16 + 0.18 * (1 / max(0.52, m.mass))) * f;
      m.vx += ndx * push;
      m.vy += ndy * push;
    }
  }

  if (tool === 'wind') {
    for (const s of smoke) {
      const d = dist(x, y, s.x, s.y);
      if (d < radius * 1.12) {
        const f = pow(1 - d / (radius * 1.12), 0.88);
        s.vx += ndx * 0.26 * f;
        s.vy += ndy * 0.20 * f;
        s.life *= 0.993 - f * 0.055;
      }
    }
  }
}
