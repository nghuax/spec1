
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
  // Shared HARM / EXHAUST visual family. Stage 3 now opens from EXHAUST's
  // fully-polluted palette and recovers into the clean HEAL palette.
  ink: '#141414',
  bg0: '#241E28',
  bg1: '#131A37',
  bg2: '#12141C',
  white: '#F4F1EC',
  paper: '#F4F1EC',
  soft: '#D8DBE3',
  grey: '#8F96A3',
  darkGrey: '#4E5057',
  blue: '#2930FF',
  purple: '#6952EB',
  orange: '#FF7900',
  lime: '#B3FF36',
  green: '#B3FF36',
  leaf: '#2930FF',
  red: '#FF7900',
  yellow: '#B3FF36',
  pink: '#FF7900',
  teal: '#6952EB',
  brown: '#8A3F00'
};

// Exact continuity colors taken from EXHAUST at full pollution. These are used
// only as Stage 3's starting state; interaction and recovery mechanics are unchanged.
const STAGE2_END = Object.freeze({
  sky: '#241E28',
  charcoal: '#262427',
  brown: '#3C2F26',
  grey: '#575352',
  paper: '#B8AE9F',
  blue: '#3C3C69',
  purple: '#4E415E',
  orange: '#AA5E28',
  lime: '#786C38'
});

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
let energyLinks = [];

let W = 0;
let H = 0;
let tm = 0;
let elapsedTime = 0;
let experienceMode = 'manual';
let guidedTime = 0;
let guidedPhase = 'ready';
let paused = false;
let audioMuted = false;
let lastProgressSignature = '';
let nextProgressAt = 0;

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
let recoveryWaterPlayed = false;
let audioContext = null;
let audioMaster = null;
let audioEnabled = false;
let audioFetchPromise = null;
let audioDecodePromise = null;
// Recorded cues and their recommended mixer levels.
const SOUND_MIX_CHANNELS = [
  { id: 'confirmation', label: 'Confirmation', recommended: 60 },
  { id: 'solarSelect', label: 'Solar selection', recommended: 60 },
  { id: 'solarEnergy', label: 'Solar energy', recommended: 60 },
  { id: 'windPaper', label: 'Wind brush', recommended: 60 },
  { id: 'recoveryWater', label: '90% recovery', recommended: 60 },
  { id: 'assemblyKeyboard', label: 'Assembly texture', recommended: 50 },
  { id: 'cameraShutter', label: 'Assembly shutter', recommended: 60 },
  { id: 'mouseClick', label: 'Button click', recommended: 60 },
  { id: 'keyboardReverse', label: 'Button hover', recommended: 60 }
];
const soundMixLevels = Object.fromEntries(SOUND_MIX_CHANNELS.map(({ id, recommended }) => [id, recommended]));
const audioChannelGains = new Map();

const audioFileData = new Map();
const audioBuffers = new Map();
const activeSampleSources = new Map();
const lastEnergySoundAt = { sun: -Infinity, wind: -Infinity };
let fpsWindowStartedAt = 0;
let fpsWindowFrames = 0;

const AUDIO_FILES = Object.freeze({
  confirmation: 'assets/audio/COMM2754-2026-S4099019-A2w08-ADAPTS-Interface-Confirmation-01.wav',
  solarSelect: 'assets/audio/COMM2754-2026-S4099019-A2w08-ADAPTS-Solar-Selection-02.wav',
  solarEnergy: 'assets/audio/COMM2754-2026-S4099019-A2w08-ADAPTS-Solar-Energy-Activation-03.wav',
  windPaper: 'assets/audio/COMM2754-2026-S4099019-A2w08-ADAPTS-Wind-Brush-Paper-02.wav',
  recoveryWater: 'assets/audio/COMM2754-2026-S4099019-A2w08-ADAPTS-Recovery-Water-05.wav',
  assemblyKeyboard: 'assets/audio/COMM2754-2026-S4099019-A2w08-ADAPTS-Assembly-Keyboard-06.wav',
  cameraShutter: 'assets/audio/COMM2754-2026-S4099019-A2w08-ADAPTS-Camera-Shutter.wav',
  mouseClick: 'assets/audio/COMM2754-2026-S4099019-A2w08-ADAPTS-MouseClick.wav',
  keyboardReverse: 'assets/audio/COMM2754-2026-S4099019-A2w08-ADAPTS-KeyboardReverse.mp3'
});

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const motionScale = reducedMotion ? 0.18 : 1;
const ENERGY_BRUSH_RADIUS = 580;
// Moderately relaxed pacing for charging, guided replay, assembly, and recovery.
// This is about 18% slower than the previous timing while keeping input responsive.
const PROGRESSION_PACE = 0.72;
const ENERGY_BRUSH_GAIN = 0.18 * PROGRESSION_PACE;
const ASSEMBLY_FRAGMENT_COLORS = [
  C.orange,
  C.lime,
  C.blue,
  C.ink,
  C.paper,
  C.purple
];
const RECOVERED_FRAGMENT_COLORS = [
  '#FF7900',
  '#B3FF36',
  '#2930FF',
  '#141414',
  '#F4F1EC',
  '#6952EB'
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
  const viewport = document.getElementById('artwork-viewport');
  if (viewport) new ResizeObserver(fitArtboardToWindow).observe(viewport);
  preloadAudioSamples();
  regenerate();
  window.addEventListener('adapt:command', handleArtworkCommand);
  publishProgress(true);
}

function windowResized() {
  fitArtboardToWindow();
}

function fitArtboardToWindow() {
  const app = document.getElementById('app');
  if (!app) return;
  const viewport = document.getElementById('artwork-viewport');
  const displayScale = min(
    (viewport?.clientWidth || window.innerWidth) / ARTBOARD_WIDTH,
    (viewport?.clientHeight || window.innerHeight) / ARTBOARD_HEIGHT
  );
  app.style.transform = `scale(${displayScale})`;
  viewport?.style.setProperty('--artboard-scale', String(displayScale));
  // The interface shares the fitted artboard bounds; it never reserves a footer.
  viewport?.style.setProperty('--artwork-width', `${ARTBOARD_WIDTH * displayScale}px`);
  viewport?.style.setProperty('--artwork-height', `${ARTBOARD_HEIGHT * displayScale}px`);
}

function regenerate() {
  [...activeSampleSources.keys()].forEach(stopSample);
  document.body.dataset.soundHistory = '';
  W = width;
  H = height;
  tm = 0;
  elapsedTime = 0;
  guidedTime = 0;
  guidedPhase = 'ready';
  experienceMode = 'manual';
  paused = false;
  if (audioEnabled && audioContext) audioContext.resume().catch(() => {});

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
  recoveryWaterPlayed = false;
  lastEnergySoundAt.sun = -Infinity;
  lastEnergySoundAt.wind = -Infinity;
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
  buildEnergyNetwork();
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
    modules.forEach((m) => {
      m.sun = 1;
      m.wind = 1;
      m.visualRecovery = 1;
    });
    globalRecovery = 1;
    finalTriggered = true;
    stateTwoAnnounced = true;
  }

  announceArtworkState(isRestoredPreview ? 2 : 1);

  setStatus('Drag to add sunlight, or use the circular arrow to reset and replay.', 3);
  publishProgress(true);
}

