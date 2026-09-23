const ARTBOARD_WIDTH = 1920;
const ARTBOARD_HEIGHT = 1080;
const STAGE_LABEL = "STAGE 2";
const STAGE_NAME = "EXHAUST";
const NATURAL_OBJECT_COUNT = 32;
const BACKGROUND_OBJECT_COUNT = 10;
// Dense central-factory plume: the reference scene spreads smoke across six factories,
// so this single factory emits several puffs per cadence to match the overall smoke volume.
const SMOKE_PUFFS_PER_EMISSION = 8;
const MAX_SMOKE_PARTICLES = 96;
const SMOKE_EMISSION_INTERVAL = 0.18;
const INITIAL_BUTTON_CLEARANCE = 360;
const FOSSIL_CORE_RADIUS = 142;
const FACTORY_SCALE = 0.95;

const STACK_SANS_NOTCH_CSS_URL =
  "../../css/fonts-2026-09-22-v01.css";

const SUBTITLE = "Click the factory: fossil energy adds pollution and wears nature down.";

const PALETTE = {
  charcoal: [20, 20, 20],
  brown: [148,  70,  20],
  grey: [158, 162, 163],
  white: [255, 255, 255],
  blue: [32, 51, 255],
  purple: [105, 82, 235],
  orange: [254, 125, 33],
  lime: [179, 255, 59],
};

// Full-pollution tones sampled from code 10's palette and render formulas.
const CLEAN_PALETTE = Object.fromEntries(Object.entries(PALETTE).map(([key, rgb]) => [key, [...rgb]]));
const POLLUTED_PALETTE = {
  charcoal: [38, 36, 39], brown: [60, 47, 38], grey: [87, 83, 82],
  white: [184, 174, 159], blue: [ 60,  60, 105], purple: [78, 65, 94],
  orange: [170, 94,  40], lime: [120, 108, 56],
};
let displayedEnvironmentProgress = 0;

// Flat object colors from HARM; the interface keeps its own palette.
const OBJECT_CLEAN_PALETTE = {
  charcoal: [20, 20, 20], brown: [138, 63, 0], grey: [143, 150, 163],
  white: [244, 241, 236], blue: [41, 48, 255], purple: [255, 121, 0],
  orange: [255, 121, 0], lime: [179, 255, 54],
};
const OBJECT_PALETTE = Object.fromEntries(
  Object.entries(OBJECT_CLEAN_PALETTE).map(([key, rgb]) => [key, [...rgb]])
);


function blendPollutionColor(clean, dirty) {
  return clean.map((value, channel) => value + (dirty[channel] - value) * displayedEnvironmentProgress);
}

// Count each foreground object once after its first destructive smoke contact.
function getDestroyedObjectProgress() {
  if (naturalObjects.length === 0) return 0;
  const destroyed = naturalObjects.filter(object => object.state !== "alive").length;
  return destroyed / naturalObjects.length;
}

function updatePollutionPalette(dt = 0) {
  const target = getDestroyedObjectProgress();
  const gap = target - displayedEnvironmentProgress;
  displayedEnvironmentProgress = Math.abs(gap) < 0.0001 ? target
    : displayedEnvironmentProgress + gap * (1 - Math.exp(-dt * 2.5));
  // Mutate RGB arrays in place: existing background shapes and debris keep updating.
  for (const key of Object.keys(CLEAN_PALETTE)) {
    const rgb = blendPollutionColor(CLEAN_PALETTE[key], POLLUTED_PALETTE[key]);
    PALETTE[key].splice(0, 3, ...rgb);
  }
  for (const key of Object.keys(OBJECT_CLEAN_PALETTE)) {
    const rgb = blendPollutionColor(OBJECT_CLEAN_PALETTE[key], POLLUTED_PALETTE[key]);
    OBJECT_PALETTE[key].splice(0, 3, ...rgb);
  }
  // UI colors stay fixed; only the artwork palette responds to progress.
  updateEnvironmentProgress();
}

let canvasElement;
let fossilEnergyButton;
let informationButton;
let informationOverlay;
let informationPanelOpen = false;
let fossilEnergyHover = false;
let fossilEnergyPressed = false;
let factoryModelIndex = -1;
let artworkComplete = false;
let compositionSeed = 1;
let backgroundPatternShapes = [];
let elapsedTime = 0;
let naturalObjects = [];
let backgroundObjects = [];
let shatteredPieces = [];
let slicedHousePieces = [];
let fossilParticles = [];
let smokeEmissionTimer = 0;
let factoryTrash = [];
let pollutionBursts = [];
const BACKGROUND_FACTORIES = [
  { x: 340, y: 635, scale: .46, model: 0 },
  { x: 1500, y: 445, scale: .38, model: 1 },
  { x: 1580, y: 855, scale: .52, model: 2 },
];
let backgroundFactorySmoke = [];
let backgroundSmokeTimer = 0;
let destructionFlashes = [];
let stormStartedAt = -1;
let nextLightningAt = 0;
let lightningAt = -100;
let lightningX = 0;
let atmosphereCache = null;
let atmosphereUpdatedAt = -Infinity;
let smogTexture = null;
let lastProgressPercent = -1;
let reducedMotionPreference = null;
const POLLUTION_ASH_LIMIT = 110;
let pollutionAshSeeds = [];

let impactPopups = [];
let destroyedSincePopup = 0;
let nextPopupInterval = 3;
let impactMessageIndex = 0;
const IMPACT_MESSAGES = [
  "Trees are destroyed", "Animals are killed", "Air is polluted",
  "Soil is polluted", "Water is polluted", "Habitats are lost",
];
let subtitleFont = "Arial, sans-serif";
let figmaUiRoot = null;
let figmaSubtitleText = null;
let resetButton = null;

function loadStackSansNotch() {
  const stylesheetId = "stack-sans-notch-font";
  let fontStylesheet = document.getElementById(stylesheetId);

  const activateFont = () => {
    if (!document.fonts?.load) {
      subtitleFont = '"Stack Sans Notch", Arial, sans-serif';
      return;
    }

    document.fonts
      .load('400 22px "Stack Sans Notch"')
      .then((loadedFonts) => {
        if (loadedFonts.length > 0) {
          subtitleFont = '"Stack Sans Notch", Arial, sans-serif';
        } else {
          console.warn(
            "Stack Sans Notch was not available; using Arial instead."
          );
        }
      })
      .catch((fontLoadError) => {
        console.warn(
          "Stack Sans Notch could not be loaded; using Arial instead.",
          fontLoadError
        );
      });
  };

  if (fontStylesheet) {
    activateFont();
    return;
  }

  fontStylesheet = document.createElement("link");
  fontStylesheet.id = stylesheetId;
  fontStylesheet.rel = "stylesheet";
  fontStylesheet.href = STACK_SANS_NOTCH_CSS_URL;
  fontStylesheet.addEventListener("load", activateFont, { once: true });

  fontStylesheet.addEventListener(
    "error",
    () => {
      console.warn(
        "Stack Sans Notch stylesheet could not be loaded; using Arial instead."
      );
    },
    { once: true }
  );

  document.head.appendChild(fontStylesheet);
}

function setup() {
  loadStackSansNotch();
  reducedMotionPreference = ({matches:false,addEventListener(){}});

  const createdCanvas = createCanvas(ARTBOARD_WIDTH, ARTBOARD_HEIGHT);

  createdCanvas.attribute(
    "aria-label",
    "The factory emits harmless smoke; click to release trash that seeks and damages floating objects"
  );

  pixelDensity(1);
  frameRate(30);
  strokeJoin(MITER);
  strokeCap(SQUARE);

  canvasElement = createdCanvas.elt;
  canvasElement.style.display = "block";
  canvasElement.style.maxWidth = "none";
  canvasElement.style.maxHeight = "none";
  canvasElement.style.touchAction = "none";

  document.body.style.margin = "0";
  document.body.style.width = "100vw";
  document.body.style.height = "100vh";
  document.body.style.overflow = "hidden";
  document.body.style.display = "grid";
  document.body.style.placeItems = "center";
  document.body.style.background = "rgb(20, 20, 20)";

  createFigmaStageChrome();
  fitArtboardToWindow();
  regenerateArtwork();
  createFossilEnergyButton();
  createInformationPanel();
  createResetButton();
  createAmbienceButton();
  initializeProjectAudio();
}

function draw() {
  const dt = min(deltaTime / 1000, 0.05);

  elapsedTime += dt;
  updatePollutionPalette(dt);

  updateBackgroundObjects(dt);
  updateNaturalObjects(dt);
  updateShatteredPieces(dt);
  updateSlicedHouses(dt);
  updateFossilParticles(dt);
  updateFactoryTrash(dt);

  updateBackgroundFactorySmoke(dt);
  drawCachedAtmosphere();
  drawFossilParticles(backgroundFactorySmoke);
  drawFossilParticles();
  drawingContext.save();
  drawingContext.filter = "grayscale(1)";
  drawBackgroundObjects();
  drawingContext.restore();
  drawNaturalObjects();
  drawDamagedObjectPollution();
  drawShatteredPieces();
  drawSlicedHouses();
  drawFossilEnergyCore();
  drawFactoryTrash();
  drawPollutionEffects();
  drawDestructionFlashes();
  drawStorm();
  updateAndDrawImpactPopups(dt);

  updateFigmaSubtitle();
}

function regenerateArtwork() {
  rainWanted = false;
  stopActiveProjectSounds();
  artworkComplete = false;
  figmaUiRoot?.classList.remove("artwork-finished");
  advanceFactoryModel();
  naturalObjects = [];
  updateFactoryAvailability();
  displayedEnvironmentProgress = 0;
  updatePollutionPalette();
  compositionSeed = createSeed();
  atmosphereUpdatedAt = -Infinity;
  pollutionAshSeeds = Array.from({ length: POLLUTION_ASH_LIMIT }, (_, i) => [
    pollutionVariation(i + 1), pollutionVariation(i + 501), pollutionVariation(i + 901)
  ]);

  randomSeed(compositionSeed);
  noiseSeed(compositionSeed ^ 0x5f3759df);
  importedPollutedBackground.reset();
  impactPopups = [];
  destroyedSincePopup = 0;
  nextPopupInterval = floor(random(3, 7));
  impactMessageIndex = 0;

  elapsedTime = 0;
  naturalObjects = [];
  backgroundObjects = [];
  shatteredPieces = [];
  slicedHousePieces = [];
  fossilParticles = [];
  smokeEmissionTimer = 0;
  factoryTrash = [];
  pollutionBursts = [];
  backgroundFactorySmoke = [];
  backgroundSmokeTimer = 0;
  destructionFlashes = [];
  stormStartedAt = -1;
  nextLightningAt = 0;
  lightningAt = -100;

  fossilEnergyHover = false;
  fossilEnergyPressed = false;


  updateFigmaSubtitle();

  for (let objectIndex = 0; objectIndex < NATURAL_OBJECT_COUNT; objectIndex++) {
    const naturalObject = {};

    resetNaturalObject(naturalObject, true, objectIndex);

    naturalObjects.push(naturalObject);
  }

  for (
    let objectIndex = 0;
    objectIndex < BACKGROUND_OBJECT_COUNT;
    objectIndex++
  ) {
    const backgroundObject = {};

    resetBackgroundObject(backgroundObject, true, objectIndex);

    backgroundObjects.push(backgroundObject);
  }

  if (fossilEnergyButton) {
    restoreButtonStyle();
  }
}

function createSeed() {
  const entropy = new Uint32Array(1);

  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(entropy);
    return entropy[0];
  }

  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

// Generate once per replay so the backdrop stays steady during animation.
function regenerateBackgroundPattern() {
  backgroundPatternShapes = [];
  const bandCount = Math.floor(random(2, 5));
  for (let index = 0; index < bandCount; index++) {
    const angle = random(-Math.PI * 0.8, Math.PI * 0.8);
    const centerX = random(width * 0.05, width * 0.95);
    const centerY = height * ((index + random(0.15, 0.85)) / bandCount);
    const halfLength = random(width * 0.4, width * 0.75);
    const halfThickness = random(height * 0.04, height * 0.12);
    const skew = random(-halfLength * 0.2, halfLength * 0.2);
    const localPoints = [
      [-halfLength, -halfThickness],
      [halfLength, -halfThickness * random(0.6, 1.3)],
      [halfLength + skew, halfThickness],
      [-halfLength + skew, halfThickness * random(0.6, 1.3)],
    ];
    backgroundPatternShapes.push({
      color: index % 2 === 0 ? PALETTE.blue : PALETTE.purple,
      opacity: random(38, 60),
      points: localPoints.map(([x, y]) => [
        centerX + x * Math.cos(angle) - y * Math.sin(angle),
        centerY + x * Math.sin(angle) + y * Math.cos(angle),
      ]),
    });
  }
}

function drawBackgroundPattern() {
  noStroke();
  for (const shape of backgroundPatternShapes) {
    fill(...shape.color, shape.opacity);
    polygon(shape.points);
  }
}

/* ============================================================
   FIGMA / ZIP-DERIVED UI
============================================================ */

function createFigmaStageChrome() {
  installFigmaStage2Styles();

  if (figmaUiRoot) {
    figmaUiRoot.remove();
  }

  figmaUiRoot = document.createElement("div");

  figmaUiRoot.className = "stage2-figma-ui";

  figmaUiRoot.setAttribute("aria-label", "Stage 2 artwork interface");

  figmaUiRoot.innerHTML = `
    <div class="environment-progress" role="progressbar"
      aria-label="Environment destroyed" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
      <div class="environment-progress-label">ENVIRONMENT DESTROYED</div>
      <div class="environment-progress-value">0%</div>
      <div class="environment-progress-caption">ENVIRONMENTAL DAMAGE</div>
      <div class="environment-progress-track"><div class="environment-progress-fill"></div></div>
    </div>

    <h1 class="stage2-title">${STAGE_LABEL}: ${STAGE_NAME}</h1>

    <div
      class="stage2-subtitle is-visible"
      aria-live="polite"
    >
      <svg
        class="stage2-subtitle-panel"
        viewBox="0 0 1236 84"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 0H1236V84H0V0Z"
          fill="#E0E5E8"
        />
      </svg>

      <p class="stage2-subtitle-text"></p>
    </div>
  `;

  document.body.appendChild(figmaUiRoot);

  figmaSubtitleText = figmaUiRoot.querySelector(".stage2-subtitle-text");

  updateFigmaSubtitle();
}

function updateFigmaSubtitle() {
  if (!figmaSubtitleText) {
    return;
  }

  const nextText = SUBTITLE;

  if (figmaSubtitleText.textContent !== nextText) {
    figmaSubtitleText.textContent = nextText;

    const subtitle = figmaSubtitleText.closest(".stage2-subtitle");

    subtitle?.classList.remove("subtitle-pop");

    void subtitle?.offsetWidth;

    subtitle?.classList.add("subtitle-pop");
  }
}

function controlShellSvg() {
  return `
    <svg
      class="figma-control-shell"
      viewBox="0 0 169 159.523"
      aria-hidden="true"
    >
      <path
        d="M42.6449 33.1682L169 0V159.523H42.6449V33.1682Z"
        fill="white"
      />

      <path
        d="M36.9589 28.7458H163.314V155.101H7.26542L36.9589 28.7458Z"
        fill="black"
      />

      <path
        d="M0 19.585H152.258L141.5 132L28.7221 145.624L0 19.585Z"
        fill="currentColor"
      />
    </svg>
  `;
}

function soundIconSvg() {
  return `
    <svg
      class="figma-control-icon"
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      <path
        d="M3 12h6l7-7v22l-7-7H3Z"
        fill="currentColor"
        stroke="none"
      />

      <path
        d="M21 10c4 3 4 9 0 12m5-17c7 6 7 16 0 22"
      />
    </svg>
  `;
}

function mutedIconSvg() {
  return `
    <svg
      class="figma-control-icon"
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      <path
        d="M3 12h6l7-7v22l-7-7H3Z"
        fill="currentColor"
        stroke="none"
      />

      <path
        d="m22 12 8 8m0-8-8 8"
      />
    </svg>
  `;
}

function resetIconSvg() {
  return `
    <svg
      class="figma-control-icon"
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      <path
        d="M6 12a11 11 0 1 1 0 9M6 4v8h8"
      />
    </svg>
  `;
}

function infoIconSvg() {
  return `
    <svg
      class="figma-info-icon"
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      <path
        d="M13 3h6l-1 18h-4Z M13 25h6v6h-6Z"
        fill="currentColor"
      />
    </svg>
  `;
}

function closeIconSvg() {
  return `
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      <path
        d="m8 8 16 16m0-16L8 24"
      />
    </svg>
  `;
}

function createResetButton() {
  resetButton?.remove?.();

  installFigmaStage2Styles();

  resetButton = createButton("");

  resetButton.addClass("figma-control");

  resetButton.addClass("reset-trigger");

  resetButton.attribute("aria-label", "Reset artwork");

  resetButton.attribute("data-tooltip", "Reset artwork · R");

  resetButton.html(`${controlShellSvg()}${resetIconSvg()}`);

  if (figmaUiRoot) {
    resetButton.parent(figmaUiRoot);
  }

  resetButton.mousePressed(() => {
    regenerateArtwork();
    flashResetButton();
  });
}

function flashResetButton() {
  const face = resetButton?.elt.querySelector('.figma-control-shell');
  if (!face) return;
  for (const animation of face.getAnimations()) animation.cancel();
  face.animate([{ color: '#ff6600' }, { color: '#ff6600' }], { duration: 280 });
}

