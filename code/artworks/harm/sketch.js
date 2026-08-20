// ============================================================
// BURN V32.5 — STABLE SUBTITLE REBUILD
// SDG 07 — Affordable & Clean Energy
// Refined factory stacking, industrial smoke, angular ecology + connected power grid.
// ============================================================

const W = 1920;
const H = 1080;

const C = {
  ink: '#08090D',
  grey: '#9FA4A5',
  paper: '#F3F2F0',
  blue: '#2E33F5',
  violet: '#6C58E8',
  orange: '#FF7A1A',
  lime: '#B4F22A',
  light: '#D9D8D4'
};

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

const MACHINE = { x: 470, y: 824, scale: 0.70 };
const MAX_COAL = 7;
const MAX_SMOKE = 430;
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

let sceneSeed = 0;
let sceneTime = 0;
let grainLayer = null;
let statusEl = null;
let lastStatus = '';
let statusUntil = 0;

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
  pixelDensity(1);
  frameRate(60);
  rectMode(CENTER);
  ellipseMode(CENTER);
  strokeJoin(MITER);
  strokeCap(SQUARE);
  // HEAL integration: use the user-selected shared typeface across the system.
  textFont('Stack Sans Notch');

  statusEl = document.getElementById('status-message');
  buildGrain();
  resetScene();
}

function buildGrain() {
  grainLayer = createGraphics(W, H);
  grainLayer.pixelDensity(1);
  grainLayer.clear();
  grainLayer.noStroke();
  for (let i = 0; i < 5200; i++) {
    const white = random() > 0.58;
    grainLayer.fill(white ? 255 : 0, random(1, 5));
    grainLayer.rect(random(W), random(H), random(0.5, 1.25), random(0.5, 1.25));
  }
}

