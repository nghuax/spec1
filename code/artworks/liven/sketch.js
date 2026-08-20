const ART_W = 1920;
const ART_H = 1080;

const PAL = {
  black: '#141414',
  gray: '#9EA2A3',
  white: '#FFFFFF',
  blue: '#2033FF',
  purple: '#6952EB',
  orange: '#FE7D21',
  green: '#B3FF3B',
  teal: '#078D8C',
  earthGray: '#9EA2A3',
  earthBlue: '#2033FF'
};

const TITLE = 'LIVEN';
const SUBTITLE = 'SDG7 - Clean & Renewable Energy';

let viewport = { scale: 1, x: 0, y: 0 };
let logicalMouse = { x: -9999, y: -9999 };
let sceneSeed = 1;
let backgroundShapes = [];
let backgroundMarks = [];
let earth;
let energyPieces = [];
let trashPieces = [];
let energyPanel;
let draggingPiece = null;
let dragOffset = { x: 0, y: 0 };

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('artwork');
  pixelDensity(min(window.devicePixelRatio || 1, 2));
  // HEAL integration: use the user-selected shared typeface across the system.
  textFont('Stack Sans Notch');
  regenerateScene();
}

function draw() {
  background(PAL.white);
  updateViewport();
  updateLogicalMouse();
  push();
  translate(viewport.x, viewport.y);
  scale(viewport.scale);
  drawScene();
  pop();
  updateCursor();
}

function regenerateScene() {
  sceneSeed = floor(random(1, 99999999));
  randomSeed(sceneSeed);
  noiseSeed(sceneSeed);
  backgroundShapes = createBackgroundShapes();
  backgroundMarks = createBackgroundMarks();
  earth = new EarthPuzzle(ART_W * 0.52, ART_H * 0.55, 220);
  energyPieces = createEnergyPieces();
  trashPieces = createTrashPieces();
  energyPanel = new EnergyPanel(ART_W - 480, 42, 420, 132);
  draggingPiece = null;
}

function drawScene() {
  updatePieces();
  earth.update(placedCount());
  energyPanel.update(placedCount() / 3);
  drawBackgroundShapes();
  drawBackgroundMarks();
  drawOrbitLines();
  drawTrashPieces();
  earth.draw();
  drawEnergyPieces();
  drawTitlePanel();
  energyPanel.draw();
  drawHintText();
}

function updateViewport() {
  viewport.scale = min(width / ART_W, height / ART_H);
  viewport.x = (width - ART_W * viewport.scale) * 0.5;
  viewport.y = (height - ART_H * viewport.scale) * 0.5;
}

function updateLogicalMouse() {
  logicalMouse.x = (mouseX - viewport.x) / viewport.scale;
  logicalMouse.y = (mouseY - viewport.y) / viewport.scale;
  if (logicalMouse.x < 0 || logicalMouse.x > ART_W || logicalMouse.y < 0 || logicalMouse.y > ART_H) {
    logicalMouse.x = logicalMouse.y = -9999;
  }
}

function createBackgroundShapes() {
  const result = [];
  const target = floor(random(4, 7));
  let tries = 0;
  while (result.length < target && tries < 400) {
    tries++;
    const c = {
      x: random(180, ART_W - 180),
      y: random(180, ART_H - 150),
      radius: random(120, 220),
      sides: floor(random(3, 6)),
      rotation: random(TWO_PI),
      irregularity: random(0.16, 0.34)
    };
    if (dist(c.x, c.y, ART_W * 0.52, ART_H * 0.55) < 390) continue;
    if (c.y < 190 && (c.x < 640 || c.x > ART_W - 600)) continue;
    let overlap = false;
    for (const o of result) {
      if (dist(c.x, c.y, o.x, o.y) < c.radius + o.radius + 70) { overlap = true; break; }
    }
    if (!overlap) result.push(c);
  }
  return result;
}

function drawBackgroundShapes() {
  noStroke();
  const c = color(PAL.purple); c.setAlpha(24); fill(c);
  for (const s of backgroundShapes) {
    push(); translate(s.x, s.y); rotate(s.rotation); beginShape();
    for (let i = 0; i < s.sides; i++) {
      const a = i * TWO_PI / s.sides;
      const r = s.radius * (1 + sin(i * 7.13 + sceneSeed * 0.001) * s.irregularity);
      vertex(cos(a) * r, sin(a) * r);
    }
    endShape(CLOSE); pop();
  }
}