function installFigmaStage2Styles() {
  if (document.getElementById("stage2-figma-ui-styles")) {
    return;
  }

  const styleElement = document.createElement("style");

  styleElement.id = "stage2-figma-ui-styles";

  styleElement.textContent = `
    .stage2-figma-ui {
      position: fixed;
      left: 50%;
      top: 50%;
      width: 1920px;
      height: 1080px;
      z-index: 25;
      overflow: visible;
      pointer-events: none;
      transform:
        translate(-50%, -50%)
        scale(1);
      transform-origin: center;
      font-family:
        "Stack Sans Notch",
        Arial,
        sans-serif;
    }

    .environment-progress {
      position: absolute; top: 40px; right: 60px; width: 180px;
      color: #d9dadd; text-align: right; font-family: Arial, sans-serif;
    }
    .environment-progress-label { font-size: 13px; font-weight: 700; line-height: 1.2; }
    .environment-progress-value { margin-top: 3px; font-size: 26px; font-weight: 800; line-height: 1.1; }
    .environment-progress-caption { margin-top: 7px; color: #9295a5; font-size: 10px; line-height: 1.2; }
    .environment-progress-track { height: 5px; margin-top: 16px; background: #656577; }
    .environment-progress-fill { height: 100%; width: 0; background: #3433ff; }

    .stage2-title {
      position: absolute;
      left: 60px;
      top: 60px;
      margin: 0;
      color: #fff;
      font-size: 32px;
      font-weight: 700;
      line-height: 1.1;
      letter-spacing: -0.04em;
      text-transform: uppercase;
      white-space: nowrap;
      pointer-events: none;
    }

    .stage2-subtitle {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .stage2-subtitle-panel,
    .stage2-subtitle-text {
      position: absolute;
    }

    .stage2-subtitle-panel {
      left: 465.6px;
      top: 957.2px;
      width: 988.8px;
      height: 67.2px;
    }

    .stage2-subtitle-text {
      left: 493px;
      top: 964px;
      z-index: 2;
      width: 934px;
      height: 56px;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #101022;
      font-size: 22px;
      font-weight: 700;
      line-height: 1.15;
      text-align: center;
    }

    .stage2-subtitle.subtitle-pop {
      animation:
        stage2SubtitlePop
        220ms
        cubic-bezier(
          .2,
          .9,
          .25,
          1.2
        );
    }

    @keyframes stage2SubtitlePop {
      from {
        opacity: 0;
        transform:
          translateY(18px)
          scale(.98);
      }

      to {
        opacity: 1;
        transform:
          translateY(0)
          scale(1);
      }
    }

    .figma-control {
      --control-size: 82px;
      --control-face: #1d39b7;

      position: absolute !important;

      right: 52px;

      width:
        var(--control-size)
        !important;

      height:
        calc(
          var(--control-size) * .944
        )
        !important;

      z-index: 30;

      padding:
        0
        !important;

      border:
        0
        !important;

      border-radius:
        0
        !important;

      background:
        transparent
        !important;

      color:
        #fff
        !important;

      pointer-events: auto;

      isolation: isolate;

      transform-origin:
        50% 65%;

      cursor: pointer;

      transition:
        transform
        180ms
        cubic-bezier(.2,.8,.2,1),
        filter
        180ms
        ease;

      -webkit-tap-highlight-color:
        transparent;
    }

    .information-trigger {
      bottom: 38px;
    }

    .reset-trigger {
      bottom: 128px;
    }

    .ambience-trigger {
      bottom: 218px;
    }

    .figma-control:not(.reset-trigger)[aria-expanded="true"],
    .figma-control:not(.reset-trigger)[aria-pressed="true"],
    .ambience-trigger[data-muted="true"] {
      --control-face: #ff6600;
    }

    .figma-control-shell {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      color: var(--control-face);
      pointer-events: none;
    }

    .figma-control-icon {
      position: absolute;

      left: 22%;
      top: 29%;

      width: 47%;
      height: 47%;

      fill: none;

      stroke:
        currentColor;

      stroke-width: 2.4;

      stroke-linecap:
        square;

      stroke-linejoin:
        miter;

      pointer-events: none;
    }

    .figma-info-icon {
      position: absolute;

      left: 22%;
      top: 26%;

      width: 47%;
      height: 47%;

      pointer-events: none;
    }

    .figma-control::after {
  content: attr(data-tooltip);

  position: absolute;
  z-index: 40;

  /* Place tooltip to the LEFT of the button */
  right: calc(100% + 14px);
  top: 50%;

  /* Vertically center it beside the button */
  transform: translateY(-50%);

  width: max-content;
  max-width: 210px;

  padding: 7px 10px;

  background: #fff;
  color: #101022;

  box-shadow: 3px 3px 0 #000;

  font:
    600
    12px/1.3
    "Stack Sans Notch",
    Arial,
    sans-serif;

  white-space: nowrap;

  opacity: 0;
  visibility: hidden;
  pointer-events: none;

  transition:
    opacity 140ms ease,
    visibility 140ms ease;
}

    @media
      (hover: hover)
      and
      (pointer: fine)
    {
      .figma-control:not(:disabled):hover {
        transform:
          translateY(-4px)
          rotate(-3deg)
          scale(1.07);

        filter:
          brightness(1.18)
          drop-shadow(
            0
            5px
            0
            #0005
          );
      }

      .figma-control:not(:disabled):hover::after {
        opacity: 1;
        visibility: visible;
      }
    }

    .figma-control:not(:disabled):focus-visible {
      outline:
        3px solid #fff
        !important;

      outline-offset:
        4px;

      transform:
        translateY(-4px)
        rotate(-3deg)
        scale(1.07);

      filter:
        brightness(1.18)
        drop-shadow(
          0
          5px
          0
          #0005
        );
    }

    .figma-control:not(:disabled):focus-visible::after {
      opacity: 1;
      visibility: visible;
    }

    .figma-control:not(:disabled):active {
      transform:
        translateY(1px)
        scale(.96);

      filter:
        brightness(1.08);
    }

    .figma-control:disabled {
      opacity: .5;
      cursor: default;
    }

    .project-info-overlay[hidden] { display: none !important; }
    .project-info-overlay {
      position: fixed;
      inset: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      box-sizing: border-box;
      background: rgba(3, 5, 19, .88);
      font-family: "Stack Sans Notch", Arial, sans-serif;
    }
    .project-info-window {
      width: min(89.5vw, 1720px);
      max-height: calc(100dvh - 48px);
      overflow: auto;
      border-top: 6px solid #ff6600;
      border-bottom: 9px solid #b3ff3b;
      background: #e0e5e8;
      color: #11151e;
    }
    .project-info-header {
      position: sticky;
      top: 0;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      padding: clamp(20px, 1.8vw, 35px) clamp(24px, 2.4vw, 46px);
      background: #243eb5;
      color: #fff;
    }
    .project-info-header h2 {
      margin: 0;
      font: 700 clamp(26px, 2.15vw, 42px)/1.1 Arial, sans-serif;
    }
    .information-close {
      position: relative;
      flex: 0 0 50px;
      width: 50px;
      height: 54px;
      padding: 0;
      border: 0;
      background: transparent;
      color: white;
      cursor: pointer;
    }
    .information-close::before,
    .information-close::after {
      content: '';
      position: absolute;
      inset: 7px 0 0;
      background: #000;
      clip-path: polygon(8% 9%, 100% 0, 93% 90%, 0 100%);
    }
    .information-close::after {
      inset: 0 0 10px 10px;
      border-right: 3px solid white;
      border-top: 3px solid white;
      background: #243eb5;
    }
    .information-close svg {
      position: absolute;
      z-index: 1;
      inset: 8px 5px auto auto;
      width: 30px;
      height: 30px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2.4;
    }
    .information-close:hover,
    .information-close:focus-visible {
      color: #b3ff3b;
      outline: 2px solid white;
      outline-offset: 4px;
    }
    .project-info-body {
      display: flex;
      flex-direction: column;
      gap: clamp(28px, 3.4vw, 65px);
      padding: clamp(24px, 1.55vw, 30px) clamp(24px, 2.4vw, 46px) 20px;
      font-size: clamp(16px, 1.3vw, 25px);
      line-height: 1.4;
    }
    .project-info-body p { margin: 0; }
    .project-info-body a { color: #243eb5; text-decoration: underline; }
    .project-info-body a:focus-visible { outline: 2px solid #243eb5; outline-offset: 3px; }
    .project-info-footer {
      padding-top: 18px;
      border-top: 1px solid #10102226;
    }
    .project-info-credits {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      color: #373e4d;
      font-size: clamp(12px, .85vw, 16px);
      line-height: 1.4;
    }
    @media (max-width: 700px) {
      .project-info-overlay { padding: 14px; }
      .project-info-window { width: 100%; max-height: calc(100dvh - 28px); }
      .project-info-body { gap: 28px; padding: 22px; }
      .project-info-header { padding: 18px 22px; }
    }

    
  `;

  document.head.appendChild(styleElement);
}

/* ============================================================
   FOSSIL ENERGY BUTTON
============================================================ */

function createFossilEnergyButton() {
  fossilEnergyButton?.remove?.();

  fossilEnergyButton = createButton("FOSSIL ENERGY");

  fossilEnergyButton.attribute(
    "aria-label",
    "Release three pieces of homing trash"
  );

  fossilEnergyButton.style("position", "fixed");

  fossilEnergyButton.style("left", "50%");

  fossilEnergyButton.style("top", "50%");

  fossilEnergyButton.style("transform", "translate(-50%, -50%)");

  fossilEnergyButton.style("width", `${FOSSIL_CORE_RADIUS * 1.8 * FACTORY_SCALE}px`);

  fossilEnergyButton.style("height", `${FOSSIL_CORE_RADIUS * 1.8 * FACTORY_SCALE}px`);

  fossilEnergyButton.style("z-index", "20");

  fossilEnergyButton.style("border", "0");

  fossilEnergyButton.style("border-radius", "0");

  fossilEnergyButton.style("background", "transparent");

  fossilEnergyButton.style("color", "transparent");

  fossilEnergyButton.style("box-shadow", "none");

  fossilEnergyButton.style("outline", "none");

  fossilEnergyButton.style("cursor", "pointer");

  fossilEnergyButton.style("padding", "0");

  fossilEnergyButton.mouseOver(() => {
    fossilEnergyHover = true;
  });

  fossilEnergyButton.mouseOut(() => {
    fossilEnergyHover = false;

    fossilEnergyPressed = false;
  });

  fossilEnergyButton.mousePressed(launchFossilParticles);

  fitArtboardToWindow();
}

/* ============================================================
   INFORMATION PANEL
============================================================ */

function createInformationPanel() {
  informationButton?.remove?.();
  informationOverlay?.remove?.();

  installInformationPanelStyles();

  informationButton = createButton("");

  informationButton.addClass("figma-control");

  informationButton.addClass("information-trigger");

  informationButton.attribute("aria-label", "Open project information");

  informationButton.attribute("aria-controls", "project-information-panel");

  informationButton.attribute("aria-expanded", "false");

  informationButton.attribute("data-tooltip", "Exhaust research · I");

  informationButton.html(`${controlShellSvg()}${infoIconSvg()}`);

  if (figmaUiRoot) {
    informationButton.parent(figmaUiRoot);
  }

  informationButton.mousePressed(() => {
    setInformationPanelOpen(!informationPanelOpen);
  });

  informationOverlay = document.createElement("div");

  informationOverlay.className = "project-info-overlay";

  informationOverlay.id = "project-information-panel";

  informationOverlay.setAttribute("role", "dialog");

  informationOverlay.setAttribute("aria-modal", "true");

  informationOverlay.setAttribute(
    "aria-labelledby",
    "project-information-title"
  );

  informationOverlay.setAttribute("aria-hidden", "true");

  informationOverlay.hidden = true;

  informationOverlay.innerHTML = `
    <section class="project-info-window">
      <header class="project-info-header">
        <h2 id="project-information-title">Exhaust/Research</h2>
        <button class="information-close" type="button" aria-label="Close project information">
          ${closeIconSvg()}
        </button>
      </header>
      <div class="project-info-body"><section><p>The usage of fossil fuels has contributed greatly to climate change and especially global warming. The year 2024 was the hottest year ever recorded (NOAA National Centers for Environmental Information 2024). This has led to many negative outcomes, such as the rising sea water level due to melting ice in the poles, and the increase of relentless tycoons.</p><p>With the way humans are urbanizing lands and deforesting natural green spaces, the environment is also facing a loss in biodiversity. A report found that the population sizes of mammals, fish, birds, reptiles and amphibians have experienced a decline of an average of 68% between 1970 and 2016 (<a href="https://earth.org/68-decline-in-species-population-sizes/" target="_blank" rel="noopener noreferrer">Earth.org 2020</a>). Moreover, deforestation is causing the only natural defense against air pollution to crumble, with less and less trees to purify the dirty air.</p><p>Air pollution is also a very imminent aspect of what’s being destroyed by us. The continuous burning of fossil fuels from vehicles, factories and power plants releases harmful pollutants and greenhouse gases into the atmosphere, significantly reducing air quality. This not only contributes to global warming but also creates serious risks for human health.</p></section><footer class="project-info-footer">
          <div class="project-info-credits"><span>Luong Duc Hung</span><span aria-hidden="true">·</span><span>SID: S4010990</span></div>
        </footer>
      </div>
    </section>
  `;

  document.body.appendChild(informationOverlay);

  informationOverlay
    .querySelector(".information-close")
    .addEventListener("click", () => setInformationPanelOpen(false));

  informationOverlay.addEventListener("mousedown", (event) => {
    if (event.target === informationOverlay) {
      setInformationPanelOpen(false);
    }
  });

  fitArtboardToWindow();
}

function installInformationPanelStyles() {
  installFigmaStage2Styles();
}

function setInformationPanelOpen(shouldOpen) {
  if (!informationOverlay || !informationButton) {
    return;
  }

  informationPanelOpen = shouldOpen;

  informationOverlay.hidden = !shouldOpen;

  informationOverlay.setAttribute("aria-hidden", String(!shouldOpen));

  informationButton.attribute("aria-expanded", String(shouldOpen));

  if (fossilEnergyButton?.elt) {
    updateFactoryAvailability();
  }

  if (shouldOpen) {
    informationOverlay.querySelector(".information-close").focus({
      preventScroll: true,
    });
  } else {
    informationButton.elt.focus({
      preventScroll: true,
    });
  }
}

function restoreButtonStyle() {
  fossilEnergyPressed = false;
}

/* ============================================================
   PARTICLE LAUNCHING
============================================================ */

function launchFossilParticles() {
  if (getDestroyedObjectProgress() >= 1 || informationPanelOpen) return;
  updateEnvironmentProgress();
  updateFactoryAvailability();
  playProjectSound("mouseClick", 0.34);

  playProjectSound("blowPaper", 0.28);

  emitFactoryTrash();
  fossilEnergyPressed = true;

  setTimeout(restoreButtonStyle, 120);
}

/* ============================================================
   NATURAL OBJECTS
============================================================ */

function resetNaturalObject(
  naturalObject,
  initialPlacement = false,
  sequenceIndex = 0
) {
  naturalObject.sequenceIndex ??= sequenceIndex;
  sequenceIndex = naturalObject.sequenceIndex;
  naturalObject.spawnVersion = (naturalObject.spawnVersion || 0) + 1;

  const typeCycle = [
    "tree",
    "mountain",
    "pond",
    "cloud",
    "flower",
    "leaf",
    "fish",
    "tree",
    "mountain",
  ];

  // Keep six houses (using HARM's four models) and all four reference trees in every replay.
  const objectType = sequenceIndex < 6 ? "house"
    : sequenceIndex < 10 ? "tree" : typeCycle[floor(random(typeCycle.length))];

  const sizeRanges = {
    house: [105, 155],
    tree: [110, 160],
    mountain: [125, 190],
    pond: [120, 178],
    cloud: [105, 165],
    flower: [68, 108],
    leaf: [72, 118],
    fish: [88, 138],
  };

  const selectedRange = sizeRanges[objectType];

  const objectSize = random(selectedRange[0], selectedRange[1]) * 0.576;

  const rotationRanges = {
    house: [0.08, 0.18],
    tree: [0.12, 0.28],
    mountain: [0.09, 0.22],
    pond: [0.08, 0.18],
    cloud: [0.06, 0.16],
    flower: [0.22, 0.5],
    leaf: [0.48, 1.05],
    fish: [0.16, 0.38],
  };

  const selectedRotationRange = rotationRanges[objectType];

  const rotationDirection = random() < 0.5 ? -1 : 1;

  const spawnSide = initialPlacement ? sequenceIndex % 4 : floor(random(4));

  const edgeGap = objectSize * 0.8 + random(28, 92);

  let spawnX;
  let spawnY;
  let targetX;
  let targetY;

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

  naturalObject.type = objectType;

  naturalObject.size = objectSize;

  naturalObject.x = random(objectSize, width - objectSize);

  naturalObject.y = random(objectSize, height - objectSize);

  if (initialPlacement) {
    const buttonCenterX = width * 0.5;

    const buttonCenterY = height * 0.5;

    const offsetX = naturalObject.x - buttonCenterX;

    const offsetY = naturalObject.y - buttonCenterY;

    const currentDistance = sqrt(offsetX * offsetX + offsetY * offsetY);

    const requiredDistance = INITIAL_BUTTON_CLEARANCE + objectSize * 0.42;

    if (currentDistance < requiredDistance) {
      const pushAngle =
        currentDistance > 0.001
          ? atan2(offsetY, offsetX)
          : atan2(
              spawnY - buttonCenterY,

              spawnX - buttonCenterX
            );

      naturalObject.x = buttonCenterX + cos(pushAngle) * requiredDistance;

      naturalObject.y = buttonCenterY + sin(pushAngle) * requiredDistance;
    }
  }

  naturalObject.speed = travelSpeed;

  naturalObject.vx = cos(travelAngle) * travelSpeed;

  naturalObject.vy = sin(travelAngle) * travelSpeed;

  naturalObject.floatStrength = random(10, 24);

  naturalObject.floatFrequency = random(0.24, 0.52);

  naturalObject.rotation = random(-0.12, 0.12);

  naturalObject.rotationSpeed =
    random(selectedRotationRange[0], selectedRotationRange[1]) *
    rotationDirection;

  naturalObject.phase = random(1000);

  naturalObject.variant = random();
  naturalObject.modelIndex = objectType === "house" ? sequenceIndex % 6
    : sequenceIndex >= 6 && sequenceIndex < 10 ? sequenceIndex - 6 : floor(random(4));

  naturalObject.state = "alive";
  containArtworkObject(naturalObject);
}

function resetBackgroundObject(
  backgroundObject,
  initialPlacement = false,
  sequenceIndex = 0
) {
  resetNaturalObject(
    backgroundObject,
    initialPlacement,
    sequenceIndex % NATURAL_OBJECT_COUNT
  );

  const depthScale = random(0.36, 0.56);

  const depthSpeed = random(0.48, 0.68);

  backgroundObject.size *= depthScale;

  backgroundObject.speed *= depthSpeed;

  backgroundObject.vx *= depthSpeed;

  backgroundObject.vy *= depthSpeed;

  backgroundObject.floatStrength *= 0.42;

  backgroundObject.rotationSpeed *= 0.58;
}

function moveFloatingObject(naturalObject, dt) {
  const floatPhase =
    elapsedTime * naturalObject.floatFrequency + naturalObject.phase;

  naturalObject.x +=
    (naturalObject.vx + cos(floatPhase) * naturalObject.floatStrength) * dt;

  naturalObject.y +=
    (naturalObject.vy +
      sin(floatPhase * 1.31 + naturalObject.phase * 0.17) *
        naturalObject.floatStrength) *
    dt;

  naturalObject.rotation += naturalObject.rotationSpeed * dt;
  containArtworkObject(naturalObject);
}

// Objects belong to a fixed scene: only regenerateArtwork creates a new set.
function updateBackgroundObjects(dt) {
  backgroundObjects.forEach(object => moveFloatingObject(object, dt));
}

function updateNaturalObjects(dt) {
  naturalObjects.forEach(object => {
    if (object.state !== "shattered" && object.state !== "sliced") moveFloatingObject(object, dt);
  });
}

