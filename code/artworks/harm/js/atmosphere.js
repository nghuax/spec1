// Visual-only arrival and small background gusts. Never changes energy or pollution.
let artRipples = [];
function objectArrival(o) {
  if (o.entryDX === undefined) return {x:0,y:0,progress:1};
  if (!Number.isFinite(o.activationAt)) return {x:o.entryDX,y:o.entryDY,progress:0};
  const progress=constrain((sceneTime-o.activationAt)/o.entryDuration,0,1);
  const remaining=1-smooth01(progress);
  return {x:o.entryDX*remaining,y:o.entryDY*remaining,progress};
}
function addArtRipple(x,y) {
  if (infoOpen || x<0 || y<0 || x>W || y>H) return;
  artRipples.push({x,y,age:0});
  if (artRipples.length>4) artRipples.shift();
}
function updateArtRipples(dt) {
  for (const r of artRipples) r.age+=dt;
  artRipples=artRipples.filter(r=>r.age<1.8);
}
function applyArtRipple(a,dt) {
  for (const r of artRipples) {
    const dx=a.x-r.x,dy=a.y-r.y,d=Math.hypot(dx,dy);
    const radius=30+r.age*160;
    const band=Math.max(0,1-Math.abs(d-radius)/60);
    if(d>1 && band>0) {
      const force=band*(1-r.age/1.8)*dt*5;
      a.vx+=(dx/d-dy/d*.45)*force;
      a.vy+=(dy/d+dx/d*.45)*force;
    }
  }
}
function drawArtRipples() {
  push(); noFill(); strokeWeight(1);
  for(const r of artRipples) {
    const radius=30+r.age*160;
    for(let j=0;j<3;j++) {
      stroke(j===1 ? color(255,123,0,45*(1-r.age/1.8)) : color(221,213,202,35*(1-r.age/1.8)));
      beginShape();
      for(let i=0;i<10;i++) {
        const angle=j*TWO_PI/3+i*.10+r.age*.2;
        vertex(r.x+cos(angle)*radius,r.y+sin(angle)*radius*.65);
      }
      endShape();
    }
  }
  pop();
}
