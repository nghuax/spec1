/* Continent silhouettes and living-world illustration, in the existing palette. */
const CONTINENT_OUTLINES = [
  [[-.49,-.15],[-.45,-.28],[-.37,-.3],[-.39,-.4],[-.31,-.46],[-.23,-.39],[-.16,-.44],[-.12,-.36],[-.04,-.4],[.02,-.33],[.09,-.4],[.19,-.37],[.26,-.31],[.35,-.32],[.44,-.22],[.49,-.13],[.43,-.1],[.39,-.16],[.34,-.09],[.4,.01],[.37,.12],[.32,.17],[.34,.27],[.29,.32],[.25,.19],[.21,.16],[.18,.27],[.16,.42],[.11,.48],[.07,.34],[.02,.18],[-.03,.22],[-.08,.11],[-.14,.13],[-.11,.23],[-.2,.33],[-.25,.22],[-.27,.08],[-.33,.03],[-.35,.12],[-.42,.08],[-.41,-.02],[-.47,.02],[-.44,-.09]],
  [[-.42,-.37],[-.29,-.46],[-.12,-.43],[-.02,-.36],[.12,-.39],[.24,-.33],[.28,-.22],[.34,-.14],[.49,-.12],[.4,-.01],[.28,.07],[.23,.19],[.16,.25],[.13,.37],[.02,.47],[-.13,.49],[-.2,.35],[-.25,.23],[-.23,.12],[-.3,.02],[-.41,-.01],[-.49,-.13],[-.46,-.26]],
  [[-.47,-.13],[-.34,-.21],[-.26,-.34],[-.14,-.3],[-.06,-.4],[.04,-.34],[.12,-.41],[.19,-.23],[.31,-.19],[.38,-.07],[.43,.02],[.47,.17],[.4,.31],[.28,.36],[.16,.41],[.09,.28],[-.02,.3],[-.11,.24],[-.24,.29],[-.4,.35],[-.44,.14]]
];
let visualRestoration = 0;
let celebrationReveal = 0;

function continentShape(index, size, fitted = false) {
  const dimensions = fitted ? [[1.92, 1.25], [1.08, 1.46], [1.14, 1.02]] : [[1.12, .86], [.94, 1.12], [1.1, .94]];
  return { continent: index % 3, w: size * dimensions[index % 3][0], h: size * dimensions[index % 3][1] };
}

function drawContinentTile(shape, scaleValue, fillColor) {
  push();
  scale(scaleValue);
  noStroke(); fill(fillColor);
  beginShape();
  CONTINENT_OUTLINES[shape.continent].forEach(([x,y]) => vertex(x * shape.w, y * shape.h));
  endShape(CLOSE);
  pop();
}

function drawHouseCluster(kind, size, broken = false) {
  const variant = Math.max(0, ['solar','water','turbine','bag','barrel','can','bottle','fishbone'].indexOf(kind));
  push(); scale(size * .82); noStroke();
  const style = variant % 3;
  const polygon = points => { beginShape(); points.forEach(p => vertex(...p)); endShape(CLOSE); };
  if (broken) {
    const muted = [C.blue,C.orange,C.lime].map(c => lerpColor(color(c), color(C.black), .62));
    [8,25].forEach((x, i) => {
      const top = -47-i*17;
      fill(C.paper); quad(x-4,9,x+5,9,x+4,top,x-3,top);
      rect(x-5,top-3,11,3); fill(C.darkGray); rect(x-2,top-2,5,2);
      for(let j=0;j<4;j++) {
        const drift = (frameCount*.35+j*10+variant*9)%42;
        const smoke = color(C.darkGray); smoke.setAlpha(90*(1-drift/50)); fill(smoke);
        polygon(Array.from({length:7},(_,k) => {
          const a=k*Math.PI*2/7, r=5+drift*.15;
          return [x+drift*.65+Math.cos(a)*r,top-7-drift+Math.sin(a)*r];
        }));
      }
    });
    fill(style===0 ? muted[1] : style===1 ? C.black : muted[0]);
    polygon([[-36,5],[-28,-34],[-12,-37],[-14,9]]);
    fill(muted[style]);
    polygon(style===0 ? [[-43,29],[-43,2],[-4,-15],[43,-4],[43,29]]
      : style===1 ? [[-43,29],[-43,7],[-17,-3],[-17,-26],[43,-4],[43,29]]
      : [[-43,29],[-43,13],[-1,1],[-1,-24],[26,-16],[43,-16],[43,29]]);
    fill(C.paper); rect(-14,6,9,9);
  } else {
    fill(C.white); rect(25,-40,8,30);
    fill(style===1 ? C.blue : C.orange); rect(23,-44,12,5);
    if(style===0) {
      fill(C.blue); polygon([[-35,28],[-35,-7],[-1,-24],[35,-7],[35,28]]);
      fill(C.purpleDark); triangle(-36,-7,0,-24,36,-7);
      fill(C.orange); polygon([[-46,-6],[0,-43],[45,-6],[40,0],[0,-29],[-41,0]]);
      fill(C.white); rect(6,-1,12,13);
    } else if(style===1) {
      fill(C.lime); quad(-39,28,43,28,40,-17,-37,-9);
      fill(C.blue); triangle(-46,-8,-2,-38,44,-20);
      fill(C.purple); triangle(-2,-38,20,-29,4,-19);
      fill(C.black); quad(-21,-21,-5,-34,2,-32,-13,-20); quad(-11,-21,5,-32,12,-30,-3,-20);
      fill(C.white); rect(-17,2,11,12); rect(15,7,11,21);
    } else {
      fill(C.purpleDark); polygon([[-43,8],[-43,3],[-30,-6],[-30,-27],[5,-13],[5,14]]);
      fill(C.orange); polygon([[-40,28],[-40,9],[-13,-1],[-13,-38],[43,-9],[43,28]]);
      fill(C.white); rect(-7,7,21,12);
    }
  }
  pop();
}

