const ARTBOARD_WIDTH = 1920;
const ARTBOARD_HEIGHT = 1080;
const LINE_STEPS = 11;
const NATURAL_OBJECT_COUNT = 22;

const PALETTE = {
  charcoal: [20, 20, 20],   // #141414
  backgroundGrey: [196, 200, 201], // #C4C8C9
  grey: [158, 162, 163],    // #9EA2A3
  white: [255, 255, 255],   // #FFFFFF
  brown: [100, 63, 40],     // #643F28
  blue: [32, 51, 255],      // #2033FF
  purple: [105, 82, 235],   // #6952EB
  orange: [254, 125, 33],   // #FE7D21
  lime: [179, 255, 59]      // #B3FF3B
};

let canvasElement;
let pollutantButton;
let pollutantHover = false;
let pollutantPressed = false;
let compositionSeed = 1;
let lineClicks = 0;
let lineLevel = 0;
let targetLineLevel = 0;
let elapsedTime = 0;
let naturalObjects = [];
let shatteredPieces = [];

function setup() {
  const createdCanvas = createCanvas(ARTBOARD_WIDTH, ARTBOARD_HEIGHT);
  createdCanvas.attribute(
    'aria-label',
    'Natural objects float in from all sides and become damaged by a rising pollution line'
  );
  pixelDensity(1);
  frameRate(60);
  // HEAL integration: use the user-selected shared typeface across the system.
  textFont('Stack Sans Notch');
  strokeJoin(MITER);
  strokeCap(SQUARE);

  canvasElement = createdCanvas.elt;
  canvasElement.style.display = 'block';
  canvasElement.style.maxWidth = 'none';
  canvasElement.style.maxHeight = 'none';
  canvasElement.style.touchAction = 'none';

  document.body.style.margin = '0';
  document.body.style.width = '100vw';
  document.body.style.height = '100vh';
  document.body.style.overflow = 'hidden';
  document.body.style.display = 'grid';
  document.body.style.placeItems = 'center';
  document.body.style.background = 'rgb(20, 20, 20)';

  fitArtboardToWindow();
  regenerateArtwork();
  createPollutantButton();
}

function draw() {
  const dt = min(deltaTime / 1000, 0.05);
  elapsedTime += dt;
  lineLevel = lerp(
    lineLevel,
    targetLineLevel,
    1 - Math.exp(-dt * 5.2)
  );
  if (abs(lineLevel - targetLineLevel) < 0.0005) lineLevel = targetLineLevel;

  const pollutionLineY = lerp(height + 8, -8, lineLevel);
  updateNaturalObjects(dt, pollutionLineY);
  updateShatteredPieces(dt);

  background(...PALETTE.backgroundGrey);
  drawBackgroundPattern();
  drawPollutedBackground(pollutionLineY);
  drawNaturalObjects();
  drawShatteredPieces();
  drawPollutionMotes(pollutionLineY);
  drawPollutionLine(pollutionLineY);
  drawPollutantCore();
}

function drawPollutedBackground(pollutionLineY) {
  // Everything below the rising pollution line becomes brown. Because this
  // is drawn before the objects, it remains part of the background.
  if (targetLineLevel <= 0) return;

  const visibleTop = max(pollutionLineY, 0);
  const pollutedDepth = height - visibleTop;
  if (pollutedDepth <= 0) return;

  noStroke();
  fill(...PALETTE.brown);
  rect(0, visibleTop, width, pollutedDepth);

  // Clip the added texture to the polluted side of the boundary. Wide,
  // angular strata keep the effect in the sketch's cut-paper vocabulary.
  push();
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(0, visibleTop, width, pollutedDepth);
  drawingContext.clip();

  const bandColors = [
    PALETTE.charcoal,
    PALETTE.orange,
    PALETTE.purple,
    PALETTE.grey
  ];
  for (let bandIndex = 0; bandIndex < 5; bandIndex++) {
    const bandY = visibleTop + 42 + bandIndex * max(68, pollutedDepth * 0.19);
    const bandThickness = 16 + bandIndex % 3 * 7;
    const topEdge = [];
    const bottomEdge = [];

    for (let bandX = -160; bandX <= width + 160; bandX += 150) {
      const wave = (noise(
        compositionSeed * 0.00003 + bandIndex * 8.1 + bandX * 0.0015
      ) - 0.5) * 52;
      topEdge.push([bandX, bandY + wave]);
      bottomEdge.unshift([
        bandX,
        bandY + bandThickness + wave + sin(bandX * 0.015 + bandIndex) * 8
      ]);
    }

    fill(...bandColors[bandIndex % bandColors.length], bandIndex === 1 ? 22 : 17);
    polygon([...topEdge, ...bottomEdge]);
  }

  // Low-opacity angular stains make the contaminated field feel active while
  // leaving enough negative space for the falling objects to read clearly.
  for (let stainIndex = 0; stainIndex < 13; stainIndex++) {
    const stainX = noise(compositionSeed * 0.00007 + stainIndex * 3.17) * width;
    const stainY = visibleTop + pollutedDepth * (
      0.08 + noise(compositionSeed * 0.00011 + stainIndex * 5.73) * 0.86
    );
    const stainRadius = 24 + noise(stainIndex * 7.4, compositionSeed * 0.00009) * 62;
    const stainColor = stainIndex % 4 === 0 ? PALETTE.orange : PALETTE.charcoal;
    fill(...stainColor, stainIndex % 4 === 0 ? 15 : 19);
    polygon(makeAngularBlobPoints(
      stainX,
      stainY,
      stainRadius * 1.7,
      stainRadius * 0.58,
      compositionSeed * 0.0002 + stainIndex * 13,
      8
    ));
  }

  drawingContext.restore();
  pop();
}

