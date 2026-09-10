/*
 * ADAPT environmental illustration set.
 *
 * Every asset uses a horizontal centre / ground-baseline origin (0, 0).
 * Common options: x, y, scale, rotation (radians), state, recovery [0..1],
 * variant [0..2], energy [0..1], alpha [0..1]. An explicit recovery overrides
 * state; otherwise "recovered" is 1 and "polluted" is 0. Turbines also accept
 * angle (rotor radians). Islands accept width / height before uniform scale.
 *
 * Geometry is deterministic. A few displaced structural sections rejoin their
 * original silhouette during recovery; the clean endpoint geometry is retained.
 * Nothing in this file draws particles or changes the scene's interaction.
 */

const ADAPT_COLORS = Object.freeze({
  navy: '#05051C',
  blue: '#163FBF',
  purple: '#5735A5',
  orange: '#E85C18',
  green: '#78A914',
  teal: '#147A78',
  sand: '#C8B99F',
  white: '#E5E8EB',
  // Warm, desaturated damage tones. Recovery still lerps to the original
  // clean palette, so this treatment is confined to the polluted end state.
  pollutedDark: '#8F4A00',
  pollutedMid: '#AE630D'
});

// The polluted state uses one warm five-step family. Keeping this separate
// from the ten shared identity tokens lets assets vary through the reference
// tones without changing the recovered palette contract.
const ADAPT_EARTH = Object.freeze({
  desertSun: '#C87629',
  lightSand: '#D58A3D',
  mutedClay: '#BC7634',
  burntAmber: '#BF6D1B',
  deepOchre: '#AE630D',
  darkCinnamon: '#A15400',
  shadowBrown: '#8F4A00',
  dustShadow: '#7A3F00'
});

function adaptAssetUnit(value, fallback) {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;
}

function adaptAssetSmooth(start, end, value) {
  const t = adaptAssetUnit((value - start) / (end - start), 0);
  return t * t * (3 - 2 * t);
}

function adaptAssetDraw(options, drawAsset) {
  const recovery = adaptAssetUnit(options.recovery, options.state === 'recovered' ? 1 : 0);
  const cfg = {
    ...options,
    recovery,
    broken: 1 - adaptAssetSmooth(0.08, 0.88, recovery),
    alpha: adaptAssetUnit(options.alpha, 1),
    energy: adaptAssetUnit(options.energy, recovery),
    variant: Number.isFinite(options.variant)
      ? ((Math.floor(options.variant) % 3) + 3) % 3
      : 0
  };
  if (cfg.alpha <= 0) return;

  // p5's push/pop stores drawing styles but does not store angleMode.
  const previousAngleMode = angleMode();
  push();
  try {
    angleMode(RADIANS);
    colorMode(RGB);
    rectMode(CORNER);
    noStroke();
    translate(Number.isFinite(options.x) ? options.x : 0, Number.isFinite(options.y) ? options.y : 0);
    rotate(Number.isFinite(options.rotation) ? options.rotation : 0);
    scale(Number.isFinite(options.scale) ? options.scale : 1);
    drawAsset(cfg);
  } finally {
    pop();
    angleMode(previousAngleMode);
  }
}

function adaptAssetFill(polluted, recovered, cfg, opacity = 1, recovery = cfg.recovery) {
  const pollutedTone = polluted === 'pollutedDark'
    ? ADAPT_EARTH.shadowBrown
    : polluted === 'pollutedMid'
      ? (cfg.variant === 2 ? ADAPT_EARTH.deepOchre : ADAPT_EARTH.mutedClay)
      : ADAPT_COLORS[polluted];
  const shade = lerpColor(color(pollutedTone), color(ADAPT_COLORS[recovered]), recovery);
  shade.setAlpha(255 * cfg.alpha * opacity);
  fill(shade);
}

function adaptAssetPolygon(points) {
  beginShape();
  for (const [x, y] of points) vertex(x, y);
  endShape(CLOSE);
}

