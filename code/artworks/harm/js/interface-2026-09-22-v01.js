// HUD
// ------------------------------------------------------------

// UI font stack for information overlay and supporting UI text.
const INFO_UI_FONT = 'Stack Sans Notch';
const INFO_MODAL = Object.freeze({ x: 100, y: 142, w: 1718, h: 700, headerH: 108, pad: 46 });

function infoCloseRect() {
  return {
    x: INFO_MODAL.x + INFO_MODAL.w - 90,
    y: INFO_MODAL.y + 20,
    w: 72,
    h: 68
  };
}

function isInfoCloseHit(px, py) {
  const r = infoCloseRect();
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

function syncSampleUIState() {
  const sampleUI = document.getElementById('sample-ui');
  const infoButton = document.getElementById('info-ui');
  if (sampleUI) sampleUI.classList.toggle('is-info-open', Boolean(infoOpen));
  if (infoButton) infoButton.setAttribute('aria-expanded', String(Boolean(infoOpen)));
}

let hudRootEl = null;
let hudValueEl = null;
let hudFillEl = null;
let lastHudPercent = -1;
let lastHudWarning = false;

function drawHUD() {
  syncSampleUIState();

  // Keep the information HUD in the DOM instead of drawing text into the p5 canvas.
  // The canvas is scaled from a fixed 1920×1080 artboard; DOM text remains noticeably
  // sharper and more stable on Retina screens and on browser windows below 1920 px wide.
  if (!hudRootEl) {
    hudRootEl = document.getElementById('air-load-hud');
    hudValueEl = document.getElementById('air-load-value');
    hudFillEl = document.getElementById('air-load-fill');
  }
  if (!hudRootEl || !hudValueEl || !hudFillEl) return;

  const p = constrain(pollution / 100, 0, 1);
  const pct = round(p * 100);
  const warning = p > .58;

  if (pct !== lastHudPercent) {
    hudValueEl.textContent = `${pct}%`;
    hudValueEl.setAttribute('aria-label', `Air load ${pct} percent`);
    hudFillEl.style.width = `${pct}%`;
    lastHudPercent = pct;
  }

  if (warning !== lastHudWarning) {
    hudRootEl.classList.toggle('is-warning', warning);
    lastHudWarning = warning;
  }
}

function regularHex(cx, cy, r) {
  beginShape();
  for (let i = 0; i < 6; i++) {
    const a = -PI / 6 + i * TWO_PI / 6;
    vertex(cx + cos(a) * r, cy + sin(a) * r);
  }
  endShape(CLOSE);
}

function drawInformationOverlay() {
  push();
  textFont(INFO_UI_FONT);
  rectMode(CORNER);
  noStroke();

  // Dim the artwork while keeping the scene visible, matching the sample modal.
  fill(4, 6, 18, 218);
  rect(0, 0, W, H);

  // Sample-inspired ABOUT modal: blue header, light body, orange top edge,
  // lime bottom edge, two-column editorial layout.
  const { x, y, w, h, headerH, pad } = INFO_MODAL;
  const bodyY = y + headerH;
  const bodyH = h - headerH;

  // Thin orange cap above the blue header.
  fill(255, 112, 24);
  rect(x, y - 7, w, 7);

  // Main body + header.
  fill(226, 231, 234);
  rect(x, bodyY, w, bodyH);
  fill(35, 63, 184);
  rect(x, y, w, headerH);

  // Lime closing edge along the bottom.
  fill(C.lime);
  rect(x, y + h - 10, w, 10);

  // Header title.
  fill(255);
  textAlign(LEFT, CENTER);
  textStyle(BOLD);
  textSize(44);
  text('HARM / RESEARCH', x + 42, y + headerH * 0.54);

  // Close control — same stacked-paper language as the right-side buttons.
  // The face stays blue; hover is communicated by lift, shadow, and a lime X.
  const closeR = infoCloseRect();
  const closeX = closeR.x + 7;
  const closeY = closeR.y + 4;
  const closeHover = isInfoCloseHit(mouseX, mouseY);
  cursor(closeHover ? HAND : ARROW);
  const lift = closeHover ? -4 : 0;
  const twist = closeHover ? -0.035 : 0;
  const scaleT = closeHover ? 1.045 : 1;
  const cx = closeX + 28;
  const cy = closeY + 29;

  push();
  translate(cx, cy + lift);
  rotate(twist);
  scale(scaleT);
  translate(-cx, -cy);

  fill(255);
  polygon([[closeX + 17, closeY + 4], [closeX + 56, closeY], [closeX + 56, closeY + 56], [closeX + 15, closeY + 60]]);

  fill(0);
  polygon([[closeX + 4, closeY + 17], [closeX + 51, closeY + 11], [closeX + 49, closeY + 59], [closeX, closeY + 64]]);

  fill(35, 63, 184);
  polygon([[closeX + 10, closeY + 7], [closeX + 49, closeY + 3], [closeX + 46, closeY + 49], [closeX + 8, closeY + 54]]);

  stroke(closeHover ? color(C.lime) : color(255));
  strokeWeight(closeHover ? 3.6 : 3.0);
  line(closeX + 20, closeY + 17, closeX + 37, closeY + 34);
  line(closeX + 37, closeY + 17, closeX + 20, closeY + 34);
  noStroke();
  pop();

  // Concise research and interaction meaning, within the existing information panel.
  const leftX = x + pad;
  const contentW = w - pad * 2;
  const topY = bodyY + 30;
  fill(12,16,27); textAlign(LEFT,TOP); textStyle(NORMAL);
  textFont('Inter'); textSize(26); textLeading(36);
  text('YOUR ACTION / Click coal to power the machine. Every burn also adds pollution. The growing AIR LOAD makes that environmental cost visible.',
    leftX,topY,contentW,110);
  text('ENERGY + ENVIRONMENT / Burning fossil fuels releases greenhouse gases. HARM lets you explore the tension between powering daily life and protecting the world around us.',
    leftX,topY+126,contentW,120);
  text('SDG 7 / Affordable, reliable and sustainable energy for everyone.',
    leftX,topY+264,contentW,46);
  fill(35,63,184);
  text('Sources: UN DESA — Goal 7; UN — What is renewable energy?',
    leftX,topY+306,contentW,32);
  fill(12,16,27);
  text('Explore the linked sources in ABOUT. The artwork is an interpretation of environmental pressure, not a scientific measurement of emissions.',
    leftX,topY+340,contentW,120);
  fill(160,166,176,120); rect(leftX,y+h-68,contentW,1);
  fill(42,47,64); textSize(16); textStyle(NORMAL);
  text('NGO DAC PHU   ·   SID: S3936790',leftX,y+h-46);

  rectMode(CENTER);
  pop();
}

function drawAboutStep(x, y, number, boldLead, rest, w) {
  textFont(INFO_UI_FONT);
  fill(12, 16, 27);
  textAlign(LEFT, TOP);
  textStyle(NORMAL);
  textSize(18);
  textLeading(29);
  text(number, x, y);

  textStyle(BOLD);
  text(boldLead, x + 30, y);

  // Start the continuation on a clean second line to mirror the reference layout.
  textStyle(NORMAL);
  text(rest, x + 30, y + 29, w - 30, 54);
}


// ------------------------------------------------------------
// INPUT
// ------------------------------------------------------------

function mousePressed() {

  if (infoOpen) {
    if (window.HarmSound) window.HarmSound.cues.uiClick(0.78);
    if (isInfoCloseHit(mouseX, mouseY)) {
      infoOpen = false;
      cursor(ARROW);
    }
    return false;
  }

  const i = findCoalAt(mouseX, mouseY);
  if (i >= 0) {
    // Coal has its own short fracture texture; do not stack the generic Mouseclick.
    fractureCoal(i, consumeDemandTarget() || chooseTarget());
  } else {
    if (window.HarmSound) window.HarmSound.cues.uiClick(0.86);
    if (!beginPressure(mouseX, mouseY)) addArtRipple(mouseX, mouseY);
  }
  return false;
}

function mouseDragged() { return false; }
function mouseReleased() { releasePressure(); return false; }

function keyPressed() {
  if (keyCode === ESCAPE && infoOpen) { infoOpen = false; cursor(ARROW); return false; }
  if (key === 'i' || key === 'I') {
    infoOpen = !infoOpen;
    return false;
  }
  if (key === 'r' || key === 'R') {
    resetScene();
    return false;
  }
  if (key === 's' || key === 'S') {
    saveCanvas(`harm-stage1-${sceneSeed}-${Date.now()}`, 'png');
    return false;
  }
  return true;
}

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

function formatSubtitleText(message) {
  let text = String(message || '').trim().replace(/\s+/g, ' ');
  if (!text) return text;

  // Messages are stored in uppercase so they are easy to scan in code.
  // Convert each middot-separated clause independently so the visible guidance
  // reads naturally without producing random lowercase starts after separators.
  const clauses = text.split('·').map(part => {
    let clause = part.trim();
    if (!clause) return '';
    if (clause === clause.toUpperCase()) clause = clause.toLowerCase();
    return clause.charAt(0).toUpperCase() + clause.slice(1);
  }).filter(Boolean);

  return clauses.join(' · ')
    .replace(/\bharm\b/gi, 'HARM')
    .replace(/\bair load\b/gi, 'AIR LOAD')
    .replace(/\bsdg\b/gi, 'SDG')
    .replace(/\bp5\.js\b/gi, 'p5-2026-09-22-v01.js');
}

function setStatus(message, hold = 1.6, priority = 1) {
  const cleanMessage = String(message || '').trim();
  if (!cleanMessage) return;

  // Higher-priority interaction feedback is allowed to replace passive atmospheric
  // narration, but passive text cannot interrupt an active interaction message.
  if (sceneTime < statusUntil && priority < statusPriority) return;
  if (cleanMessage === lastStatus && sceneTime < statusUntil) return;

  lastStatus = cleanMessage;
  statusPriority = priority;
  statusUntil = sceneTime + Math.max(.9, hold);
  if (statusEl) statusEl.textContent = formatSubtitleText(cleanMessage);
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

// Track completion for the final scene animation and autonomous pressure cycle.
let completionShown = false;
function updateCompletion() {
  if (!completionShown && pollution >= 99.5) {
    infoOpen = false;
    completionShown = true;
    completionAt = sceneTime;
    if (window.HarmSound?.cues?.machineComplete) window.HarmSound.cues.machineComplete();
    dragState = null;
    pressure.nextAt = sceneTime + 1.2;
    setStatus('100% · AIR POLLUTION HAS REACHED A CRITICAL LEVEL', 12, 3);
  }

}
