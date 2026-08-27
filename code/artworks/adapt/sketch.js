
/*
ADAPT — MODULAR ECOLOGY

Stage 3 bridges the Stage 2 and Stage 4 visual systems:
- shared HEAL palette and bold p5.js primitive geometry
- a stepped charcoal depth field that transitions into a randomized blue recovery field
- abstract floating habitat stamps with depth-based greys that reassemble as the field recovers
- no central Earth/orb artwork; the habitats are the visual focus
- the SUN/WIND recovery interaction remains unique to this stage
*/

const C = {
  ink: '#141414',
  bg0: '#05051C',
  bg1: '#11114A',
  bg2: '#242443',
  white: '#FFFFFF',
  paper: '#C8B99F',
  soft: '#E5E8EB',
  grey: '#CDD2D7',
  darkGrey: '#48515C',
  blue: '#163FBF',
  purple: '#5735A5',
  orange: '#E85C18',
  lime: '#78A914',
  green: '#78A914',
  leaf: '#5735A5',
  red: '#E85C18',
  yellow: '#78A914',
  pink: '#D94D93',
  teal: '#147A78',
  brown: '#755443'
};

const ARTBOARD_WIDTH = 1920;
const ARTBOARD_HEIGHT = 1080;
const FIELD_X = 1100;
const FIELD_Y = 545;

let modules = [];
let smoke = [];
let pollen = [];
let sunBursts = [];
let windLines = [];
let debris = [];
let recoveredFragments = [];
let damagedField = null;
let restoredField = null;
let restoredLand = null;

let W = 0;
let H = 0;
let tm = 0;

let activeTool = 'sun';
let dragging = false;
let globalRecovery = 0;
let statusText = '';
let statusUntil = 0;
let finalTriggered = false;
let stateTwoAnnounced = false;

let windFacing = 0;
let windFanAngle = 0;
let windFanSpeed = 0;
let lastMouseX = 0;
let lastMouseY = 0;
let pointerX = ARTBOARD_WIDTH * 0.5;
let pointerY = ARTBOARD_HEIGHT * 0.5;
let dragPointerX = pointerX;
let dragPointerY = pointerY;
let windTrailCooldown = 0;
let lastRecoveryPercent = -1;
let audioContext = null;
let audioMaster = null;
let audioEnabled = false;
let audioFetchPromise = null;
let audioDecodePromise = null;
const audioFileData = new Map();
const audioBuffers = new Map();
const activeSampleSources = new Map();
const lastEnergySoundAt = { sun: 0, wind: 0 };
let fpsWindowStartedAt = 0;
let fpsWindowFrames = 0;

const AUDIO_FILES = Object.freeze({
  confirmation: 'assets/audio/COMM2754-2026-S4099019-A2w08-ADAPTS-Interface-Confirmation-01.wav',
  solarSelect: 'assets/audio/COMM2754-2026-S4099019-A2w08-ADAPTS-Solar-Selection-02.wav',
  solarEnergy: 'assets/audio/COMM2754-2026-S4099019-A2w08-ADAPTS-Solar-Energy-Activation-03.wav',
  windPaper: 'assets/audio/COMM2754-2026-S4099019-A2w08-ADAPTS-Wind-Brush-Paper-04.wav',
  recoveryWater: 'assets/audio/COMM2754-2026-S4099019-A2w08-ADAPTS-Recovery-Water-05.wav',
  assemblyKeyboard: 'assets/audio/COMM2754-2026-S4099019-A2w08-ADAPTS-Assembly-Keyboard-06.wav'
});

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const motionScale = reducedMotion ? 0.18 : 1;
const ENERGY_BRUSH_RADIUS = 580;
const ENERGY_BRUSH_GAIN = 0.12;
const ASSEMBLY_FRAGMENT_COLORS = [
  C.orange,
  C.lime,
  C.purple,
  C.blue,
  C.paper,
  C.teal
];
const RECOVERED_FRAGMENT_COLORS = [
  '#FF650D',
  '#8BD500',
  '#7447B8',
  '#234BDC',
  '#D7CAB0',
  '#258A97'
];

function setup() {
  pixelDensity(1);
  const createdCanvas = createCanvas(ARTBOARD_WIDTH, ARTBOARD_HEIGHT);
  createdCanvas.parent('app');
  createdCanvas.attribute(
    'aria-label',
    'Balance solar and wind energy across modular environmental habitats'
  );
  createdCanvas.attribute('data-target-fps', '60');
  frameRate(60);
  rectMode(CENTER);
  strokeJoin(MITER);
  strokeCap(SQUARE);
  // HEAL integration: use the user-selected shared typeface across the system.
  textFont('Stack Sans Notch');
  fitArtboardToWindow();
  preloadAudioSamples();
  regenerate();
}

function windowResized() {
  fitArtboardToWindow();
}

function fitArtboardToWindow() {
  const app = document.getElementById('app');
  if (!app) return;
  const displayScale = min(
    window.innerWidth / ARTBOARD_WIDTH,
    window.innerHeight / ARTBOARD_HEIGHT
  );
  app.style.transform = `scale(${displayScale})`;
}

function regenerate() {
  stopSample('assembly');
  stopSample('recovery');
  delete document.body.dataset.assemblyCue;
  delete document.body.dataset.recoveryCue;
  document.body.dataset.soundHistory = '';
  W = width;
  H = height;
  tm = 0;

  modules = [];
  smoke = [];
  pollen = [];
  sunBursts = [];
  windLines = [];
  debris = [];
  recoveredFragments = [];

  activeTool = 'sun';
  dragging = false;
  globalRecovery = 0;
  finalTriggered = false;
  stateTwoAnnounced = false;
  lastRecoveryPercent = -1;
  fpsWindowStartedAt = 0;
  fpsWindowFrames = 0;
  pointerX = W * 0.5;
  pointerY = H * 0.5;
  lastMouseX = pointerX;
  lastMouseY = pointerY;
  dragPointerX = pointerX;
  dragPointerY = pointerY;

  buildDamagedField();
  buildRestoredField();
  buildRestoredLand();
  buildModules();
  const visualAssetCount = modules.length - max(0, restoredLand.moduleIds.length - 1);
  document.body.dataset.assetCount = String(visualAssetCount);
  document.body.dataset.moduleCount = String(modules.length);
  document.body.dataset.landPosition = `${round(restoredLand.x)},${round(restoredLand.y)}`;
  buildDebris();
  buildRecoveredConstellation();
  buildSmoke();

  const previewState = new URLSearchParams(window.location.search).get('state');
  const isRestoredPreview = previewState === '2' || previewState === 'restored';
  if (isRestoredPreview) {
    for (const m of modules) {
      m.sun = 1;
      m.wind = 1;
      m.visualRecovery = 1;
    }
    globalRecovery = 1;
    finalTriggered = true;
    stateTwoAnnounced = true;
  }

  announceArtworkState(isRestoredPreview ? 2 : 1);

  setStatus('SUN SELECTED · REBUILD THE FIELD GRADUALLY', 3);
}

function announceArtworkState(state) {
  window.dispatchEvent(new CustomEvent('adapt:statechange', {
    detail: { state }
  }));
}

function randomKind() {
  const r = random();
  return r < 0.18 ? 'forest'
    : r < 0.34 ? 'water'
    : r < 0.51 ? 'solar'
    : r < 0.68 ? 'wind'
    : r < 0.84 ? 'community'
    : 'wildlife';
}

function scaleFor(kind) {
  if (kind === 'community') return random(0.98, 1.16);
  if (kind === 'solar' || kind === 'wind') return random(0.94, 1.12);
  if (kind === 'water') return random(0.92, 1.12);
  if (kind === 'forest') return random(0.90, 1.12);
  return random(0.88, 1.06);
}

function spacingFor(kind) {
  if (kind === 'community') return 148;
  if (kind === 'solar' || kind === 'wind') return 142;
  if (kind === 'water') return 138;
  if (kind === 'forest') return 132;
  return 126;
}

