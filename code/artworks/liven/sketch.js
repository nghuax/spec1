const BASE_W = 1920;
const BASE_H = 1080;

function livenInformationContent() {
  return `<div class="info-body">
    <section>
      <p class="info-intro">From damaged Earth to a living planet.</p>
      <p>LIVEN is HEAL’s final turning point: renewable energy restores what pollution has weakened.</p>
      <div class="sdg-context">
        <h3>SDG 7 · AFFORDABLE &amp; CLEAN ENERGY</h3>
        <p>Reliable, affordable and sustainable energy supports community life. Placing clean-energy homes represents choosing renewables together. LIVEN’s returning life is an artistic interpretation, not an instant real-world result.</p>
        <p><a href="https://sdgs.un.org/goals/goal7" target="_blank" rel="noopener">United Nations DESA — Goal 7: targets and indicators</a></p>
      </div>
    </section>
    <section class="info-gameplay">
      <h3>RESTORE THE PLANET</h3>
      <ol>
        <li><strong>Drag clean-energy homes</strong><p>Move the three clean-home continents into their matching spaces on Earth.</p></li>
        <li><strong>Avoid polluting factories</strong><p>Factories temporarily darken the planet, then bounce back to orbit automatically.</p></li>
        <li><strong>Bring Earth back to life</strong><p>Complete all three clean-home continents to restore the planet and activate its final living state.</p></li>
      </ol>
    </section>
    <footer class="info-shortcuts">
      <p>LIVEN — STAGE 4 · COMM2754 · SDG 7 · R reset &amp; replay · I / ! guide · S save</p>
      <p class="info-student"><span>NGUYEN TRAN PHUC DUONG</span><span>SID: S4001970</span></p>
    </footer>
  </div>`;
}

const C = {
  bg: "#05051C",
  blue: "#2033FF",
  purple: "#6952EB",
  purpleDark: "#3F2DBB",
  orange: "#FE7D21",
  lime: "#B3FF3B",
  pink: "#F2A9D2",
  white: "#F7F3EA",
  gray: "#9EA2A3",
  darkGray: "#5B5E63",
  black: "#141414",
  paper: "#E9E0D1",
  brown: "#755443",
  red: "#F04434"
};

const storyMessages = [
  "Drag clean-energy homes onto Earth to bring life back.",
  "Match each clean-energy home to a continent to support recovery.",
  "Each clean-energy home helps the planet recover.",
  "As clean homes return, dry trees grow back to life.",
  "Be careful — polluting factories harm the planet.",
  "Factory emissions temporarily darken Earth.",
  "Factories bounce away and return to orbit automatically.",
  "Choose clean homes to keep restoring the planet.",
  "Complete all three clean-home continents to bring Earth back to life.",
  "A living planet brings everyone together."
];

const SOUND_DEFINITIONS = [
  {
    key: "celebration",
    label: "CELEBRATION",
    file: "assets/sounds/celebration.wav",
    recommended: 60,
    level: 60,
    accent: C.lime
  },
  {
    key: "uiHover",
    label: "UI HOVER",
    file: "assets/sounds/ending.mp3",
    recommended: 60,
    level: 60,
    accent: C.blue
  },
  {
    key: "uiClick",
    label: "UI CLICK",
    file: "assets/sounds/ui-click.wav",
    recommended: 60,
    level: 60,
    accent: C.orange
  },
  {
    key: "dragElement",
    label: "DRAG ELEMENT",
    file: "assets/sounds/drag-element.wav",
    recommended: 60,
    level: 60,
    accent: C.blue
  },
  {
    key: "correctElement",
    label: "CORRECT ELEMENT",
    file: "assets/sounds/correct-element.wav",
    recommended: 60,
    level: 60,
    accent: C.lime
  },
  {
    key: "earthRestore",
    label: "EARTH RESTORE",
    file: "assets/sounds/earth-restore.wav",
    recommended: 60,
    level: 60,
    accent: C.lime
  },
  {
    key: "trashElement",
    label: "TRASH ELEMENT",
    file: "assets/sounds/trash-element.wav",
    recommended: 60,
    level: 60,
    accent: C.orange
  },
  {
    key: "trashRemove",
    label: "TRASH REMOVE",
    file: "assets/sounds/trash-remove.wav",
    recommended: 60,
    level: 60,
    accent: C.orange
  },
  {
    key: "wrongPlacement",
    label: "WRONG PLACEMENT",
    file: "assets/sounds/wrong-placement.wav",
    recommended: 60,
    level: 60,
    accent: C.pink
  }
];

const UTILITY_UI = {
  x: 1800,
  y: 218,
  size: 82,
  gap: 18
};

const SOUND_PANEL = {
  x: 1134,
  y: 202,
  w: 622,
  h: 730
};

let viewport = {
  scale: 1,
  x: 0,
  y: 0
};

let earth;
let pollutionPulse = 0;

let renewablePieces = [];
let trashPieces = [];
let emptyPieces = [];

let renewableSlots = [];
let trashSlots = [];

let infoPiece;

let bgShapes = [];
let bgMarks = [];

let dragging = null;

let dragDX = 0;
let dragDY = 0;

let sceneSeed = 1;

let infoOpen = false;

let earthRotation = 0;

let storyIndex = 0;
let storyRandomMode = false;

let soundEffects = {};
let soundPanelOpen = false;
let soundMuted = false;
let activeSoundSlider = -1;


/* =========================================================
   SETUP
========================================================= */

function setup() {

  const canvas =
    createCanvas(
      windowWidth,
      windowHeight
    );

  canvas.parent(
    "artwork"
  );

  canvas.elt.setAttribute(
    "aria-label",
    "Liven interactive artwork. Use the on-screen sound, reload and information controls, or press M, R and I."
  );

  pixelDensity(
    min(
      window.devicePixelRatio || 1,
      2
    )
  );

  textFont(
    "Stack Sans Notch"
  );

  frameRate(
    30
  );

  loadSoundEffects();

  regenerateScene();

}


/* =========================================================
   SOUND SYSTEM
========================================================= */

function loadSoundEffects() {

  for (
    const sound
    of SOUND_DEFINITIONS
  ) {

    const audio =
      new Audio(
        HEALMaster.url(sound.key)
      );

    audio.preload =
      "auto";

    audio.volume =
      sound.level / 100;

    soundEffects[sound.key] =
      audio;

  }

}


function playSound(
  key
) {

  if (
    soundMuted
  ) {

    return;

  }

  const sound =
    SOUND_DEFINITIONS.find(
      item =>
        item.key === key
    );

  const audio =
    soundEffects[key];

  if (
    !sound ||
    !audio
  ) {

    return;

  }

  audio.pause();

  audio.currentTime =
    0;

  audio.volume =
    sound.level / 100;

  const playback =
    HEALMaster.play(audio);

  if (
    playback &&
    typeof playback.catch ===
      "function"
  ) {

    playback.catch(
      () => {}
    );

  }

}


function stopAllSounds() {

  for (
    const audio
    of Object.values(
      soundEffects
    )
  ) {

    audio.pause();

    audio.currentTime =
      0;

  }

}


function toggleSoundMute() {

  soundMuted =
    !soundMuted;

  if (
    soundMuted
  ) {

    stopAllSounds();

  }

}


function useRecommendedMix() {

  for (
    const sound
    of SOUND_DEFINITIONS
  ) {

    sound.level =
      sound.recommended;

  }

  soundMuted =
    false;

  playSound(
    "correctElement"
  );

}


/* =========================================================
   DRAW
========================================================= */

function draw() {

  background(
    C.bg
  );

  updateViewport();

  updateEarthRotation();

  const m =
    mouseWorld();

  push();

  translate(
    viewport.x,
    viewport.y
  );

  scale(
    viewport.scale
  );

  drawBackdrop();

  drawOrbitSystem("back");

  drawEarth();

  drawOrbitSystem("front");

  updateOrbitingPieces();

  drawOrbitingPieces(
    m,
    true
  );

  if (
    dragging
  ) {

    drawOrbitPiece(
      dragging,
      m,
      true
    );

  }

  drawInfoPiece(
    m
  );

  if (window.livenUI) window.livenUI.sync();

  pop();

  updateCursor(
    m
  );

}


/* =========================================================
   RESPONSIVE CANVAS
========================================================= */

function windowResized() {

  if (dragging) {
    dragging.dragging = false;
    returnPieceToOrbit(dragging);
    dragging = null;
  }

  resizeCanvas(
    windowWidth,
    windowHeight
  );

}


/* =========================================================
   VIEWPORT
========================================================= */

function updateViewport() {

  if (width < height) {
    // Recompose the same world for portrait, keeping puzzle pieces undistorted.
    viewport.scale = min((width - 24) / 1100, max(160, height - 320) / 1200);
    viewport.x = width / 2 - earth.x * viewport.scale;
    viewport.y = height / 2 - earth.y * viewport.scale;
    return;
  }

  viewport.scale =
    min(
      width / BASE_W,
      height / BASE_H
    );

  viewport.x =
    (
      width -
      BASE_W *
      viewport.scale
    )
    *
    0.5;

  viewport.y =
    (
      height -
      BASE_H *
      viewport.scale
    )
    *
    0.5;

  viewport.x = width / 2 - earth.x * viewport.scale;
  viewport.y = height / 2 - earth.y * viewport.scale;
}