// Split along one authored plane. The dominant section stays anchored; only
// the smaller section moves. At full recovery draw the original path exactly.
function adaptAssetFracture(points, cfg, { cut = 0, slope = 0, dx = 8, dy = 5 } = {}) {
  if (cfg.broken <= 0) { adaptAssetPolygon(points); return; }
  const distance = ([x, y]) => x + slope * y - cut;
  const clip = (side) => {
    const result = [];
    points.forEach((a, index) => {
      const b = points[(index + 1) % points.length];
      const da = distance(a), db = distance(b);
      if (da * side >= 0) result.push(a);
      if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
        const t = da / (da - db);
        result.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    });
    return result;
  };
  const main = clip(-1), fragment = clip(1);
  if (main.length >= 3) adaptAssetPolygon(main);
  if (fragment.length >= 3) {
    push();
    translate(dx * cfg.broken, dy * cfg.broken);
    adaptAssetPolygon(fragment);
    pop();
  }
}

function adaptAssetRoofPose(cfg) {
  const direction = cfg.variant === 1 ? 1 : -1;
  translate(direction * 7 * cfg.broken, -13 * cfg.broken);
  translate(0, -65);
  rotate(direction * 0.1 * cfg.broken);
  translate(0, 65);
}

// 01. Clean bounds x -80..80, y -12..24. Polluted: split faces and one chip.
// 2 clean faces, at most 2 surface scars,
// and one recovery accent. Width / height also support a shared habitat shelf.
function drawAdaptHabitatIsland(options = {}) {
  adaptAssetDraw(options, (cfg) => {
    const w = Number.isFinite(cfg.width) ? Math.max(1, cfg.width) : 160;
    const h = Number.isFinite(cfg.height) ? Math.max(1, cfg.height) : 36;
    const top = cfg.variant === 1 ? 'purple' : 'blue';
    const side = cfg.variant === 1 ? 'blue' : 'purple';

    adaptAssetFill('pollutedDark', side, cfg);
    const fracture = { cut: w * 0.27, slope: 0.28, dx: Math.min(18, w * 0.07), dy: h * 0.22 };
    adaptAssetFracture([
      [-w * 0.5, 0], [-w * 0.38, h * 0.58], [w * 0.27, h * 2 / 3],
      [w * 0.5, -h * 0.06], [w * 0.35, -h * 0.18], [-w * 0.39, -h * 0.18]
    ], cfg, fracture);
    adaptAssetFill('pollutedMid', top, cfg);
    adaptAssetFracture([
      [-w * 0.5, 0], [-w * 0.39, -h / 3], [w * 0.32, -h / 3],
      [w * 0.5, -h * 0.06], [w * 0.35, h * 0.12], [-w * 0.36, h * 0.12]
    ], cfg, fracture);
    if (cfg.broken > 0) {
      adaptAssetFill('pollutedDark', 'pollutedDark', cfg, cfg.broken);
      const chip = Math.min(w * 0.09, 25);
      adaptAssetPolygon([[-w * 0.22, h * 0.75], [-w * 0.22 + chip, h * 0.64], [-w * 0.22 + chip * 0.6, h * 1.03]]);
    }

    const damage = 1 - adaptAssetSmooth(0, 0.85, cfg.recovery);
    if (damage > 0) {
      adaptAssetFill('pollutedDark', 'pollutedDark', cfg, damage * 0.8);
      adaptAssetPolygon([
        [-w * 0.25, -h * 0.3], [-w * 0.21, -h * 0.12], [-w * 0.11, -h * 0.09],
        [-w * 0.21, -h * 0.03], [-w * 0.28, -h * 0.24]
      ]);
      adaptAssetPolygon([
        [w * 0.21, -h * 0.07], [w * 0.25, -h * 0.25], [w * 0.27, -h * 0.23],
        [w * 0.26, h * 0.03], [w * 0.16, h * 0.1]
      ]);
    }
    const green = adaptAssetSmooth(0.35, 1, cfg.recovery);
    if (green > 0) {
      adaptAssetFill('green', 'green', cfg, green);
      adaptAssetPolygon([
        [-w * 0.36, h * 0.12], [-w * 0.42, 0], [-w * 0.11, -h * 0.025],
        [w * 0.025, h * 0.06], [-w * 0.06, h * 0.12]
      ]);
    }
  });
}