function drawRecoveryTree(x, y, size, life) {
  const variant = Math.abs(Math.round(x+y)) % 3;
  push(); translate(x,y); scale(size);
  noStroke(); fill(C.black); quad(-5,0,5,0,3,-30,-3,-30);
  if (life < .95) {
    const branch = color(C.brown); branch.setAlpha(255*(1-life));
    stroke(branch); strokeWeight(2);
    line(0,-20,-13,-34); line(0,-25,12,-39); line(0,-25,0,-48);
  }
  if (life > .01) {
    noStroke(); const leaf=color([C.blue,C.orange,C.lime][variant]);
    leaf.setAlpha(life*255); fill(leaf);
    push(); translate(0,-24); scale(life);
    if(variant===1) {
      circle(-4,-12,29); circle(12,-31,17); circle(-3,-43,21);
    } else {
      triangle(-22,-3,-12,-16,18,-10);
      quad(-17,-20,-9,-33,16,-23,24,-17);
      triangle(-20,-36,6,-65,18,-43);
    }
    pop();
  }
  pop();
}

function graphicNoise(index) {
  const n = Math.sin(sceneSeed * .007 + index * 127.1) * 43758.5453;
  return n - Math.floor(n);
}

function drawWorldRecovery(heal, damage) {
  const life = visualRestoration * (1 - damage);
  push();
  drawingContext.save();
  drawingContext.beginPath(); drawingContext.arc(earth.x,earth.y,earth.r-3,0,Math.PI*2); drawingContext.clip();
  const trees = [[-230,-110,.72],[-160,-191,.65],[-80,-187,.6],[15,-210,.6],[147,-167,.6],[-211,105,.72],[-175,188,.65],[105,130,.58],[192,157,.62]];
  trees.forEach(([x,y,s]) => drawRecoveryTree(earth.x+x,earth.y+y,s * 1.45,life));
  noFill(); strokeWeight(1.6);
  const water = lerpColor(color(C.gray),color(C.white),life); water.setAlpha(90+100*life); stroke(water);
  [[-38,45],[28,112],[-25,212],[220,-45],[202,13]].forEach(([x,y]) => {
    beginShape(); for(let j=0;j<9;j++) vertex(earth.x+x+j*5,earth.y+y+(j%2)*3); endShape();
  });
  drawingContext.restore();
  pop();
}

function drawPeaceCircle() {
  if (!earthIsRestored()) return;
  const reveal = constrain((visualRestoration - .72) / .28,0,1);
  if(reveal<=0) return;
  const count = 24, radius = earth.r + 35;
  const palette = [C.orange,C.lime,C.pink,C.purple,C.white,C.blue];
  push(); translate(earth.x,earth.y); rotate(earthRotation * .35);
  for(let i=0;i<count;i++) {
    const angle = i*TWO_PI/count;
    const shirt = color(palette[Math.floor(graphicNoise(i+320)*palette.length)]); shirt.setAlpha(reveal*255);
    const skin = color(palette[Math.floor(graphicNoise(i+420)*palette.length)]); skin.setAlpha(reveal*255);
    push(); rotate(angle); translate(0,-radius);
    const halfSpan = radius * Math.sin(PI/count);
    const jointY = radius * (1-Math.cos(PI/count));
    stroke(shirt); strokeWeight(5); noFill();
    line(-halfSpan,jointY,-9,-9); line(-9,-9,9,-9); line(9,-9,halfSpan,jointY);
    noStroke(); fill(shirt);
    const hem = 9+graphicNoise(i+510)*6;
    quad(-8,-10,8,-10,hem,12,-hem,12);
    stroke(shirt); strokeWeight(4); line(-5,10,-7,23); line(5,10,7,23);
    noStroke(); fill(skin);
    const head = 12+graphicNoise(i+620)*5;
    if(i%3===0) rect(-head/2,-32,head,head,3); else ellipse(0,-24,head,head);
    pop();
  }
  pop();
}