/* =========================================================
   MOUSE COORDINATES
========================================================= */

function mouseWorld() {

  return {

    x:
      (
        mouseX -
        viewport.x
      )
      /
      viewport.scale,

    y:
      (
        mouseY -
        viewport.y
      )
      /
      viewport.scale

  };

}


/* =========================================================
   REGENERATE
========================================================= */

function regenerateScene() {

  visualRestoration = 0;
  celebrationReveal = 0;
  pollutionPulse = 0;

  sceneSeed =
    floor(
      random(
        1,
        9999999
      )
    );

  randomSeed(
    sceneSeed
  );

  noiseSeed(
    sceneSeed
  );

  earth = {
    x: 1035,
    y: 540,
    r: 285
  };

  renewableSlots =
    createRenewableSlots();

  trashSlots =
    createTrashSlots();

  bgShapes =
    createBackgroundShapes();

  bgMarks =
    createBackgroundMarks();

  renewablePieces =
    createRenewablePieces();

  trashPieces =
    createTrashPieces();

  emptyPieces =
    createEmptyPieces();

  infoPiece =
    null;

  dragging =
    null;

  earthRotation =
    0;

  storyIndex =
    0;

  storyRandomMode =
    false;

}


/* =========================================================
   STORY UI
========================================================= */

function drawStoryPanel() {

  const x =
    135;

  const y =
    978;

  const w =
    1650;

  const h =
    72;

  noStroke();

  fill(
    C.blue
  );

  rect(
    x + 9,
    y + 9,
    w,
    h,
    2
  );

  fill(
    C.white
  );

  rect(
    x,
    y,
    w,
    h,
    2
  );

  fill(
    C.orange
  );

  rect(
    x,
    y,
    12,
    h
  );

  fill(
    C.black
  );

  textAlign(
    CENTER,
    CENTER
  );

  textStyle(
    BOLD
  );

  textSize(
    25
  );

  text(
    storyMessages[storyIndex],
    x + w / 2,
    y + h / 2 + 1
  );

}


function advanceStory() {

  if (
    !storyRandomMode
  ) {

    storyIndex++;

    if (
      storyIndex >=
      storyMessages.length - 1
    ) {

      storyIndex =
        storyMessages.length - 1;

      storyRandomMode =
        true;

    }

    return;

  }

  let nextIndex =
    storyIndex;

  while (
    nextIndex ===
    storyIndex
  ) {

    nextIndex =
      floor(
        random(
          storyMessages.length
        )
      );

  }

  storyIndex =
    nextIndex;

}


/* =========================================================
   EARTH LIFE STATE
========================================================= */

function renewableCount() {

  return renewablePieces.filter(
    p =>
      p.placed
  ).length;

}


function earthIsRestored() {

  return renewableCount() === 3;

}


function updateEarthRotation() {

  if (
    earthIsRestored()
  ) {

    earthRotation +=
      0.0017;

  }

}


/* =========================================================
   RENEWABLE SLOTS
========================================================= */

function createRenewableSlots() {

  return [

    {
      kind: "solar",

      x:
        earth.x,

      y:
        earth.y - 135,

      rot:
        -0.10,

      scale:
        1.25,

      occupied:
        null,

      shape:
        fixedPuzzleShape(
          0,
          160
        )
    },

    {
      kind: "water",

      x:
        earth.x - 142,

      y:
        earth.y + 90,

      rot:
        0.08,

      scale:
        1.16,

      occupied:
        null,

      shape:
        fixedPuzzleShape(
          1,
          155
        )
    },

    {
      kind: "turbine",

      x:
        earth.x + 145,

      y:
        earth.y + 92,

      rot:
        -0.06,

      scale:
        1.16,

      occupied:
        null,

      shape:
        fixedPuzzleShape(
          2,
          155
        )
    }

  ];

}


/* =========================================================
   TRASH SLOTS
========================================================= */

function createTrashSlots() {

  return [

    {
      x:
        earth.x - 50,

      y:
        earth.y + 4,

      rot:
        0.12,

      occupied:
        null
    },

    {
      x:
        earth.x + 62,

      y:
        earth.y - 28,

      rot:
        -0.10,

      occupied:
        null
    },

    {
      x:
        earth.x - 18,

      y:
        earth.y + 174,

      rot:
        0.07,

      occupied:
        null
    },

    {
      x:
        earth.x + 178,

      y:
        earth.y - 36,

      rot:
        0.18,

      occupied:
        null
    },

    {
      x:
        earth.x - 182,

      y:
        earth.y - 24,

      rot:
        -0.14,

      occupied:
        null
    }

  ];

}


/* =========================================================
   INFO PIECE
========================================================= */

function createInfoPiece() {

  const usedAngles = [
    ...renewablePieces,
    ...trashPieces,
    ...emptyPieces
  ].map(
    p =>
      p.angle
  );

  const angle =
    getSeparatedAngle(
      usedAngles,
      0.55
    );

  return makeOrbitPiece({

    role:
      "info",

    kind:
      "info",

    lane: {
      rx: 790,
      ry: 365
    },

    angle,

    speed:
      0.0018,

    size:
      112,

    shapeVariant:
      12

  });

}


/* =========================================================
   BACKGROUND SHAPES
========================================================= */

function createBackgroundShapes() {
  // Layer seeded paper fragments at several scales without changing the palette.
  return Array.from({ length: 24 }, (_, index) => ({
    x: random(40, BASE_W - 40),
    y: random(40, BASE_H - 40),
    r: index < 8 ? random(190, 340) : random(65, 185),
    sides: floor(random(3, 7)),
    rot: random(TWO_PI),
    c: random([C.blue, C.purple, C.purpleDark]),
    opacity: index < 8 ? random(12, 30) : random(20, 58)
  }));
}


/* =========================================================
   BACKGROUND MARKS
========================================================= */

function createBackgroundMarks() {

  const out = [];

  for (
    let i = 0;
    i < 170;
    i++
  ) {

    out.push({

      x:
        random(
          70,
          BASE_W - 70
        ),

      y:
        random(
          65,
          BASE_H - 70
        ),

      s:
        random(
          4,
          17
        ),

      opacity: random(45, 185),

      c:
        random([
          C.blue,
          C.orange,
          C.lime,
          C.pink,
          C.white
        ]),

      sides:
        floor(
          random(
            3,
            6
          )
        ),

      rot:
        random(
          TWO_PI
        )

    });

  }

  return out;

}


/* =========================================================
   BACKDROP
========================================================= */

function drawBackdrop() {

  noStroke();

  for (
    const s
    of bgShapes
  ) {

    push();

    translate(
      s.x,
      s.y
    );

    rotate(
      s.rot
    );

    const shapeColor = color(s.c);
    shapeColor.setAlpha(s.opacity);
    fill(shapeColor);

    beginShape();

    for (
      let i = 0;
      i < s.sides;
      i++
    ) {

      const a =
        i *
        TWO_PI /
        s.sides;

      const rr =
        s.r *
        (
          0.78 +
          0.25 *
          noise(
            sceneSeed *
            0.001 +
            i *
            0.8
          )
        );

      vertex(
        cos(a) * rr,
        sin(a) * rr
      );

    }

    endShape(
      CLOSE
    );

    pop();

  }


  const densityTarget = [0, .12, .4, 1][renewableCount()];
  celebrationReveal = Math.min(densityTarget, celebrationReveal + 1 / 90);
  for (
    const m
    of bgMarks.map((mark, index) => ({ ...mark, reveal: constrain((celebrationReveal - index / bgMarks.length) * 12, 0, 1) }))
      .filter(mark => mark.reveal > 0)
  ) {

    push();

    translate(
      m.x,
      m.y
    );

    rotate(
      m.rot
    );

    const markColor = color(m.c);
    markColor.setAlpha(m.opacity * m.reveal);
    fill(markColor);

    beginShape();

    for (
      let i = 0;
      i < m.sides;
      i++
    ) {

      const a =
        i *
        TWO_PI /
        m.sides;

      const rr =
        m.s *
        (
          i % 2 === 0
            ? 1.15
            : 0.72
        );

      vertex(
        cos(a) * rr,
        sin(a) * rr
      );

    }

    endShape(
      CLOSE
    );

    pop();

  }
}


/* =========================================================
   ORBIT SYSTEM
========================================================= */

function drawOrbitSystem(layer) {

  push();
  translate(earth.x, earth.y);
  scale(width < height ? 0.58 : 1, width < height ? 1.35 : 1);
  translate(-earth.x, -earth.y);

  noFill();

  stroke(
    C.purple
  );

  strokeWeight(
    3
  );

  const start = layer === "back" ? PI : 0;
  const stop = layer === "back" ? TWO_PI : PI;

  arc(
    earth.x,
    earth.y,
    930,
    385,
    start, stop, OPEN
  );

  arc(
    earth.x,
    earth.y,
    1180,
    520,
    start, stop, OPEN
  );

  arc(
    earth.x,
    earth.y,
    1460,
    690,
    start, stop, OPEN
  );

  pop();

}

function orbitRadiusX(piece) { return piece.lane.rx * (width < height ? 0.58 : 1); }
function orbitRadiusY(piece) { return piece.lane.ry * (width < height ? 1.35 : 1); }


/* =========================================================
   RENEWABLE PIECES
========================================================= */

