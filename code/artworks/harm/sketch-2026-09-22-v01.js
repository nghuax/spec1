// ============================================================
// HARM — STAGE 1 / FINAL INTERACTIVE BUILD
// SDG 07 — Affordable & Clean Energy
// Refined factory stacking, industrial smoke, angular ecology + connected power grid.
// ============================================================

const W = 1920;
const H = 1080;
const RENDER_DENSITY = Math.min((window.devicePixelRatio || 1), 2);

const C = {
  ink: '#141414',
  grey: '#8F96A3',
  paper: '#F4F1EC',
  blue: '#2930FF',
  violet: '#FF7900',
  orange: '#FF7900',
  lime: '#B3FF36',
  light: '#D8DBE3',
  skyClean: '#12141C',
  skyMid: '#131A37',
  skyDirty: '#241E28',
  treeFresh: '#B3FF36',
  treeDry: '#A6B73E',
  treeYellow: '#B8952E',
  treeBrown: '#6F4B24',
  treeDead: '#40352C',
  powerBright: '#4E66FF',
  powerWeak: '#6D7485',
  soot: '#4E5057',
  sootDeep: '#2B2C31',
  heat: '#FF8B2B',
  heatDeep: '#D55C14'
};

function mixColor(a, b, t) {
  return lerpColor(color(a), color(b), constrain(t, 0, 1));
}

function pollutionN() {
  return constrain(pollution / 100, 0, 1);
}

function objectVitality(damage) {
  const p = pollutionN();
  return constrain(1 - damage * .82 - p * .28, 0, 1);
}

function treeLifeColor(health, damage = 0) {
  const p = pollutionN();
  let c = mixColor(C.treeDead, C.treeBrown, constrain(health * 1.15, 0, 1));
  c = lerpColor(c, color(C.treeYellow), constrain(health * 1.4 - .08, 0, 1));
  c = lerpColor(c, color(C.treeDry), constrain(health * 1.15 - .22, 0, 1));
  c = lerpColor(c, color(C.treeFresh), constrain(health * 1.05 - .44, 0, 1));
  c = lerpColor(c, color(C.sootDeep), constrain(damage * .18 + max(0, p - .72) * .28, 0, .42));
  return c;
}

function structuralBodyColor(baseLight, soot = 0, damage = 0) {
  const p = pollutionN();
  const grime = constrain(soot * .72 + damage * .26 + p * .12, 0, 1);
  return lerpColor(color(baseLight), color(96, 96, 102), grime);
}

function energyGlowColor(strength = 1, damage = 0) {
  const vitality = objectVitality(damage);
  return lerpColor(color(C.powerWeak), color(C.powerBright), constrain(strength * (.32 + vitality * .95), 0, 1));
}

function emberAccentColor(strength = 1) {
  const p = pollutionN();
  return lerpColor(color(C.heatDeep), color(C.heat), constrain(.32 + strength * .55 - p * .10, 0, 1));
}

// Reusable geometry templates. Keeping these outside draw functions avoids creating
// thousands of temporary arrays every second when smoke / dust become dense.
const SMOKE_FAMILY_POINTS = [
  [[-1.10,-.18],[-.72,-.86],[-.08,-1.04],[.58,-.74],[1.04,-.10],[.76,.62],[.10,.94],[-.78,.68]],
  [[-1.18,-.38],[-.46,-.76],[.18,-.54],[.82,-.84],[1.12,-.16],[.62,.22],[.88,.72],[.08,.88],[-.76,.58]],
  [[-.92,-.82],[-.18,-1.04],[.28,-.62],[.88,-.40],[1.02,.26],[.46,.74],[-.22,.98],[-.82,.48],[-1.04,-.18]],
  [[-1.20,-.12],[-.74,-.54],[-.10,-.46],[.22,-.92],[.92,-.50],[1.12,.06],[.56,.38],[.38,.88],[-.46,.76],[-.94,.36]],
  [[-1.04,-.56],[-.40,-.98],[.10,-.66],[.56,-.96],[1.06,-.34],[.86,.30],[.24,.50],[.04,.94],[-.68,.70],[-1.14,.08]],
  [[-1.14,-.20],[-.86,-.70],[-.22,-1.12],[.34,-1.00],[.94,-.58],[1.16,.02],[.68,.66],[-.02,.96],[-.84,.76],[-1.12,.18]]
];

