const ARTBOARD_WIDTH = 1920;
const ARTBOARD_HEIGHT = 1080;
const STAGE_LABEL = "STAGE 2";
const STAGE_NAME = "EXHAUST";
const NATURAL_OBJECT_COUNT = 22;
const BACKGROUND_OBJECT_COUNT = 10;
const FOSSIL_PARTICLES_PER_CLICK = 3;
const MAX_FOSSIL_PARTICLES = 180;
const INITIAL_BUTTON_CLEARANCE = 360;
const FOSSIL_CORE_RADIUS = 142;

const STACK_SANS_NOTCH_CSS_URL =
  "https://fonts.googleapis.com/css2?family=Stack+Sans+Notch:wght@400&display=swap";

const SUBTITLES = [
  "Click the button to use fossil energy!",
  "You are producing pollutants every time you use fossil fuels. (Please continue clicking!)",
  "The more fossil fuel used, the more the environment gets ruined by pollutants (Please continue clicking!)",
  'The beautiful landscapes, the wildlife, everything humans may consider "natural beauty", will disappear. (Please continue clicking!)',
  "Soon, all of our natural resources will disappear, giving us nothing left to survive on. (Please continue clicking!)",
  "Even now, if we stopped using fossil fuels, the damage is done, and the environment will never be the same again (Please continue clicking!)",
  "However, we can still save our home planet, and slow down pollution. How can we achieve this?",
];

const PALETTE = {
  charcoal: [20, 20, 20],
  grey: [158, 162, 163],
  white: [255, 255, 255],
  blue: [32, 51, 255],
  purple: [105, 82, 235],
  orange: [254, 125, 33],
  lime: [179, 255, 59],
};

let canvasElement;
let fossilEnergyButton;
let informationButton;
let informationOverlay;
let informationPanelOpen = false;
let fossilEnergyHover = false;
let fossilEnergyPressed = false;
let compositionSeed = 1;
let backgroundPatternShapes = [];
let elapsedTime = 0;
let naturalObjects = [];
let backgroundObjects = [];
let shatteredPieces = [];
let fossilParticles = [];
let environmentDestructionClicks = 0;
let subtitleIndex = 0;
let subtitleClicksSinceChange = 0;
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

  const createdCanvas = createCanvas(ARTBOARD_WIDTH, ARTBOARD_HEIGHT);

  createdCanvas.attribute(
    "aria-label",
    "Fossil energy launches guided orange particles that damage floating natural objects"
  );

  pixelDensity(1);
  frameRate(60);
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

  updateBackgroundObjects(dt);
  updateNaturalObjects(dt);
  updateShatteredPieces(dt);
  updateFossilParticles(dt);

  background(...PALETTE.charcoal);

  drawBackgroundPattern();
  drawBackgroundObjects();
  drawNaturalObjects();
  drawShatteredPieces();
  drawFossilParticles();
  drawFossilEnergyCore();

  updateFigmaSubtitle();
}