function createRenewablePieces() {

  const lanes = [

    {
      rx: 465,
      ry: 190
    },

    {
      rx: 590,
      ry: 260
    },

    {
      rx: 720,
      ry: 340
    }

  ];

  const kinds = [
    "solar",
    "water",
    "turbine"
  ];

  const usedAngles = [];

  return kinds.map(

    (
      kind,
      i
    ) => {

      const angle =
        getSeparatedAngle(
          usedAngles,
          0.85
        );

      usedAngles.push(
        angle
      );

      return makeOrbitPiece({

        role:
          "renewable",

        kind,

        lane:
          lanes[i],

        angle,

        speed:
          random(
            0.0018,
            0.0030
          )
          *
          (
            random() < 0.5
              ? -1
              : 1
          ),

        size:
          106 +
          i * 3,

        shapeVariant:
          i

      });

    }

  );

}


/* =========================================================
   TRASH PIECES
========================================================= */

function createTrashPieces() {

  const lanes = [

    {
      rx: 505,
      ry: 210
    },

    {
      rx: 625,
      ry: 285
    },

    {
      rx: 750,
      ry: 350
    }

  ];

  const kinds = [
    "bag",
    "barrel",
    "can",
    "bottle",
    "fishbone"
  ];

  const usedAngles = [];

  return kinds.map(

    (
      kind,
      i
    ) => {

      const angle =
        getSeparatedAngle(
          usedAngles,
          0.62
        );

      usedAngles.push(
        angle
      );

      return makeOrbitPiece({

        role:
          "trash",

        kind,

        lane:
          lanes[
            i %
            lanes.length
          ],

        angle,

        speed:
          random(
            0.0014,
            0.0026
          )
          *
          (
            random() < 0.5
              ? -1
              : 1
          ),

        size:
          random(
            90,
            104
          ),

        shapeVariant:
          i + 3

      });

    }

  );

}


/* =========================================================
   EMPTY PIECES
========================================================= */

function createEmptyPieces() {

  const lanes = [

    {
      rx: 665,
      ry: 300
    },

    {
      rx: 770,
      ry: 360
    }

  ];

  return [
    0,
    1
  ].map(

    i =>
      makeOrbitPiece({

        role:
          "empty",

        kind:
          "empty",

        lane:
          lanes[i],

        angle:
          random(
            TWO_PI
          ),

        speed:
          random(
            0.0011,
            0.0019
          )
          *
          (
            random() < 0.5
              ? -1
              : 1
          ),

        size:
          random(
            88,
            102
          ),

        shapeVariant:
          i + 8

      })

  );

}


/* =========================================================
   PIECE FACTORY
========================================================= */

function makeOrbitPiece({

  role,
  kind,
  lane,
  angle,
  speed,
  size,
  shapeVariant

}) {

  return {

    role,
    kind,
    lane,
    angle,
    speed,
    size,

    x:
      earth.x +
      cos(angle) *
      lane.rx,

    y:
      earth.y +
      sin(angle) *
      lane.ry,

    baseRot:
      random(
        -0.26,
        0.26
      ),

    bobSeed:
      random(
        TWO_PI
      ),

    shapeVariant,

    shape:
      role === "renewable"
        ? continentShape(["solar", "water", "turbine"].indexOf(kind), size)
        : role === "trash"
          ? continentShape(shapeVariant % 3, size)
          : makePuzzleShape(size, shapeVariant),

    dragging:
      false,

    placed:
      false,

    slotType:
      null,

    slotIndex:
      -1

  };

}


/* =========================================================
   ANGLE SPACING
========================================================= */

function getSeparatedAngle(
  used,
  minGap
) {

  for (
    let t = 0;
    t < 100;
    t++
  ) {

    const a =
      random(
        TWO_PI
      );

    let okay =
      true;

    for (
      const b
      of used
    ) {

      if (
        abs(
          angleDifference(
            a,
            b
          )
        )
        <
        minGap
      ) {

        okay =
          false;

        break;

      }

    }

    if (
      okay
    ) {

      return a;

    }

  }

  return random(
    TWO_PI
  );

}


function angleDifference(
  a,
  b
) {

  let d =
    a - b;

  while (
    d > PI
  ) {

    d -=
      TWO_PI;

  }

  while (
    d < -PI
  ) {

    d +=
      TWO_PI;

  }

  return d;

}


/* =========================================================
   PUZZLE SHAPES
========================================================= */

function makePuzzleShape(
  size,
  variant = 0
) {

  return {

    w:
      size,

    h:
      size *
      random(
        0.82,
        1.02
      ),

    skew:
      random(
        -0.10,
        0.10
      )
      *
      size,

    mode:
      variant %
      4

  };

}


function fixedPuzzleShape(variant, size) {
  return continentShape(variant, size, true);
}


/* =========================================================
   DRAW PUZZLE TILE
========================================================= */

function drawPuzzleTile(
  shape,
  scaleValue,
  fillColor
) {

  if (shape.continent !== undefined) {
    drawContinentTile(shape, scaleValue, fillColor);
    return;
  }

  const {
    w,
    h,
    skew,
    mode
  } = shape;

  push();

  scale(
    scaleValue
  );

  fill(
    fillColor
  );

  noStroke();

  beginShape();

  vertex(
    -w * 0.50 +
    skew,
    -h * 0.34
  );

  if (
    mode === 0 ||
    mode === 2
  ) {

    vertex(
      -w * 0.12,
      -h * 0.44
    );

    bezierVertex(
      -w * 0.10,
      -h * 0.64,

      w * 0.12,
      -h * 0.64,

      w * 0.14,
      -h * 0.43
    );

  }

  else {

    vertex(
      -w * 0.06,
      -h * 0.43
    );

  }

  vertex(
    w * 0.46,
    -h * 0.28
  );

  vertex(
    w * 0.48,
    -h * 0.04
  );

  if (
    mode === 1 ||
    mode === 2
  ) {

    bezierVertex(
      w * 0.68,
      -h * 0.02,

      w * 0.68,
      h * 0.20,

      w * 0.48,
      h * 0.19
    );

  }

  else {

    vertex(
      w * 0.46,
      h * 0.12
    );

  }

  vertex(
    w * 0.30,
    h * 0.48
  );

  vertex(
    -w * 0.08,
    h * 0.40
  );

  if (
    mode === 3 ||
    mode === 0
  ) {

    bezierVertex(
      -w * 0.10,
      h * 0.22,

      -w * 0.30,
      h * 0.22,

      -w * 0.31,
      h * 0.40
    );

  }

  else {

    vertex(
      -w * 0.22,
      h * 0.35
    );

  }

  vertex(
    -w * 0.46,
    h * 0.18
  );

  vertex(
    -w * 0.50,
    -h * 0.34
  );

  endShape(
    CLOSE
  );

  pop();

}


/* =========================================================
   ORBIT UPDATE
========================================================= */

function updateOrbitingPieces() {

  const all = [
    ...emptyPieces,
    ...trashPieces,
    ...renewablePieces,
    infoPiece
  ];

  for (
    const p
    of all
  ) {

    if (
      !p ||
      p.placed ||
      p.dragging
    ) {

      continue;

    }

    p.angle +=
      p.speed;

    p.x =
      earth.x +
      cos(
        p.angle
      )
      *
      orbitRadiusX(p);

    p.y =
      earth.y +
      sin(
        p.angle
      )
      *
      orbitRadiusY(p);

    if (p.returnFlight) {
      const flight = p.returnFlight;
      flight.progress = Math.min(1, flight.progress + 1 / 24);
      const t = flight.progress;
      const ease = 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
      p.x = lerp(flight.x, p.x, ease);
      p.y = lerp(flight.y, p.y, ease) - Math.sin(t * Math.PI) * 26;
      if (t === 1) p.returnFlight = null;
    }

  }

}


/* =========================================================
   HOVER TEST
========================================================= */

function pieceHovered(
  p,
  m
) {

  return (
    dist(
      m.x,
      m.y,
      p.x,
      p.y
    )
    <
    p.size *
    0.60
  );

}


/* =========================================================
   DRAW ORBITING PIECES
========================================================= */

function drawOrbitingPieces(
  m,
  skipDragging = false
) {

  for (
    const p
    of emptyPieces
  ) {

    drawOrbitPiece(
      p,
      m
    );

  }


  for (
    const p
    of trashPieces
  ) {

    if (
      p.placed
    ) {

      continue;

    }

    if (
      skipDragging &&
      p === dragging
    ) {

      continue;

    }

    drawOrbitPiece(
      p,
      m
    );

  }


  for (
    const p
    of renewablePieces
  ) {

    if (
      p.placed
    ) {

      continue;

    }

    if (
      skipDragging &&
      p === dragging
    ) {

      continue;

    }

    drawOrbitPiece(
      p,
      m
    );

  }

}


/* =========================================================
   DRAW ORBIT PIECE
========================================================= */

