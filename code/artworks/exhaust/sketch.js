const ARTBOARD_WIDTH = 1920;
const ARTBOARD_HEIGHT = 1080;
const STAGE_LABEL = 'STAGE 2';
const STAGE_NAME = 'EXHAUST';
const NATURAL_OBJECT_COUNT = 22;
const BACKGROUND_OBJECT_COUNT = 10;
const FOSSIL_PARTICLES_PER_CLICK = 3;
const MAX_FOSSIL_PARTICLES = 180;
const INITIAL_BUTTON_CLEARANCE = 360;
const FOSSIL_CORE_RADIUS = 142;
const STACK_SANS_NOTCH_CSS_URL =
  '../../css/fonts.css';
const SUBTITLES = [
  'Click the button to use fossil energy!',
  'You are producing pollutants every time you use fossil fuels.',
  'The more fossil fuel used, the more the environment gets ruined by pollutants',
  'The beautiful landscapes, the wildlife, everything humans may consider "natural beauty", will disappear.',
  'Soon, all of our natural resources will disappear, giving us nothing left to survive on.',
  'Even now, if we stopped using fossil fuels, the damage is done, and the environment will never be the same again',
  'However, we can still save our home planet, and slow down pollution. How can we achieve this?'
];

const PALETTE = {
  charcoal: [20, 20, 20],   // #141414
  grey: [158, 162, 163],    // #9EA2A3
  white: [255, 255, 255],   // #FFFFFF
  blue: [32, 51, 255],      // #2033FF
  purple: [105, 82, 235],   // #6952EB
  orange: [254, 125, 33],   // #FE7D21
  lime: [179, 255, 59]      // #B3FF3B
};

let canvasElement;
let fossilEnergyButton;
let informationButton;
let informationOverlay;
let informationPanelOpen = false;
let fossilEnergyHover = false;
let fossilEnergyPressed = false;
let compositionSeed = 1;
let elapsedTime = 0;
let naturalObjects = [];
let backgroundObjects = [];
let shatteredPieces = [];
let fossilParticles = [];
let subtitleIndex = 0;
let subtitleClicksSinceChange = 0;
let subtitleFont = 'Arial, sans-serif';

function loadStackSansNotch() {
  const stylesheetId = 'stack-sans-notch-font';
  let fontStylesheet = document.getElementById(stylesheetId);

  const activateFont = () => {
    if (!document.fonts?.load) {
      // Older browsers will still pick up the family from the stylesheet.
      subtitleFont = '"Stack Sans Notch", Arial, sans-serif';
      return;
    }

    document.fonts
      .load('400 22px "Stack Sans Notch"')
      .then(loadedFonts => {
        if (loadedFonts.length > 0) {
          subtitleFont = '"Stack Sans Notch", Arial, sans-serif';
        } else {
          console.warn(
            'Stack Sans Notch was not available; using Arial instead.'
          );
        }
      })
      .catch(fontLoadError => {
        console.warn(
          'Stack Sans Notch could not be loaded; using Arial instead.',
          fontLoadError
        );
      });
  };

  if (fontStylesheet) {
    activateFont();
    return;
  }

  fontStylesheet = document.createElement('link');
  fontStylesheet.id = stylesheetId;
  fontStylesheet.rel = 'stylesheet';
  fontStylesheet.href = STACK_SANS_NOTCH_CSS_URL;
  fontStylesheet.addEventListener('load', activateFont, { once: true });
  fontStylesheet.addEventListener('error', () => {
    console.warn(
      'Stack Sans Notch stylesheet could not be loaded; using Arial instead.'
    );
  }, { once: true });
  document.head.appendChild(fontStylesheet);
}

function setup() {
  loadStackSansNotch();

  const createdCanvas = createCanvas(ARTBOARD_WIDTH, ARTBOARD_HEIGHT);
  createdCanvas.attribute(
    'aria-label',
    'Fossil energy launches guided orange particles that damage floating natural objects'
  );
  pixelDensity(1);
  frameRate(60);
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
  createFossilEnergyButton();
  createInformationPanel();
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
  drawStageBanner();
  drawSubtitleBox();
}

function regenerateArtwork() {
  compositionSeed = createSeed();
  randomSeed(compositionSeed);
  noiseSeed(compositionSeed ^ 0x5f3759df);

  elapsedTime = 0;
  naturalObjects = [];
  backgroundObjects = [];
  shatteredPieces = [];
  fossilParticles = [];
  fossilEnergyHover = false;
  fossilEnergyPressed = false;
  subtitleIndex = 0;
  subtitleClicksSinceChange = 0;

  for (let objectIndex = 0; objectIndex < NATURAL_OBJECT_COUNT; objectIndex++) {
    const naturalObject = {};
    resetNaturalObject(naturalObject, true, objectIndex);
    naturalObjects.push(naturalObject);
  }

  for (let objectIndex = 0; objectIndex < BACKGROUND_OBJECT_COUNT; objectIndex++) {
    const backgroundObject = {};
    resetBackgroundObject(backgroundObject, true, objectIndex);
    backgroundObjects.push(backgroundObject);
  }

  if (fossilEnergyButton) restoreButtonStyle();
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
  fill(...PALETTE.blue, 52);
  polygon([
    [-120, height * 0.22],
    [width * 0.42, -90],
    [width * 0.72, -40],
    [width * 0.08, height * 0.42]
  ]);
  fill(...PALETTE.purple, 50);
  polygon([
    [width * 0.3, height + 70],
    [width * 1.03, height * 0.5],
    [width * 1.08, height * 0.68],
    [width * 0.58, height + 90]
  ]);

  noStroke();
}