// Leave enough room for each silhouette to rotate without crossing the canvas edge.
function containArtworkObject(object, sizeFactor = 1) {
  const radius = Math.min(object.size * sizeFactor, width / 2, height / 2);
  const minSpeed = (object.floatStrength || 0) + 10;
  if (object.x <= radius) object.vx = Math.max(Math.abs(object.vx), minSpeed);
  else if (object.x >= width - radius) object.vx = -Math.max(Math.abs(object.vx), minSpeed);
  if (object.y <= radius) object.vy = Math.max(Math.abs(object.vy), minSpeed);
  else if (object.y >= height - radius) object.vy = -Math.max(Math.abs(object.vy), minSpeed);
  object.x = Math.max(radius, Math.min(width - radius, object.x));
  object.y = Math.max(radius, Math.min(height - radius, object.y));
}

/* ============================================================
   FOSSIL PARTICLE UPDATES
============================================================ */

// Smoke is purely visual, emitted continuously and removed after leaving the canvas.
function updateFossilParticles(dt) {
  smokeEmissionTimer -= dt;
  while (smokeEmissionTimer <= 0) {
    emitAmbientSmoke();
    smokeEmissionTimer += 3.2 / 3.75;
  }
  fossilParticles = advanceFactorySmoke(dt, fossilParticles);
}

function advanceFactorySmoke(dt, particles) {
  const smooth = value => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
  const wind = (noise(compositionSeed * .00017 + 17.3, elapsedTime * .024) - .5) * .20
    + Math.sin(elapsedTime * .04 + compositionSeed * .0003) * .03;
  for (const particle of particles) {
    particle.age += dt;
    const lifeN = Math.min(1, particle.age / particle.life);
    const rise = Math.max(0, particle.originY - particle.y);
    const windMix = smooth((rise - 18) / 132);
    const highMix = smooth((rise - 110) / 210);
    const shared = (noise(particle.plumeSeed * .0017, elapsedTime * .062 + rise * .0012) - .5) * 2;
    const micro = (noise(particle.wanderSeed * .0019 + 8.2, elapsedTime * .10) - .5) * 2;
    if (!particle.exiting) {
      const targetVX = (wind * (.10 + windMix * .86) + particle.plumeBias * windMix
        + shared * (.018 + highMix * .060) + micro * .010) * 60;
      const targetVY = (-1.08 + .74 * smooth((lifeN - .08) / .78)) * 60;
      particle.vx += (targetVX - particle.vx) * Math.min(1, dt * (.92 + .43 * windMix));
      particle.vy += (targetVY - particle.vy) * Math.min(1, dt * 1.22);
    }
    particle.x += particle.vx * dt;
    particle.y += (particle.vy + micro * .012 * highMix * 60) * dt;
    const growth = Math.min(1, (1 - Math.exp(-lifeN * 2.8)) / .93919);
    particle.size = particle.baseSize + (particle.maxSize - particle.baseSize) * growth;
    particle.rotation = particle.baseRotation + shared * .045 + micro * .016;
    if (particle.x < 0 || particle.x > width || particle.y < 0 || particle.y > height) particle.exiting = true;
  }
  return particles.filter(particle => {
    const radius = particle.size * 1.7;
    return particle.age < particle.life && particle.x > -radius && particle.x < width + radius &&
      particle.y > -radius && particle.y < height + radius;
  });
}

/* ============================================================
   DAMAGE TRANSFORMATIONS
============================================================ */

function transformNaturalObject(naturalObject) {
  if (naturalObject.state !== "alive") return "died";
  emitPollutionBurst(naturalObject);
  destructionFlashes.push({x:naturalObject.x, y:naturalObject.y, size:naturalObject.size, born:elapsedTime});
  if (destructionFlashes.length > 16) destructionFlashes.shift();
  if (random() < .85) {
    naturalObject.state = "shattered";
    createShatteredPieces(naturalObject);
    return "exploded";
  }
  if (naturalObject.type === "house") {
    createSlicedHouse(naturalObject);
    naturalObject.state = "sliced";
    return "exploded";
  }
  const damagedStates = {
    house: "ruined",
    tree: "dead",
    mountain: "ruined",
    pond: "polluted",
    cloud: "smog",
    flower: "wilted",
    leaf: "withered",
    fish: "skeleton",
  };

  naturalObject.state = damagedStates[naturalObject.type];

  return "died";
}

function createShatteredPieces(naturalObject) {
  const pieceColors = {
    house: [OBJECT_PALETTE.blue, OBJECT_PALETTE.purple, OBJECT_PALETTE.orange, OBJECT_PALETTE.lime],
    tree: [OBJECT_PALETTE.charcoal, OBJECT_PALETTE.grey, OBJECT_PALETTE.orange],

    mountain: [OBJECT_PALETTE.blue, OBJECT_PALETTE.grey, OBJECT_PALETTE.charcoal, OBJECT_PALETTE.orange],

    pond: [OBJECT_PALETTE.blue, OBJECT_PALETTE.charcoal, OBJECT_PALETTE.orange],

    cloud: [OBJECT_PALETTE.white, OBJECT_PALETTE.grey, OBJECT_PALETTE.charcoal],

    flower: [OBJECT_PALETTE.white, OBJECT_PALETTE.orange, OBJECT_PALETTE.charcoal],

    leaf: [OBJECT_PALETTE.lime, OBJECT_PALETTE.orange, OBJECT_PALETTE.charcoal],

    fish: [OBJECT_PALETTE.blue, OBJECT_PALETTE.grey, OBJECT_PALETTE.charcoal],
  };

  const availableColors = pieceColors[naturalObject.type];

  const pieceCount = floor(random(28, 43));

  for (let pieceIndex = 0; pieceIndex < pieceCount; pieceIndex++) {
    shatteredPieces.push({
      x:
        naturalObject.x +
        random(
          -naturalObject.size * 0.34,

          naturalObject.size * 0.34
        ),

      y:
        naturalObject.y +
        random(
          -naturalObject.size * 0.3,

          naturalObject.size * 0.3
        ),

      vx: random(-190, 190),

      vy: random(-190, 65) + naturalObject.speed * 0.24,

      gravity: random(85, 145),

      size: random(
        naturalObject.size * 0.045,

        naturalObject.size * 0.15
      ),

      rotation: random(TWO_PI),

      rotationSpeed: random(-2.2, 2.2),

      fillColor: availableColors[pieceIndex % availableColors.length],

      life: random(2.8, 4.6),
    });
  }

  if (shatteredPieces.length > 720) {
    shatteredPieces.splice(0, shatteredPieces.length - 720);
  }
}

function updateShatteredPieces(dt) {
  shatteredPieces.forEach((shatteredPiece) => {
    shatteredPiece.x += shatteredPiece.vx * dt;

    shatteredPiece.y += shatteredPiece.vy * dt;

    shatteredPiece.vy += shatteredPiece.gravity * dt;

    shatteredPiece.rotation += shatteredPiece.rotationSpeed * dt;

    containArtworkObject(shatteredPiece);
    shatteredPiece.life -= dt;
  });

  shatteredPieces = shatteredPieces.filter(
    (shatteredPiece) =>
      shatteredPiece.life > 0
  );
}

/* ============================================================
   DRAW NATURAL OBJECTS
============================================================ */

function drawNaturalObjects() {
  naturalObjects.forEach((naturalObject) => {
    if (naturalObject.state === "shattered" || naturalObject.state === "sliced") {
      return;
    }

    push();

    translate(naturalObject.x, naturalObject.y);

    rotate(naturalObject.rotation);

    if (naturalObject.type === "house") {
      drawHouse(naturalObject);
    } else if (naturalObject.type === "tree") {
      drawTree(naturalObject);
    } else if (naturalObject.type === "mountain") {
      drawMountain(naturalObject);
    } else if (naturalObject.type === "pond") {
      drawPond(naturalObject);
    } else if (naturalObject.type === "cloud") {
      drawCloud(naturalObject);
    } else if (naturalObject.type === "flower") {
      drawFlower(naturalObject);
    } else if (naturalObject.type === "leaf") {
      drawLeaf(naturalObject);
    } else if (naturalObject.type === "fish") {
      drawFish(naturalObject);
    }

    pop();
  });
}

function drawBackgroundObjects() {
  backgroundObjects.forEach((backgroundObject) => {
    push();

    translate(backgroundObject.x, backgroundObject.y);

    rotate(backgroundObject.rotation);

    drawBackgroundObjectSilhouette(backgroundObject);

    pop();
  });
}

function drawBackgroundObjectSilhouette(backgroundObject) {
  const objectSize = backgroundObject.size;

  const backgroundColor = [...OBJECT_PALETTE.grey, 82];

  noStroke();

  fill(...backgroundColor);

  if (backgroundObject.type === "house") {
    drawHouse(backgroundObject, true);
  } else if (backgroundObject.type === "tree") {
    drawTree(backgroundObject, true);
  } else if (backgroundObject.type === "mountain") {
    polygon([
      [-objectSize * 0.58, objectSize * 0.38],
      [-objectSize * 0.26, objectSize * 0.02],
      [0, -objectSize * 0.52],
      [objectSize * 0.22, -objectSize * 0.06],
      [objectSize * 0.58, objectSize * 0.38],
    ]);
  } else if (backgroundObject.type === "pond") {
    polygon(
      makeAngularBlobPoints(
        0,
        0,
        objectSize * 0.58,
        objectSize * 0.22,
        backgroundObject.phase,
        14
      )
    );
  } else if (backgroundObject.type === "cloud") {
    polygon([
      [-objectSize * 0.58, objectSize * 0.18],
      [-objectSize * 0.48, -objectSize * 0.05],
      [-objectSize * 0.28, -objectSize * 0.14],
      [-objectSize * 0.12, -objectSize * 0.42],
      [objectSize * 0.12, -objectSize * 0.3],
      [objectSize * 0.28, -objectSize * 0.18],
      [objectSize * 0.5, -objectSize * 0.06],
      [objectSize * 0.58, objectSize * 0.18],
    ]);
  } else if (backgroundObject.type === "flower") {
    stroke(...backgroundColor);

    strokeWeight(max(2, objectSize * 0.045));

    line(0, objectSize * 0.48, 0, -objectSize * 0.15);

    noStroke();

    push();

    translate(0, -objectSize * 0.22);

    for (let petalIndex = 0; petalIndex < 5; petalIndex++) {
      push();

      rotate((petalIndex * TWO_PI) / 5);

      polygon([
        [0, 0],

        [-objectSize * 0.12, -objectSize * 0.22],

        [0, -objectSize * 0.4],

        [objectSize * 0.12, -objectSize * 0.22],
      ]);

      pop();
    }

    pop();
  } else if (backgroundObject.type === "leaf") {
    polygon([
      [-objectSize * 0.52, 0],
      [-objectSize * 0.2, -objectSize * 0.35],
      [objectSize * 0.45, -objectSize * 0.18],
      [objectSize * 0.58, 0],
      [objectSize * 0.12, objectSize * 0.34],
      [-objectSize * 0.28, objectSize * 0.25],
    ]);
  } else if (backgroundObject.type === "fish") {
    polygon([
      [-objectSize * 0.48, 0],
      [-objectSize * 0.22, -objectSize * 0.28],
      [objectSize * 0.28, -objectSize * 0.2],
      [objectSize * 0.5, 0],
      [objectSize * 0.25, objectSize * 0.22],
      [-objectSize * 0.22, objectSize * 0.28],
    ]);

    polygon([
      [-objectSize * 0.44, 0],
      [-objectSize * 0.7, -objectSize * 0.25],
      [-objectSize * 0.65, objectSize * 0.26],
    ]);
  }
}

/* ============================================================
   TREE
============================================================ */

// HARM tree geometry adapted to the floating Stage 2 object coordinates.
function referenceTreeColor(base, health, damage) {
  return lerpColor(color(base), color('#2B2C31'),
    constrain((1 - health) * .14 + damage * .10, 0, .22));
}

function drawTree(object, distant = false) {
  const v = object.modelIndex % 4;
  const health = object.state === "alive" ? 1 : 0;
  const damage = 1 - health;
  const t = object;
  const withFormPart = (_, part, drawPart) => {
    if (part === 0 || health > 0) drawPart(1);
  };
  push();
  scale(object.size / 184);
  translate(-7, 92);
  if (distant) drawingContext.globalAlpha *= 82 / 255;
  noStroke();
  withFormPart(t, 0, q => {
    const trunk = lerpColor(color('#8A3F00'), color('#3E2412'), constrain((1 - health) * .24 + damage * .34, 0, .52));
    fill(trunk);
    if (v === 3) {
      polygon([[-14,0],[-12,-56*q],[-28*q,-92*q],[-18*q,-98*q],[-4,-76*q],[14*q,-120*q],[26*q,-114*q],[12,-66*q],[12,0]]);
    } else if (v === 1) {
      polygon([[-10,0],[-6,-112*q],[6,-112*q],[10,0]]);
    } else {
      polygon([[-10,0],[-6,-108*q],[5,-108*q],[10,0]]);
    }
  });

  if (v === 0) {
    const c = referenceTreeColor('#2930FF', health, damage);
    withFormPart(t, 1, q => { fill(c); push(); scale(q); polygon([[-50,-98],[-6,-158],[44,-106]]);  pop(); });
    withFormPart(t, 2, q => { fill(c); push(); scale(q); polygon([[-60,-70],[-5,-128],[56,-78]]);  pop(); });
    withFormPart(t, 3, q => { fill(c); push(); scale(q); polygon([[-64,-42],[0,-101],[60,-48]]);  pop(); });
  } else if (v === 1) {
    const c = referenceTreeColor('#FF7900', health, damage);
    withFormPart(t, 1, q => { fill(c); push(); translate(-20, -100); scale(q); polygon([[-42,14],[-34,-26],[-6,-46],[30,-30],[42,8],[16,40],[-20,38]]);  pop(); });
    withFormPart(t, 2, q => { fill(c); push(); translate(9, -142); scale(q); polygon([[-34,16],[-26,-32],[12,-42],[38,-8],[24,30],[-8,38]]);  pop(); });
    withFormPart(t, 3, q => { fill(c); push(); translate(38, -105); scale(q); polygon([[-28,-20],[4,-36],[34,-8],[22,30],[-16,34],[-34,8]]);  pop(); });
  } else if (v === 2) {
    const c = referenceTreeColor('#B3FF36', health, damage);
    withFormPart(t, 1, q => { fill(c); push(); scale(q); polygon([[-48,-116],[-18,-158],[36,-148],[48,-108],[-12,-96]]);  pop(); });
    withFormPart(t, 2, q => { fill(c); push(); scale(q); polygon([[-60,-82],[-24,-118],[38,-102],[58,-68],[12,-52],[-48,-58]]);  pop(); });
    withFormPart(t, 3, q => { fill(c); push(); scale(q); polygon([[-46,-48],[-12,-80],[38,-66],[48,-34],[-10,-26]]);  pop(); });
  } else {
    const c = referenceTreeColor('#B3FF36', health, damage);
    withFormPart(t, 1, q => { fill(c); push(); translate(24, -118); scale(q); polygon([[-22,-34],[34,-44],[64,-8],[46,34],[-12,22]]);  pop(); });
    withFormPart(t, 2, q => { fill(c); push(); translate(-38, -90); scale(q); polygon([[-30,-18],[-4,-42],[30,-24],[34,12],[8,28],[-28,18]]);  pop(); });
    withFormPart(t, 3, q => { fill(c); push(); translate(54, -66); scale(q * .66); polygon([[-18,-16],[8,-24],[24,-4],[14,18],[-14,14],[-24,-2]]);  pop(); });
  }

  pop();
}

function createSlicedHouse(object) {
  const reducedMotion = typeof window !== "undefined" &&
    false;
  for (const side of [-1, 1]) {
    slicedHousePieces.push({
      house: { ...object, state: "alive" }, side, age: 0,
      size: object.size, x: object.x, y: object.y, rotation: object.rotation,
      vx: (object.vx || 0) * .35 + Math.cos(object.rotation) * side * 55,
      vy: (object.vy || 0) * .35 + Math.sin(object.rotation) * side * 55 - 18,
      spin: side * .55, reducedMotion,
    });
  }
}

function updateSlicedHouses(dt) {
  for (const piece of slicedHousePieces) {
    piece.age += dt;
    if (!piece.reducedMotion) {
      piece.vy += 48 * dt;
      piece.x += piece.vx * dt;
      piece.y += piece.vy * dt;
      piece.rotation += piece.spin * dt;
      containArtworkObject(piece);
    }
  }
  slicedHousePieces = slicedHousePieces.filter(piece => piece.age < 3);
}

function drawSlicedHouses() {
  for (const piece of slicedHousePieces) {
    push();
    translate(piece.x, piece.y);
    rotate(piece.rotation);
    const ctx = drawingContext;
    ctx.save();
    ctx.globalAlpha *= Math.max(0, Math.min(1, (3 - piece.age) / 1.2));
    // Clip the original model at its center: both pieces preserve the actual
    // roof, chimney and windows of every house variant.
    const extent = piece.size * 1.2;
    ctx.beginPath();
    ctx.rect(piece.side < 0 ? -extent : 0, -extent, extent, extent * 2);
    ctx.clip();
    drawHouse(piece.house);
    ctx.restore();
    pop();
  }
}

function housePalette(v, soot = 0, damage = 0) {
  const i = ((v % 4) + 4) % 4;
  const defs = [
    { body: '#2930FF', roofA: '#FF7900' },
    { body: '#B3FF36', roofA: '#2930FF' },
    { body: '#FF7900', roofA: '#141414' },
    { body: '#FF2424', roofA: '#141414' }
  ];
  const d = defs[i];
  const grime = constrain(soot * .42 + damage * .24, 0, .34);
  return {
    body: lerpColor(color(d.body), color('#5F534C'), grime),
    roofA: lerpColor(color(d.roofA), color('#5A4E48'), grime * .62),
    roofB: lerpColor(color(d.roofA), color('#5A4E48'), grime * .62),
    cutout: lerpColor(color('#F6F0E8'), color('#D9CCBE'), grime * .44)
  };
}

function houseFeatureLayout(v) {
  const i = ((v % 4) + 4) % 4;
  if (i === 1) return { w1: [-20,-24,18,16],   w2:[0,0,0,0],      door:[24,-13,14,26], cap:[0,0,0,0] };
  if (i === 2) return { w1: [14,-35,14,18],  w2:[0,0,0,0],      door:[0,0,0,0],      cap:[0,0,0,0] };
  if (i === 3) return { w1: [-4,-22,18,16],  w2:[0,0,0,0],      door:[-28,-18,16,18], cap:[0,0,0,0] };
  return { w1: [12,-30,14,20], w2:[0,0,0,0], door:[0,0,0,0], cap:[0,0,0,0] };
}