function createBackgroundMarks() {
  const a = [];
  for (let i = 0; i < 16; i++) {
    a.push({
      x: random(60, ART_W - 60), y: random(70, ART_H - 80), size: random(4, 10),
      sides: floor(random(3, 6)), rot: random(TWO_PI), color: random([PAL.blue, PAL.purple, PAL.orange, PAL.green])
    });
  }
  return a;
}

function drawBackgroundMarks() {
  noStroke();
  for (const m of backgroundMarks) {
    push(); translate(m.x, m.y); rotate(m.rot); fill(m.color); beginShape();
    for (let i = 0; i < m.sides; i++) {
      const a = i * TWO_PI / m.sides;
      const r = m.size * (i % 2 ? 0.72 : 1.15);
      vertex(cos(a) * r, sin(a) * r);
    }
    endShape(CLOSE); pop();
  }
}

function drawOrbitLines() {
  noFill(); stroke(PAL.blue); strokeWeight(2.5);
  ellipse(earth.x, earth.y, 1260, 570);
  ellipse(earth.x, earth.y + 10, 1460, 680);
  ellipse(earth.x, earth.y - 5, 1650, 790);
}

function getRandomStartAngle(used) {
  for (let attempt = 0; attempt < 80; attempt++) {
    const angle = random(TWO_PI);
    let safe = true;
    for (const existing of used) {
      const d = abs(atan2(sin(angle - existing), cos(angle - existing)));
      if (d < 0.72) { safe = false; break; }
    }
    if (safe) return angle;
  }
  return random(TWO_PI);
}

function makeShape(kind) {
  const sets = [
    [[-72,-58],[12,-74],[78,-10],[46,76],[-62,44]],
    [[-76,-46],[16,-66],[70,12],[-6,76],[-72,34]],
    [[-68,-60],[22,-72],[78,4],[14,76],[-76,36]],
    [[-72,-54],[18,-68],[68,6],[14,68],[-62,42]],
    [[-82,-46],[38,-24],[52,60],[-60,38]],
    [[-74,-14],[82,-48],[60,50],[-18,76]]
  ];
  return sets[kind % sets.length].map(([x,y]) => createVector(x,y));
}

function createEnergyPieces() {
  const types = ['solar', 'turbine', 'water'];
  const used = [];
  return types.map((type, i) => {
    const startAngle = getRandomStartAngle(used); used.push(startAngle);
    return new OrbitPiece({ id:i, type, localShape:makeShape(i), slotIndex:i, role:'energy', startAngle, orbitRing:floor(random(3)) });
  });
}

function createTrashPieces() {
  const types = ['paper','bottle','fish','can','bag','carton','paper','bottle'];
  const used = [];
  return types.map((type, i) => {
    const startAngle = getRandomStartAngle(used); used.push(startAngle);
    return new OrbitPiece({ id:20+i, type, localShape:makeShape(i+3), slotIndex:-1, role:'trash', startAngle, orbitRing:floor(random(3)) });
  });
}

function updatePieces() {
  for (const p of trashPieces) p.update();
  for (const p of energyPieces) p.update();
}
function drawTrashPieces() { for (const p of trashPieces) p.draw(); }
function drawEnergyPieces() { for (const p of energyPieces) p.draw(); }
function placedCount() { return energyPieces.filter(p => p.placed).length; }
function getAllDraggablePieces() { return [...trashPieces, ...energyPieces]; }

function updateCursor() {
  let hit = false;
  for (const p of getAllDraggablePieces()) if (!p.placed && p.hitTest(logicalMouse.x, logicalMouse.y)) hit = true;
  cursor(hit || draggingPiece ? 'grab' : 'default');
}

function mousePressed() {
  const all = getAllDraggablePieces();
  for (let i = all.length - 1; i >= 0; i--) {
    const p = all[i];
    if (!p.placed && p.hitTest(logicalMouse.x, logicalMouse.y)) {
      const d = p.getDisplayPosition(); p.x = d.x; p.y = d.y;
      draggingPiece = p; p.dragging = true; p.returning = false;
      dragOffset.x = logicalMouse.x - p.x; dragOffset.y = logicalMouse.y - p.y;
      return false;
    }
  }
  return false;
}

function mouseDragged() {
  if (draggingPiece) {
    draggingPiece.x = logicalMouse.x - dragOffset.x;
    draggingPiece.y = logicalMouse.y - dragOffset.y;
  }
  return false;
}

