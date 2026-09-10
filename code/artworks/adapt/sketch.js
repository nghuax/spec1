
/*
ADAPT — MODULAR ECOLOGY

Stage 3 bridges the Stage 2 and Stage 4 visual systems:
- shared HEAL palette and bold p5.js primitive geometry
- the existing stepped depth field, warmed to charcoal-earth in the polluted state
- ten reusable environmental asset families with intact two-state silhouettes
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
  brown: '#755443',
  pollutedAmber: '#D58A3D',
  pollutedHotOrange: '#C87629',
  pollutedBurnt: '#BC7634',
  pollutedRust: '#AE630D',
  pollutedShadow: '#7A3F00'
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
let audioContext = null;
let audioMaster = null;
let audioEnabled = false;
let audioFetchPromise = null;
let audioDecodePromise = null;
// Recommended levels preserve the original balance of the six recorded cues.
const SOUND_MIX_CHANNELS = [
  { id: 'confirmation', label: 'Interface click', recommended: 58 },
  { id: 'solarSelect', label: 'Solar selection', recommended: 48 },
  { id: 'solarEnergy', label: 'Solar energy', recommended: 24 },
  { id: 'windPaper', label: 'Wind', recommended: 30 },
  { id: 'recoveryWater', label: 'Recovery water', recommended: 72 },
  { id: 'assemblyKeyboard', label: 'Habitat assembly', recommended: 98 }
];
const soundMixLevels = Object.fromEntries(SOUND_MIX_CHANNELS.map(({ id, recommended }) => [id, recommended]));
const audioChannelGains = new Map();

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
// Each reset selects a fresh composition seed. Authored asset geometry remains
// stable; bounded layout/background variation is repeatable for an explicit seed.
let environmentSeed = 307;
let compositionSeed = 307;
let floatingTextureLayout = [];
let floatingEdgeLayout = [];
const ambientScratch = { x: 0, y: 0, r: 0, scale: 1 };
const sharedFloat = { x: 0, y: 0, r: 0, scale: 1 };
// A quicker, layered float keeps the whole field lively without making the
// large habitats feel weightless. The same clock is used for every layer, so
// motion remains deterministic and pause/reduced-motion still work globally.
const AMBIENT_SPEED = 2.56;

// Reusable render-only motion. Callers reuse output records; no frame RNG.
function getFloatOffset(time, phase, amplitudeX, amplitudeY, period, rotationAmount, recovery, out) {
  const weight = 0.72 + recovery * 0.28;
  const t = time * TWO_PI / period * AMBIENT_SPEED;
  const accessibility = reducedMotion ? 0.2 : 1;
  // Two restrained harmonics make the movement feel hand-authored instead of
  // like a single pendulum, while each channel stays inside its amplitude.
  out.x = (sin(t * 0.79 + phase * 1.31) * 0.78
    + sin(t * 0.43 + phase * 0.71) * 0.22) * amplitudeX * weight * accessibility;
  out.y = (sin(t + phase) * 0.76
    + sin(t * 0.53 + phase * 1.7) * 0.14
    + cos(t * 0.31 + phase * 0.42) * 0.10) * amplitudeY * weight * accessibility;
  out.r = (sin(t * 0.67 + phase * 1.91) * 0.84
    + sin(t * 0.37 + phase * 0.83) * 0.16) * rotationAmount * weight * accessibility;
  out.scale = 1 + sin(t * 0.61 + phase) * 0.0032 * recovery * accessibility;
  return out;
}

function getSharedFloat() {
  return getFloatOffset(tm, compositionSeed % 71, 1.2, 3, 9.2, 0.005, globalRecovery, sharedFloat);
}
function environmentRandom(low, high) {
  environmentSeed = (Math.imul(environmentSeed, 1664525) + 1013904223) >>> 0;
  const value = environmentSeed / 4294967296;
  if (low === undefined) return value;
  return high === undefined ? value * low : low + value * (high - low);
}

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

function regenerate(seed) {
  [...activeSampleSources.keys()].forEach(stopSample);
  lastEnergySoundAt.sun = -Infinity;
  lastEnergySoundAt.wind = -Infinity;
  delete document.body.dataset.assemblyCue;
  delete document.body.dataset.recoveryCue;
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

  compositionSeed = Number.isFinite(seed) ? seed >>> 0 : floor(random(1, 2147483647));
  environmentSeed = compositionSeed;
  document.body.dataset.compositionSeed = String(compositionSeed);
  if (typeof noiseSeed === 'function') noiseSeed(compositionSeed);
  buildDamagedField();
  buildRestoredField();
  buildRestoredLand();
  buildModules();
  buildFloatingLayouts();
  buildEnergyNetwork();
  const visualAssetCount = modules.length - max(0, restoredLand.moduleIds.length - 1);
  document.body.dataset.assetCount = String(visualAssetCount);
  document.body.dataset.moduleCount = String(modules.length);
  document.body.dataset.landPosition = `${round(restoredLand.x)},${round(restoredLand.y)}`;

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
      return { source, target, phase: (index * 0.381966) % 1 };
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
  ensureAudioEnabled(false).then(() => playSelectSound(tool));
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
    if (channel) ensureAudioEnabled(false).then(() => playSample(channel.id, { gain: channel.recommended / 100, exclusive: 'mix-preview' }));
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
  ensureAudioEnabled(true);
  publishProgress(true);
}

function updateGuidedSequence(dt) {
  if (experienceMode !== 'guided' || stateTwoAnnounced) return;
  guidedTime += dt;
  const phase = guidedTime < 2 ? 'damage' : guidedTime < 8 ? 'sun' : guidedTime < 14 ? 'wind' : 'assembly';
  if (phase !== guidedPhase) {
    guidedPhase = phase;
    statusUntil = 0;
    if (phase === 'sun' || phase === 'wind') {
      activeTool = phase;
      playSelectSound(phase);
    }
  }
  // forEach updates each habitat independently with a slightly staggered arrival.
  modules.forEach((habitat, index) => {
    const stagger = index * 0.025;
    habitat.sun = max(habitat.sun, smoothClamp(guidedTime, 2 + stagger, 7.6 + stagger));
    habitat.wind = max(habitat.wind, smoothClamp(guidedTime, 8 + stagger, 13.6 + stagger));
  });
  if (phase === 'sun' || phase === 'wind') playEnergySound(phase);
}

function announceArtworkState(state) {
  window.dispatchEvent(new CustomEvent('adapt:statechange', {
    detail: { state }
  }));
}

// Twelve logical modules retain the existing energy/network model. Four share
// one island, leaving nine visual habitat groups and generous negative space.
let acceptedComposition = null;
function buildModules() {
  // Generate entirely off-screen, then publish the highest-scoring valid layout.
  acceptedComposition = generateAdaptLayout(compositionSeed, W, H);
  const anchor = acceptedComposition.groups[0];
  const unit = Math.min(W / 1920, H / 1080);
  restoredLand = { x: anchor.x, y: anchor.y - 48, w: anchor.width,
    h: 66 * anchor.scale * unit, rotation: 0, moduleIds: [] };
  const anchorKinds = ['solar', 'wind', 'community', 'forest'];
  const offsets = [-0.35, -0.13, 0.12, 0.35];
  const relativeScales = [1.12, 1.08, 1.12, 1.03];
  modules = anchorKinds.map((kind, id) => {
    const s = relativeScales[id] * anchor.scale * unit;
    const m = makeModule(id, kind, anchor.x + anchor.width * offsets[id], anchor.y - 40 * s, s);
    m.sharedLand = true; m.sharedLandIndex = id;
    return m;
  });
  acceptedComposition.groups.slice(1).forEach((group, index) => {
    const s = group.scale * unit;
    modules.push(makeModule(index + 4, group.kind, group.x, group.y - 40 * s, s));
  });
  modules.forEach(m => {
    m.seed = environmentRandom(10000); m.phase = environmentRandom(TWO_PI);
    m.variant = Math.floor(environmentRandom(3));
  });
  restoredLand.moduleIds = modules.slice(0, 4).map(m => m.id);
  document.body.dataset.layoutScore = acceptedComposition.evaluation.score.toFixed(1);
  document.body.dataset.layoutCandidates = String(acceptedComposition.validCandidates);
}

function makeModule(id, kind, x, y, s) {
  const mass = kind === 'community' ? 1 : kind === 'water' ? 0.9
    : kind === 'solar' || kind === 'wind' ? 0.84 : kind === 'forest' ? 0.72 : 0.64;
  return {
    id, kind, x, y, homeX: x, homeY: y, s, mass,
    vx: 0, vy: 0, rot: 0, platform: { w: 160, h: 36 },
    sun: 0, wind: 0, visualRecovery: 0,
    assemblyDelay: 0.06 + (id % 4) * 0.035,
    seed: 307 + id * 97, phase: id * 1.618,
    floatAmp: 3, orbitAmp: 2, orbitSpeed: 0.3, hover: 0
  };
}

function isProtectedUiPoint(x, y, margin = 0) {
  const inTitle = x < 690 + margin && y < 330 + margin;
  const inTools = x < 620 + margin && y > 300 - margin && y < 500 + margin;
  const inRecovery = x > 1390 - margin && y < 370 + margin;
  const inOptions = x > 1660 - margin && y > 780 - margin;
  const inSubtitle = x > 270 - margin && x < 1640 + margin && y > 880 - margin;
  return inTitle || inTools || inSubtitle || inRecovery || inOptions;
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
  drawEnvironmentalTexture();
  drawHabitatConstellations();
  drawEnergyNetwork();
  drawRestoredLand();
  drawPlatforms();
  drawModules();
  drawBurstsAndWind();
  drawEnergyCursor();
}

function drawBackground() {
  const rec = smoothClamp(globalRecovery, 0.08, 0.92);
  drawDepthField(rec);
}

// Authored atmospheric accents, not an eleventh gameplay asset family.
// A rich, deterministic field; one fifth of its anchors fade during recovery.
// Drawn behind every habitat with UI/asset clearance checked during motion.
const ADAPT_TEXTURE_LAYOUT = Object.freeze([
  [620, 565, 18], [685, 510, 12], [640, 660, 14], [365, 590, 22],
  [320, 780, 15], [660, 800, 12], [590, 845, 20], [890, 868, 16],
  [945, 745, 13], [1010, 850, 24], [1260, 835, 16], [1540, 820, 18],
  [1630, 755, 11], [1810, 725, 20], [680, 365, 17], [704, 195, 13],
  [950, 175, 12], [1260, 210, 24], [1280, 355, 16], [1360, 270, 12],
  [1680, 440, 25], [1780, 520, 14], [1610, 525, 18], [1550, 575, 11],
  [930, 380, 11], [1080, 400, 15], [1220, 690, 14], [680, 705, 16]
].concat(Array.from({ length: 392 }, (_, index) => {
  // Low-discrepancy placement fills the field without a visible grid or RNG.
  const u = ((index + 1) * 0.61803398875) % 1;
  const v = ((index + 1) * 0.75487766625) % 1;
  const size = index % 13 === 0 ? 38 + index % 17 : 10 + (index * 7) % 23;
  return [42 + u * 1836, 50 + v * 820, size];
})).map((point) => Object.freeze(point)));

function pollutedToneAt(x, y, variation = 0) {
  const dx = (x - ARTBOARD_WIDTH * 0.5) / (ARTBOARD_WIDTH * 0.5);
  const dy = (y - ARTBOARD_HEIGHT * 0.5) / (ARTBOARD_HEIGHT * 0.5);
  const distance = constrain(Math.sqrt(dx * dx + dy * dy), 0, 1);
  const centerWeight = 1 - distance;
  const nudge = ((variation % 3) - 1) * 0.22;
  const index = constrain(Math.floor(centerWeight * 4.2 + nudge), 0, 4);
  const palette = [C.pollutedAmber, C.pollutedHotOrange, C.pollutedBurnt,
    C.pollutedRust, C.pollutedShadow];
  return color(palette[index]);
}

function drawEnvironmentalTexture() {
  const rec = constrain(globalRecovery, 0, 1);
  const colors = [ADAPT_COLORS.blue, ADAPT_COLORS.teal, ADAPT_COLORS.purple,
    ADAPT_COLORS.sand, ADAPT_COLORS.green, ADAPT_COLORS.orange];
  push();
  noStroke();
  floatingTextureLayout.forEach(([homeX, homeY, size], index) => {
    const depthAlpha = index % 3 === 0 ? 0.65 : 1;
    const alpha = (index % 5 === 0 ? 1 - rec : 1) * lerp(112, 142, rec) * depthAlpha;
    if (alpha <= 0.5) return;
    const phase = index * 1.618 + compositionSeed % 997;
    const float = getFloatOffset(tm, phase, 3 + index % 6, 6 + index % 9,
      6 + index % 9, 0.035 + index % 4 * 0.016, rec, ambientScratch);
    const x = homeX + sin(phase * 1.7) * 32 + float.x;
    const y = homeY + cos(phase * 1.3) * 24 + float.y;
    const rotation = phase + float.r;
    if (isProtectedUiPoint(x, y, size + 8)) return;
    // Avoid drawing through the object or its platform, even after wind nudges.
    if (modules.some((m) => {
      const pose = habitatPose(m);
      return abs(x - pose.x) < 100 * m.s + size
        && y > pose.y - 156 * m.s - size && y < pose.y + 40 * m.s + size;
    })) return;
    if (restoredLand && abs(x - restoredLand.x) < restoredLand.w * 0.55 + size
      && y > restoredLand.y + 30 && y < restoredLand.y + 106 + size) return;
    const shade = lerpColor(pollutedToneAt(x, y, index), color(colors[index % colors.length]), rec);
    shade.setAlpha(alpha);
    fill(shade);
    push();
    translate(x, y);
    rotate(rotation);
    if (index % 3 === 0) {
      poly([[-size * 0.6, size * 0.3], [-size * 0.16, -size * 0.64], [size * 0.58, size * 0.2]]);
    } else if (index % 3 === 1) {
      poly([[-size * 0.55, -size * 0.12], [size * 0.26, -size * 0.45],
        [size * 0.58, size * 0.15], [-size * 0.23, size * 0.45]]);
    } else {
      poly([[-size * 0.5, -size * 0.24], [size * 0.5, -size * 0.24],
        [size * 0.35, size * 0.26], [-size * 0.58, size * 0.26]]);
    }
    pop();
  });
  pop();
}

// v3.6 reference: nearby fragment constellations and large edge silhouettes.
// Authored relative positions keep the field repeatable and leave object cores clear.
const HABITAT_SCRAPS = Object.freeze([
  [-105, -105, 12], [-83, -139, 22], [-44, -152, 9], [26, -159, 14],
  [91, -125, 18], [109, -72, 10], [101, -23, 19], [76, 42, 12],
  [27, 60, 24], [-35, 53, 11], [-96, 31, 18], [-115, -33, 9]
]);

// Sample once per reset. Both states render these same anchors so recovery
// changes color and motion without teleporting the field on every frame.
function buildFloatingLayouts() {
  floatingTextureLayout = ADAPT_TEXTURE_LAYOUT.map(() => {
    // Keep most atmospheric pieces small, with a few larger depth accents.
    const size = environmentRandom() < 0.16
      ? environmentRandom(38, 64)
      : environmentRandom(8, 34);
    return [environmentRandom(32, 1888), environmentRandom(36, 870), size];
  });
  modules.forEach((m) => {
    m.scraps = HABITAT_SCRAPS.map(([, , size], i) => {
      const angle = i * TWO_PI / HABITAT_SCRAPS.length + environmentRandom(-0.22, 0.22);
      const radius = environmentRandom(94, 149);
      return [cos(angle) * radius, -52 + sin(angle) * radius * 0.83,
        size * environmentRandom(0.75, 1.35)];
    });
  });
  // Accent pieces are stratified across the whole work, not just the border.
  // Each cell gets one deterministic piece so the field has air, corners and
  // middle-ground texture without collapsing into a noisy center cluster.
  const edgeSize = () => environmentRandom() < 0.2
    ? environmentRandom(78, 148)
    : environmentRandom(24, 68);
  const accentCells = [
    [0.04, 0.19, 0.05, 0.22], [0.20, 0.34, 0.05, 0.22], [0.36, 0.49, 0.05, 0.22],
    [0.52, 0.65, 0.05, 0.22], [0.68, 0.81, 0.05, 0.22], [0.84, 0.96, 0.05, 0.22],
    [0.04, 0.19, 0.28, 0.47], [0.20, 0.34, 0.28, 0.47], [0.36, 0.49, 0.28, 0.47],
    [0.52, 0.65, 0.28, 0.47], [0.68, 0.81, 0.28, 0.47], [0.84, 0.96, 0.28, 0.47],
    [0.04, 0.19, 0.53, 0.72], [0.20, 0.34, 0.53, 0.72], [0.36, 0.49, 0.53, 0.72],
    [0.52, 0.65, 0.53, 0.72], [0.68, 0.81, 0.53, 0.72], [0.84, 0.96, 0.53, 0.72],
    [0.04, 0.19, 0.77, 0.92], [0.20, 0.34, 0.77, 0.92], [0.36, 0.49, 0.77, 0.92],
    [0.52, 0.65, 0.77, 0.92], [0.68, 0.81, 0.77, 0.92], [0.84, 0.96, 0.77, 0.92],
    [0.02, 0.11, 0.31, 0.46], [0.89, 0.98, 0.31, 0.46],
    [0.02, 0.11, 0.55, 0.72], [0.89, 0.98, 0.55, 0.72]
  ];
  floatingEdgeLayout = Array.from({ length: 28 }, (_, i) => {
    const [x0, x1, y0, y1] = accentCells[i];
    return [environmentRandom(x0 * 1920, x1 * 1920),
      environmentRandom(y0 * 1080, y1 * 1080), edgeSize()];
  });
}

function drawHabitatConstellations() {
  push();
  noStroke();
  const palette = [C.orange, C.lime, C.purple, C.blue, C.paper, C.teal];
  modules.forEach((m) => {
    const pose = habitatPose(m), rec = moduleRecovery(m);
    (m.scraps || HABITAT_SCRAPS).forEach(([sx, sy, size], i) => {
      const phase = m.phase + i * 1.72;
      const spread = lerp(1.08, 0.94, rec);
      const float = getFloatOffset(tm, phase, 4, 8, 7 + i % 6, 0.05, rec, ambientScratch);
      const x = pose.x + (sx * spread + float.x) * m.s;
      const y = pose.y + (sy * spread + float.y) * m.s;
      const rotation = phase + float.r;
      if (isProtectedUiPoint(x, y, size)) return;
      const blocked = modules.some(other => {
        const p = habitatPose(other);
        return abs(x - p.x) < 78 * other.s + size * 0.4
          && y > p.y - 135 * other.s && y < p.y + 26 * other.s;
      });
      if (blocked) return;
      const shade = lerpColor(pollutedToneAt(x, y, i + m.id),
        color(palette[(i + m.id) % palette.length]), rec);
      shade.setAlpha(lerp(115, 175, rec));
      fill(shade);
      push(); translate(x, y); rotate(rotation);
      if (i % 3 === 0) triangle(-size * 0.7, size * 0.4, 0, -size * 0.6, size * 0.6, size * 0.3);
      else poly([[-size * 0.6, -size * 0.3], [size * 0.4, -size * 0.5], [size * 0.6, size * 0.3], [-size * 0.3, size * 0.5]]);
      pop();
    });
  });
  floatingEdgeLayout.forEach(([x, y, size], i) => {
    if (isProtectedUiPoint(x, y, 20)) return;
    const shade = lerpColor(pollutedToneAt(x, y, i),
      color(i % 2 ? C.blue : C.paper), globalRecovery);
    shade.setAlpha(lerp(65, 48, globalRecovery)); fill(shade);
    const float = getFloatOffset(tm, i * 1.9 + compositionSeed % 53, 3, 5, 11 + i % 4, 0.025, globalRecovery, ambientScratch);
    push(); translate(x + float.x, y + float.y); rotate(i * 1.9 + float.r);
    poly([[-size, -size * 0.2], [-size * 0.3, -size * 0.7], [size * 0.7, -size * 0.45], [size, size * 0.4], [-size * 0.4, size * 0.8]]);
    pop();
  });
  pop();
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
    const radius = environmentRandom(1 - jitter, 1 + jitter);
    points.push([
      cx + cos(angle) * rx * radius,
      cy + sin(angle) * ry * radius
    ]);
  }
  return points;
}

function buildDamagedField() {
  const centerX = environmentRandom(870, 1260);
  const centerY = environmentRandom(420, 650);
  const rotationOffset = environmentRandom(-0.46, 0.24);
  const outerRx = environmentRandom(520, 720);
  const outerRy = environmentRandom(300, 440);

  damagedField = {
    base: '#C87629',
    layers: [
      {
        color: '#D58A3D',
        points: [
          [environmentRandom(-180, 80), environmentRandom(80, 330)],
          [environmentRandom(980, 1520), environmentRandom(-140, 80)],
          [environmentRandom(1900, 2130), environmentRandom(350, 720)],
          [environmentRandom(760, 1260), environmentRandom(1080, 1240)],
          [environmentRandom(-160, 120), environmentRandom(850, 1100)]
        ]
      },
      {
        color: '#BF6D1B',
        points: [
          [environmentRandom(120, 360), environmentRandom(160, 360)],
          [environmentRandom(1360, 1740), environmentRandom(80, 260)],
          [environmentRandom(1760, 2040), environmentRandom(720, 980)],
          [environmentRandom(620, 1120), environmentRandom(1020, 1190)],
          [environmentRandom(-100, 130), environmentRandom(560, 820)]
        ]
      },
      {
        color: '#AE630D',
        points: makeFieldPolygon(
          centerX,
          centerY,
          outerRx,
          outerRy,
          floor(environmentRandom(6, 9)),
          rotationOffset,
          0.14
        )
      },
      {
        color: '#A15400',
        points: makeFieldPolygon(
          centerX + environmentRandom(-50, 50),
          centerY + environmentRandom(-35, 38),
          outerRx * environmentRandom(0.58, 0.72),
          outerRy * environmentRandom(0.54, 0.68),
          floor(environmentRandom(5, 8)),
          rotationOffset + environmentRandom(-0.22, 0.22),
          0.16
        )
      },
      {
        color: '#7A3F00',
        points: makeFieldPolygon(
          centerX + environmentRandom(-65, 65),
          centerY + environmentRandom(-45, 48),
          outerRx * environmentRandom(0.27, 0.42),
          outerRy * environmentRandom(0.24, 0.38),
          floor(environmentRandom(5, 8)),
          rotationOffset + environmentRandom(-0.3, 0.3),
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
  const centerX = environmentRandom(860, 1320);
  const centerY = environmentRandom(430, 650);
  const rotationOffset = environmentRandom(-0.42, 0.28);
  const outerRx = environmentRandom(500, 690);
  const outerRy = environmentRandom(285, 420);
  const vertexCount = floor(environmentRandom(6, 9));

  restoredField = {
    palette,
    sweep: [
      [environmentRandom(-180, 120), environmentRandom(150, 390)],
      [environmentRandom(920, 1480), environmentRandom(-160, 70)],
      [environmentRandom(1860, 2100), environmentRandom(320, 700)],
      [environmentRandom(620, 1180), environmentRandom(1060, 1230)],
      [environmentRandom(-180, 130), environmentRandom(900, 1160)]
    ],
    accent: [
      [0, environmentRandom(440, 720)],
      [environmentRandom(260, 620), environmentRandom(650, 850)],
      [environmentRandom(720, 1100), 1080],
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
          centerX + environmentRandom(-50, 55),
          centerY + environmentRandom(-35, 40),
          outerRx * environmentRandom(0.58, 0.72),
          outerRy * environmentRandom(0.54, 0.68),
          floor(environmentRandom(5, 8)),
          rotationOffset + environmentRandom(-0.24, 0.24),
          0.16
        )
      },
      {
        color: palette.inner,
        points: makeFieldPolygon(
          centerX + environmentRandom(-70, 75),
          centerY + environmentRandom(-50, 55),
          outerRx * environmentRandom(0.27, 0.42),
          outerRy * environmentRandom(0.24, 0.38),
          floor(environmentRandom(5, 8)),
          rotationOffset + environmentRandom(-0.34, 0.34),
          0.2
        )
      }
    ]
  };
}

function buildRestoredLand() {
  restoredLand = { x: environmentRandom(1068, 1132), y: environmentRandom(525, 560),
    w: environmentRandom(735, 785), h: environmentRandom(60, 74), rotation: 0, moduleIds: [] };
}

function drawRestoredLand() {
  if (!restoredLand) return;
  const float = getSharedFloat();
  const anchors = modules.filter((m) => m.sharedLand);
  const recovery = anchors.reduce((sum, m) => sum + moduleRecovery(m), 0) / max(1, anchors.length);
  ADAPT_ASSETS.habitatIsland({
    x: restoredLand.x + float.x, y: restoredLand.y + 48 + float.y, rotation: float.r,
    width: restoredLand.w, height: restoredLand.h, recovery, variant: 1,
    alpha: smoothClamp(globalRecovery, 0.38, 0.92)
  });
}

function drawDepthField(rec) {
  const stateOneBase = color(damagedField?.base || '#C87629');
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

  for (const m of modules) {
    if (finalTriggered) {
      // Finish the balanced transition over several seconds instead of snapping.
      m.sun = min(1, m.sun + dt * 0.08);
      m.wind = min(1, m.wind + dt * 0.08);
    }

    const rawRecovery = moduleCharge(m);
    rawTotal += rawRecovery;
    const visualTarget = constrain(rawRecovery * 0.42 + smoothClamp(rawRecovery, m.assemblyDelay, 0.98) * 0.58, 0, 1);
    const assemblyRate = finalTriggered ? 0.8 : 0.62;
    const assemblyEase = 1 - exp(-dt * assemblyRate);
    m.visualRecovery = lerp(m.visualRecovery, visualTarget, assemblyEase);
    const rec = moduleRecovery(m);
    total += rec;

    // Ambient motion is render-only. Preserve the existing wind-brush impulse
    // and home attraction, but do not drive coordinates with ambient flow.
    m.vx = lerp(m.vx, 0, 0.04);
    m.vy = lerp(m.vy, 0, 0.04);

    m.x += m.vx * 60 * dt * motionScale;
    m.y += m.vy * 60 * dt * motionScale;
    m.x = lerp(m.x, m.homeX, 0.012);
    m.y = lerp(m.y, m.homeY, 0.012);
    m.rot = lerp(m.rot, m.vx * 0.018, 0.03);

    m.x = constrain(m.x, 110, W - 110);
    m.y = constrain(m.y, 100, H - 100);

    // Layout generation already reserves the title/control areas. Do not kick
    // moving habitats away from a hard UI boundary here: their home attraction
    // would pull them across it again, causing repeated jumps in the shared land.

    if (dist(pointerX, pointerY, m.x, m.y) < 84 * m.s) {
      m.hover = lerp(m.hover, 1, 0.12);
    } else {
      m.hover = lerp(m.hover, 0, 0.08);
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

  if (finalTriggered && !stateTwoAnnounced && globalRecovery > 0.985) {
    stateTwoAnnounced = true;
    globalRecovery = 1;
    modules.forEach((habitat) => { habitat.sun = 1; habitat.wind = 1; habitat.visualRecovery = 1; });
    announceArtworkState(2);
    setStatus('A connected clean-energy network is ready.', 4);
    playCompletionSound();
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
  const loose = 1 - smoothClamp(rec, 0.12, 0.95);
  const out = m.floatOffset || (m.floatOffset = { x: 0, y: 0, r: 0, scale: 1 });
  const light = m.kind === 'forest' || m.kind === 'wildlife';
  getFloatOffset(tm, m.phase, light ? 3 : 2, light ? 5.5 : 4,
    ((light ? 5.2 : 6.6) + m.id % 3 * 0.6) * Math.sqrt(m.s), light ? 0.014 : 0.0087, rec, out);
  if (m.sharedLand) {
    const offsets = [[-18, -20], [-10, 16], [16, -18], [20, 12]][m.sharedLandIndex];
    const land = getSharedFloat();
    const dx = m.homeX - restoredLand.x;
    out.x = m.homeX - m.x + (offsets[0] + out.x) * loose
      + (land.x + dx * (cos(land.r) - 1)) * (1 - loose);
    out.y = m.homeY - m.y + (offsets[1] + out.y) * loose
      + (land.y + dx * sin(land.r)) * (1 - loose);
    out.r = out.r * loose + land.r * (1 - loose);
    out.scale = 1;
  }
  return out;
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
    const tint = source.kind === 'sun' || source.kind === 'solar' ? C.orange : C.teal;
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

function habitatPose(m) {
  const recovery = moduleRecovery(m);
  const off = displayOffset(m, recovery);
  return {
    x: m.x + off.x, y: m.y + off.y + 40 * m.s,
    scale: m.s * (1 + m.hover * 0.025) * off.scale,
    rotation: m.sharedLand ? off.r : m.rot + off.r,
    recovery, state: recovery >= 0.65 ? 'recovered' : 'polluted'
  };
}

function drawPlatforms() {
  for (const m of modules) {
    const alpha = m.sharedLand ? 1 - smoothClamp(globalRecovery, 0.38, 0.92) : 1;
    ADAPT_ASSETS.habitatIsland({ ...habitatPose(m), width: m.platform.w, height: m.platform.h, variant: m.id % 2, alpha });
  }
}

function drawModules() {
  for (const m of modules.slice().sort((a, b) => a.y - b.y)) {
    const pose = habitatPose(m);
    push();
    translate(pose.x, pose.y);
    rotate(pose.rotation);
    scale(pose.scale);
    const loose = 1 - smoothClamp(pose.recovery, 0.12, 0.94);
    // Lift the current object group off its platform, as in the v3.6 assembly.
    translate(sin(m.phase) * 12 * loose, -22 * loose);
    rotate(sin(m.phase + 1) * 0.075 * loose);
    const appearance = { recovery: pose.recovery, state: pose.state, variant: m.variant };
    if (m.kind === 'solar') {
      if (m.sharedLand) {
        ADAPT_ASSETS.solarArray({ ...appearance, x: -22, scale: 0.9, energy: m.sun });
        ADAPT_ASSETS.tree({ ...appearance, x: 56, scale: 0.42 });
      } else ADAPT_ASSETS.solarHouse({ ...appearance, scale: 1.05, energy: m.sun });
    } else if (m.kind === 'wind') {
      ADAPT_ASSETS.windTurbine({ ...appearance, x: -20, scale: 0.93, energy: m.wind, angle: tm * m.wind * 0.38 });
      ADAPT_ASSETS.basicHouse({ ...appearance, x: 44, scale: 0.49 });
    } else if (m.kind === 'community') {
      ADAPT_ASSETS.basicHouse({ ...appearance, x: -33, scale: 0.8 });
      ADAPT_ASSETS.solarHouse({ ...appearance, x: 38, scale: 0.68, energy: m.sun });
    } else if (m.kind === 'forest') {
      ADAPT_ASSETS.treeCluster({ ...appearance, scale: 1.04 });
    } else if (m.kind === 'water') {
      ADAPT_ASSETS.landmark({ ...appearance, x: -18, scale: 1.05 });
      ADAPT_ASSETS.tree({ ...appearance, x: 57, scale: 0.56 });
    } else {
      ADAPT_ASSETS.tree({ ...appearance, x: 47, scale: 0.84 });
      ADAPT_ASSETS.wildlife({ ...appearance, x: -28, scale: 0.72 });
    }
    // Five deliberately placed clusters across nine habitats. The other zones
    // communicate damage through dormant infrastructure and two ground scars.
    if ([0, 4, 7, 9, 11].includes(m.id)) {
      ADAPT_ASSETS.pollutionCluster({
        ...appearance, x: m.kind === 'wildlife' ? -35 : -58, y: 8,
        scale: 0.4, variant: m.id % 3
      });
    }
    pop();
  }
}

function poly(points) {
  beginShape();
  for (const p of points) vertex(p[0], p[1]);
  endShape(CLOSE);
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
      sin(tm * 0.32 + phase + i * 1.7) * 10 * loose,
      -loose * (5 + i * 2) + cos(tm * 0.27 + phase + i) * 7 * loose
    );
    rotate(sin(tm * 0.22 + phase + i * 1.4) * 0.16 * loose);
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
  ensureAudioEnabled(true);
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

  playEnergySound(tool);

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
    ensureAudioEnabled(true).then(() => publishProgress(true));
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
  audioMaster.connect(audioContext.destination);
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
  // A visitor's explicit mute survives tool selection, strokes and regeneration.
  if (audioMuted) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const isFirstActivation = !audioContext;
  createAudioGraph(AudioContextClass);
  try {
    if (!paused) await audioContext.resume();
    await decodeAudioSamples();
    // A mute click may occur while the browser is decoding its first samples.
    if (audioMuted) return;
    audioEnabled = true;
    document.body.dataset.audioEnabled = 'true';
    audioMaster.gain.setTargetAtTime(0.72, audioContext.currentTime, 0.025);
    if (isFirstActivation && playConfirmation) {
      if (!playSample('confirmation', { gain: 0.58 })) {
        playTone(392, 0.12, 'sine', 0.24);
        playTone(587, 0.18, 'sine', 0.15, 0.07);
      }
    }
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
    gain: level = 0.5,
    rate = 1,
    delay = 0,
    exclusive = null,
    finishPrevious = false
  } = options;

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

function playTone(frequency, duration, type = 'sine', level = 0.2, delay = 0, channel = 'confirmation') {
  if (!audioEnabled || paused || !audioContext || !audioMaster) return;
  const start = audioContext.currentTime + delay;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(level, start + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(audioChannelGains.get(channel) || audioMaster);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
}

function playSelectSound(tool) {
  if (tool === 'sun') {
    if (!playSample('solarSelect', { gain: 0.48, exclusive: 'selection' })) {
      playTone(440, 0.16, 'sine', 0.2, 0, 'solarSelect');
      playTone(660, 0.2, 'sine', 0.12, 0.04, 'solarSelect');
    }
  } else {
    if (!playSample('windPaper', { gain: 0.38, rate: 0.94, exclusive: 'selection' })) {
      playTone(220, 0.2, 'triangle', 0.18, 0, 'windPaper');
      playTone(330, 0.18, 'sine', 0.1, 0.04, 'windPaper');
    }
  }
}

function playEnergySound(tool) {
  if (!audioEnabled || paused || !audioContext || activeSampleSources.has('energy')) return;
  const now = performance.now();
  const cooldown = tool === 'sun' ? 1050 : 720;
  if (now - lastEnergySoundAt[tool] < cooldown) return;
  lastEnergySoundAt[tool] = now;
  const recoveryLift = globalRecovery * 90;
  if (tool === 'sun') {
    if (!playSample('solarEnergy', {
      gain: 0.24,
      rate: 0.96 + globalRecovery * 0.08,
      exclusive: 'energy',
      finishPrevious: true
    })) {
      playTone(360 + recoveryLift, 0.11, 'sine', 0.085, 0, 'solarEnergy');
    }
  } else {
    if (!playSample('windPaper', {
      gain: 0.3,
      rate: 0.9 + globalRecovery * 0.12,
      exclusive: 'energy',
      finishPrevious: true
    })) {
      playTone(180 + recoveryLift * 0.55, 0.13, 'triangle', 0.07, 0, 'windPaper');
    }
  }
}

function playAssemblySound() {
  if (!playSample('assemblyKeyboard', { gain: 0.98, exclusive: 'assembly' })) {
    [246, 294, 370].forEach((note, index) => {
      playTone(note, 0.18, 'triangle', 0.1, index * 0.09, 'assemblyKeyboard');
    });
  } else {
    document.body.dataset.assemblyCue = 'keyboard';
  }
}

function playCompletionSound() {
  if (!playSample('recoveryWater', { gain: 0.72, exclusive: 'recovery' })) {
    [392, 494, 587, 784].forEach((note, index) => {
      playTone(note, 0.42, index % 2 ? 'triangle' : 'sine', 0.13, index * 0.085, 'recoveryWater');
    });
  } else {
    document.body.dataset.recoveryCue = 'water';
  }
}