function drawPollutionMotes(pollutionLineY) {
  if (targetLineLevel <= 0) return;

  const visibleTop = max(pollutionLineY, 0);
  const pollutedDepth = height - visibleTop;
  if (pollutedDepth < 12) return;

  const moteCount = floor(12 + lineLevel * 28);
  const moteColors = [PALETTE.orange, PALETTE.charcoal, PALETTE.grey, PALETTE.purple];

  for (let moteIndex = 0; moteIndex < moteCount; moteIndex++) {
    const travelSpeed = 18 + moteIndex % 6 * 5;
    const cycleDistance = pollutedDepth + 90;
    const cyclePosition = (
      moteIndex * 97 + elapsedTime * travelSpeed
    ) % cycleDistance;
    const moteY = height + 32 - cyclePosition;
    if (moteY < visibleTop + 10 || moteY > height + 35) continue;

    const moteX = (
      compositionSeed % 241 + moteIndex * 173 + elapsedTime * (4 + moteIndex % 3 * 3)
    ) % (width + 100) - 50;
    const moteSize = 3 + moteIndex % 5 * 1.7;
    const moteColor = moteColors[moteIndex % moteColors.length];

    push();
    translate(moteX, moteY);
    rotate(elapsedTime * (0.18 + moteIndex % 4 * 0.07) + moteIndex);

    if (moteIndex % 5 === 0) {
      stroke(...moteColor, 95);
      strokeWeight(2);
      line(-moteSize * 1.7, 0, moteSize * 1.7, 0);
      noStroke();
    } else {
      fill(...moteColor, 105);
      polygon([
        [0, -moteSize],
        [moteSize * 0.8, 0],
        [0, moteSize],
        [-moteSize * 0.62, 0]
      ]);
    }
    pop();
  }
}

function regenerateArtwork() {
  compositionSeed = createSeed();
  randomSeed(compositionSeed);
  noiseSeed(compositionSeed ^ 0x5f3759df);

  lineClicks = 0;
  lineLevel = 0;
  targetLineLevel = 0;
  elapsedTime = 0;
  naturalObjects = [];
  shatteredPieces = [];
  pollutantHover = false;
  pollutantPressed = false;

  for (let objectIndex = 0; objectIndex < NATURAL_OBJECT_COUNT; objectIndex++) {
    const naturalObject = {};
    resetNaturalObject(naturalObject, true, objectIndex);
    naturalObjects.push(naturalObject);
  }

  if (pollutantButton) restoreButtonStyle();
}

function createSeed() {
  const entropy = new Uint32Array(1);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(entropy);
    return entropy[0];
  }
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

function drawBackgroundPattern() {
  noStroke();
  fill(...PALETTE.blue, 18);
  polygon([
    [-120, height * 0.22],
    [width * 0.42, -90],
    [width * 0.72, -40],
    [width * 0.08, height * 0.42]
  ]);
  fill(...PALETTE.purple, 20);
  polygon([
    [width * 0.3, height + 70],
    [width * 1.03, height * 0.5],
    [width * 1.08, height * 0.68],
    [width * 0.58, height + 90]
  ]);

  // A quiet field of offset crosses gives the empty areas rhythm without
  // turning the background back into a literal landscape.
  stroke(...PALETTE.white, 38);
  strokeWeight(1.4);
  const patternGap = 118;
  for (let patternY = 54; patternY < height; patternY += patternGap) {
    const rowShift = floor(patternY / patternGap) % 2 * patternGap * 0.5;
    for (let patternX = 38 + rowShift; patternX < width; patternX += patternGap) {
      const armLength = 7 + noise(patternX * 0.01, patternY * 0.01) * 7;
      line(patternX - armLength, patternY, patternX + armLength, patternY);
      line(patternX, patternY - armLength, patternX, patternY + armLength);
    }
  }

  // Concentric low-poly contours echo the central pollutant and provide depth.
  noFill();
  for (let contourIndex = 0; contourIndex < 6; contourIndex++) {
    const contourColor = contourIndex % 3 === 0
      ? PALETTE.white
      : contourIndex % 3 === 1
        ? PALETTE.blue
        : PALETTE.purple;
    stroke(...contourColor, 28);
    strokeWeight(1.5);
    beginShape();
    const contourVertices = 24;
    const contourRadiusX = 190 + contourIndex * 138;
    const contourRadiusY = 105 + contourIndex * 78;
    for (let vertexIndex = 0; vertexIndex <= contourVertices; vertexIndex++) {
      const angle = vertexIndex * TWO_PI / contourVertices;
      const wobble = 0.88 + noise(
        compositionSeed * 0.0001 + contourIndex * 3.7 + vertexIndex * 0.21
      ) * 0.2;
      vertex(
        width * 0.5 + cos(angle) * contourRadiusX * wobble,
        height * 0.5 + sin(angle) * contourRadiusY * wobble
      );
    }
    endShape();
  }
  noStroke();
}