function mouseReleased() {
  if (!draggingPiece) return false;
  const p = draggingPiece; p.dragging = false;
  if (p.role === 'energy') {
    const slot = earth.slots[p.slotIndex];
    const d = dist(p.x, p.y, slot.x, slot.y);
    if (!slot.filled && d < slot.snapRadius) p.placeIntoSlot(slot); else p.returnToOrbit();
  } else p.returnToOrbit();
  draggingPiece = null;
  return false;
}

function drawTitlePanel() {
  const x=58,y=42,w=500,h=108;
  noStroke(); fill(PAL.orange); rect(x+8,y+8,w,h,4);
  fill(PAL.white); rect(x,y,w,h,4);
  fill(PAL.blue); rect(x,y,w,13);
  fill(PAL.black); textAlign(LEFT,TOP); textStyle(BOLD); textSize(14); text(SUBTITLE,x+22,y+25);
  textSize(46); text(TITLE,x+22,y+50);
}

function drawHintText() {
  noStroke(); fill(PAL.black); textAlign(LEFT,BASELINE); textSize(16);
  text('Drag renewable energy pieces into Earth  ·  Trash can be moved but cannot restore the planet  ·  R: regenerate  ·  S: save', 92, ART_H - 55);
}

class EarthPuzzle {
  constructor(x,y,r) {
    this.x=x; this.y=y; this.r=r; this.progress=0; this.visualProgress=0;
    this.slots=this.createSlots();
    this.baseLandPieces=this.createBaseLandPieces();
  }
  createSlots() {
    const defs=[{x:0,y:-72,angle:-0.08},{x:-92,y:56,angle:0.08},{x:92,y:56,angle:-0.08}];
    return defs.map((d,i)=>({ id:i, x:this.x+d.x, y:this.y+d.y, angle:d.angle, scale:0.76, snapRadius:90, filled:false, piece:null }));
  }
  createBaseLandPieces() {
    const p = [
      [[-130,-112],[-80,-158],[-32,-114],[-52,-60],[-122,-68]],
      [[55,-150],[132,-112],[112,-58],[56,-70],[30,-116]],
      [[-165,50],[-118,24],[-72,52],[-88,110],[-146,120]],
      [[90,50],[158,40],[164,96],[112,140],[62,110]]
    ];
    return p.map(poly=>poly.map(([x,y])=>createVector(x,y)));
  }
  update(count) {
    this.progress = constrain(count / 3, 0, 1);
    this.visualProgress = lerp(this.visualProgress, this.progress, 0.045);
  }
  draw() {
    const earthColor = lerpColor(color(PAL.earthGray), color(PAL.earthBlue), this.visualProgress);
    const landColor = lerpColor(color(PAL.black), color(PAL.green), this.visualProgress);
    noStroke(); fill(earthColor); circle(this.x,this.y,this.r*2);
    push(); translate(this.x,this.y); fill(landColor);
    for (const land of this.baseLandPieces) { beginShape(); for (const q of land) vertex(q.x,q.y); endShape(CLOSE); }
    pop();
    for (const slot of this.slots) if (!slot.filled) this.drawEmptySlot(slot);
    const ctx=drawingContext; ctx.save(); ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,TWO_PI); ctx.clip();
    for (const slot of this.slots) if (slot.filled && slot.piece) slot.piece.drawPlaced();
    ctx.restore();
  }
  drawEmptySlot(slot) {
    const piece=energyPieces.find(p=>p.slotIndex===slot.id); if(!piece)return;
    push(); translate(slot.x,slot.y); rotate(slot.angle); scale(slot.scale); noStroke(); fill(PAL.white);
    beginShape(); for(const p of piece.localShape) vertex(p.x,p.y); endShape(CLOSE); pop();
  }
}