// Functional array methods build a real network, not a fixed illustration:
// filter selects energy sources/receivers; map creates one link per receiver.
function buildEnergyNetwork() {
  const sources = modules.filter((habitat) => habitat.kind === 'solar' || habitat.kind === 'wind');
  energyLinks = modules
    .filter((habitat) => habitat.kind !== 'solar' && habitat.kind !== 'wind')
    .map((target, index) => {
      const candidates = sources.filter((source) => source.kind === (index % 2 ? 'wind' : 'solar'));
      const source = (candidates.length ? candidates : sources).reduce((nearest, candidate) => {
        if (!nearest) return candidate;
        return Math.hypot(candidate.homeX - target.homeX, candidate.homeY - target.homeY)
          < Math.hypot(nearest.homeX - target.homeX, nearest.homeY - target.homeY) ? candidate : nearest;
      }, null);
      return { source, target, phase: random() };
    })
    .filter((link) => link.source !== null);
}

function currentGuidance() {
  if (paused) return 'Paused — resume when you are ready.';
  if (stateTwoAnnounced) return 'The clean-energy network is ready. Continue the HEAL journey.';
  if (elapsedTime < statusUntil && statusText) return statusText;
  if (finalTriggered) return 'Both sources are connected — watch the network assemble.';
  if (experienceMode === 'guided') {
    if (guidedPhase === 'sun') return 'Sunlight activates the panels and prepares the habitats.';
    if (guidedPhase === 'wind') return 'Wind clears pollution and completes the energy mix.';
    return 'Disconnected habitats need a reliable clean-energy network.';
  }
  const sun = averageCharge('sun');
  const wind = averageCharge('wind');
  if (sun > wind + 0.28) return 'Sunlight is building up — select WIND to complete the balance.';
  if (wind > sun + 0.28) return 'Wind is clearing the field — select SUN to complete the balance.';
  return activeTool === 'sun' ? 'Drag over habitats to add sunlight.' : 'Drag over habitats to add wind.';
}

function publishProgress(force = false) {
  if (!force && performance.now() < nextProgressAt) return;
  nextProgressAt = performance.now() + 100;
  const detail = {
    tool: activeTool,
    sun: round(averageCharge('sun') * 100),
    wind: round(averageCharge('wind') * 100),
    recovery: stateTwoAnnounced ? 100 : min(99, round(globalRecovery * 100)),
    completed: stateTwoAnnounced,
    mode: experienceMode,
    paused,
    sound: !audioMuted,
    phase: guidedPhase,
    status: currentGuidance()
  };
  document.body.dataset.recovery = String(detail.recovery);
  document.body.dataset.sun = String(detail.sun);
  document.body.dataset.wind = String(detail.wind);
  document.body.dataset.mode = experienceMode;
  document.body.dataset.paused = String(paused);
  document.body.dataset.guidedSeconds = guidedTime.toFixed(1);
  const signature = JSON.stringify(detail);
  if (force || signature !== lastProgressSignature) {
    lastProgressSignature = signature;
    window.dispatchEvent(new CustomEvent('adapt:progress', { detail }));
  }
}

function selectEnergyTool(tool) {
  if (tool !== 'sun' && tool !== 'wind') return;
  experienceMode = 'manual';
  activeTool = tool;
  setStatus(tool === 'sun' ? 'SUN selected — drag to activate the panels.' : 'WIND selected — drag to clear pollution.', 1.7);
  publishProgress(true);
}

function handleArtworkCommand(event) {
  const command = event.detail || {};
  if (command.action === 'tool') selectEnergyTool(command.tool);
  else if (command.action === 'start' || command.action === 'reset') {
    resetAndReplay();  } else if (command.action === 'pause') {
    paused = !paused;
    dragging = false;
    if (audioContext) {
      const operation = paused ? audioContext.suspend() : audioEnabled ? audioContext.resume() : null;
      operation?.catch(() => {});
    }
  } else if (command.action === 'sound') toggleSound();
  else if (command.action === 'mix') setSoundMixLevel(command.channel, command.level);
  else if (command.action === 'mix-reset') resetSoundMix();
  else if (command.action === 'mix-preview') {
    const channel = SOUND_MIX_CHANNELS.find(({ id }) => id === command.channel);
    if (channel) ensureAudioEnabled().then(() => playSample(channel.id, { gain: channel.recommended / 100, exclusive: 'mix-preview' }));
  }
  else if (command.action === 'save') exportArtwork();
  publishProgress(true);
}

// One action owns start, replay and reset, including the R shortcut.
function resetAndReplay() {
  regenerate();
  experienceMode = 'guided';
  guidedPhase = 'damage';
  setStatus('Watch the habitats reconnect through sunlight and wind.', 2);
  ensureAudioEnabled();
  publishProgress(true);
}

function updateGuidedSequence(dt) {
  if (experienceMode !== 'guided' || stateTwoAnnounced) return;
  guidedTime += dt * PROGRESSION_PACE;
  const phase = guidedTime < 2 ? 'damage' : guidedTime < 8 ? 'sun' : guidedTime < 14 ? 'wind' : 'assembly';
  if (phase !== guidedPhase) {
    guidedPhase = phase;
    statusUntil = 0;
    if (phase === 'sun' || phase === 'wind') {
      activeTool = phase;
      ensureAudioEnabled().then(() => playSelectSound(phase));
    }
  }
  // forEach updates each habitat independently with a slightly staggered arrival.
  modules.forEach((habitat, index) => {
    const stagger = index * 0.025;
    habitat.sun = max(habitat.sun, smoothClamp(guidedTime, 2 + stagger, 7.6 + stagger));
    habitat.wind = max(habitat.wind, smoothClamp(guidedTime, 8 + stagger, 13.6 + stagger));
  });
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
  const count = floor(random(36, 49));
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
        : random(32, 70);

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
      alpha: layer === 0 ? random(24, 42) : layer === 1 ? random(40, 74) : random(18, 32)
    });
  }
}