function resetScene() {
  sceneSeed = ((Date.now() & 0xffffffff) ^ floor(Math.random() * 0x7fffffff)) >>> 0;
  randomSeed(sceneSeed);
  noiseSeed(sceneSeed ^ 0x6245f10d);

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
  ambientFragments = [];
  initPollutionField();

  dragState = null;
  hoveredCoal = -1;
  hoveredNode = null;
  hoverStarted = 0;

  buildWorld();
  buildAmbientFragments();
  for (let i = 0; i < MAX_COAL; i++) coal.push(spawnCoal(true, i));

  setStatus('CLICK OR DRAG THE FIRST COAL PIECES · EACH BURN BUILDS MORE OF THE ENERGY LANDSCAPE', 6.0);
}

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

  patches = [
    { x: 362, y: 766, w: 144, r: -.01 },
    { x: 652, y: 922, w: 154, r: .01 },
    { x: 896, y: 738, w: 144, r: 0 },
    { x: 1118, y: 902, w: 168, r: -.02 },
    { x: 1334, y: 812, w: 150, r: .01 },
    { x: 1560, y: 936, w: 174, r: .02 },
    { x: 1768, y: 812, w: 148, r: .01 },
    { x: 248, y: 614, w: 86, r: 0 },
    { x: 726, y: 610, w: 96, r: 0 },
    { x: 1228, y: 562, w: 226, r: -.03 },
    { x: 1528, y: 520, w: 202, r: .02 },
    { x: 1466, y: 750, w: 110, r: -.01 },
    { x: 1778, y: 650, w: 96, r: .01 }
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
    id, variant,
    locked: true,
    activationAt: Infinity,
    revealBias: birth,
    charge: 0,
    powerPulse: 0,
    demandFlash: 0,
    demandReady: 0,
    demandQueuedAt: -99,
    lastDemandAt: -99,
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
    id, variant,
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
  for (let i = 0; i < wave.length; i++) {
    const o = findArchitectureById(wave[i]);
    if (!unlockArchitecture(o, i * .16)) continue;
    unlocked++;
    if (!firstNode) {
      const type = houses.includes(o) ? 'house' : 'factory';
      firstNode = { id: o.id, type, ref: o };
    }
  }

  if (unlocked > 0) {
    setStatus(`BURN ${nf(count, 2)} · ${unlocked} STRUCTURE${unlocked > 1 ? 'S' : ''} ARE FORMING`, 2.8);
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
  updatePollutionField(dt);
  updateAmbientFragments(dt);
  updateWorld(dt);
  updateGlobal(dt);

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
  drawAmbientFragments(true);
  drawCarbon(true);
  drawSmoke(true);
  drawAtmosphereVeil();
  drawHUD();
  image(grainLayer, 0, 0);
}

// ------------------------------------------------------------
// INTERACTION / DEMAND
// ------------------------------------------------------------

function updateHover() {
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
  setStatus('ENERGY DEMAND APPEARS · CHOOSE COAL TO SATISFY IT', 2.4);
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
  setStatus('DEMAND IS WAITING · CLICK OR DRAG A COAL PIECE INTO THE SYSTEM', 2.8);
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
// COAL
// ------------------------------------------------------------

function spawnCoal(initial, index = 0) {
  const lanes = [150, 400, 700, 1030, 1350, 1640, 1840];
  const lane = lanes[index % lanes.length] + random(-42, 42);
  return {
    x: lane,
    y: initial ? random(-50, 900) : random(-260, -60),
    lane,
    laneVel: random(-.050, .050),
    speed: random(.86, 1.38),
    swayA: random(12, 29),
    swayB: random(6, 16),
    freqA: random(.28, .58),
    freqB: random(.12, .28),
    phaseA: random(TWO_PI),
    phaseB: random(TWO_PI),
    seed: random(1000),
    size: random(18, 31),
    rot: random(-.7, .7),
    rv: random(-.008, .008),
    type: floor(random(4))
  };
}

function updateCoal(dt) {
  const demandPressure = constrain((demandQueue.length * .72 + demandSignals.length * .28), 0, 1.4);
  const hopper = machineHopperPoint();

  for (let i = 0; i < coal.length; i++) {
    const c = coal[i];
    if (dragState && dragState.index === i) {
      c.x = mouseX + dragState.ox;
      c.y = mouseY + dragState.oy;
      c.rot += .008 * dt * 60;
      continue;
    }

    c.y += c.speed * (1 + pollution * .001 + demandPressure * .08) * dt * 60;
    c.lane += c.laneVel * dt * 60;
    if (c.lane < 90 || c.lane > W - 90) c.laneVel *= -1;

    const organic = (noise(c.seed * .01, sceneTime * .11 + i * .03) - .5) * 14;
    let px = c.lane
      + sin(sceneTime * c.freqA + c.phaseA) * c.swayA
      + cos(sceneTime * c.freqB + c.phaseB) * c.swayB
      + organic;

    if (demandPressure > .02) {
      const dd = dist(px, c.y, hopper.x, hopper.y);
      const attract = demandPressure * smooth01(map(dd, 980, 120, 0, 1)) * .032;
      px = lerp(px, hopper.x, attract);
      c.rot += sin(sceneTime * 4 + c.seed) * attract * .035;
    }
    c.x = px;

    c.rot += (c.rv + sin(sceneTime * .7 + c.phaseB) * .0012) * dt * 60;
    if (c.y > H + 70) coal[i] = spawnCoal(false, i);
  }
}

function findCoalAt(mx, my) {
  for (let i = coal.length - 1; i >= 0; i--) {
    const c = coal[i];
    if (dist(mx, my, c.x, c.y) < c.size * 1.5) return i;
  }
  return -1;
}

function autoFeed(target) {
  // Kept as a helper for optional scripted/demo use. Normal hover interaction never calls it.
  let best = -1;
  let bestD = Infinity;
  const h = machineHopperPoint();
  for (let i = 0; i < coal.length; i++) {
    if (dragState && dragState.index === i) continue;
    const d = dist(coal[i].x, coal[i].y, h.x, h.y);
    if (d < bestD) { bestD = d; best = i; }
  }
  if (best >= 0) fractureCoal(best, target || consumeDemandTarget() || chooseTarget());
}

function fractureCoal(index, target) {
  const c = coal[index];
  if (!c) return;
  coal[index] = spawnCoal(false, index);

  const hopper = machineHopperPoint();
  const pieces = 5 + floor(random(2));
  for (let k = 0; k < pieces; k++) {
    const tx = hopper.x + random(-12, 12);
    const ty = hopper.y + random(-8, 8);
    fragments.push({
      sx: c.x, sy: c.y,
      x: c.x, y: c.y,
      cx: lerp(c.x, tx, .48) + random(-90, 90),
      cy: min(c.y, ty) - random(70, 145),
      tx, ty,
      t: 0,
      speed: random(.028, .040) + (k === 0 ? .008 : 0),
      size: c.size * random(.23, .38),
      type: c.type,
      rot: c.rot,
      rv: random(-.05, .05),
      leader: k === 0,
      target
    });
  }
  feedPulse = 1;
}

function updateFragments(dt) {
  for (let i = fragments.length - 1; i >= 0; i--) {
    const f = fragments[i];
    f.t += f.speed * dt * 60;
    const q = ease(constrain(f.t, 0, 1));
    const p = quadratic(f.sx, f.sy, f.cx, f.cy, f.tx, f.ty, q);
    f.x = p.x;
    f.y = p.y;
    f.rot += f.rv * dt * 60;

    if (f.t >= 1) {
      const leader = f.leader;
      const target = f.target;
      fragments.splice(i, 1);
      if (leader) triggerBurn(target);
    }
  }
}

// ------------------------------------------------------------
// COMBUSTION / POWER
// ------------------------------------------------------------

function triggerBurn(target) {
  burnCount++;
  burnPulse = 1;
  feedPulse = 1;

  burnTimes.push(sceneTime);
  burnTimes = burnTimes.filter(t => sceneTime - t <= 4.5);
  overdrive = constrain((burnTimes.length - 2) / 3, 0, 1);
  overdrivePulse = max(overdrivePulse, overdrive);

  const emissionMul = 1 + overdrive * 1.85;
  machineHeat = min(1.45, machineHeat + .32 + overdrive * .28);

  // Every burn creates useful power and an environmental debt.
  // Rapid repeated burns deliberately make the emissions cost grow faster than the reward.
  pollution = min(100, pollution + 3.8 * emissionMul);

  // The first coal burns progressively construct the houses and factories.
  // This replaces the previous time-based self-assembly.
  const newlyFormingNode = unlockArchitectureForBurn(burnCount);
  const node = target || newlyFormingNode || chooseTarget();
  if (node) spawnEnergy(node);

  // Avoid one-click frame spikes. The machine gives a compact burst; the factories
  // provide the sustained industrial plume after architecture comes online.
  const smokeBurst = floor((3 + pollution * .012) * (1 + overdrive * .65));
  const carbonBurst = floor((3 + pollution * .014) * (1 + overdrive * .70));
  const ashBurst = floor((2 + pollution * .007) * (1 + overdrive * .45));
  for (let i = 0; i < smokeBurst; i++) emitMachineSmoke(true);
  for (let i = 0; i < carbonBurst; i++) emitCarbon(machineExhaustPoint(), 1 + overdrive * .24);
  for (let i = 0; i < ashBurst; i++) emitAsh();

  // A burn pulse also physically disturbs the visual field without directly damaging it.
  applyCombustionShockwave(.45 + overdrive * .55);

  if (overdrive > .22) setStatus('OVERDRIVE · MORE POWER NOW CREATES DISPROPORTIONATELY MORE EMISSIONS', 3.0);
  else setStatus('COAL BURNS → ELECTRICITY MOVES · SMOKE AND SOOT REMAIN', 2.8);
}

function chooseTarget() {
  const readyHouses = houses.filter(h => objectReady(h) && h.charge < .55);
  if (readyHouses.length && random() < .72) {
    const h = random(readyHouses);
    return { id: h.id, type: 'house', ref: h };
  }

  const readyFactories = factories.filter(f => objectReady(f) && f.activity < .45);
  if (readyFactories.length && random() < .60) {
    const f = random(readyFactories);
    return { id: f.id, type: 'factory', ref: f };
  }

  const ready = demandNodes.filter(n => objectReady(n.ref));
  return ready.length ? random(ready) : null;
}

function spawnEnergy(node) {
  const start = machineEnergyPoint();
  const end = nodePoint(node);
  const followerCount = 6 + floor(random(4)) + floor(overdrive * 4);
  energyClusters.push({
    node,
    sx: start.x, sy: start.y,
    ex: end.x, ey: end.y,
    x: start.x, y: start.y,
    t: 0,
    speed: random(.018, .026) * (1 + overdrive * .12),
    phase: random(TWO_PI),
    arcSign: random() < .5 ? -1 : 1,
    followers: Array.from({ length: followerCount }, () => ({
      x: start.x,
      y: start.y,
      phase: random(TWO_PI),
      radius: random(8, 25 + overdrive * 10),
      size: random(3, 7 + overdrive * 2)
    }))
  });

  if (energyClusters.length > MAX_ENERGY) energyClusters.shift();
}

function updateEnergy(dt) {
  for (let i = energyClusters.length - 1; i >= 0; i--) {
    const e = energyClusters[i];
    e.t += e.speed * dt * 60;
    const q = ease(constrain(e.t, 0, 1));
    const arc = sin(q * PI) * min(115, dist(e.sx, e.sy, e.ex, e.ey) * .14) * e.arcSign;
    e.x = lerp(e.sx, e.ex, q);
    e.y = lerp(e.sy, e.ey, q) - abs(arc) * .72;

    for (const f of e.followers) {
      f.phase += dt * 2.2;
      const tx = e.x + cos(f.phase) * f.radius;
      const ty = e.y + sin(f.phase) * f.radius * .38;
      f.x = lerp(f.x, tx, .18);
      f.y = lerp(f.y, ty, .18);
    }

    // Nearby poles briefly conduct even though the route remains visually direct.
    for (const p of poles) {
      if (dist(e.x, e.y, p.x, p.y - 128 * p.s) < 110) p.energy = max(p.energy, .72);
    }

    if (e.t >= 1) {
      applyPower(e.node);
      energyClusters.splice(i, 1);
    }
  }
}

function applyPower(node) {
  if (!node || !node.ref) return;
  powerDelivered++;

  if (node.type === 'house') {
    node.ref.charge = min(1.25, node.ref.charge + .78);
    node.ref.powerPulse = 1;
  } else if (node.type === 'factory') {
    node.ref.energy = min(1.35, node.ref.energy + .78);
    node.ref.activity = min(1.75, node.ref.activity + .95 + overdrive * .28);
    node.ref.powerPulse = 1;
    node.ref.startupBurst = max(node.ref.startupBurst, 1.35 + overdrive * .55);
  }
}


function applyCombustionShockwave(intensity = 1) {
  const origin = machineEnergyPoint();
  for (const a of ambientFragments) {
    const dx = a.x - origin.x, dy = a.y - origin.y;
    const d = max(20, sqrt(dx * dx + dy * dy));
    if (d < 620) {
      const f = (1 - d / 620) * intensity;
      a.vx += dx / d * f * .34;
      a.vy += dy / d * f * .18;
    }
  }
  for (const s of smoke) {
    // A burn pulse may disturb the machine exhaust, but it should not kick remote
    // factory plumes sideways. Industrial smoke keeps its chimney-defined airflow.
    if (s.legacyFactorySmoke || s.kind === 'factoryV21') continue;
    const dx = s.x - origin.x, dy = s.y - origin.y;
    const d = max(25, sqrt(dx * dx + dy * dy));
    if (d < 360) {
      const f = (1 - d / 360) * intensity;
      s.vx += dx / d * f * .085;
      s.vy += dy / d * f * .038;
      s.stretch = max(s.stretch || 0, f * .42);
    }
  }
  for (const p of poles) p.energy = max(p.energy, intensity * .08);
}

// ------------------------------------------------------------
// WORLD UPDATE / POLLUTION-DRIVEN DECAY
// ------------------------------------------------------------

function updateWorld(dt) {
  const globalP = pollution / 100;
  updateDemandQueue();

  for (const h of houses) {
    if (h.locked) continue;
    h.unlockPulse = max(0, (h.unlockPulse || 0) - dt * .75);
    h.charge = max(0, h.charge - dt * .040);
    h.powerPulse = max(0, h.powerPulse - dt * 1.3);
    h.demandFlash = max(0, h.demandFlash - dt * .50);
    updateObjectExposure(h, 'house', dt, globalP);
  }

  for (const t of trees) {
    updateObjectExposure(t, 'tree', dt, globalP);
    const localDamage = getObjectDamageLevel(t);
    t.health = constrain(1 - localDamage * .96, .04, 1);
  }

  for (const po of poles) {
    po.energy = max(0, po.energy - dt * .13);
    updateObjectExposure(po, 'pole', dt, globalP);
  }

  for (let fi = 0; fi < factories.length; fi++) {
    const f = factories[fi];
    if (f.locked) continue;
    f.unlockPulse = max(0, (f.unlockPulse || 0) - dt * .75);
    f.energy = max(0, f.energy - dt * .08);
    f.activity = max(0, f.activity - dt * .065);
    f.powerPulse = max(0, f.powerPulse - dt * 1.0);
    f.demandFlash = max(0, f.demandFlash - dt * .50);
    f.startupBurst = max(0, f.startupBurst - dt);
    f.emissionClock += dt;

    updateObjectExposure(f, 'factory', dt, globalP);
    const damage = getObjectDamageLevel(f);
    f.soot = lerp(f.soot, constrain(f.activity * .45 + f.localAir * .72 + damage * .28, 0, 1), .030);


    // Once the fossil system has started, EVERY formed factory becomes an industrial source.
    // Emission timing is cadence-based, not frame-random: this creates a coherent plume.
    const industrialSystemRunning = burnCount > 0;
    if (industrialSystemRunning && objectReady(f)) {
      const activity = constrain(f.activity, 0, 1.55);
      const origins = factorySmokeOrigins(f);
      const liveChimneys = [];
      for (let ci = 0; ci < origins.length; ci++) {
        const partIndex = ci === 0 ? 2 : 3;
        if (!f.detached[partIndex] && formationProgress(f, partIndex) > .82) liveChimneys.push(ci);
      }

      // Idle stacks breathe slowly. Powered / startup / overdrive states shorten the interval,
      // but each stack keeps its own offset so twin chimneys never pulse in lock-step.
      const activeN = constrain(activity / 1.55, 0, 1);
      const baseInterval = lerp(1.18, .36, activeN);
      const startupBoost = 1 + f.startupBurst * 1.28;
      const overdriveBoost = 1 + overdrive * .62;
      const intervalScale = 1 / max(.62, f.smokeBias * startupBoost * overdriveBoost);

      if (!Array.isArray(f.puffTimers)) f.puffTimers = [random(.2, .9), random(.5, 1.2)];
      for (const ci of liveChimneys) {
        if (!Number.isFinite(f.puffTimers[ci])) f.puffTimers[ci] = random(.2, 1.0);
        f.puffTimers[ci] -= dt;
        if (f.puffTimers[ci] <= 0 && smoke.length < MAX_SMOKE - 18) {
          const strength = .92 + activity * .20 + f.startupBurst * .16 + overdrive * .08;
          emitFactorySmoke(f, ci, strength);
          const phaseOffset = ci * .07 + .03 * sin(f.chimneyPhase + ci * 1.7);
          f.puffTimers[ci] = max(.24, baseInterval * intervalScale * random(.82, 1.08) + phaseOffset);
        }
      }

      // Dust uses a slower independent cadence so it does not visually fire with every puff.
      if (!Number.isFinite(f.dustTimer)) f.dustTimer = random(.7, 1.7);
      f.dustTimer -= dt;
      if (liveChimneys.length && f.dustTimer <= 0 && carbonDust.length < MAX_CARBON - 12) {
        const ci = random(liveChimneys);
        emitFactoryDust(f, ci, .78 + activity * .24 + overdrive * .08);
        const dustBase = lerp(2.4, .82, activeN) / (1 + f.startupBurst * .60 + overdrive * .34);
        f.dustTimer = dustBase * random(.78, 1.26);
      }
    }
  }

  // The central coal plant remains the strongest primary combustion source.
  if (burnCount > 0 && random() < dt * (.028 + machineHeat * .20 + overdrive * .12) && smoke.length < MAX_SMOKE - 8) {
    emitMachineSmoke(false);
  }
}

function objectTopY(o, source) {
  if (source === 'tree') return o.y - 126 * o.s;
  if (source === 'house') return o.y - 82 * o.s;
  if (source === 'pole') return o.y - 154 * o.s;
  return o.y - 230 * o.s;
}

function updateObjectExposure(o, source, dt, globalP) {
  const local = constrain(samplePollution(o.x, o.y) * .92 + globalP * .10, 0, 1);
  const ceiling = getCeilingDepthAtX(o.x, 5);
  const topY = objectTopY(o, source);
  const ceilingStress = smooth01(map(ceiling - topY, -180, 100, 0, 1));

  o.localAir = lerp(o.localAir || 0, local, constrain(dt * 1.2, .01, .10));
  o.exposure = constrain((o.exposure || 0) + (local * .034 + ceilingStress * .060) * dt, 0, 1);
  o.soot = constrain((o.soot || 0) + local * .018 * dt - (local < .08 ? .0012 * dt : 0), 0, 1);
  o.stress = lerp(o.stress || 0, ceilingStress, constrain(dt * .85, .01, .08));

  const damage = getObjectDamageLevel(o);
  updateDamageParts(o, damage, source);
}

function getObjectDamageLevel(o) {
  return constrain((o.exposure || 0) * .64 + (o.soot || 0) * .20 + (o.stress || 0) * .52 + (o.localAir || 0) * .22, 0, 1);
}

function updateDamageParts(o, p, source) {
  if (!o.damageThresholds) return;
  for (let i = 0; i < o.damageThresholds.length; i++) {
    if (o.damageTriggered[i]) continue;
    if (p >= o.damageThresholds[i]) {
      o.damageTriggered[i] = true;
      o.detached[i] = true;
      const wp = damagePartWorldPoint(o, source, i);
      emitDebris(wp.x, wp.y, source, o.s * random(.75, 1.20), i);
    }
  }
}

function damagePartWorldPoint(o, source, i) {
  if (source === 'tree') {
    const pts = [[0, -45], [-28, -82], [3, -112], [34, -82], [6, -62]];
    return localToWorld(o, pts[i % pts.length][0], pts[i % pts.length][1]);
  }
  if (source === 'house') {
    const pts = [[0, -15], [0, -53], [-25, -44], [3, -47], [19, -15], [34, -32]];
    return localToWorld(o, pts[i % pts.length][0], pts[i % pts.length][1]);
  }
  if (source === 'pole') {
    const pts = [[0, -74], [0, -146], [-31, -139], [31, -139], [0, -126]];
    return localToWorld(o, pts[i % pts.length][0], pts[i % pts.length][1]);
  }
  const pts = [[0, 36], [-40, -44], [-80, 18], [-40, 18], [2, 18], [78, 28], [58, -160]];
  return localToWorld(o, pts[i % pts.length][0], pts[i % pts.length][1]);
}

function localToWorld(o, lx, ly) {
  const cs = cos(o.rot), sn = sin(o.rot);
  const x = lx * o.s;
  const y = ly * o.s;
  return { x: o.x + x * cs - y * sn, y: o.y + x * sn + y * cs };
}

// ------------------------------------------------------------
// SMOKE / SOOT / ASH / DEBRIS
// ------------------------------------------------------------

function machineExhaustPoint() {
  return { x: MACHINE.x + 84 * MACHINE.scale, y: MACHINE.y - 108 * MACHINE.scale };
}

function factorySmokeOrigins(f) {
  const local = factoryChimneys(f.variant).filter(Boolean);
  if (!local.length) return [{ x: f.x + 60 * f.s, y: f.y - 190 * f.s }];
  return local.map(c => localToWorld(f, c.x, c.y - c.h * .50));
}

function factorySmokeOrigin(f) {
  return factorySmokeOrigins(f)[0];
}

function emitMachineSmoke(burst = false) {
  const o = machineExhaustPoint();
  // Keep the machine as the ignition source, but visually secondary to the wider
  // industrial field. Smaller puffs and a lower burst count make the main factories
  // read as the larger atmospheric contributors.
  emitSmoke(o.x, o.y, burst ? .66 : .46, burst ? 'machineBurst' : 'machine', .22, null);
}

function emitFactorySmoke(f, chimneyIndex = 0, strength = 1) {
  if (smoke.length >= MAX_SMOKE) return;
  const origins = factorySmokeOrigins(f);
  const o = origins[constrain(chimneyIndex, 0, origins.length - 1)] || origins[0];
  const src = `factory-${f.id}-${chimneyIndex}`;
  const k = constrain(strength, .72, 1.30);

  // Keep the V20 / V21 chunky polygon language, but make the motion plume-based.
  // Small factories now produce proportionally smaller smoke instead of the same giant puff.
  const factoryScale = map(constrain(f.s, .20, .56), .20, .56, .60, 1.00);
  const baseSize = random(12, 20) * factoryScale;
  const maxSize = random(72, 134) * factoryScale * (1 + constrain(f.activity, 0, 1.55) * .09);
  const spawnJitter = lerp(2.5, 5.5, factoryScale);
  const plumeSeed = (f.plumeSeed || f.seed) + chimneyIndex * 71.37;

  smoke.push({
    kind: 'factoryV21',
    source: src,
    factoryId: f.id,
    chimneyIndex,
    originX: o.x,
    originY: o.y,
    x: o.x + random(-spawnJitter, spawnJitter),
    y: o.y + random(-2.2, 1.8),
    // Near the mouth, all puffs rise nearly vertically. Horizontal drift develops later.
    vx: random(-.055, .055),
    vy: random(-1.22, -1.00) * lerp(.96, 1.08, k - .72),
    baseSize,
    size: baseSize,
    maxSize,
    age: 0,
    life: random(11.2, 16.2),
    seed: random(1000),
    plumeSeed,
    plumeBias: (f.plumeBias || 0) + random(-.025, .025),
    baseRot: random(-.18, .18),
    rot: 0,
    depth: 0,
    accent: random() < .055 ? 'orange' : random() < .14 ? 'violet' : 'grey',
    stained: false,
    legacyFactorySmoke: true
  });
}

function emitFactoryDust(f, chimneyIndex = 0, strength = 1) {
  const origins = factorySmokeOrigins(f);
  const o = origins[constrain(chimneyIndex, 0, origins.length - 1)] || origins[0];
  const count = 2 + floor(random(3));
  for (let i = 0; i < count; i++) {
    emitCarbon({
      x: o.x + random(-12, 12),
      y: o.y + random(-5, 18)
    }, strength * random(.72, 1.08));
  }
}

function emitSmoke(x, y, strength = 1, source = 'machine', sizeScale = 1, forcedDepth = null) {
  if (smoke.length >= MAX_SMOKE) return;
  const p = pollution / 100;
  smoke.push({
    originX: x,
    originY: y,
    x: x + random(-5, 5),
    y: y + random(-3, 3),
    vx: random(-.12, .12) * strength,
    vy: random(-1.22, -.78) * strength,
    size: random(9, 15) * strength * sizeScale,
    maxSize: random(48, 106) * strength * (1 + p * .18) * sizeScale,
    grow: random(.11, .22) * lerp(.68, .96, sizeScale),
    age: 0,
    life: String(source).startsWith('machine') ? random(7.0, 10.8) : random(10.0, 16.0),
    seed: random(1000),
    rot: random(TWO_PI),
    rv: random(-.006, .006),
    family: floor(random(6)),
    depth: forcedDepth === 0 || forcedDepth === 1 ? forcedDepth : (random() < .72 ? 0 : 1),
    source,
    accent: random() < .03 ? 'orange' : random() < .09 ? 'violet' : 'grey',
    stained: false,
    stretch: 0,
    disturbance: 0
  });
}

function updateSmoke(dt) {
  const p = pollution / 100;
  const mouseVX = mouseX - pmouseX;
  const perfFrame = (typeof frameCount === 'number' && Number.isFinite(frameCount)) ? frameCount : floor(sceneTime * 60);

  const pointerWind = constrain(mouseVX * .0018, -.14, .14);
  smokeWindMouse = lerp(smokeWindMouse, pointerWind, constrain(dt * 3.0, .015, .16));
  smokeWindMouse *= pow(.988, dt * 60);
  const ambientWind = (noise(sceneSeed * .00017 + 17.3, sceneTime * .024) - .5) * .20
    + sin(sceneTime * .04 + sceneSeed * .0003) * .03;
  smokeWindTarget = ambientWind + smokeWindMouse;
  smokeWind = lerp(smokeWind, smokeWindTarget, constrain(1 - Math.exp(-dt * 1.05), .006, .10));

  for (let i = smoke.length - 1; i >= 0; i--) {
    const s = smoke[i];
    s.age += dt;

    if (s.legacyFactorySmoke || s.kind === 'factoryV21') {
      const lifeN = constrain(s.age / s.life, 0, 1);
      const rise = max(0, (s.originY || s.y) - s.y);
      const windMix = smooth01(map(rise, 18, 150, 0, 1));
      const highMix = smooth01(map(rise, 110, 320, 0, 1));

      // Noise fields are expensive. Recalculate every other frame per puff and reuse
      // the previous result in-between; position still updates every frame, so motion stays smooth.
      if (!Number.isFinite(s.cachedShared) || ((perfFrame + i) & 1) === 0) {
        s.cachedShared = (noise(s.plumeSeed * .0017, sceneTime * .062 + rise * .0012) - .5) * 2;
        s.cachedMicro = (noise(s.seed * .0019 + 8.2, sceneTime * .10) - .5) * 2;
      }
      const sharedField = s.cachedShared || 0;
      const microField = s.cachedMicro || 0;
      const targetVX = smokeWind * (.10 + windMix * .86)
        + (s.plumeBias || 0) * windMix
        + sharedField * (.018 + highMix * .060)
        + microField * .010;
      const targetVY = lerp(-1.08, -.34, smooth01(map(lifeN, .08, .86, 0, 1)));

      s.vx = lerp(s.vx, targetVX, constrain(dt * lerp(.92, 1.35, windMix), .004, .08));
      s.vy = lerp(s.vy, targetVY, constrain(dt * 1.22, .006, .09));
      s.x += s.vx * dt * 60;
      s.y += (s.vy + microField * .012 * highMix) * dt * 60;

      const growthT = (1 - Math.exp(-lifeN * 2.8)) / .93919;
      s.size = lerp(s.baseSize || s.size, s.maxSize, constrain(growthT, 0, 1));
      s.rot = (s.baseRot || 0) + sharedField * .045 + microField * .016;

      // Deposit the same approximate pollution, but only once every three frames.
      if ((perfFrame + i) % 3 === 0) {
        depositPollution(s.x, s.y, dt * 3 * (.00092 + s.size * .0000088) * 1.04);
      }
      if (!s.stained && s.y < 324 && p > .14 && random() < dt * (.014 + p * .070)) {
        s.stained = true;
        addStain(s);
      }
      if (s.age > s.life || s.y < -360 || s.x < -430 || s.x > W + 430) smoke.splice(i, 1);
      continue;
    }

    const lifeN = constrain(s.age / s.life, 0, 1);
    const sourceY = Number.isFinite(s.originY) ? s.originY : s.y;
    const rise = max(0, sourceY - s.y);
    const windMix = smooth01(map(rise, 18, 120, 0, 1));
    if (!Number.isFinite(s.cachedShared) || ((perfFrame + i) & 1) === 0) {
      s.cachedShared = (noise(s.seed * .0012 + 19, sceneTime * .070) - .5) * 2;
    }
    const sharedField = s.cachedShared || 0;
    const targetVX = smokeWind * (.08 + windMix * .55) + sharedField * (.010 + windMix * .028);
    const targetVY = lerp(-.98, -.30, smooth01(map(lifeN, .10, .84, 0, 1)));

    s.vx = lerp(s.vx, targetVX, constrain(dt * 1.10, .005, .08));
    s.vy = lerp(s.vy, targetVY, constrain(dt * 1.18, .005, .08));
    s.x += s.vx * dt * 60;
    s.y += s.vy * dt * 60;
    s.rot += s.rv * dt * 60 + sharedField * .004;
    s.size = min(s.maxSize, s.size + s.grow * dt * 60);

    if ((perfFrame + i) % 3 === 0) {
      depositPollution(s.x, s.y, dt * 3 * (.00086 + s.size * .0000078));
    }
    if (!s.stained && s.y < 324 && p > .18 && random() < dt * (.010 + p * .055)) {
      s.stained = true;
      addStain(s);
    }
    if (s.age > s.life || s.y < -340 || s.x < -380 || s.x > W + 380) smoke.splice(i, 1);
  }
}

function addStain(s) {
  stains.push({
    x: s.x + random(-22, 22),
    y: constrain(s.y + random(-10, 12), 20, 420),
    w: s.size * random(1.2, 2.5),
    h: s.size * random(.24, .64),
    a: random(2.0, 4.8),
    accent: s.accent,
    phase: random(TWO_PI)
  });
  if (stains.length > MAX_STAINS) stains.shift();
}

function emitCarbon(origin, strength = 1) {
  if (carbonDust.length >= MAX_CARBON) return;
  carbonDust.push({
    x: origin.x + random(-12, 12),
    y: origin.y + random(-4, 8),
    vx: random(-.32, .32),
    vy: random(.20, .85),
    g: random(.010, .024),
    size: random(1.7, 6.2) * strength,
    rot: random(TWO_PI),
    rv: random(-.05, .05),
    age: 0,
    life: random(8, 15),
    depth: random() < .76 ? 0 : 1,
    shape: floor(random(5)),
    settled: false,
    deposited: false,
    ground: random(H * .74, H - 24)
  });
}

function updateCarbon(dt) {
  const perfFrame = (typeof frameCount === 'number' && Number.isFinite(frameCount)) ? frameCount : floor(sceneTime * 60);
  for (let i = carbonDust.length - 1; i >= 0; i--) {
    const c = carbonDust[i];
    c.age += dt;
    if (!c.settled) {
      if (((perfFrame + i) & 1) === 0) c.windNoise = (noise(c.x * .003, c.y * .003, sceneTime * .06 + i * .01) - .5) * .018;
      c.vx += (c.windNoise || 0) * dt * 60;
      c.vy += c.g * dt * 60;
      c.x += c.vx * dt * 60;
      c.y += c.vy * dt * 60;
      c.rot += c.rv * dt * 60;
      c.vx *= .994;
      if (c.y >= c.ground) {
        c.y = c.ground;
        c.vy *= -.07;
        c.vx *= .42;
        if (abs(c.vy) < .07) {
          c.vy = 0;
          c.vx = 0;
          c.settled = true;
          c.settledAt = sceneTime;
        }
      }
    }
    if (c.settled && !c.deposited) {
      c.deposited = true;
      depositPollution(c.x, c.y, .022 + c.size * .0010);
    }
    // Local pollution preserves the consequence; the live particle no longer needs to
    // remain in the active simulation forever after it has settled.
    if ((c.settled && sceneTime - (c.settledAt || sceneTime) > 1.4) || (c.age > c.life && !c.settled)) {
      carbonDust.splice(i, 1);
    }
  }
}

function emitAsh() {
  if (ash.length >= MAX_ASH) return;
  const o = machineExhaustPoint();
  ash.push({
    x: o.x + random(-8, 8),
    y: o.y,
    vx: random(-.18, .18),
    vy: random(.40, .90),
    g: random(.012, .025),
    size: random(3, 8),
    rot: random(TWO_PI),
    rv: random(-.04, .04),
    ground: random(H * .80, H - 18),
    settled: false,
    deposited: false
  });
}

function updateAsh(dt) {
  for (let i = ash.length - 1; i >= 0; i--) {
    const a = ash[i];
    if (a.settled) {
      if (!a.deposited) {
        a.deposited = true;
        depositPollution(a.x, a.y, .008 + a.size * .0006);
      }
      if (sceneTime - (a.settledAt || sceneTime) > 1.8) ash.splice(i, 1);
      continue;
    }
    a.vy += a.g * dt * 60;
    a.x += a.vx * dt * 60;
    a.y += a.vy * dt * 60;
    a.rot += a.rv * dt * 60;
    if (a.y >= a.ground) {
      a.y = a.ground;
      a.vy *= -.07;
      a.vx *= .42;
      if (abs(a.vy) < .07) {
        a.vy = 0;
        a.vx = 0;
        a.settled = true;
        a.settledAt = sceneTime;
      }
    }
  }
}

function emitDebris(x, y, source, scaleFactor, partIndex) {
  const count = source === 'tree' ? 2 : 1;
  for (let k = 0; k < count; k++) {
    debris.push({
      x: x + random(-7, 7),
      y: y + random(-4, 4),
      vx: random(-.68, .68),
      vy: random(-.95, -.18),
      g: random(.020, .043),
      size: random(8, 16) * scaleFactor,
      rot: random(TWO_PI),
      rv: random(-.07, .07),
      age: 0,
      life: random(8, 18),
      source,
      partIndex,
      identitySeed: random(1000),
      settled: false,
      ground: random(H * .77, H - 18)
    });
  }
  while (debris.length > MAX_DEBRIS) debris.shift();
}

function updateDebris(dt) {
  for (let i = debris.length - 1; i >= 0; i--) {
    const d = debris[i];
    d.age += dt;
    if (!d.settled) {
      d.vy += d.g * dt * 60;
      d.x += d.vx * dt * 60;
      d.y += d.vy * dt * 60;
      d.rot += d.rv * dt * 60;
      d.vx *= .994;
      if (d.y >= d.ground) {
        d.y = d.ground;
        d.vy *= -.08;
        d.vx *= .45;
        if (abs(d.vy) < .08) {
          d.vy = 0;
          d.vx = 0;
          d.settled = true;
          d.settledAt = sceneTime;
        }
      }
    }
    if ((d.settled && sceneTime - (d.settledAt || sceneTime) > 9.0) || (d.age > d.life && !d.settled)) {
      debris.splice(i, 1);
    }
  }
}

function updateGlobal(dt) {
  burnPulse = max(0, burnPulse - dt * 1.55);
  feedPulse = max(0, feedPulse - dt * 2.05);
  machineHeat = max(0, machineHeat - dt * .026);
  overdrivePulse = max(0, overdrivePulse - dt * .34);

  burnTimes = burnTimes.filter(t => sceneTime - t <= 4.5);
  const targetOverdrive = constrain((burnTimes.length - 2) / 3, 0, 1);
  overdrive = lerp(overdrive, targetOverdrive, constrain(dt * 2.6, .02, .18));

  // Residue sustains dirty air but does not create pollution forever.
  let fieldAvg = 0;
  for (const v of pollutionField) fieldAvg += v;
  fieldAvg = pollutionField.length ? fieldAvg / pollutionField.length : 0;
  const persistenceFloor = fieldAvg * 82;
  const recovery = burnTimes.length ? .004 : .018;
  pollution = constrain(max(persistenceFloor, pollution - dt * recovery), 0, 100);

  const p = pollution / 100;
  const target = p < .08 ? 0 : map(p, .08, 1, 6, 540);
  smokeCeiling = lerp(smokeCeiling, target, .018);

  if (sceneTime > statusUntil) {
    if (pollution > 88) setStatus('THE ATMOSPHERE HAS BECOME THE DOMINANT STRUCTURE', 1.6);
    else if (pollution > 64) setStatus('LOCAL SMOG IS NOW STRIPPING FORM FROM THE ENVIRONMENT', 1.6);
    else if (pollution > 38) setStatus('SEPARATE EMISSION STREAMS ARE MERGING INTO ONE AIR MASS', 1.6);
    else if (demandQueue.length) setStatus('DEMAND IS WAITING · THE NEXT COAL BURN IS YOUR CHOICE', 1.6);
    else if (burnCount > 0) setStatus('POWER FADES QUICKLY · EMISSIONS PERSIST MUCH LONGER', 1.6);
  }
}

// ------------------------------------------------------------
// BACKGROUND / ATMOSPHERE
// ------------------------------------------------------------

function drawBackdrop() {
  const p = pollution / 100;
  const dirty = color(66, 67, 73);
  background(lerpColor(color(C.paper), dirty, pow(p, .90)));
}

function drawGraphicField() {
  const p = pollution / 100;
  noStroke();

  const fade = 1 - p * .70;
  const drift = p * 24;
  fill(46, 51, 245, 12 * fade);
  polygon([[0, 0], [500 - drift, 0], [370 + drift * .35, 150 + drift * .4], [0, 245]]);

  fill(108, 88, 232, 9 * (fade + p * .20));
  polygon([[W * .74 - drift, H], [W, H], [W, H * .70 + drift], [W * .83 + drift * .22, H * .78]]);

  fill(180, 242, 42, 8 * fade);
  polygon([[W * .44, H * .56 + drift * .3], [W * .62, H * .50], [W * .69 + drift * .2, H * .62 + drift], [W * .49 - drift * .2, H * .68]]);

  fill(255, 122, 26, 8 + p * 8);
  polygon([[W * .82, 0], [W, 0], [W, H * .16 + drift], [W * .88 - drift * .12, H * .10]]);

  // The graphic system itself loses alignment as local air becomes dirty.
  for (let y = 94; y < H; y += 150) {
    for (let x = 58 + (((y / 150) | 0) % 2) * 72; x < W; x += 144) {
      const local = samplePollution(x, y);
      if (noise(x * .01, y * .01, sceneSeed * .0001) < local * .62) continue;
      const jx = (noise(x * .014 + 3, sceneTime * .018) - .5) * local * 28;
      const jy = (noise(y * .014 + 7, sceneTime * .016) - .5) * local * 22;
      fill(255, 255, 255, 12 * (1 - p * .82) * (1 - local * .65));
      rect(x + jx, y + jy, 9 + local * 4, 2);
      rect(x + jx, y + jy, 2, 9 - local * 3);
    }
  }
}

function drawSmokeCeiling() {
  const p = pollution / 100;
  if (smokeCeiling < 2 || p < .08) return;

  noStroke();
  for (let layer = 0; layer < 6; layer++) {
    const alpha = 4 + p * (8 + layer * 1.8);
    fill(64 - layer * 2.0, 65 - layer * 1.8, 71 - layer * 1.6, alpha);
    beginShape();
    vertex(-160, -90);
    vertex(W + 160, -90);
    for (let x = W + 160; x >= -160; x -= 68) {
      vertex(x, getCeilingDepthAtX(x, layer));
    }
    endShape(CLOSE);
  }

  if (p > .48) {
    for (let i = 0; i < FIELD_COLS; i += 3) {
      const x = (i + .5) / FIELD_COLS * W;
      const local = getColumnPollution(x);
      if (local < .24) continue;
      const y = getCeilingDepthAtX(x, 5) * .58;
      const w = 120 + local * 220;
      const h = 34 + local * 92;
      fill(46, 47, 53, (local * 10 + p * 4));
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
  const p = pollution / 100;
  if (p < .28) return;

  push();
  noStroke();
  const bands = 2 + floor(p * 3);
  for (let i = 0; i < bands; i++) {
    const y = 130 + i * (H - 220) / max(1, bands - 1) + sin(sceneTime * .07 + i) * 9;
    fill(74, 76, 82, 1.5 + p * 4.6);
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
    let owner = null;
    for (const h of houses) {
      if (abs(h.x - g.x) < 2) { owner = h; break; }
    }
    if (!owner) {
      for (const f of factories) {
        if (abs(f.x - g.x) < 2) { owner = f; break; }
      }
    }
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
  push();
  translate(a.x * inv, a.y * inv);
  rotate(a.r * inv);
  scale(lerp(a.sc, 1, q));
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

  push();
  translate(h.x, h.y);
  rotate(h.rot + sin(sceneTime * .11 + h.seed) * .0018 * damage + (hovered ? sin(sceneTime * 3 + h.seed) * .0018 : 0));
  scale(h.s);
  noStroke();

  fill(20, 20, 20, 16 + soot * 28);
  ellipse(0, 8, 108, 12);

  withFormPart(h, 0, () => {
    push(); translate(5, 5); fill(lerpColor(color(C.grey), color(54, 55, 61), soot)); houseBody(h.variant); pop();
    fill(lerpColor(color(C.paper), color(102, 103, 109), soot * .88));
    houseBody(h.variant);
  });

  // Roof becomes the demand gesture itself instead of an external hover rectangle.
  withFormPart(h, 1, () => {
    push();
    translate(0, -demand * 4.5);
    rotate((hovered ? sin(sceneTime * 4.4 + h.seed) : 0) * .008 * hoverProgress);
    const roof = charge > .03 ? lerpColor(color(C.blue), color(C.orange), min(1, damage * .38 + charge * .12)) : lerpColor(color(C.ink), color(C.orange), demand * .42);
    fill(roof);
    polygon([[-55, -42], [-18, -76], [57, -51], [55, -36], [-18, -60]]);
    pop();
  });

  const winA = smooth01(map(charge, .06, .42, 0, 1));
  const winB = smooth01(map(charge, .24, .78, 0, 1));
  withFormPart(h, 2, () => { fill(lerpColor(color(C.ink), color(C.orange), max(winA, demand * .34))); rect(-26, -44, 16, 18); });
  withFormPart(h, 3, () => { fill(lerpColor(color(C.ink), color(C.blue), max(winB, demand * .18))); rect(2, -47, 18, 18); });
  withFormPart(h, 4, () => { fill(lerpColor(color(C.ink), color(70, 70, 75), soot * .4)); rect(18, -16, 23, 38); });
  withFormPart(h, 5, () => { fill(damage > .58 ? C.orange : C.ink); rect(32, -50 - demand * 2, 8, 17 + demand * 4); });

  if (demand > .08) {
    for (let i = 0; i < 3; i++) {
      const a = sceneTime * (.7 + i * .12) + h.seed + i * TWO_PI / 3;
      fill(255, 122, 26, 70 + demand * 90);
      diamond(cos(a) * (46 + i * 5), -39 + sin(a) * 18, 4 + demand * 3);
    }
  }

  if (charge > .03 && !h.detached[0]) {
    const pulse = .82 + .18 * sin(sceneTime * 3.5 + h.seed);
    fill(46, 51, 245, 22 + charge * 32 * pulse);
    rect(-10, -43, 67, 31);
  }

  if (h.powerPulse > .02) {
    noFill(); stroke(46, 51, 245, 82 * h.powerPulse); strokeWeight(2);
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

  push();
  translate(t.x, t.y);
  rotate(t.rot + sway + sin(sceneTime * 1.9 + t.seed) * damage * .004);
  scale(t.s);
  noStroke();

  // Ground shadow gives the tree weight without making it realistic.
  fill(15, 16, 18, 10 + local * 24);
  ellipse(2, 2, 76, 11);

  // 0 — tapered trunk + forked branches. The branches sit behind the canopy plates.
  withFormPart(t, 0, q => {
    const trunkTone = lerpColor(color(C.ink), color(72, 73, 77), min(1, local * .72 + damage * .42));
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
      translate(
        c.x + micro * (1.4 + damage * 4.5),
        c.y + damage * c.drop
      );
      rotate(c.r + micro * .012 * health + damage * c.breakDir);

      // Each crown is a hard-edged plate rather than a circular blob.
      const healthy = color(C.lime);
      const dirty = color(101, 105, 88);
      const crownColor = lerpColor(dirty, healthy, health * .94);
      fill(crownColor);
      drawTreePlate(c.w * q, c.h * q, c.cut, t.seed + i * 53, damage);

      // Thin dark notch gives the canopy a designed / cut-paper quality.
      if (q > .68 && health > .12) {
        fill(lerpColor(color(C.ink), color(72, 74, 70), damage * .55));
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

  push();
  translate(po.x, po.y);
  rotate(po.rot + sin(sceneTime * .18 + po.seed) * .003 * damage);
  scale(po.s);
  noStroke();

  // 0 — slightly tapered mast, more architectural than a plain rectangle.
  withFormPart(po, 0, q => {
    fill(lerpColor(color(C.ink), color(70, 71, 76), soot * .60));
    beginShape();
    vertex(-6, 0);
    vertex(-4.2, -151 * q);
    vertex(4.5, -151 * q);
    vertex(6.5, 0);
    endShape(CLOSE);
    fill(lerpColor(color(C.grey), color(C.ink), .55));
    rect(0, -54 * q, 14, 5);
  });

  // 1 — asymmetric industrial cross arm with a small support brace.
  withFormPart(po, 1, q => {
    fill(C.ink);
    polygon([[-52*q,-145],[-46*q,-151],[40*q,-151],[54*q,-144],[40*q,-138],[-47*q,-139]]);
    stroke(C.ink); strokeWeight(4);
    line(-3, -143, -31 * q, -123);
    line(3, -143, 30 * q, -124);
    noStroke();
  });

  // 2,3 — porcelain-like insulator modules. Electricity is blue, thermal stress orange.
  withFormPart(po, 2, q => drawPoleInsulator(-31, -139, q, lit, pulse));
  withFormPart(po, 3, q => drawPoleInsulator(31, -139, q, lit, pulse));

  // 4 — center node / transformer detail. Long grid wires are drawn globally behind all poles.
  withFormPart(po, 4, q => {
    const flicker = damage > .78 && floor(sceneTime * 9 + po.seed) % 6 === 0;
    if (!flicker) {
      fill(lit ? C.blue : C.grey);
      diamond(0, -151, 10 + pulse * 4 * q);
      fill(lit ? C.orange : C.ink);
      rect(0, -128, 10, 22 * q);
      fill(C.ink);
      rect(0, -115, 18 * q, 5);
    }
  });

  // Local energized ticks make the pole react without looking like a UI highlight.
  if (lit) {
    for (let i = 0; i < 3; i++) {
      const a = sceneTime * (2.0 + i * .18) + po.seed + i * 1.8;
      fill(i === 1 ? C.orange : C.blue);
      rect(cos(a) * (18 + i * 7), -150 + sin(a) * 8, 6 + pulse * 3, 2);
    }
  }
  pop();
}

function drawPoleInsulator(x, y, q, lit, pulse) {
  push();
  translate(x, y);
  fill(lit ? C.blue : C.grey);
  rect(0, 8 * (1 - q), 7, 18 * q);
  fill(C.ink);
  rect(0, -2, 15, 3);
  rect(0, 4, 12, 3);
  fill(lit ? lerpColor(color(C.blue), color(C.orange), pulse * .30) : C.ink);
  circle(0, -10, 7 + pulse * 2);
  pop();
}

function poleInsulatorWorldPoint(po, side = 1) {
  return localToWorld(po, side < 0 ? -31 : 31, -149);
}

function drawPowerGridCables() {
  if (poles.length < 2) return;
  push();
  noFill();
  strokeWeight(2);
  for (let i = 0; i < poles.length - 1; i++) {
    const a = poles[i];
    const b = poles[i + 1];
    if (!objectReady(a) || !objectReady(b) || a.detached[1] || b.detached[1]) continue;
    const p1 = poleInsulatorWorldPoint(a, 1);
    const p2 = poleInsulatorWorldPoint(b, -1);
    const energy = max(a.energy, b.energy);
    const damage = max(getObjectDamageLevel(a), getObjectDamageLevel(b));
    const sag = 22 + abs(p2.x - p1.x) * .022 + damage * 30;
    const midX = (p1.x + p2.x) * .5;
    const flicker = damage > .78 && floor(sceneTime * 10 + a.seed + b.seed) % 7 === 0;
    if (flicker) continue;

    stroke(energy > .08 ? lerpColor(color(C.ink), color(C.blue), .34 + energy * .34) : color(C.ink));
    bezier(p1.x, p1.y, lerp(p1.x, midX, .72), p1.y + sag, lerp(midX, p2.x, .28), p2.y + sag, p2.x, p2.y);

    // A faint second conductor keeps the power infrastructure readable at wide scale.
    stroke(8, 9, 13, 95);
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

  push();
  translate(f.x, f.y);
  const shake = hot ? sin(sceneTime * 8 + f.seed) * (.16 + f.activity * .25 + overdrive * .12) : 0;
  translate(shake, 0);
  rotate(f.rot + (hovered ? sin(sceneTime * 3.2 + f.seed) * .002 * hoverProgress : 0));
  scale(f.s);
  noStroke();

  fill(20, 20, 20, 17 + f.soot * 26);
  ellipse(0, 82, 270, 18);

  // CHIMNEYS FIRST: lower sections disappear behind the roof/body, so the stacks
  // read as being physically behind the factory instead of pasted on its front face.
  const chimneys = factoryChimneys(f.variant);
  withFormPart(f, 2, q => drawFactoryChimney(chimneys[0], min(1, q + demand * .08), hot || demand > .6, f.soot));
  withFormPart(f, 3, q => { if (chimneys[1]) drawFactoryChimney(chimneys[1], min(1, q + demand * .12), hot || demand > .6, f.soot); });

  // Main architecture overlays the bottom of the stacks.
  withFormPart(f, 0, () => {
    push(); translate(5, 5); fill(lerpColor(color(C.grey), color(48, 49, 55), f.soot)); factoryBaseBody(f.variant); pop();
    fill(lerpColor(color(C.paper), color(98, 99, 106), f.soot * .88));
    factoryBaseBody(f.variant);
  });

  withFormPart(f, 1, () => {
    push(); translate(0, -demand * 3);
    fill(lerpColor(color(C.paper), color(100, 101, 107), f.soot * .82));
    polygon([[-136,-34],[-108,-58],[-108,-96],[-72,-72],[-34,-106],[0,-78],[28,-104],[68,-66],[136,-40],[136,4],[-136,4]]);
    pop();
  });

  // Front modules sit on top of the architectural shell.
  withFormPart(f, 4, () => { fill(hot ? C.orange : live ? C.blue : lerpColor(color(C.ink), color(C.orange), demand * .55)); rect(-72, 18, 22, 23); });
  withFormPart(f, 5, () => { fill(hot ? C.orange : live ? C.blue : lerpColor(color(C.ink), color(C.orange), demand * .36)); rect(-34, 18, 22, 23); rect(4, 18, 22, 23); });
  withFormPart(f, 6, () => { fill(hot ? C.orange : live ? C.violet : C.ink); rect(78, 28, 28, 48); });

  if (!f.detached[0]) {
    fill(C.blue);
    rect(0, 80, 240 * (1 - damage * .28), 6);
    if (demand > .04) {
      fill(C.orange);
      rect(-106 + demand * 64, 60, 42 + demand * 64, 5);
    }
  }

  if (demand > .08) {
    for (let i = 0; i < 4; i++) {
      const a = sceneTime * (.55 + i * .09) + f.seed + i * 1.8;
      push();
      translate(-42 + i * 28 + cos(a) * 5, -48 + sin(a * 1.2) * 9);
      rotate(a * .18);
      fill(255, 122, 26, 60 + demand * 85);
      drawShard(i % 4, 4 + demand * 3 + sin(a) * 1.2);
      pop();
    }
  }

  if (f.powerPulse > .02) {
    noFill(); stroke(46, 51, 245, 86 * f.powerPulse); strokeWeight(2);
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
  const stack = lerpColor(color(C.ink), color(54, 55, 60), soot * .45);
  fill(stack);
  // Slight taper gives the stack more depth while remaining hard-edged.
  beginShape();
  vertex(c.x - c.w * .50, c.y + c.h * .50);
  vertex(c.x - c.w * .40, c.y + c.h * .50 - h);
  vertex(c.x + c.w * .40, c.y + c.h * .50 - h);
  vertex(c.x + c.w * .50, c.y + c.h * .50);
  endShape(CLOSE);
  fill(hot ? C.orange : C.grey);
  rect(c.x, c.y + c.h * .50 - h - 2, c.w * .86, 5);
  fill(C.ink);
  rect(c.x, c.y + c.h * .50 - h - 5, c.w * .62, 3);
}

// ------------------------------------------------------------
// FURNACE — V25 VISUAL CORE
// ------------------------------------------------------------

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

  push(); translate(5, 5); fill(lerpColor(color(C.grey), color(50, 51, 56), p * .75)); furnaceBody(); hopperShape(); pop();
  fill(lerpColor(color(C.paper), color(118, 119, 125), p * .72));
  furnaceBody();

  fill(C.ink);
  rect(0, 30, 126, 96);
  fill(burnPulse > .02 ? C.orange : burnCount > 0 ? lerpColor(color(C.grey), color(C.orange), .38) : C.grey);
  rect(0, 30, 82 + burnPulse * 8, 54 + burnPulse * 6);

  fill(lerpColor(color(C.paper), color(118, 119, 125), p * .72));
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
  scale(active ? 1.08 : 1);
  if (active) {
    noFill(); stroke(C.orange); strokeWeight(2); circle(0, 0, c.size * 2.5); noStroke();
  }
  push(); translate(3, 3); fill(C.grey); coalShape(c.type, c.size); pop();
  fill(C.ink); coalShape(c.type, c.size);
  fill(active ? C.blue : C.grey);
  rect(-c.size * .10, -c.size * .07, c.size * .28, max(3, c.size * .075));
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
      const alpha = fadeIn * fadeOut * (56 + pollution * .34) * (frontLayer ? 1.02 : .94);
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

  const greyA = alpha * .92;
  const family = floor(abs(s.plumeSeed || s.seed)) % INDUSTRY_SMOKE_OUTER.length;

  if (s.accent === 'orange') fill(255, 122, 26, alpha * .20);
  else if (s.accent === 'violet') fill(108, 88, 232, alpha * .18);
  else fill(114, 116, 120, greyA * .24);
  polygonFromPoints(INDUSTRY_SMOKE_OUTER[family], s.size);

  if (s.accent === 'orange') fill(255, 122, 26, alpha * .34);
  else if (s.accent === 'violet') fill(108, 88, 232, alpha * .28);
  else fill(146, 147, 150, greyA * .48);
  polygonFromPoints(INDUSTRY_SMOKE_MID[family], s.size);

  // Only the nearer / darker puffs get a third core layer. This preserves the chunky
  // V20/V21 look without tripling path work for every distant puff.
  if (alpha > 22 && s.size < 88) {
    fill(36, 37, 42, alpha * .14);
    polygonFromPoints(INDUSTRY_SMOKE_CORE[family], s.size);
  }
  pop();
}

function drawSmokeTrail(s, alpha) {
  return;
}

function drawSmokeGlyph(s, alpha) {
  push();
  translate(s.x, s.y);
  rotate(s.rot);
  noStroke();

  const outerA = alpha * .24;
  const innerA = alpha * .46;

  if (s.accent === 'orange') fill(255, 122, 26, outerA * .62);
  else if (s.accent === 'violet') fill(108, 88, 232, outerA * .66);
  else fill(88, 90, 96, outerA);
  smokeFamily(s.family, s.size * 1.02);

  if (s.accent === 'orange') fill(255, 122, 26, innerA * .58);
  else if (s.accent === 'violet') fill(108, 88, 232, innerA * .56);
  else fill(132, 133, 138, innerA);
  smokeFamily((s.family + 2) % 6, s.size * .70);

  fill(30, 31, 36, alpha * .14);
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
    fill(34, 35, 40, (frontLayer ? 190 : 135) * fade);
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
// HUD
// ------------------------------------------------------------

function drawHUD() {
  const p = pollution / 100;
  push();
  noStroke();

  textAlign(LEFT, TOP);
  textStyle(NORMAL);
  textSize(10);
  fill(p > .70 ? color(220, 220, 218) : color(C.grey));
  text('SDG 07 / COAL → POWER → AIR', 52, 40);

  textStyle(BOLD);
  textSize(60);
  fill(p > .76 ? color(238, 238, 235) : color(C.ink));
  text('HARM', 50, 60);

  fill(C.blue); rect(105, 142, 100, 4);
  fill(C.orange); rect(184, 142, 40, 4);

  textStyle(NORMAL);
  textSize(9);
  fill(p > .70 ? color(220, 220, 218) : color(C.grey));
  const lockedArchitecture = houses.filter(h => h.locked).length + factories.filter(f => f.locked).length;
  if (lockedArchitecture > 0 && burnCount < ARCHITECTURE_WAVES.length) {
    text('CLICK COAL · BURN TO FORM THE BUILT ENVIRONMENT', 52, 160);
  } else if (demandQueue.length > 0) text(`DEMAND WAITING ${demandQueue.length}`, 52, 160);
  else text('HOVER A HOUSE / FACTORY TO CREATE DEMAND', 52, 160);
  if (overdrive > .16) {
    fill(C.orange);
    text(`OVERDRIVE ${round(overdrive * 100)}%`, 52, 176);
  }

  textAlign(RIGHT, TOP);
  fill(p > .70 ? color(220, 220, 218) : color(C.grey));
  text('AIR LOAD', 1864, 44);
  textStyle(BOLD);
  textSize(18);
  fill(p > .82 ? C.paper : p > .58 ? C.orange : C.ink);
  text(`${round(pollution)}%`, 1864, 61);

  const barW = 152;
  fill(p > .72 ? color(230, 230, 228, 45) : color(8, 9, 13, 25));
  rect(1864 - barW * .5, 95, barW, 4);
  fill(p > .58 ? C.orange : C.blue);
  rect(1864 - barW + (barW * p) * .5, 95, barW * p, 4);

  // No external target rings: hover progress is expressed inside the architecture itself.
  pop();
}

// ------------------------------------------------------------
// INPUT
// ------------------------------------------------------------

function mousePressed() {
  const i = findCoalAt(mouseX, mouseY);
  if (i >= 0) {
    const c = coal[i];
    dragState = {
      index: i,
      sx: mouseX,
      sy: mouseY,
      ox: c.x - mouseX,
      oy: c.y - mouseY,
      moved: false
    };
  }
  return false;
}

function mouseDragged() {
  if (dragState && dist(mouseX, mouseY, dragState.sx, dragState.sy) > 7) dragState.moved = true;
  return false;
}

function mouseReleased() {
  if (!dragState) return false;
  const i = dragState.index;
  const c = coal[i];
  if (!c) {
    dragState = null;
    return false;
  }

  const h = machineHopperPoint();
  const inHopper = dist(c.x, c.y, h.x, h.y) < 84;

  if (inHopper || !dragState.moved) {
    fractureCoal(i, consumeDemandTarget() || chooseTarget());
    dragState = null;
    return false;
  }

  c.lane = constrain(c.x, 75, W - 75);
  c.phaseA = random(TWO_PI);
  c.phaseB = random(TWO_PI);
  c.swayA = random(10, 25);
  c.swayB = random(5, 15);
  c.speed = random(.80, 1.28);
  dragState = null;
  return false;
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    resetScene();
    return false;
  }
  if (key === 's' || key === 'S') {
    saveCanvas(`burn-v32-7-${sceneSeed}-${Date.now()}`, 'png');
    return false;
  }
  return true;
}

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

function setStatus(message, hold = 1.6) {
  if (message === lastStatus && sceneTime < statusUntil) return;
  lastStatus = message;
  statusUntil = sceneTime + hold;
  if (statusEl) statusEl.textContent = message;
}

function groundPatch(x, y, w, r, p, reveal = 1) {
  push();
  drawingContext.globalAlpha = constrain(reveal * 1.08, 0, 1);
  translate(x, y);
  rotate(r);
  noStroke();
  fill(20, 20, 20, 12 + p * 20);
  ellipse(5, 13, w * .82, 16);
  fill(lerpColor(color(234, 234, 230), color(96, 97, 102), p * .85));
  polygon([[-w*.5,-7],[-w*.34,-23],[w*.35,-21],[w*.5,-3],[w*.38,16],[-w*.34,18]]);
  pop();
}

function polygon(points) {
  beginShape();
  for (const p of points) vertex(p[0], p[1]);
  endShape(CLOSE);
}

function polygonFromPoints(points, s) {
  beginShape();
  for (const p of points) vertex(p[0] * s, p[1] * s);
  endShape(CLOSE);
}

function diamond(x, y, s) {
  quad(x, y - s, x + s, y, x, y + s, x - s, y);
}

function quadratic(x0, y0, cx, cy, x1, y1, t) {
  const o = 1 - t;
  return {
    x: o * o * x0 + 2 * o * t * cx + t * t * x1,
    y: o * o * y0 + 2 * o * t * cy + t * t * y1
  };
}

function ease(t) {
  t = constrain(t, 0, 1);
  return t * t * (3 - 2 * t);
}

function easeOutCubic(t) {
  t = constrain(t, 0, 1);
  return 1 - pow(1 - t, 3);
}

function smooth01(t) {
  t = constrain(t, 0, 1);
  return t * t * (3 - 2 * t);
}