function drawOrbitPiece(
  p,
  m,
  forceTop = false
) {

  const hovered =
    p.role !==
    "empty"
    &&
    pieceHovered(
      p,
      m
    );

  const shake =
    hovered &&
    !p.dragging
      ?
      sin(
        frameCount *
        0.62 +
        p.bobSeed
      )
      *
      3
      :
      0;

  const bob =
    p.dragging
      ?
      0
      :
      sin(
        frameCount *
        0.035 +
        p.bobSeed
      )
      *
      5;

  push();

  translate(
    p.x + shake,
    p.y + bob
  );

  rotate(
    p.baseRot +
    (
      hovered
        ?
        sin(
          frameCount *
          0.47 +
          p.bobSeed
        )
        *
        0.045
        :
        0
    )
  );

  if (
    hovered ||
    p.dragging ||
    forceTop
  ) {

    drawPuzzleTile(
      p.shape,
      1.13,
      C.purpleDark
    );

  }

  drawPuzzleTile(
    p.shape,
    1,
    p.role === "renewable" ? C.lime : p.role === "trash" ? C.darkGray : C.purple
  );

  if (
    p.role ===
    "renewable"
  ) {

    drawRenewableIcon(
      p.kind,
      0.94
    );

  }

  if (
    p.role ===
    "trash"
  ) {

    drawTrashIcon(
      p.kind,
      0.90
    );

  }

  pop();

}


/* =========================================================
   INFO PIECE
========================================================= */

function drawInfoPiece(
  m
) {

  if (
    !infoPiece
  ) {

    return;

  }

  const hovered =
    pieceHovered(
      infoPiece,
      m
    );

  const pulse =
    1 +
    sin(
      frameCount *
      0.17
    )
    *
    0.07;

  push();

  translate(
    infoPiece.x,
    infoPiece.y
  );

  rotate(
    infoPiece.baseRot
  );

  drawPuzzleTile(
    infoPiece.shape,
    1.14 * pulse,
    C.purpleDark
  );

  drawPuzzleTile(
    infoPiece.shape,
    pulse,
    C.purple
  );

  if (
    hovered
  ) {

    noFill();

    stroke(
      C.lime
    );

    strokeWeight(
      3
    );

    circle(
      0,
      0,
      120
    );

  }

  textAlign(
    CENTER,
    CENTER
  );

  textStyle(
    BOLD
  );

  textSize(
    144
  );

  if (
    sin(
      frameCount *
      0.18
    )
    >
    0
  ) {

    fill(
      C.lime
    );

  }

  else {

    fill(
      C.white
    );

  }

  text(
    "!",
    0,
    -5
  );

  pop();

}


/* =========================================================
   EARTH
========================================================= */

function drawEarth() {

  const correctCount =
    renewableCount();

  const heal =
    correctCount /
    3;

  visualRestoration = lerp(visualRestoration, heal, 0.055);

  const damage = pollutionPulse;
  pollutionPulse *= 0.975;

  const healedOcean =
    lerpColor(
      lerpColor(color(C.lime), color(C.black), 0.82),
      color(
        C.blue
      ),
      heal
    );

  const oceanColor =
    lerpColor(
      healedOcean,
      color(
        C.black
      ),
      damage
    );

  if (
    earthIsRestored()
  ) {

    drawEarthGlow();

  }

  noStroke();

  fill(
    oceanColor
  );

  circle(
    earth.x,
    earth.y,
    earth.r * 2
  );

  push();

  translate(
    earth.x,
    earth.y
  );

  rotate(
    earthRotation
  );

  translate(
    -earth.x,
    -earth.y
  );

  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.arc(earth.x, earth.y, earth.r, 0, Math.PI * 2);
  drawingContext.clip();

  const passiveLand =
    lerpColor(
      lerpColor(color(C.brown), color(C.black), 0.3),
      lerpColor(color(C.darkGray), color(C.lime), 0.38),
      heal
    );

  const passiveDamaged =
    lerpColor(
      passiveLand,
      color(
        C.black
      ),
      damage *
      0.82
    );

  fill(
    passiveDamaged
  );

  drawPassiveLandShapes();

  drawRenewableEarthPieces(
    damage
  );

  drawTrashEarthPieces();

  drawEarthCracks(
    heal,
    damage
  );

  drawWorldRecovery(heal, damage);

  drawingContext.restore();

  pop();

  drawPeaceCircle();

}


/* =========================================================
   EARTH GLOW
========================================================= */

function drawEarthGlow() {

  push();

  noFill();

  const pulse =
    sin(
      frameCount *
      0.08
    );

  stroke(
    179,
    255,
    59,
    45
  );

  strokeWeight(
    24 +
    pulse * 5
  );

  circle(
    earth.x,
    earth.y,
    earth.r * 2 + 16
  );

  stroke(
    32,
    51,
    255,
    70
  );

  strokeWeight(
    11
  );

  circle(
    earth.x,
    earth.y,
    earth.r * 2 + 28
  );

  stroke(
    179,
    255,
    59,
    110
  );

  strokeWeight(
    4
  );

  circle(
    earth.x,
    earth.y,
    earth.r * 2 + 42
  );

  drawingContext.shadowBlur =
    32;

  drawingContext.shadowColor =
    C.lime;

  stroke(
    C.lime
  );

  strokeWeight(
    3
  );

  circle(
    earth.x,
    earth.y,
    earth.r * 2 + 18
  );

  drawingContext.shadowBlur =
    0;

  pop();

}


/* =========================================================
   RENEWABLE EARTH PIECES
========================================================= */

function drawRenewableEarthPieces(
  damage
) {

  for (
    const s
    of renewableSlots
  ) {

    push();

    translate(
      s.x,
      s.y
    );

    rotate(
      s.rot
    );

    if (
      !s.occupied
    ) {

      const emptyCol =
        lerpColor(
          lerpColor(color(C.brown), color(C.black), 0.3),
          color(
            C.black
          ),
          damage
        );

      drawPuzzleTile(
        s.shape,
        s.scale,
        emptyCol
      );

    }

    else {

      const landCol =
        lerpColor(
          color(
            C.lime
          ),
          color(
            C.black
          ),
          damage *
          0.42
        );

      drawPuzzleTile(
        s.shape,
        s.scale,
        landCol
      );

      drawRenewableIcon(
        s.kind,
        0.98
      );

    }

    pop();

  }

}


/* =========================================================
   TRASH EARTH PIECES
========================================================= */

function drawTrashEarthPieces() {

  for (
    const s
    of trashSlots
  ) {

    if (
      !s.occupied
    ) {

      continue;

    }

    const p =
      s.occupied;

    push();

    translate(
      s.x,
      s.y
    );

    rotate(
      s.rot
    );

    drawPuzzleTile(
      p.shape,
      0.82,
      C.purple
    );

    drawTrashIcon(
      p.kind,
      0.74
    );

    pop();

  }

}


/* =========================================================
   PASSIVE LAND
========================================================= */

function drawPassiveLandShapes() {
  push();
  translate(earth.x, earth.y);
  // Island chains between Asia, Africa and Australia.
  [[-211,-166,17,25],[-231,-136,10,18],[169,-62,9,27],[188,-35,8,20],[96,32,10,15],[111,43,18,9],[133,48,14,8],[-86,174,12,35],[204,184,12,26],[150,217,15,11]].forEach(([x,y,w,h]) => {
    beginShape();
    [[-.4,-.4],[.1,-.55],[.48,-.16],[.3,.38],[-.2,.5],[-.5,.1]].forEach(([px,py])=>vertex(x+px*w,y+py*h));
    endShape(CLOSE);
  });
  pop();
}


/* =========================================================
   EARTH CRACKS
========================================================= */

function drawEarthCracks(
  heal,
  damage
) {

  const alpha =
    map(
      heal,
      0,
      1,
      160,
      35
    )
    *
    (
      1 -
      damage *
      0.22
    );

  stroke(
    20,
    alpha
  );

  strokeWeight(
    2.4
  );

  noFill();

  drawCrack(
    earth.x - 95,
    earth.y - 140,

    [
      [0, 0],
      [28, 20],
      [10, 48],
      [40, 70],
      [22, 95]
    ]
  );

  drawCrack(
    earth.x + 115,
    earth.y - 78,

    [
      [0, 0],
      [-22, 24],
      [-8, 48],
      [-35, 73],
      [-16, 100]
    ]
  );

  drawCrack(
    earth.x + 10,
    earth.y + 145,

    [
      [0, 0],
      [16, 20],
      [-4, 48],
      [22, 76],
      [10, 105]
    ]
  );

}


function drawCrack(
  x,
  y,
  pts
) {

  push();

  translate(
    x,
    y
  );

  beginShape();

  for (
    const p
    of pts
  ) {

    vertex(
      p[0],
      p[1]
    );

  }

  endShape();

  pop();

}


/* =========================================================
   EARTH ROTATED POSITION
========================================================= */

function earthDisplayPoint(
  x,
  y
) {

  const dx =
    x -
    earth.x;

  const dy =
    y -
    earth.y;

  return {

    x:
      earth.x +
      dx *
      cos(
        earthRotation
      )
      -
      dy *
      sin(
        earthRotation
      ),

    y:
      earth.y +
      dx *
      sin(
        earthRotation
      )
      +
      dy *
      cos(
        earthRotation
      )

  };

}


/* =========================================================
   RENEWABLE ICONS
========================================================= */

function drawRenewableIcon(kind, scaleValue) {
  drawHouseCluster(kind, scaleValue, false);
}


/* =========================================================
   SOLAR PANEL
========================================================= */