const INDUSTRY_SMOKE_OUTER = [
  [[-1.20,-.22],[-.86,-.90],[-.18,-1.12],[.56,-.80],[1.08,-.20],[.84,.60],[.18,1.02],[-.82,.72]],
  [[-1.06,-.38],[-.72,-.98],[-.06,-1.16],[.62,-.88],[1.16,-.18],[.86,.34],[.42,.98],[-.54,.86],[-1.04,.18]],
  [[-1.26,-.08],[-.96,-.64],[-.30,-1.00],[.34,-.96],[.96,-.42],[1.10,.14],[.72,.74],[.06,1.04],[-.82,.78],[-1.12,.24]],
  [[-1.10,-.44],[-.42,-1.06],[.18,-.88],[.86,-.86],[1.18,-.06],[.94,.52],[.32,.94],[-.42,.84],[-1.02,.32]]
];
const INDUSTRY_SMOKE_MID = [
  [[-.92,-.18],[-.64,-.72],[-.10,-.90],[.44,-.64],[.92,-.12],[.62,.56],[.14,.82],[-.66,.58]],
  [[-.82,-.26],[-.50,-.78],[.02,-.90],[.48,-.62],[.88,-.06],[.58,.46],[.18,.76],[-.54,.60]],
  [[-.94,-.10],[-.62,-.64],[-.04,-.80],[.50,-.70],[.90,-.18],[.58,.48],[.08,.78],[-.68,.54]],
  [[-.86,-.34],[-.28,-.82],[.18,-.70],[.70,-.68],[.92,-.08],[.68,.42],[.20,.80],[-.46,.64]]
];
const INDUSTRY_SMOKE_CORE = [
  [[-.30,-.10],[-.10,-.34],[.28,-.24],[.38,.08],[.08,.34],[-.24,.18]],
  [[-.24,-.18],[.02,-.34],[.30,-.14],[.28,.14],[.02,.30],[-.22,.12]],
  [[-.34,-.06],[-.06,-.26],[.24,-.24],[.34,.02],[.12,.24],[-.18,.18]],
  [[-.26,-.14],[.02,-.28],[.26,-.18],[.30,.08],[.06,.28],[-.20,.18]]
];
const COAL_SHAPE_POINTS = [
  [[-.9,-.2],[-.45,-.82],[.28,-.62],[.92,-.08],[.55,.72],[-.4,.86]],
  [[-.9,-.55],[-.1,-.72],[.18,-.32],[.75,-.54],[.95,.18],[.30,.78],[-.75,.55]],
  [[-.9,-.15],[-.6,-.72],[0,-.9],[.6,-.58],[.9,.05],[.34,.86],[-.52,.62]],
  [[-.82,-.62],[-.16,-.86],[.26,-.54],[.84,-.40],[.70,.28],[.16,.78],[-.52,.84],[-.92,.18]]
];
const SHARD_SHAPE_POINTS = [
  null,
  null,
  [[-.82,-.28],[-.22,-.80],[.70,-.30],[.56,.62],[-.62,.52]],
  [[-.72,-.62],[.18,-.82],[.76,-.10],[.34,.72],[-.68,.44]],
  [[-1,0],[-.42,-.72],[.34,-.84],[.94,-.12],[.58,.64],[-.36,.78]]
];
const TREE_CROWN_SETS = [
  [
    {x:-27,y:-82,w:64,h:50,r:-.11,cut:0,drop:14,breakDir:-.018},
    {x:3,y:-111,w:73,h:56,r:.035,cut:1,drop:20,breakDir:.014},
    {x:34,y:-82,w:58,h:47,r:.12,cut:2,drop:31,breakDir:.026},
    {x:5,y:-62,w:54,h:41,r:-.025,cut:3,drop:39,breakDir:-.030}
  ],
  [
    {x:-31,y:-78,w:58,h:46,r:.08,cut:2,drop:20,breakDir:-.024},
    {x:-1,y:-113,w:76,h:58,r:-.07,cut:0,drop:14,breakDir:.012},
    {x:35,y:-86,w:61,h:48,r:.07,cut:3,drop:32,breakDir:.030},
    {x:12,y:-63,w:55,h:42,r:.015,cut:1,drop:42,breakDir:-.026}
  ],
  [
    {x:-35,y:-86,w:61,h:48,r:-.055,cut:1,drop:21,breakDir:-.026},
    {x:-4,y:-111,w:70,h:55,r:.035,cut:3,drop:15,breakDir:.015},
    {x:35,y:-75,w:64,h:48,r:.105,cut:0,drop:33,breakDir:.029},
    {x:8,y:-58,w:50,h:39,r:-.10,cut:2,drop:43,breakDir:-.032}
  ]
];
const TREE_PLATE_POINTS = [
  [[-.52,-.08],[-.34,-.48],[.04,-.56],[.46,-.30],[.52,.08],[.25,.48],[-.18,.43],[-.48,.20]],
  [[-.52,-.24],[-.12,-.53],[.29,-.43],[.52,-.06],[.33,.39],[-.07,.52],[-.46,.25]],
  [[-.48,-.36],[-.02,-.56],[.40,-.31],[.52,.10],[.12,.50],[-.36,.40],[-.54,.02]],
  [[-.50,-.12],[-.29,-.50],[.15,-.52],[.50,-.20],[.43,.24],[.05,.49],[-.40,.34]]
];