function drawHouseRoof(v, palette, glowCharge = 0, damage = 0) {
  const i = ((v % 4) + 4) % 4;
  const heatBoost = constrain(glowCharge * .18 + damage * .08, 0, .24);
  const roofA = lerpColor(palette.roofA, color('#FF8B2B'), heatBoost);

  if (i === 0) {
    fill(roofA);
    polygon([[-56,-40],[-4,-76],[50,-44],[44,-36],[-4,-60],[-48,-34]]);
  } else if (i === 1) {
    fill(roofA);
    polygon([[-50,-42],[-2,-70],[56,-58],[56,-42]]);
  } else if (i === 2) {
    fill(roofA);
    polygon([[-34,-34],[16,-78],[46,-52],[38,-44],[16,-62],[-24,-28]]);
  } else {
    fill(roofA);
    polygon([[-50,-32],[6,-58],[58,-12],[46,-10],[4,-40],[-42,-24]]);
  }
}

function drawHouseCutouts(v, palette, glowCharge, damage, soot, ft, cutShift = 0) {
  const warmWin = lerpColor(palette.cutout, color(255, 212, 132), constrain(glowCharge * 1.15, 0, 1));
  const warm = lerpColor(warmWin, color('#2B2C31'), damage * .12);
  const neutral = lerpColor(palette.cutout, color(90, 74, 56), constrain(soot * .22 + damage * .34, 0, 1));

  if (ft.w1[2] > 0) {
    fill(warm);
    push();
    translate(ft.w1[0], ft.w1[1] + cutShift * .22);
    const w = ft.w1[2] / 2, h = ft.w1[3] / 2;
    polygon([[-w,-h],[w,-h*.78],[w*.78,h],[-w,h*.8]]);
    pop();
  }
  if (ft.door[2] > 0) {
    fill(neutral);
    rect(ft.door[0], ft.door[1], ft.door[2], ft.door[3]);
  }
}

function houseBody(v) {
  const i = ((v % 4) + 4) % 4;
  if (i === 1) {
    // Low wide house with slanted roof, based on the user's reference board.
    polygon([[-56,0],[-50,-42],[50,-42],[56,0]]); } else if (i === 2) {
    // Tall slim house.
    polygon([[-28,0],[-28,-34],[-8,-50],[18,-66],[38,-50],[42,0]]); } else if (i === 3) {
    // Asymmetric wedge-like house.
    polygon([[-48,0],[-42,-30],[4,-42],[48,-12],[52,0]]); } else {
    // Clean skewed blue house.
    polygon([[-50,0],[-50,-42],[-4,-58],[44,-42],[44,0]]); }
}

function houseChimney(v) {
  return [{x:24,top:-78,bottom:-36},{x:34,top:-78,bottom:-35},
    {x:26,top:-87,bottom:-42},{x:22,top:-67,bottom:-20}][((v%4)+4)%4];
}

function drawHouse(object, distant = false) {
  const model = object.modelIndex % 4;
  const damage = object.state === "alive" ? 0 : 1;
  const soot = displayedEnvironmentProgress;
  const palette = housePalette(model, soot, damage);
  const ft = houseFeatureLayout(model);
  push();
  // Center HARM's ground-anchored house inside the existing collision bounds.
  scale(object.size / 112);
  translate(0, 39);
  if (distant) drawingContext.globalAlpha *= 82 / 255;
  noStroke();
  rectMode(CENTER);
  const chimney = houseChimney(model);
  fill(palette.cutout);
  rect(chimney.x, (chimney.top + chimney.bottom) / 2, 10, chimney.bottom - chimney.top);
  fill(palette.roofA);
  rect(chimney.x, chimney.top, 15, 5);
  fill(palette.body);
  houseBody(model);
  drawHouseRoof(model, palette, 0, damage);
  drawHouseCutouts(model, palette, 0, damage, soot, ft);
  if (damage) {
    stroke(...OBJECT_PALETTE.charcoal);
    strokeWeight(2);
    noFill();
    beginShape();
    vertex(4, -42); vertex(-6, -26); vertex(8, -15); vertex(1, 0);
    endShape();
  }
  pop();
}

function drawMountain(naturalObject) {
  const objectSize = naturalObject.size;

  const ruined = naturalObject.state === "ruined";

  const bodyColor = ruined
    ? naturalObject.variant < 0.5
      ? OBJECT_PALETTE.grey
      : OBJECT_PALETTE.charcoal
    : naturalObject.variant < 0.5
    ? OBJECT_PALETTE.blue
    : OBJECT_PALETTE.purple;

  const mountainPoints = [
    [-objectSize * 0.58, objectSize * 0.38],
    [-objectSize * 0.26, objectSize * 0.02],
    [0, -objectSize * 0.52],
    [objectSize * 0.22, -objectSize * 0.06],
    [objectSize * 0.58, objectSize * 0.38],
  ];

  drawOffsetPolygon(mountainPoints, bodyColor, 6);

  fill(...(ruined ? OBJECT_PALETTE.grey : OBJECT_PALETTE.white));

  polygon([
    [0, -objectSize * 0.52],
    [-objectSize * 0.15, -objectSize * 0.2],
    [-objectSize * 0.03, -objectSize * 0.27],
    [objectSize * 0.08, -objectSize * 0.17],
    [objectSize * 0.18, -objectSize * 0.16],
  ]);

  if (ruined) {
    stroke(...OBJECT_PALETTE.orange);

    strokeWeight(max(2, objectSize * 0.025));

    line(0, -objectSize * 0.47, -objectSize * 0.05, -objectSize * 0.08);

    line(
      -objectSize * 0.05,
      -objectSize * 0.08,
      objectSize * 0.12,
      objectSize * 0.16
    );

    line(
      -objectSize * 0.05,
      -objectSize * 0.08,
      -objectSize * 0.24,
      objectSize * 0.08
    );

    noStroke();
  }
}

/* ============================================================
   POND
============================================================ */

function drawPond(naturalObject) {
  const objectSize = naturalObject.size;

  const polluted = naturalObject.state === "polluted";

  const pondPoints = makeAngularBlobPoints(
    0,
    0,
    objectSize * 0.58,
    objectSize * 0.22,
    naturalObject.phase,
    14
  );

  noStroke();

  fill(...(polluted ? OBJECT_PALETTE.charcoal : OBJECT_PALETTE.blue));

  polygon(pondPoints);

  if (!polluted) {
    stroke(...OBJECT_PALETTE.white);

    strokeWeight(max(1.5, objectSize * 0.025));

    line(
      -objectSize * 0.34,
      -objectSize * 0.06,
      objectSize * 0.25,
      -objectSize * 0.06
    );

    line(
      -objectSize * 0.22,
      objectSize * 0.04,
      objectSize * 0.36,
      objectSize * 0.04
    );

    noStroke();
  } else {
    fill(...OBJECT_PALETTE.orange, 155);

    polygon(
      makeAngularBlobPoints(
        objectSize * 0.08,
        0,
        objectSize * 0.31,
        objectSize * 0.1,
        naturalObject.phase + 30,
        9
      )
    );

    fill(...OBJECT_PALETTE.grey);

    polygon(
      makeAngularBlobPoints(
        -objectSize * 0.12,
        objectSize * 0.02,
        objectSize * 0.13,
        objectSize * 0.055,
        naturalObject.phase + 60,
        7
      )
    );
  }
}

/* ============================================================
   CLOUD
============================================================ */

function drawCloud(naturalObject) {
  const objectSize = naturalObject.size;

  const smog = naturalObject.state === "smog";

  const cloudColor = smog ? OBJECT_PALETTE.grey : OBJECT_PALETTE.white;

  const cloudPoints = [
    [-objectSize * 0.58, objectSize * 0.18],
    [-objectSize * 0.48, -objectSize * 0.05],
    [-objectSize * 0.28, -objectSize * 0.14],
    [-objectSize * 0.12, -objectSize * 0.42],
    [objectSize * 0.12, -objectSize * 0.3],
    [objectSize * 0.28, -objectSize * 0.18],
    [objectSize * 0.5, -objectSize * 0.06],
    [objectSize * 0.58, objectSize * 0.18],
  ];

  drawOffsetPolygon(cloudPoints, cloudColor, 5);

  if (smog) {
    fill(...OBJECT_PALETTE.orange);

    polygon([
      [-objectSize * 0.28, objectSize * 0.08],
      [objectSize * 0.35, objectSize * 0.03],
      [objectSize * 0.24, objectSize * 0.18],
      [-objectSize * 0.16, objectSize * 0.2],
    ]);
  }
}

/* ============================================================
   FLOWER
============================================================ */

function drawFlower(naturalObject) {
  const objectSize = naturalObject.size;

  const wilted = naturalObject.state === "wilted";

  push();

  if (wilted) {
    rotate(0.55);
  }

  stroke(...(wilted ? OBJECT_PALETTE.grey : OBJECT_PALETTE.lime));

  strokeWeight(max(3, objectSize * 0.045));

  line(0, objectSize * 0.48, 0, -objectSize * 0.15);

  noStroke();

  push();

  translate(
    wilted ? objectSize * 0.1 : 0,

    -objectSize * 0.22
  );

  for (let petalIndex = 0; petalIndex < 5; petalIndex++) {
    push();

    rotate((petalIndex * TWO_PI) / 5 + (wilted ? 0.25 : 0));

    fill(...(wilted ? OBJECT_PALETTE.grey : OBJECT_PALETTE.white));

    polygon([
      [0, 0],

      [-objectSize * 0.12, -objectSize * 0.22],

      [0, -objectSize * (wilted ? 0.24 : 0.4)],

      [objectSize * 0.12, -objectSize * 0.22],
    ]);

    pop();
  }

  fill(...(wilted ? OBJECT_PALETTE.charcoal : OBJECT_PALETTE.orange));

  polygon([
    [0, -objectSize * 0.1],
    [objectSize * 0.1, 0],
    [0, objectSize * 0.1],
    [-objectSize * 0.1, 0],
  ]);

  pop();
  pop();
}

/* ============================================================
   LEAF
============================================================ */

function drawLeaf(naturalObject) {
  const objectSize = naturalObject.size;

  const withered = naturalObject.state === "withered";

  if (withered) {
    rotate(0.38);
  }

  const leafPoints = [
    [-objectSize * 0.52, 0],
    [-objectSize * 0.2, -objectSize * 0.35],
    [objectSize * 0.45, -objectSize * 0.18],
    [objectSize * 0.58, 0],
    [objectSize * 0.12, objectSize * 0.34],
    [-objectSize * 0.28, objectSize * 0.25],
  ];

  drawOffsetPolygon(
    leafPoints,

    withered ? OBJECT_PALETTE.orange : OBJECT_PALETTE.lime,

    5
  );

  stroke(...(withered ? OBJECT_PALETTE.charcoal : OBJECT_PALETTE.white));

  strokeWeight(max(2, objectSize * 0.035));

  line(-objectSize * 0.42, 0, objectSize * 0.43, -objectSize * 0.02);

  line(-objectSize * 0.08, 0, objectSize * 0.12, -objectSize * 0.2);

  line(
    objectSize * 0.12,
    -objectSize * 0.02,
    objectSize * 0.3,
    objectSize * 0.14
  );

  noStroke();
}

/* ============================================================
   FISH
============================================================ */

function drawFish(naturalObject) {
  const objectSize = naturalObject.size;

  const skeleton = naturalObject.state === "skeleton";

  if (!skeleton) {
    drawOffsetPolygon(
      [
        [-objectSize * 0.48, 0],
        [-objectSize * 0.22, -objectSize * 0.28],
        [objectSize * 0.28, -objectSize * 0.2],
        [objectSize * 0.5, 0],
        [objectSize * 0.25, objectSize * 0.22],
        [-objectSize * 0.22, objectSize * 0.28],
      ],

      OBJECT_PALETTE.blue,
      5
    );

    fill(...OBJECT_PALETTE.purple);

    polygon([
      [-objectSize * 0.44, 0],
      [-objectSize * 0.7, -objectSize * 0.25],
      [-objectSize * 0.65, objectSize * 0.26],
    ]);

    fill(...OBJECT_PALETTE.white);

    polygon([
      [objectSize * 0.24, -objectSize * 0.08],
      [objectSize * 0.32, 0],
      [objectSize * 0.24, objectSize * 0.08],
      [objectSize * 0.16, 0],
    ]);

    return;
  }

  stroke(...OBJECT_PALETTE.grey);

  strokeWeight(max(3, objectSize * 0.035));

  line(-objectSize * 0.5, 0, objectSize * 0.48, 0);

  for (let boneIndex = 0; boneIndex < 5; boneIndex++) {
    const boneX = map(boneIndex, 0, 4, -objectSize * 0.28, objectSize * 0.28);

    line(boneX, 0, boneX - objectSize * 0.11, -objectSize * 0.2);

    line(boneX, 0, boneX - objectSize * 0.11, objectSize * 0.2);
  }

  noStroke();

  fill(...OBJECT_PALETTE.grey);

  polygon([
    [objectSize * 0.48, 0],
    [objectSize * 0.28, -objectSize * 0.18],
    [objectSize * 0.28, objectSize * 0.18],
  ]);

  fill(...OBJECT_PALETTE.orange);

  polygon([
    [-objectSize * 0.48, 0],
    [-objectSize * 0.7, -objectSize * 0.21],
    [-objectSize * 0.68, objectSize * 0.22],
  ]);
}

/* ============================================================
   SHATTERED PIECES
============================================================ */