// 02. Clean bounds x -44..44, y -89..0. Polluted roof lifts 13px,
// one wall section shifts 8px, and one foundation chip remains nearby.
function drawAdaptBasicHouse(options = {}) {
  adaptAssetDraw(options, (cfg) => {
    rotate(-0.035 * cfg.broken);
    adaptAssetFill('pollutedMid', 'sand', cfg);
    if (cfg.broken > 0) {
      adaptAssetFracture([[-35, -54], [35, -54], [35, 0], [-35, 0]], cfg,
        { cut: 13, slope: 0.12, dx: 8, dy: 4 });
    } else rect(-35, -54, 70, 54);
    push();
    adaptAssetRoofPose(cfg);
    adaptAssetFill('pollutedDark', 'orange', cfg);
    triangle(-44, -54, 0, -89, 44, -54);
    pop();
    adaptAssetFill('pollutedDark', 'teal', cfg);
    rect(-7, -29, 15, 29);
    adaptAssetFill('pollutedDark', 'blue', cfg);
    rect(17 + 8 * cfg.broken, -42 + 4 * cfg.broken, 12, 12);

    const damage = 1 - adaptAssetSmooth(0, 0.8, cfg.recovery);
    if (damage > 0) {
      adaptAssetFill('pollutedDark', 'pollutedDark', cfg, damage * 0.72);
      adaptAssetPolygon([[-27, -44], [-22, -35], [-25, -26], [-20, -32], [-19, -36], [-25, -44]]);
    }
    if (cfg.broken > 0) {
      adaptAssetFill('pollutedMid', 'pollutedMid', cfg, cfg.broken);
      adaptAssetPolygon([[-43, 3], [-32, 0], [-29, 8], [-39, 10]]);
    }
  });
}

// 03. Same house and bounds, with one rail and three complete panel surfaces.
// Maximum 11 major shapes including fractured wall and foundation chip.
function drawAdaptSolarHouse(options = {}) {
  adaptAssetDraw(options, (cfg) => {
    drawAdaptBasicHouse({ recovery: cfg.recovery, alpha: cfg.alpha, variant: cfg.variant });
    rotate(-0.035 * cfg.broken);
    adaptAssetRoofPose(cfg);
    const active = Math.max(cfg.recovery, cfg.energy * 0.9);
    adaptAssetFill('pollutedDark', 'white', cfg, 1, active);
    rect(-25, -57, 50, 4);
    adaptAssetFill('pollutedMid', 'blue', cfg, 1, active);
    [[-23, -3, -3], [-7, 1, -9], [9, 7, -2]].forEach(([x, dx, dy]) => {
      rect(x + dx * cfg.broken, -67 + dy * cfg.broken, 14, 12);
    });
  });
}

// 04. Bounds x -50..54, y -86..0. Three angled connected panels and four
// large structural shapes keep the array readable at thumbnail size.
function drawAdaptSolarArray(options = {}) {
  adaptAssetDraw(options, (cfg) => {
    adaptAssetFill('pollutedMid', 'sand', cfg);
    adaptAssetPolygon([[-32, 0], [-29, -48], [-21, -48], [-23, 0]]);
    adaptAssetFracture([[22, 0], [23, -54], [30, -54], [32, 0]], cfg,
      { cut: 3, slope: 1, dx: 6, dy: 0 });
    adaptAssetFill('pollutedDark', 'orange', cfg);
    rect(-42, -6, 85, 6);
    adaptAssetPolygon([[-47, -42], [49, -55], [53, -45], [-43, -32]]);

    const active = Math.max(cfg.recovery, cfg.energy * 0.9);
    adaptAssetFill('pollutedDark', 'blue', cfg, 1, active);
    push();
    translate(-8 * cfg.broken, 5 * cfg.broken);
    rotate(-0.08 * cfg.broken);
    adaptAssetPolygon([[-50, -73], [-19, -77], [-13, -37], [-44, -33]]);
    pop();
    push();
    translate(0, -8 * cfg.broken);
    adaptAssetPolygon([[-16, -78], [15, -82], [21, -42], [-10, -38]]);
    pop();
    push();
    translate(9 * cfg.broken, 7 * cfg.broken);
    rotate(0.1 * cfg.broken);
    adaptAssetPolygon([[18, -82], [48, -86], [54, -46], [24, -42]]);
    pop();
  });
}