const MACHINE = { x: 700, y: 710, scale: 1.12 }; // lifted ~38 px (~1 cm at 96 dpi) for cleaner vertical balance
// Seven completed coal transfers fill the scene and unlock the final breathing phase.
const COMPLETION_BURNS = 7;
const MAX_COAL = 7;
const MAX_SMOKE = 620;
const MAX_CARBON = 220;
const MAX_ASH = 60;
const MAX_DEBRIS = 140;
const MAX_ENERGY = 12;
const MAX_STAINS = 90;
const DEMAND_HOLD = 0.45;
const DEMAND_COOLDOWN = 1.75;

// ------------------------------------------------------------
// ORGANIC RANDOM WORLD MOTION
// Smooth noise-driven wandering keeps the composition alive without jitter.
// Every reset creates different motion seeds/speeds, while bounded amplitudes
// prevent objects from drifting out of their visual zones.
// ------------------------------------------------------------

function artCompositionField(o) {
  if (!o) return { x: 0, y: 0, scale: 1, rot: 0 };
  const type = o.motionType || o.kind || 'generic';
  const t = sceneTime;
  const seed = o.seed || 0;

  // Slow chapters keep the work alive, but this pass is calmer and more curated.
  const cluster = sin(t * .15 + seed * .002) * .5 + .5;
  const flow = sin(t * .23 + seed * .006 + 2.1) * .5 + .5;
  const breath = sin(t * .30 + seed * .009 + 4.2) * .5 + .5;

  const cx = W * .50;
  const cy = type === 'factory' ? H * .45 : type === 'house' ? H * .73 : H * .61;
  let vx = cx - o.x;
  let vy = cy - o.y;
  const mag = max(1, sqrt(vx * vx + vy * vy));
  vx /= mag;
  vy /= mag;

  const range = type === 'tree' ? 24 : type === 'house' ? 20 : type === 'factory' ? 20 : type === 'pole' ? 10 : 16;
  const pull = (cluster - .48) * range;
  const lane = sin(t * .46 + o.x * .006 + seed * .018);
  const wave = cos(t * .38 + o.y * .007 + seed * .014);

  return {
    x: vx * pull + lane * range * .30 * flow,
    y: vy * pull * .40 + wave * range * .18 * flow,
    rot: lane * (.003 + range * .00004) * flow,
    scale: 1 + (breath - .5) * .035 + (cluster - .5) * .010
  };
}

function objectMotionProfile(o) {
  const type = o && o.motionType ? o.motionType : (o && o.kind ? o.kind : 'generic');
  // v26 loosen pass: houses and trees drift more noticeably so the world feels
  // a little more alive and slightly chaotic, while factories/poles remain calmer
  // to preserve the main composition and keep the machine as the anchor.
  if (type === 'tree') return { ax: 20, ay: 11.5, rot: .0115, orbit: 4.2, flutter: 2.3 };
  if (type === 'house') return { ax: 17.5, ay: 9.5, rot: .0095, orbit: 3.5, flutter: 1.9 };
  if (type === 'factory') return { ax: 11, ay: 6, rot: .0065, orbit: 2.2, flutter: 1.4 };
  if (type === 'pole') return { ax: 7, ay: 3.5, rot: .005, orbit: 1.4, flutter: 1.0 };
  return { ax: 10, ay: 6, rot: .0075, orbit: 2.1, flutter: 1.4 };
}