function drawShatteredPieces() {
  const ctx = drawingContext;
  ctx.save();
  for (const piece of shatteredPieces) {
    ctx.save();
    ctx.translate(piece.x, piece.y);
    ctx.rotate(piece.rotation);
    ctx.globalAlpha = Math.min(1, piece.life / .65);
    ctx.fillStyle = `rgb(${piece.fillColor[0]},${piece.fillColor[1]},${piece.fillColor[2]})`;
    const size = piece.size;
    ctx.beginPath();
    ctx.moveTo(0,-size*.58); ctx.lineTo(size*.62,0);
    ctx.lineTo(0,size*.52); ctx.lineTo(-size*.4,0);
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  ctx.restore();
}

/* ============================================================
   PARTICLE DRAWING
============================================================ */

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

function drawFossilParticles(particles = fossilParticles) {
  const ctx = drawingContext;
  ctx.save();
  for (const particle of particles) {
    const fadeIn = Math.min(1, particle.age / .42);
    const fadeOut = 1 - Math.max(0, Math.min(1, (particle.age / particle.life - .72) / .28));
    const alpha = fadeIn * fadeOut * (61 + displayedEnvironmentProgress * 36) * 1.44;
    if (alpha < .5) continue;
    const warm = Math.max(0, Math.min(1, Math.max(0, displayedEnvironmentProgress - .35) * .85 +
      Math.max(0, 1 - particle.age / Math.max(.001, particle.life)) * .22));
    const orange = particle.accent === "orange", violet = particle.accent === "violet";
    const family = particle.smokeFamily % INDUSTRY_SMOKE_OUTER.length;
    const count = alpha > 22 && particle.size < 88 ? 3 : 2;
    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation);
    for (let layer = 0; layer < count; layer++) {
      let r, g, b, opacity;
      if (layer === 2) {
        r = 30 + 20 * warm * .65; g = 31 + 9 * warm * .65; b = 40 - 12 * warm * .65;
        opacity = alpha * .16;
      } else {
        r = orange ? 255 : violet ? 108 : layer === 0 ? 82 + 10 * warm : 104 + 8 * warm;
        g = orange ? 122 : violet ? 88 : layer === 0 ? 87 - 10 * warm : 110 - 18 * warm;
        b = orange ? 26 : violet ? 232 : layer === 0 ? 98 - 40 * warm : 122 - 57 * warm;
        opacity = alpha * (layer === 0 ? (orange ? .20 : violet ? .15 : .92 * .26)
          : (orange ? .30 : violet ? .22 : .92 * .42));
      }
      const points = layer === 0 ? INDUSTRY_SMOKE_OUTER[family]
        : layer === 1 ? INDUSTRY_SMOKE_MID[family] : INDUSTRY_SMOKE_CORE[family];
      const size = particle.size * (layer === 0 ? 1.16 : layer === 1 ? .88 : .42);
      ctx.fillStyle = `rgba(${r},${g},${b},${opacity / 255})`;
      ctx.beginPath();
      ctx.moveTo(points[0][0] * size, points[0][1] * size);
      for (let j = 1; j < points.length; j++) ctx.lineTo(points[j][0] * size, points[j][1] * size);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}

function getFactoryScale() {
  return FACTORY_SCALE * (fossilEnergyHover ? 1.04 : 1) * (fossilEnergyPressed ? 0.97 : 1);
}

// Three factory silhouettes and chimney geometry from code 10/js/render.js.
function drawFossilEnergyCore() {
  const v = factoryModelIndex;
  const pal = factoryPalette(v, displayedEnvironmentProgress, displayedEnvironmentProgress);
  push();
  translate(width * .5, height * .5);
  scale(getFactoryScale());
  translate(0, 58);
  noStroke();
  rectMode(CENTER);
  for (const chimney of factoryChimneys(v)) {
    drawFactoryChimney(chimney, 1, fossilEnergyHover || fossilEnergyPressed, displayedEnvironmentProgress);
  }
  fill(pal.body);
  factoryBaseBody(v);
  fill(pal.accent);
  factoryAccentBody(v);
  fill(fossilEnergyHover || fossilEnergyPressed ? PALETTE.orange : pal.cut);
  if (v === 0) rect(-18, 30, 20, 18);
  else if (v === 1) rect(-10, 22, 18, 18);
  else rect(-14, 30, 22, 16);
  pop();
}

function factoryPalette(v, soot = 0, damage = 0) {
  const i = ((v % 3) + 3) % 3;
  const defs = [
    { body: '#FF7900', accent: '#141414' },
    { body: '#2930FF', accent: '#FF7900' },
    { body: '#B3FF36', accent: '#2930FF' }
  ];
  const d = defs[i];
  const grime = constrain(soot * .34 + damage * .22, 0, .30);
  return {
    body: lerpColor(color(d.body), color('#5C514A'), grime),
    accent: lerpColor(color(d.accent), color('#675C55'), grime * .60),
    accent2: lerpColor(color(d.accent), color('#5C514A'), grime * .54),
    cut: lerpColor(color('#F6F0E8'), color('#D8CBB8'), grime * .46),
    dark: lerpColor(color('#141414'), color('#383942'), grime * .34)
  };
}

function factoryBaseBody(v) {
  beginShape();
  if (v === 0) {
    // Low saw-tooth factory.
    vertex(-116, 78); vertex(-116, 12); vertex(-82, -8); vertex(-82, -50); vertex(-38, -18); vertex(-38, -58); vertex(12, -28); vertex(116, -10); vertex(116, 78);
  } else if (v === 1) {
    // Tower + base, very clean.
    vertex(-112, 78); vertex(-112, -2); vertex(-50, -2); vertex(-34, -104); vertex(10, -104); vertex(10, -34); vertex(112, -18); vertex(112, 78);
  } else {
    // Simple stepped block.
    vertex(-116, 78); vertex(-116, 18); vertex(-60, 18); vertex(-60, -24); vertex(-8, -24); vertex(-8, -70); vertex(54, -70); vertex(54, -18); vertex(116, -18); vertex(116, 78);
  }
  endShape(CLOSE);
}

function factoryAccentBody(v) {
  if (v === 0) {
    polygon([[-116,12],[-82,-8],[-82,-50],[-38,-18],[-38,8],[-116,26]]);
  } else if (v === 1) {
    polygon([[-50,-2],[-34,-104],[10,-104],[10,-34],[-8,-20]]);
  } else {
    polygon([[-116,18],[-60,18],[-60,-24],[-8,-24],[-8,8],[-116,28]]);
  }
}

function factoryChimneys(v) {
  const i = ((v % 3) + 3) % 3;
  if (i === 0) return [
    { x: 30, y: -92, w: 18, h: 108, cap: 7, lip: 6, embed: 14 },
    { x: 58, y: -108, w: 20, h: 122, cap: 8, lip: 6, embed: 16 }
  ];
  if (i === 1) return [
    { x: 44, y: -126, w: 24, h: 136, cap: 9, lip: 7, embed: 16 },
    { x: 18, y: -90, w: 14, h: 88, cap: 6, lip: 5, embed: 12 }
  ];
  return [
    { x: 44, y: -102, w: 18, h: 106, cap: 7, lip: 6, embed: 14 },
    { x: 72, y: -116, w: 20, h: 118, cap: 8, lip: 6, embed: 16 }
  ];
}

function drawFactoryChimney(c, q, hot, soot = 0) {
  if (!c) return;
  const h = c.h * q;
  const embed = c.embed || 12;
  const topY = c.y + c.h * .50 - h;
  // Extend behind the building to its interior, below every chimney's roofline.
  // Keep the chimney tops fixed so smoke still starts at their lips.
  const bottomY = Math.max(0, c.y + c.h * .50 + embed);
  const bodyCol = lerpColor(color('#FFFDF6'), color('#E8E0CF'), constrain(soot * .16 + displayedEnvironmentProgress * .05, 0, .20));

  // Main chimney body — slightly thicker and sunk into the factory body.
  fill(bodyCol);
  beginShape();
  vertex(c.x - c.w * .54, bottomY);
  vertex(c.x - c.w * .42, topY + 6);
  vertex(c.x - c.w * .30, topY);
  vertex(c.x + c.w * .30, topY);
  vertex(c.x + c.w * .42, topY + 6);
  vertex(c.x + c.w * .54, bottomY);
  endShape(CLOSE);


  // Top rim.
  fill('#F1EBDD');
  rect(c.x, topY - 2, c.w * 1.02, max(4, c.cap || 6));
  fill('#141414');
  rect(c.x, topY + 1, c.w * .34, max(3, (c.cap || 6) * .36));

  // Base collar overlaps into the building so the pipe does not float.
  fill('#EDE5D6');
  rect(c.x, bottomY - 8, c.w * 1.08, max(5, c.lip || 5));
  fill(255, 255, 255, 54);
  rect(c.x, bottomY - max(14, h * .16), c.w * .20, max(14, h * .18));

  if (hot) {
    fill(...PALETTE.orange);
    rect(c.x, topY + 7, c.w * .46, 4);
  }
}

function drawStageBanner() {
  // Replaced by DOM / SVG interface.
}

function drawSubtitleBox() {
  // Replaced by DOM / SVG interface.
}

/* ============================================================
   GEOMETRY HELPERS
============================================================ */

function makeAngularBlobPoints(
  centerX,
  centerY,
  radiusX,
  radiusY,
  noiseKey,
  vertexCount
) {
  const polygonPoints = [];

  for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++) {
    const angle = (vertexIndex * TWO_PI) / vertexCount;

    const wobble = 0.82 + noise(noiseKey + vertexIndex * 0.37) * 0.3;

    polygonPoints.push([
      centerX + cos(angle) * radiusX * wobble,

      centerY + sin(angle) * radiusY * wobble,
    ]);
  }

  return polygonPoints;
}

function drawOffsetPolygon(polygonPoints, fillColor) {
  // HARM uses flat cut-paper planes with no offset drop shadow.
  noStroke();
  fill(...fillColor);
  polygon(polygonPoints);
}

function polygon(polygonPoints) {
  beginShape();

  polygonPoints.forEach(([x, y]) => vertex(x, y));

  endShape(CLOSE);
}

/* ============================================================
   RESPONSIVE SCALING
============================================================ */

function fitArtboardToWindow() {
  if (!canvasElement) {
    return;
  }

  const displayScale = min(
    window.innerWidth / ARTBOARD_WIDTH,

    window.innerHeight / ARTBOARD_HEIGHT
  );

  canvasElement.style.width = `${ARTBOARD_WIDTH * displayScale}px`;

  canvasElement.style.height = `${ARTBOARD_HEIGHT * displayScale}px`;

  if (figmaUiRoot) {
    figmaUiRoot.style.transform = `translate(-50%, -50%) scale(${displayScale})`;
    figmaUiRoot.style.setProperty('--instruction-size', `${Math.max(28,16/displayScale)}px`);
  }

  if (fossilEnergyButton) {
    const buttonDiameter = 300 * FACTORY_SCALE * displayScale;

    fossilEnergyButton.style("width", `${buttonDiameter}px`);

    fossilEnergyButton.style("height", `${buttonDiameter}px`);
  }
}

function windowResized() {
  fitArtboardToWindow();
}

/* ============================================================
   KEYBOARD CONTROLS
============================================================ */

function keyPressed() {
  if (soundMixerDialog?.open) return true;
  if (key === "i" || key === "I") {
    setInformationPanelOpen(!informationPanelOpen);

    return false;
  }

  if (informationPanelOpen && (key === "Escape" || keyCode === 27)) {
    setInformationPanelOpen(false);

    return false;
  }

  if (informationPanelOpen) {
    return false;
  }

  if (key === "r" || key === "R") {
    regenerateArtwork();
    flashResetButton();

    return false;
  }

  if (key === "m" || key === "M") {
    toggleProjectMute();

    return false;
  }

  return true;
}

/* ============================================================
   AUDIO
============================================================ */

const PROJECT_SOUND_PATHS = {
    mouseClick: 'designed-sounds/COMM2754-2026-S4010990-A2w09-Heal-MouseClick.wav?v=3b9f203a9972',
    blowPaper: 'designed-sounds/COMM2754-2026-S4010990-A2w09-Heal-BlowPaper.wav',
    paperCrush: 'designed-sounds/COMM2754-2026-S4010990-A2w09-Heal-PaperCrush.wav',
    buttonPress: 'designed-sounds/COMM2754-2026-S4010990-A2w09-Heal-ButtonPress.wav',
    bagCrush: 'designed-sounds/COMM2754-2026-S4010990-A2w09-Heal-BagCrush.wav',
    suitcaseHit: 'designed-sounds/COMM2754-2026-S4010990-A2w09-Heal-SuitcaseHit.wav',
    keyboardReverse: 'designed-sounds/COMM2754-2026-S4010990-A2w09-Heal-KeyboardReverse.wav',
    rain: 'designed-sounds/COMM2754-2026-S4010990-A2w09-Heal-Rain.wav',
    thunder: 'designed-sounds/COMM2754-2026-S4010990-A2w09-Heal-Thunder.wav'
};

let ambienceButton;

let projectMuted = false;

let projectSoundElements = Object.create(null);
let hoverSoundUnlocked = false;

let activeProjectSounds = new Set();
let projectSoundTimers = new Set();
let rainAudioContext = null;
let rainLoopBuffer = null;
let rainBufferPromise = null;
let rainSource = null;
let rainGain = null;
let rainWanted = false;

// Decode the original rain recording once. The bundled copy also works with file://.
function unlockProjectAudio() {
  // Authorize the hover player on the first click or key press.
  if (!hoverSoundUnlocked) {
    loadProjectSoundEffects();
    const hoverSound = projectSoundElements.keyboardReverse;
    hoverSoundUnlocked = true;
    hoverSound.muted = true;
    hoverSound.play().then(() => {
      hoverSound.pause();
      hoverSound.currentTime = 0;
      hoverSound.muted = false;
    }).catch(() => {
      hoverSound.muted = false;
      hoverSoundUnlocked = false;
    });
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  if (!rainAudioContext) rainAudioContext = HEALMaster.context();
  if (rainAudioContext.state === 'suspended') {
    rainAudioContext.resume().then(syncRainPlayback).catch(console.warn);
  }
  if (!rainBufferPromise) {
    const bytes = Uint8Array.from(atob(HEAL_MASTERED_AUDIO.rain), c => c.charCodeAt(0));
    rainBufferPromise = rainAudioContext.decodeAudioData(bytes.buffer).then(recording => {
      // Updated Rain.wav: keep the steady 0.30–2.40 second section.
      // Overlap the final 0.30 seconds with the beginning at equal power (1.80 s loop).
      const rate = recording.sampleRate;
      const start = Math.floor(0.3 * rate);
      const end = Math.min(Math.floor(2.4 * rate), recording.length);
      const overlap = Math.floor(0.3 * rate);
      const length = end - start - overlap;
      rainLoopBuffer = rainAudioContext.createBuffer(recording.numberOfChannels, length, rate);
      for (let channel = 0; channel < recording.numberOfChannels; channel++) {
        const input = recording.getChannelData(channel);
        const output = rainLoopBuffer.getChannelData(channel);
        output.set(input.subarray(start + overlap, end));
        for (let i = 0; i < overlap; i++) {
          const phase = i / (overlap - 1) * Math.PI / 2;
          output[length - overlap + i] = input[end - overlap + i] * Math.cos(phase)
            + input[start + i] * Math.sin(phase);
        }
      }
      syncRainPlayback();
    }).catch(error => console.warn('Could not decode the rain recording.', error));
  }
}

function stopRainPlayback() {
  if (rainSource) { rainSource.stop(); rainSource.disconnect(); rainSource = null; }
  if (rainGain) { rainGain.disconnect(); rainGain = null; }
}

function syncRainPlayback() {
  if (!rainWanted || projectMuted || document.hidden) { stopRainPlayback(); return; }
  if (rainSource || !rainLoopBuffer || rainAudioContext?.state !== 'running') return;
  rainSource = rainAudioContext.createBufferSource();
  rainSource.buffer = rainLoopBuffer;
  rainSource.loop = true;
  rainGain = rainAudioContext.createGain();
  rainGain.gain.value = mixedSoundVolume('rain', 0.35);
  rainSource.connect(rainGain).connect(HEALMaster.bus(rainAudioContext));
  rainSource.start();
}

// Delegation covers the main controls and buttons in panels created later.
function playButtonHoverSound(event) {
  if (event.pointerType === 'touch') return;
  const button = event.target.closest?.('button');
  if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true') return;
  // Moving between a button's icon and label is still the same hover.
  if (event.relatedTarget && button.contains(event.relatedTarget)) return;
  playProjectSound('keyboardReverse', 0.45);
}

function playButtonClickSound(event) {
  const button = event.target.closest?.('button');
  if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true') return;
  // The factory already plays this sound when it launches trash on press.
  if (button === fossilEnergyButton?.elt) return;
  playProjectSound('mouseClick', 0.34);
}

// Run after button actions so reset does not immediately stop its click sound.
document.addEventListener('click', playButtonClickSound);
document.addEventListener('pointerover', playButtonHoverSound);
document.addEventListener('pointerdown', unlockProjectAudio, { capture: true });
document.addEventListener('keydown', unlockProjectAudio, { capture: true });
document.addEventListener('visibilitychange', syncRainPlayback);

function createAmbienceButton() {
  ambienceButton?.remove?.();

  installAmbienceStyles();

  ambienceButton = createButton("");

  ambienceButton.addClass("figma-control");

  ambienceButton.addClass("ambience-trigger");

  ambienceButton.attribute("aria-label", "Open sound mixer");

  ambienceButton.attribute("aria-haspopup", "dialog");
  ambienceButton.attribute("aria-controls", "sound-mixer");

  ambienceButton.attribute("data-tooltip", "Sound mixer");

  if (figmaUiRoot) {
    ambienceButton.parent(figmaUiRoot);
  }

  ambienceButton.mousePressed(openSoundMixer);

  updateAmbienceButton();
}

function installAmbienceStyles() {
  installFigmaStage2Styles();
}

function positionAmbienceButton(targetCanvas, displayScale) {
  // Position handled by scaled UI.
}

function updateAmbienceButton() {
  if (!ambienceButton) {
    return;
  }

  ambienceButton.html(
    `${controlShellSvg()}${projectMuted ? mutedIconSvg() : soundIconSvg()}`
  );

  ambienceButton.attribute(
    "aria-label",

    soundMixerDialog?.open ? "Close sound mix" : "Open sound mix"
  );

  ambienceButton.attribute("aria-expanded", String(Boolean(soundMixerDialog?.open)));
  updateMixerMuteButton();

  ambienceButton.attribute(
    "data-tooltip",

    soundMixerDialog?.open ? "Close sound mix" : "Open sound mix"
  );

  ambienceButton.elt.dataset.muted = String(projectMuted);

  ambienceButton.elt.disabled = false;
}

function toggleProjectMute() {
  projectMuted = !projectMuted;
  if (projectMuted) stopActiveProjectSounds();
  else syncRainPlayback();
  updateAmbienceButton();
  updateMixerMuteButton();
}

function initializeProjectAudio() {
  loadProjectSoundEffects();
}

function loadProjectSoundEffects() {
  for (const [soundName, soundPath] of Object.entries(PROJECT_SOUND_PATHS)) {
    if (soundName === 'rain' || projectSoundElements[soundName]) continue;

    const soundElement = document.createElement('audio');
    soundElement.src = HEALMaster.url(soundName);
    soundElement.preload = 'auto';
    soundElement.load();
    projectSoundElements[soundName] = soundElement;
  }
}

function playProjectSound(soundName, volume = 0.3, delaySeconds = 0) {
  if (projectMuted) return;
  if (!projectSoundElements[soundName]) loadProjectSoundEffects();
  const soundTemplate = projectSoundElements[soundName];
  if (!soundTemplate) return;

  const startLoadedSound = () => {
    if (projectMuted) return;

    // Reuse the preloaded, gesture-authorized player for button hover feedback.
    const sound = soundName === 'keyboardReverse' ? soundTemplate : soundTemplate.cloneNode(true);
    if (soundName === 'keyboardReverse') {
      sound.currentTime = 0;
      sound.muted = false;
    }
    sound.dataset.soundName = soundName;
    sound.dataset.baseVolume = String(volume);
    sound.volume = mixedSoundVolume(soundName, volume);
    sound.preload = 'auto';
    activeProjectSounds.add(sound);

    const removeFinishedSound = () => {
      activeProjectSounds.delete(sound);
    };
    sound.addEventListener('ended', removeFinishedSound, { once: true });
    sound.addEventListener('error', removeFinishedSound, { once: true });
    HEALMaster.play(sound).catch((soundError) => {
      removeFinishedSound();
      console.warn(`Could not play the ${soundName} recording.`, soundError);
    });
  };

  if (delaySeconds > 0) {
    const timer = setTimeout(() => {
      projectSoundTimers.delete(timer);
      startLoadedSound();
    }, delaySeconds * 1000);
    projectSoundTimers.add(timer);
  } else {
    startLoadedSound();
  }
}

function stopActiveProjectSounds() {
  stopRainPlayback();
  for (const timer of projectSoundTimers) clearTimeout(timer);
  projectSoundTimers.clear();
  for (const sound of activeProjectSounds) {
    sound.pause();
    sound.currentTime = 0;
  }
  activeProjectSounds.clear();
}

function playNaturalObjectImpactSounds(impactResult) {
  if (impactResult === 'exploded') {
    playProjectSound('paperCrush', 0.34);
    playProjectSound('buttonPress', 0.24, 0.02);
    playProjectSound('bagCrush', 0.3, 0.04);
  } else if (impactResult === 'died') {
    playProjectSound('bagCrush', 0.3, 0.02);
    playProjectSound('suitcaseHit', 0.38, 0.04);
  }
}

window.addEventListener("pagehide", () => { rainWanted = false; stopActiveProjectSounds(); });

// Recommended levels for the calibrated recordings; ambience sits below foreground cues.
const RECOMMENDED_SOUND_LEVELS = {
  mouseClick: 60, blowPaper: 60, paperCrush: 60,
  buttonPress: 60, bagCrush: 60, suitcaseHit: 60,
  keyboardReverse: 60, rain: 40, thunder: 60
};
const SOUND_MIXER_LABELS = {
  mouseClick: "Mouse Click", blowPaper: "Blow Paper", paperCrush: "Paper Crush",
  buttonPress: "Button Press", bagCrush: "Bag Crush", suitcaseHit: "Suitcase Hit",
  keyboardReverse: "Keyboard Reverse", rain: "Rain", thunder: "Thunder",
};
let soundMixerLevels = { ...RECOMMENDED_SOUND_LEVELS };
let soundMixerDialog = null;

function mixedSoundVolume(soundName, baseVolume) {
  // Sources are mastered before playback; each slider now specifies the actual gain.
  return Math.max(0, Math.min(1, soundMixerLevels[soundName] / 100));
}

function setMixerLevel(soundName, value) {
  soundMixerLevels[soundName] = Math.max(0, Math.min(100, Number(value)));
  if (soundName === 'rain' && rainGain) {
    rainGain.gain.setTargetAtTime(mixedSoundVolume('rain', 0.35), rainAudioContext.currentTime, 0.025);
  }
  for (const sound of activeProjectSounds) {
    if (sound.dataset.soundName === soundName) {
      sound.volume = mixedSoundVolume(soundName, Number(sound.dataset.baseVolume));
    }
  }
  const row = soundMixerDialog?.querySelector(`[data-track="${soundName}"]`);
  if (row) {
    row.querySelector("input").value = soundMixerLevels[soundName];
    row.querySelector(".mixer-inline-level").textContent = `(${RECOMMENDED_SOUND_LEVELS[soundName]}%)`;
    row.querySelector("output").textContent = `${soundMixerLevels[soundName]}%`;
  }
}

function updateMixerMuteButton() {
  const button = soundMixerDialog?.querySelector(".mixer-mute");
  if (!button) return;
  button.innerHTML = `${projectMuted ? mutedIconSvg() : soundIconSvg()}<span>${projectMuted ? "UNMUTE" : "MUTE"}</span>`;
  button.setAttribute("aria-label", projectMuted ? "Unmute all sound (M)" : "Mute all sound (M)");
  button.setAttribute("aria-keyshortcuts", "M");
  button.setAttribute("aria-pressed", String(projectMuted));
}

function openSoundMixer() {
  if (!soundMixerDialog) createSoundMixer();
  if (soundMixerDialog.open) {
    soundMixerDialog.close();
    return;
  }
  soundMixerDialog.show();
  positionSoundMixer();
  updateAmbienceButton();
}

function positionSoundMixer() {
  if (!soundMixerDialog?.open || !ambienceButton?.elt) return;
  const button = ambienceButton.elt.getBoundingClientRect();
  const margin = 12;
  const gap = 14;
  soundMixerDialog.style.maxHeight = `${Math.max(100, button.bottom - margin)}px`;
  const panel = soundMixerDialog.getBoundingClientRect();
  let left = button.left - panel.width - gap;
  left = Math.max(margin, Math.min(left, window.innerWidth - panel.width - margin));
  const top = Math.max(margin, Math.min(button.bottom - panel.height, window.innerHeight - panel.height - margin));
  soundMixerDialog.style.left = `${left}px`;
  soundMixerDialog.style.top = `${top}px`;
}

window.addEventListener("resize", () => requestAnimationFrame(positionSoundMixer));

function createSoundMixer() {
  const style = document.createElement("style");
  style.textContent = `
    .sound-mixer {
      position: fixed; inset: auto; z-index: 110; box-sizing: border-box;
      width: min(340px, calc(100vw - 24px)); max-height: calc(100dvh - 24px);
      overflow: auto; margin: 0; padding: 12px; border: 2px solid #d9dadd;
      border-radius: 0; color: #e5e5e6; background: rgba(6, 8, 10, .96);
      box-shadow: 6px 6px 0 #3433ff; font: 700 9px/1.4 Arial, sans-serif;
      text-transform: uppercase;
    }
    .mixer-header { display: flex; align-items: center; justify-content: space-between;
      padding: 0 0 9px; border-bottom: 1px solid #3b3d41; gap: 10px; }
    .mixer-header h2 { margin: 0; font: 700 10px/1.4 Arial, sans-serif; letter-spacing: .3px; }
    .mixer-close {
      display: grid; place-items: center; flex: 0 0 24px;
      width: 24px; height: 24px; padding: 0;
      border: 1px solid #45464a; border-radius: 0;
      background: #06080a; color: #e5e5e6;
      font: 700 16px/1 Arial, sans-serif; cursor: pointer;
    }
    .mixer-close:hover, .mixer-close:focus-visible {
      background: #b8fa17; border-color: #b8fa17; color: #050505;
    }
    .mixer-legend, .mixer-note { color: #858588; font-size: 8px; letter-spacing: .15px; }
    .mixer-legend { margin: 8px 0 10px; }
    .mixer-legend span, .mixer-inline-level { color: #b8fa17; }
    .mixer-row { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) 32px;
      align-items: center; gap: 9px; min-height: 28px; margin-bottom: 8px; padding: 0 6px;
      background: #ffffff03; border-left: 2px solid #3433ff; }
    .mixer-row:nth-of-type(3) { border-color: #b8fa17; }
    .mixer-row:nth-of-type(6) { border-color: #ff6800; }
    .mixer-row output { text-align: right; }
    .mixer-row input { appearance: none; -webkit-appearance: none; width: 100%; min-width: 0;
      height: 3px; margin: 0; background: #a3a3a5; border-radius: 0; cursor: pointer; }
    .mixer-row input::-webkit-slider-thumb { appearance: none; -webkit-appearance: none;
      width: 9px; height: 14px; background: #b8fa17; border: 1px solid #131313; border-radius: 0; }
    .mixer-row input::-moz-range-thumb { width: 9px; height: 14px;
      background: #b8fa17; border: 1px solid #131313; border-radius: 0; }
    .mixer-note { border-top: 1px solid #3b3d41; margin: 10px 0 9px; padding-top: 8px; }
    .mixer-actions { display: grid; grid-template-columns: 1fr 2.3fr; gap: 10px; }
    .mixer-actions button { background: #b8fa17; color: #050505; border: 0;
      border-radius: 0; box-shadow: 3px 3px 0 #ff6800; padding: 9px 4px;
      font: 700 8px/1.3 Arial, sans-serif; cursor: pointer; }
    .mixer-actions .mixer-mute {
      display: flex; align-items: center; justify-content: flex-start; gap: 4px;
      background: transparent; color: #b8fa17;
      border: 1px solid #b8fa17; border-radius: 0;
      box-shadow: 3px 3px 0 #3433ff;
      padding: 6px 3px; font-size: 10px; white-space: nowrap;
    }
    .mixer-actions .mixer-mute[aria-pressed="true"] {
      background: #ff6600;
      border-color: #ff6600;
      color: #050505;
    }
    .mixer-actions .mixer-mute[aria-pressed="false"] {
      background: #06080a;
      color: #b8fa17;
    }
    .mixer-mute .figma-control-icon {
      position: static; inset: auto; transform: none;
      flex: 0 0 18px; width: 18px; height: 18px;
      fill: none; stroke: currentColor; stroke-width: 2;
    }
    .sound-mixer button:focus-visible, .sound-mixer input:focus-visible {
      outline: 2px solid white; outline-offset: 3px; }
  `;
  document.head.appendChild(style);
  soundMixerDialog = document.createElement("dialog");
  soundMixerDialog.id = "sound-mixer";
  soundMixerDialog.className = "sound-mixer";
  soundMixerDialog.setAttribute("aria-labelledby", "sound-mixer-title");
  soundMixerDialog.innerHTML = `
    <header class="mixer-header"><h2 id="sound-mixer-title">SOUND MIX</h2>
      <button class="mixer-close" type="button" aria-label="Close sound mix">×</button></header>
    <div class="mixer-body">
      <p class="mixer-legend">Role <span>(recommended)</span> · Current level</p>
      ${Object.entries(SOUND_MIXER_LABELS).map(([name, label]) => `
        <div class="mixer-row" data-track="${name}">
          <label for="mixer-${name}">${label} <span class="mixer-inline-level">(${RECOMMENDED_SOUND_LEVELS[name]}%)</span></label>
          <input id="mixer-${name}" type="range" min="0" max="100" step="1" value="${soundMixerLevels[name]}" aria-label="${label} volume">
          <output for="mixer-${name}">${soundMixerLevels[name]}%</output>
        </div>`).join("")}
      <p class="mixer-note">() = recommended mix</p>
      <div class="mixer-actions"><button class="mixer-mute" type="button">MUTE</button>
        <button class="mixer-recommended" type="button">USE RECOMMENDED</button></div>
    </div>`;
  document.body.appendChild(soundMixerDialog);
  soundMixerDialog.querySelector(".mixer-close").addEventListener("click", () => soundMixerDialog.close());
  soundMixerDialog.addEventListener("keydown", event => {
    if (event.key.toLowerCase() === "m" && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      event.stopPropagation();
      if (!event.repeat) toggleProjectMute();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      soundMixerDialog.close();
    }
  });
  document.addEventListener("pointerdown", event => {
    if (soundMixerDialog.open && !soundMixerDialog.contains(event.target) &&
        !ambienceButton.elt.contains(event.target)) soundMixerDialog.close();
  });
  soundMixerDialog.addEventListener("close", () => {
    updateAmbienceButton();
    ambienceButton?.elt.focus({ preventScroll: true });
  });
  soundMixerDialog.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", () => setMixerLevel(input.closest(".mixer-row").dataset.track, input.value));
  });
  soundMixerDialog.querySelector(".mixer-mute").addEventListener("click", toggleProjectMute);
  soundMixerDialog.querySelector(".mixer-recommended").addEventListener("click", () => {
    for (const [name, level] of Object.entries(RECOMMENDED_SOUND_LEVELS)) setMixerLevel(name, level);
    if (projectMuted) toggleProjectMute();
  });
  updateMixerMuteButton();
}