// 05. Rotor fits radius 49 around (0, -90); bounds never exceed x ±49.2,
// y -139.2..0. Six shapes: base, tower, three blades, polygonal hub.
function drawAdaptWindTurbine(options = {}) {
  adaptAssetDraw(options, (cfg) => {
    adaptAssetFill('pollutedDark', 'sand', cfg);
    adaptAssetPolygon([[-20, 0], [-14, -7], [14, -7], [20, 0]]);
    adaptAssetFill('pollutedMid', 'white', cfg);
    adaptAssetPolygon([[-7, 0], [-4, -92], [4, -92], [8, 0]]);
    push();
    translate(0, -90);
    rotate(Number.isFinite(cfg.angle) ? cfg.angle : 0);
    adaptAssetFill('pollutedMid', 'white', cfg);
    for (let blade = 0; blade < 3; blade++) {
      push();
      rotate(blade * Math.PI * 2 / 3);
      if (blade === 1) {
        // One snapped tip remains close to its matching blade, never a spray.
        adaptAssetFracture([[-4, -3], [-3, -44], [4, -49], [9, -9]], cfg,
          { cut: 28, slope: -1, dx: 6, dy: -8 });
      } else {
        translate((blade === 2 ? 4 : -2) * cfg.broken, -5 * cfg.broken);
        rotate((blade === 2 ? 0.18 : -0.07) * cfg.broken);
        adaptAssetPolygon([[-4, -3], [-3, -44], [4, -49], [9, -9]]);
      }
      pop();
    }
    adaptAssetFill('pollutedDark', 'orange', cfg, 1, Math.max(cfg.recovery, cfg.energy * 0.85));
    adaptAssetPolygon([[-8, -4], [-4, -8], [4, -8], [8, -4], [8, 4], [4, 8], [-4, 8], [-8, 4]]);
    pop();
  });
}

// 06. Clean bounds x -40..40, y -105..0. One trunk and one clean canopy;
// polluted canopy splits into two nearby sections with one dry accent.
function drawAdaptTree(options = {}) {
  adaptAssetDraw(options, (cfg) => {
    adaptAssetFill('pollutedDark', 'orange', cfg);
    adaptAssetPolygon([[-6, 0], [-5, -78], [4, -78], [6, 0]]);
    const growth = 1 - cfg.broken * 0.38;
    const canopy = cfg.variant === 1
      ? [[-38, -8], [-24, -34], [8, -38], [35, -20], [40, 5], [19, 30], [-15, 32], [-36, 14]]
      : [[-40, -7], [-28, -31], [4, -37], [33, -21], [39, 7], [17, 31], [-15, 32], [-37, 14]];
    adaptAssetFill('pollutedMid', 'green', cfg);
    adaptAssetFracture(canopy.map(([x, y]) => [x * growth, -67 + y * growth]), cfg,
      { cut: 5, slope: 0, dx: 11, dy: -7 });
    if (cfg.broken > 0) {
      adaptAssetFill('pollutedDark', 'pollutedDark', cfg, cfg.broken);
      adaptAssetPolygon([[-18, -40], [-8, -45], [-4, -37], [-13, -30]]);
    }
  });
}

// 07. Two separated tree crowns, sharing the tree primitive. Four clean shapes,
// eight polluted shapes; no independent cloud of leaf fragments.
// Bounds x -57.6..61.6, y -77.7..0; intentional space remains between crowns.
function drawAdaptTreeCluster(options = {}) {
  adaptAssetDraw(options, (cfg) => {
    drawAdaptTree({ x: -32, scale: 0.64, recovery: cfg.recovery, alpha: cfg.alpha, variant: cfg.variant });
    drawAdaptTree({ x: 32, scale: 0.74, recovery: cfg.recovery, alpha: cfg.alpha, variant: (cfg.variant + 1) % 3 });
  });
}