function buildModules() {
  // Four clean-energy modules combine on the shared land and count as one
  // visual habitat. Seven to nine satellite habitats keep the final scene at
  // the requested eight-to-ten clearly readable asset groups.
  const targetVisualCount = floor(random(8, 11));
  const targetCount = targetVisualCount + 3;
  const kinds = ['community', 'forest', 'wind', 'wildlife', 'solar', 'water'];
  while (kinds.length < targetCount) kinds.push(randomKind());

  // Shuffle both the habitat families and their scale hierarchy on every reset.
  for (let i = kinds.length - 1; i > 0; i--) {
    const j = floor(random(i + 1));
    [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
  }

  const layout = kinds.map((kind) => ({
    kind,
    ring: floor(random(2)),
    scale: random(1.16, 1.38)
  }));
  const startPositions = generateStartPositions(layout.length);

  for (let moduleIndex = 0; moduleIndex < layout.length; moduleIndex++) {
    const item = layout[moduleIndex];
    const start = startPositions[moduleIndex];
    const s = scaleFor(item.kind) * item.scale;
    const module = makeModule(moduleIndex, item.kind, start.x, start.y, s);
    module.orbitRing = item.ring;
    module.orbitAngle = atan2(start.y - FIELD_Y, start.x - FIELD_X);
    modules.push(module);
  }

  placeSharedLandModules();
}

function generateStartPositions(count) {
  const positions = [];
  const minimumDistance = count >= 13 ? 166 : count === 12 ? 174 : count === 11 ? 184 : 205;
  const fallback = [
    { x: 820, y: 410 },
    { x: 1130, y: 290 },
    { x: 1450, y: 440 },
    { x: 1700, y: 620 },
    { x: 470, y: 690 },
    { x: 800, y: 700 },
    { x: 1130, y: 730 },
    { x: 1430, y: 700 },
    { x: 990, y: 520 },
    { x: 1630, y: 430 }
  ];

  for (let i = 0; i < count; i++) {
    let chosen = null;

    for (let attempt = 0; attempt < 320; attempt++) {
      const candidate = {
        x: random(330, 1790),
        y: random(210, 820)
      };

      // Keep the exact Figma title, subtitle and information control readable.
      if (candidate.x < 730 && candidate.y < 575) continue;
      if (candidate.x > 1320 && candidate.y < 380) continue;
      if (candidate.x > 1540 && candidate.y > 720) continue;
      if (pointInRestoredLandClearance(candidate.x, candidate.y)) continue;

      const hasRoom = positions.every((other) =>
        dist(candidate.x, candidate.y, other.x, other.y) >= minimumDistance
      );
      if (!hasRoom) continue;

      chosen = candidate;
      break;
    }

    if (!chosen) {
      const safe = fallback.find((candidate) =>
        !pointInRestoredLandClearance(candidate.x, candidate.y) &&
        positions.every((other) =>
          dist(candidate.x, candidate.y, other.x, other.y) >= minimumDistance - 18
        )
      ) || fallback[i % fallback.length];
      chosen = {
        x: safe.x + random(-36, 36),
        y: safe.y + random(-28, 28)
      };
    }

    positions.push(chosen);
  }

  return positions;
}

function pointInRestoredLandClearance(x, y) {
  if (!restoredLand) return false;
  const dx = (x - restoredLand.x) / (restoredLand.w * 0.64);
  const dy = (y - restoredLand.y) / (restoredLand.h * 1.45);
  return dx * dx + dy * dy < 1;
}

function placeSharedLandModules() {
  if (!restoredLand || !modules.length) return;

  const anchorKinds = ['solar', 'wind', 'community', 'forest'];
  const anchors = anchorKinds
    .map((kind) => modules.find((m) => m.kind === kind))
    .filter(Boolean);
  const offsets = [
    -restoredLand.w * 0.35,
    -restoredLand.w * 0.13,
    restoredLand.w * 0.12,
    restoredLand.w * 0.35
  ];
  const verticalOffsets = [8, -8, -13, 7];

  anchors.forEach((m, index) => {
    m.sharedLand = true;
    m.sharedLandIndex = index;
    const anchorScale =
      m.kind === 'community' ? 1.38 :
      m.kind === 'wind' ? 1.28 :
      m.kind === 'solar' ? 1.22 : 1.18;
    m.s = min(m.s, anchorScale);
    m.homeX = restoredLand.x + offsets[index];
    m.homeY = restoredLand.y + verticalOffsets[index];
    m.x = m.homeX;
    m.y = m.homeY;
  });

  restoredLand.moduleIds = anchors.map((m) => m.id);
}

function makeModule(id, kind, x, y, s) {
  const partCount =
    kind === 'community' ? 6 :
    kind === 'solar' ? 6 :
    kind === 'wind' ? 5 :
    kind === 'forest' ? 5 :
    kind === 'water' ? 4 : 5;

  const mass =
    kind === 'community' ? 1.00 :
    kind === 'water' ? 0.90 :
    kind === 'solar' || kind === 'wind' ? 0.84 :
    kind === 'forest' ? 0.72 : 0.64;

  const parts = [];
  for (let i = 0; i < partCount; i++) {
    const scatter = random() < 0.42 ? random(1.35, 2.05) : random(0.82, 1.32);
    parts.push({
      fx: random(-70, 70) * scatter,
      fy: random(-60, 54) * scatter,
      fr: random(-0.68, 0.68),
      delay: random(0.04, 0.48),
      floatPhase: random(TWO_PI),
      floatSpeed: random(0.22, 0.46),
      floatRadius: random(7, 17)
    });
  }

  const baseW = random(132, 160);
  const baseH = random(28, 36);
  const phase = random(TWO_PI);
  const fragmentCount = floor(random(22, 30));
  const fragmentSpread = random(0.92, 1.28);
  const fragments = [];

  for (let i = 0; i < fragmentCount; i++) {
    const layerRoll = random();
    const layer = layerRoll < 0.62 ? 0 : layerRoll < 0.93 ? 1 : 2;
    const size = layer === 0
      ? random(3.5, 10)
      : layer === 1
        ? random(9, 21)
        : random(27, 58);
    const radius = layer === 0
      ? random(120, 235)
      : layer === 1
        ? random(86, 190)
        : random(180, 285);
    const progress = fragmentCount > 1 ? i / (fragmentCount - 1) : 0;

    fragments.push({
      layer,
      size,
      radius,
      angle: phase + progress * PI * 1.72 + random(-0.72, 0.72),
      stretch: random(0.52, 2.25),
      rotation: random(TWO_PI),
      spin: random(-0.16, 0.16),
      floatSpeed: random(0.16, 0.46),
      drift: layer === 2 ? random(16, 34) : random(7, 22),
      phase: random(TWO_PI),
      shape: floor(random(7)),
      colorIndex: floor(random(ASSEMBLY_FRAGMENT_COLORS.length)),
      alpha: layer === 0 ? random(42, 72) : layer === 1 ? random(72, 120) : random(34, 56)
    });
  }

  return {
    id,
    kind,
    x,
    y,
    homeX: x,
    homeY: y,
    vx: random(-0.22, 0.22),
    vy: random(-0.18, 0.18),
    rot: random(-0.04, 0.04),
    s,
    mass,
    parts,
    platform: { w: baseW, h: baseH },
    sun: 0,
    wind: 0,
    visualRecovery: 0,
    assemblyDelay: random(0.02, 0.3),
    seed: random(10000),
    phase,
    floatAmp: random(6, 15),
    orbitAmp: random(3, 9),
    orbitSpeed: random(0.25, 0.8),
    fragmentSeed: random(1000),
    fragmentCount,
    fragmentSpread,
    fragments,
    hover: 0
  };
}

function buildDebris() {
  const count = floor(random(60, 81));
  for (let i = 0; i < count; i++) {
    let x = null;
    let y = null;
    const layerRoll = random();
    const layer = layerRoll < 0.64 ? 0 : layerRoll < 0.93 ? 1 : 2;

    for (let attempt = 0; attempt < 80; attempt++) {
      if (layer === 2 && random() < 0.58) {
        // A few oversized foreground shards enter from the artboard edges.
        const edge = floor(random(4));
        if (edge === 0) {
          x = random(-90, 130);
          y = random(100, H - 150);
        } else if (edge === 1) {
          x = random(W - 130, W + 90);
          y = random(100, H - 150);
        } else if (edge === 2) {
          x = random(120, W - 120);
          y = random(-70, 150);
        } else {
          x = random(120, W - 120);
          y = random(H - 210, H + 70);
        }
      } else if (random() < 0.76 && modules.length) {
        const source = random(modules);
        const spread = layer === 0 ? 240 : layer === 1 ? 210 : 300;
        x = source.homeX + random(-spread, spread);
        y = source.homeY + random(-spread * 0.68, spread * 0.62);
      } else {
        x = random(-60, W + 60);
        y = random(70, H - 100);
      }

      if (isProtectedUiPoint(x, y, layer === 2 ? 82 : 28)) continue;
      break;
    }

    if (!Number.isFinite(x) || !Number.isFinite(y) || isProtectedUiPoint(x, y, 22)) {
      x = random(760, 1460);
      y = random(260, 760);
    }

    const size = layer === 0
      ? random(3, 9)
      : layer === 1
        ? random(11, 32)
        : random(40, 88);

    debris.push({
      x,
      y,
      layer,
      size,
      stretch: random(0.55, 2.1),
      rotation: random(TWO_PI),
      spin: random(-0.14, 0.14),
      phase: random(TWO_PI),
      floatSpeed: random(0.18, 0.48),
      drift: layer === 2 ? random(14, 34) : random(7, 23),
      fallSpeed: layer === 0 ? random(1.4, 3.8) : layer === 1 ? random(2.4, 6) : random(3.4, 8.2),
      depth: random(),
      shape: floor(random(7)),
      colorIndex: floor(random(ASSEMBLY_FRAGMENT_COLORS.length)),
      alpha: layer === 0 ? random(36, 66) : layer === 1 ? random(60, 102) : random(28, 48)
    });
  }
}

function buildRecoveredConstellation() {
  // The recovered field keeps a visible memory of the scattered pieces. Small,
  // saturated fragments connect the separate habitats into one living system;
  // larger slate shards at the perimeter create foreground depth.
  const fragmentCount = floor(random(315, 356));

  for (let i = 0; i < fragmentCount; i++) {
    const layerRoll = random();
    const layer = layerRoll < 0.62 ? 0 : 1;
    let x = null;
    let y = null;

    for (let attempt = 0; attempt < 120; attempt++) {
      if (random() < 0.78 && modules.length) {
        const source = random(modules);
        const spreadX = layer === 0 ? random(150, 320) : random(120, 270);
        x = source.homeX + random(-spreadX, spreadX);
        y = source.homeY + random(-spreadX * 0.62, spreadX * 0.62);
      } else {
        x = random(30, W - 30);
        y = random(150, H - 185);
      }

      if (isProtectedUiPoint(x, y, layer === 0 ? 14 : 26)) continue;
      break;
    }

    if (!Number.isFinite(x) || !Number.isFinite(y) || isProtectedUiPoint(x, y, 10)) {
      x = random(720, 1510);
      y = random(250, 790);
    }

    recoveredFragments.push({
      x,
      y,
      layer,
      edge: false,
      size: layer === 0 ? random(3.5, 9.5) : random(10, 24),
      stretch: random(0.58, 1.85),
      rotation: random(TWO_PI),
      spin: random(-0.045, 0.045),
      phase: random(TWO_PI),
      floatSpeed: random(0.16, 0.38),
      drift: layer === 0 ? random(1.5, 5.5) : random(3, 8),
      shape: floor(random(7)),
      colorIndex: floor(random(ASSEMBLY_FRAGMENT_COLORS.length)),
      alpha: layer === 0 ? random(188, 248) : random(205, 255)
    });
  }

  const edgeCount = floor(random(16, 23));
  for (let i = 0; i < edgeCount; i++) {
    const edge = i % 4;
    let x;
    let y;
    if (edge === 0) {
      x = random(-65, 110);
      y = random(30, H - 150);
    } else if (edge === 1) {
      x = random(W - 110, W + 65);
      y = random(25, H - 150);
    } else if (edge === 2) {
      x = random(160, W - 120);
      y = random(-65, 115);
    } else {
      x = random(70, W - 120);
      y = random(H - 170, H + 70);
    }

    if (isProtectedUiPoint(x, y, 90)) {
      i--;
      continue;
    }

    recoveredFragments.push({
      x,
      y,
      layer: random() < 0.55 ? -1 : 2,
      edge: true,
      size: random(42, 112),
      stretch: random(0.72, 2.25),
      rotation: random(TWO_PI),
      spin: random(-0.018, 0.018),
      phase: random(TWO_PI),
      floatSpeed: random(0.08, 0.2),
      drift: random(2, 7),
      shape: floor(random(1, 7)),
      colorIndex: floor(random(ASSEMBLY_FRAGMENT_COLORS.length)),
      alpha: random(105, 182)
    });
  }
}

function isProtectedUiPoint(x, y, margin = 0) {
  const inTitle = x < 690 + margin && y < 330 + margin;
  const inSubtitle = x > 270 - margin && x < 1640 + margin && y > 880 - margin;
  const inInfo = x > 1640 - margin && y > 815 - margin;
  return inTitle || inSubtitle || inInfo;
}

function buildSmoke() {
  const count = floor(random(10, 16));
  for (let i = 0; i < count; i++) {
    smoke.push({
      x: random(-50, W + 50),
      y: random(20, H * 0.88),
      vx: random(-0.08, 0.08),
      vy: random(-0.03, 0.04),
      rot: random(TWO_PI),
      vr: random(-0.006, 0.006),
      size: random(10, 26),
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

  fpsWindowFrames++;
  const fpsNow = millis();
  if (fpsWindowStartedAt === 0) fpsWindowStartedAt = fpsNow;
  if (fpsNow - fpsWindowStartedAt >= 1000) {
    document.body.dataset.fps = String(round(
      fpsWindowFrames * 1000 / max(1, fpsNow - fpsWindowStartedAt)
    ));
    fpsWindowStartedAt = fpsNow;
    fpsWindowFrames = 0;
  }

  if (frameCount % 30 === 0) {
    document.body.dataset.recovery = String(round(globalRecovery * 100));
  }

  updateWindCursor(dt);
  updateModules(dt);
  updateSmoke(dt);
  updateParticles(dt);

  drawBackground();
  drawSmoke();
  drawDebris();
  drawRecoveredConstellation('back');
  drawRestoredLand();
  drawPlatforms();
  drawModules();
  drawRecoveredConstellation('front');
  drawBurstsAndWind();
  drawPollen();
  drawEnergyCursor();
}

function drawBackground() {
  const rec = smoothClamp(globalRecovery, 0.08, 0.92);
  drawDepthField(rec);
}

function alphaColor(hex, alpha) {
  const result = color(hex);
  result.setAlpha(alpha);
  return result;
}

function makeFieldPolygon(cx, cy, rx, ry, count, rotationOffset, jitter) {
  const points = [];
  for (let i = 0; i < count; i++) {
    const angle = rotationOffset + i * TWO_PI / count;
    const radius = random(1 - jitter, 1 + jitter);
    points.push([
      cx + cos(angle) * rx * radius,
      cy + sin(angle) * ry * radius
    ]);
  }
  return points;
}

function buildDamagedField() {
  const centerX = random(870, 1260);
  const centerY = random(420, 650);
  const rotationOffset = random(-0.46, 0.24);
  const outerRx = random(520, 720);
  const outerRy = random(300, 440);

  damagedField = {
    base: '#505050',
    layers: [
      {
        color: '#484848',
        points: [
          [random(-180, 80), random(80, 330)],
          [random(980, 1520), random(-140, 80)],
          [random(1900, 2130), random(350, 720)],
          [random(760, 1260), random(1080, 1240)],
          [random(-160, 120), random(850, 1100)]
        ]
      },
      {
        color: '#403F3F',
        points: [
          [random(120, 360), random(160, 360)],
          [random(1360, 1740), random(80, 260)],
          [random(1760, 2040), random(720, 980)],
          [random(620, 1120), random(1020, 1190)],
          [random(-100, 130), random(560, 820)]
        ]
      },
      {
        color: '#3C3C3C',
        points: makeFieldPolygon(
          centerX,
          centerY,
          outerRx,
          outerRy,
          floor(random(6, 9)),
          rotationOffset,
          0.14
        )
      },
      {
        color: '#2F2F2F',
        points: makeFieldPolygon(
          centerX + random(-50, 50),
          centerY + random(-35, 38),
          outerRx * random(0.58, 0.72),
          outerRy * random(0.54, 0.68),
          floor(random(5, 8)),
          rotationOffset + random(-0.22, 0.22),
          0.16
        )
      },
      {
        color: '#292929',
        points: makeFieldPolygon(
          centerX + random(-65, 65),
          centerY + random(-45, 48),
          outerRx * random(0.27, 0.42),
          outerRy * random(0.24, 0.38),
          floor(random(5, 8)),
          rotationOffset + random(-0.3, 0.3),
          0.2
        )
      }
    ]
  };
}

function buildRestoredField() {
  const palette = {
    base: '#07152F',
    sweep: '#0A1E42',
    accent: '#0D2854',
    outer: '#123468',
    middle: '#19417A',
    inner: '#28538F'
  };
  const centerX = random(860, 1320);
  const centerY = random(430, 650);
  const rotationOffset = random(-0.42, 0.28);
  const outerRx = random(500, 690);
  const outerRy = random(285, 420);
  const vertexCount = floor(random(6, 9));

  restoredField = {
    palette,
    sweep: [
      [random(-180, 120), random(150, 390)],
      [random(920, 1480), random(-160, 70)],
      [random(1860, 2100), random(320, 700)],
      [random(620, 1180), random(1060, 1230)],
      [random(-180, 130), random(900, 1160)]
    ],
    accent: [
      [0, random(440, 720)],
      [random(260, 620), random(650, 850)],
      [random(720, 1100), 1080],
      [0, 1080]
    ],
    layers: [
      {
        color: palette.outer,
        points: makeFieldPolygon(
          centerX,
          centerY,
          outerRx,
          outerRy,
          vertexCount,
          rotationOffset,
          0.12
        )
      },
      {
        color: palette.middle,
        points: makeFieldPolygon(
          centerX + random(-50, 55),
          centerY + random(-35, 40),
          outerRx * random(0.58, 0.72),
          outerRy * random(0.54, 0.68),
          floor(random(5, 8)),
          rotationOffset + random(-0.24, 0.24),
          0.16
        )
      },
      {
        color: palette.inner,
        points: makeFieldPolygon(
          centerX + random(-70, 75),
          centerY + random(-50, 55),
          outerRx * random(0.27, 0.42),
          outerRy * random(0.24, 0.38),
          floor(random(5, 8)),
          rotationOffset + random(-0.34, 0.34),
          0.2
        )
      }
    ]
  };
}

function buildRestoredLand() {
  const horizontalDirection = random() < 0.5 ? -1 : 1;
  const w = random(735, 805);
  const h = random(132, 166);

  restoredLand = {
    x: horizontalDirection < 0 ? random(930, 1015) : random(1165, 1250),
    y: FIELD_Y + random(-72, 86),
    w,
    h,
    rotation: random(-0.045, 0.045),
    points: [
      [-w * 0.50, -h * random(0.12, 0.2)],
      [-w * random(0.38, 0.44), -h * random(0.42, 0.5)],
      [w * random(0.33, 0.4), -h * random(0.42, 0.5)],
      [w * 0.50, -h * random(0.08, 0.16)],
      [w * random(0.36, 0.42), h * random(0.42, 0.5)],
      [-w * random(0.38, 0.44), h * random(0.42, 0.5)]
    ],
    moduleIds: []
  };
}

function sharedLandReveal() {
  return smoothClamp(globalRecovery, 0.56, 0.96);
}

function drawRestoredLand() {
  if (!restoredLand) return;
  const reveal = sharedLandReveal();
  if (reveal <= 0.001) return;

  push();
  translate(restoredLand.x, restoredLand.y + 82);
  rotate(restoredLand.rotation);
  noStroke();

  const landColor = lerpColor(color('#292D33'), color(C.purple), smoothClamp(globalRecovery, 0.5, 0.94));
  landColor.setAlpha(255 * reveal);
  fill(landColor);
  poly(restoredLand.points);
  pop();
}

function drawDepthField(rec) {
  const stateOneBase = color(damagedField?.base || '#505050');
  const restoredBase = color(restoredField?.palette.base || '#07152F');

  background(lerpColor(stateOneBase, restoredBase, rec));

  push();
  noStroke();

  for (const layer of damagedField?.layers || []) {
    fill(lerpColor(color(layer.color), restoredBase, rec));
    poly(layer.points);
  }

  pop();

  drawRestoredDepthField(rec);
}

function drawRestoredDepthField(rec) {
  if (!restoredField) return;
  const reveal = smoothClamp(rec, 0.18, 0.96);
  if (reveal <= 0.001) return;

  push();
  noStroke();

  fill(alphaColor(restoredField.palette.sweep, 255 * reveal));
  poly(restoredField.sweep);

  fill(alphaColor(restoredField.palette.accent, 255 * reveal));
  poly(restoredField.accent);

  for (const layer of restoredField.layers) {
    fill(alphaColor(layer.color, 255 * reveal));
    poly(layer.points);
  }

  pop();
}

function moduleDepth(m) {
  return constrain(map(m.homeY, 220, 820, 0, 1), 0, 1);
}

function damagedPalette(m) {
  const depth = moduleDepth(m);
  return {
    highlight: lerpColor(color('#242A30'), color('#C3C8CD'), depth),
    light: lerpColor(color('#2C333A'), color('#AEB4BB'), depth),
    mid: lerpColor(color('#20262C'), color('#747C85'), depth),
    dark: lerpColor(color('#101419'), color('#454C54'), depth),
    base: lerpColor(color('#171C21'), color('#59616A'), depth)
  };
}

function flowAt(x, y, seedOff = 0) {
  const a = noise(x * 0.00135 + seedOff, y * 0.00125 + seedOff, tm * 0.06) * TWO_PI * 2.5;
  const m = map(noise(x * 0.0009 + 10, y * 0.0008 + 20, tm * 0.05 + seedOff), 0, 1, 0.18, 0.92);
  return { x: cos(a) * m, y: sin(a) * m };
}

function moduleCharge(m) {
  const dual = min(m.sun, m.wind);
  return constrain(dual * 0.84 + (m.sun + m.wind) * 0.08, 0, 1);
}

function moduleRecovery(m) {
  return constrain(m.visualRecovery ?? moduleCharge(m), 0, 1);
}

function averageCharge(kind) {
  if (!modules.length) return 0;
  let t = 0;
  for (const m of modules) t += kind === 'sun' ? m.sun : m.wind;
  return t / modules.length;
}

function updateModules(dt) {
  if (!modules.length) return;

  let total = 0;
  let rawTotal = 0;

  for (const m of modules) {
    if (finalTriggered) {
      // Finish the balanced transition over several seconds instead of snapping.
      m.sun = min(1, m.sun + dt * 0.08);
      m.wind = min(1, m.wind + dt * 0.08);
    }

    const rawRecovery = moduleCharge(m);
    rawTotal += rawRecovery;
    const visualTarget = smoothClamp(rawRecovery, m.assemblyDelay, 0.98);
    const assemblyRate = finalTriggered ? 0.8 : 0.62;
    const assemblyEase = 1 - exp(-dt * assemblyRate);
    m.visualRecovery = lerp(m.visualRecovery, visualTarget, assemblyEase);
    const rec = moduleRecovery(m);
    total += rec;

    const flow = flowAt(m.x, m.y, m.seed * 0.0001);
    const weight = 1 / (0.7 + m.mass * 0.85);
    const targetVx = flow.x * 1.22 * weight;
    const targetVy = flow.y * 0.92 * weight;

    const chaos = 1 - smoothClamp(rec, 0.12, 0.85);
    const extraX = (noise(m.seed, tm * 0.34) - 0.5) * 0.26 * chaos;
    const extraY = (noise(m.seed + 40, tm * 0.37) - 0.5) * 0.20 * chaos;

    m.vx = lerp(m.vx, targetVx + extraX, 0.04);
    m.vy = lerp(m.vy, targetVy + extraY, 0.04);

    m.x += m.vx * 60 * dt * motionScale;
    m.y += m.vy * 60 * dt * motionScale;
    m.x = lerp(m.x, m.homeX, 0.012);
    m.y = lerp(m.y, m.homeY, 0.012);
    m.rot = lerp(m.rot, sin(tm * 0.25 + m.seed) * 0.018 + m.vx * 0.018, 0.03);

    m.x = constrain(m.x, 110, W - 110);
    m.y = constrain(m.y, 170, H - 300);

    // Preserve clear space for the persistent title and objective UI.
    if (m.x < 700 && m.y < 550) {
      m.x = lerp(m.x, 720, 0.12);
      m.y = lerp(m.y, 575, 0.12);
    }
    if (m.x > 1320 && m.y < 360) {
      m.y = lerp(m.y, 390, 0.14);
    }

    if (dist(pointerX, pointerY, m.x, m.y) < 84 * m.s) {
      m.hover = lerp(m.hover, 1, 0.12);
    } else {
      m.hover = lerp(m.hover, 0, 0.08);
    }

    if (!reducedMotion && rec > 0.62 && random() < 0.009 * dt * 60) {
      pollen.push({
        x: m.x + random(-10, 10),
        y: m.y - random(10, 32),
        vx: random(-0.12, 0.12),
        vy: random(-0.26, -0.06),
        size: random(4, 8),
        life: 1,
        col: random([C.lime, C.orange, C.purple, C.blue, C.white])
      });
    }
  }

  const backgroundEase = 1 - exp(-dt * 0.68);
  globalRecovery = lerp(globalRecovery, total / modules.length, backgroundEase);

  const rawAverage = rawTotal / modules.length;
  const sunAverage = averageCharge('sun');
  const windAverage = averageCharge('wind');

  if (!finalTriggered && rawAverage > 0.78 && min(sunAverage, windAverage) > 0.76) {
    finalTriggered = true;
    setStatus('BALANCE LOCKED · WATCH THE FIELD REASSEMBLE', 5.5);
    playAssemblySound();
  }

  if (finalTriggered && !stateTwoAnnounced && globalRecovery > 0.92) {
    stateTwoAnnounced = true;
    announceArtworkState(2);
    setStatus('ENVIRONMENT REGENERATED · THE FIELD IS ALIVE', 4);
    playCompletionSound();
    for (let i = 0; i < 18; i++) {
      sunBursts.push({
        x: random(80, W - 80),
        y: random(80, H - 120),
        r: random(12, 34),
        life: random(0.65, 1.0)
      });
    }
  }
}

function updateSmoke(dt) {
  const clear = constrain((averageCharge('wind') + averageCharge('sun')) * 0.5 + globalRecovery * 0.42, 0, 1);

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
  const parallax = lerp(0.72, 1.28, moduleDepth(m));
  const sway = lerp(m.floatAmp * 1.75 * parallax, m.floatAmp, t);
  const orbit = lerp(m.orbitAmp * 0.72 * parallax, m.orbitAmp, t);
  return {
    x:
      sin(tm * (0.26 + m.orbitSpeed * 0.32) + m.phase) * sway * 0.48 +
      cos(tm * (0.19 + m.orbitSpeed * 0.44) + m.phase * 0.8) * orbit,
    y:
      cos(tm * (0.31 + m.orbitSpeed * 0.24) + m.phase * 1.1) * sway * 0.68 +
      sin(tm * (0.22 + m.orbitSpeed * 0.52) + m.phase * 0.7) * orbit * 0.72,
    r: sin(tm * 0.24 + m.phase) * lerp(0.052, 0.04, t)
  };
}

function drawSmoke() {
  const clear = constrain((averageCharge('wind') + averageCharge('sun')) * 0.5 + globalRecovery * 0.42, 0, 1);

  for (const s of smoke) {
    const alphaBase = (s.dark ? 42 : 28) * s.life * (1 - clear);
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

function drawDebris() {
  const loose = pow(1 - smoothClamp(globalRecovery, 0.08, 0.96), 1.14);
  if (loose < 0.01) return;

  noStroke();
  for (const piece of debris) {
    const floatX = sin(tm * piece.floatSpeed + piece.phase) * piece.drift;
    const floatY = cos(tm * piece.floatSpeed * 0.73 + piece.phase * 1.31) * piece.drift * 0.7;
    const fallingY = tm * piece.fallSpeed;
    const y = ((piece.y + floatY + fallingY + 120) % (H + 240)) - 120;
    const damagedTone = piece.layer === 0
      ? lerpColor(color('#858E98'), color('#C5CBD1'), piece.depth)
      : piece.layer === 1
        ? lerpColor(color('#39434D'), color('#8B949E'), piece.depth)
        : lerpColor(color('#111821'), color('#2B3542'), piece.depth);
    const restoredTone = color(ASSEMBLY_FRAGMENT_COLORS[piece.colorIndex]);
    const colorArrival = smoothClamp(globalRecovery, 0.08, 0.62);
    const assemblyEmphasis = 1 + sin(constrain(globalRecovery, 0, 1) * PI) * 0.55;
    const tone = lerpColor(damagedTone, restoredTone, colorArrival * (piece.layer === 2 ? 0.5 : 0.82));
    tone.setAlpha(min(255, piece.alpha * assemblyEmphasis * smoothClamp(loose, 0, 0.72)));

    push();
    translate(piece.x + floatX, y);
    rotate(piece.rotation + tm * piece.spin);
    fill(tone);

    const size = piece.size * lerp(0.42, 1, loose);
    drawFragmentPrimitive(piece.shape, size, piece.stretch);
    pop();
  }
}

function drawRecoveredConstellation(pass = 'back') {
  const reveal = smoothClamp(globalRecovery, 0.64, 0.96);
  if (reveal <= 0.025) return;

  noStroke();
  const visibleCount = ceil(recoveredFragments.length * reveal);
  for (let pieceIndex = 0; pieceIndex < visibleCount; pieceIndex++) {
    const piece = recoveredFragments[pieceIndex];
    const isFront = piece.layer === 2;
    if ((pass === 'front') !== isFront) continue;

    const floatX = sin(tm * piece.floatSpeed + piece.phase) * piece.drift * motionScale;
    const floatY = cos(tm * piece.floatSpeed * 0.73 + piece.phase * 1.27) * piece.drift * 0.72 * motionScale;
    const scaleIn = lerp(0.18, 1, 1 - pow(1 - reveal, 3));

    push();
    translate(piece.x + floatX, piece.y + floatY);
    rotate(piece.rotation + tm * piece.spin * motionScale);

    if (piece.edge) {
      const edgePalette = ['#243B6C', '#395589', '#50658C', '#172B52'];
      const edgeColor = color(edgePalette[piece.colorIndex % edgePalette.length]);
      edgeColor.setAlpha(piece.alpha * reveal);
      fill(edgeColor);
    } else {
      const fragmentColor = color(RECOVERED_FRAGMENT_COLORS[piece.colorIndex]);
      fragmentColor.setAlpha(piece.alpha * reveal);
      fill(fragmentColor);
    }

    drawFragmentPrimitive(piece.shape, piece.size * scaleIn, piece.stretch);
    pop();
  }
}

function drawFragmentPrimitive(shape, size, stretch = 1) {
  if (shape === 0) {
    rect(0, 0, size * stretch, size * 0.58);
  } else if (shape === 1) {
    triangle(-size, size * 0.58, size * 0.82, size * 0.14, -size * 0.2, -size);
  } else if (shape === 2) {
    poly([
      [-size, -size * 0.35],
      [size * 0.45, -size * 0.7],
      [size, size * 0.28],
      [-size * 0.35, size * 0.72]
    ]);
  } else if (shape === 3) {
    rect(0, 0, size * 0.72, size * 0.72);
  } else if (shape === 4) {
    quad(
      -size * stretch, -size * 0.18,
      -size * 0.36, -size * 0.64,
      size * stretch, size * 0.12,
      size * 0.28, size * 0.62
    );
  } else if (shape === 5) {
    triangle(-size * 0.92, size * 0.4, size * 0.16, -size, size, size * 0.55);
  } else {
    poly([
      [-size * 0.92, -size * 0.22],
      [-size * 0.24, -size * 0.76],
      [size * 0.72, -size * 0.48],
      [size, size * 0.16],
      [size * 0.12, size * 0.76],
      [-size * 0.68, size * 0.48]
    ]);
  }
}

function drawPlatforms() {
  const ordered = modules.slice().sort((a, b) => a.y - b.y);
  for (const m of ordered) {
    const rec = moduleRecovery(m);
    const off = displayOffset(m, rec);

    push();
    translate(m.x + off.x, m.y + 42 * m.s + off.y);
    rotate(m.rot + off.r * 0.4);
    scale(m.s * (1 + m.hover * 0.025));

    noStroke();
    const damaged = damagedPalette(m);
    const restoredBase = m.id % 2 ? C.purple : C.blue;
    const individualPlatformAlpha = m.sharedLand ? 1 - sharedLandReveal() : 1;
    if (individualPlatformAlpha > 0.01) {
      const platformColor = lerpColor(damaged.base, color(restoredBase), rec);
      platformColor.setAlpha(255 * individualPlatformAlpha);
      fill(platformColor);
      drawFloatingBase(m, rec, damaged);
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
    scale(m.s * (1 + m.hover * 0.025));

    noStroke();
    const damaged = damagedPalette(m);
    drawLooseFragments(m, rec, damaged, 'back');
    if (m.kind === 'forest') drawForestHabitat(m, rec, damaged);
    else if (m.kind === 'water') drawWaterHabitat(m, rec, damaged);
    else if (m.kind === 'solar') drawSolarHabitat(m, rec, damaged);
    else if (m.kind === 'wind') drawWindHabitat(m, rec, damaged);
    else if (m.kind === 'community') drawCommunityHabitat(m, rec, damaged);
    else drawWildlifeHabitat(m, rec, damaged);
    drawLooseFragments(m, rec, damaged, 'front');

    pop();
  }
}

function partTransform(m, idx, rec, fn) {
  const part = m.parts[idx % m.parts.length];
  const t = smoothClamp(rec, part.delay, min(1, part.delay + 0.56));
  const loose = pow(1 - t, 1.08);
  const floatX = sin(tm * part.floatSpeed + part.floatPhase) * part.floatRadius * loose;
  const floatY = cos(tm * part.floatSpeed * 0.78 + part.floatPhase * 1.27) * part.floatRadius * 1.35 * loose;
  push();
  translate(part.fx * loose + floatX, part.fy * loose + floatY);
  rotate(part.fr * loose * 0.62 + sin(tm * 0.2 + part.floatPhase) * 0.055 * loose);
  fn(t);
  pop();
}

function drawLooseFragments(m, rec, damaged, pass = 'back') {
  // Let each constellation linger until the whole field catches up. This keeps
  // the recovery readable as one dramatic wave instead of isolated assets
  // snapping clean the moment their own energy reaches them.
  const fragmentRecovery = lerp(rec, globalRecovery, 0.72);
  const loose = pow(1 - smoothClamp(fragmentRecovery, 0.08, 0.98), 1.08);
  if (loose < 0.015) return;

  const fragments = m.fragments || [];
  for (let i = 0; i < fragments.length; i++) {
    const fragment = fragments[i];
    const visibleShare = min(1, loose * 1.42);
    if (i / max(1, fragments.length - 1) > visibleShare) continue;
    const isFront = fragment.layer === 2;
    if ((pass === 'front') !== isFront) continue;

    const pull = pow(loose, fragment.layer === 0 ? 0.86 : fragment.layer === 1 ? 0.78 : 0.68);
    const angle = fragment.angle + sin(tm * 0.09 + fragment.phase) * 0.12;
    const driftX = sin(tm * fragment.floatSpeed + fragment.phase) * fragment.drift;
    const driftY = cos(tm * fragment.floatSpeed * 0.77 + fragment.phase * 1.23) * fragment.drift * 0.72;
    const waveLift = sin(i * 0.7 + m.phase) * (fragment.layer === 0 ? 18 : fragment.layer === 1 ? 28 : 42);
    const x = (cos(angle) * fragment.radius * m.fragmentSpread + driftX) * pull;
    const y = (sin(angle) * fragment.radius * 0.54 + driftY + waveLift) * pull;
    const size = fragment.size * lerp(0.34, 1, loose);

    const globalX = m.x + x * m.s;
    const globalY = m.y + y * m.s;
    if (isProtectedUiPoint(globalX, globalY, fragment.layer === 2 ? size * 0.5 : 8)) continue;

    push();
    translate(x, y);
    rotate(fragment.rotation + angle * 0.24 + tm * fragment.spin);

    const damagedTone = fragment.layer === 0
      ? damaged.highlight
      : fragment.layer === 1
        ? damaged.mid
        : damaged.dark;
    const restoredTone = color(ASSEMBLY_FRAGMENT_COLORS[fragment.colorIndex]);
    const colorArrival = smoothClamp(max(rec, globalRecovery), 0.08, 0.62);
    const assemblyEmphasis = 1 + sin(constrain(fragmentRecovery, 0, 1) * PI) * 0.8;
    const fragmentColor = lerpColor(
      color(damagedTone),
      restoredTone,
      colorArrival * (fragment.layer === 2 ? 0.56 : 0.92)
    );
    fragmentColor.setAlpha(min(255, fragment.alpha * assemblyEmphasis * smoothClamp(loose, 0, 0.76)));
    fill(fragmentColor);
    drawFragmentPrimitive(fragment.shape, size, fragment.stretch);
    pop();
  }
}

function drawFloatingBase(m, rec, damaged) {
  const w = m.platform.w;
  const h = m.platform.h;
  const loose = pow(1 - smoothClamp(rec, 0.04, 0.9), 1.18);
  const gap = 14 * loose;
  const leftFloat = sin(tm * 0.24 + m.phase) * 5.5 * loose;
  const rightFloat = cos(tm * 0.21 + m.phase * 1.3) * 6.5 * loose;

  push();
  translate(-gap * 0.5, leftFloat);
  rotate(-0.055 * loose + sin(tm * 0.17 + m.phase) * 0.018 * loose);
  poly([
    [-w * 0.5, -h * 0.22],
    [-w * 0.38, -h * 0.5],
    [0, -h * 0.5],
    [0, h * 0.5],
    [-w * 0.36, h * 0.5]
  ]);
  pop();

  push();
  translate(gap * 0.5, rightFloat);
  rotate(0.052 * loose + cos(tm * 0.19 + m.phase) * 0.017 * loose);
  poly([
    [0, -h * 0.5],
    [w * 0.38, -h * 0.5],
    [w * 0.5, -h * 0.08],
    [w * 0.36, h * 0.5],
    [0, h * 0.5]
  ]);
  pop();

  if (loose > 0.03) {
    push();
    translate(
      sin(tm * 0.22 + m.phase) * 5 * loose,
      h * 1.16 + cos(tm * 0.18 + m.phase) * 7 * loose
    );
    rotate(tm * 0.08 + m.phase);
    const upperFragment = color(damaged.light);
    upperFragment.setAlpha(195 * loose);
    fill(upperFragment);
    rect(0, 0, 11 * loose, 11 * loose);
    pop();

    push();
    translate(
      cos(tm * 0.16 + m.phase) * 8 * loose,
      h * 2.08 + sin(tm * 0.14 + m.phase) * 9 * loose
    );
    rotate(QUARTER_PI + sin(tm * 0.12 + m.phase) * 0.22);
    const lowerFragment = color(damaged.dark);
    lowerFragment.setAlpha(190 * loose);
    fill(lowerFragment);
    rect(0, 0, 18 * loose, 18 * loose);
    pop();
  }
}

function poly(points) {
  beginShape();
  for (const p of points) vertex(p[0], p[1]);
  endShape(CLOSE);
}

function drawChamferedBase(cx, cy, w, h) {
  poly([
    [cx - w * 0.5, cy - h * 0.22],
    [cx - w * 0.38, cy - h * 0.5],
    [cx + w * 0.38, cy - h * 0.5],
    [cx + w * 0.5, cy - h * 0.08],
    [cx + w * 0.36, cy + h * 0.5],
    [cx - w * 0.36, cy + h * 0.5]
  ]);
}

function drawOctagon(cx, cy, radius) {
  beginShape();
  for (let i = 0; i < 8; i++) {
    const angle = QUARTER_PI * 0.5 + i * QUARTER_PI;
    vertex(cx + cos(angle) * radius, cy + sin(angle) * radius);
  }
  endShape(CLOSE);
}

function restoredFill(damaged, restored, rec) {
  return lerpColor(color(damaged), color(restored), constrain(rec, 0, 1));
}

function drawHouseBlock(cx, baseline, w, h, bodyColor, roofColor, loose = 0, phase = 0) {
  fill(bodyColor);
  rect(cx, baseline - h * 0.5, w, h);
  push();
  translate(
    sin(tm * 0.24 + phase) * 8 * loose,
    -loose * (9 + cos(phase) * 4) + cos(tm * 0.19 + phase) * 5 * loose
  );
  rotate(sin(tm * 0.17 + phase) * 0.09 * loose);
  fill(roofColor);
  triangle(
    cx - w * 0.58, baseline - h,
    cx, baseline - h - w * 0.34,
    cx + w * 0.58, baseline - h
  );
  pop();
}

function drawSolarPanel(cx, cy, w, h, panelColor, loose = 0, phase = 0) {
  push();
  translate(cx, cy);
  rotate(-0.12);
  fill(panelColor);
  const cellW = w * 0.46;
  const cellH = h * 0.42;
  const cells = [
    [-w * 0.25, -h * 0.25],
    [w * 0.25, -h * 0.25],
    [-w * 0.25, h * 0.25],
    [w * 0.25, h * 0.25]
  ];
  for (let i = 0; i < cells.length; i++) {
    const cellPhase = phase + i * 1.43;
    push();
    translate(
      cells[i][0] + sin(tm * 0.23 + cellPhase) * (8 + i * 1.5) * loose,
      cells[i][1] + cos(tm * 0.19 + cellPhase) * (9 + i) * loose
    );
    rotate(sin(tm * 0.16 + cellPhase) * 0.12 * loose);
    rect(0, 0, cellW, cellH);
    pop();
  }
  pop();
}

function drawSunPrimitive(size, restored = 1, damaged = null) {
  const palette = damaged || {
    light: color(C.grey),
    dark: color(C.darkGrey)
  };
  const orange = restoredFill(palette.light, C.orange, restored);
  const paper = restoredFill(palette.dark, C.paper, restored);
  fill(orange);
  drawOctagon(0, 0, size * 0.34);
  fill(paper);
  for (let i = 0; i < 4; i++) {
    push();
    rotate(i * HALF_PI);
    triangle(
      -size * 0.11, -size * 0.38,
      0, -size * 0.66,
      size * 0.11, -size * 0.38
    );
    pop();
  }
}

function drawWindPrimitive(size, angle = 0, restored = 1, loose = 0, phase = 0, damaged = null) {
  const palette = damaged || {
    light: color(C.grey),
    dark: color(C.darkGrey)
  };
  push();
  rotate(angle);
  fill(restoredFill(palette.light, C.paper, restored));
  for (let i = 0; i < 3; i++) {
    push();
    rotate(i * TWO_PI / 3);
    translate(
      sin(tm * 0.21 + phase + i * 1.7) * 10 * loose,
      -loose * (5 + i * 2) + cos(tm * 0.18 + phase + i) * 7 * loose
    );
    rotate(sin(tm * 0.14 + phase + i * 1.4) * 0.16 * loose);
    triangle(
      -size * 0.07, -size * 0.08,
      size * 0.08, -size * 0.5,
      size * 0.21, -size * 0.12
    );
    pop();
  }
  fill(restoredFill(palette.dark, C.orange, restored));
  circle(0, 0, size * 0.24);
  pop();
}

function drawForestHabitat(m, rec, damaged) {
  partTransform(m, 0, rec, () => {
    fill(restoredFill(damaged.mid, C.orange, rec));
    rect(-24, 8, 9, 44);
    rect(22, 14, 8, 32);
  });
  partTransform(m, 1, rec, () => {
    fill(restoredFill(damaged.highlight, C.lime, rec));
    drawOctagon(-24, -20, 27);
    drawOctagon(22, -9, 20);
  });
  partTransform(m, 2, rec, () => {
    fill(restoredFill(damaged.light, C.paper, rec));
    triangle(35, 26, 62, -12, 82, 26);
  });
}

function drawWaterHabitat(m, rec, damaged) {
  partTransform(m, 0, rec, () => {
    fill(restoredFill(damaged.light, C.paper, rec));
    triangle(-62, 28, -18, -36, 24, 28);
  });
  partTransform(m, 1, rec, () => {
    fill(restoredFill(damaged.mid, C.blue, rec));
    poly([[-72,6],[-48,-2],[-24,8],[2,-2],[30,8],[58,0],[72,18],[-72,18]]);
  });
  partTransform(m, 2, rec, () => {
    fill(restoredFill(damaged.dark, C.purple, rec));
    triangle(-52, 28, 0, 0, 58, 28);
  });
  partTransform(m, 3, rec, () => {
    fill(restoredFill(damaged.highlight, C.teal, rec));
    push();
    translate(52, -10);
    rotate(QUARTER_PI);
    rect(0, 0, 13, 13);
    pop();
  });
}

function drawSolarHabitat(m, rec, damaged) {
  partTransform(m, 0, rec, (t) => {
    drawSolarPanel(16, -12, 72, 42, restoredFill(damaged.highlight, C.orange, rec), 1 - t, m.phase);
  });
  partTransform(m, 1, rec, (t) => {
    drawHouseBlock(-40, 28, 34, 34, restoredFill(damaged.light, C.paper, rec), restoredFill(damaged.mid, C.orange, rec), 1 - t, m.phase + 1);
  });
  partTransform(m, 2, rec, (t) => {
    drawHouseBlock(52, 28, 30, 27, restoredFill(damaged.light, C.paper, rec), restoredFill(damaged.mid, C.orange, rec), 1 - t, m.phase + 2);
  });
  partTransform(m, 3, rec, () => {
    push();
    translate(-54, -42);
    scale(0.48);
    drawSunPrimitive(58, rec, damaged);
    pop();
  });
}

function drawWindHabitat(m, rec, damaged) {
  partTransform(m, 0, rec, () => {
    fill(restoredFill(damaged.mid, C.orange, rec));
    rect(8, -2, 10, 68);
  });
  partTransform(m, 1, rec, (t) => {
    push();
    translate(8, -40);
    drawWindPrimitive(74, windFanAngle * 0.18 + m.phase, rec, 1 - t, m.phase, damaged);
    pop();
  });
  partTransform(m, 2, rec, (t) => {
    drawHouseBlock(-42, 28, 34, 34, restoredFill(damaged.light, C.paper, rec), restoredFill(damaged.mid, C.blue, rec), 1 - t, m.phase + 1);
  });
  partTransform(m, 3, rec, (t) => {
    drawHouseBlock(50, 28, 30, 27, restoredFill(damaged.light, C.paper, rec), restoredFill(damaged.mid, C.blue, rec), 1 - t, m.phase + 2);
  });
}

function drawCommunityHabitat(m, rec, damaged) {
  const body = restoredFill(damaged.light, C.paper, rec);
  const roof = restoredFill(damaged.mid, C.orange, rec);
  partTransform(m, 0, rec, (t) => drawHouseBlock(-46, 28, 34, 30, body, roof, 1 - t, m.phase));
  partTransform(m, 1, rec, (t) => drawHouseBlock(0, 28, 48, 52, body, roof, 1 - t, m.phase + 1));
  partTransform(m, 2, rec, (t) => drawHouseBlock(48, 28, 34, 27, body, roof, 1 - t, m.phase + 2));
  partTransform(m, 3, rec, () => {
    fill(restoredFill(damaged.dark, C.teal, rec));
    rect(0, 20, 13, 20);
  });
}

function drawWildlifeHabitat(m, rec, damaged) {
  const animal = restoredFill(damaged.light, C.orange, rec);
  partTransform(m, 0, rec, () => {
    fill(animal);
    rect(-8, 2, 50, 30);
    rect(14, -20, 12, 34);
  });
  partTransform(m, 1, rec, () => {
    fill(animal);
    quad(10, -38, 34, -34, 38, -20, 14, -17);
    triangle(-34, -2, -52, -14, -34, 10);
  });
  partTransform(m, 2, rec, () => {
    fill(animal);
    rect(-22, 24, 7, 28);
    rect(10, 24, 7, 28);
  });
  partTransform(m, 3, rec, () => {
    fill(restoredFill(damaged.dark, C.orange, rec));
    rect(54, 8, 8, 34);
  });
  partTransform(m, 4, rec, () => {
    fill(restoredFill(damaged.highlight, C.lime, rec));
    drawOctagon(54, -18, 22);
  });
}

function updateWindCursor(dt) {
  const dx = pointerX - lastMouseX;
  const dy = pointerY - lastMouseY;
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
        x: pointerX, y: pointerY,
        dx: dx / len, dy: dy / len,
        life: 0.88
      });
      windTrailCooldown = 0.04;
    }
  } else {
    windFanSpeed = lerp(windFanSpeed, 0, 0.12);
  }

  lastMouseX = pointerX;
  lastMouseY = pointerY;
}

function drawEnergyCursor() {
  if (!dragging) return;

  push();
  translate(pointerX, pointerY);

  const brushColor = activeTool === 'sun' ? C.orange : C.blue;
  noStroke();
  fill(alphaColor(brushColor, 14));
  circle(0, 0, ENERGY_BRUSH_RADIUS * 2);
  fill(alphaColor(C.white, 7));
  circle(0, 0, ENERGY_BRUSH_RADIUS * 1.42);
  noFill();
  stroke(alphaColor(brushColor, 82));
  strokeWeight(3);
  circle(0, 0, ENERGY_BRUSH_RADIUS * 2);

  noStroke();
  if (activeTool === 'sun') {
    rotate(tm * 0.18 * motionScale);
    drawSunPrimitive(76, 1);
  } else {
    push();
    rotate(windFacing);
    fill(alphaColor(C.purple, 88));
    for (let i = 0; i < 3; i++) {
      rect(-58 - i * 20, (i - 1) * 13, 24, 7);
    }
    pop();
    drawWindPrimitive(88, windFanAngle, 1);
  }
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

function setStatus(msg, sec) {
  statusText = msg;
  statusUntil = tm + sec;
}

function artboardPointFromEvent(event) {
  const canvas = document.querySelector('canvas');
  if (!canvas) return { x: pointerX, y: pointerY };
  const rect = canvas.getBoundingClientRect();
  const source = event?.touches?.[0] || event?.changedTouches?.[0] || event;
  if (!source || !Number.isFinite(source.clientX) || !Number.isFinite(source.clientY)) {
    return { x: pointerX, y: pointerY };
  }
  return {
    x: constrain((source.clientX - rect.left) * ARTBOARD_WIDTH / rect.width, 0, ARTBOARD_WIDTH),
    y: constrain((source.clientY - rect.top) * ARTBOARD_HEIGHT / rect.height, 0, ARTBOARD_HEIGHT)
  };
}

function updatePointerFromEvent(event) {
  const point = artboardPointFromEvent(event);
  pointerX = point.x;
  pointerY = point.y;
  return point;
}

function mouseMoved(event) {
  updatePointerFromEvent(event);
  return false;
}

function mousePressed(event) {
  ensureAudioEnabled(true);
  const point = updatePointerFromEvent(event);
  dragging = true;
  dragPointerX = point.x;
  dragPointerY = point.y;
  return false;
}

function mouseDragged(event) {
  if (!dragging) return false;
  const point = updatePointerFromEvent(event);
  applyEnergy(activeTool, point.x, point.y, point.x - dragPointerX, point.y - dragPointerY);
  dragPointerX = point.x;
  dragPointerY = point.y;
  return false;
}

function mouseReleased(event) {
  updatePointerFromEvent(event);
  dragging = false;
  return false;
}

function touchStarted(event) {
  return mousePressed(event);
}

function touchMoved(event) {
  return mouseDragged(event);
}

function touchEnded(event) {
  return mouseReleased(event);
}

function keyPressed() {
  if (key === '1') {
    activeTool = 'sun';
    ensureAudioEnabled(false).then(() => playSelectSound('sun'));
    setStatus('SUN SELECTED · REBUILD THE FIELD GRADUALLY', 2.6);
  } else if (key === '2') {
    activeTool = 'wind';
    ensureAudioEnabled(false).then(() => playSelectSound('wind'));
    setStatus('WIND SELECTED · CLEAR POLLUTION WITH AIR FLOW', 2.6);
  } else if (key === 'r' || key === 'R') {
    regenerate();
  } else if (key === 's' || key === 'S') {
    saveCanvas('adapt_stage3_unified', 'png');
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

  playEnergySound(tool);

  const radius = ENERGY_BRUSH_RADIUS;
  const movementStrength = constrain(len / 24, 0.25, 1);
  const gain = ENERGY_BRUSH_GAIN * movementStrength;

  for (const m of modules) {
    const d = dist(x, y, m.x, m.y);
    if (d > radius) continue;
    const f = pow(1 - d / radius, 0.86);

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

function setupAudioControl() {
  const control = document.getElementById('sound-toggle');
  if (!control || control.dataset.ready === 'true') return;
  control.dataset.ready = 'true';

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    control.disabled = true;
    control.querySelector('.audio-control__state').textContent = 'SOUND UNAVAILABLE';
    return;
  }

  control.addEventListener('click', async (event) => {
    event.stopPropagation();
    createAudioGraph(AudioContextClass);

    audioEnabled = !audioEnabled;
    if (audioEnabled) {
      await audioContext.resume();
      await decodeAudioSamples();
      audioMaster.gain.setTargetAtTime(0.72, audioContext.currentTime, 0.02);
      if (!playSample('confirmation', { gain: 0.58 })) {
        playTone(392, 0.12, 'sine', 0.34);
        playTone(587, 0.18, 'sine', 0.22, 0.07);
      }
    } else {
      audioMaster.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.025);
    }

    control.setAttribute('aria-pressed', String(audioEnabled));
    control.querySelector('.audio-control__state').textContent = audioEnabled ? 'SOUND ON' : 'SOUND OFF';
  });
}

function createAudioGraph(AudioContextClass = window.AudioContext || window.webkitAudioContext) {
  if (!AudioContextClass || audioContext) return;
  audioContext = new AudioContextClass();
  audioMaster = audioContext.createGain();
  audioMaster.gain.value = 0.72;
  audioMaster.connect(audioContext.destination);
}

function preloadAudioSamples() {
  if (audioFetchPromise) return audioFetchPromise;
  document.body.dataset.audioAssets = 'loading';
  audioFetchPromise = Promise.all(
    Object.entries(AUDIO_FILES).map(async ([name, path]) => {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`Unable to load ${path}: ${response.status}`);
      audioFileData.set(name, await response.arrayBuffer());
    })
  ).then(() => {
    document.body.dataset.audioAssets = 'fetched';
  }).catch((error) => {
    document.body.dataset.audioAssets = 'error';
    console.warn('ADAPTS audio files could not be preloaded.', error);
  });
  return audioFetchPromise;
}

async function decodeAudioSamples() {
  if (!audioContext) return;
  if (audioBuffers.size === Object.keys(AUDIO_FILES).length) return;
  if (!audioDecodePromise) {
    audioDecodePromise = preloadAudioSamples().then(async () => {
      for (const [name, data] of audioFileData.entries()) {
        if (!audioBuffers.has(name)) {
          audioBuffers.set(name, await audioContext.decodeAudioData(data.slice(0)));
        }
      }
      document.body.dataset.audioAssets = audioBuffers.size === Object.keys(AUDIO_FILES).length
        ? 'ready'
        : 'error';
    }).catch((error) => {
      document.body.dataset.audioAssets = 'error';
      console.warn('ADAPTS audio files could not be decoded.', error);
    });
  }
  await audioDecodePromise;
}

async function ensureAudioEnabled(playConfirmation = false) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  const isFirstActivation = !audioContext;
  createAudioGraph(AudioContextClass);

  audioEnabled = true;
  document.body.dataset.audioEnabled = 'true';
  await audioContext.resume();
  await decodeAudioSamples();

  if (isFirstActivation && playConfirmation) {
    if (!playSample('confirmation', { gain: 0.58 })) {
      playTone(392, 0.12, 'sine', 0.24);
      playTone(587, 0.18, 'sine', 0.15, 0.07);
    }
  }
}

function stopSample(key) {
  const active = activeSampleSources.get(key);
  if (!active) return;
  try {
    active.stop();
  } catch (error) {
    // The sample may already have ended; clearing the reference is sufficient.
  }
  activeSampleSources.delete(key);
}

function playSample(name, options = {}) {
  if (!audioEnabled || !audioContext || !audioMaster) return false;
  const buffer = audioBuffers.get(name);
  if (!buffer) return false;

  const {
    gain: level = 0.5,
    rate = 1,
    delay = 0,
    exclusive = null
  } = options;

  if (exclusive) stopSample(exclusive);
  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();
  source.buffer = buffer;
  source.playbackRate.value = rate;
  gain.gain.value = level;
  source.connect(gain);
  gain.connect(audioMaster);
  if (exclusive) {
    activeSampleSources.set(exclusive, source);
    source.addEventListener('ended', () => {
      if (activeSampleSources.get(exclusive) === source) activeSampleSources.delete(exclusive);
    });
  }
  source.start(audioContext.currentTime + delay);
  document.body.dataset.lastSound = name;
  const history = (document.body.dataset.soundHistory || '').split(',').filter(Boolean);
  history.push(name);
  document.body.dataset.soundHistory = history.slice(-24).join(',');
  return true;
}

function playTone(frequency, duration, type = 'sine', level = 0.2, delay = 0) {
  if (!audioEnabled || !audioContext || !audioMaster) return;
  const start = audioContext.currentTime + delay;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(level, start + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(audioMaster);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
}

function playSelectSound(tool) {
  if (tool === 'sun') {
    if (!playSample('solarSelect', { gain: 0.48, exclusive: 'selection' })) {
      playTone(440, 0.16, 'sine', 0.2);
      playTone(660, 0.2, 'sine', 0.12, 0.04);
    }
  } else {
    if (!playSample('windPaper', { gain: 0.38, rate: 0.94, exclusive: 'selection' })) {
      playTone(220, 0.2, 'triangle', 0.18);
      playTone(330, 0.18, 'sine', 0.1, 0.04);
    }
  }
}

function playEnergySound(tool) {
  if (!audioEnabled || !audioContext) return;
  const now = performance.now();
  const cooldown = tool === 'sun' ? 1050 : 720;
  if (now - lastEnergySoundAt[tool] < cooldown) return;
  lastEnergySoundAt[tool] = now;
  const recoveryLift = globalRecovery * 90;
  if (tool === 'sun') {
    if (!playSample('solarEnergy', {
      gain: 0.24,
      rate: 0.96 + globalRecovery * 0.08,
      exclusive: 'energy'
    })) {
      playTone(360 + recoveryLift, 0.11, 'sine', 0.085);
    }
  } else {
    if (!playSample('windPaper', {
      gain: 0.3,
      rate: 0.9 + globalRecovery * 0.12,
      exclusive: 'energy'
    })) {
      playTone(180 + recoveryLift * 0.55, 0.13, 'triangle', 0.07);
    }
  }
}

function playAssemblySound() {
  if (!playSample('assemblyKeyboard', { gain: 0.98, exclusive: 'assembly' })) {
    [246, 294, 370].forEach((note, index) => {
      playTone(note, 0.18, 'triangle', 0.1, index * 0.09);
    });
  } else {
    document.body.dataset.assemblyCue = 'keyboard';
  }
}

function playCompletionSound() {
  if (!playSample('recoveryWater', { gain: 0.72, exclusive: 'recovery' })) {
    [392, 494, 587, 784].forEach((note, index) => {
      playTone(note, 0.42, index % 2 ? 'triangle' : 'sine', 0.13, index * 0.085);
    });
  } else {
    document.body.dataset.recoveryCue = 'water';
  }
}