class OrbitPiece {
  constructor({id,type,localShape,slotIndex,role,startAngle,orbitRing}) {
    this.id=id; this.type=type; this.localShape=localShape; this.slotIndex=slotIndex; this.role=role;
    this.orbitAngle=startAngle; this.orbitRing=orbitRing; this.baseAngle=random(-0.18,0.18); this.angle=this.baseAngle;
    this.dragging=false; this.returning=false; this.placed=false; this.hovered=false; this.placedSlot=null;
    const rx=[620,730,825], ry=[290,350,405];
    this.orbitRadiusX=rx[orbitRing]+random(-22,22); this.orbitRadiusY=ry[orbitRing]+random(-18,18);
    this.orbitSpeed=random(0.00035,0.00068)*(random()>0.5?1:-1);
    const s=this.getOrbitPosition(); this.x=s.x; this.y=s.y; this.targetX=this.x; this.targetY=this.y;
    this.floatOffset=random(TWO_PI); this.floatRange=random(3,7);
  }
  getOrbitPosition() { return createVector(earth.x+cos(this.orbitAngle)*this.orbitRadiusX, earth.y+sin(this.orbitAngle)*this.orbitRadiusY); }
  update() {
    if(this.placed)return;
    if(!this.dragging){
      this.orbitAngle+=this.orbitSpeed; const o=this.getOrbitPosition(); this.targetX=o.x; this.targetY=o.y;
      this.hovered=this.hitTest(logicalMouse.x,logicalMouse.y);
    }
    if(this.returning){
      this.x=lerp(this.x,this.targetX,0.12); this.y=lerp(this.y,this.targetY,0.12);
      if(dist(this.x,this.y,this.targetX,this.targetY)<3)this.returning=false; return;
    }
    if(!this.dragging){this.x=this.targetX;this.y=this.targetY;}
  }
  getDisplayPosition(){ if(this.dragging)return createVector(this.x,this.y); return createVector(this.x,this.y+sin(frameCount*0.035+this.floatOffset)*this.floatRange); }
  getDisplayAngle(){ if(this.dragging)return this.angle; return this.hovered?this.baseAngle+sin(frameCount*0.55+this.id)*0.085:this.baseAngle; }
  getWorldVertices(){ const pos=this.getDisplayPosition(), a=this.getDisplayAngle(); return this.localShape.map(v=>rotateTranslate(v,a,pos.x,pos.y)); }
  hitTest(px,py){return pointInPolygon(px,py,this.getWorldVertices());}
  draw(){
    if(this.placed)return; const pos=this.getDisplayPosition(); push(); translate(pos.x,pos.y); rotate(this.getDisplayAngle());
    noStroke(); fill(PAL.purple); beginShape(); for(const p of this.localShape)vertex(p.x,p.y); endShape(CLOSE);
    if(this.role==='energy')drawReferenceElement(this.type); else drawTrashIcon(this.type); pop();
  }
  drawPlaced(){
    if(!this.placedSlot)return; push(); translate(this.placedSlot.x,this.placedSlot.y); rotate(this.placedSlot.angle); scale(this.placedSlot.scale);
    noStroke(); fill(PAL.green); beginShape(); for(const p of this.localShape)vertex(p.x,p.y); endShape(CLOSE); drawReferenceElement(this.type); pop();
  }
  placeIntoSlot(slot){this.placed=true;this.dragging=false;this.returning=false;this.placedSlot=slot;slot.filled=true;slot.piece=this;this.x=slot.x;this.y=slot.y;}
  returnToOrbit(){this.returning=true;}
}

class EnergyPanel {
  constructor(x,y,w,h){this.x=x;this.y=y;this.w=w;this.h=h;this.level=0;}
  update(target){this.level=lerp(this.level,constrain(target,0,1),0.08);}
  draw(){
    const {x,y,w,h}=this; noStroke(); fill(PAL.orange); rect(x+8,y+8,w,h,4); fill(PAL.white); rect(x,y,w,h,4); fill(PAL.green); rect(x,y,w,13);
    fill(PAL.black); textAlign(LEFT,TOP); textStyle(BOLD); textSize(13); text('RENEWABLE ENERGY',x+22,y+24); textSize(25); text('RESTORING LIFE TO EARTH',x+22,y+48);
    fill(PAL.gray); rect(x+22,y+95,w-44,16); fill(PAL.blue); rect(x+22,y+95,(w-44)*this.level,16);
  }
}

function drawReferenceElement(type){ if(type==='solar')drawSolarIcon(); if(type==='turbine')drawTurbineIcon(); if(type==='water')drawWaterIcon(); }

function drawSolarIcon(){
  push(); noStroke();
  fill(PAL.orange); quad(-42,42,2,4,44,42,-26,42); rect(-6,10,12,32); rect(-48,42,96,6);
  fill(PAL.teal); quad(-50,-30,38,-30,26,8,-62,8);
  fill(PAL.blue); quad(-42,-24,-16,-24,-22,-2,-49,-2); quad(-12,-24,14,-24,8,-2,-18,-2); quad(18,-24,32,-24,26,-2,12,-2);
  fill(PAL.orange); quad(-48,2,-22,2,-28,6,-54,6); fill(PAL.green); quad(-18,2,8,2,2,6,-24,6); fill(PAL.blue); pop();
}