function drawSolarReference() {

  noStroke();

  rectMode(
    CENTER
  );

  fill(
    C.orange
  );

  rect(
    -8,
    38,
    10,
    48
  );

  push();

  translate(
    32,
    35
  );

  rotate(
    -0.16
  );

  rect(
    0,
    0,
    9,
    52
  );

  pop();

  rect(
    4,
    61,
    100,
    8
  );

  fill(
    C.pink
  );

  quad(
    -60,
    -40,

    54,
    -40,

    42,
    23,

    -72,
    23
  );

  const cells = [

    [
      C.lime,
      C.orange,
      C.lime
    ],

    [
      C.orange,
      C.lime,
      C.orange
    ]

  ];

  for (
    let r = 0;
    r < 2;
    r++
  ) {

    for (
      let c = 0;
      c < 3;
      c++
    ) {

      const x =
        -48 +
        c * 36;

      const y =
        -29 +
        r * 29;

      fill(
        cells[r][c]
      );

      quad(
        x,
        y,

        x + 29,
        y,

        x + 23,
        y + 22,

        x - 6,
        y + 22
      );

    }

  }

}


/* =========================================================
   TURBINE
========================================================= */

function drawTurbineReference() {

  noStroke();

  fill(
    C.white
  );

  beginShape();

  vertex(
    -9,
    52
  );

  vertex(
    9,
    52
  );

  vertex(
    6,
    -10
  );

  vertex(
    -6,
    -10
  );

  endShape(
    CLOSE
  );

  rectMode(
    CENTER
  );

  fill(
    C.pink
  );

  rect(
    0,
    45,
    19,
    8
  );

  fill(
    C.orange
  );

  rect(
    0,
    56,
    22,
    11
  );

  push();

  translate(
    0,
    -14
  );

  fill(
    C.orange
  );

  for (
    let i = 0;
    i < 3;
    i++
  ) {

    push();

    rotate(
      i *
      TWO_PI /
      3
    );

    beginShape();

    vertex(
      0,
      0
    );

    vertex(
      10,
      -4
    );

    vertex(
      62,
      -4
    );

    vertex(
      71,
      6
    );

    vertex(
      18,
      13
    );

    endShape(
      CLOSE
    );

    pop();

  }

  fill(
    C.pink
  );

  circle(
    0,
    0,
    24
  );

  pop();

}


/* =========================================================
   WATER WHEEL
========================================================= */

function drawWaterWheelReference() {

  noStroke();

  fill(
    C.orange
  );

  circle(
    0,
    0,
    112
  );

  const wedgeColors = [
    C.white,
    C.pink,
    C.lime,
    C.pink,
    C.lime,
    C.pink
  ];

  const radius =
    48;

  const halfGap =
    radians(
      18
    );

  for (
    let i = 0;
    i < 6;
    i++
  ) {

    const centerA =
      -HALF_PI +
      i *
      TWO_PI /
      6;

    const a1 =
      centerA -
      halfGap;

    const a2 =
      centerA +
      halfGap;

    fill(
      wedgeColors[i]
    );

    triangle(
      0,
      0,

      cos(a1) *
      radius,

      sin(a1) *
      radius,

      cos(a2) *
      radius,

      sin(a2) *
      radius
    );

  }

}


/* =========================================================
   TRASH ICONS
========================================================= */

function drawTrashIcon(kind, scaleValue) {
  drawHouseCluster(kind, scaleValue, true);
}


/* =========================================================
   MAIN UI
========================================================= */

function drawUI() {

  drawHeroTitle();

  drawEnergyPanel();

}


/* =========================================================
   UTILITY CONTROLS
========================================================= */

function drawUtilityUI(
  m
) {

  if (
    soundPanelOpen
  ) {

    drawSoundPanel();

  }

  const railH =
    UTILITY_UI.size * 3 +
    UTILITY_UI.gap * 2 +
    40;

  noStroke();

  fill(
    247,
    243,
    234,
    34
  );

  rect(
    UTILITY_UI.x - 18,
    UTILITY_UI.y - 20,
    UTILITY_UI.size + 52,
    railH,
    18,
    0,
    0,
    18
  );

  const controls = [
    {
      type: "sound",
      label: soundMuted
        ? "SOUND MUTED (M)"
        : "SOUND MIX (M)",
      active: soundPanelOpen
    },
    {
      type: "reload",
      label: "RELOAD PROJECT (R)",
      active: false
    },
    {
      type: "info",
      label: "PROJECT INFORMATION (I)",
      active: infoOpen
    }
  ];

  for (
    let i = 0;
    i < controls.length;
    i++
  ) {

    const bounds =
      utilityButtonRect(
        i
      );

    const hovered =
      pointInRect(
        m,
        bounds
      );

    drawUtilityButton(
      bounds,
      controls[i].type,
      hovered,
      controls[i].active
    );

    if (
      hovered &&
      !(
        controls[i].type === "sound" &&
        soundPanelOpen
      )
    ) {

      drawUtilityTooltip(
        controls[i].label,
        bounds
      );

    }

  }

}


function utilityButtonRect(
  index
) {

  return {
    x: UTILITY_UI.x,
    y:
      UTILITY_UI.y +
      index *
      (
        UTILITY_UI.size +
        UTILITY_UI.gap
      ),
    w: UTILITY_UI.size,
    h: UTILITY_UI.size
  };

}


function drawUtilityButton(
  bounds,
  type,
  hovered,
  active
) {

  noStroke();

  fill(
    C.black
  );

  quad(
    bounds.x - 10,
    bounds.y + 13,
    bounds.x + bounds.w - 2,
    bounds.y + 8,
    bounds.x + bounds.w - 9,
    bounds.y + bounds.h + 9,
    bounds.x - 18,
    bounds.y + bounds.h + 12
  );

  fill(
    C.white
  );

  quad(
    bounds.x + 8,
    bounds.y - 9,
    bounds.x + bounds.w + 9,
    bounds.y - 13,
    bounds.x + bounds.w + 7,
    bounds.y + bounds.h - 6,
    bounds.x + 8,
    bounds.y + bounds.h
  );

  fill(
    hovered || active
      ? "#242447"
      : "#17171C"
  );

  stroke(
    active
      ? C.lime
      : C.darkGray
  );

  strokeWeight(
    active
      ? 3
      : 1
  );

  rect(
    bounds.x,
    bounds.y,
    bounds.w,
    bounds.h,
    2
  );

  drawUtilityIcon(
    type,
    bounds.x + bounds.w / 2,
    bounds.y + bounds.h / 2
  );

}


function drawUtilityIcon(
  type,
  x,
  y
) {

  push();

  translate(
    x,
    y
  );

  noFill();

  stroke(
    C.white
  );

  strokeWeight(
    5
  );

  strokeCap(
    SQUARE
  );

  if (
    type === "sound"
  ) {

    noStroke();

    fill(
      C.white
    );

    quad(
      -23,
      -7,
      -12,
      -7,
      1,
      -18,
      1,
      18
    );

    quad(
      -23,
      -7,
      -12,
      -7,
      -12,
      7,
      -23,
      7
    );

    noFill();

    stroke(
      C.white
    );

    strokeWeight(
      4
    );

    arc(
      2,
      0,
      25,
      25,
      -HALF_PI,
      HALF_PI
    );

    arc(
      2,
      0,
      43,
      43,
      -HALF_PI,
      HALF_PI
    );

    if (
      soundMuted
    ) {

      stroke(
        C.orange
      );

      strokeWeight(
        6
      );

      line(
        -23,
        -24,
        24,
        24
      );

    }

  }

  if (
    type === "reload"
  ) {

    arc(
      0,
      2,
      43,
      43,
      -PI * 0.72,
      PI * 1.18
    );

    noStroke();

    fill(
      C.white
    );

    triangle(
      -23,
      -19,
      -25,
      0,
      -7,
      -9
    );

  }

  if (
    type === "info"
  ) {

    noStroke();

    fill(
      C.white
    );

    rect(
      -3,
      -25,
      7,
      32,
      1
    );

    rect(
      -3,
      16,
      7,
      8,
      1
    );

  }

  pop();

}


function drawUtilityTooltip(
  label,
  bounds
) {

  textStyle(
    BOLD
  );

  textSize(
    14
  );

  const tooltipW =
    textWidth(
      label
    ) +
    30;

  const tooltipX =
    bounds.x -
    tooltipW -
    20;

  const tooltipY =
    bounds.y +
    bounds.h / 2 -
    19;

  noStroke();

  fill(
    C.black
  );

  rect(
    tooltipX,
    tooltipY,
    tooltipW,
    38,
    2
  );

  fill(
    C.lime
  );

  textAlign(
    CENTER,
    CENTER
  );

  text(
    label,
    tooltipX + tooltipW / 2,
    tooltipY + 19
  );

}


/* =========================================================
   SOUND MIX PANEL
========================================================= */

