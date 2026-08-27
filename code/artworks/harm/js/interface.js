// HUD
// ------------------------------------------------------------

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

function drawHUD() {
  const p = pollution / 100;
  const hoverInfo = dist(mouseX, mouseY, INFO_UI.x, INFO_UI.y) < INFO_UI.r * 1.25;

  push();
  noStroke();

  // Stage title card: aligned with the group reference system.
  drawStageTitleCard();

  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(10);
  fill(240, 238, 232, 220);
  text('P5.JS INTERACTIVE ARTWORK / SDG 07', 52, 214);

  textStyle(NORMAL);
  textSize(9);
  fill(194, 196, 204, 220);
  text('COAL → POWER → HARM', 52, 232);

  const lockedArchitecture = houses.filter(h => h.locked).length + factories.filter(f => f.locked).length;
  if (lockedArchitecture > 0 && burnCount < ARCHITECTURE_WAVES.length) {
    text('CLICK COAL · POWER ARRIVES FIRST, HARM ARRIVES AFTER', 52, 248);
  } else if (demandQueue.length > 0) text(`DEMAND WAITING ${demandQueue.length}`, 52, 248);
  else text('HOVER A HOUSE / FACTORY TO CREATE DEMAND', 52, 248);
  if (overdrive > .16) {
    fill(C.orange);
    text(`OVERDRIVE ${round(overdrive * 100)}%`, 52, 264);
  }

  textAlign(RIGHT, TOP);
  fill(210, 212, 218, 220);
  textStyle(BOLD);
  textSize(11);
  text('AIR LOAD', 1864, 44);
  textSize(18);
  fill(p > .58 ? C.orange : C.paper);
  text(`${round(pollution)}%`, 1864, 61);
  textStyle(NORMAL);
  textSize(9);
  fill(188, 190, 194, 150);
  text('ATMOSPHERIC PRESSURE', 1864, 87);

  const barW = 152;
  fill(243, 242, 240, 28);
  rect(1864 - barW * .5, 110, barW, 4);
  fill(p > .58 ? C.orange : C.blue);
  rect(1864 - barW + (barW * p) * .5, 110, barW * p, 4);

  // info node
  push();
  translate(INFO_UI.x, INFO_UI.y);
  const hoverT = hoverInfo ? 1 : 0;
  const pulse = 1 + sin(sceneTime * 2.6) * 0.02;
  scale(pulse);

  fill(red(color(C.orange)), green(color(C.orange)), blue(color(C.orange)), 190);
  regularHex(8, 8, INFO_UI.r * 1.12);

  fill(red(color(C.blue)), green(color(C.blue)), blue(color(C.blue)), hoverInfo ? 255 : 242);
  regularHex(0, 0, INFO_UI.r * 1.05);

  fill(hoverInfo ? color(35, 39, 58) : color(16, 18, 28));
  regularHex(0, 0, INFO_UI.r * 0.76);

  noFill();
  stroke(hoverInfo ? color(C.lime) : color(244, 241, 236, 120));
  strokeWeight(2.2);
  regularHex(0, 0, INFO_UI.r * 0.76);
  noStroke();

  fill(255, 255, 255, 235);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(32);
  text('i', 0, -3);
  fill(hoverInfo ? color(C.lime) : color(244, 241, 236, 180));
  textSize(32);
  text('i', -1, -4);
  pop();

  if (hoverInfo) {
    fill(C.lime);
    textAlign(RIGHT, TOP);
    textStyle(BOLD);
    textSize(10);
    text('PROJECT INFO', 1864, 178);
  }

  pop();
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
  rectMode(CORNER);
  noStroke();
  fill(4, 4, 10, 232);
  rect(0, 0, W, H);

  const x = 118, y = 62, w = 1660, h = 900;
  fill(C.orange);
  rect(x + 10, y + 10, w, h, 16);
  fill(5, 6, 14);
  rect(x, y, w, h, 16);
  fill(C.blue);
  rect(x, y, w, 10, 16, 16, 0, 0);

  fill(C.lime);
  rect(x + 38, y + 30, 92, 7);
  fill(C.paper);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(42);
  text('PROJECT INFORMATION', x + 38, y + 50);

  // left column
  drawInfoCard(x + 34, y + 122, 660, 290, 'PROJECT DETAILS', C.lime);
  fill(C.paper);
  textStyle(NORMAL);
  textSize(17);
  textLeading(25);
  text(`Name: Ngo Dac Phu
Project: HARM — Stage 1
Group: Ba Mien Bros
Group members: Nguyen Tran Phuc Duong;
Ngo Dac Phu; Luong Duc Hung;
Nguyen Gia Toan Phu Nghia
Course: COMM2754 - Digital Media Specialisation 1
Course time: Thursday 11.30PM
Affiliation: RMIT University Vietnam,
Saigon South Campus, School of Communication and Design,
Digital Media Program`, x + 56, y + 188, 612, 220);

  drawInfoCard(x + 34, y + 442, 660, 168, 'SUSTAINABLE DEVELOPMENT GOAL', C.orange);
  fill(C.paper);
  textSize(17);
  textLeading(28);
  text('Sustainable Development Goal 7: Ensure access to affordable, reliable, sustainable and modern energy for all.', x + 56, y + 512, 610, 84);

  // CTA follows the supplied reference: one generous lime card, black type,
  // strong heading and a larger two-line action message.
  fill(C.lime);
  rect(x + 34, y + 638, 660, 184, 16);
  fill(C.ink);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(18);
  text('CALL TO ACTION', x + 56, y + 660);
  textSize(25);
  textLeading(35);
  text(`Help HEAL the planet by choosing cleaner energy & supporting a renewable future`, x + 56, y + 706, 612, 88);

  // right column
  drawInfoCard(x + 730, y + 122, 898, 164, 'QUOTE', '#F5B2D0');
  fill(C.paper);
  textStyle(BOLD);
  textSize(19);
  textLeading(30);
  text('“Clean, renewable energy is the difference between life and death.”', x + 756, y + 172, 844, 64);
  fill(180, 184, 196);
  textStyle(NORMAL);
  textSize(15);
  textLeading(22);
  text('António Guterres, opening remarks to the High-level Dialogue on Energy, 24 September 2021.', x + 756, y + 246, 824, 36);

  drawInfoCard(x + 730, y + 314, 898, 326, 'PROJECT BRIEF', C.orange);
  fill(C.paper);
  textStyle(NORMAL);
  textSize(17);
  textLeading(28);
  text('Sustainable Development Goal 7 promotes access to affordable, reliable, and sustainable energy for all. Through HARM, this project visualises the hidden cost of fossil-energy systems: electricity demand is supplied through coal burning, while smoke, carbon and atmospheric pressure accumulate across the environment. The artwork contrasts useful power with environmental damage, showing how energy choices shape both human activity and ecological wellbeing.', x + 756, y + 388, 836, 214);

  drawInfoCard(x + 730, y + 676, 898, 118, 'HOW TO PLAY', C.lime);
  drawHowTo(x + 756, y + 736, 840);

  fill(C.lime);
  textAlign(CENTER, TOP);
  textStyle(BOLD);
  textSize(13);
  text('PRESS I AGAIN TO ESCAPE', W / 2, y + h + 12);
  rectMode(CENTER);
  pop();
}