function createPollutantButton() {
  pollutantButton?.remove?.();
  pollutantButton = createButton('POLLUTANT');
  pollutantButton.attribute(
    'aria-label',
    'Raise the pollution line and damage floating natural objects'
  );
  pollutantButton.style('position', 'fixed');
  pollutantButton.style('left', '50%');
  pollutantButton.style('top', '50%');
  pollutantButton.style('transform', 'translate(-50%, -50%)');
  pollutantButton.style('width', '184px');
  pollutantButton.style('height', '184px');
  pollutantButton.style('z-index', '20');
  pollutantButton.style('border', '0');
  pollutantButton.style('border-radius', '50%');
  pollutantButton.style('background', 'transparent');
  pollutantButton.style('color', 'transparent');
  pollutantButton.style('box-shadow', 'none');
  pollutantButton.style('outline', 'none');
  pollutantButton.style('cursor', 'pointer');
  pollutantButton.style('padding', '0');
  pollutantButton.mouseOver(() => {
    pollutantHover = true;
  });
  pollutantButton.mouseOut(() => {
    pollutantHover = false;
    pollutantPressed = false;
  });
  pollutantButton.mousePressed(raisePollutionLine);
}

function restoreButtonStyle() {
  pollutantPressed = false;
}

function raisePollutionLine() {
  if (lineClicks < LINE_STEPS) lineClicks += 1;
  targetLineLevel = lineClicks / LINE_STEPS;

  pollutantPressed = true;
  setTimeout(restoreButtonStyle, 120);
}

function resetNaturalObject(naturalObject, initialPlacement = false, sequenceIndex = 0) {
  const typeCycle = [
    'tree',
    'mountain',
    'pond',
    'cloud',
    'flower',
    'leaf',
    'fish',
    'tree',
    'mountain'
  ];
  const objectType = typeCycle[floor(random(typeCycle.length))];
  const sizeRanges = {
    tree: [92, 145],
    mountain: [125, 190],
    pond: [120, 178],
    cloud: [105, 165],
    flower: [68, 108],
    leaf: [72, 118],
    fish: [88, 138]
  };
  const selectedRange = sizeRanges[objectType];
  const objectSize = random(selectedRange[0], selectedRange[1]);
  const rotationRanges = {
    tree: [0.12, 0.28],
    mountain: [0.09, 0.22],
    pond: [0.08, 0.18],
    cloud: [0.06, 0.16],
    flower: [0.22, 0.5],
    leaf: [0.48, 1.05],
    fish: [0.16, 0.38]
  };
  const selectedRotationRange = rotationRanges[objectType];
  const rotationDirection = random() < 0.5 ? -1 : 1;
  const spawnSide = initialPlacement ? sequenceIndex % 4 : floor(random(4));
  const edgeGap = objectSize * 0.8 + random(28, 92);
  let spawnX;
  let spawnY;
  let targetX;
  let targetY;

  // Choose a point just beyond one edge and aim generally across the canvas.
  // Alternating the initial sides fills the composition immediately; recycled
  // objects choose a new side at random.
  if (spawnSide === 0) {
    spawnX = -edgeGap;
    spawnY = random(objectSize * 0.35, height - objectSize * 0.35);
    targetX = random(width * 0.68, width * 0.92);
    targetY = random(height * 0.12, height * 0.88);
  } else if (spawnSide === 1) {
    spawnX = width + edgeGap;
    spawnY = random(objectSize * 0.35, height - objectSize * 0.35);
    targetX = random(width * 0.08, width * 0.32);
    targetY = random(height * 0.12, height * 0.88);
  } else if (spawnSide === 2) {
    spawnX = random(objectSize * 0.35, width - objectSize * 0.35);
    spawnY = -edgeGap;
    targetX = random(width * 0.1, width * 0.9);
    targetY = random(height * 0.68, height * 0.92);
  } else {
    spawnX = random(objectSize * 0.35, width - objectSize * 0.35);
    spawnY = height + edgeGap;
    targetX = random(width * 0.1, width * 0.9);
    targetY = random(height * 0.08, height * 0.32);
  }

  const travelAngle = atan2(targetY - spawnY, targetX - spawnX);
  const travelSpeed = random(38, 68);
  const initialTravel = initialPlacement
    ? constrain(
      map(sequenceIndex, 0, NATURAL_OBJECT_COUNT - 1, 0.08, 0.92) + random(-0.12, 0.12),
      0.03,
      0.96
    )
    : 0;

  naturalObject.type = objectType;
  naturalObject.size = objectSize;
  naturalObject.x = lerp(spawnX, targetX, initialTravel);
  naturalObject.y = lerp(spawnY, targetY, initialTravel);
  naturalObject.speed = travelSpeed;
  naturalObject.vx = cos(travelAngle) * travelSpeed;
  naturalObject.vy = sin(travelAngle) * travelSpeed;
  naturalObject.floatStrength = random(10, 24);
  naturalObject.floatFrequency = random(0.24, 0.52);
  naturalObject.rotation = random(-0.12, 0.12);
  naturalObject.rotationSpeed = random(
    selectedRotationRange[0],
    selectedRotationRange[1]
  ) * rotationDirection;
  naturalObject.phase = random(1000);
  naturalObject.variant = random();
  naturalObject.state = 'alive';
  naturalObject.hasCrossed = false;
}