function drawSoundPanel() {

  const p =
    SOUND_PANEL;

  noStroke();

  fill(
    C.blue
  );

  rect(
    p.x + 10,
    p.y + 10,
    p.w,
    p.h,
    2
  );

  fill(
    C.orange
  );

  rect(
    p.x + 5,
    p.y + 5,
    p.w,
    p.h,
    2
  );

  stroke(
    C.white
  );

  strokeWeight(
    3
  );

  fill(
    5,
    5,
    14,
    248
  );

  rect(
    p.x,
    p.y,
    p.w,
    p.h,
    2
  );

  noStroke();

  fill(
    C.white
  );

  textAlign(
    LEFT,
    TOP
  );

  textStyle(
    BOLD
  );

  textSize(
    21
  );

  text(
    "SOUND MIX",
    p.x + 28,
    p.y + 25
  );

  fill(
    soundMuted
      ? C.orange
      : C.lime
  );

  textAlign(
    RIGHT,
    TOP
  );

  textSize(
    15
  );

  text(
    soundMuted
      ? "M · UNMUTE"
      : "M · MUTE",
    p.x + p.w - 28,
    p.y + 27
  );

  stroke(
    C.darkGray
  );

  strokeWeight(
    2
  );

  line(
    p.x + 28,
    p.y + 68,
    p.x + p.w - 28,
    p.y + 68
  );

  noStroke();

  fill(
    C.gray
  );

  textAlign(
    LEFT,
    TOP
  );

  textStyle(
    BOLD
  );

  textSize(
    13
  );

  text(
    "ROLE",
    p.x + 28,
    p.y + 86
  );

  fill(
    C.lime
  );

  text(
    "(RECOMMENDED)",
    p.x + 67,
    p.y + 86
  );

  fill(
    C.gray
  );

  text(
    "· CURRENT LEVEL",
    p.x + 179,
    p.y + 86
  );

  for (
    let i = 0;
    i < SOUND_DEFINITIONS.length;
    i++
  ) {

    drawSoundRow(
      SOUND_DEFINITIONS[i],
      i
    );

  }

  stroke(
    C.darkGray
  );

  strokeWeight(
    2
  );

  line(
    p.x + 28,
    p.y + 632,
    p.x + p.w - 28,
    p.y + 632
  );

  noStroke();

  fill(
    C.gray
  );

  textAlign(
    LEFT,
    CENTER
  );

  textStyle(
    BOLD
  );

  textSize(
    13
  );

  text(
    "( ) = RECOMMENDED MIX",
    p.x + 28,
    p.y + 684
  );

  const recommended =
    soundRecommendedRect();

  fill(
    C.orange
  );

  rect(
    recommended.x + 7,
    recommended.y + 7,
    recommended.w,
    recommended.h,
    2
  );

  fill(
    C.lime
  );

  rect(
    recommended.x,
    recommended.y,
    recommended.w,
    recommended.h,
    2
  );

  fill(
    C.black
  );

  textAlign(
    CENTER,
    CENTER
  );

  textStyle(
    BOLD
  );

  textSize(
    14
  );

  text(
    "USE RECOMMENDED",
    recommended.x + recommended.w / 2,
    recommended.y + recommended.h / 2
  );

}


function drawSoundRow(
  sound,
  index
) {

  const row =
    soundRowRect(
      index
    );

  const slider =
    soundSliderRect(
      index
    );

  noStroke();

  fill(
    17,
    17,
    24,
    252
  );

  rect(
    row.x,
    row.y,
    row.w,
    row.h
  );

  fill(
    sound.accent
  );

  rect(
    row.x,
    row.y,
    5,
    row.h
  );

  fill(
    C.white
  );

  textAlign(
    LEFT,
    CENTER
  );

  textStyle(
    BOLD
  );

  textSize(
    15
  );

  text(
    sound.label,
    row.x + 20,
    row.y + row.h / 2 - 10
  );

  fill(
    C.lime
  );

  textSize(
    12
  );

  text(
    `(${sound.recommended}% RECOMMENDED)`,
    row.x + 20,
    row.y + row.h / 2 + 11
  );

  stroke(
    C.gray
  );

  strokeWeight(
    6
  );

  line(
    slider.x,
    slider.y,
    slider.x + slider.w,
    slider.y
  );

  const knobX =
    slider.x +
    slider.w *
    sound.level / 100;

  noStroke();

  fill(
    C.lime
  );

  rect(
    knobX - 9,
    slider.y - 17,
    18,
    34,
    1
  );

  fill(
    C.white
  );

  textAlign(
    RIGHT,
    CENTER
  );

  textStyle(
    BOLD
  );

  textSize(
    14
  );

  text(
    `${sound.level}%`,
    row.x + row.w - 12,
    row.y + row.h / 2
  );

  if (
    soundMuted
  ) {

    fill(
      5,
      5,
      14,
      118
    );

    rect(
      row.x,
      row.y,
      row.w,
      row.h
    );

  }

}


function soundRowRect(
  index
) {

  return {
    x: SOUND_PANEL.x + 28,
    y:
      SOUND_PANEL.y + 112 +
      index * 76,
    w: SOUND_PANEL.w - 56,
    h: 64
  };

}


function soundSliderRect(
  index
) {

  const row =
    soundRowRect(
      index
    );

  return {
    x: row.x + 300,
    y: row.y + row.h / 2,
    w: 176,
    h: 42
  };

}


function soundMuteRect() {

  return {
    x: SOUND_PANEL.x + SOUND_PANEL.w - 160,
    y: SOUND_PANEL.y + 15,
    w: 132,
    h: 42
  };

}


function soundRecommendedRect() {

  return {
    x: SOUND_PANEL.x + SOUND_PANEL.w - 226,
    y: SOUND_PANEL.y + 655,
    w: 198,
    h: 52
  };

}


function pointInRect(
  point,
  bounds
) {

  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.w &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.h
  );

}


function setSoundSliderFromX(
  index,
  x
) {

  const slider =
    soundSliderRect(
      index
    );

  SOUND_DEFINITIONS[index].level =
    round(
      constrain(
        (
          x - slider.x
        ) /
        slider.w,
        0,
        1
      ) *
      100
    );

  soundMuted =
    false;

}


/* =========================================================
   HERO TITLE
========================================================= */

function drawHeroTitle() {

  push();

  translate(
    -25,
    -16
  );

  rotate(
    -0.085
  );

  scale(
    0.80
  );

  noStroke();

  fill(
    C.orange
  );

  beginShape();

  vertex(
    18,
    28
  );

  vertex(
    706,
    6
  );

  vertex(
    745,
    280
  );

  vertex(
    320,
    352
  );

  vertex(
    0,
    343
  );

  endShape(
    CLOSE
  );

  fill(
    C.blue
  );

  beginShape();

  vertex(
    0,
    20
  );

  vertex(
    690,
    0
  );

  vertex(
    725,
    262
  );

  vertex(
    305,
    330
  );

  vertex(
    -12,
    323
  );

  endShape(
    CLOSE
  );

  fill(
    C.white
  );

  textAlign(
    LEFT,
    TOP
  );

  textStyle(
    BOLD
  );

  textSize(
    18
  );

  text(
    "p5.js INTERACTIVE ARTWORK",
    74,
    65
  );

  textSize(
    185
  );

  text(
    "LIVEN",
    66,
    96
  );

  fill(
    C.lime
  );

  quad(
    245,
    286,

    575,
    250,

    590,
    270,

    257,
    308
  );

  pop();

}


/* =========================================================
   ENERGY PANEL
========================================================= */

function drawEnergyPanel() {

  const w =
    390;

  const h =
    145;

  const margin =
    28;

  const x =
    BASE_W -
    w -
    margin;

  const y =
    26;

  noStroke();

  fill(
    C.orange
  );

  rect(
    x + 9,
    y + 10,
    w,
    h,
    2
  );

  fill(
    C.bg
  );

  rect(
    x,
    y,
    w,
    h,
    2
  );

  fill(
    C.lime
  );

  rect(
    x,
    y,
    w,
    8
  );

  textAlign(
    LEFT,
    TOP
  );

  textStyle(
    BOLD
  );

  fill(
    C.lime
  );

  textSize(
    16
  );

  text(
    "RENEWABLE ENERGY",
    x + 24,
    y + 25
  );

  fill(
    C.white
  );

  const headline =
    "RESTORING LIFE TO EARTH";

  const headlineSize =
    fitTextSize(
      headline,
      w - 48,
      27,
      17
    );

  textSize(
    headlineSize
  );

  text(
    headline,
    x + 24,
    y + 52
  );

  fill(
    "#11114A"
  );

  rect(
    x + 24,
    y + 108,
    w - 48,
    17
  );

  fill(
    C.blue
  );

  const progress =
    renewableCount()
    /
    3;

  rect(
    x + 24,
    y + 108,

    (
      w - 48
    )
    *
    progress,

    17
  );

}


/* =========================================================
   TEXT AUTO FIT
========================================================= */

function fitTextSize(
  str,
  maxWidth,
  startSize,
  minSize
) {

  let s =
    startSize;

  textSize(
    s
  );

  while (
    textWidth(
      str
    )
    >
    maxWidth
    &&
    s >
    minSize
  ) {

    s--;

    textSize(
      s
    );

  }

  return s;

}


/* =========================================================
   PROJECT INFORMATION
========================================================= */

function drawInformationOverlay() {

  noStroke();

  fill(
    5,
    5,
    28,
    230
  );

  rect(
    0,
    0,
    BASE_W,
    BASE_H
  );

  const x =
    42;

  const y =
    34;

  const w =
    BASE_W - 84;

  const h =
    970;

  fill(
    C.orange
  );

  rect(
    x + 11,
    y + 11,
    w,
    h,
    20
  );

  fill(
    C.bg
  );

  rect(
    x,
    y,
    w,
    h,
    20
  );

  fill(
    C.blue
  );

  rect(
    x,
    y,
    w,
    13,
    20,
    20,
    0,
    0
  );

  fill(
    C.lime
  );

  rect(
    x + 34,
    y + 32,
    110,
    8
  );

  drawInformationTitle(
    x,
    y
  );

  drawInformationLeftColumn(
    x,
    y
  );

  drawInformationRightColumn(
    x,
    y
  );

  fill(
    C.lime
  );

  textAlign(
    CENTER,
    TOP
  );

  textStyle(
    BOLD
  );

  textSize(
    18
  );

  text(
    "PRESS I OR CLICK ! TO CLOSE",
    BASE_W / 2,
    y + h + 18
  );

}