function buildRecoveredConstellation() {
  // The recovered field keeps a visible memory of the scattered pieces. Small,
  // saturated fragments connect the separate habitats into one living system;
  // larger slate shards at the perimeter create foreground depth.
  const fragmentCount = floor(random(82, 104));

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
      alpha: layer === 0 ? random(110, 175) : random(145, 205)
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
  const inTools = x < 620 + margin && y > 300 - margin && y < 500 + margin;
  const inRecovery = x > 1390 - margin && y < 370 + margin;
  const inOptions = x > 1660 - margin && y > 780 - margin;
  const inSubtitle = x > 270 - margin && x < 1640 + margin && y > 880 - margin;
  return inTitle || inTools || inSubtitle || inRecovery || inOptions;
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
  if (!paused) {
    // One motion clock controls all decorative movement, including particles,
    // bobbing, smoke and rotation. Recovery timing remains readable when reduced.
    tm += dt * motionScale;
    elapsedTime += dt;
  }
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

  if (!paused) {
    updateGuidedSequence(dt);
    updateWindCursor(dt);
    updateModules(dt);
    updateSmoke(dt);
    updateParticles(dt);
  }
  publishProgress();

  drawBackground();
  drawSmoke();
  drawDebris();
  drawRecoveredConstellation('back');
  drawEnergyNetwork();
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
  drawBackgroundHills(rec);
  drawSkyGuides(rec);
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
  // Stage 3 begins where EXHAUST ends: the dirty plum sky and muted versions
  // of the shared blue / orange / lime family. The geometry still regenerates
  // on every reset, but the palette hand-off is now exact and intentional.
  const centerX = random(860, 1260);
  const centerY = random(430, 650);
  const rotationOffset = random(-0.42, 0.22);
  const outerRx = random(520, 720);
  const outerRy = random(300, 440);

  damagedField = {
    base: STAGE2_END.sky,
    layers: [
      {
        color: STAGE2_END.charcoal,
        points: [
          [random(-180, 80), random(90, 300)],
          [random(980, 1480), random(-140, 70)],
          [random(1900, 2120), random(360, 710)],
          [random(760, 1260), random(1080, 1230)],
          [random(-160, 120), random(850, 1100)]
        ]
      },
      {
        color: STAGE2_END.brown,
        points: [
          [random(100, 330), random(180, 350)],
          [random(1350, 1730), random(90, 250)],
          [random(1770, 2040), random(720, 970)],
          [random(620, 1120), random(1010, 1180)],
          [random(-100, 130), random(560, 820)]
        ]
      },
      {
        color: STAGE2_END.blue,
        points: makeFieldPolygon(centerX, centerY, outerRx, outerRy, floor(random(6, 9)), rotationOffset, 0.14)
      },
      {
        color: STAGE2_END.purple,
        points: makeFieldPolygon(
          centerX + random(-50, 50), centerY + random(-35, 38),
          outerRx * random(0.58, 0.72), outerRy * random(0.54, 0.68),
          floor(random(5, 8)), rotationOffset + random(-0.22, 0.22), 0.16
        )
      },
      {
        color: STAGE2_END.grey,
        points: makeFieldPolygon(
          centerX + random(-65, 65), centerY + random(-45, 48),
          outerRx * random(0.27, 0.42), outerRy * random(0.24, 0.38),
          floor(random(5, 8)), rotationOffset + random(-0.3, 0.3), 0.2
        )
      }
    ]
  };
}

function buildRestoredField() {
  // Same dark editorial field used in HARM/EXHAUST, with bright cut-paper
  // accents gradually returning instead of switching to a different blue world.
  const palette = {
    base: C.bg2,
    sweep: '#17204A',
    accent: C.blue,
    outer: '#1C286D',
    middle: '#2930FF',
    inner: '#6952EB'
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
      { color: palette.outer, points: makeFieldPolygon(centerX, centerY, outerRx, outerRy, vertexCount, rotationOffset, 0.12) },
      { color: palette.middle, points: makeFieldPolygon(centerX + random(-50, 55), centerY + random(-35, 40), outerRx * random(0.58, 0.72), outerRy * random(0.54, 0.68), floor(random(5, 8)), rotationOffset + random(-0.24, 0.24), 0.16) },
      { color: palette.inner, points: makeFieldPolygon(centerX + random(-70, 75), centerY + random(-50, 55), outerRx * random(0.27, 0.42), outerRy * random(0.24, 0.38), floor(random(5, 8)), rotationOffset + random(-0.34, 0.34), 0.2) }
    ]
  };
}

function buildRestoredLand() {
  const horizontalDirection = random() < 0.5 ? -1 : 1;
  const w = random(780, 850);
  const h = random(138, 174);

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

  const landColor = lerpColor(color(STAGE2_END.charcoal), color('#3247CC'), smoothClamp(globalRecovery, 0.5, 0.94));
  landColor.setAlpha(255 * reveal);
  fill(landColor);
  poly(restoredLand.points);
  pop();
}

function drawDepthField(rec) {
  const stateOneBase = color(damagedField?.base || STAGE2_END.sky);
  const restoredBase = color(restoredField?.palette.base || C.bg2);

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

  fill(alphaColor(restoredField.palette.sweep, 160 * reveal));
  poly(restoredField.sweep);

  fill(alphaColor(restoredField.palette.accent, 72 * reveal));
  poly(restoredField.accent);

  for (const layer of restoredField.layers) {
    fill(alphaColor(layer.color, 118 * reveal));
    poly(layer.points);
  }

  pop();
}


function drawBackgroundHills(rec) {
  const reveal = smoothClamp(rec, 0.12, 0.98);
  push();
  noStroke();
  const hillBack = lerpColor(color(STAGE2_END.grey), color('#4256BE'), reveal * 0.95);
  hillBack.setAlpha(170);
  fill(hillBack);
  poly([[530, 712],[660, 612],[820, 556],[972, 608],[1118, 564],[1296, 620],[1460, 562],[1596, 646],[1650, 758],[522,760]]);
  const hillMid = lerpColor(color(STAGE2_END.purple), color('#31408E'), reveal);
  hillMid.setAlpha(195);
  fill(hillMid);
  poly([[640, 758],[770, 662],[905, 634],[1036, 690],[1166, 628],[1316, 692],[1450, 660],[1566, 724],[1580, 834],[626,834]]);
  const hillFront = lerpColor(color(STAGE2_END.charcoal), color('#202F78'), reveal);
  hillFront.setAlpha(232);
  fill(hillFront);
  poly([[0, 1080],[0, 946],[236, 894],[426, 950],[604, 916],[770, 972],[962, 920],[1164, 958],[1372, 918],[1626, 986],[1920, 930],[1920,1080]]);
  pop();
}

function drawSkyGuides(rec) {
  const reveal = smoothClamp(rec, 0.26, 0.98);
  push();
  noStroke();
  fill(244,241,236, 30 + 28 * reveal);
  poly([[347,323],[377,301],[430,304],[452,323]]);
  poly([[1206,352],[1229,336],[1268,338],[1290,356]]);
  pop();
}

function moduleDepth(m) {
  return constrain(map(m.homeY, 220, 820, 0, 1), 0, 1);
}

function damagedPalette(m) {
  const depth = moduleDepth(m);
  return {
    highlight: lerpColor(color(STAGE2_END.paper), color('#CDC2B1'), depth),
    light: lerpColor(color(STAGE2_END.lime), color('#95885A'), depth),
    mid: lerpColor(color(STAGE2_END.orange), color('#8A6745'), depth),
    dark: lerpColor(color(STAGE2_END.purple), color(STAGE2_END.blue), depth),
    base: lerpColor(color(STAGE2_END.brown), color(STAGE2_END.grey), depth)
  };
}

