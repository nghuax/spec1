// Optional interaction layered over an autonomous post-completion rhythm.
const pressure = {holding:false, charge:0, compression:0, kick:0, nextAt:Infinity, pending:0, emitClock:0, waves:[], cycle:0};
function resetPressure() {
  Object.assign(pressure,{holding:false,charge:0,compression:0,kick:0,nextAt:Infinity,pending:0,emitClock:0,waves:[],cycle:0});
}
function beginPressure(x,y) {
  if (!completionShown || infoOpen || pressure.holding) return false;
  const p=machineRenderPose();
  if (dist(x,y,p.x,p.y) > 170*p.scale) return false;
  pressure.holding=true; pressure.charge=.12;
  return true;
}
function releasePressure() {
  if (!pressure.holding) return;
  pressure.holding=false;
  if (!infoOpen && completionShown) exhalePressure(.45+pressure.charge*.55);
  pressure.charge=0;
}
function exhalePressure(strength) {
  pressure.kick=Math.max(pressure.kick,strength);
  pressure.pending=Math.min(72,pressure.pending+Math.round(16+strength*30));
  pressure.nextAt=sceneTime+4.2+genSample(`breath-${pressure.cycle++}`,9)*1.8;
  const o=machineExhaustPoint();
  emitDamageWaste(o.x,o.y,strength,'pollution');
  if (strength>.7) emitDamageWaste(o.x,o.y,strength,'pollution');
  pressure.waves.push({x:o.x,y:o.y,age:0,strength,phase:pressure.cycle*1.7});
  if (pressure.waves.length>5) pressure.waves.shift();
  recordGenerativeBurn(null);
}
function updatePressure(dt) {
  if (!completionShown) return;
  if (infoOpen) { pressure.holding=false; pressure.charge=0; return; }
  if (pressure.holding) pressure.charge=Math.min(1,pressure.charge+dt*.55);
  else if (sceneTime>=pressure.nextAt) exhalePressure(.38);
  const auto=pressure.holding ? 0 : smooth01(constrain(1-(pressure.nextAt-sceneTime)/1.3,0,1))*.4;
  pressure.compression=lerp(pressure.compression,pressure.holding ? pressure.charge : auto,1-Math.exp(-dt*9));
  pressure.kick*=Math.exp(-dt*3.6);
  pressure.emitClock+=dt;
  // Spread a pulse across frames rather than allocating every particle at once.
  if (pressure.pending>0 && pressure.emitClock>=.035) {
    pressure.emitClock=0;
    const o=machineExhaustPoint();
    const count=Math.min(4,pressure.pending);
    for (let i=0;i<count;i++) {
      if (smoke.length>=MAX_SMOKE) smoke.shift();
      emitSmoke(o.x,o.y,1.0+pressure.kick*.5,'machinePressure',.55,1);
      const s=smoke[smoke.length-1];
      s.vx+=Math.sin(pressure.cycle*2.4+i*.6)*(.5+pressure.kick);
      s.vy-=.8+pressure.kick;
    }
    pressure.pending-=count;
  }
  for (const wave of pressure.waves) wave.age+=dt;
  pressure.waves=pressure.waves.filter(w=>w.age<2.3);
}
function drawPressureWake() {
  if (!completionShown || infoOpen) return;
  push(); noFill(); strokeWeight(1);
  for (const w of pressure.waves) {
    const t=w.age/2.3;
    stroke(235,232,224,(1-t)*65*w.strength);
    // Open, folded contours echo the plume; no circular button or target.
    for (let j=0;j<3;j++) {
      beginShape();
      for (let i=0;i<8;i++) {
        const spread=(12+t*100)*(1+j*.22);
        vertex(w.x+Math.sin(i*.8+w.phase)*spread,w.y-t*160-i*(5+t*9));
      }
      endShape();
    }
  }
  pop();
}
window.addEventListener('pointerup',releasePressure);
window.addEventListener('pointercancel',()=>{pressure.holding=false;pressure.charge=0;});
window.addEventListener('blur',()=>{pressure.holding=false;pressure.charge=0;});
// Keyboard alternative without introducing a permanent UI panel.
window.addEventListener('keydown',e=>{
  if(e.code!=='Space' || e.repeat || /^(INPUT|BUTTON|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  if(completionShown && !infoOpen) {e.preventDefault();const p=machineRenderPose();beginPressure(p.x,p.y);}
});
window.addEventListener('keyup',e=>{if(e.code==='Space') releasePressure();});