/* =========================================================
   INFORMATION TITLE
========================================================= */

function drawInformationTitle(
  x,
  y
) {

  fill(
    C.white
  );

  textAlign(
    LEFT,
    TOP
  );

  textStyle(
    BOLD
  );

  textSize(
    44
  );

  text(
    "PROJECT INFORMATION",
    x + 34,
    y + 53
  );

}


/* =========================================================
   INFORMATION LEFT COLUMN
========================================================= */

function drawInformationLeftColumn(
  x,
  y
) {

  const leftX =
    x + 34;

  const leftY =
    y + 150;

  const leftW =
    780;

  drawProjectDetailsCard(
    leftX,
    leftY,
    leftW
  );

  drawSDGCard(
    leftX,
    leftY + 380,
    leftW
  );

  drawCTACard(
    leftX,
    leftY + 580,
    leftW
  );

}


/* =========================================================
   PROJECT DETAILS CARD
========================================================= */

function drawProjectDetailsCard(
  x,
  y,
  w
) {

  fill(
    105,
    82,
    235,
    42
  );

  rect(
    x,
    y,
    w,
    350,
    14
  );

  drawCardHeading(
    "PROJECT DETAILS",
    x + 26,
    y + 24,
    C.lime
  );

  fill(
    C.white
  );

  textStyle(
    NORMAL
  );

  textSize(
    20
  );

  textLeading(
    31
  );

  const identity =
    "Name: Nguyen Tran Phuc Duong\n" +
    "Group: Ba Mien Bros\n" +
    "Group members: Nguyen Tran Phuc Duong; Ngo Dac Phu; Luong Duc Hung; Nguyen Gia Toan Phu Nghia\n" +
    "Course: COMM2754 - Digital Media Specialisation 1\n" +
    "Course time: Thursday 11.30PM\n" +
    "Affiliation: RMIT University Vietnam, Saigon South Campus, School of Communication and Design, Digital Media Program\n" +
    "Date: 24 July 2026";

  text(
    identity,
    x + 26,
    y + 66,
    w - 52,
    260
  );

}


/* =========================================================
   SDG CARD
========================================================= */

function drawSDGCard(
  x,
  y,
  w
) {

  fill(
    32,
    51,
    255,
    55
  );

  rect(
    x,
    y,
    w,
    170,
    14
  );

  drawCardHeading(
    "UN SUSTAINABLE DEVELOPMENT GOAL",
    x + 26,
    y + 24,
    C.orange
  );

  fill(
    C.white
  );

  textStyle(
    NORMAL
  );

  textSize(
    20
  );

  textLeading(
    31
  );

  text(
    "Sustainable Development Goal 7: Ensure access to affordable, reliable, sustainable and modern energy for all.",
    x + 26,
    y + 66,
    w - 52,
    95
  );

}


/* =========================================================
   CTA CARD
========================================================= */

function drawCTACard(
  x,
  y,
  w
) {

  fill(
    C.lime
  );

  rect(
    x,
    y,
    w,
    175,
    14
  );

  fill(
    C.black
  );

  textAlign(
    LEFT,
    TOP
  );

  textStyle(
    BOLD
  );

  textSize(
    17
  );

  text(
    "CALL TO ACTION",
    x + 26,
    y + 24
  );

  textSize(
    25
  );

  textLeading(
    35
  );

  text(
    "Help HEAL the planet by choosing cleaner energy & supporting a renewable future",
    x + 26,
    y + 64,
    w - 52,
    95
  );

}


/* =========================================================
   INFORMATION RIGHT COLUMN
========================================================= */

function drawInformationRightColumn(
  x,
  y
) {

  const rightX =
    x + 900;

  const rightY =
    y + 150;

  const rightW =
    865;

  drawQuoteCard(
    rightX,
    rightY,
    rightW
  );

  drawProjectBriefCard(
    rightX,
    rightY + 225,
    rightW
  );

  drawHowToPlayCard(
    rightX,
    rightY + 655,
    rightW
  );

}


/* =========================================================
   QUOTE CARD
========================================================= */

function drawQuoteCard(
  x,
  y,
  w
) {

  fill(
    105,
    82,
    235,
    42
  );

  rect(
    x,
    y,
    w,
    195,
    14
  );

  drawCardHeading(
    "QUOTE",
    x + 26,
    y + 24,
    C.pink
  );

  fill(
    C.white
  );

  textStyle(
    BOLD
  );

  textSize(
    22
  );

  textLeading(
    32
  );

  text(
    "“Clean, renewable energy is the difference between life and death.”",
    x + 26,
    y + 66,
    w - 52,
    70
  );

  fill(
    C.gray
  );

  textStyle(
    NORMAL
  );

  textSize(
    17
  );

  textLeading(
    25
  );

  text(
    "António Guterres, opening remarks to the High-level Dialogue on Energy, 24 September 2021.",
    x + 26,
    y + 132,
    w - 52,
    55
  );

}


/* =========================================================
   PROJECT BRIEF CARD
========================================================= */

function drawProjectBriefCard(
  x,
  y,
  w
) {

  fill(
    32,
    51,
    255,
    45
  );

  rect(
    x,
    y,
    w,
    400,
    14
  );

  drawCardHeading(
    "PROJECT BRIEF",
    x + 26,
    y + 24,
    C.orange
  );

  fill(
    C.white
  );

  textStyle(
    NORMAL
  );

  textSize(
    20
  );

  textLeading(
    32
  );

  const paragraph =
    "Sustainable Development Goal 7 promotes access to affordable, reliable, and sustainable energy for all. Through our HEAL concept, we show the journey from environmental damage to recovery: traditional energy causes harm, pollution weakens nature and human wellbeing, renewable energy offers a cleaner alternative, and clean energy helps bring life back to the planet. The project highlights how shifting to renewable energy can support both healthier communities and a more sustainable future.";

  text(
    paragraph,
    x + 26,
    y + 68,
    w - 52,
    300
  );

}


/* =========================================================
   HOW TO PLAY
========================================================= */

function drawHowToPlayCard(
  x,
  y,
  w
) {

  const h =
    150;

  fill(
    C.purple
  );

  rect(
    x,
    y,
    w,
    h,
    14
  );

  fill(
    C.lime
  );

  textAlign(
    LEFT,
    TOP
  );

  textStyle(
    BOLD
  );

  textSize(
    19
  );

  text(
    "HOW TO PLAY",
    x + 26,
    y + 18
  );

  drawPlayInstruction(
    "1",
    "DRAG renewable energy pieces onto Earth.",
    x + 28,
    y + 60,
    C.orange
  );

  drawPlayInstruction(
    "2",
    "TRASH darkens Earth. Click it again to remove it.",
    x + 300,
    y + 60,
    C.pink
  );

  drawPlayInstruction(
    "3",
    "COMPLETE all 3 energy pieces to bring Earth back to life.",
    x + 590,
    y + 60,
    C.lime
  );

}


/* =========================================================
   PLAY INSTRUCTION
========================================================= */

function drawPlayInstruction(
  number,
  label,
  x,
  y,
  col
) {

  fill(
    col
  );

  circle(
    x + 17,
    y + 17,
    34
  );

  fill(
    col === C.lime
      ? C.black
      : C.white
  );

  textAlign(
    CENTER,
    CENTER
  );

  textStyle(
    BOLD
  );

  textSize(
    17
  );

  text(
    number,
    x + 17,
    y + 17
  );

  fill(
    C.white
  );

  textAlign(
    LEFT,
    TOP
  );

  textSize(
    17
  );

  textLeading(
    23
  );

  text(
    label,
    x + 44,
    y - 2,
    230,
    75
  );

}


/* =========================================================
   CARD HEADING
========================================================= */

function drawCardHeading(
  label,
  x,
  y,
  col
) {

  fill(
    col
  );

  textAlign(
    LEFT,
    TOP
  );

  textStyle(
    BOLD
  );

  textSize(
    18
  );

  text(
    label,
    x,
    y
  );

}


/* =========================================================
   CURSOR
========================================================= */

function updateCursor(m) {
  if (soundPanelOpen) { cursor("default"); return; }

  if (
    infoOpen
  ) {

    cursor(
      "default"
    );

    return;

  }

  if (
    dragging
  ) {

    cursor(
      "grabbing"
    );

    return;

  }

  if (
    infoPiece &&
    pieceHovered(
      infoPiece,
      m
    )
  ) {

    cursor(
      "pointer"
    );

    return;

  }

  for (
    const p
    of [
      ...renewablePieces,
      ...trashPieces
    ]
  ) {

    if (
      !p.placed &&
      pieceHovered(
        p,
        m
      )
    ) {

      cursor(
        "grab"
      );

      return;

    }

  }

  for (
    const s
    of trashSlots
  ) {

    const pos =
      earthDisplayPoint(
        s.x,
        s.y
      );

    if (
      s.occupied &&
      dist(
        m.x,
        m.y,
        pos.x,
        pos.y
      )
      <
      68
    ) {

      cursor(
        "pointer"
      );

      return;

    }

  }

  cursor(
    "default"
  );

}