function flowAt(x, y, seedOff = 0) {
  const a = noise(x * 0.00135 + seedOff, y * 0.00125 + seedOff, tm * 0.06) * TWO_PI * 2.5;
  const m = map(noise(x * 0.0009 + 10, y * 0.0008 + 20, tm * 0.05 + seedOff), 0, 1, 0.18, 0.92);
  return { x: cos(a) * m, y: sin(a) * m };
}

function moduleCharge(m) {
  const dual = min(m.sun, m.wind);
  // One source visibly prepares the habitat (up to 30%); both are needed for 100%.
  return constrain(dual * 0.4 + (m.sun + m.wind) * 0.3, 0, 1);
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

  // Once a source reaches 80%, carry it to the remaining habitats. Keep the
  // sources independent so the player still needs to supply both SUN and WIND.
  const finishSun = finalTriggered || averageCharge('sun') >= 0.8;
  const finishWind = finalTriggered || averageCharge('wind') >= 0.8;
  for (const m of modules) {
    if (finishSun) m.sun = min(1, m.sun + dt * 0.35 * PROGRESSION_PACE);
    if (finishWind) m.wind = min(1, m.wind + dt * 0.35 * PROGRESSION_PACE);

    const rawRecovery = moduleCharge(m);
    rawTotal += rawRecovery;
    const visualTarget = constrain(rawRecovery * 0.42 + smoothClamp(rawRecovery, m.assemblyDelay, 0.98) * 0.58, 0, 1);
    const assemblyRate = (finalTriggered ? 1.8 : 0.9) * PROGRESSION_PACE;
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

    // Layout generation already reserves the title/control areas. Do not kick
    // moving habitats away from a hard UI boundary here: their home attraction
    // would pull them across it again, causing repeated jumps in the shared land.

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

  const backgroundEase = 1 - exp(-dt * (finalTriggered ? 1.6 : 0.9) * PROGRESSION_PACE);
  globalRecovery = lerp(globalRecovery, total / modules.length, backgroundEase);

  // Water marks the near-complete state once, exactly when the displayed
  // recovery progress reaches 90 percent.
  if (!recoveryWaterPlayed && round(globalRecovery * 100) >= 90) {
    recoveryWaterPlayed = playSample('recoveryWater', {
      gain: 0.72,
      exclusive: 'recovery-water',
      finishPrevious: true
    });
  }

  const rawAverage = rawTotal / modules.length;
  const sunAverage = averageCharge('sun');
  const windAverage = averageCharge('wind');

  if (!finalTriggered && rawAverage > 0.78 && min(sunAverage, windAverage) > 0.76) {
    finalTriggered = true;
    setStatus('BALANCE LOCKED · WATCH THE FIELD REASSEMBLE', 5.5);
    playAssemblySound();
  }

  if (finalTriggered && !stateTwoAnnounced && globalRecovery > 0.985) {
    stateTwoAnnounced = true;
    globalRecovery = 1;
    modules.forEach((habitat) => { habitat.sun = 1; habitat.wind = 1; habitat.visualRecovery = 1; });
    announceArtworkState(2);
    setStatus('A connected clean-energy network is ready.', 4);
    playSample('confirmation', { gain: 0.58, exclusive: 'completion-confirmation' });
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
    s.x += s.vx * 60 * dt * motionScale;
    s.y += s.vy * 60 * dt * motionScale;
    s.rot += s.vr * 60 * dt * motionScale;
    s.life = max(0.03, s.life - dt * (0.002 + clear * 0.018));

    if (s.x < -60) s.x = W + 60;
    if (s.x > W + 60) s.x = -60;
    if (s.y < -30) s.y = H + 20;
    if (s.y > H + 40) s.y = -20;
  }
}

function updateParticles(dt) {
  // forEach advances each particle. filter returns only living particles,
  // avoiding splice/index errors and keeping the generative system bounded.
  sunBursts.forEach((burst) => {
    burst.life -= dt * 1.1;
    burst.r += dt * 220 * motionScale;
  });
  sunBursts = sunBursts.filter((burst) => burst.life > 0);

  windLines.forEach((line) => {
    line.life -= dt * 1.45;
    line.x += line.dx * 270 * dt * motionScale;
    line.y += line.dy * 270 * dt * motionScale;
  });
  windLines = windLines.filter((line) => line.life > 0);

  pollen.forEach((p) => {
    const flow = flowAt(p.x, p.y, 500);
    p.vx = lerp(p.vx, flow.x * 0.75, 0.05);
    p.vy = lerp(p.vy, flow.y * 0.45 - 0.14, 0.05);
    p.x += p.vx * 60 * dt * motionScale;
    p.y += p.vy * 60 * dt * motionScale;
    p.life -= dt * 0.28;
  });
  pollen = pollen.filter((p) => p.life > 0);
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

    const col = s.dark ? color(STAGE2_END.charcoal) : color(STAGE2_END.grey);
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
      ? lerpColor(color(STAGE2_END.paper), color('#CEC3B2'), piece.depth)
      : piece.layer === 1
        ? lerpColor(color(STAGE2_END.grey), color(STAGE2_END.orange), piece.depth)
        : lerpColor(color(STAGE2_END.charcoal), color(STAGE2_END.blue), piece.depth);
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
      const edgePalette = [C.blue, C.purple, C.ink, C.paper];
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

function drawEnergyNetwork() {
  const reveal = smoothClamp(globalRecovery, 0.28, 0.94);
  if (reveal < 0.01) return;
  push();
  energyLinks.forEach(({ source, target, phase }) => {
    const from = displayOffset(source, moduleRecovery(source));
    const to = displayOffset(target, moduleRecovery(target));
    const startX = source.x + from.x;
    const startY = source.y + from.y + 50 * source.s;
    const endX = target.x + to.x;
    const endY = target.y + to.y + 50 * target.s;
    const bend = min(72, abs(endX - startX) * 0.18 + 20);
    const point = (t) => ({ x: lerp(startX, endX, t), y: lerp(startY, endY, t) - sin(t * PI) * bend });
    const tint = source.kind === 'sun' || source.kind === 'solar' ? C.orange : C.lime;
    stroke(alphaColor(tint, 66 * reveal));
    strokeWeight(2);
    noFill();
    for (let segment = 0; segment < 24; segment++) {
      const a = point(segment / 24);
      const b = point((segment + 1) / 24);
      if (!isProtectedUiPoint(a.x, a.y, 8) && !isProtectedUiPoint(b.x, b.y, 8)) line(a.x, a.y, b.x, b.y);
    }
    noStroke();
    fill(alphaColor(tint, 235 * reveal));
    for (let pulse = 0; pulse < 3; pulse++) {
      const p = point((tm * 0.055 + phase + pulse / 3) % 1);
      if (!isProtectedUiPoint(p.x, p.y, 10)) {
        push();
        translate(p.x, p.y);
        rotate(QUARTER_PI);
        rect(0, 0, 7, 7);
        pop();
      }
    }
  });
  pop();
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
    const restoredBase = m.id % 3 === 0 ? C.ink : m.id % 2 ? C.purple : C.blue;
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
  // Keep the main panel/roof/turbine recognisable even while its pieces detach.
  const anchor = idx < 2 ? 0.38 : 0.82;
  const loose = pow(1 - t, 1.08) * anchor;
  const floatX = sin(tm * part.floatSpeed + part.floatPhase) * part.floatRadius * loose;
  const floatY = cos(tm * part.floatSpeed * 0.78 + part.floatPhase * 1.27) * part.floatRadius * 1.35 * loose;
  push();
  translate(part.fx * loose + floatX, part.fy * loose + floatY);
  rotate(part.fr * loose * 0.62 + sin(tm * 0.2 + part.floatPhase) * 0.055 * loose);
  fn(idx < 2 ? lerp(0.32, 1, t) : t);
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

function adaptHouseVariant(phase = 0) {
  return abs(floor(phase * 997)) % 4;
}

function drawHouseBodyShape(v, w, h) {
  const i = ((v % 4) + 4) % 4;
  if (i === 1) poly([[-w*.52,0],[-w*.47,-h*.72],[-w*.15,-h*.88],[w*.45,-h*.73],[w*.52,-h*.10],[w*.36,0]]);
  else if (i === 2) poly([[-w*.42,0],[-w*.43,-h*.50],[-w*.18,-h*.72],[w*.12,-h*1.06],[w*.48,-h*.72],[w*.43,-h*.14],[w*.28,0]]);
  else if (i === 3) poly([[-w*.52,0],[-w*.45,-h*.56],[0,-h*.86],[w*.52,-h*.27],[w*.44,0],[w*.15,-h*.08]]);
  else poly([[-w*.52,0],[-w*.50,-h*.72],[-w*.08,-h*1.02],[w*.48,-h*.74],[w*.43,-h*.10],[w*.24,0]]);
}

function drawHouseRoofShape(v, w, h) {
  const i = ((v % 4) + 4) % 4;
  if (i === 0) poly([[-w*.58,-h*.73],[-w*.13,-h*1.18],[w*.49,-h*.88],[w*.38,-h*.61],[-w*.08,-h*.88],[-w*.50,-h*.52]]);
  else if (i === 1) poly([[-w*.56,-h*.83],[-w*.08,-h*1.18],[w*.57,-h*.94],[w*.47,-h*.65],[-w*.20,-h*.66]]);
  else if (i === 2) poly([[-w*.47,-h*.62],[w*.10,-h*1.28],[w*.53,-h*.90],[w*.36,-h*.60],[w*.10,-h*.93],[-w*.33,-h*.42]]);
  else poly([[-w*.56,-h*.64],[-w*.02,-h*1.08],[w*.61,-h*.34],[w*.42,-h*.12],[0,-h*.72],[-w*.47,-h*.42]]);
}

function drawHouseBlock(cx, baseline, w, h, bodyColor, roofColor, loose = 0, phase = 0) {
  const variant = adaptHouseVariant(phase);
  push();
  translate(cx, baseline);
  noStroke();

  fill(bodyColor);
  drawHouseBodyShape(variant, w, h);

  const cut = lerpColor(color(C.paper), color(C.ink), 0.16);
  fill(cut);
  if (variant % 2 === 0) poly([[-w*.15,-h*.47],[w*.06,-h*.50],[w*.08,-h*.23],[-w*.13,-h*.20]]);
  else poly([[w*.06,-h*.46],[w*.25,-h*.43],[w*.23,-h*.14],[w*.05,-h*.17]]);
  fill(lerpColor(color(C.paper), color(C.ink), 0.08));
  if (variant % 2 === 0) poly([[w*.16,-h*.42],[w*.31,-h*.44],[w*.30,-h*.28],[w*.14,-h*.26]]);
  else poly([[-w*.31,-h*.42],[-w*.14,-h*.45],[-w*.13,-h*.28],[-w*.30,-h*.26]]);

  push();
  translate(
    sin(tm * 0.24 + phase) * 8 * loose,
    -loose * (8 + cos(phase) * 3) + cos(tm * 0.19 + phase) * 5 * loose
  );
  rotate(sin(tm * 0.17 + phase) * 0.085 * loose);
  fill(roofColor);
  drawHouseRoofShape(variant, w, h);
  fill(lerpColor(color(C.paper), roofColor, 0.32));
  poly([[-w*.18,-h*.90],[w*.10,-h*1.09],[w*.34,-h*.86],[w*.08,-h*.78]]);
  pop();

  fill(lerpColor(color(C.paper), bodyColor, 0.12));
  const chimneyX = variant % 2 ? w * .27 : w * .20;
  rect(chimneyX, -h * .95, max(4, w * .10), h * .44);
  fill(C.ink);
  rect(chimneyX, -h * 1.16, max(6, w * .15), max(3, h * .07));
  pop();
}

function drawSolarPanel(cx, cy, w, h, panelColor, loose = 0, phase = 0) {
  push();
  translate(cx, cy);
  rotate(-0.14 + sin(tm * .14 + phase) * .018);
  noStroke();
  const paperEdge = lerpColor(color(C.paper), panelColor, .08);
  fill(paperEdge);
  poly([[-w*.56,-h*.47],[w*.52,-h*.39],[w*.56,h*.44],[-w*.50,h*.52]]);
  fill(panelColor);
  const cells = [
    [-w*.25,-h*.20], [w*.23,-h*.17],
    [-w*.23,h*.22], [w*.25,h*.20]
  ];
  for (let i = 0; i < cells.length; i++) {
    const cellPhase = phase + i * 1.43;
    push();
    translate(
      cells[i][0] + sin(tm * .23 + cellPhase) * (5 + i) * loose,
      cells[i][1] + cos(tm * .19 + cellPhase) * (6 + i) * loose
    );
    rotate(sin(tm * .16 + cellPhase) * .08 * loose);
    poly([[-w*.20,-h*.16],[w*.18,-h*.13],[w*.20,h*.16],[-w*.18,h*.14]]);
    pop();
  }
  pop();
}

function drawSunPrimitive(size, restored = 1, damaged = null) {
  const palette = damaged || { light: color(C.grey), dark: color(C.darkGrey) };
  const orange = restoredFill(palette.light, C.orange, restored);
  const paper = restoredFill(palette.dark, C.paper, restored);
  push();
  rotate(-0.08);
  fill(orange);
  drawOctagon(0, 0, size * 0.30);
  fill(paper);
  for (let i = 0; i < 4; i++) {
    push(); rotate(i * HALF_PI + 0.12);
    poly([[-size*.08,-size*.34],[0,-size*.64],[size*.12,-size*.38],[size*.08,-size*.28]]);
    pop();
  }
  pop();
}

function drawWindPrimitive(size, angle = 0, restored = 1, loose = 0, phase = 0, damaged = null) {
  const palette = damaged || { light: color(C.grey), dark: color(C.darkGrey) };
  push();
  rotate(angle);
  fill(restoredFill(palette.light, C.paper, restored));
  for (let i = 0; i < 3; i++) {
    push();
    rotate(i * TWO_PI / 3);
    translate(
      sin(tm * .21 + phase + i * 1.7) * 8 * loose,
      -loose * (4 + i * 2) + cos(tm * .18 + phase + i) * 6 * loose
    );
    rotate(sin(tm * .14 + phase + i * 1.4) * .12 * loose);
    poly([[-size*.055,-size*.04],[size*.06,-size*.52],[size*.22,-size*.12],[size*.08,size*.02]]);
    pop();
  }
  fill(restoredFill(palette.dark, C.orange, restored));
  drawOctagon(0, 0, size * .13);
  pop();
}

function drawAdaptTree(x, y, scaleValue, variant, rec, damaged, phase = 0) {
  push();
  translate(x, y);
  rotate(sin(tm * .35 + phase) * .018);
  scale(scaleValue);
  const trunk = restoredFill(damaged.dark, '#8A3F00', rec);
  const crownPalette = [C.blue, C.orange, C.lime, C.lime];
  const crown = restoredFill(damaged.highlight, crownPalette[variant % crownPalette.length], rec);
  fill(trunk);
  if (variant % 4 === 3) poly([[-6,10],[-5,-37],[-15,-55],[-8,-61],[-2,-49],[7,-71],[13,-67],[7,-38],[6,10]]);
  else poly([[-5,10],[-3,-58],[4,-58],[6,10]]);
  fill(crown);
  if (variant % 4 === 0) {
    poly([[-30,-51],[-10,-84],[26,-64],[18,-54],[-4,-60]]);
    poly([[-34,-34],[-10,-66],[32,-44],[20,-33],[-7,-40]]);
  } else if (variant % 4 === 1) {
    poly([[-27,-49],[-20,-75],[-4,-88],[18,-76],[26,-51],[10,-31],[-14,-33]]);
    poly([[-8,-77],[-2,-102],[17,-108],[31,-86],[22,-65],[2,-62]]);
  } else if (variant % 4 === 2) {
    poly([[-29,-62],[-7,-91],[24,-84],[29,-62],[6,-53],[-14,-55]]);
    poly([[-34,-42],[-17,-65],[18,-59],[35,-39],[10,-27],[-25,-31]]);
  } else {
    poly([[-12,-78],[20,-86],[37,-65],[27,-40],[-7,-46]]);
    poly([[-34,-57],[-18,-73],[4,-62],[7,-39],[-12,-28],[-32,-36]]);
  }
  pop();
}

function drawForestHabitat(m, rec, damaged) {
  partTransform(m, 0, rec, () => drawAdaptTree(-42, 24, .82, m.id % 4, rec, damaged, m.phase));
  partTransform(m, 1, rec, () => drawAdaptTree(8, 30, .62, (m.id + 1) % 4, rec, damaged, m.phase + 1.2));
  partTransform(m, 2, rec, () => drawAdaptTree(54, 26, .48, (m.id + 2) % 4, rec, damaged, m.phase + 2.1));
  partTransform(m, 3, rec, () => {
    fill(restoredFill(damaged.light, C.paper, rec));
    poly([[34,25],[58,-8],[82,24],[72,32],[46,31]]);
  });
}

function drawWaterHabitat(m, rec, damaged) {
  partTransform(m, 0, rec, () => {
    fill(restoredFill(damaged.light, C.paper, rec));
    poly([[-72,28],[-30,-34],[18,26],[-6,34],[-56,32]]);
  });
  partTransform(m, 1, rec, () => {
    fill(restoredFill(damaged.mid, C.blue, rec));
    poly([[-78,6],[-52,-5],[-24,9],[4,-6],[31,7],[61,-2],[80,17],[50,26],[-78,22]]);
    fill(alphaColor(C.paper, 92 * rec + 20));
    poly([[-38,13],[-28,6],[-22,18],[-30,24]]);
    poly([[-10,14],[-1,7],[6,18],[-1,25]]);
    poly([[17,14],[26,7],[34,18],[26,26]]);
  });
  partTransform(m, 2, rec, () => {
    fill(restoredFill(damaged.dark, C.ink, rec));
    poly([[-56,28],[-7,5],[61,27],[48,38],[-39,40]]);
  });
  partTransform(m, 3, rec, () => {
    fill(restoredFill(damaged.highlight, C.lime, rec));
    push(); translate(56,-12); rotate(QUARTER_PI); rect(0,0,12,12); pop();
  });
}

function drawSolarHabitat(m, rec, damaged) {
  partTransform(m, 0, rec, (t) => {
    drawSolarPanel(12,-14,84,48,restoredFill(damaged.highlight,C.blue,max(rec,m.sun*.92)),1-t,m.phase);
  });
  partTransform(m, 1, rec, (t) => {
    drawHouseBlock(-46,30,42,40,restoredFill(damaged.light,C.paper,rec),restoredFill(damaged.mid,C.orange,rec),1-t,m.phase+1);
  });
  partTransform(m, 2, rec, (t) => {
    drawHouseBlock(56,29,35,31,restoredFill(damaged.light,C.paper,rec),restoredFill(damaged.mid,C.blue,rec),1-t,m.phase+2);
  });
  partTransform(m, 3, rec, () => {
    push(); translate(-62,-46); scale(.52); drawSunPrimitive(58,max(rec,m.sun),damaged); pop();
  });
  partTransform(m, 4, rec, () => drawAdaptTree(84,25,.38,(m.id+3)%4,rec,damaged,m.phase+2.3));
}

function drawWindHabitat(m, rec, damaged) {
  partTransform(m, 0, rec, () => {
    fill(restoredFill(damaged.light,C.paper,rec));
    poly([[2,28],[7,-39],[13,-39],[17,28]]);
  });
  partTransform(m, 1, rec, (t) => {
    push(); translate(10,-42); drawWindPrimitive(80,tm*m.wind*.65+m.phase,max(rec,m.wind*.85),1-t,m.phase,damaged); pop();
  });
  partTransform(m, 2, rec, (t) => {
    drawHouseBlock(-46,29,40,38,restoredFill(damaged.light,C.paper,rec),restoredFill(damaged.mid,C.blue,rec),1-t,m.phase+1);
  });
  partTransform(m, 3, rec, (t) => {
    drawHouseBlock(52,30,34,30,restoredFill(damaged.light,C.paper,rec),restoredFill(damaged.mid,C.lime,rec),1-t,m.phase+2);
  });
  partTransform(m, 4, rec, () => drawAdaptTree(84,25,.34,(m.id+1)%4,rec,damaged,m.phase+2.1));
}

function drawCommunityHabitat(m, rec, damaged) {
  const body = restoredFill(damaged.light,C.paper,rec);
  const roofs = [C.blue,C.orange,C.lime];
  partTransform(m,0,rec,(t)=>drawHouseBlock(-58,30,39,34,body,restoredFill(damaged.mid,roofs[0],rec),1-t,m.phase));
  partTransform(m,1,rec,(t)=>drawHouseBlock(-4,28,52,54,body,restoredFill(damaged.mid,roofs[1],rec),1-t,m.phase+1));
  partTransform(m,2,rec,(t)=>drawHouseBlock(56,30,39,32,body,restoredFill(damaged.mid,roofs[2],rec),1-t,m.phase+2));
  partTransform(m,3,rec,()=>{
    fill(restoredFill(damaged.dark,C.ink,rec));
    poly([[-8,28],[-6,5],[8,3],[9,28]]);
  });
  partTransform(m,4,rec,()=>drawAdaptTree(94,25,.35,(m.id+2)%4,rec,damaged,m.phase+3));
}

function drawWildlifeHabitat(m, rec, damaged) {
  const animal = restoredFill(damaged.light,C.orange,rec);
  partTransform(m,0,rec,()=>{
    fill(animal);
    poly([[-40,12],[-32,-14],[8,-22],[33,-5],[24,18],[-12,24]]);
  });
  partTransform(m,1,rec,()=>{
    fill(animal);
    poly([[12,-20],[38,-30],[50,-17],[40,0],[20,-1]]);
    triangle(-36,-7,-56,-19,-43,8);
  });
  partTransform(m,2,rec,()=>{
    fill(animal);
    poly([[-23,20],[-12,19],[-15,46],[-25,46]]);
    poly([[7,20],[18,17],[20,44],[10,45]]);
  });
  partTransform(m,3,rec,()=>drawAdaptTree(52,24,.44,(m.id+2)%4,rec,damaged,m.phase+2));
  partTransform(m,4,rec,()=>{
    fill(restoredFill(damaged.highlight,C.paper,rec));
    poly([[76,22],[96,-4],[114,20],[106,28],[84,28]]);
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
    windFanAngle += windFanSpeed * 60 * dt * motionScale;
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
  statusUntil = elapsedTime + sec;
}

function isCanvasInteraction(event) {
  if ((document.body.classList.contains('info-is-open') || document.body.classList.contains('sound-is-open'))) return false;
  if (!event?.target || event.target.tagName !== 'CANVAS') return false;
  const bounds = event.target.getBoundingClientRect();
  const source = event.touches?.[0] || event.changedTouches?.[0] || event;
  return source.clientX >= bounds.left && source.clientX <= bounds.right
    && source.clientY >= bounds.top && source.clientY <= bounds.bottom;
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
  if (!isCanvasInteraction(event)) return true;
  updatePointerFromEvent(event);
  return false;
}

function mousePressed(event) {
  if (!isCanvasInteraction(event) || paused || stateTwoAnnounced) return true;
  ensureAudioEnabled().then(() => playEnergySound(activeTool));
  experienceMode = 'manual';
  const point = updatePointerFromEvent(event);
  dragging = true;
  dragPointerX = point.x;
  dragPointerY = point.y;
  applyEnergy(activeTool, point.x, point.y, 0, 0);
  publishProgress(true);
  return false;
}

function mouseDragged(event) {
  if (!dragging || paused || (document.body.classList.contains('info-is-open') || document.body.classList.contains('sound-is-open'))) return true;
  // Crossing an overlaid control must not keep supplying energy underneath it.
  const pointTarget = document.elementFromPoint(
    event?.touches?.[0]?.clientX ?? event?.clientX,
    event?.touches?.[0]?.clientY ?? event?.clientY
  );
  if (pointTarget?.closest('#artwork-controls')) return true;
  const point = updatePointerFromEvent(event);
  applyEnergy(activeTool, point.x, point.y, point.x - dragPointerX, point.y - dragPointerY);
  playEnergySound(activeTool);
  dragPointerX = point.x;
  dragPointerY = point.y;
  return false;
}

function mouseReleased(event) {
  if (!dragging) return true;
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

function keyPressed(event) {
  if ((document.body.classList.contains('info-is-open') || document.body.classList.contains('sound-is-open')) || event?.repeat) return true;
  if (event?.target?.matches?.('input, textarea, select, [contenteditable="true"]')) return true;
  if (key === '1') {
    selectEnergyTool('sun');
  } else if (key === '2') {
    selectEnergyTool('wind');
  } else if (key === 'r' || key === 'R') {
    resetAndReplay();
  } else if (key === 's' || key === 'S') {
    exportArtwork();
  } else if (key === 'm' || key === 'M') toggleSound();
  else return true;
  return false;
}

async function exportArtwork() {
  const source = document.querySelector('#app canvas');
  if (!source) return;
  try {
    await document.fonts.ready;
    const output = document.createElement('canvas');
    output.width = ARTBOARD_WIDTH;
    output.height = ARTBOARD_HEIGHT;
    const ctx = output.getContext('2d');
    ctx.drawImage(source, 0, 0);
    // The artwork's title/message are DOM overlays. Composite their original
    // local SVG assets and type at logical size so exported PNGs keep the story.
    const exportUi = document.querySelector('.figma-ui').cloneNode(true);
    exportUi.classList.add('export-ui');
    exportUi.style.cssText = 'position:fixed;left:-10000px;top:0;margin:0;transform:none;visibility:hidden;pointer-events:none';
    exportUi.removeAttribute('id');
    exportUi.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
    document.body.append(exportUi);
    try {
    const overlays = [...exportUi.querySelectorAll('.badge-layer img, .badge-title, .badge-stage, .figma-subtitle img, .figma-subtitle p')];
    await Promise.all(overlays.filter((element) => element.tagName === 'IMG').map((element) => element.decode()));
    overlays.forEach((element) => {
      const style = getComputedStyle(element);
      let x = 0;
      let y = 0;
      for (let node = element; node && node !== exportUi; node = node.offsetParent) {
        x += node.offsetLeft;
        y += node.offsetTop;
      }
      const w = element.offsetWidth;
      const h = element.offsetHeight;
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      if (style.transform !== 'none') {
        const matrix = new DOMMatrix(style.transform);
        ctx.transform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
      }
      ctx.translate(-w / 2, -h / 2);
      if (element.tagName === 'IMG') {
        ctx.filter = style.filter;
        ctx.drawImage(element, 0, 0, w, h);
      } else {
        ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        ctx.fillStyle = style.color;
        ctx.textBaseline = 'top';
        ctx.textAlign = style.textAlign === 'center' ? 'center' : 'left';
        ctx.fillText(element.textContent.trim(), ctx.textAlign === 'center' ? w / 2 : 0, 0, w);
      }
      ctx.restore();
    });
    } finally { exportUi.remove(); }
    output.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ADAPT-stage3-${stateTwoAnnounced ? 'network-ready' : 'regeneration'}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      document.body.dataset.exported = link.download;
      setStatus('PNG saved with the artwork title and message.', 3);
      publishProgress(true);
    }, 'image/png');
  } catch (error) {
    setStatus('The PNG could not be saved. Please try again.', 4);
    publishProgress(true);
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


  const radius = ENERGY_BRUSH_RADIUS;
  const movementStrength = constrain(len / 24, 0.25, 1);
  const gain = ENERGY_BRUSH_GAIN * movementStrength;

  modules.forEach((m) => {
    const d = dist(x, y, m.x, m.y);
    if (d > radius) return;
    const f = pow(1 - d / radius, 0.86);

    if (tool === 'sun') {
      m.sun = constrain(m.sun + gain * f, 0, 1);
    } else {
      m.wind = constrain(m.wind + gain * f, 0, 1);
      const push = (0.16 + 0.18 * (1 / max(0.52, m.mass))) * f;
      m.vx += ndx * push;
      m.vy += ndy * push;
    }
  });

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

function toggleSound() {
  if (!audioMuted) {
    audioMuted = true;
    audioEnabled = false;
    document.body.dataset.audioEnabled = 'false';
    audioMaster?.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.025);
    publishProgress(true);
  } else {
    audioMuted = false;
    ensureAudioEnabled().then(() => publishProgress(true));
  }
}

function setSoundMixLevel(id, value) {
  const channel = SOUND_MIX_CHANNELS.find((entry) => entry.id === id);
  const level = Number(value);
  if (!channel || !Number.isFinite(level)) return;
  soundMixLevels[id] = Math.max(0, Math.min(100, level));
  audioChannelGains.get(id)?.gain.setTargetAtTime(soundMixLevels[id] / channel.recommended, audioContext.currentTime, 0.025);
}

function resetSoundMix() {
  SOUND_MIX_CHANNELS.forEach(({ id, recommended }) => setSoundMixLevel(id, recommended));
}

function createAudioGraph(AudioContextClass = window.AudioContext || window.webkitAudioContext) {
  if (!AudioContextClass || audioContext) return;
  audioContext = new AudioContextClass();
  audioMaster = audioContext.createGain();
  audioMaster.gain.value = 0.0001;
  audioMaster.connect(HEALMaster.bus(audioContext));
  SOUND_MIX_CHANNELS.forEach(({ id, recommended }) => {
    const channel = audioContext.createGain();
    channel.gain.value = soundMixLevels[id] / recommended;
    channel.connect(audioMaster);
    audioChannelGains.set(id, channel);
  });
}

function preloadAudioSamples() {
  if (audioFetchPromise) return audioFetchPromise;
  document.body.dataset.audioAssets = 'loading';
  audioFetchPromise = Promise.all(
    Object.entries(AUDIO_FILES).map(async ([name, path]) => {
      const encoded = HEAL_MASTERED_AUDIO[name];
      if (!encoded) throw new Error('Missing mastered recording: ' + name);
      const data = Uint8Array.from(atob(encoded), char => char.charCodeAt(0)).buffer;
      audioFileData.set(name, data);
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

async function ensureAudioEnabled() {
  // A visitor's explicit mute survives tool selection, strokes and regeneration.
  if (audioMuted) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  createAudioGraph(AudioContextClass);
  try {
    if (!paused) await audioContext.resume();
    await decodeAudioSamples();
    if (audioBuffers.size !== Object.keys(AUDIO_FILES).length) throw new Error('Recorded audio failed to decode');
    // A mute click may occur while the browser is decoding its first samples.
    if (audioMuted) return;
    audioEnabled = true;
    document.body.dataset.audioEnabled = 'true';
    audioMaster.gain.setTargetAtTime(1, audioContext.currentTime, 0.025);
  } catch (error) {
    audioEnabled = false;
    document.body.dataset.audioEnabled = 'false';
    setStatus('Sound could not start. You can continue silently.', 4);
  }
  publishProgress(true);
}

function stopSample(key) {
  const active = activeSampleSources.get(key);
  if (!active) return;
  try {
    const now = audioContext.currentTime;
    active.gain.gain.cancelScheduledValues(now);
    active.gain.gain.setValueAtTime(active.gain.gain.value, now);
    active.gain.gain.linearRampToValueAtTime(0, now + 0.045);
    active.source.stop(now + 0.05);
  } catch (error) {
    // The sample may already have ended; clearing the reference is sufficient.
  }
  activeSampleSources.delete(key);
}

function playSample(name, options = {}) {
  if (!audioEnabled || paused || !audioContext || !audioMaster) return false;
  const buffer = audioBuffers.get(name);
  if (!buffer) return false;

  const {
    rate = 1,
    delay = 0,
    exclusive = null,
    finishPrevious = false
  } = options;

  const level = SOUND_MIX_CHANNELS.find(channel => channel.id === name).recommended / 100;

  // Sustained strokes let the current cue end naturally before retriggering it.
  if (exclusive && finishPrevious && activeSampleSources.has(exclusive)) return true;
  if (exclusive) stopSample(exclusive);
  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();
  source.buffer = buffer;
  source.playbackRate.value = rate;
  const startsAt = audioContext.currentTime + delay;
  const endsAt = startsAt + buffer.duration / rate;
  gain.gain.setValueAtTime(0, startsAt);
  gain.gain.linearRampToValueAtTime(level, startsAt + 0.012);
  gain.gain.setValueAtTime(level, max(startsAt + 0.012, endsAt - 0.045));
  gain.gain.linearRampToValueAtTime(0, endsAt);
  source.connect(gain);
  gain.connect(audioChannelGains.get(name) || audioMaster);
  if (exclusive) {
    const active = { source, gain };
    activeSampleSources.set(exclusive, active);
    source.addEventListener('ended', () => {
      if (activeSampleSources.get(exclusive) === active) activeSampleSources.delete(exclusive);
      source.disconnect();
      gain.disconnect();
    });
  }
  source.start(startsAt);
  document.body.dataset.lastSound = name;
  const history = (document.body.dataset.soundHistory || '').split(',').filter(Boolean);
  history.push(name);
  document.body.dataset.soundHistory = history.slice(-24).join(',');
  return true;
}

function playSelectSound(tool) {
  if (tool === 'sun') {
    playSample('solarSelect', { gain: 0.48, exclusive: 'tool-selection' });
  } else {
    playSample('windPaper', { gain: 0.3, rate: 0.96, exclusive: 'tool-selection' });
  }
}

function playEnergySound(tool) {
  if (!audioEnabled || paused || !audioContext) return;
  const now = performance.now();
  const cooldown = tool === 'sun' ? 1050 : 720;
  if (now - lastEnergySoundAt[tool] < cooldown) return;
  lastEnergySoundAt[tool] = now;
  playSample(tool === 'sun' ? 'solarEnergy' : 'windPaper', {
    gain: tool === 'sun' ? 0.24 : 0.3,
    rate: tool === 'sun' ? 0.98 + globalRecovery * 0.05 : 0.94 + globalRecovery * 0.08,
    exclusive: 'energy-brush',
    finishPrevious: true
  });
}

function playAssemblySound() {
  // The shutter supplies the decisive assembly transient; the keyboard recording
  // sits beneath it as a quieter mechanical texture while pieces reconnect.
  playSample('cameraShutter', { gain: 0.8, exclusive: 'assembly-shutter' });
  playSample('assemblyKeyboard', { gain: 0.35, exclusive: 'assembly-texture' });
  document.body.dataset.assemblyCue = 'camera-shutter';
}