function updateEnvironmentProgress() {
  const percentage = displayedEnvironmentProgress * 100;
  const displayedPercentage = percentage < 100 ? Math.floor(percentage) : 100;
  if (displayedPercentage === lastProgressPercent) return;
  const progress = figmaUiRoot?.querySelector(".environment-progress");
  if (!progress) return;
  lastProgressPercent = displayedPercentage;
  progress.setAttribute("aria-valuenow", String(displayedPercentage));
  progress.querySelector(".environment-progress-value").textContent = `${displayedPercentage}%`;
  progress.querySelector(".environment-progress-fill").style.width = `${displayedPercentage}%`;
  if (displayedPercentage === 100 && !artworkComplete) completeArtwork();
}


// Background rendering imported from code 10/js/render-2026-09-22-v01.js and js/scene.js.
// HARM's fully polluted atmosphere is the baseline; Stage 2 damage shifts its color.
const importedPollutedBackground = (() => {
  const W = ARTBOARD_WIDTH, H = ARTBOARD_HEIGHT, FIELD_COLS = 18;
  const C = { skyClean: '#12141C', skyMid: '#131A37', skyDirty: '#241E28' };
  // Stage 2 begins where HARM ends: a fully polluted atmosphere.
  // This baseline is independent of the Stage 2 destruction counter.
  const pollution = 100;
  let sceneTime = 0, smokeCeiling = 540;
  let ambientFragments = [], stains = [], columnPollution = [];
  const pollutionN = () => pollution / 100;
  const smooth01 = t => { t = constrain(t, 0, 1); return t * t * (3 - 2 * t); };
  function getColumnPollution(x) {
    const position = constrain(x / W * (FIELD_COLS - 1), 0, FIELD_COLS - 1);
    const left = floor(position), right = Math.min(left + 1, FIELD_COLS - 1);
    return lerp(columnPollution[left], columnPollution[right], position - left);
  }
  const samplePollution = (x, y) => getColumnPollution(x);
  const polygonFromPoints = (points, size) => polygon(points.map(([x,y]) => [x * size, y * size]));
  function drawShard(shape, size) {
    polygonFromPoints([[-0.5,-0.3],[0.55,-0.15],[0.3,0.4],[-0.45,0.2]],size);
  }
  function smokeFamily(family, size) {
    polygonFromPoints(SMOKE_FAMILY_POINTS[family] || SMOKE_FAMILY_POINTS[0], size);
  }
const SMOKE_FAMILY_POINTS = [
  [[-1.10,-.18],[-.72,-.86],[-.08,-1.04],[.58,-.74],[1.04,-.10],[.76,.62],[.10,.94],[-.78,.68]],
  [[-1.18,-.38],[-.46,-.76],[.18,-.54],[.82,-.84],[1.12,-.16],[.62,.22],[.88,.72],[.08,.88],[-.76,.58]],
  [[-.92,-.82],[-.18,-1.04],[.28,-.62],[.88,-.40],[1.02,.26],[.46,.74],[-.22,.98],[-.82,.48],[-1.04,-.18]],
  [[-1.20,-.12],[-.74,-.54],[-.10,-.46],[.22,-.92],[.92,-.50],[1.12,.06],[.56,.38],[.38,.88],[-.46,.76],[-.94,.36]],
  [[-1.04,-.56],[-.40,-.98],[.10,-.66],[.56,-.96],[1.06,-.34],[.86,.30],[.24,.50],[.04,.94],[-.68,.70],[-1.14,.08]],
  [[-1.14,-.20],[-.86,-.70],[-.22,-1.12],[.34,-1.00],[.94,-.58],[1.16,.02],[.68,.66],[-.02,.96],[-.84,.76],[-1.12,.18]]
];


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


// BACKGROUND / ATMOSPHERE
// ------------------------------------------------------------

// Reset-driven graphic-field variation. These are curated compositions rather
// than fully free random coordinates, so every reset feels different while the
// background remains balanced and never interferes with the main scene/UI.
const GRAPHIC_FIELD_LAYOUTS = [
  {
    blueA: [[-.03,-.02],[.30,-.02],[.23,.22],[-.03,.34]],
    darkA: [[.15,.06],[.58,.08],[.75,.39],[.31,.49]],
    blueB: [[.76,.55],[1.03,.46],[1.03,.78],[.86,.84]],
    darkB: [[.00,.60],[.23,.55],[.36,.92],[.08,1.02]]
  },
  {
    blueA: [[-.04,.08],[.22,-.03],[.34,.17],[.08,.39]],
    darkA: [[.38,-.04],[.78,.00],[.66,.30],[.29,.34]],
    blueB: [[.66,.68],[.96,.57],[1.03,.88],[.78,1.02]],
    darkB: [[-.02,.48],[.17,.40],[.31,.68],[.05,.82]]
  },
  {
    blueA: [[.08,-.03],[.43,-.02],[.35,.22],[-.02,.30]],
    darkA: [[.54,.03],[.92,.10],[.78,.42],[.43,.34]],
    blueB: [[-.03,.71],[.23,.62],[.35,.92],[.04,1.02]],
    darkB: [[.64,.58],[1.03,.50],[1.03,.83],[.80,.92]]
  },
  {
    blueA: [[-.04,.00],[.20,-.02],[.31,.20],[.02,.31]],
    darkA: [[.20,.15],[.61,.04],[.71,.32],[.35,.47]],
    blueB: [[.73,.00],[1.03,-.02],[1.03,.26],[.85,.20]],
    darkB: [[.43,.65],[.74,.54],[.86,.84],[.55,.97]]
  },
  {
    blueA: [[.00,-.03],[.34,.00],[.22,.27],[-.03,.38]],
    darkA: [[.47,-.03],[.81,.12],[.67,.43],[.31,.31]],
    blueB: [[.78,.61],[1.03,.54],[1.03,.90],[.89,1.01]],
    darkB: [[-.03,.67],[.28,.57],[.42,.89],[.12,1.03]]
  }
];

let graphicFieldVariant = -1;
let graphicFieldLayout = null;

function randomizeGraphicField() {
  const count = GRAPHIC_FIELD_LAYOUTS.length;
  let next = floor(random(count));
  if (count > 1 && next === graphicFieldVariant) next = (next + 1 + floor(random(count - 1))) % count;
  graphicFieldVariant = next;

  // A small reset-only jitter prevents exact repetition while preserving the
  // proportions of the curated base layout.
  const src = GRAPHIC_FIELD_LAYOUTS[next];
  const jitter = (points, amountX = .014, amountY = .014) => points.map(([x, y], i) => {
    const edgeX = (x <= 0 || x >= 1) ? 0 : random(-amountX, amountX);
    const edgeY = (y <= 0 || y >= 1) ? 0 : random(-amountY, amountY);
    return [x + edgeX, y + edgeY];
  });

  graphicFieldLayout = {
    blueA: jitter(src.blueA, .015, .014),
    darkA: jitter(src.darkA, .014, .016),
    blueB: jitter(src.blueB, .012, .014),
    darkB: jitter(src.darkB, .014, .012),
    tilt: random(-.010, .010),
    alphaShift: random(-2.0, 2.0)
  };
}

function drawFieldPolygon(points, driftX = 0, driftY = 0) {
  polygon(points.map(([x, y]) => [x * W + driftX, y * H + driftY]));
}

function drawBackdrop() {
  const damage = smooth01(displayedEnvironmentProgress);
  // HARM's polluted purple-charcoal sky shifts through ochre-brown
  // into deeper soot. The existing smog geometry remains visible.
  const start = color(C.skyDirty);
  const middle = color('#443529');
  const end = color('#282018');
  background(damage < .55
    ? lerpColor(start, middle, damage / .55)
    : lerpColor(middle, end, (damage - .55) / .45));
}

function drawGraphicField() {
  const p = pollutionN();
  noStroke();

  // Fallback protects unusual load orders; normal builds initialize this in resetScene().
  if (!graphicFieldLayout) randomizeGraphicField();

  const fade = 1 - p * .58;
  const drift = p * 20;
  const aShift = graphicFieldLayout.alphaShift || 0;
  const blueField = lerpColor(color(39, 57, 240), color(52, 63, 122), p * .60);
  const deepBlueField = lerpColor(color(18, 30, 78), color(39, 42, 63), p * .62);
  const inkField = lerpColor(color(7, 10, 20), color(35, 31, 36), p * .56);
  const violetField = lerpColor(color(110, 90, 236), color(77, 69, 108), p * .72);
  const limeField = lerpColor(color(195, 245, 43), color(138, 120, 58), p * .92);
  const orangeField = lerpColor(color(255, 123, 31), color(172, 86, 36), p * .62);
  const paperField = lerpColor(color(244, 241, 236), color(192, 184, 170), p * .54);

  // Main blue + black/navy planes. Only these larger background planes change
  // layout on reset, keeping the interaction field and object positions stable.
  fill(red(blueField), green(blueField), blue(blueField), max(7, 22 * fade + aShift));
  drawFieldPolygon(graphicFieldLayout.blueA, -drift * .22, drift * .06);

  fill(red(inkField), green(inkField), blue(inkField), 36 + p * 7 + aShift);
  drawFieldPolygon(graphicFieldLayout.darkA, drift * .10, -drift * .05);

  fill(red(deepBlueField), green(deepBlueField), blue(deepBlueField), max(8, 18 * (fade + .12) - aShift * .25));
  drawFieldPolygon(graphicFieldLayout.blueB, -drift * .10, drift * .12);

  fill(red(inkField), green(inkField), blue(inkField), 28 + p * 8 - aShift * .30);
  drawFieldPolygon(graphicFieldLayout.darkB, drift * .08, -drift * .08);

  // Secondary accents stay in approximately the same regions so the visual
  // identity remains recognisable across all reset variants.
  fill(red(violetField), green(violetField), blue(violetField), 9 * (fade + p * .10));
  polygon([[W * .70 - drift * .22, H], [W, H], [W, H * .70 + drift], [W * .83 + drift * .15, H * .84]]);

  fill(red(blueField), green(blueField), blue(blueField), 5 * (fade + .16));
  polygon([[W * .20, H * .10], [W * .61, H * .12], [W * .74, H * .36], [W * .28, H * .46]]);

  fill(red(limeField), green(limeField), blue(limeField), 5 * max(.08, fade));
  polygon([[W * .39, H * .73], [W * .55, H * .67], [W * .62, H * .83], [W * .45, H * .89]]);

  fill(red(orangeField), green(orangeField), blue(orangeField), 6 + p * 4);
  polygon([[W * .86, 0], [W, 0], [W, H * .18 + drift * .45], [W * .91 - drift * .08, H * .12]]);

  fill(red(paperField), green(paperField), blue(paperField), 2 + fade * 2.5);
  polygon([[W * .04, H * .78], [W * .16, H * .74], [W * .22, H * .90], [W * .08, H * .96]]);

  for (let i = 0; i < ambientFragments.length; i++) {
    const a = ambientFragments[i];
    const local = samplePollution(a.x, a.y);
    if (local > .82 && noise(i * .13, sceneTime * .02) < .48) continue;
    push();
    translate(a.x + sin(sceneTime * .11 + a.phase) * a.drift, a.y + cos(sceneTime * .14 + a.phase) * a.drift * .7);
    rotate(a.rot + sceneTime * a.spin);
    if (a.kind === 'blue') fill(red(blueField), green(blueField), blue(blueField), 130 * (1 - local * .72));
    else if (a.kind === 'lime') fill(red(limeField), green(limeField), blue(limeField), 100 * (1 - local * .46));
    else if (a.kind === 'paper') fill(244, 241, 236, 118 * (1 - local * .62));
    else fill(red(orangeField), green(orangeField), blue(orangeField), 92 * (1 - local * .52));
    drawShard(a.shape, a.size);
    pop();
  }
}

function drawSmokeCeiling() {
  const p = pollutionN();
  if (smokeCeiling < 2 || p < .08) return;

  noStroke();
  for (let layer = 0; layer < 6; layer++) {
    const alpha = 4 + p * (8 + layer * 2.2);
    const topColor = lerpColor(color(64 - layer * 2.0, 65 - layer * 1.8, 71 - layer * 1.6), color(84, 70, 52), constrain(max(0, p - .42) * 1.15, 0, 1));
    fill(red(topColor), green(topColor), blue(topColor), alpha);
    beginShape();
    vertex(-160, -90);
    vertex(W + 160, -90);
    for (let x = W + 160; x >= -160; x -= 68) {
      vertex(x, getCeilingDepthAtX(x, layer));
    }
    endShape(CLOSE);
  }

  if (p > .42) {
    for (let i = 0; i < FIELD_COLS; i += 3) {
      const x = (i + .5) / FIELD_COLS * W;
      const local = getColumnPollution(x);
      if (local < .22) continue;
      const y = getCeilingDepthAtX(x, 5) * .58;
      const w = 120 + local * 220;
      const h = 34 + local * 92;
      const cloud = lerpColor(color(46, 47, 53), color(82, 66, 48), constrain((p - .4) * 1.2 + local * .2, 0, 1));
      fill(red(cloud), green(cloud), blue(cloud), (local * 12 + p * 4));
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
    if (s.accent === 'orange') fill(255, 122, 26, s.a * .28 * p);
    else if (s.accent === 'violet') fill(108, 88, 232, s.a * .30 * p);
    else fill(62, 64, 70, s.a * .85 * p);
    ellipse(s.x + sin(sceneTime * .09 + s.phase) * 2, s.y, s.w, s.h);
  }
}

function drawAtmosphereVeil() {
  const p = pollutionN();
  if (p < .28) return;

  push();
  noStroke();
  const bands = 2 + floor(p * 3);
  for (let i = 0; i < bands; i++) {
    const y = 130 + i * (H - 220) / max(1, bands - 1) + sin(sceneTime * .07 + i) * 9;
    const veil = lerpColor(color(74, 76, 82), color(93, 76, 56), constrain(max(0, p - .5) * 1.05, 0, 1));
    fill(red(veil), green(veil), blue(veil), 1.0 + p * 3.4);
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



  function reset() {
    randomizeGraphicField();
    columnPollution = Array.from({ length: FIELD_COLS }, (_, i) =>
      0.58 + noise(i * 0.23 + 31) * 0.38);
    ambientFragments = Array.from({ length: 30 }, () => ({
      x: random(20, W - 20), y: random(55, H - 40), size: random(2.5,9.5),
      shape: floor(random(5)), phase: random(TWO_PI), drift: random(2,8),
      rot: random(TWO_PI), spin: random(-0.015,0.015),
      kind: ['blue','lime','paper','orange'][floor(random(4))],
    }));
    stains = Array.from({ length: 50 }, () => ({
      x: random(W), y: random(20,420), w: random(40,150), h: random(10,38),
      a: random(2,4.8), phase: random(TWO_PI),
      accent: random() < 0.15 ? 'orange' : 'soot',
    }));
  }
  function draw() {
    sceneTime = elapsedTime;
    smokeCeiling = 540;
    push();
    drawBackdrop();
    drawGraphicField();
    drawSmokeCeiling();
    drawStains();
    drawAtmosphereVeil();
    // Warm staining gradually shifts the entire reference background palette.
    if (displayedEnvironmentProgress > 0) {
      noStroke();
      fill(88, 58, 28, smooth01(displayedEnvironmentProgress) * 72);
      polygon([[0,0],[W,0],[W,H],[0,H]]);
    }
    pop();
  }
  return { reset, draw };
})();

// End the interaction once every foreground object is damaged and the bar reaches 100%.
function updateFactoryAvailability() {
  if (!fossilEnergyButton?.elt) return;
  const disabled = informationPanelOpen || getDestroyedObjectProgress() >= 1;
  fossilEnergyButton.elt.disabled = disabled;
  fossilEnergyButton.style("pointer-events", disabled ? "none" : "auto");
  fossilEnergyButton.style("cursor", disabled ? "default" : "pointer");
  if (disabled) {
    fossilEnergyHover = false;
    fossilEnergyPressed = false;
  }
}

function completeArtwork() {
  if (artworkComplete) return;
  artworkComplete = true;
  impactPopups = [];
  updateFactoryAvailability();
  figmaUiRoot.classList.add("artwork-finished");
}

// Factory litter uses the eight original code 10 damage-waste models.
function emitFactoryTrash() {
  const burstAngle = random(TWO_PI);
  const factoryScale = getFactoryScale();
  const reserved = new Set(factoryTrash.filter(piece => piece.target).map(piece => piece.target));
  const available = naturalObjects.filter(object => object.state === "alive" && !reserved.has(object));
  for (let index = 0; index < 3; index++) {
    const target = available.length ? available.splice(floor(random(available.length)), 1)[0] : null;
    const heading = burstAngle + index * TWO_PI / 3 + random(-.12, .12);
    const speed = random(180, 270);
    factoryTrash.push({
      x: width * .5 + cos(heading) * 60 * factoryScale,
      y: height * .5 + 58 * factoryScale + sin(heading) * 35 * factoryScale,
      vx: cos(heading) * speed, vy: sin(heading) * speed,
      rot: random(-.95, .95), rv: random(-.060, .060),
      phase: random(TWO_PI), flutter: random(7.0, 12.4),
      size: random(12, 27) * 1.22, kind: floor(random(8)),
      variant: floor(random(4)), mirror: random() < .5 ? -1 : 1,
      stretch: random(.78, 1.34), age: 0, life: random(8.5, 13.8),
      settled: false, alpha: random(145, 218), tint: random(),
      pollutionAtBirth: displayedEnvironmentProgress,
      target, driftAge: 0,
    });
  }
  // Keep assigned pieces until they reach their targets; limit only free-floating litter.
  let excess = factoryTrash.length - 105;
  factoryTrash = factoryTrash.filter(piece => piece.target || excess-- <= 0);
}

function updateFactoryTrash(dt) {
  for (const piece of factoryTrash) {
    piece.age += dt;
    piece.rot += (piece.rv + sin(piece.age * 6.4 + piece.phase) * .004) * dt * 60;
    if (piece.target && piece.target.state !== "alive") piece.target = null;
    if (piece.target) {
      // Follow one reserved object only; incidental contact cannot damage other objects.
      piece.life = Math.max(piece.life, piece.age + 3);
      const dx = piece.target.x - piece.x;
      const dy = piece.target.y - piece.y;
      const distance = Math.hypot(dx, dy);
      const speed = 280;
      const blend = 1 - Math.exp(-dt * 5);
      piece.vx += ((dx / (distance || 1)) * speed - piece.vx) * blend;
      piece.vy += ((dy / (distance || 1)) * speed - piece.vy) * blend;
      const previousX = piece.x, previousY = piece.y;
      piece.x += piece.vx * dt;
      piece.y += piece.vy * dt;
      const travelX = piece.x - previousX, travelY = piece.y - previousY;
      const travelSquared = travelX * travelX + travelY * travelY;
      const t = travelSquared ? Math.max(0, Math.min(1, (dx * travelX + dy * travelY) / travelSquared)) : 0;
      const hitDistance = Math.hypot(piece.target.x - previousX - travelX * t, piece.target.y - previousY - travelY * t);
      if (hitDistance <= piece.target.size * .38 + piece.size * 1.5) {
        const result = transformNaturalObject(piece.target);
        recordDestructionForPopup();
        updateFactoryAvailability();
        playNaturalObjectImpactSounds(result);
        piece.target = null;
        piece.life = piece.age + random(8.5, 13.8);
        const heading = random(TWO_PI);
        piece.vx = cos(heading) * 65;
        piece.vy = sin(heading) * 65;
      }
    } else {
      piece.driftAge += dt;
      const heading = piece.phase + Math.sin(piece.driftAge * .35 + piece.phase) * 2;
      const blend = 1 - Math.exp(-dt * .65);
      piece.vx += (cos(heading) * 65 - piece.vx) * blend;
      piece.vy += (sin(heading) * 65 - piece.vy) * blend;
      piece.x += piece.vx * dt;
      piece.y += piece.vy * dt;
    }
    containArtworkObject(piece, 2.2);
  }
  factoryTrash = factoryTrash.filter(piece => piece.target || piece.age < piece.life);
}

function drawFactoryTrash() {
  for (const w of factoryTrash) {
    const fadeIn = constrain(w.age / .16, 0, 1);
    const remaining = constrain((w.life - w.age) / 2.0, 0, 1);
    const a = w.alpha * fadeIn * (w.settled ? min(1, remaining + .30) : max(.30, remaining));
    if (a <= 2) continue;

    push();
    noStroke();
    rectMode(CENTER);
    translate(w.x, w.y);
    rotate(w.rot);
    const flutterY = w.settled ? .70 : .72 + sin(w.age * w.flutter + w.phase) * .20;
    const flutterX = w.settled ? 1 : 1 + cos(w.age * (w.flutter * .54) + w.phase) * .06;
    scale(w.mirror * flutterX, flutterY);
    drawFactoryTrashPiece(w, a);
    pop();
  }
}

function drawFactoryTrashPiece(w, a) {
  // Original reference colors; do not substitute the artwork's changing palette.
  const C = { paper: '#F4F1EC', violet: '#745BFF', orange: '#FF7B1F',
    blue: '#2F39FF', grey: '#8F96A3', light: '#D8DBE3', lime: '#C3F52B' };
  const s = w.size;
  const dirt = constrain(displayedEnvironmentProgress * .55 + w.pollutionAtBirth * .20, 0, .72);
  const darkA = a * (.48 + dirt * .16);

  if (w.kind === 0) {
    // Crumpled plastic bag — asymmetric handles and fold lines vary per particle.
    const bagBase = lerpColor(color(C.paper), color(C.violet), .14 + w.tint * .16);
    fill(red(bagBase) * (1 - dirt * .18), green(bagBase) * (1 - dirt * .18), blue(bagBase) * (1 - dirt * .12), a);
    noStroke();
    const lean = (w.variant - 1.5) * .07 * s;
    polygon([[-.68*s,-.46*s],[.48*s + lean,-.57*s],[.72*s,.44*s],[.10*s,.69*s],[-.64*s,.49*s]]);
    fill(20, 21, 28, darkA);
    polygon([[-.50*s,-.14*s],[.45*s,-.25*s],[.36*s,-.04*s],[-.43*s,.05*s]]);
    noFill();
    stroke(18, 19, 25, a * .78);
    strokeWeight(max(1, s * .070));
    arc(-.24*s, -.48*s, .32*s, .42*s, PI, TWO_PI);
    arc(.22*s, -.52*s, .36*s, .46*s, PI, TWO_PI);
    noStroke();
    return;
  }

  if (w.kind === 1) {
    // Folded snack / packaging wrapper with a clipped corner and offset band.
    fill(lerpColor(color(C.orange), color(C.paper), .40 + w.tint * .34));
    polygon([[-.75*s,-.34*s],[.42*s,-.54*s],[.76*s,-.14*s],[.59*s,.38*s],[.10*s,.57*s],[-.66*s,.38*s]]);
    fill(18, 19, 25, darkA);
    polygon([[-.56*s,-.02*s],[.54*s,-.20*s],[.58*s,-.02*s],[-.52*s,.18*s]]);
    fill(C.blue);
    rect(.30*s, .30*s, s * .24, s * .10);
    return;
  }

  if (w.kind === 2) {
    // Thin torn film / ribbon: long, bent and intentionally strange in silhouette.
    fill(lerpColor(color(C.grey), color(C.violet), .28 + w.tint * .26));
    const l = s * (1.15 + .28 * w.stretch);
    polygon([[-l,-.16*s],[-.40*l,-.34*s],[.06*l,-.11*s],[.47*l,-.31*s],[l,-.04*s],[.54*l,.18*s],[.02*l,.08*s],[-.48*l,.30*s]]);
    fill(10, 11, 16, darkA * .72);
    polygon([[-.42*l,-.07*s],[.02*l,-.17*s],[.30*l,-.08*s],[-.05*l,.02*s]]);
    return;
  }

  if (w.kind === 3) {
    // Crushed can / cup — abstracted into a skewed industrial capsule.
    fill(lerpColor(color(C.light), color(C.orange), .18 + w.tint * .22));
    polygon([[-.50*s,-.62*s],[.40*s,-.52*s],[.58*s,-.18*s],[.42*s,.55*s],[-.34*s,.65*s],[-.61*s,.24*s]]);
    fill(19, 20, 27, darkA);
    polygon([[-.37*s,-.19*s],[.42*s,-.27*s],[.32*s,-.04*s],[-.28*s,.04*s]]);
    noFill();
    stroke(17, 18, 24, a * .74);
    strokeWeight(max(1, s * .06));
    line(-.34*s, -.48*s, .31*s, -.41*s);
    line(-.30*s, .47*s, .27*s, .40*s);
    noStroke();
    return;
  }

  if (w.kind === 4) {
    // Bottle / label shard — recognizable only as a broken container silhouette.
    fill(lerpColor(color(C.blue), color(C.paper), .35 + w.tint * .30));
    polygon([[-.26*s,-.72*s],[.18*s,-.72*s],[.22*s,-.47*s],[.48*s,-.25*s],[.38*s,.62*s],[-.36*s,.67*s],[-.50*s,-.12*s],[-.28*s,-.43*s]]);
    fill(C.lime);
    polygon([[-.36*s,-.05*s],[.40*s,-.13*s],[.37*s,.17*s],[-.31*s,.23*s]]);
    fill(15,16,22,darkA*.74);
    rect(-.02*s, -.60*s, .30*s, .08*s);
    return;
  }

  if (w.kind === 5) {
    // Loop / gasket / ring fragment — introduces negative-space-looking geometry
    // without erase(), so it remains robust in the 2D renderer.
    noFill();
    stroke(lerpColor(color(C.orange), color(C.violet), .42));
    strokeWeight(max(2, s * .16));
    ellipse(0, 0, s * 1.12, s * .78);
    stroke(15, 16, 21, a * .70);
    strokeWeight(max(1, s * .055));
    line(.20*s, -.30*s, .68*s, -.58*s);
    line(.68*s, -.58*s, .80*s, -.35*s);
    noStroke();
    return;
  }

  if (w.kind === 6) {
    // Jagged foil shard — star-like but asymmetric, useful as a quick flash shape.
    fill(lerpColor(color(C.paper), color(C.grey), .34 + dirt * .16));
    polygon([[-.78*s,-.12*s],[-.30*s,-.30*s],[-.12*s,-.78*s],[.18*s,-.30*s],[.70*s,-.54*s],[.46*s,-.02*s],[.84*s,.32*s],[.24*s,.34*s],[-.12*s,.76*s],[-.34*s,.30*s],[-.78*s,.42*s],[-.55*s,.08*s]]);
    fill(C.orange);
    polygon([[-.22*s,-.16*s],[.35*s,-.24*s],[.22*s,.12*s],[-.12*s,.22*s]]);
    return;
  }

  // Hooked cable-tie / torn strap — a crooked silhouette unlike the flat wrappers.
  fill(lerpColor(color(C.violet), color(C.grey), .18 + w.tint * .22));
  polygon([[-.82*s,-.16*s],[-.18*s,-.30*s],[.34*s,-.10*s],[.70*s,-.48*s],[.88*s,-.29*s],[.48*s,.08*s],[.80*s,.32*s],[.55*s,.50*s],[.18*s,.18*s],[-.20*s,.34*s],[-.72*s,.18*s]]);
  fill(14,15,20,darkA*.72);
  polygon([[-.52*s,-.04*s],[-.10*s,-.12*s],[.18*s,-.02*s],[-.16*s,.10*s]]);
}


// Each message marks a randomly sized group of 3–6 newly destroyed objects.
function recordDestructionForPopup() {
  destroyedSincePopup += 1;
  if (destroyedSincePopup < nextPopupInterval || artworkComplete) return;
  destroyedSincePopup = 0;
  nextPopupInterval = floor(random(3, 7));
  let x, y;
  for (let attempt = 0; attempt < 20; attempt++) {
    x = random(260, width - 260);
    y = random(230, height - 200);
    const clearOfFactory = Math.hypot(x - width * .5, y - height * .5) > 320;
    const clearOfMessages = impactPopups.every(popup => Math.hypot(x - popup.x, y - popup.y) > 260);
    if (clearOfFactory && clearOfMessages) break;
  }
  impactPopups.push({ x, y, age: 0,
    text: IMPACT_MESSAGES[impactMessageIndex % IMPACT_MESSAGES.length] });
  impactMessageIndex += 1;
}

function updateAndDrawImpactPopups(dt) {
  const reducedMotion = typeof window !== "undefined" &&
    false;
  for (const popup of impactPopups) {
    popup.age += dt * 4.175;
    const progress = Math.min(1, popup.age / 6);
    const boxScale = reducedMotion ? .55 : .45 + .265 * progress;
    // Keep the fade timing while growing to a final scale of 71.5% (10% larger than 65%).
    const fadeStart = .55 / .85;
    const fadeOut = progress <= fadeStart ? 1 : 1 - (progress - fadeStart) / (1 - fadeStart);
    const alpha = 255 * Math.min(1, popup.age / .35) * Math.max(0, fadeOut);
    push();
    translate(popup.x, popup.y);
    scale(boxScale);
    rectMode(CENTER);
    noStroke();
    fill(6, 7, 12, alpha * .55);
    rect(6, 7, 360, 78);
    fill(224, 229, 232, alpha);
    rect(0, 0, 360, 78);
    fill(254, 125, 33, alpha);
    rect(-176, 0, 8, 78);
    fill(16, 16, 34, alpha);
    textFont('Arial');
    textStyle(BOLD);
    textSize(25);
    textAlign(CENTER, CENTER);
    text(popup.text, 3, 0);
    pop();
  }
  impactPopups = impactPopups.filter(popup => popup.age < 6);
}

// Ambient smog is a rendering layer only; it has no particles or collision checks.
function drawBackgroundSmog() {
  // Rasterize the soft haze once; reuse a small texture instead of eight
  // full-size radial gradients every frame.
  if (!smogTexture) {
    smogTexture = document.createElement("canvas");
    smogTexture.width = smogTexture.height = 256;
    const c = smogTexture.getContext("2d");
    const gradient = c.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, "rgba(145,139,128,1)");
    gradient.addColorStop(.45, "rgba(117,116,113,.55)");
    gradient.addColorStop(1, "rgba(99,103,108,0)");
    c.fillStyle = gradient;
    c.fillRect(0, 0, 256, 256);
  }
  const ctx = drawingContext;
  ctx.save();
  ctx.globalAlpha = .045 + displayedEnvironmentProgress * .18;
  for (let layer = 0; layer < 8; layer++) {
    const phase = layer * 2.399;
    const x = width * (.12 + (layer % 4) * .25) + Math.sin(elapsedTime * .055 + phase) * 120;
    const y = height * (.23 + Math.floor(layer / 4) * .48) + Math.cos(elapsedTime * .04 + phase) * 65;
    const radius = width * (.25 + .025 * Math.sin(phase));
    ctx.drawImage(smogTexture, x - radius, y - radius * .55, radius * 2, radius * 1.1);
  }
  ctx.restore();
}

// Static gray power-grid model adapted from code 10/js/render-2026-09-22-v01.js and js/scene.js.
// It is a background drawing only and does not participate in collisions.
function drawBackgroundPowerGrid() {
  const poles = [
    { x: 500, y: 688, scale: .43, rotation: -.008 },
    { x: 930, y: 650, scale: .47, rotation: -.012 },
    { x: 1350, y: 845, scale: .43, rotation: .010 },
    { x: 1695, y: 748, scale: .46, rotation: -.014 },
  ];

  const insulatorPoint = (pole, side) => ({
    x: pole.x + side * 31 * pole.scale,
    y: pole.y - 149 * pole.scale,
  });

  push();
  noFill();
  stroke(117, 120, 128, 155);
  strokeWeight(2.6);
  for (let index = 0; index < poles.length - 1; index++) {
    const start = insulatorPoint(poles[index], 1);
    const end = insulatorPoint(poles[index + 1], -1);
    const middleX = (start.x + end.x) * .5;
    const sag = 22 + Math.abs(end.x - start.x) * .022;
    bezier(
      start.x, start.y,
      lerp(start.x, middleX, .72), start.y + sag,
      lerp(middleX, end.x, .28), end.y + sag,
      end.x, end.y
    );
  }
  pop();

  for (const pole of poles) drawBackgroundPowerPole(pole);
}

function drawBackgroundPowerPole(pole) {
  push();
  translate(pole.x, pole.y);
  rotate(pole.rotation);
  scale(pole.scale);
  noStroke();

  // Tapered pole and cross-arm use the reference model's geometry.
  fill(102, 105, 113, 205);
  polygon([[-6, 0], [-4.2, -151], [4.5, -151], [6.5, 0]]);
  fill(130, 133, 141, 190);
  rectMode(CENTER);
  rect(0, -54, 14, 5);

  fill(88, 91, 99, 215);
  polygon([[-52, -145], [-46, -151], [40, -151], [54, -144], [40, -138], [-47, -139]]);
  stroke(88, 91, 99, 215);
  strokeWeight(4);
  line(-3, -143, -31, -123);
  line(3, -143, 30, -124);
  noStroke();

  drawBackgroundPoleInsulator(-31, -139);
  drawBackgroundPoleInsulator(31, -139);
  fill(145, 148, 156, 210);
  polygon([[0, -162], [11, -151], [0, -140], [-11, -151]]);
  fill(82, 85, 93, 220);
  rect(0, -128, 10, 22);
  rect(0, -115, 18, 5);
  pop();
}

function drawBackgroundPoleInsulator(x, y) {
  push();
  translate(x, y);
  rectMode(CENTER);
  fill(145, 148, 156, 205);
  rect(0, 0, 7, 18);
  fill(77, 80, 88, 220);
  rect(0, -2, 15, 3);
  rect(0, 4, 12, 3);
  circle(0, -10, 8);
  pop();
}

function advanceFactoryModel() {
  const storageKey = "stage2-exhaust-last-factory";
  if (factoryModelIndex < 0) {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null && /^[0-2]$/.test(saved)) factoryModelIndex = Number(saved);
    } catch (_) {
      // Some local-file browsers disable storage; allow the artwork to run.
    }
    if (factoryModelIndex < 0) factoryModelIndex = Math.floor(Math.random() * 3);
  }
  factoryModelIndex = (factoryModelIndex + 1) % 3;
  try {
    localStorage.setItem(storageKey, String(factoryModelIndex));
  } catch (_) {}
}