/* =========================================================
   UTILITY INPUT
========================================================= */

function handleUtilityMousePressed(
  m
) {

  for (
    let i = 0;
    i < 3;
    i++
  ) {

    if (
      !pointInRect(
        m,
        utilityButtonRect(
          i
        )
      )
    ) {

      continue;

    }

    if (
      i === 0
    ) {

      soundPanelOpen =
        !soundPanelOpen;

      infoOpen =
        false;

    }

    if (
      i === 1
    ) {

      stopAllSounds();

      regenerateScene();

      soundPanelOpen =
        false;

      infoOpen =
        false;

    }

    if (
      i === 2
    ) {

      infoOpen =
        !infoOpen;

      soundPanelOpen =
        false;

    }

    activeSoundSlider =
      -1;

    return true;

  }

  if (
    !soundPanelOpen
  ) {

    return false;

  }

  if (
    pointInRect(
      m,
      soundMuteRect()
    )
  ) {

    toggleSoundMute();

    return true;

  }

  if (
    pointInRect(
      m,
      soundRecommendedRect()
    )
  ) {

    useRecommendedMix();

    return true;

  }

  for (
    let i = 0;
    i < SOUND_DEFINITIONS.length;
    i++
  ) {

    const slider =
      soundSliderRect(
        i
      );

    const hitArea = {
      x: slider.x - 10,
      y: slider.y - slider.h / 2,
      w: slider.w + 20,
      h: slider.h
    };

    if (
      pointInRect(
        m,
        hitArea
      )
    ) {

      activeSoundSlider =
        i;

      setSoundSliderFromX(
        i,
        m.x
      );

      return true;

    }

  }

  if (
    pointInRect(
      m,
      SOUND_PANEL
    )
  ) {

    return true;

  }

  soundPanelOpen =
    false;

  return true;

}


/* =========================================================
   MOUSE PRESSED
========================================================= */

function mousePressed(event) {

  if (event?.target?.closest?.('#liven-ui, dialog')) return;
  if (soundPanelOpen) return false;

  const m =
    mouseWorld();


  if (
    infoOpen
  ) {

    return false;

  }

  advanceStory();

  if (
    infoPiece &&
    pieceHovered(
      infoPiece,
      m
    )
  ) {

    infoOpen =
      true;

    return false;

  }

  if (
    removePlacedTrash(
      m
    )
  ) {

    return false;

  }

  beginPieceDrag(
    m
  );

  return false;

}


/* =========================================================
   REMOVE TRASH
========================================================= */

function removePlacedTrash(
  m
) {

  for (
    let i =
      trashSlots.length - 1;

    i >= 0;

    i--
  ) {

    const s =
      trashSlots[i];

    if (
      !s.occupied
    ) {

      continue;

    }

    const pos =
      earthDisplayPoint(
        s.x,
        s.y
      );

    if (
      dist(
        m.x,
        m.y,
        pos.x,
        pos.y
      )
      <
      72
    ) {

      returnTrashToOrbit(
        s,
        pos
      );

      playSound(
        "trashRemove"
      );

      return true;

    }

  }

  return false;

}


/* =========================================================
   RETURN TRASH TO ORBIT
========================================================= */

function returnTrashToOrbit(
  slot,
  pos
) {

  const p =
    slot.occupied;

  slot.occupied =
    null;

  p.placed =
    false;

  p.slotType =
    null;

  p.slotIndex =
    -1;

  p.angle =
    atan2(
      (
        pos.y -
        earth.y
      )
      /
      orbitRadiusY(p),

      (
        pos.x -
        earth.x
      )
      /
      orbitRadiusX(p)
    );

}


/* =========================================================
   START DRAG
========================================================= */

function beginPieceDrag(
  m
) {

  const draggable = [
    ...trashPieces,
    ...renewablePieces
  ];

  for (
    let i =
      draggable.length - 1;

    i >= 0;

    i--
  ) {

    const p =
      draggable[i];

    if (
      p.placed ||
      !pieceHovered(
        p,
        m
      )
    ) {

      continue;

    }

    dragging =
      p;

    p.returnFlight = null;

    p.dragging =
      true;

    dragDX =
      p.x -
      m.x;

    dragDY =
      p.y -
      m.y;

    playSound(
      "dragElement"
    );

    return;

  }

}


/* =========================================================
   MOUSE DRAGGED
========================================================= */

function mouseDragged() {

  if (
    activeSoundSlider >= 0
  ) {

    const m =
      mouseWorld();

    setSoundSliderFromX(
      activeSoundSlider,
      m.x
    );

    return false;

  }

  if (
    infoOpen ||
    !dragging
  ) {

    return false;

  }

  const m =
    mouseWorld();

  dragging.x =
    m.x +
    dragDX;

  dragging.y =
    m.y +
    dragDY;

  return false;

}


/* =========================================================
   MOUSE RELEASED
========================================================= */

function mouseReleased() {

  if (
    activeSoundSlider >= 0
  ) {

    const sound =
      SOUND_DEFINITIONS[
        activeSoundSlider
      ];

    activeSoundSlider =
      -1;

    playSound(
      sound.key
    );

    return false;

  }

  if (
    infoOpen ||
    !dragging
  ) {

    return false;

  }

  const p =
    dragging;

  p.dragging =
    false;

  if (
    p.role ===
    "renewable"
  ) {

    tryRenewableDrop(
      p
    );

  }

  if (
    p.role ===
    "trash"
  ) {

    tryTrashDrop(
      p
    );

  }

  if (
    !p.placed && !p.returnFlight
  ) {

    returnPieceToOrbit(
      p
    );

    playSound(
      "wrongPlacement"
    );

  }

  dragging =
    null;

  return false;

}


/* =========================================================
   RENEWABLE DROP
========================================================= */

function tryRenewableDrop(
  p
) {

  const idx =
    renewableSlots.findIndex(
      s =>
        s.kind ===
        p.kind
    );

  const s =
    renewableSlots[idx];

  if (
    !s ||
    s.occupied
  ) {

    return;

  }

  const pos =
    earthDisplayPoint(
      s.x,
      s.y
    );

  if (
    dist(
      p.x,
      p.y,
      pos.x,
      pos.y
    )
    >
    145
  ) {

    return;

  }

  s.occupied =
    p;

  p.placed =
    true;

  p.slotType =
    "renewable";

  p.slotIndex =
    idx;

  playSound(
    earthIsRestored()
      ? "earthRestore"
      : "correctElement"
  );
  if (earthIsRestored()) playSound("celebration");

}


/* =========================================================
   TRASH DROP
========================================================= */

function tryTrashDrop(p) {
  if (dist(p.x,p.y,earth.x,earth.y) > earth.r * .98) return;
  pollutionPulse = Math.min(.72, pollutionPulse + .38);
  p.placed = false;
  p.slotType = null;
  p.slotIndex = -1;
  returnPieceToOrbit(p);
  p.returnFlight = { x: p.x, y: p.y, progress: 0 };
  playSound("trashElement");
}


/* =========================================================
   CLOSEST TRASH SLOT
========================================================= */

function closestTrashSlot(
  p
) {

  let best =
    -1;

  let bestD =
    Infinity;

  for (
    let i = 0;
    i < trashSlots.length;
    i++
  ) {

    if (
      trashSlots[i].occupied
    ) {

      continue;

    }

    const pos =
      earthDisplayPoint(
        trashSlots[i].x,
        trashSlots[i].y
      );

    const d =
      dist(
        p.x,
        p.y,
        pos.x,
        pos.y
      );

    if (
      d < bestD
    ) {

      bestD =
        d;

      best =
        i;

    }

  }

  return best;

}


/* =========================================================
   RETURN PIECE TO ORBIT
========================================================= */

function returnPieceToOrbit(
  p
) {

  p.angle =
    atan2(
      (
        p.y -
        earth.y
      )
      /
      orbitRadiusY(p),

      (
        p.x -
        earth.x
      )
      /
      orbitRadiusX(p)
    );

}


/* =========================================================
   KEYBOARD
========================================================= */

function keyPressed() {

  if (document.activeElement?.matches('input, button')) return;

  if (
    key === "i" ||
    key === "I"
  ) {

    infoOpen =
      !infoOpen;

    soundPanelOpen =
      false;

    activeSoundSlider =
      -1;

    return false;

  }

  if (
    key === "m" ||
    key === "M"
  ) {

    toggleSoundMute();

    return false;

  }

  if (
    key === "r" ||
    key === "R"
  ) {

    stopAllSounds();

    regenerateScene();

    soundPanelOpen =
      false;

    infoOpen =
      false;

    activeSoundSlider =
      -1;

    return false;

  }

  if (
    key === "s" ||
    key === "S"
  ) {

    saveCanvas(
      `Liven-${sceneSeed}`,
      "png"
    );

    return false;

  }

  if (
    keyCode === ESCAPE
  ) {

    soundPanelOpen =
      false;

    infoOpen =
      false;

    activeSoundSlider =
      -1;

    return false;

  }

}
