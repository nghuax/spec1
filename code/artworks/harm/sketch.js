// ============================================================
// HARM — STAGE 1 / FINAL INTERACTIVE BUILD
// SDG 07 — Affordable & Clean Energy
// Refined factory stacking, industrial smoke, angular ecology + connected power grid.
// ============================================================

const W = 1920;
const H = 1080;
const RENDER_DENSITY = Math.min((window.devicePixelRatio || 1), 2);

const C = {
  ink: '#06070C',
  grey: '#8F96A3',
  paper: '#F4F1EC',
  blue: '#2F39FF',
  violet: '#745BFF',
  orange: '#FF7B1F',
  lime: '#C3F52B',
  light: '#D8DBE3',
  skyClean: '#08102A',
  skyMid: '#131A37',
  skyDirty: '#241E28',
  treeFresh: '#C3F52B',
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

const MACHINE = { x: 470, y: 702, scale: 0.70 };
// The machine indicator is visually full at 20 burns (8 illuminated cells).
// Sound uses the same threshold, so the Microwave bell is reserved for true 100%.
const MACHINE_SOUND_COMPLETE_BURNS = 20;
const MAX_COAL = 7;
const MAX_SMOKE = 620;
const MAX_CARBON = 220;
const MAX_ASH = 60;
const MAX_DEBRIS = 140;
const MAX_ENERGY = 12;
const MAX_STAINS = 90;
const DEMAND_HOLD = 0.45;
const DEMAND_COOLDOWN = 1.75;

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
const MAX_AMBIENT_FRAGMENTS = 56;

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
  frameRate(60);
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
  lastHudWarning = false;

  buildWorld();
  buildAmbientFragments();
  for (let i = 0; i < MAX_COAL; i++) coal.push(spawnCoal(true, i));

  setStatus('DRAG COAL INTO THE MACHINE · EACH BURN POWERS THE GRID, BUT AIR LOAD KEEPS RISING', 6.0, 2);
}