function updateNaturalObjects(dt, pollutionLineY) {
  naturalObjects.forEach(naturalObject => {
    const floatPhase = elapsedTime * naturalObject.floatFrequency + naturalObject.phase;
    naturalObject.x += (
      naturalObject.vx + cos(floatPhase) * naturalObject.floatStrength
    ) * dt;
    naturalObject.y += (
      naturalObject.vy + sin(floatPhase * 1.31 + naturalObject.phase * 0.17) * naturalObject.floatStrength
    ) * dt;
    naturalObject.rotation += naturalObject.rotationSpeed * dt;

    if (
      targetLineLevel > 0 &&
      !naturalObject.hasCrossed &&
      naturalObject.y + naturalObject.size * 0.18 >= pollutionLineY
    ) {
      transformNaturalObject(naturalObject);
    }

    const exitMargin = naturalObject.size * 1.45 + 95;
    if (
      naturalObject.x < -exitMargin ||
      naturalObject.x > width + exitMargin ||
      naturalObject.y < -exitMargin ||
      naturalObject.y > height + exitMargin
    ) {
      resetNaturalObject(naturalObject);
    }
  });
}

function transformNaturalObject(naturalObject) {
  naturalObject.hasCrossed = true;

  if (
    (naturalObject.type === 'mountain' && naturalObject.variant < 0.48) ||
    (naturalObject.type === 'leaf' && naturalObject.variant < 0.32) ||
    (naturalObject.type === 'cloud' && naturalObject.variant < 0.2)
  ) {
    naturalObject.state = 'shattered';
    createShatteredPieces(naturalObject);
    return;
  }

  const damagedStates = {
    tree: 'dead',
    mountain: 'ruined',
    pond: 'polluted',
    cloud: 'smog',
    flower: 'wilted',
    leaf: 'withered',
    fish: 'skeleton'
  };
  naturalObject.state = damagedStates[naturalObject.type];
}

function createShatteredPieces(naturalObject) {
  const pieceColors = {
    tree: [PALETTE.charcoal, PALETTE.grey, PALETTE.orange],
    mountain: [PALETTE.blue, PALETTE.grey, PALETTE.charcoal, PALETTE.orange],
    pond: [PALETTE.blue, PALETTE.charcoal, PALETTE.orange],
    cloud: [PALETTE.white, PALETTE.grey, PALETTE.charcoal],
    flower: [PALETTE.white, PALETTE.orange, PALETTE.charcoal],
    leaf: [PALETTE.lime, PALETTE.orange, PALETTE.charcoal],
    fish: [PALETTE.blue, PALETTE.grey, PALETTE.charcoal]
  };
  const availableColors = pieceColors[naturalObject.type];
  const pieceCount = floor(random(7, 11));

  for (let pieceIndex = 0; pieceIndex < pieceCount; pieceIndex++) {
    shatteredPieces.push({
      x: naturalObject.x + random(-naturalObject.size * 0.34, naturalObject.size * 0.34),
      y: naturalObject.y + random(-naturalObject.size * 0.3, naturalObject.size * 0.3),
      vx: random(-85, 85),
      vy: random(-70, 15) + naturalObject.speed * 0.24,
      gravity: random(85, 145),
      size: random(naturalObject.size * 0.08, naturalObject.size * 0.22),
      rotation: random(TWO_PI),
      rotationSpeed: random(-2.2, 2.2),
      fillColor: availableColors[pieceIndex % availableColors.length],
      life: random(3.8, 6.2)
    });
  }

  if (shatteredPieces.length > 180) {
    shatteredPieces.splice(0, shatteredPieces.length - 180);
  }
}

function updateShatteredPieces(dt) {
  shatteredPieces.forEach(shatteredPiece => {
    shatteredPiece.x += shatteredPiece.vx * dt;
    shatteredPiece.y += shatteredPiece.vy * dt;
    shatteredPiece.vy += shatteredPiece.gravity * dt;
    shatteredPiece.rotation += shatteredPiece.rotationSpeed * dt;
    shatteredPiece.life -= dt;
  });
  shatteredPieces = shatteredPieces.filter(shatteredPiece => (
    shatteredPiece.life > 0 &&
    shatteredPiece.y < height + 120
  ));
}

