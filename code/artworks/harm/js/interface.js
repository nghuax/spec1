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

function drawStageTitleCard() {
  push();
  translate(30, 32);
  noStroke();

  // Offset paper plate behind the main card.
  fill(248, 248, 246);
  polygon([[42,-14],[452,-27],[476,120],[58,138]]);

  // Deep shadow layer gives the stacked-paper depth seen in the group reference.
  fill(0, 0, 0, 225);
  polygon([[14,22],[486,8],[508,154],[38,178]]);

  // Small violet folded accent.
  fill(C.violet);
  polygon([[88,130],[158,122],[108,176]]);

  // Main electric-blue stage plate.
  fill(C.blue);
  polygon([[0,0],[464,-12],[444,142],[16,164]]);

  fill(C.paper);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(25);
  text('STAGE 1', 78, 25);
  textAlign(CENTER, TOP);
  textSize(58);
  // Center the project name optically inside the electric-blue plate.
  text('HARM', 232, 60);

  pop();
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
  text('ABOUT HARM', x + 42, y + headerH * 0.54);

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

  // Body columns.
  const leftX = x + pad;
  const leftW = 720;
  const gap = 50;
  const rightX = leftX + leftW + gap;
  const rightW = w - pad * 2 - leftW - gap;
  const topY = bodyY + 34;

  // LEFT — project statement.
  fill(6, 10, 18);
  textAlign(LEFT, TOP);
  textStyle(NORMAL);
  textSize(24);
  textLeading(35);
  text(
    'From fast coal-powered electricity to an atmosphere under pressure.\n' +
    'HARM visualises how energy demand can be met immediately while pollution quietly accumulates across the same environment.',
    leftX, topY, leftW - 20, 150
  );

  // SDG 7 inset card exactly follows the sample structure.
  const sdgX = leftX;
  const sdgY = topY + 158;
  const sdgW = leftW - 14;
  const sdgH = 232;
  fill(207, 216, 230);
  rect(sdgX, sdgY, sdgW, sdgH);
  fill(C.orange);
  rect(sdgX, sdgY, 5, sdgH);

  fill(35, 63, 184);
  textStyle(BOLD);
  textSize(18);
  text('SDG 7 · AFFORDABLE & CLEAN ENERGY', sdgX + 30, sdgY + 28);

  fill(10, 14, 22);
  textStyle(NORMAL);
  textSize(18);
  textLeading(29);
  text(
    'Reliable, affordable and sustainable energy supports everyday life. HARM contrasts the speed and convenience of fossil-fuel power with the environmental cost that builds through smoke, carbon and atmospheric pressure.',
    sdgX + 30, sdgY + 78, sdgW - 60, 138
  );

  // RIGHT — interaction guide.
  fill(35, 63, 184);
  textStyle(BOLD);
  textSize(18);
  text('POWER THE FIELD', rightX, topY + 2);

  fill(8, 12, 20);
  textStyle(NORMAL);
  textSize(18);
  textLeading(29);

  drawAboutStep(rightX + 10, topY + 50, '1.', 'Click or drag coal', 'into the machine. Power arrives quickly and the grid begins to activate.', rightW - 20);
  drawAboutStep(rightX + 10, topY + 139, '2.', 'Hover houses or factories', 'to create electricity demand and watch energy move across the island system.', rightW - 20);
  drawAboutStep(rightX + 10, topY + 228, '3.', 'Watch AIR LOAD rise', 'as smoke and atmospheric pressure accumulate overhead and HARM spreads.', rightW - 20);

  fill(8, 12, 20);
  textStyle(NORMAL);
  textSize(18);
  textLeading(29);
  text(
    'The circular arrow resets and replays the system. The speaker opens the six-track sound mix. The ! button opens this project guide again.',
    rightX, topY + 326, rightW - 12, 88
  );

  // Footer divider and compact project metadata.
  const dividerY = y + h - 142;
  fill(160, 166, 176, 120);
  rect(x + pad, dividerY, w - pad * 2, 2);

  fill(42, 47, 64);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(16);
  text('HARM — STAGE 1    ·    COMM2754    ·    SDG 7    ·    R reset & replay    ·    speaker sound mix    ·    ! guide', x + pad, dividerY + 26);

  textStyle(BOLD);
  textSize(20);
  fill(236, 82, 8);
  text('NGO DAC PHU', x + pad, dividerY + 66);
  text('SID: S3936790', x + pad + 330, dividerY + 66);

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
  // One consistent click language for every intentional canvas press: coal,
  // information control, empty field, etc. DOM sound controls sit above the canvas
  // and stop propagation, so adjusting the mixer does not trigger this cue.
  if (window.HarmSound) window.HarmSound.cues.uiClick(0.92);

  if (infoOpen) {
    if (isInfoCloseHit(mouseX, mouseY)) {
      infoOpen = false;
      cursor(ARROW);
    }
    return false;
  }

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
    .replace(/\bp5\.js\b/gi, 'p5.js');
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

function groundPatch(x, y, w, r, p, reveal = 1) {
  push();
  drawingContext.globalAlpha = constrain(reveal * 1.08, 0, 1);
  translate(x, y);
  rotate(r);
  noStroke();
  fill(20, 20, 20, 12 + p * 20);
  ellipse(5, 13, w * .82, 16);
  const ground = lerpColor(color(234, 234, 230), color(124, 116, 94), constrain(p * .55, 0, 1));
  const dirty = lerpColor(ground, color(96, 84, 66), constrain(max(0, p - .55) * 1.2, 0, 1));
  fill(dirty);
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