// 08. Bounds x -44..46, y -97..0. Eight shapes: body, four distinct legs,
// one head/neck, ear, tail. Wildlife returns only once its habitat is healthy.
function drawAdaptWildlife(options = {}) {
  adaptAssetDraw(options, (cfg) => {
    const visible = adaptAssetSmooth(0.65, 0.9, cfg.recovery);
    if (visible <= 0) return;
    adaptAssetFill('pollutedDark', 'orange', cfg, visible, 0.82);
    rect(-16, -28, 6, 28);
    rect(22, -28, 6, 28);
    adaptAssetFill('orange', 'orange', cfg, visible);
    rect(-27, -29, 7, 29);
    rect(10, -29, 7, 29);
    adaptAssetPolygon([[-28, -45], [19, -49], [28, -39], [24, -22], [-22, -23]]);
    adaptAssetPolygon([[16, -38], [19, -73], [24, -84], [43, -80], [46, -70], [31, -65], [30, -35]]);
    triangle(23, -80, 24, -97, 31, -81);
    triangle(-25, -45, -44, -56, -29, -33);
  });
}

// 09. Bounds x -55..55, y -98..0. One mountain, one side face, one light cap.
function drawAdaptLandmark(options = {}) {
  adaptAssetDraw(options, (cfg) => {
    adaptAssetFill('pollutedMid', 'sand', cfg);
    if (cfg.broken > 0) {
      adaptAssetFracture([[-55, 0], [-9, -98], [55, 0]], cfg,
        { cut: 9, slope: 0.15, dx: 10, dy: 5 });
    } else triangle(-55, 0, -9, -98, 55, 0);
    adaptAssetFill('pollutedDark', 'purple', cfg);
    adaptAssetFracture([[-9, -98], [55, 0], [4, 0]], cfg,
      { cut: 9, slope: 0.15, dx: 10, dy: 5 });
    adaptAssetFill('pollutedMid', 'white', cfg);
    adaptAssetPolygon([[-9, -98], [-23, -68], [-9, -77], [8, -72]]);
  });
}

// 10. Four overlapping major shapes form one collapsed structure, never a
// scattered debris field. Three authored variants; bounds x -49..50, y -78..0.
function drawAdaptPollutionCluster(options = {}) {
  adaptAssetDraw(options, (cfg) => {
    const visible = 1 - adaptAssetSmooth(0.12, 0.9, cfg.recovery);
    if (visible <= 0) return;
    const variants = [
      {
        wall: [[-33, 0], [-33, -60], [-23, -74], [-10, -59], [3, -59], [9, -35], [23, -35], [30, 0]],
        left: [[-49, 0], [-36, -26], [-17, -20], [-11, 0]],
        right: [[8, 0], [17, -21], [33, -28], [48, 0]],
        scrap: [[-11, -8], [-3, -37], [12, -30], [4, -6]]
      },
      {
        wall: [[-31, 0], [-24, -66], [-10, -78], [-4, -58], [15, -65], [24, -52], [29, 0]],
        left: [[-45, 0], [-40, -18], [-21, -29], [-12, 0]],
        right: [[11, 0], [20, -24], [36, -18], [48, 0]],
        scrap: [[-14, -10], [-18, -36], [-3, -40], [1, -11]]
      },
      {
        wall: [[-35, 0], [-30, -47], [-11, -47], [-5, -72], [8, -66], [20, -45], [25, 0]],
        left: [[-48, 0], [-36, -27], [-16, -16], [-10, 0]],
        right: [[8, 0], [24, -29], [41, -19], [50, 0]],
        scrap: [[-12, -10], [-6, -38], [10, -33], [3, -7]]
      }
    ];
    const shape = variants[cfg.variant];
    adaptAssetFill('pollutedMid', 'pollutedMid', cfg, visible);
    adaptAssetPolygon(shape.wall);
    adaptAssetFill('pollutedDark', 'pollutedDark', cfg, visible);
    adaptAssetPolygon(shape.left);
    adaptAssetPolygon(shape.right);
    adaptAssetFill('pollutedMid', 'sand', cfg, visible, 0.32);
    adaptAssetPolygon(shape.scrap);
  });
}

// The public pack has exactly ten asset families; variants share one renderer.
const ADAPT_ASSETS = Object.freeze({
  habitatIsland: drawAdaptHabitatIsland,
  basicHouse: drawAdaptBasicHouse,
  solarHouse: drawAdaptSolarHouse,
  solarArray: drawAdaptSolarArray,
  windTurbine: drawAdaptWindTurbine,
  tree: drawAdaptTree,
  treeCluster: drawAdaptTreeCluster,
  wildlife: drawAdaptWildlife,
  landmark: drawAdaptLandmark,
  pollutionCluster: drawAdaptPollutionCluster
});