function objectVisualPose(o) {
  if (!o) return { x: 0, y: 0, rot: 0, scale: 1 };
  const cfg = objectMotionProfile(o);
  const amp = o.motionAmp || 1;
  const sx = o.motionSpeedX || .12;
  const sy = o.motionSpeedY || .105;
  const nx = o.motionSeedX || (o.seed * .013 + 17.3);
  const ny = o.motionSeedY || (o.seed * .019 + 61.9);
  const phase = o.motionPhase || 0;
  const comp = artCompositionField(o);
  const gen = generativeObjectMotion(o);

  // Multi-octave wandering: broad drift + faster local turn + orbit + micro flutter.
  // All layers use smooth noise so the movement feels improvised rather than jittery.
  const speedWarp = .72 + noise(nx + 311.4, sceneTime * .055) * .72;
  const tx = sceneTime * sx * speedWarp;
  const ty = sceneTime * sy * (.82 + noise(ny + 402.7, sceneTime * .048) * .58);

  const n1 = (noise(nx, tx) - .5) * 2;
  const n2 = (noise(ny, ty) - .5) * 2;
  const n3 = (noise(nx + 91.7, tx * .54) - .5) * 2;
  const n4 = (noise(ny + 137.2, ty * .61) - .5) * 2;
  const fastX = (noise(nx + 501.2, sceneTime * sx * 2.1) - .5) * 2;
  const fastY = (noise(ny + 602.6, sceneTime * sy * 2.0) - .5) * 2;

  const orbitA = sceneTime * (.38 + sx * 2.5) + phase;
  const orbitB = sceneTime * (.31 + sy * 2.2) + phase * .73;
  const breathe = 1 + sin(sceneTime * (.72 + sx * 1.8) + phase) * .012 * amp
    + fastY * .006 * amp;

  const arrival = objectArrival(o);
  const looseType = o && (o.motionType === 'tree' || o.motionType === 'house');
  const settle = o.entryDX !== undefined ? .24 : (looseType ? .66 : .52);
  return {
    x: arrival.x + settle * ((n1 * .66 + n3 * .21 + fastX * .13) * cfg.ax * amp
      + cos(orbitA) * cfg.orbit * amp + comp.x + gen.x),
    y: arrival.y + settle * ((n2 * .66 + n4 * .21 + fastY * .13) * cfg.ay * amp
      + sin(orbitB) * cfg.orbit * .62 * amp + comp.y + gen.y),
    rot: (n3 * .48 + fastX * .18 + sin(orbitA * .78) * .34) * cfg.rot * amp + comp.rot + gen.rot,
    scale: constrain(breathe * comp.scale, .94, 1.07)
  };
}

function objectVisualPosition(o) {
  const p = objectVisualPose(o);
  return { x: o.x + p.x, y: o.y + p.y, rot: o.rot + p.rot, scale: p.scale || 1 };
}

function machineVisualPose() {
  const seed = (sceneSeed % 100000) * .00019;
  const speedWarp = .78 + noise(seed + 190.4, sceneTime * .06) * .68;
  const nx = (noise(seed + 12.7, sceneTime * .105 * speedWarp) - .5) * 2;
  const ny = (noise(seed + 48.3, sceneTime * .091 * speedWarp) - .5) * 2;
  const nxSlow = (noise(seed + 106.1, sceneTime * .041) - .5) * 2;
  const nFast = (noise(seed + 208.8, sceneTime * .22) - .5) * 2;
  const a = sceneTime * .64 + seed * 7;
  const chapter = sin(sceneTime * .18 + 1.4) * .5 + .5;
  const sweep = sin(sceneTime * .42 + seed * 11);
  return {
    // The hero machine should feel alive, not loose. Keep motion sub-pixel-to-small
    // at normal viewing size and let combustion pulses provide the stronger motion.
    x: (nx * .66 + nxSlow * .22 + nFast * .12) * 22 + cos(a) * 6 + sweep * 7 * chapter,
    y: ny * 12 + sin(a * .82) * 4 + cos(sceneTime * .31 + seed * 4) * 3 * chapter,
    rot: nxSlow * .008 + nFast * .003 + sweep * .0025 * chapter,
    scale: constrain(1 + sin(sceneTime * .86 + seed * 20) * .008 + nFast * .003 + (chapter - .5) * .010, .975, 1.025)
  };
}


// The built environment no longer assembles on its own.
// Early coal burns progressively unlock architecture in curated waves.
const ARCHITECTURE_WAVES = [
  ['H2', 'F05'],
  ['H0', 'H3', 'F0'],
  ['H1', 'H4', 'F1'],
  ['H5', 'F3', 'F2'],
  ['H6', 'F4']
];
const DEMAND_LIFETIME = 10.0;
const FIELD_COLS = 18;
const FIELD_ROWS = 10;
const FIELD_DIFFUSION = 0.050;
const FIELD_DECAY = 0.0017;
const MAX_AMBIENT_FRAGMENTS = 76;

const INFO_UI = { x: 1810, y: 138, r: 32 };
let infoOpen = false;

let sceneSeed = 0;
let sceneTime = 0;
let grainLayer = null;
let statusEl = null;
let lastStatus = '';
let statusUntil = 0;
let statusPriority = 0;