function emitAmbientSmoke() {
  // Use the same transform as the factory so smoke starts at the chimney lip.
  const factoryScale = getFactoryScale();
  const chimneys = factoryChimneys(factoryModelIndex);
  for (let index = 0; index < SMOKE_PUFFS_PER_EMISSION; index++) {
    const chimney = chimneys[index % chimneys.length];
    const originX = width * 0.5 + chimney.x * factoryScale;
    const originY = height * 0.5 + (58 + chimney.y - chimney.h * .5 - 2) * factoryScale;
    const launchAngle = -Math.PI / 2 + random(-0.06, 0.06);
    const launchSpeed = random(60, 73.2);
    const baseSize = random(16, 26);
    fossilParticles.push({
      x: originX + random(-3, 3), y: originY,
      originY, baseSize, maxSize: random(104, 186), life: random(14, 20.5),
      plumeSeed: compositionSeed + (index % chimneys.length) * 71.37,
      plumeBias: random(-.025, .025), baseRotation: random(-.18, .18),
      accent: random() < .055 ? 'orange' : random() < .14 ? 'violet' : 'grey',
      smokeFamily: floor(random(INDUSTRY_SMOKE_OUTER.length)),
      vx: cos(launchAngle) * launchSpeed, vy: sin(launchAngle) * launchSpeed,
      size: baseSize, rotation: 0, rotationSpeed: random(-0.25, 0.25),
      wanderAngle: launchAngle, wanderSpeed: random(85, 130),
      wanderSeed: random(1000), age: 0,
    });
  }
  if (fossilParticles.length > MAX_SMOKE_PARTICLES) {
    fossilParticles.splice(0, fossilParticles.length - MAX_SMOKE_PARTICLES);
  }
}