function drawInfoCard(x, y, w, h, label, accent) {
  noStroke();
  fill(18, 18, 46, 184);
  rect(x, y, w, h, 12);
  fill(accent);
  rect(x, y, w, 7, 12, 12, 0, 0);
  fill(accent);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(16);
  text(label, x + 22, y + 18);
}


function drawHowTo(x, y, w) {
  const items = [
    ['1', 'CLICK / DRAG COAL', 'Feed coal into the furnace to generate power.', C.orange],
    ['2', 'HOVER HOUSES OR FACTORIES', 'Create electricity demand across the island system.', '#F5B2D0'],
    ['3', 'WATCH AIR LOAD RISE', 'Smoke and pressure accumulate overhead as HARM spreads.', C.lime]
  ];
  const cw = w / 3;
  for (let i = 0; i < items.length; i++) {
    const [n, title, body, cc] = items[i];
    const ox = x + i * cw;
    fill(cc);
    circle(ox + 13, y + 10, 28);
    fill(C.ink);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(11);
    text(n, ox + 13, y + 10);
    fill(C.paper);
    textAlign(LEFT, TOP);
    textStyle(BOLD);
    textSize(14);
    text(title, ox + 34, y - 3);
    fill(225, 227, 233);
    textStyle(NORMAL);
    textSize(12);
    textLeading(17);
    text(body, ox + 34, y + 17, cw - 46, 40);
  }
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
    infoOpen = false;
    return false;
  }

  if (dist(mouseX, mouseY, INFO_UI.x, INFO_UI.y) < INFO_UI.r * 1.3) {
    infoOpen = true;
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