function regenerateArtwork() {
  environmentDestructionClicks = 0;
  updateEnvironmentProgress();
  compositionSeed = createSeed();

  randomSeed(compositionSeed);
  noiseSeed(compositionSeed ^ 0x5f3759df);
  regenerateBackgroundPattern();

  elapsedTime = 0;
  naturalObjects = [];
  backgroundObjects = [];
  shatteredPieces = [];
  fossilParticles = [];

  fossilEnergyHover = false;
  fossilEnergyPressed = false;

  subtitleIndex = 0;
  subtitleClicksSinceChange = 0;

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

    <div
      class="stage2-badge-layer stage2-badge-back"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 528.427 224.586"
        preserveAspectRatio="none"
      >
        <path
          d="M18.0439 56.19L522.987 0L528.427 224.586L0 181.073L18.0439 56.19Z"
          fill="white"
        />
      </svg>
    </div>

    <div
      class="stage2-badge-layer stage2-badge-middle"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 576.914 170.512"
        preserveAspectRatio="none"
      >
        <path
          d="M0 0H566.157L576.914 141.997L0 170.512V0Z"
          fill="black"
        />
      </svg>
    </div>

    <div
      class="stage2-badge-layer stage2-badge-front"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 561.965 230.853"
        preserveAspectRatio="none"
      >
        <path
          d="M12.1674 0L561.965 59.7359L524.092 206.036L0 230.853L12.1674 0Z"
          fill="#1D39B7"
        />
      </svg>
    </div>

    <div class="stage2-badge-title">
      ${STAGE_NAME}
    </div>

    <div class="stage2-badge-stage">
      ${STAGE_LABEL}
    </div>

    <div
      class="stage2-subtitle is-visible"
      aria-live="polite"
    >
      <svg
        class="stage2-subtitle-shadow"
        viewBox="0 0 1285 112"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M34.5 0H1267.5L1285 112H0L34.5 0Z"
          fill="#8CFF00"
        />
      </svg>

      <svg
        class="stage2-subtitle-frame"
        viewBox="0 0 1298 96"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 0H1298L1269.49 96H36.0139L0 0Z"
          fill="#FF6600"
        />
      </svg>

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

  const nextText = SUBTITLES[subtitleIndex] || SUBTITLES[0];

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
  });
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

    .stage2-badge-layer {
      position: absolute;
      pointer-events: none;
    }

    .stage2-badge-layer svg {
      width: 100%;
      height: 100%;
      display: block;
      transform: rotate(-8.22deg);
    }

    .stage2-badge-back {
      left: 65.239px;
      top: 80.109px;
      width: 396.320px;
      height: 168.440px;
    }

    .stage2-badge-middle {
      left: 73.270px;
      top: 110.845px;
      width: 432.685px;
      height: 127.884px;
    }

    .stage2-badge-front {
      left: 55px;
      top: 55px;
      width: 421.474px;
      height: 173.140px;
    }

    .stage2-badge-title,
    .stage2-badge-stage {
      position: absolute;
      z-index: 2;
      margin: 0;
      color: #fff;
      font-weight: 700;
      text-transform: uppercase;
      transform: rotate(-1.03deg);
      transform-origin: center;
      pointer-events: none;
      line-height: 1;
    }

    .stage2-badge-title {
      left: 100.69px;
      top: 123px;
      font-size: 64px;
      letter-spacing: -0.02em;
    }

    .stage2-badge-stage {
      left: 136.69px;
      top: 87.6px;
      font-size: 28px;
      line-height: 1.3;
    }

    .stage2-subtitle {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .stage2-subtitle-shadow,
    .stage2-subtitle-frame,
    .stage2-subtitle-panel,
    .stage2-subtitle-text {
      position: absolute;
    }

    .stage2-subtitle-shadow {
      left: 446px;
      top: 950px;
      width: 1028px;
      height: 89.6px;
    }

    .stage2-subtitle-frame {
      left: 440.8px;
      top: 940.4px;
      width: 1038.4px;
      height: 76.8px;
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

    .ambience-trigger[data-muted="true"] {
      --control-face: #6952eb;
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
      display: grid;
      grid-template-columns: 1fr 1.21fr;
      gap: 18px clamp(30px, 3.35vw, 64px);
      padding: clamp(24px, 1.55vw, 30px) clamp(24px, 2.4vw, 46px) clamp(30px, 2.9vw, 56px);
      font-size: clamp(16px, 1.08vw, 21px);
      line-height: 1.5;
    }
    .project-info-body h3 {
      margin: 0 0 25px;
      color: #243eb5;
      font: 700 clamp(14px, .95vw, 18px)/1.4 Arial, sans-serif;
    }
    .project-info-body p { margin: 0; }
    .project-info-intro {
      font-size: clamp(20px, 1.4vw, 27px);
      line-height: 1.45;
      margin-bottom: 16px !important;
    }
    .project-sdg-context {
      padding: clamp(20px, 1.55vw, 30px);
      border-left: 5px solid #ff7d21;
      background: #cfd8e6;
    }
    .project-info-guide ol { margin: 0; padding-left: 32px; }
    .project-info-guide li { padding-left: 8px; }
    .project-info-guide li + li { margin-top: clamp(22px, 2vw, 38px); }
    .project-info-footer {
      grid-column: 1 / -1;
      padding-top: 20px;
      border-top: 2px solid #10102226;
    }
    .project-info-shortcuts {
      color: #373e4d;
      font: 700 clamp(12px, .92vw, 18px)/1.6 Arial, sans-serif;
    }
    .project-info-credits {
      display: flex;
      flex-wrap: wrap;
      gap: 12px clamp(40px, 8vw, 154px);
      margin-top: 16px;
      color: #ff6600;
      text-transform: uppercase;
      font: 700 clamp(16px, 1.08vw, 21px)/1.4 Arial, sans-serif;
    }
    @media (max-width: 700px) {
      .project-info-overlay { padding: 14px; }
      .project-info-window { width: 100%; max-height: calc(100dvh - 28px); }
      .project-info-body { grid-template-columns: 1fr; gap: 28px; padding: 22px; }
      .project-info-header { padding: 18px 22px; }
      .project-info-footer { grid-column: 1; }
    }

    @media (prefers-reduced-motion: reduce) {
      .stage2-subtitle.subtitle-pop {
        animation:
          none;
      }

      .figma-control {
        transition:
          none;
      }
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
    "Launch guided fossil-energy particles at one floating natural object"
  );

  fossilEnergyButton.style("position", "fixed");

  fossilEnergyButton.style("left", "50%");

  fossilEnergyButton.style("top", "50%");

  fossilEnergyButton.style("transform", "translate(-50%, -50%)");

  fossilEnergyButton.style("width", `${FOSSIL_CORE_RADIUS * 1.8}px`);

  fossilEnergyButton.style("height", `${FOSSIL_CORE_RADIUS * 1.8}px`);

  fossilEnergyButton.style("z-index", "20");

  fossilEnergyButton.style("border", "0");

  fossilEnergyButton.style("border-radius", "50%");

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

  informationButton.attribute("data-tooltip", "Interaction guide · I");

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
        <h2 id="project-information-title">ABOUT EXHAUST</h2>
        <button class="information-close" type="button" aria-label="Close project information">
          ${closeIconSvg()}
        </button>
      </header>
      <div class="project-info-body">
        <div class="project-info-story">
          <p class="project-info-intro">Exhaust demonstrates how the increased usage of fossil fuel can greatly harm the environment and damage natural resources.</p>
          <div class="project-sdg-context">
            <h3>SDG 7 · AFFORDABLE &amp; CLEAN ENERGY</h3>
            <p>Reliable, affordable and sustainable energy supports everyday life. Exhaust explores the environmental cost of fossil-fuel use as pollutants damage natural resources, showing why cleaner energy matters.</p>
          </div>
        </div>
        <div class="project-info-guide">
          <h3>POWER THE FIELD</h3>
          <ol>
            <li>Click the central <strong>FOSSIL ENERGY</strong> button to release three pollutant particles.</li>
            <li>Watch particles track natural objects and turn them into damaged forms or shattered pieces.</li>
            <li>Keep clicking to follow the captions. The <strong>circular arrow</strong> resets the scene; the <strong>speaker</strong> opens the sound mixer</li>
          </ol>
        </div>
        <footer class="project-info-footer">
          <p class="project-info-shortcuts">Exhaust – Stage 2 &nbsp; · &nbsp; COMM2754 &nbsp; · &nbsp; SDG 7 &nbsp; · &nbsp; R reset &amp; replay &nbsp; · &nbsp; speaker sound mixer &nbsp; · &nbsp; I guide</p>
          <div class="project-info-credits"><span>Luong Duc Hung</span><span>SID: S4010990</span></div>
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
    fossilEnergyButton.elt.disabled = shouldOpen;

    fossilEnergyButton.style("pointer-events", shouldOpen ? "none" : "auto");
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
  environmentDestructionClicks = Math.min(21, environmentDestructionClicks + 1);
  updateEnvironmentProgress();
  playProjectSound("mouseClick", 0.34);

  playProjectSound("blowPaper", 0.28);

  advanceSubtitleAfterClick();

  const targetObject = chooseFossilParticleTarget();

  const targetVersion = targetObject?.spawnVersion;

  const originX = width * 0.5;

  const originY = height * 0.5;

  const targetAngle = targetObject
    ? atan2(targetObject.y - originY, targetObject.x - originX)
    : random(TWO_PI);

  for (
    let particleIndex = 0;
    particleIndex < FOSSIL_PARTICLES_PER_CLICK;
    particleIndex++
  ) {
    const launchAngle = targetAngle + random(-0.22, 0.22);

    const launchRadius = random(42, 70);

    const launchSpeed = random(165, 220);

    const particle = {
      x: originX + cos(launchAngle) * launchRadius,

      y: originY + sin(launchAngle) * launchRadius,

      vx: cos(launchAngle) * launchSpeed,

      vy: sin(launchAngle) * launchSpeed,

      cruiseSpeed: random(325, 410),

      turnRate: random(4.8, 6.4),

      size: random(9, 14),

      rotation: random(TWO_PI),

      rotationSpeed: random(-3.2, 3.2),

      target: targetObject,

      targetVersion,

      mode: targetObject ? "homing" : "wandering",

      wanderAngle: launchAngle,

      wanderSpeed: random(34, 62),

      wanderSeed: random(1000),

      life: random(18, 25),
    };

    if (!targetObject) {
      beginParticleWander(particle);
    }

    fossilParticles.push(particle);
  }

  if (fossilParticles.length > MAX_FOSSIL_PARTICLES) {
    fossilParticles.splice(0, fossilParticles.length - MAX_FOSSIL_PARTICLES);
  }

  fossilEnergyPressed = true;

  setTimeout(restoreButtonStyle, 120);
}

function advanceSubtitleAfterClick() {
  if (subtitleIndex === 0) {
    subtitleIndex = 1;

    subtitleClicksSinceChange = 0;

    updateFigmaSubtitle();

    return;
  }

  subtitleClicksSinceChange += 1;

  if (subtitleClicksSinceChange >= 4 && subtitleIndex < SUBTITLES.length - 1) {
    subtitleIndex += 1;

    subtitleClicksSinceChange = 0;

    updateFigmaSubtitle();
  }
}

function chooseFossilParticleTarget() {
  const reservedTargets = new Set(
    fossilParticles
      .filter((particle) => particle.mode === "homing" && particle.target)
      .map((particle) => particle.target)
  );

  const livingObjects = naturalObjects.filter(
    (naturalObject) =>
      naturalObject.state === "alive" && !reservedTargets.has(naturalObject)
  );

  const clearlyVisibleObjects = livingObjects.filter(
    (naturalObject) =>
      naturalObject.x > naturalObject.size * 0.6 &&
      naturalObject.x < width - naturalObject.size * 0.6 &&
      naturalObject.y > naturalObject.size * 0.6 &&
      naturalObject.y < height - naturalObject.size * 0.6
  );

  const candidates =
    clearlyVisibleObjects.length > 0 ? clearlyVisibleObjects : livingObjects;

  return candidates.length > 0 ? random(candidates) : null;
}

/* ============================================================
   NATURAL OBJECTS
============================================================ */

function resetNaturalObject(
  naturalObject,
  initialPlacement = false,
  sequenceIndex = 0
) {
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

  const objectType = typeCycle[floor(random(typeCycle.length))];

  const sizeRanges = {
    tree: [92, 145],
    mountain: [125, 190],
    pond: [120, 178],
    cloud: [105, 165],
    flower: [68, 108],
    leaf: [72, 118],
    fish: [88, 138],
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

  const initialTravel = initialPlacement
    ? constrain(
        map(sequenceIndex, 0, NATURAL_OBJECT_COUNT - 1, 0.08, 0.92) +
          random(-0.12, 0.12),

        0.03,
        0.96
      )
    : 0;

  naturalObject.type = objectType;

  naturalObject.size = objectSize;

  naturalObject.x = lerp(spawnX, targetX, initialTravel);

  naturalObject.y = lerp(spawnY, targetY, initialTravel);

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

  naturalObject.state = "alive";
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
}

function updateBackgroundObjects(dt) {
  backgroundObjects.forEach((backgroundObject) => {
    moveFloatingObject(backgroundObject, dt);

    const exitMargin = backgroundObject.size * 1.45 + 95;

    if (
      backgroundObject.x < -exitMargin ||
      backgroundObject.x > width + exitMargin ||
      backgroundObject.y < -exitMargin ||
      backgroundObject.y > height + exitMargin
    ) {
      resetBackgroundObject(backgroundObject);
    }
  });
}

function updateNaturalObjects(dt) {
  naturalObjects.forEach((naturalObject) => {
    moveFloatingObject(naturalObject, dt);

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

/* ============================================================
   FOSSIL PARTICLE UPDATES
============================================================ */

function updateFossilParticles(dt) {
  fossilParticles.forEach((particle) => {
    particle.life -= dt;

    particle.rotation += particle.rotationSpeed * dt;

    if (particle.mode === "homing") {
      const targetIsValid =
        particle.target &&
        particle.target.state === "alive" &&
        particle.target.spawnVersion === particle.targetVersion;

      if (!targetIsValid) {
        beginParticleWander(particle);
      } else {
        guideParticleTowardTarget(particle, dt);
      }
    }

    if (particle.mode === "wandering") {
      updateWanderingParticle(particle, dt);
    }

    particle.x += particle.vx * dt;

    particle.y += particle.vy * dt;

    damageObjectHitByParticle(particle);

    if (particle.mode === "wandering") {
      wrapWanderingParticle(particle);
    }
  });

  fossilParticles = fossilParticles.filter((particle) => particle.life > 0);
}

function guideParticleTowardTarget(particle, dt) {
  const distanceToTarget = dist(
    particle.x,
    particle.y,
    particle.target.x,
    particle.target.y
  );

  const leadTime = constrain(distanceToTarget / particle.cruiseSpeed, 0, 0.7);

  const aimX = particle.target.x + particle.target.vx * leadTime * 0.62;

  const aimY = particle.target.y + particle.target.vy * leadTime * 0.62;

  const desiredHeading = atan2(aimY - particle.y, aimX - particle.x);

  const currentHeading = atan2(particle.vy, particle.vx);

  const headingDifference = atan2(
    sin(desiredHeading - currentHeading),

    cos(desiredHeading - currentHeading)
  );

  const nextHeading =
    currentHeading +
    constrain(
      headingDifference,

      -particle.turnRate * dt,

      particle.turnRate * dt
    );

  const currentSpeed = sqrt(
    particle.vx * particle.vx + particle.vy * particle.vy
  );

  const speedBlend = 1 - Math.exp(-dt * 3.6);

  const nextSpeed = lerp(currentSpeed, particle.cruiseSpeed, speedBlend);

  particle.vx = cos(nextHeading) * nextSpeed;

  particle.vy = sin(nextHeading) * nextSpeed;
}

function beginParticleWander(particle) {
  const currentHeading = atan2(particle.vy, particle.vx);

  particle.mode = "wandering";

  particle.target = null;

  particle.targetVersion = null;

  particle.wanderAngle = currentHeading + random(-0.55, 0.55);

  particle.wanderSpeed = particle.wanderSpeed || random(34, 62);

  particle.vx = cos(particle.wanderAngle) * particle.wanderSpeed;

  particle.vy = sin(particle.wanderAngle) * particle.wanderSpeed;

  particle.life = max(
    particle.life,

    random(14, 21)
  );
}

function updateWanderingParticle(particle, dt) {
  const randomTurn =
    (noise(particle.wanderSeed, elapsedTime * 0.19) - 0.5) * 2.8;

  particle.wanderAngle +=
    (randomTurn + sin(elapsedTime * 0.7 + particle.wanderSeed) * 0.22) * dt;

  const desiredVx = cos(particle.wanderAngle) * particle.wanderSpeed;

  const desiredVy = sin(particle.wanderAngle) * particle.wanderSpeed;

  const driftBlend = 1 - Math.exp(-dt * 1.7);

  particle.vx = lerp(particle.vx, desiredVx, driftBlend);

  particle.vy = lerp(particle.vy, desiredVy, driftBlend);
}

function damageObjectHitByParticle(particle) {
  for (const naturalObject of naturalObjects) {
    if (naturalObject.state !== "alive") {
      continue;
    }

    const collisionRadius = naturalObject.size * 0.38 + particle.size;

    const deltaX = naturalObject.x - particle.x;

    const deltaY = naturalObject.y - particle.y;

    if (deltaX * deltaX + deltaY * deltaY > collisionRadius * collisionRadius) {
      continue;
    }

    const impactResult = transformNaturalObject(naturalObject);

    playNaturalObjectImpactSounds(impactResult);

    beginParticleWander(particle);

    break;
  }
}

function wrapWanderingParticle(particle) {
  const wrapMargin = 24;

  if (particle.x < -wrapMargin) {
    particle.x = width + wrapMargin;
  } else if (particle.x > width + wrapMargin) {
    particle.x = -wrapMargin;
  }

  if (particle.y < -wrapMargin) {
    particle.y = height + wrapMargin;
  } else if (particle.y > height + wrapMargin) {
    particle.y = -wrapMargin;
  }
}

/* ============================================================
   DAMAGE TRANSFORMATIONS
============================================================ */

function transformNaturalObject(naturalObject) {
  if (
    (naturalObject.type === "mountain" && naturalObject.variant < 0.48) ||
    (naturalObject.type === "leaf" && naturalObject.variant < 0.32) ||
    (naturalObject.type === "cloud" && naturalObject.variant < 0.2)
  ) {
    naturalObject.state = "shattered";

    createShatteredPieces(naturalObject);

    return "exploded";
  }

  const damagedStates = {
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
    tree: [PALETTE.charcoal, PALETTE.grey, PALETTE.orange],

    mountain: [PALETTE.blue, PALETTE.grey, PALETTE.charcoal, PALETTE.orange],

    pond: [PALETTE.blue, PALETTE.charcoal, PALETTE.orange],

    cloud: [PALETTE.white, PALETTE.grey, PALETTE.charcoal],

    flower: [PALETTE.white, PALETTE.orange, PALETTE.charcoal],

    leaf: [PALETTE.lime, PALETTE.orange, PALETTE.charcoal],

    fish: [PALETTE.blue, PALETTE.grey, PALETTE.charcoal],
  };

  const availableColors = pieceColors[naturalObject.type];

  const pieceCount = floor(random(7, 11));

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

      vx: random(-85, 85),

      vy: random(-70, 15) + naturalObject.speed * 0.24,

      gravity: random(85, 145),

      size: random(
        naturalObject.size * 0.08,

        naturalObject.size * 0.22
      ),

      rotation: random(TWO_PI),

      rotationSpeed: random(-2.2, 2.2),

      fillColor: availableColors[pieceIndex % availableColors.length],

      life: random(3.8, 6.2),
    });
  }

  if (shatteredPieces.length > 180) {
    shatteredPieces.splice(0, shatteredPieces.length - 180);
  }
}

function updateShatteredPieces(dt) {
  shatteredPieces.forEach((shatteredPiece) => {
    shatteredPiece.x += shatteredPiece.vx * dt;

    shatteredPiece.y += shatteredPiece.vy * dt;

    shatteredPiece.vy += shatteredPiece.gravity * dt;

    shatteredPiece.rotation += shatteredPiece.rotationSpeed * dt;

    shatteredPiece.life -= dt;
  });

  shatteredPieces = shatteredPieces.filter(
    (shatteredPiece) =>
      shatteredPiece.life > 0 && shatteredPiece.y < height + 120
  );
}

/* ============================================================
   DRAW NATURAL OBJECTS
============================================================ */

function drawNaturalObjects() {
  naturalObjects.forEach((naturalObject) => {
    if (naturalObject.state === "shattered") {
      return;
    }

    push();

    translate(naturalObject.x, naturalObject.y);

    rotate(naturalObject.rotation);

    if (naturalObject.type === "tree") {
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

  const backgroundColor = [...PALETTE.grey, 82];

  noStroke();

  fill(...backgroundColor);

  if (backgroundObject.type === "tree") {
    polygon([
      [-objectSize * 0.065, objectSize * 0.5],
      [objectSize * 0.07, objectSize * 0.5],
      [objectSize * 0.045, -objectSize * 0.12],
      [-objectSize * 0.04, -objectSize * 0.12],
    ]);

    polygon(
      makeAngularBlobPoints(
        0,
        -objectSize * 0.22,
        objectSize * 0.48,
        objectSize * 0.38,
        backgroundObject.phase,
        9
      )
    );
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

function drawTree(naturalObject) {
  const objectSize = naturalObject.size;

  if (naturalObject.state === "alive") {
    drawOffsetPolygon(
      [
        [-objectSize * 0.065, objectSize * 0.5],
        [objectSize * 0.07, objectSize * 0.5],
        [objectSize * 0.045, -objectSize * 0.12],
        [-objectSize * 0.04, -objectSize * 0.12],
      ],
      PALETTE.charcoal,
      4
    );

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
      [-objectSize * 0.06, -objectSize * 0.18],
    ]);

    return;
  }

  push();

  rotate(naturalObject.variant < 0.5 ? -0.2 : 0.2);

  const trunkColor =
    naturalObject.variant < 0.5 ? PALETTE.charcoal : PALETTE.grey;

  drawOffsetPolygon(
    [
      [-objectSize * 0.06, objectSize * 0.52],
      [objectSize * 0.07, objectSize * 0.52],
      [objectSize * 0.04, -objectSize * 0.27],
      [-objectSize * 0.04, -objectSize * 0.27],
    ],
    trunkColor,
    4
  );

  stroke(...PALETTE.grey);

  strokeWeight(max(3, objectSize * 0.035));

  line(0, -objectSize * 0.02, -objectSize * 0.33, -objectSize * 0.3);

  line(0, -objectSize * 0.08, objectSize * 0.35, -objectSize * 0.35);

  line(
    -objectSize * 0.16,
    -objectSize * 0.18,
    -objectSize * 0.26,
    -objectSize * 0.43
  );

  line(
    objectSize * 0.18,
    -objectSize * 0.23,
    objectSize * 0.3,
    -objectSize * 0.45
  );

  noStroke();

  fill(...PALETTE.grey);

  polygon(
    makeAngularBlobPoints(
      0,
      -objectSize * 0.28,
      objectSize * 0.2,
      objectSize * 0.13,
      naturalObject.phase,
      7
    )
  );

  stroke(...PALETTE.orange);

  strokeWeight(2.5);

  line(0, objectSize * 0.34, objectSize * 0.035, objectSize * 0.08);

  noStroke();

  for (let leafIndex = 0; leafIndex < 4; leafIndex++) {
    const fallY =
      (elapsedTime * (18 + leafIndex * 3) + naturalObject.phase * 0.3) %
      (objectSize * 0.9);

    fill(...(leafIndex % 2 === 0 ? PALETTE.orange : PALETTE.purple));

    polygon([
      [
        -objectSize * 0.18 + leafIndex * objectSize * 0.11,

        -objectSize * 0.18 + fallY,
      ],

      [
        -objectSize * 0.12 + leafIndex * objectSize * 0.11,

        -objectSize * 0.12 + fallY,
      ],

      [
        -objectSize * 0.18 + leafIndex * objectSize * 0.11,

        -objectSize * 0.06 + fallY,
      ],

      [
        -objectSize * 0.23 + leafIndex * objectSize * 0.11,

        -objectSize * 0.12 + fallY,
      ],
    ]);
  }

  pop();
}

/* ============================================================
   MOUNTAIN
============================================================ */

function drawMountain(naturalObject) {
  const objectSize = naturalObject.size;

  const ruined = naturalObject.state === "ruined";

  const bodyColor = ruined
    ? naturalObject.variant < 0.5
      ? PALETTE.grey
      : PALETTE.charcoal
    : naturalObject.variant < 0.5
    ? PALETTE.blue
    : PALETTE.purple;

  const mountainPoints = [
    [-objectSize * 0.58, objectSize * 0.38],
    [-objectSize * 0.26, objectSize * 0.02],
    [0, -objectSize * 0.52],
    [objectSize * 0.22, -objectSize * 0.06],
    [objectSize * 0.58, objectSize * 0.38],
  ];

  drawOffsetPolygon(mountainPoints, bodyColor, 6);

  fill(...(ruined ? PALETTE.grey : PALETTE.white));

  polygon([
    [0, -objectSize * 0.52],
    [-objectSize * 0.15, -objectSize * 0.2],
    [-objectSize * 0.03, -objectSize * 0.27],
    [objectSize * 0.08, -objectSize * 0.17],
    [objectSize * 0.18, -objectSize * 0.16],
  ]);

  if (ruined) {
    stroke(...PALETTE.orange);

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
    fill(...PALETTE.orange, 155);

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

    fill(...PALETTE.grey);

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

  const cloudColor = smog ? PALETTE.grey : PALETTE.white;

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
    fill(...PALETTE.orange);

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

  stroke(...(wilted ? PALETTE.grey : PALETTE.lime));

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

    fill(...(wilted ? PALETTE.grey : PALETTE.white));

    polygon([
      [0, 0],

      [-objectSize * 0.12, -objectSize * 0.22],

      [0, -objectSize * (wilted ? 0.24 : 0.4)],

      [objectSize * 0.12, -objectSize * 0.22],
    ]);

    pop();
  }

  fill(...(wilted ? PALETTE.charcoal : PALETTE.orange));

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

    withered ? PALETTE.orange : PALETTE.lime,

    5
  );

  stroke(...(withered ? PALETTE.charcoal : PALETTE.white));

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

      PALETTE.blue,
      5
    );

    fill(...PALETTE.purple);

    polygon([
      [-objectSize * 0.44, 0],
      [-objectSize * 0.7, -objectSize * 0.25],
      [-objectSize * 0.65, objectSize * 0.26],
    ]);

    fill(...PALETTE.white);

    polygon([
      [objectSize * 0.24, -objectSize * 0.08],
      [objectSize * 0.32, 0],
      [objectSize * 0.24, objectSize * 0.08],
      [objectSize * 0.16, 0],
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

  fill(...PALETTE.grey);

  polygon([
    [objectSize * 0.48, 0],
    [objectSize * 0.28, -objectSize * 0.18],
    [objectSize * 0.28, objectSize * 0.18],
  ]);

  fill(...PALETTE.orange);

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
  shatteredPieces.forEach((shatteredPiece) => {
    push();

    translate(shatteredPiece.x, shatteredPiece.y);

    rotate(shatteredPiece.rotation);

    noStroke();

    fill(...PALETTE.purple, 105);

    polygon([
      [3, -shatteredPiece.size * 0.58 + 3],

      [shatteredPiece.size * 0.62 + 3, 3],

      [3, shatteredPiece.size * 0.52 + 3],

      [-shatteredPiece.size * 0.4 + 3, 3],
    ]);

    fill(...shatteredPiece.fillColor);

    polygon([
      [0, -shatteredPiece.size * 0.58],

      [shatteredPiece.size * 0.62, 0],

      [0, shatteredPiece.size * 0.52],

      [-shatteredPiece.size * 0.4, 0],
    ]);

    pop();
  });
}

/* ============================================================
   PARTICLE DRAWING
============================================================ */

function drawFossilParticles() {
  fossilParticles.forEach((particle) => {
    const heading = atan2(particle.vy, particle.vx);

    const particleAlpha = constrain(particle.life * 115, 0, 230);

    const trailLength =
      particle.mode === "homing" ? particle.size * 2.5 : particle.size * 1.15;

    push();

    translate(particle.x, particle.y);

    rotate(heading);

    stroke(...PALETTE.orange, particleAlpha * 0.48);

    strokeWeight(max(1.2, particle.size * 0.24));

    line(-trailLength, 0, -particle.size * 0.25, 0);

    noStroke();

    fill(...PALETTE.purple, particleAlpha * 0.46);

    polygon([
      [particle.size * 1.15 + 1.5, 1.5],

      [-particle.size * 0.7 + 1.5, -particle.size * 0.62 + 1.5],

      [-particle.size * 0.42 + 1.5, particle.size * 0.62 + 1.5],
    ]);

    fill(...PALETTE.orange, particleAlpha);

    polygon([
      [particle.size * 1.15, 0],

      [-particle.size * 0.7, -particle.size * 0.62],

      [-particle.size * 0.42, particle.size * 0.62],
    ]);

    pop();
  });
}

/* ============================================================
   FOSSIL ENERGY CORE
============================================================ */

function drawFossilEnergyCore() {
  const hoverScale = fossilEnergyHover ? 1.07 : 1;

  const pressScale = fossilEnergyPressed ? 0.94 : 1;

  const pulse = 1 + sin(elapsedTime * 1.3) * 0.018;

  const coreRadius = FOSSIL_CORE_RADIUS * hoverScale * pressScale * pulse;

  push();

  translate(
    width * 0.5,

    height * 0.5 + (fossilEnergyPressed ? 7 : 0)
  );

  fill(...PALETTE.purple, 190);

  polygon(
    makeAngularBlobPoints(11, 11, coreRadius * 1.16, coreRadius * 1.16, 91, 18)
  );

  push();

  rotate(-elapsedTime * 0.08);

  fill(...PALETTE.charcoal);

  polygon(
    makeAngularBlobPoints(0, 0, coreRadius * 0.8, coreRadius * 0.79, 171, 15)
  );

  fill(...PALETTE.orange, 205);

  polygon(
    makeAngularBlobPoints(0, 2, coreRadius * 0.57, coreRadius * 0.5, 241, 12)
  );

  fill(...PALETTE.charcoal);

  polygon(
    makeAngularBlobPoints(0, 0, coreRadius * 0.4, coreRadius * 0.36, 311, 11)
  );

  pop();

  for (let orbitIndex = 0; orbitIndex < 9; orbitIndex++) {
    const orbitAngle =
      elapsedTime * (0.22 + orbitIndex * 0.012) + (orbitIndex * TWO_PI) / 9;

    const orbitRadius =
      coreRadius * (1.23 + sin(elapsedTime + orbitIndex) * 0.06);

    const shardX = cos(orbitAngle) * orbitRadius;

    const shardY = sin(orbitAngle) * orbitRadius;

    const shardSize = 5 + (orbitIndex % 3) * 3;

    const shardColors = [PALETTE.orange, PALETTE.white, PALETTE.purple];

    push();

    translate(shardX, shardY);

    rotate(orbitAngle * 1.7);

    fill(...shardColors[orbitIndex % shardColors.length]);

    polygon([
      [0, -shardSize],

      [shardSize * 0.85, 0],

      [0, shardSize],

      [-shardSize * 0.65, 0],
    ]);

    pop();
  }

  stroke(...PALETTE.white, fossilEnergyHover ? 245 : 190);

  strokeWeight(2.2);

  for (let tickIndex = 0; tickIndex < 12; tickIndex++) {
    const tickAngle = (tickIndex * TWO_PI) / 12 - elapsedTime * 0.04;

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

  textFont("Arial");

  textStyle(BOLD);

  textAlign(CENTER, CENTER);

  textSize(18);

  fill(...PALETTE.white);

  text("FOSSIL ENERGY", 0, 0);

  pop();
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

function drawOffsetPolygon(polygonPoints, fillColor, offsetAmount = 5) {
  noStroke();

  fill(...PALETTE.purple, 120);

  polygon(polygonPoints.map(([x, y]) => [x + offsetAmount, y + offsetAmount]));

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
  }

  if (fossilEnergyButton) {
    const buttonDiameter = FOSSIL_CORE_RADIUS * 1.8 * displayScale;

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
    mouseClick: '../designed-sounds/COMM2754-2026-S4010990-A2w09-Heal-MouseClick.wav',
    blowPaper: '../designed-sounds/COMM2754-2026-S4010990-A2w09-Heal-BlowPaper.wav',
    paperCrush: '../designed-sounds/COMM2754-2026-S4010990-A2w09-Heal-PaperCrush.wav',
    buttonPress: '../designed-sounds/COMM2754-2026-S4010990-A2w09-Heal-ButtonPress.wav',
    bagCrush: '../designed-sounds/COMM2754-2026-S4010990-A2w09-Heal-BagCrush.wav',
    suitcaseHit: '../designed-sounds/COMM2754-2026-S4010990-A2w09-Heal-SuitcaseHit.wav'
};

let ambienceButton;

let projectMuted = false;

let projectSoundElements = Object.create(null);

let activeProjectSounds = new Set();

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
  updateAmbienceButton();
}

function initializeProjectAudio() {
  loadProjectSoundEffects();
}

function loadProjectSoundEffects() {
  for (const [soundName, soundPath] of Object.entries(PROJECT_SOUND_PATHS)) {
    if (projectSoundElements[soundName]) continue;

    const soundElement = document.createElement('audio');
    soundElement.src = new URL(soundPath, window.location.href).href;
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

    const sound = soundTemplate.cloneNode(true);
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
    sound.play().catch((soundError) => {
      removeFinishedSound();
      console.warn(`Could not play the ${soundName} recording.`, soundError);
    });
  };

  if (delaySeconds > 0) {
    setTimeout(startLoadedSound, delaySeconds * 1000);
  } else {
    startLoadedSound();
  }
}

function stopActiveProjectSounds() {
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

window.addEventListener("pagehide", stopActiveProjectSounds);

// Recommended levels reproduce the original designed-sound mix.
const RECOMMENDED_SOUND_LEVELS = {
  mouseClick: 34, blowPaper: 28, paperCrush: 34,
  buttonPress: 24, bagCrush: 30, suitcaseHit: 38,
};
const SOUND_MIXER_LABELS = {
  mouseClick: "Mouse Click", blowPaper: "Blow Paper", paperCrush: "Paper Crush",
  buttonPress: "Button Press", bagCrush: "Bag Crush", suitcaseHit: "Suitcase Hit",
};
let soundMixerLevels = { ...RECOMMENDED_SOUND_LEVELS };
let soundMixerDialog = null;

function mixedSoundVolume(soundName, baseVolume) {
  const recommended = RECOMMENDED_SOUND_LEVELS[soundName];
  return Math.max(0, Math.min(1, baseVolume * soundMixerLevels[soundName] / recommended));
}

function setMixerLevel(soundName, value) {
  soundMixerLevels[soundName] = Math.max(0, Math.min(100, Number(value)));
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
      background: #b8fa17;
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
  const progress = figmaUiRoot?.querySelector(".environment-progress");
  if (!progress) return;
  const percentage = Math.min(100, environmentDestructionClicks / 21 * 100);
  const displayedPercentage = Math.round(percentage);
  progress.setAttribute("aria-valuenow", String(displayedPercentage));
  progress.querySelector(".environment-progress-value").textContent = `${displayedPercentage}%`;
  progress.querySelector(".environment-progress-fill").style.width = `${percentage}%`;
}