function drawTurbineIcon(){
  push(); noStroke(); fill(PAL.teal); quad(-8,-4,8,-4,15,52,-15,52); fill(PAL.orange);
  push(); translate(0,-5); triangle(-2,0,7,-54,16,-3); rotate(TWO_PI/3); triangle(-2,0,7,-54,16,-3); rotate(TWO_PI/3); triangle(-2,0,7,-54,16,-3); pop();
  fill(PAL.blue); circle(0,-5,20); fill(PAL.purple); rect(-14,52,28,8); fill(PAL.orange); rect(-15,60,30,10); pop();
}

function drawWaterIcon(){
  push(); noStroke(); fill(PAL.orange); circle(0,0,92); fill(PAL.teal);
  for(let i=0;i<6;i++){push();rotate(i*TWO_PI/6);triangle(0,0,12,-34,32,-12);pop();}
  fill(PAL.purple); triangle(0,0,-42,10,-24,32); fill(PAL.green); triangle(0,0,30,12,42,30); fill(PAL.white); triangle(0,0,-8,-44,12,-34); pop();
}

function drawTrashIcon(type){
  if(type==='paper')drawTrashPaper(); else if(type==='bottle')drawTrashBottle(); else if(type==='fish')drawTrashFish(); else if(type==='can')drawTrashCan(); else if(type==='bag')drawTrashBag(); else drawTrashCarton();
}
function drawTrashPaper(){push();rotate(-0.15);noStroke();fill(PAL.white);beginShape();vertex(-33,-30);vertex(18,-34);vertex(35,-10);vertex(20,26);vertex(-20,32);vertex(-39,8);endShape(CLOSE);fill(PAL.orange);rect(-20,-11,39,7);rect(-18,4,28,6);pop();}
function drawTrashBottle(){noStroke();fill(PAL.blue);rect(-12,-39,24,15,3);fill(PAL.green);beginShape();vertex(-16,-22);vertex(15,-22);vertex(23,-8);vertex(18,35);vertex(-18,35);vertex(-23,-8);endShape(CLOSE);fill(PAL.white);rect(-15,-3,30,11);}
function drawTrashFish(){stroke(PAL.white);strokeWeight(5);line(-32,0,28,0);for(let i=-22;i<=15;i+=12){line(i,0,i-9,-14);line(i,0,i-9,14);}noStroke();fill(PAL.orange);triangle(27,0,47,-18,47,18);fill(PAL.white);circle(-36,0,14);fill(PAL.black);circle(-39,-2,4);}
function drawTrashCan(){noStroke();fill(PAL.orange);rect(-23,-34,46,68,8);fill(PAL.white);rect(-19,-29,38,7);fill(PAL.blue);rect(-14,-6,28,16);fill(PAL.green);circle(0,2,8);}
function drawTrashBag(){noStroke();fill(PAL.black);beginShape();vertex(-28,-14);vertex(-16,-29);vertex(-6,-19);vertex(8,-31);vertex(19,-17);vertex(29,5);vertex(22,31);vertex(-25,31);vertex(-33,7);endShape(CLOSE);fill(PAL.orange);rect(-13,-17,27,7);}
function drawTrashCarton(){noStroke();fill(PAL.white);beginShape();vertex(-29,-24);vertex(17,-31);vertex(33,-15);vertex(25,29);vertex(-26,32);endShape(CLOSE);fill(PAL.green);rect(-18,-10,36,20);fill(PAL.orange);triangle(17,-31,33,-15,21,-6);}

function pointInPolygon(px,py,vertices){let inside=false;for(let i=0,j=vertices.length-1;i<vertices.length;j=i++){const xi=vertices[i].x,yi=vertices[i].y,xj=vertices[j].x,yj=vertices[j].y;const hit=((yi>py)!==(yj>py))&&(px<(xj-xi)*(py-yi)/(yj-yi+0.000001)+xi);if(hit)inside=!inside;}return inside;}
function rotateTranslate(v,a,tx,ty){return createVector(v.x*cos(a)-v.y*sin(a)+tx,v.x*sin(a)+v.y*cos(a)+ty);}

function keyPressed(){if(key==='r'||key==='R')regenerateScene();if(key==='s'||key==='S')saveCanvas(`COMM2754-2026-S2-A1w04-Liven-${sceneSeed}`,'png');}
function windowResized(){resizeCanvas(windowWidth,windowHeight);}