/* ============================================================
   VISIBLE POLLUTION — impact soot, toxic air, fallout and slicks
   Render-only effects use their own deterministic variation so they
   never consume the simulation's random sequence or change collisions.
============================================================ */
function pollutionVariation(index) {
  const n = Math.sin(index * 127.1 + compositionSeed * .0001) * 43758.5453;
  return n - Math.floor(n);
}

function pollutionMotionTime() {
  return reducedMotionPreference?.matches ? 0 : elapsedTime;
}

function emitPollutionBurst(object) {
  pollutionBursts.push({
    x: object.x, y: object.y, size: object.size,
    born: elapsedTime, seed: object.sequenceIndex * 31 + object.phase,
  });
  // A fixed upper bound also covers rapid repeated clicks.
  if (pollutionBursts.length > 12) pollutionBursts.shift();
}

function drawDamagedObjectPollution() {
  const t = pollutionMotionTime();
  const p = displayedEnvironmentProgress;
  push();
  for (const object of naturalObjects) {
    if (object.state === "alive" || object.state === "shattered" || object.state === "sliced") continue;
    const s = object.size;
    // Three slow, angular fumes above each damaged organism or landscape.
    for (let i = 0; i < 3; i++) {
      const phase = (t * .19 + i / 3 + object.phase * .01) % 1;
      const a = Math.sin(phase * Math.PI) * (40 + p * 30);
      push();
      translate(object.x + Math.sin(phase * 4 + object.phase) * s * .22 + phase * s * .42,
        object.y - s * .12 - phase * s * 1.2);
      scale(s * (.17 + phase * .34));
      noStroke();
      fill(91, 86, 63, a);
      polygon([[-.9,-.2],[-.5,-.8],[.2,-1],[.8,-.4],[1,.2],[.4,.65],[-.6,.5]]);
      pop();
    }
    if (object.state === "polluted") {
      push();
      translate(object.x, object.y);
      rotate(object.rotation);
      noFill();
      strokeWeight(Math.max(1.5, s * .025));
      // Broken iridescent contours distinguish oil from ordinary water.
      for (let ring = 0; ring < 3; ring++) {
        stroke(ring === 1 ? 153 : 119, ring === 1 ? 123 : 103, ring === 1 ? 57 : 148, 175);
        beginShape();
        for (let j = 0; j < 10; j++) {
          const a = j / 11 * Math.PI * 2 + ring * .8 + t * .09;
          vertex(Math.cos(a) * s * (.32 + ring * .1), Math.sin(a) * s * (.10 + ring * .04));
        }
        endShape();
      }
      pop();
    }
  }
  pop();
}

function drawPollutionEffects() {
  const p = displayedEnvironmentProgress;
  const t = pollutionMotionTime();
  push();
  noStroke();
  // Warm smog moves across the foreground, visibly obscuring distant objects.
  if (p > .01) {
    for (let band = 0; band < 4; band++) {
      const y = height * (.12 + band * .24) + Math.sin(t * .09 + band) * 25;
      fill(113, 91, 48, p * (12 + band * 3));
      beginShape();
      for (let x = -100; x <= width + 100; x += 80) {
        vertex(x, y + Math.sin(x * .006 + band * 2 + t * .1) * (22 + p * 30));
      }
      for (let x = width + 100; x >= -100; x -= 80) {
        vertex(x, y + 55 + p * 65 + Math.sin(x * .005 + band + t * .08) * 22);
      }
      endShape(CLOSE);
    }
    // Suspended carbon and falling ash become more numerous with damage.
    const count = Math.ceil(p * POLLUTION_ASH_LIMIT);
    for (let i = 0; i < count; i++) {
      const [a, b, sizeSeed] = pollutionAshSeeds[i];
      const x = (a * (width + 80) + t * (12 + b * 19)) % (width + 80) - 40;
      const y = (b * (height + 80) + t * (18 + a * 32)) % (height + 80) - 40;
      const size = 2.5 + sizeSeed * 5;
      const alpha = Math.min(1, p * POLLUTION_ASH_LIMIT - i) * (90 + p * 85);
      push();
      translate(x + Math.sin(t * .6 + i) * 12, y);
      rotate(i + t * .16);
      fill(i % 3 === 0 ? 184 : 32, i % 3 === 0 ? 167 : 30, i % 3 === 0 ? 131 : 27, alpha);
      polygon([[-size,0],[-size*.2,-size*.6],[size*.65,-size*.2],[size*.4,size*.6]]);
      pop();
    }
    // A ragged deposit grows upward along the bottom edge as soot settles.
    for (let layer = 0; layer < 3; layer++) {
      fill(25 + layer * 8, 23 + layer * 7, 21 + layer * 4, p * 105);
      beginShape();
      vertex(0, height); vertex(width, height);
      for (let x = width; x >= 0; x -= 40) {
        vertex(x, height - p * (18 + layer * 17 + pollutionVariation(x + layer * 99) * 48));
      }
      endShape(CLOSE);
    }
  }
  // Every actual hit releases an expanding cloud and a shower of dark flakes.
  for (const burst of pollutionBursts) {
    const age = elapsedTime - burst.born;
    const fade = Math.max(0, 1 - age / 3.6);
    const travel = t === 0 ? .3 : age;
    for (let i = 0; i < 14; i++) {
      const r = pollutionVariation(burst.seed + i);
      const angle = i * 2.399;
      const distance = travel * (22 + r * 45);
      const size = burst.size * (.1 + r * .14) * (1 + travel * .48);
      push();
      translate(burst.x + Math.cos(angle) * distance + travel * 18,
        burst.y + Math.sin(angle) * distance * .55 - travel * 28);
      rotate(angle);
      fill(49 + r * 35, 45 + r * 24, 34 + r * 15, fade * 100);
      polygon([[-size,0],[-size*.6,-size*.7],[size*.3,-size],[size,size*.1],[size*.4,size*.7],[-size*.5,size*.5]]);
      fill(22, 21, 20, fade * 210);
      polygon([[0,0],[4+r*4,-3],[7,3],[1,5]]);
      pop();
    }
  }
  pollutionBursts = pollutionBursts.filter(burst => elapsedTime - burst.born < 3.6);
  pop();
}


function drawCachedAtmosphere() {
  // Only the softly moving background runs at 10 Hz. Objects, impacts,
  // input and the simulation still update at the main animation rate.
  if (!atmosphereCache) {
    atmosphereCache = document.createElement("canvas");
    atmosphereCache.width = ARTBOARD_WIDTH / 2;
    atmosphereCache.height = ARTBOARD_HEIGHT / 2;
  }
  if (elapsedTime - atmosphereUpdatedAt >= .1) {
    importedPollutedBackground.draw();
    drawBackgroundSmog();
    drawBackgroundPowerGrid();
    drawBackgroundFactories();
    const cacheContext = atmosphereCache.getContext("2d");
    // Preserve the reference colors and their gradual warm pollution shift.
    cacheContext.filter = "none";
    cacheContext.drawImage(canvasElement, 0, 0, atmosphereCache.width, atmosphereCache.height);
    cacheContext.filter = "none";
    atmosphereUpdatedAt = elapsedTime;
  }
  drawingContext.drawImage(atmosphereCache, 0, 0, width, height);
}


function drawBackgroundFactories() {
  for (const factory of BACKGROUND_FACTORIES) {
    push();
    translate(factory.x, factory.y); scale(factory.scale);
    noStroke(); rectMode(CENTER);
    // Filter only this cached factory, making chimneys and accents neutral too.
    drawingContext.save(); drawingContext.filter = "grayscale(1)";
    for (const chimney of factoryChimneys(factory.model)) drawFactoryChimney(chimney, 1, false, displayedEnvironmentProgress);
    fill(112,115,121); factoryBaseBody(factory.model);
    fill(63,66,72); factoryAccentBody(factory.model);
    fill(179,181,183); rect(-14,30,20,18);
    drawingContext.restore(); pop();
  }
}

function updateBackgroundFactorySmoke(dt) {
  backgroundSmokeTimer -= dt;
  if (backgroundSmokeTimer <= 0) {
    backgroundSmokeTimer += 3.2 / 3.75;
    for (const factory of BACKGROUND_FACTORIES) {
      const chimneys = factoryChimneys(factory.model);
      for (let i = 0; i < chimneys.length; i++) {
        const chimney = chimneys[i], scale = factory.scale;
        const originY = factory.y + (chimney.y - chimney.h * .5 - 2) * scale;
        const baseSize = random(16,26) * scale;
        backgroundFactorySmoke.push({
          x: factory.x + chimney.x * scale, y: originY, originY,
          baseSize, maxSize: random(104,186) * scale, life: random(8,12),
          plumeSeed: compositionSeed + factory.x + i * 71.37,
          plumeBias: random(-.025,.025), baseRotation: random(-.18,.18),
          accent: 'grey', smokeFamily: floor(random(4)),
          vx: 0, vy: -60, size:baseSize, rotation:0, wanderSeed:random(1000), age:0,
        });
      }
    }
    if (backgroundFactorySmoke.length > 108) backgroundFactorySmoke.splice(0, backgroundFactorySmoke.length - 108);
  }
  backgroundFactorySmoke = advanceFactorySmoke(dt, backgroundFactorySmoke);
}

function drawDestructionFlashes() {
  const ctx = drawingContext, reduced = reducedMotionPreference?.matches;
  ctx.save();
  for (const hit of destructionFlashes) {
    const age = elapsedTime - hit.born;
    const fade = Math.max(0, 1 - age / .85);
    const radius = hit.size * (.28 + (reduced ? .25 : age * 1.8));
    ctx.globalAlpha = fade;
    ctx.strokeStyle = '#FFC46B'; ctx.lineWidth = 2 + fade * 3;
    ctx.beginPath(); ctx.arc(hit.x,hit.y,radius,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle = '#F4F1EC';ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i=0;i<12;i++) {
      const angle=i*Math.PI/6+.13, inner=radius*1.12, outer=inner+hit.size*.27*fade;
      ctx.moveTo(hit.x+Math.cos(angle)*inner,hit.y+Math.sin(angle)*inner);
      ctx.lineTo(hit.x+Math.cos(angle)*outer,hit.y+Math.sin(angle)*outer);
    }
    ctx.stroke();
    if (age < .18 && !reduced) {
      ctx.globalAlpha = (1-age/.18)*.8;
      ctx.fillStyle='#FFF1C7';ctx.beginPath();ctx.arc(hit.x,hit.y,hit.size*.3,0,Math.PI*2);ctx.fill();
    }
  }
  ctx.restore();
  destructionFlashes = destructionFlashes.filter(hit=>elapsedTime-hit.born<.85);
}




function drawStorm() {
  rainWanted = displayedEnvironmentProgress >= .95;
  syncRainPlayback();
  if (!rainWanted) return;
  if(stormStartedAt < 0) { stormStartedAt=elapsedTime;nextLightningAt=elapsedTime; }
  if(elapsedTime >= nextLightningAt) {
    lightningAt=elapsedTime;lightningX=width*(.18+pollutionVariation(Math.floor(elapsedTime)+800)*.64);
    nextLightningAt=elapsedTime+6+pollutionVariation(elapsedTime)*3;
    playProjectSound("thunder", 0.55);
  }
  const ctx=drawingContext, reduced=reducedMotionPreference?.matches;
  const t=reduced?0:elapsedTime;
  const intensity=Math.min(1,(elapsedTime-stormStartedAt)/1.2);
  ctx.save();ctx.fillStyle=`rgba(13,20,30,${intensity*.2})`;ctx.fillRect(0,0,width,height);
  // Three batched paths draw 360 rain streaks without individual particles.
  for(let layer=0;layer<3;layer++) {
    ctx.strokeStyle=`rgba(180,198,211,${intensity*(.18+layer*.09)})`;
    ctx.lineWidth=1+layer*.55;ctx.beginPath();
    for(let i=0;i<120;i++) {
      const seed=i+layer*120, a=pollutionVariation(seed+1200), b=pollutionVariation(seed+1600);
      const x=(a*(width+240)-t*(110+layer*35))%(width+240);
      const wrapped=(x+width+240)%(width+240)-120;
      const y=(b*(height+160)+t*(650+layer*180))%(height+160)-80;
      ctx.moveTo(wrapped,y);ctx.lineTo(wrapped-10-layer*4,y+25+layer*14);
    }
    ctx.stroke();
  }
  const flashAge=elapsedTime-lightningAt;
  if(flashAge<.65 && !reduced) {
    const alpha=Math.max(0,1-flashAge/.65);
    ctx.fillStyle=`rgba(220,230,255,${alpha*.20})`;ctx.fillRect(0,0,width,height);
    ctx.strokeStyle=`rgba(236,242,255,${alpha})`;ctx.lineWidth=3;ctx.beginPath();
    ctx.moveTo(lightningX,0);
    for(let i=1;i<9;i++) ctx.lineTo(lightningX+(pollutionVariation(i+lightningAt)*2-1)*90,i*height*.075);
    ctx.stroke();
  }
  ctx.restore();
}