function drawNaturalObjects() {
  naturalObjects.forEach(naturalObject => {
    if (naturalObject.state === 'shattered') return;

    push();
    translate(naturalObject.x, naturalObject.y);
    rotate(naturalObject.rotation);

    if (naturalObject.type === 'tree') drawTree(naturalObject);
    else if (naturalObject.type === 'mountain') drawMountain(naturalObject);
    else if (naturalObject.type === 'pond') drawPond(naturalObject);
    else if (naturalObject.type === 'cloud') drawCloud(naturalObject);
    else if (naturalObject.type === 'flower') drawFlower(naturalObject);
    else if (naturalObject.type === 'leaf') drawLeaf(naturalObject);
    else if (naturalObject.type === 'fish') drawFish(naturalObject);

    pop();
  });
}

function drawTree(naturalObject) {
  const objectSize = naturalObject.size;

  if (naturalObject.state === 'alive') {
    drawOffsetPolygon([
      [-objectSize * 0.065, objectSize * 0.5],
      [objectSize * 0.07, objectSize * 0.5],
      [objectSize * 0.045, -objectSize * 0.12],
      [-objectSize * 0.04, -objectSize * 0.12]
    ], PALETTE.charcoal, 4);
    const canopyPoints = makeAngularBlobPoints(
      0,
      -objectSize * 0.22,
      objectSize * 0.48,
      objectSize * 0.38,
      naturalObject.phase,
      9
    );
    drawOffsetPolygon(canopyPoints, PALETTE.lime, 5);
    fill(...PALETTE.white);
    polygon([
      [0, -objectSize * 0.55],
      [objectSize * 0.36, -objectSize * 0.24],
      [objectSize * 0.08, objectSize * 0.02],
      [-objectSize * 0.06, -objectSize * 0.18]
    ]);
    return;
  }

  push();
  rotate(naturalObject.variant < 0.5 ? -0.2 : 0.2);
  const trunkColor = naturalObject.variant < 0.5 ? PALETTE.charcoal : PALETTE.grey;
  drawOffsetPolygon([
    [-objectSize * 0.06, objectSize * 0.52],
    [objectSize * 0.07, objectSize * 0.52],
    [objectSize * 0.04, -objectSize * 0.27],
    [-objectSize * 0.04, -objectSize * 0.27]
  ], trunkColor, 4);
  stroke(...PALETTE.charcoal);
  strokeWeight(max(3, objectSize * 0.035));
  line(0, -objectSize * 0.02, -objectSize * 0.33, -objectSize * 0.3);
  line(0, -objectSize * 0.08, objectSize * 0.35, -objectSize * 0.35);
  line(-objectSize * 0.16, -objectSize * 0.18, -objectSize * 0.26, -objectSize * 0.43);
  line(objectSize * 0.18, -objectSize * 0.23, objectSize * 0.3, -objectSize * 0.45);
  noStroke();
  fill(...PALETTE.grey);
  polygon(makeAngularBlobPoints(0, -objectSize * 0.28, objectSize * 0.2, objectSize * 0.13, naturalObject.phase, 7));
  stroke(...PALETTE.orange);
  strokeWeight(2.5);
  line(0, objectSize * 0.34, objectSize * 0.035, objectSize * 0.08);
  noStroke();

  for (let leafIndex = 0; leafIndex < 4; leafIndex++) {
    const fallY = (
      elapsedTime * (18 + leafIndex * 3) + naturalObject.phase * 0.3
    ) % (objectSize * 0.9);
    fill(...(leafIndex % 2 === 0 ? PALETTE.orange : PALETTE.charcoal));
    polygon([
      [-objectSize * 0.18 + leafIndex * objectSize * 0.11, -objectSize * 0.18 + fallY],
      [-objectSize * 0.12 + leafIndex * objectSize * 0.11, -objectSize * 0.12 + fallY],
      [-objectSize * 0.18 + leafIndex * objectSize * 0.11, -objectSize * 0.06 + fallY],
      [-objectSize * 0.23 + leafIndex * objectSize * 0.11, -objectSize * 0.12 + fallY]
    ]);
  }
  pop();
}

function drawMountain(naturalObject) {
  const objectSize = naturalObject.size;
  const ruined = naturalObject.state === 'ruined';
  const bodyColor = ruined
    ? (naturalObject.variant < 0.5 ? PALETTE.grey : PALETTE.charcoal)
    : (naturalObject.variant < 0.5 ? PALETTE.blue : PALETTE.purple);
  const mountainPoints = [
    [-objectSize * 0.58, objectSize * 0.38],
    [-objectSize * 0.26, objectSize * 0.02],
    [0, -objectSize * 0.52],
    [objectSize * 0.22, -objectSize * 0.06],
    [objectSize * 0.58, objectSize * 0.38]
  ];
  drawOffsetPolygon(mountainPoints, bodyColor, 6);

  fill(...(ruined ? PALETTE.grey : PALETTE.white));
  polygon([
    [0, -objectSize * 0.52],
    [-objectSize * 0.15, -objectSize * 0.2],
    [-objectSize * 0.03, -objectSize * 0.27],
    [objectSize * 0.08, -objectSize * 0.17],
    [objectSize * 0.18, -objectSize * 0.16]
  ]);

  if (ruined) {
    stroke(...PALETTE.orange);
    strokeWeight(max(2, objectSize * 0.025));
    line(0, -objectSize * 0.47, -objectSize * 0.05, -objectSize * 0.08);
    line(-objectSize * 0.05, -objectSize * 0.08, objectSize * 0.12, objectSize * 0.16);
    line(-objectSize * 0.05, -objectSize * 0.08, -objectSize * 0.24, objectSize * 0.08);
    noStroke();
  }
}