function createFossilEnergyButton() {
  fossilEnergyButton?.remove?.();
  fossilEnergyButton = createButton('FOSSIL ENERGY');
  fossilEnergyButton.attribute(
    'aria-label',
    'Launch guided fossil-energy particles at one floating natural object'
  );
  fossilEnergyButton.style('position', 'fixed');
  fossilEnergyButton.style('left', '50%');
  fossilEnergyButton.style('top', '50%');
  fossilEnergyButton.style('transform', 'translate(-50%, -50%)');
  fossilEnergyButton.style('width', `${FOSSIL_CORE_RADIUS * 1.8}px`);
  fossilEnergyButton.style('height', `${FOSSIL_CORE_RADIUS * 1.8}px`);
  fossilEnergyButton.style('z-index', '20');
  fossilEnergyButton.style('border', '0');
  fossilEnergyButton.style('border-radius', '50%');
  fossilEnergyButton.style('background', 'transparent');
  fossilEnergyButton.style('color', 'transparent');
  fossilEnergyButton.style('box-shadow', 'none');
  fossilEnergyButton.style('outline', 'none');
  fossilEnergyButton.style('cursor', 'pointer');
  fossilEnergyButton.style('padding', '0');
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

function createInformationPanel() {
  informationButton?.remove?.();
  informationOverlay?.remove?.();
  installInformationPanelStyles();

  informationButton = createButton('!');
  informationButton.addClass('information-trigger');
  informationButton.attribute('aria-label', 'Open project information');
  informationButton.attribute('aria-controls', 'project-information-panel');
  informationButton.attribute('aria-expanded', 'false');
  informationButton.mousePressed(() => {
    setInformationPanelOpen(!informationPanelOpen);
  });

  informationOverlay = document.createElement('div');
  informationOverlay.className = 'project-info-overlay';
  informationOverlay.id = 'project-information-panel';
  informationOverlay.setAttribute('role', 'dialog');
  informationOverlay.setAttribute('aria-modal', 'true');
  informationOverlay.setAttribute('aria-labelledby', 'project-information-title');
  informationOverlay.setAttribute('aria-hidden', 'true');
  informationOverlay.hidden = true;
  informationOverlay.innerHTML = `
    <section class="project-info-window">
      <header class="project-info-header">
        <div>
          <span class="project-info-accent" aria-hidden="true"></span>
          <h2 id="project-information-title">PROJECT INFORMATION</h2>
        </div>
        <button class="information-close" type="button" aria-label="Close project information">
          CLOSE <span aria-hidden="true">×</span>
        </button>
      </header>

      <div class="project-info-grid">
        <div class="project-info-column">
          <article class="information-card information-card--details">
            <h3 class="heading-lime">PROJECT DETAILS</h3>
            <p>
              <strong>Name:</strong> Luong Duc Hung <br>
              <strong>Group:</strong> Ba Mien Bros<br>
              <strong>Group members:</strong> Nguyen Tran Phuc Duong; Ngo Dac Phu;
              Luong Duc Hung; Nguyen Gia Toan Phu Nghia<br>
              <strong>Course:</strong> COMM2754 - Digital Media Specialisation 1<br>
              <strong>Course time:</strong> Thursday 11.30PM<br>
              <strong>Affiliation:</strong> RMIT University Vietnam, Saigon South Campus,
              School of Communication and Design, Digital Media Program
            </p>
          </article>

          <article class="information-card information-card--goal">
            <h3 class="heading-orange">UN SUSTAINABLE DEVELOPMENT GOAL</h3>
            <p>
              Sustainable Development Goal 7: Ensure access to affordable, reliable,
              sustainable and modern energy for all.
            </p>
          </article>

          <article class="information-card information-card--callout">
            <h3>CALL TO ACTION</h3>
            <p>
              Help HEAL the planet by choosing cleaner energy &amp; supporting a
              renewable future
            </p>
          </article>
        </div>

        <div class="project-info-column">
          <article class="information-card information-card--quote">
            <h3 class="heading-pink">QUOTE</h3>
            <blockquote>
              “Clean, renewable energy is the difference between life and death.”
            </blockquote>
            <p class="quote-source">
              António Guterres, opening remarks to the High-level Dialogue on Energy,
              24 September 2021.
            </p>
          </article>

          <article class="information-card information-card--brief">
            <h3 class="heading-orange">PROJECT BRIEF</h3>
            <p>
              Sustainable Development Goal 7 promotes access to affordable, reliable,
              and sustainable energy for all. Through our HEAL concept, we show the
              journey from environmental damage to recovery: traditional energy causes
              harm, pollution weakens nature and human wellbeing, renewable energy
              offers a cleaner alternative, and clean energy helps bring life back to
              the planet. The project highlights how shifting to renewable energy can
              support both healthier communities and a more sustainable future.
            </p>
          </article>

          <article class="information-card information-card--how">
            <h3 class="heading-lime">HOW TO PLAY</h3>
            <div class="how-to-play-step">
              <span aria-hidden="true">1</span>
              <p>Click the button in the middle to launch pollutant particles into the natural objects!</p>
            </div>
          </article>
        </div>
      </div>

      <p class="information-keyboard-hint">PRESS I AGAIN OR ESC TO CLOSE</p>
    </section>
  `;

  document.body.appendChild(informationOverlay);

  informationOverlay
    .querySelector('.information-close')
    .addEventListener('click', () => setInformationPanelOpen(false));

  informationOverlay.addEventListener('mousedown', event => {
    if (event.target === informationOverlay) {
      setInformationPanelOpen(false);
    }
  });

  fitArtboardToWindow();
}

function installInformationPanelStyles() {
  if (document.getElementById('project-information-styles')) return;

  const styleElement = document.createElement('style');
  styleElement.id = 'project-information-styles';
  styleElement.textContent = `
    .information-trigger {
      position: fixed;
      z-index: 30;
      box-sizing: border-box;
      border: 0;
      border-radius: 0;
      background: #2033ff;
      color: #ffffff;
      clip-path: polygon(3% 3%, 100% 0, 91% 90%, 14% 100%);
      filter:
        drop-shadow(7px 7px 0 #141414)
        drop-shadow(7px 7px 0 #ffffff);
      font-family: "Stack Sans Notch", Arial, sans-serif;
      font-weight: 700;
      line-height: 1;
      cursor: pointer;
      padding: 0;
      transition: filter 120ms ease, background 120ms ease;
    }

    .information-trigger:hover,
    .information-trigger:focus-visible {
      background: #6952eb;
      outline: 3px solid #b3ff3b;
      outline-offset: 4px;
      filter:
        drop-shadow(9px 9px 0 #141414)
        drop-shadow(7px 7px 0 #b3ff3b);
    }

    .information-trigger:active {
      filter:
        drop-shadow(3px 3px 0 #141414)
        drop-shadow(4px 4px 0 #ffffff);
    }

    .project-info-overlay[hidden] {
      display: none;
    }

    .project-info-overlay {
      position: fixed;
      inset: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      padding: clamp(14px, 2.2vw, 38px);
      background: rgba(5, 5, 18, 0.82);
      backdrop-filter: blur(5px);
      font-family: "Stack Sans Notch", Arial, sans-serif;
    }

    .project-info-window {
      position: relative;
      width: min(1780px, 95vw);
      max-height: calc(100vh - 52px);
      overflow: auto;
      box-sizing: border-box;
      padding: clamp(28px, 3.1vw, 58px);
      border-top: clamp(9px, 0.8vw, 14px) solid #2033ff;
      border-radius: 9px 9px 22px 22px;
      background: #050518;
      color: #ffffff;
      box-shadow: 12px 14px 0 #fe7d21;
      scrollbar-color: #6952eb #11113f;
    }

    .project-info-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 24px;
      margin-bottom: clamp(30px, 4vw, 64px);
    }

    .project-info-accent {
      display: block;
      width: clamp(84px, 8vw, 130px);
      height: 9px;
      margin-bottom: 14px;
      background: #b3ff3b;
    }

    .project-info-header h2 {
      margin: 0;
      color: #ffffff;
      font-size: clamp(32px, 3.2vw, 58px);
      line-height: 1;
      letter-spacing: 0.01em;
    }

    .information-close {
      flex: 0 0 auto;
      border: 2px solid #ffffff;
      background: transparent;
      color: #ffffff;
      padding: 12px 16px;
      font: 700 15px/1 "Stack Sans Notch", Arial, sans-serif;
      letter-spacing: 0.06em;
      cursor: pointer;
    }

    .information-close span {
      margin-left: 8px;
      color: #fe7d21;
      font-size: 22px;
    }

    .information-close:hover,
    .information-close:focus-visible {
      color: #141414;
      background: #b3ff3b;
      outline: 0;
    }

    .project-info-grid {
      display: grid;
      grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
      gap: clamp(24px, 4.5vw, 84px);
    }

    .project-info-column {
      display: grid;
      align-content: start;
      gap: clamp(20px, 2.2vw, 34px);
    }

    .information-card {
      box-sizing: border-box;
      padding: clamp(23px, 2vw, 34px);
      border-radius: 17px;
      background: #181743;
    }

    .information-card h3 {
      margin: 0 0 20px;
      font-size: clamp(17px, 1.3vw, 22px);
      line-height: 1.2;
    }

    .information-card p,
    .information-card blockquote {
      margin: 0;
      font-size: clamp(16px, 1.35vw, 23px);
      line-height: 1.52;
    }

    .information-card--details p {
      line-height: 1.5;
    }

    .information-card--goal,
    .information-card--brief {
      background: #10105a;
    }

    .information-card--brief {
      min-height: clamp(260px, 31vh, 430px);
    }

    .information-card--quote blockquote {
      font-weight: 700;
    }

    .information-card .quote-source {
      margin-top: clamp(24px, 2.6vw, 42px);
      color: #c0bdd2;
      font-size: clamp(14px, 1.1vw, 19px);
    }

    .information-card--callout {
      background: #b3ff3b;
      color: #141414;
    }

    .information-card--callout p {
      font-size: clamp(21px, 1.7vw, 30px);
      font-weight: 700;
      line-height: 1.35;
    }

    .information-card--how {
      background: #6952eb;
    }

    .how-to-play-step {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .how-to-play-step > span {
      display: grid;
      flex: 0 0 42px;
      width: 42px;
      height: 42px;
      place-items: center;
      border-radius: 50%;
      background: #fe7d21;
      color: #ffffff;
      font-weight: 700;
    }

    .how-to-play-step p {
      font-weight: 700;
    }

    .heading-lime {
      color: #b3ff3b;
    }

    .heading-orange {
      color: #fe7d21;
    }

    .heading-pink {
      color: #ffa9d4;
    }

    .information-keyboard-hint {
      margin: clamp(24px, 3vw, 44px) 0 0;
      color: #b3ff3b;
      text-align: center;
      font-size: clamp(14px, 1.2vw, 20px);
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    @media (max-width: 900px) {
      .project-info-overlay {
        align-items: flex-start;
        padding: 12px;
      }

      .project-info-window {
        width: calc(100vw - 30px);
        max-height: calc(100vh - 30px);
        padding: 24px 20px 30px;
        box-shadow: 7px 8px 0 #fe7d21;
      }

      .project-info-header {
        margin-bottom: 26px;
      }

      .project-info-grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }

      .project-info-column {
        gap: 20px;
      }

      .information-card--brief {
        min-height: 0;
      }
    }
  `;
  document.head.appendChild(styleElement);
}

function setInformationPanelOpen(shouldOpen) {
  if (!informationOverlay || !informationButton) return;

  informationPanelOpen = shouldOpen;
  informationOverlay.hidden = !shouldOpen;
  informationOverlay.setAttribute('aria-hidden', String(!shouldOpen));
  informationButton.attribute('aria-expanded', String(shouldOpen));

  if (fossilEnergyButton?.elt) {
    fossilEnergyButton.elt.disabled = shouldOpen;
    fossilEnergyButton.style('pointer-events', shouldOpen ? 'none' : 'auto');
  }

  if (shouldOpen) {
    informationOverlay.querySelector('.information-close').focus({
      preventScroll: true
    });
  } else {
    informationButton.elt.focus({ preventScroll: true });
  }
}

function restoreButtonStyle() {
  fossilEnergyPressed = false;
}

function launchFossilParticles() {
  playProjectSound('mouseClick', 0.34);
  playProjectSound('blowPaper', 0.28);
  advanceSubtitleAfterClick();

  const targetObject = chooseFossilParticleTarget();
  const targetVersion = targetObject?.spawnVersion;
  const originX = width * 0.5;
  const originY = height * 0.5;
  const targetAngle = targetObject
    ? atan2(targetObject.y - originY, targetObject.x - originX)
    : random(TWO_PI);

  for (let particleIndex = 0; particleIndex < FOSSIL_PARTICLES_PER_CLICK; particleIndex++) {
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
      mode: targetObject ? 'homing' : 'wandering',
      wanderAngle: launchAngle,
      wanderSpeed: random(34, 62),
      wanderSeed: random(1000),
      life: random(18, 25)
    };

    if (!targetObject) beginParticleWander(particle);
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
    return;
  }

  subtitleClicksSinceChange += 1;
  if (
    subtitleClicksSinceChange >= 4 &&
    subtitleIndex < SUBTITLES.length - 1
  ) {
    subtitleIndex += 1;
    subtitleClicksSinceChange = 0;
  }
}