let houses = [];
let trees = [];
let poles = [];
let factories = [];
let demandNodes = [];
let patches = [];
let worldDrawOrder = [];

let coal = [];
let fragments = [];
let demandSignals = [];
let energyClusters = [];
let smoke = [];
let carbonDust = [];
let ash = [];
let stains = [];
let debris = [];
// Lightweight litter/plastic layer used only for environmental damage moments.
// This is intentionally separate from structural debris so the Plastic Bag sound
// has a clear visual partner without changing the existing destruction physics.
let damageWaste = [];
let damageWasteMilestones = [false, false, false];
let ambientFragments = [];
let pollutionField = [];
let pollutionFieldNext = [];
let demandQueue = [];
let burnTimes = [];
let overdrive = 0;
let overdrivePulse = 0;
let completionAt = -Infinity; // v25: timestamp for the short 100% visual transformation

let dragState = null;
let hoveredCoal = -1;
let hoveredNode = null;
let hoverStarted = 0;

let burnCount = 0;
let burnPulse = 0;
let feedPulse = 0;
let machineHeat = 0;
let pollution = 0;
let smokeCeiling = 0;
let powerDelivered = 0;
let smokeWind = 0;
let smokeWindTarget = 0;
let smokeWindMouse = 0;

// ------------------------------------------------------------
// SETUP
// ------------------------------------------------------------

function setup() {
  const cnv = createCanvas(W, H);
  cnv.parent('canvas-holder');
  pixelDensity(RENDER_DENSITY);
  frameRate(30);
  rectMode(CENTER);
  ellipseMode(CENTER);
  strokeJoin(MITER);
  strokeCap(SQUARE);
  textFont('Arial');
  drawingContext.imageSmoothingEnabled = true;

  statusEl = document.getElementById('status-message');
  buildGrain();
  resetScene();
}

function buildGrain() {
  grainLayer = createGraphics(W, H);
  grainLayer.pixelDensity(RENDER_DENSITY);
  grainLayer.clear();
  grainLayer.noStroke();
  for (let i = 0; i < 5200; i++) {
    const white = random() > 0.58;
    grainLayer.fill(white ? 255 : 0, random(1, 5));
    grainLayer.rect(random(W), random(H), random(0.5, 1.25), random(0.5, 1.25));
  }
}

function resetScene() {
  completionShown = false;
  resetPressure();
  nextAtmosphericWasteAt = 0;
  if (window.HarmSound) {
    window.HarmSound.stopAll();
    if (typeof window.HarmSound.resetMachineCycle === 'function') window.HarmSound.resetMachineCycle();
  }
  sceneSeed = ((Date.now() & 0xffffffff) ^ floor(Math.random() * 0x7fffffff)) >>> 0;
  randomSeed(sceneSeed);
  noiseSeed(sceneSeed ^ 0x6245f10d);
  if (typeof randomizeGraphicField === 'function') randomizeGraphicField();

  sceneTime = 0;
  burnCount = 0;
  burnPulse = 0;
  feedPulse = 0;
  machineHeat = 0;
  pollution = 0;
  smokeCeiling = 0;
  powerDelivered = 0;
  smokeWind = 0;
  smokeWindTarget = 0;
  smokeWindMouse = 0;
  overdrive = 0;
  overdrivePulse = 0;
  completionAt = -Infinity;
  burnTimes = [];
  demandQueue = [];

  coal = [];
  fragments = [];
  demandSignals = [];
  energyClusters = [];
  smoke = [];
  carbonDust = [];
  ash = [];
  stains = [];
  debris = [];
  damageWaste = [];
  damageWasteMilestones = [false, false, false];
  ambientFragments = [];
  initPollutionField();

  dragState = null;
  hoveredCoal = -1;
  hoveredNode = null;
  hoverStarted = 0;
  infoOpen = false;
  lastStatus = '';
  statusUntil = 0;
  statusPriority = 0;
  lastHudPercent = -1;
  lastHudWarning = null;

  buildWorld();
  initGenerativeRefinement();
  worldDrawOrder.forEach(item => { item.y = item.ref ? item.ref.y : MACHINE.y; });
  worldDrawOrder.sort((a,b) => a.y-b.y);
  buildAmbientFragments();
  for (let i = 0; i < MAX_COAL; i++) coal.push(spawnCoal(true, i));

  setStatus('CLICK COAL TO POWER THE MACHINE · EACH BURN ADDS AIR POLLUTION', 6.0, 2);
  if (window.HarmSound && typeof window.HarmSound.restartSceneSoundscape === 'function') {
    window.HarmSound.restartSceneSoundscape();
  }
}