function drawPond(naturalObject) {
  const objectSize = naturalObject.size;
  const polluted = naturalObject.state === 'polluted';
  const pondPoints = makeAngularBlobPoints(
    0,
    0,
    objectSize * 0.58,
    objectSize * 0.22,
    naturalObject.phase,
    14
  );

  noFill();
  stroke(...(polluted ? PALETTE.grey : PALETTE.white));
  strokeWeight(9);
  polygon(pondPoints);
  noStroke();
  fill(...(polluted ? PALETTE.charcoal : PALETTE.blue));
  polygon(pondPoints);

  if (!polluted) {
    stroke(...PALETTE.white);
    strokeWeight(2.5);
    line(-objectSize * 0.34, -objectSize * 0.06, objectSize * 0.25, -objectSize * 0.06);
    line(-objectSize * 0.22, objectSize * 0.04, objectSize * 0.36, objectSize * 0.04);
    noStroke();
  } else {
    fill(...PALETTE.orange, 155);
    polygon(makeAngularBlobPoints(
      objectSize * 0.08,
      0,
      objectSize * 0.31,
      objectSize * 0.1,
      naturalObject.phase + 30,
      9
    ));
    fill(...PALETTE.grey);
    polygon(makeAngularBlobPoints(
      -objectSize * 0.12,
      objectSize * 0.02,
      objectSize * 0.13,
      objectSize * 0.055,
      naturalObject.phase + 60,
      7
    ));
  }
}

function drawCloud(naturalObject) {
  const objectSize = naturalObject.size;
  const smog = naturalObject.state === 'smog';
  const cloudColor = smog ? PALETTE.charcoal : PALETTE.white;
  const cloudPoints = [
    [-objectSize * 0.58, objectSize * 0.18],
    [-objectSize * 0.48, -objectSize * 0.05],
    [-objectSize * 0.28, -objectSize * 0.14],
    [-objectSize * 0.12, -objectSize * 0.42],
    [objectSize * 0.12, -objectSize * 0.3],
    [objectSize * 0.28, -objectSize * 0.18],
    [objectSize * 0.5, -objectSize * 0.06],
    [objectSize * 0.58, objectSize * 0.18]
  ];
  drawOffsetPolygon(cloudPoints, cloudColor, 5);
  if (smog) {
    fill(...PALETTE.orange);
    polygon([
      [-objectSize * 0.28, objectSize * 0.08],
      [objectSize * 0.35, objectSize * 0.03],
      [objectSize * 0.24, objectSize * 0.18],
      [-objectSize * 0.16, objectSize * 0.2]
    ]);
  }
}

function drawFlower(naturalObject) {
  const objectSize = naturalObject.size;
  const wilted = naturalObject.state === 'wilted';

  push();
  if (wilted) rotate(0.55);
  stroke(...(wilted ? PALETTE.charcoal : PALETTE.lime));
  strokeWeight(max(3, objectSize * 0.045));
  line(0, objectSize * 0.48, 0, -objectSize * 0.15);
  noStroke();

  push();
  translate(wilted ? objectSize * 0.1 : 0, -objectSize * 0.22);
  for (let petalIndex = 0; petalIndex < 5; petalIndex++) {
    push();
    rotate(petalIndex * TWO_PI / 5 + (wilted ? 0.25 : 0));
    fill(...(wilted ? PALETTE.grey : PALETTE.white));
    polygon([
      [0, 0],
      [-objectSize * 0.12, -objectSize * 0.22],
      [0, -objectSize * (wilted ? 0.24 : 0.4)],
      [objectSize * 0.12, -objectSize * 0.22]
    ]);
    pop();
  }
  fill(...(wilted ? PALETTE.charcoal : PALETTE.orange));
  polygon([
    [0, -objectSize * 0.1],
    [objectSize * 0.1, 0],
    [0, objectSize * 0.1],
    [-objectSize * 0.1, 0]
  ]);
  pop();
  pop();
}

function drawLeaf(naturalObject) {
  const objectSize = naturalObject.size;
  const withered = naturalObject.state === 'withered';
  if (withered) rotate(0.38);

  const leafPoints = [
    [-objectSize * 0.52, 0],
    [-objectSize * 0.2, -objectSize * 0.35],
    [objectSize * 0.45, -objectSize * 0.18],
    [objectSize * 0.58, 0],
    [objectSize * 0.12, objectSize * 0.34],
    [-objectSize * 0.28, objectSize * 0.25]
  ];
  drawOffsetPolygon(leafPoints, withered ? PALETTE.orange : PALETTE.lime, 5);
  stroke(...(withered ? PALETTE.charcoal : PALETTE.white));
  strokeWeight(max(2, objectSize * 0.035));
  line(-objectSize * 0.42, 0, objectSize * 0.43, -objectSize * 0.02);
  line(-objectSize * 0.08, 0, objectSize * 0.12, -objectSize * 0.2);
  line(objectSize * 0.12, -objectSize * 0.02, objectSize * 0.3, objectSize * 0.14);
  noStroke();
}