function chooseFossilParticleTarget() {
  const reservedTargets = new Set(
    fossilParticles
      .filter(particle => particle.mode === 'homing' && particle.target)
      .map(particle => particle.target)
  );
  const livingObjects = naturalObjects.filter(naturalObject => (
    naturalObject.state === 'alive' && !reservedTargets.has(naturalObject)
  ));
  const clearlyVisibleObjects = livingObjects.filter(naturalObject => (
    naturalObject.x > naturalObject.size * 0.6 &&
    naturalObject.x < width - naturalObject.size * 0.6 &&
    naturalObject.y > naturalObject.size * 0.6 &&
    naturalObject.y < height - naturalObject.size * 0.6
  ));
  const candidates = clearlyVisibleObjects.length > 0
    ? clearlyVisibleObjects
    : livingObjects;
  return candidates.length > 0 ? random(candidates) : null;
}

function resetNaturalObject(naturalObject, initialPlacement = false, sequenceIndex = 0) {
  naturalObject.spawnVersion = (naturalObject.spawnVersion || 0) + 1;

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

  if (initialPlacement) {
    const buttonCenterX = width * 0.5;
    const buttonCenterY = height * 0.5;
    const offsetX = naturalObject.x - buttonCenterX;
    const offsetY = naturalObject.y - buttonCenterY;
    const currentDistance = sqrt(offsetX * offsetX + offsetY * offsetY);
    const requiredDistance = INITIAL_BUTTON_CLEARANCE + objectSize * 0.42;

    if (currentDistance < requiredDistance) {
      const pushAngle = currentDistance > 0.001
        ? atan2(offsetY, offsetX)
        : atan2(spawnY - buttonCenterY, spawnX - buttonCenterX);
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
  naturalObject.rotationSpeed = random(
    selectedRotationRange[0],
    selectedRotationRange[1]
  ) * rotationDirection;
  naturalObject.phase = random(1000);
  naturalObject.variant = random();
  naturalObject.state = 'alive';
}

function resetBackgroundObject(backgroundObject, initialPlacement = false, sequenceIndex = 0) {
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
  const floatPhase = elapsedTime * naturalObject.floatFrequency + naturalObject.phase;
  naturalObject.x += (
    naturalObject.vx + cos(floatPhase) * naturalObject.floatStrength
  ) * dt;
  naturalObject.y += (
    naturalObject.vy + sin(floatPhase * 1.31 + naturalObject.phase * 0.17) * naturalObject.floatStrength
  ) * dt;
  naturalObject.rotation += naturalObject.rotationSpeed * dt;
}

function updateBackgroundObjects(dt) {
  backgroundObjects.forEach(backgroundObject => {
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
  naturalObjects.forEach(naturalObject => {
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

function updateFossilParticles(dt) {
  fossilParticles.forEach(particle => {
    particle.life -= dt;
    particle.rotation += particle.rotationSpeed * dt;

    if (particle.mode === 'homing') {
      const targetIsValid = (
        particle.target &&
        particle.target.state === 'alive' &&
        particle.target.spawnVersion === particle.targetVersion
      );

      if (!targetIsValid) {
        beginParticleWander(particle);
      } else {
        guideParticleTowardTarget(particle, dt);
      }
    }

    if (particle.mode === 'wandering') {
      updateWanderingParticle(particle, dt);
    }

    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;

    damageObjectHitByParticle(particle);

    if (particle.mode === 'wandering') {
      wrapWanderingParticle(particle);
    }
  });

  fossilParticles = fossilParticles.filter(particle => particle.life > 0);
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
  const nextHeading = currentHeading + constrain(
    headingDifference,
    -particle.turnRate * dt,
    particle.turnRate * dt
  );
  const currentSpeed = sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
  const speedBlend = 1 - Math.exp(-dt * 3.6);
  const nextSpeed = lerp(currentSpeed, particle.cruiseSpeed, speedBlend);

  particle.vx = cos(nextHeading) * nextSpeed;
  particle.vy = sin(nextHeading) * nextSpeed;
}

function beginParticleWander(particle) {
  const currentHeading = atan2(particle.vy, particle.vx);
  particle.mode = 'wandering';
  particle.target = null;
  particle.targetVersion = null;
  particle.wanderAngle = currentHeading + random(-0.55, 0.55);
  particle.wanderSpeed = particle.wanderSpeed || random(34, 62);
  particle.vx = cos(particle.wanderAngle) * particle.wanderSpeed;
  particle.vy = sin(particle.wanderAngle) * particle.wanderSpeed;
  particle.life = max(particle.life, random(14, 21));
}

function updateWanderingParticle(particle, dt) {
  const randomTurn = (
    noise(particle.wanderSeed, elapsedTime * 0.19) - 0.5
  ) * 2.8;
  particle.wanderAngle += (
    randomTurn + sin(elapsedTime * 0.7 + particle.wanderSeed) * 0.22
  ) * dt;

  const desiredVx = cos(particle.wanderAngle) * particle.wanderSpeed;
  const desiredVy = sin(particle.wanderAngle) * particle.wanderSpeed;
  const driftBlend = 1 - Math.exp(-dt * 1.7);
  particle.vx = lerp(particle.vx, desiredVx, driftBlend);
  particle.vy = lerp(particle.vy, desiredVy, driftBlend);
}

function damageObjectHitByParticle(particle) {
  for (const naturalObject of naturalObjects) {
    if (naturalObject.state !== 'alive') continue;

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
  if (particle.x < -wrapMargin) particle.x = width + wrapMargin;
  else if (particle.x > width + wrapMargin) particle.x = -wrapMargin;
  if (particle.y < -wrapMargin) particle.y = height + wrapMargin;
  else if (particle.y > height + wrapMargin) particle.y = -wrapMargin;
}

function transformNaturalObject(naturalObject) {
  if (
    (naturalObject.type === 'mountain' && naturalObject.variant < 0.48) ||
    (naturalObject.type === 'leaf' && naturalObject.variant < 0.32) ||
    (naturalObject.type === 'cloud' && naturalObject.variant < 0.2)
  ) {
    naturalObject.state = 'shattered';
    createShatteredPieces(naturalObject);
    return 'exploded';
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
  return 'died';
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

function drawBackgroundObjects() {
  backgroundObjects.forEach(backgroundObject => {
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

  if (backgroundObject.type === 'tree') {
    polygon([
      [-objectSize * 0.065, objectSize * 0.5],
      [objectSize * 0.07, objectSize * 0.5],
      [objectSize * 0.045, -objectSize * 0.12],
      [-objectSize * 0.04, -objectSize * 0.12]
    ]);
    polygon(makeAngularBlobPoints(
      0,
      -objectSize * 0.22,
      objectSize * 0.48,
      objectSize * 0.38,
      backgroundObject.phase,
      9
    ));
  } else if (backgroundObject.type === 'mountain') {
    polygon([
      [-objectSize * 0.58, objectSize * 0.38],
      [-objectSize * 0.26, objectSize * 0.02],
      [0, -objectSize * 0.52],
      [objectSize * 0.22, -objectSize * 0.06],
      [objectSize * 0.58, objectSize * 0.38]
    ]);
  } else if (backgroundObject.type === 'pond') {
    polygon(makeAngularBlobPoints(
      0,
      0,
      objectSize * 0.58,
      objectSize * 0.22,
      backgroundObject.phase,
      14
    ));
  } else if (backgroundObject.type === 'cloud') {
    polygon([
      [-objectSize * 0.58, objectSize * 0.18],
      [-objectSize * 0.48, -objectSize * 0.05],
      [-objectSize * 0.28, -objectSize * 0.14],
      [-objectSize * 0.12, -objectSize * 0.42],
      [objectSize * 0.12, -objectSize * 0.3],
      [objectSize * 0.28, -objectSize * 0.18],
      [objectSize * 0.5, -objectSize * 0.06],
      [objectSize * 0.58, objectSize * 0.18]
    ]);
  } else if (backgroundObject.type === 'flower') {
    stroke(...backgroundColor);
    strokeWeight(max(2, objectSize * 0.045));
    line(0, objectSize * 0.48, 0, -objectSize * 0.15);
    noStroke();
    push();
    translate(0, -objectSize * 0.22);
    for (let petalIndex = 0; petalIndex < 5; petalIndex++) {
      push();
      rotate(petalIndex * TWO_PI / 5);
      polygon([
        [0, 0],
        [-objectSize * 0.12, -objectSize * 0.22],
        [0, -objectSize * 0.4],
        [objectSize * 0.12, -objectSize * 0.22]
      ]);
      pop();
    }
    pop();
  } else if (backgroundObject.type === 'leaf') {
    polygon([
      [-objectSize * 0.52, 0],
      [-objectSize * 0.2, -objectSize * 0.35],
      [objectSize * 0.45, -objectSize * 0.18],
      [objectSize * 0.58, 0],
      [objectSize * 0.12, objectSize * 0.34],
      [-objectSize * 0.28, objectSize * 0.25]
    ]);
  } else if (backgroundObject.type === 'fish') {
    polygon([
      [-objectSize * 0.48, 0],
      [-objectSize * 0.22, -objectSize * 0.28],
      [objectSize * 0.28, -objectSize * 0.2],
      [objectSize * 0.5, 0],
      [objectSize * 0.25, objectSize * 0.22],
      [-objectSize * 0.22, objectSize * 0.28]
    ]);
    polygon([
      [-objectSize * 0.44, 0],
      [-objectSize * 0.7, -objectSize * 0.25],
      [-objectSize * 0.65, objectSize * 0.26]
    ]);
  }
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
  stroke(...PALETTE.grey);
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
    fill(...(leafIndex % 2 === 0 ? PALETTE.orange : PALETTE.purple));
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
  const cloudColor = smog ? PALETTE.grey : PALETTE.white;
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
  stroke(...(wilted ? PALETTE.grey : PALETTE.lime));
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
  fill(...PALETTE.grey);
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
    fill(...PALETTE.purple, 105);
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

function drawFossilParticles() {
  fossilParticles.forEach(particle => {
    const heading = atan2(particle.vy, particle.vx);
    const particleAlpha = constrain(particle.life * 115, 0, 230);
    const trailLength = particle.mode === 'homing'
      ? particle.size * 2.5
      : particle.size * 1.15;

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
      [-particle.size * 0.42 + 1.5, particle.size * 0.62 + 1.5]
    ]);
    fill(...PALETTE.orange, particleAlpha);
    polygon([
      [particle.size * 1.15, 0],
      [-particle.size * 0.7, -particle.size * 0.62],
      [-particle.size * 0.42, particle.size * 0.62]
    ]);
    pop();
  });
}

function drawFossilEnergyCore() {
  const hoverScale = fossilEnergyHover ? 1.07 : 1;
  const pressScale = fossilEnergyPressed ? 0.94 : 1;
  const pulse = 1 + sin(elapsedTime * 1.3) * 0.018;
  const coreRadius = FOSSIL_CORE_RADIUS * hoverScale * pressScale * pulse;

  push();
  translate(width * 0.5, height * 0.5 + (fossilEnergyPressed ? 7 : 0));

  // Hard offset shadow anchors the object in the same cut-paper language as
  // the floating natural forms.
  fill(...PALETTE.purple, 190);
  polygon(makeAngularBlobPoints(11, 11, coreRadius * 1.16, coreRadius * 1.16, 91, 18));

  // Irregular nested matter replaces the previous flat black disc.
  push();
  rotate(-elapsedTime * 0.08);
  fill(...PALETTE.charcoal);
  polygon(makeAngularBlobPoints(0, 0, coreRadius * 0.8, coreRadius * 0.79, 171, 15));
  fill(...PALETTE.orange, 205);
  polygon(makeAngularBlobPoints(0, 2, coreRadius * 0.57, coreRadius * 0.5, 241, 12));
  fill(...PALETTE.charcoal);
  polygon(makeAngularBlobPoints(0, 0, coreRadius * 0.4, coreRadius * 0.36, 311, 11));
  pop();

  // Orbiting angular particles make the energy source feel active without adding
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
  stroke(...PALETTE.white, fossilEnergyHover ? 245 : 190);
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

  textFont('Arial');
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  textSize(18);
  fill(...PALETTE.white);
  text('FOSSIL ENERGY', 0, 0);

  pop();
}

function drawStageBanner() {
  push();
  noStroke();

  // Offset paper and shadow plates create the stacked poster look in the reference.
  fill(...PALETTE.white);
  polygon([
    [98, 66],
    [544, 42],
    [578, 246],
    [116, 270]
  ]);
  fill(0);
  polygon([
    [84, 102],
    [590, 78],
    [622, 224],
    [96, 304]
  ]);
  fill(...PALETTE.blue);
  polygon([
    [58, 90],
    [576, 72],
    [558, 218],
    [76, 288]
  ]);

  fill(...PALETTE.white);
  textFont(subtitleFont);
  textStyle(BOLD);
  textAlign(LEFT, TOP);
  textSize(35);
  text(STAGE_LABEL, 160, 112);
  textSize(72);
  text(STAGE_NAME, 116, 154);
  pop();
}

function drawSubtitleBox() {
  const boxWidth = width * 0.64;
  const boxHeight = 82;
  const boxX = (width - boxWidth) * 0.5;
  const boxY = height - boxHeight - 38;

  push();
  noStroke();

  fill(...PALETTE.orange);
  polygon([
    [boxX - 32, boxY - 20],
    [boxX + boxWidth + 30, boxY - 20],
    [boxX + boxWidth + 8, boxY + boxHeight + 10],
    [boxX - 10, boxY + boxHeight + 10]
  ]);
  fill(...PALETTE.lime);
  polygon([
    [boxX - 24, boxY + 12],
    [boxX + boxWidth + 12, boxY + 8],
    [boxX + boxWidth + 24, boxY + boxHeight + 22],
    [boxX - 18, boxY + boxHeight + 22]
  ]);
  fill(...PALETTE.white);
  rect(boxX, boxY, boxWidth, boxHeight);

  textFont(subtitleFont);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  textSize(21);
  textLeading(25);
  fill(...PALETTE.charcoal);
  text(
    SUBTITLES[subtitleIndex],
    boxX + 42,
    boxY,
    boxWidth - 84,
    boxHeight
  );
  pop();
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

function fitArtboardToWindow() {
  if (!canvasElement) return;
  const displayScale = min(
    window.innerWidth / ARTBOARD_WIDTH,
    window.innerHeight / ARTBOARD_HEIGHT
  );
  canvasElement.style.width = `${ARTBOARD_WIDTH * displayScale}px`;
  canvasElement.style.height = `${ARTBOARD_HEIGHT * displayScale}px`;

  if (fossilEnergyButton) {
    const buttonDiameter = FOSSIL_CORE_RADIUS * 1.8 * displayScale;
    fossilEnergyButton.style('width', `${buttonDiameter}px`);
    fossilEnergyButton.style('height', `${buttonDiameter}px`);
  }

  if (informationButton) {
    const canvasBounds = canvasElement.getBoundingClientRect();
    const informationButtonWidth = 118 * displayScale;
    const informationButtonHeight = 118 * displayScale;
    informationButton.style(
      'left',
      `${canvasBounds.right - 54 * displayScale}px`
    );
    informationButton.style(
      'top',
      `${canvasBounds.bottom - 44 * displayScale}px`
    );
    informationButton.style('transform', 'translate(-100%, -100%)');
    informationButton.style('width', `${informationButtonWidth}px`);
    informationButton.style('height', `${informationButtonHeight}px`);
    informationButton.style(
      'font-size',
      `${Math.max(24, 64 * displayScale)}px`
    );
  }

  if (typeof positionAmbienceButton === 'function') {
    positionAmbienceButton(canvasElement, displayScale);
  }
}

function windowResized() {
  fitArtboardToWindow();
}

function keyPressed() {
  if (key === 'i' || key === 'I') {
    setInformationPanelOpen(!informationPanelOpen);
    return false;
  }

  if (informationPanelOpen && (key === 'Escape' || keyCode === 27)) {
    setInformationPanelOpen(false);
    return false;
  }

  if (informationPanelOpen) return false;

  if (key === 'r' || key === 'R') {
    regenerateArtwork();
    return false;
  }
  return true;
}

// Shared audio system for recorded effects and generative ambience.

const AMBIENT_CHORDS = [
  [48, 55, 59, 64],
  [45, 52, 57, 60, 64],
  [41, 48, 53, 57, 60],
  [43, 50, 55, 57, 62]
];

// The supplied Stage 2 package did not include its referenced recorded WAV files.
// Keep the generative ambience active and skip unavailable recordings cleanly.
const PROJECT_SOUND_PATHS = {};

let ambienceButton;
let ambienceAudioContext = null;
let ambienceMaster = null;
let ambienceReverbInput = null;
let ambienceDelayInput = null;
let ambiencePadTimer = null;
let ambienceBellTimer = null;
let ambienceRunning = false;
let ambienceStarting = false;
let ambienceChordIndex = 0;
let ambienceResumePromise = null;
let projectMuted = false;
let projectSoundElements = Object.create(null);
let activeProjectSounds = new Set();
let audioUnlockListenersInstalled = false;

function createAmbienceButton() {
  ambienceButton?.remove?.();
  installAmbienceStyles();

  ambienceButton = createButton('MUTE');
  ambienceButton.addClass('ambience-trigger');
  ambienceButton.attribute(
    'aria-label',
    'Mute all sound'
  );
  ambienceButton.attribute('aria-pressed', 'false');
  ambienceButton.mousePressed(toggleProjectMute);
  updateAmbienceButton();

  if (typeof fitArtboardToWindow === 'function') {
    fitArtboardToWindow();
  }
}

function installAmbienceStyles() {
  if (document.getElementById('generative-ambience-styles')) return;

  const styleElement = document.createElement('style');
  styleElement.id = 'generative-ambience-styles';
  styleElement.textContent = `
    .ambience-trigger {
      position: fixed;
      z-index: 30;
      box-sizing: border-box;
      border: 2px solid #ffffff;
      border-radius: 0;
      background: #141414;
      color: #ffffff;
      box-shadow: 7px 7px 0 #6952eb;
      font-family: "Stack Sans Notch", Arial, sans-serif;
      font-weight: 700;
      letter-spacing: 0.06em;
      cursor: pointer;
      padding: 0;
      transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
    }

    .ambience-trigger:hover,
    .ambience-trigger:focus-visible {
      background: #2033ff;
      outline: 3px solid #b3ff3b;
      outline-offset: 4px;
      box-shadow: 10px 10px 0 #fe7d21;
    }

    .ambience-trigger[data-muted="false"] {
      border-color: #141414;
      background: #b3ff3b;
      color: #141414;
      box-shadow: 7px 7px 0 #fe7d21;
    }

    .ambience-trigger:disabled {
      cursor: wait;
      opacity: 0.65;
    }
  `;
  document.head.appendChild(styleElement);
}

function positionAmbienceButton(targetCanvas, displayScale) {
  if (!ambienceButton || !targetCanvas) return;

  const canvasBounds = targetCanvas.getBoundingClientRect();
  const buttonWidth = 210 * displayScale;
  const buttonHeight = 58 * displayScale;
  ambienceButton.style(
    'left',
    `${canvasBounds.right - 40 * displayScale}px`
  );
  ambienceButton.style(
    'top',
    `${canvasBounds.top + 36 * displayScale}px`
  );
  ambienceButton.style('width', `${buttonWidth}px`);
  ambienceButton.style('height', `${buttonHeight}px`);
  ambienceButton.style('transform', 'translateX(-100%)');
  ambienceButton.style(
    'font-size',
    `${Math.max(10, 18 * displayScale)}px`
  );
}

function updateAmbienceButton() {
  if (!ambienceButton) return;

  ambienceButton.html(projectMuted ? 'UNMUTE' : 'MUTE');
  ambienceButton.attribute(
    'aria-label',
    projectMuted ? 'Unmute all sound' : 'Mute all sound'
  );
  ambienceButton.attribute('aria-pressed', String(projectMuted));
  ambienceButton.elt.dataset.muted = String(projectMuted);
  ambienceButton.elt.disabled = false;
}

function toggleProjectMute() {
  projectMuted = !projectMuted;
  applyProjectMuteState(0.16);
  if (projectMuted) stopActiveProjectSounds();
  updateAmbienceButton();

  if (!projectMuted) {
    ensureProjectAudioRunning();
  }
}

function initializeProjectAudio() {
  loadProjectSoundEffects();
  if (ambienceAudioContext) return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    console.warn('This browser does not support the Web Audio API.');
    if (ambienceButton?.elt) ambienceButton.elt.disabled = true;
    return;
  }

  createAmbienceAudioSystem(AudioContextClass);
  installProjectAudioUnlockListeners();
  ensureProjectAudioRunning();
}

function installProjectAudioUnlockListeners() {
  if (audioUnlockListenersInstalled) return;
  audioUnlockListenersInstalled = true;

  document.addEventListener('pointerdown', unlockProjectAudio, {
    capture: true
  });
  document.addEventListener('keydown', unlockProjectAudio, {
    capture: true
  });
}

function removeProjectAudioUnlockListeners() {
  if (!audioUnlockListenersInstalled) return;
  audioUnlockListenersInstalled = false;

  document.removeEventListener('pointerdown', unlockProjectAudio, {
    capture: true
  });
  document.removeEventListener('keydown', unlockProjectAudio, {
    capture: true
  });
}

function unlockProjectAudio() {
  const ctx = ambienceAudioContext;
  if (!ctx || ctx.state === 'closed') return;

  ctx.resume()
    .then(() => {
      if (ctx.state !== 'running') return;
      beginAmbienceGenerators();
      removeProjectAudioUnlockListeners();
      ambienceStarting = false;
      updateAmbienceButton();
    })
    .catch(() => {});
}

function ensureProjectAudioRunning() {
  const ctx = ambienceAudioContext;
  if (!ctx || ctx.state === 'closed') return Promise.resolve(false);

  if (ctx.state === 'running') {
    beginAmbienceGenerators();
    removeProjectAudioUnlockListeners();
    return Promise.resolve(true);
  }

  if (ambienceResumePromise) return ambienceResumePromise;

  ambienceStarting = true;
  updateAmbienceButton();
  ambienceResumePromise = ctx.resume()
    .then(() => {
      const didStart = ctx.state === 'running';
      if (didStart) {
        beginAmbienceGenerators();
        removeProjectAudioUnlockListeners();
      }
      return didStart;
    })
    .catch(() => false)
    .finally(() => {
      ambienceResumePromise = null;
      ambienceStarting = false;
      updateAmbienceButton();
    });

  return ambienceResumePromise;
}

function beginAmbienceGenerators() {
  if (ambienceRunning || !ambienceAudioContext) return;

  ambienceRunning = true;
  ambienceChordIndex = 0;
  applyProjectMuteState(0.35);

  startAmbientDrone();
  startAmbientAirTexture();
  scheduleAmbientPad();
  scheduleAmbientBell();
}

function applyProjectMuteState(fadeSeconds = 0.12) {
  if (!ambienceAudioContext || !ambienceMaster) return;

  const now = ambienceAudioContext.currentTime;
  const targetVolume = projectMuted ? 0 : 0.72;
  ambienceMaster.gain.cancelScheduledValues(now);
  ambienceMaster.gain.setValueAtTime(ambienceMaster.gain.value, now);
  ambienceMaster.gain.linearRampToValueAtTime(
    targetVolume,
    now + fadeSeconds
  );
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

  if (!ambienceAudioContext) initializeProjectAudio();
  else ensureProjectAudioRunning();

  const startLoadedSound = () => {
    if (projectMuted) return;

    const sound = soundTemplate.cloneNode(true);
    sound.volume = Math.max(0, Math.min(1, volume));
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

function stopAmbienceMusic(closeImmediately = false) {
  ambienceRunning = false;
  clearTimeout(ambiencePadTimer);
  clearTimeout(ambienceBellTimer);
  ambiencePadTimer = null;
  ambienceBellTimer = null;

  const contextToClose = ambienceAudioContext;
  const masterToFade = ambienceMaster;

  ambienceAudioContext = null;
  ambienceMaster = null;
  ambienceReverbInput = null;
  ambienceDelayInput = null;
  ambienceResumePromise = null;
  stopActiveProjectSounds();

  if (contextToClose && contextToClose.state !== 'closed') {
    if (closeImmediately || !masterToFade) {
      contextToClose.close();
    } else {
      const now = contextToClose.currentTime;
      masterToFade.gain.cancelScheduledValues(now);
      masterToFade.gain.setValueAtTime(
        Math.max(masterToFade.gain.value, 0.0001),
        now
      );
      masterToFade.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

      setTimeout(() => {
        if (contextToClose.state !== 'closed') contextToClose.close();
      }, 1600);
    }
  }

  updateAmbienceButton();
}

function createAmbienceAudioSystem(AudioContextClass) {
  ambienceAudioContext = new AudioContextClass();
  const ctx = ambienceAudioContext;

  ambienceMaster = ctx.createGain();
  ambienceMaster.gain.value = 0.0001;

  const warmFilter = ctx.createBiquadFilter();
  warmFilter.type = 'lowpass';
  warmFilter.frequency.value = 6500;
  warmFilter.Q.value = 0.4;

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -20;
  compressor.knee.value = 18;
  compressor.ratio.value = 3;
  compressor.attack.value = 0.1;
  compressor.release.value = 0.8;

  ambienceReverbInput = ctx.createGain();
  const convolver = ctx.createConvolver();
  convolver.buffer = createAmbientImpulseResponse(5, 3.5);
  const reverbVolume = ctx.createGain();
  reverbVolume.gain.value = 0.42;
  ambienceReverbInput.connect(convolver);
  convolver.connect(reverbVolume);
  reverbVolume.connect(ambienceMaster);

  ambienceDelayInput = ctx.createGain();
  const delay = ctx.createDelay(3);
  delay.delayTime.value = 0.72;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.32;
  const delayVolume = ctx.createGain();
  delayVolume.gain.value = 0.25;
  ambienceDelayInput.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(delayVolume);
  delayVolume.connect(ambienceMaster);

  ambienceMaster.connect(warmFilter);
  warmFilter.connect(compressor);
  compressor.connect(ctx.destination);
}

function scheduleAmbientPad() {
  if (!ambienceRunning || !ambienceAudioContext) return;

  playAmbientPad(AMBIENT_CHORDS[ambienceChordIndex]);
  ambienceChordIndex = (ambienceChordIndex + 1) % AMBIENT_CHORDS.length;
  ambiencePadTimer = setTimeout(scheduleAmbientPad, 10500);
}

function playAmbientPad(notes) {
  const start = ambienceAudioContext.currentTime + 0.05;
  for (const midi of notes) {
    playAmbientPadNote(
      midi,
      start + ambientRandom(0, 0.35),
      14,
      0.022
    );
  }
}

function playAmbientPadNote(midi, start, duration, volume) {
  const ctx = ambienceAudioContext;
  if (!ctx) return;

  const frequency = ambientMidiToFrequency(midi);
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const envelope = ctx.createGain();

  osc1.type = 'sine';
  osc2.type = 'triangle';
  osc1.frequency.value = frequency;
  osc2.frequency.value = frequency;
  osc1.detune.value = -6;
  osc2.detune.value = 7;

  filter.type = 'lowpass';
  filter.frequency.value = ambientRandom(800, 1500);
  filter.Q.value = 0.5;

  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(volume, start + 3.5);
  envelope.gain.exponentialRampToValueAtTime(
    volume * 0.55,
    start + duration - 3
  );
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(envelope);
  routeAmbientSound(envelope, 0.8, 0.7, 0.12);

  osc1.start(start);
  osc2.start(start);
  osc1.stop(start + duration + 0.2);
  osc2.stop(start + duration + 0.2);
}

function scheduleAmbientBell() {
  if (!ambienceRunning || !ambienceAudioContext) return;

  const bellNotes = [72, 74, 76, 79, 81, 84];
  const noteIndex = Math.floor(Math.random() * bellNotes.length);
  playAmbientBell(bellNotes[noteIndex]);
  ambienceBellTimer = setTimeout(
    scheduleAmbientBell,
    ambientRandom(2200, 5200)
  );
}

function playAmbientBell(midi) {
  const ctx = ambienceAudioContext;
  if (!ctx) return;

  const start = ctx.currentTime + 0.05;
  const frequency = ambientMidiToFrequency(midi);
  const fundamental = ctx.createOscillator();
  const overtone = ctx.createOscillator();
  const overtoneVolume = ctx.createGain();
  const envelope = ctx.createGain();
  const pan = ctx.createStereoPanner
    ? ctx.createStereoPanner()
    : ctx.createGain();

  fundamental.type = 'sine';
  overtone.type = 'sine';
  fundamental.frequency.value = frequency;
  overtone.frequency.value = frequency * 2.01;
  overtoneVolume.gain.value = 0.16;
  if (pan.pan) pan.pan.value = ambientRandom(-0.8, 0.8);

  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(0.06, start + 0.03);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + 5);

  fundamental.connect(envelope);
  overtone.connect(overtoneVolume);
  overtoneVolume.connect(envelope);
  envelope.connect(pan);
  routeAmbientSound(pan, 0.45, 0.9, 0.55);

  fundamental.start(start);
  overtone.start(start);
  fundamental.stop(start + 5.2);
  overtone.stop(start + 5.2);
}

function startAmbientDrone() {
  const ctx = ambienceAudioContext;
  if (!ctx) return;

  const now = ctx.currentTime;
  const droneGain = ctx.createGain();
  const droneFilter = ctx.createBiquadFilter();
  droneFilter.type = 'lowpass';
  droneFilter.frequency.value = 300;
  droneFilter.Q.value = 1;
  droneGain.gain.setValueAtTime(0.0001, now);
  droneGain.gain.exponentialRampToValueAtTime(0.025, now + 7);

  const notes = [36, 43];
  for (let noteIndex = 0; noteIndex < notes.length; noteIndex++) {
    const oscillator = ctx.createOscillator();
    oscillator.type = noteIndex === 0 ? 'sine' : 'triangle';
    oscillator.frequency.value = ambientMidiToFrequency(notes[noteIndex]);
    oscillator.detune.value = noteIndex === 0 ? -4 : 4;
    oscillator.connect(droneFilter);
    oscillator.start(now);
  }

  droneFilter.connect(droneGain);
  routeAmbientSound(droneGain, 0.7, 0.75, 0.05);
}

function startAmbientAirTexture() {
  const ctx = ambienceAudioContext;
  if (!ctx) return;

  const length = ctx.sampleRate * 3;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastValue = 0;

  for (let sampleIndex = 0; sampleIndex < length; sampleIndex++) {
    const whiteNoise = Math.random() * 2 - 1;
    lastValue = lastValue * 0.98 + whiteNoise * 0.02;
    data[sampleIndex] = lastValue;
  }

  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const volume = ctx.createGain();
  source.buffer = buffer;
  source.loop = true;
  filter.type = 'bandpass';
  filter.frequency.value = 850;
  filter.Q.value = 0.35;
  volume.gain.value = 0.018;
  source.connect(filter);
  filter.connect(volume);
  routeAmbientSound(volume, 0.35, 0.8, 0.1);
  source.start();
}

function routeAmbientSound(source, dryAmount, reverbAmount, delayAmount) {
  if (!ambienceAudioContext || !ambienceMaster) return;

  const dry = ambienceAudioContext.createGain();
  const reverb = ambienceAudioContext.createGain();
  const echo = ambienceAudioContext.createGain();
  dry.gain.value = dryAmount;
  reverb.gain.value = reverbAmount;
  echo.gain.value = delayAmount;
  source.connect(dry);
  source.connect(reverb);
  source.connect(echo);
  dry.connect(ambienceMaster);
  reverb.connect(ambienceReverbInput);
  echo.connect(ambienceDelayInput);
}

function createAmbientImpulseResponse(seconds, decay) {
  const ctx = ambienceAudioContext;
  const length = ctx.sampleRate * seconds;
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let sampleIndex = 0; sampleIndex < length; sampleIndex++) {
      const fade = Math.pow(1 - sampleIndex / length, decay);
      data[sampleIndex] = (Math.random() * 2 - 1) * fade;
    }
  }

  return impulse;
}

function ambientMidiToFrequency(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function ambientRandom(minimum, maximum) {
  return minimum + Math.random() * (maximum - minimum);
}

window.addEventListener('pagehide', () => {
  if (ambienceRunning || ambienceAudioContext) {
    stopAmbienceMusic(true);
  }
});