function drawFish(naturalObject) {
  const objectSize = naturalObject.size;
  const skeleton = naturalObject.state === 'skeleton';

  if (!skeleton) {
    drawOffsetPolygon([
      [-objectSize * 0.48, 0],
      [-objectSize * 0.22, -objectSize * 0.28],
      [objectSize * 0.28, -objectSize * 0.2],
      [objectSize * 0.5, 0],
      [objectSize * 0.25, objectSize * 0.22],
      [-objectSize * 0.22, objectSize * 0.28]
    ], PALETTE.blue, 5);
    fill(...PALETTE.purple);
    polygon([
      [-objectSize * 0.44, 0],
      [-objectSize * 0.7, -objectSize * 0.25],
      [-objectSize * 0.65, objectSize * 0.26]
    ]);
    fill(...PALETTE.white);
    polygon([
      [objectSize * 0.24, -objectSize * 0.08],
      [objectSize * 0.32, 0],
      [objectSize * 0.24, objectSize * 0.08],
      [objectSize * 0.16, 0]
    ]);
    return;
  }

  stroke(...PALETTE.grey);
  strokeWeight(max(3, objectSize * 0.035));
  line(-objectSize * 0.5, 0, objectSize * 0.48, 0);
  for (let boneIndex = 0; boneIndex < 5; boneIndex++) {
    const boneX = map(boneIndex, 0, 4, -objectSize * 0.28, objectSize * 0.28);
    line(boneX, 0, boneX - objectSize * 0.11, -objectSize * 0.2);
    line(boneX, 0, boneX - objectSize * 0.11, objectSize * 0.2);
  }
  noStroke();
  fill(...PALETTE.charcoal);
  polygon([
    [objectSize * 0.48, 0],
    [objectSize * 0.28, -objectSize * 0.18],
    [objectSize * 0.28, objectSize * 0.18]
  ]);
  fill(...PALETTE.orange);
  polygon([
    [-objectSize * 0.48, 0],
    [-objectSize * 0.7, -objectSize * 0.21],
    [-objectSize * 0.68, objectSize * 0.22]
  ]);
}

function drawShatteredPieces() {
  shatteredPieces.forEach(shatteredPiece => {
    push();
    translate(shatteredPiece.x, shatteredPiece.y);
    rotate(shatteredPiece.rotation);
    noStroke();
    fill(...PALETTE.charcoal, 135);
    polygon([
      [3, -shatteredPiece.size * 0.58 + 3],
      [shatteredPiece.size * 0.62 + 3, 3],
      [3, shatteredPiece.size * 0.52 + 3],
      [-shatteredPiece.size * 0.4 + 3, 3]
    ]);
    fill(...shatteredPiece.fillColor);
    polygon([
      [0, -shatteredPiece.size * 0.58],
      [shatteredPiece.size * 0.62, 0],
      [0, shatteredPiece.size * 0.52],
      [-shatteredPiece.size * 0.4, 0]
    ]);
    pop();
  });
}

function drawPollutantCore() {
  const hoverScale = pollutantHover ? 1.07 : 1;
  const pressScale = pollutantPressed ? 0.94 : 1;
  const pulse = 1 + sin(elapsedTime * 1.3) * 0.018;
  const coreRadius = 108 * hoverScale * pressScale * pulse;

  push();
  translate(width * 0.5, height * 0.5 + (pollutantPressed ? 7 : 0));

  // Hard offset shadow anchors the object in the same cut-paper language as
  // the floating natural forms.
  fill(...PALETTE.charcoal, 185);
  polygon(makeAngularBlobPoints(11, 11, coreRadius * 1.16, coreRadius * 1.16, 91, 18));

  // Irregular nested matter replaces the previous flat black disc.
  push();
  rotate(-elapsedTime * 0.08);
  fill(...PALETTE.charcoal);
  polygon(makeAngularBlobPoints(0, 0, coreRadius * 0.8, coreRadius * 0.79, 171, 15));
  fill(...PALETTE.orange, 145);
  polygon(makeAngularBlobPoints(0, 2, coreRadius * 0.57, coreRadius * 0.5, 241, 12));
  fill(...PALETTE.charcoal);
  polygon(makeAngularBlobPoints(0, 0, coreRadius * 0.4, coreRadius * 0.36, 311, 11));
  pop();

  // Orbiting angular particles make the pollutant feel active without adding
  // more large circular stains to the composition.
  for (let orbitIndex = 0; orbitIndex < 9; orbitIndex++) {
    const orbitAngle = elapsedTime * (0.22 + orbitIndex * 0.012) + orbitIndex * TWO_PI / 9;
    const orbitRadius = coreRadius * (1.23 + sin(elapsedTime + orbitIndex) * 0.06);
    const shardX = cos(orbitAngle) * orbitRadius;
    const shardY = sin(orbitAngle) * orbitRadius;
    const shardSize = 5 + orbitIndex % 3 * 3;
    const shardColors = [PALETTE.orange, PALETTE.white, PALETTE.purple];
    push();
    translate(shardX, shardY);
    rotate(orbitAngle * 1.7);
    fill(...shardColors[orbitIndex % shardColors.length]);
    polygon([
      [0, -shardSize],
      [shardSize * 0.85, 0],
      [0, shardSize],
      [-shardSize * 0.65, 0]
    ]);
    pop();
  }

  // Radial white ticks add mechanical detail and clarify the clickable zone.
  stroke(...PALETTE.white, pollutantHover ? 245 : 190);
  strokeWeight(2.2);
  for (let tickIndex = 0; tickIndex < 12; tickIndex++) {
    const tickAngle = tickIndex * TWO_PI / 12 - elapsedTime * 0.04;
    const innerRadius = coreRadius * 1.1;
    const outerRadius = coreRadius * (tickIndex % 3 === 0 ? 1.2 : 1.16);
    line(
      cos(tickAngle) * innerRadius,
      sin(tickAngle) * innerRadius,
      cos(tickAngle) * outerRadius,
      sin(tickAngle) * outerRadius
    );
  }
  noStroke();

  textFont('Stack Sans Notch');
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  textSize(17);
  fill(...PALETTE.white);
  text('POLLUTANT', 0, -7);

  const progressGap = 12;
  const progressWidth = 8;
  const progressStart = -(LINE_STEPS - 1) * progressGap * 0.5;
  for (let progressIndex = 0; progressIndex < LINE_STEPS; progressIndex++) {
    fill(...(progressIndex < lineClicks ? PALETTE.orange : PALETTE.grey));
    rect(progressStart + progressIndex * progressGap - progressWidth * 0.5, 18, progressWidth, 5);
  }

  pop();
}

function drawPollutionLine(pollutionLineY) {
  if (targetLineLevel <= 0) return;

  // A short flash travels with each button press and makes the step change
  // feel physical without introducing a soft glow.
  if (pollutantPressed) {
    stroke(...PALETTE.white, 155);
    strokeWeight(3);
    line(0, pollutionLineY - 18, width, pollutionLineY - 18);
  }

  stroke(...PALETTE.charcoal);
  strokeWeight(18);
  line(0, pollutionLineY + 5, width, pollutionLineY + 5);
  stroke(...PALETTE.orange);
  strokeWeight(8);
  line(0, pollutionLineY, width, pollutionLineY);

  // Small repeated blocks retain the project's graphic pattern language and
  // make the boundary direction visible without adding explanatory text.
  noStroke();
  const markerGap = 76;
  for (let markerX = 18; markerX < width; markerX += markerGap) {
    fill(...PALETTE.white);
    rect(markerX, pollutionLineY - 4, 28, 4);
  }

  // A second, offset stream of blocks and downward teeth adds motion to the
  // boundary while preserving its hard-edged graphic construction.
  const movingOffset = (elapsedTime * 58) % markerGap;
  for (let markerX = -markerGap + movingOffset; markerX < width; markerX += markerGap) {
    const accentColor = floor(markerX / markerGap) % 2 === 0
      ? PALETTE.purple
      : PALETTE.charcoal;
    fill(...accentColor, 155);
    rect(markerX, pollutionLineY + 10, 19, 5);

    if (floor((markerX + markerGap) / markerGap) % 3 === 0) {
      fill(...PALETTE.orange, 190);
      polygon([
        [markerX + 27, pollutionLineY + 8],
        [markerX + 39, pollutionLineY + 8],
        [markerX + 33, pollutionLineY + 22]
      ]);
    }
  }
}

function makeAngularBlobPoints(centerX, centerY, radiusX, radiusY, noiseKey, vertexCount) {
  const polygonPoints = [];
  for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++) {
    const angle = vertexIndex * TWO_PI / vertexCount;
    const wobble = 0.82 + noise(noiseKey + vertexIndex * 0.37) * 0.3;
    polygonPoints.push([
      centerX + cos(angle) * radiusX * wobble,
      centerY + sin(angle) * radiusY * wobble
    ]);
  }
  return polygonPoints;
}

function drawOffsetPolygon(polygonPoints, fillColor, offsetAmount = 5) {
  noStroke();
  fill(...PALETTE.charcoal, 175);
  polygon(polygonPoints.map(([x, y]) => [x + offsetAmount, y + offsetAmount]));
  fill(...fillColor);
  polygon(polygonPoints);
}

function polygon(polygonPoints) {
  beginShape();
  polygonPoints.forEach(([x, y]) => vertex(x, y));
  endShape(CLOSE);
}

function fitArtboardToWindow() {
  if (!canvasElement) return;
  const displayScale = min(
    window.innerWidth / ARTBOARD_WIDTH,
    window.innerHeight / ARTBOARD_HEIGHT
  );
  canvasElement.style.width = `${ARTBOARD_WIDTH * displayScale}px`;
  canvasElement.style.height = `${ARTBOARD_HEIGHT * displayScale}px`;
}

function windowResized() {
  fitArtboardToWindow();
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    regenerateArtwork();
    return false;
  }
  return true;
}
