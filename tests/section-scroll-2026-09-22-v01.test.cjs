const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync('code/js/section-scroll-2026-09-22-v01.js', 'utf8').replace(/^import .*;\s*/m, '').replace('export class SectionScroll', 'globalThis.SectionScroll = class SectionScroll');
const motionSource = fs.readFileSync('code/js/motion-2026-09-22-v01.js', 'utf8').replaceAll('export ', '');

function fixture({ reduced = false, height = 900, introductions = false } = {}) {
  let time = 0, serial = 0;
  let maxScroll=height*7;
  const jobs = new Map(), events = {}, mediaEvents = {};
  const root = { dataset: {} };
  const reducedMotion = { matches: reduced, addEventListener: (name, fn) => { mediaEvents[name] = fn; } };
  const later = (fn, delay) => { const id = ++serial; jobs.set(id, { fn, at: time + delay }); return id; };
  const view = {
    innerHeight: height, scrollY: 0, performance: { now: () => time },
    addEventListener: (name, fn) => { events[name] = fn; },
    requestAnimationFrame: fn => later(fn, 16), cancelAnimationFrame: id => jobs.delete(id),
    setTimeout: later, clearTimeout: id => jobs.delete(id),
    scrollTo({ top }) { const y = Math.max(0, Math.min(maxScroll, top)); if (y !== this.scrollY) { this.scrollY = y; events.scroll(); } },
    scrollBy({ top }) { this.scrollTo({ top: this.scrollY + top }); }
  };
  const context = vm.createContext({});
  vm.runInContext(motionSource, context);
  vm.runInContext(source, context);
  const controller = new context.SectionScroll({ view, root, reducedMotion });
  const ids = ['landing', 'harm', 'exhaust', 'adapt', 'liven', 'heal', 'about'];
  let bounds = ids.map((id, i) => ({ id, top: i * height, bottom: (i + (id === 'about' ? 2 : 1)) * height, artwork: i > 0 && i < 5 }));
  if(introductions) {
    const introSource=fs.readFileSync('code/js/stage-intros-2026-09-22-v01.js','utf8').replaceAll('export ','');
    vm.runInContext(introSource,context);
    let top=0;
    bounds=ids.flatMap(id=>{
      const artwork=['harm','exhaust','adapt','liven'].includes(id);
      const bottom=top+height*(id==='about'?2:1);
      const bound={id,top,bottom,artwork};
      const stops=artwork?context.chapterStops(bound,top+height*1.9,height):[bound];
      top=bottom;return stops;
    });
    maxScroll=top-height;
  }
  controller.measure(bounds, height, maxScroll);
  function advance(ms) {
    const end = time + ms;
    for (let i = 0; i < 20000; i++) {
      const next = [...jobs].filter(([, job]) => job.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      jobs.delete(next[0]); time = next[1].at; next[1].fn(time);
    }
    time = end;
  }
  const wheel = (delta, step = 16) => { controller.relayWheel(delta); advance(step); };
  function go(id) { controller.go(id, { instant: true }); advance(300); }
  return { controller, root, view, events, reducedMotion, mediaEvents, advance, wheel, go, bounds };
}

test('tiny trackpad input stays held, deliberate accumulated input advances one artwork', () => {
  const f = fixture(); f.go('harm');
  for (let i = 0; i < 10; i++) f.wheel(3);
  assert.equal(f.view.scrollY, 900);
  for (let i = 0; i < 24; i++) f.wheel(3);
  f.advance(1400);
  assert.equal(f.view.scrollY, 1800);
  assert.equal(f.controller.locked, 'exhaust');
  assert.equal(f.controller.isSectionTransitioning, false);
});

test('all artwork transitions and the reverse journey settle without snap-back', () => {
  const f = fixture();
  for (const [id, top] of [['harm',900],['exhaust',1800],['adapt',2700],['liven',3600],['heal',4500],['about',5400]]) {
    f.wheel(120); f.advance(1500);
    assert.equal(f.view.scrollY, top, id);
    assert.equal(f.controller.current().id, id);
  }
  for (const [id, top] of [['heal',4500],['liven',3600],['adapt',2700],['exhaust',1800],['harm',900],['landing',0]]) {
    f.wheel(-120); f.advance(1500);
    assert.equal(f.view.scrollY, top, id);
  }
});

test('a large wheel event cannot enqueue or skip several artworks', () => {
  const f = fixture(); f.go('harm'); f.wheel(8000);
  assert.equal(f.controller.animation.id, 'exhaust');
  for (let i=0;i<30;i++) f.wheel(4);
  f.advance(1000);
  assert.equal(f.view.scrollY, 1800);
});

test('long decaying momentum stays at the new stop; a new gesture releases', () => {
  const f = fixture(); f.go('harm'); f.wheel(500);
  for (let i=0;i<100;i++) f.wheel(Math.max(.2, 24 * .95 ** i));
  f.advance(1000);
  assert.equal(f.view.scrollY, 1800);
  f.wheel(120); f.advance(1500);
  assert.equal(f.view.scrollY, 2700);
});

test('a strong reverse gesture cancels a transition instead of queuing another', () => {
  const f = fixture(); f.go('harm'); f.controller.go('exhaust'); f.advance(220);
  f.wheel(-360); f.advance(1500);
  assert.equal(f.view.scrollY, 900);
  assert.equal(f.controller.isSectionTransitioning, false);
});

test('only one nav target owns animation and focus completion', () => {
  const f = fixture(); const completed = [];
  f.controller.go('adapt', { onComplete: () => completed.push('adapt') });
  f.advance(100);
  f.controller.go('liven', { onComplete: () => completed.push('liven') });
  f.advance(1500);
  assert.equal(f.view.scrollY, 3600);
  assert.deepEqual(completed, ['liven']);
});

test('touch is never prevented and only settles after release plus momentum', () => {
  const f = fixture(); f.go('harm');
  f.events.touchstart({ touches: [{}] });
  f.view.scrollTo({ top: 1540 }); f.advance(500);
  assert.equal(f.view.scrollY, 1540);
  assert.equal(f.controller.isSectionTransitioning, false);
  f.events.touchend({ touches: [] });
  for (let i=0;i<10;i++) { f.view.scrollBy({ top: 3 }); f.advance(40); }
  assert.equal(f.controller.isSectionTransitioning, false);
  f.advance(1400);
  assert.equal(f.view.scrollY, 1800);
});

test('a canvas-like pointer drag without scrolling never changes chapter', () => {
  const f = fixture(); f.go('adapt');
  f.events.pointerdown(); f.advance(500); f.events.pointerup(); f.advance(1200);
  assert.equal(f.view.scrollY, 2700);
  assert.equal(f.controller.current().id, 'adapt');
});

test('About content can scroll beyond its anchor without being pulled back', () => {
  const f = fixture(); f.go('about'); f.wheel(240); f.advance(1500);
  assert.equal(f.view.scrollY, 5640);
  f.wheel(450); f.advance(1500);
  assert.equal(f.view.scrollY, 6090);
});

test('reduced motion preserves holds and alignment without animation', () => {
  const f = fixture({ reduced: true }); f.go('harm'); f.wheel(120); f.advance(250);
  assert.equal(f.view.scrollY, 1800);
  assert.equal(f.controller.isSectionTransitioning, false);
  assert.equal(f.controller.animation, null);
});

test('viewport changes preserve the anchored chapter', () => {
  const f = fixture(); f.go('adapt');
  const bounds = f.bounds.map(b => ({ ...b, top: b.top * .6, bottom: b.bottom * .6 }));
  f.controller.measure(bounds, 540, 3780); f.advance(1000);
  assert.equal(f.view.scrollY, 1620);
  assert.equal(f.controller.current().id, 'adapt');
});

test('an unchanged layout measurement does not cut short an animation', () => {
  const f=fixture(); f.go('harm'); f.controller.go('exhaust'); f.advance(150);
  f.controller.measure(f.bounds,900,6300);
  assert.equal(f.controller.isSectionTransitioning,true);
  assert.ok(f.view.scrollY<1800);
  f.advance(1000); assert.equal(f.view.scrollY,1800);
});

test('a viewport resize completes navigation at the new target and keeps its focus callback', () => {
  const f=fixture(); let finished=0;
  f.controller.go('adapt',{onComplete:()=>finished++}); f.advance(150);
  f.controller.measure(f.bounds.map(b=>({...b,top:b.top*.6,bottom:b.bottom*.6})),540,3780);
  f.advance(1000);
  assert.equal(f.view.scrollY,1620); assert.equal(finished,1);
});

test('keyboard relays support page, space, reverse space, and held arrows', () => {
  const f = fixture(); f.go('harm');
  for (const [key, shift, expected] of [['PageDown',false,1800],[' ',false,2700],[' ',true,1800],['PageUp',false,900]]) {
    f.controller.key(key,shift,true); f.advance(1500); assert.equal(f.view.scrollY,expected);
  }
  for (let i=0;i<16;i++) { f.controller.key('ArrowDown',false,true); f.advance(30); }
  f.advance(1500); assert.equal(f.view.scrollY,1800);
});

test('wheel normalizes line/page deltas and leaves forms and pinch zoom alone', () => {
  const f = fixture(); f.go('harm'); let prevented=0;
  const event = { target: { closest: () => null }, cancelable:true, deltaX:0, deltaY:2, deltaMode:1, preventDefault: () => prevented++ };
  f.events.wheel(event);
  assert.equal(prevented,1); assert.equal(f.view.scrollY,900);
  f.events.wheel({ ...event, ctrlKey:true });
  f.events.wheel({ ...event, target: { closest: () => ({}) } });
  f.events.wheel({ ...event, deltaX:200 });
  assert.equal(prevented,1);
  f.events.wheel({ ...event, deltaY:1, deltaMode:2 }); f.advance(1000);
  assert.equal(f.view.scrollY,1800);
});

test('wheel release starts moving without a raw delta jump or a delayed second start', () => {
  const f=fixture(); f.go('harm');
  f.controller.relayWheel(120);
  assert.equal(f.view.scrollY,900,'Input must not instantly displace the page by 120px');
  assert.equal(f.controller.isSectionTransitioning,true,'Release must not wait on an idle timer');
  const positions=[];
  for(let i=0;i<30;i++){ f.advance(i===0?16:34); positions.push(f.view.scrollY); }
  const steps=positions.map((y,i)=>y-(i?positions[i-1]:900));
  assert.ok(steps[0]>0 && steps[0]<12,'Acceleration begins with a small displacement');
  assert.ok(Math.max(...steps.slice(1,8))>steps[0]*2,'Motion gains momentum');
  assert.ok(steps.every(step=>step>=-1e-8),'The trajectory cannot bounce or reverse');
  assert.ok(Math.max(...steps)<160,'A 30 FPS transition has no large frame jump');
  assert.ok(steps.filter(step=>step>0&&step<2).length>=2,'The final approach has a gentle tail');
  assert.equal(positions.at(-1),1800);
});

test('a strong second input retimes motion without an instantaneous finish', () => {
  const f=fixture(); f.go('harm'); f.controller.go('exhaust'); f.advance(220);
  const before=f.view.scrollY;
  f.controller.relayWheel(500);
  assert.equal(f.view.scrollY,before);
  assert.equal(f.controller.targetSection,'exhaust');
  assert.equal(f.controller.isSectionTransitioning,true);
  f.advance(1000); assert.equal(f.view.scrollY,1800);
});

test('magnetic handoff carries the measured native scroll velocity', () => {
  const f=fixture(); f.go('harm');
  f.view.scrollTo({top:1000}); f.advance(16);
  f.view.scrollTo({top:1016}); f.advance(16);
  f.controller.go('exhaust');
  const animation=f.controller.animation;
  const initialSpeed=(animation.end-animation.start)/animation.duration*animation.tangent;
  assert.ok(Math.abs(initialSpeed-1)<.001);
  f.advance(1000); assert.equal(f.view.scrollY,1800);
});

test('short corrections take less time than full and multi-section transitions', () => {
  const f=fixture(); f.go('harm');
  f.controller.go('harm',{position:950}); const short=f.controller.animation.duration;
  f.go('harm'); f.controller.go('exhaust'); const normal=f.controller.animation.duration;
  f.go('harm'); f.controller.go('about'); const long=f.controller.animation.duration;
  assert.ok(short>=250 && short<=450);
  assert.ok(normal>=500 && normal<=800);
  assert.ok(long>=700 && long<=950);
  assert.ok(short<normal && normal<long);
});

test('catalogue chapters have one resting composition in both directions',()=>{
  const f=fixture({introductions:true});
  const stops=f.bounds.slice(1).filter(b=>b.id!=='about');
  for(const stop of stops){f.wheel(120);f.advance(1400);assert.equal(f.controller.locked,stop.id);assert.ok(Math.abs(f.view.scrollY-stop.top)<1);}
  for(const stop of f.bounds.slice(0,-2).reverse()){f.wheel(-120);f.advance(1400);assert.equal(f.controller.locked,stop.id);}
});
test('large wheel and momentum cannot skip the adjacent catalogue chapter',()=>{
  const f=fixture({introductions:true});f.go('harm');f.wheel(8000);
  for(let i=0;i<80;i++)f.wheel(Math.max(.2,20*.94**i));
  f.advance(1200);assert.equal(f.controller.locked,'exhaust');
  f.wheel(120);f.advance(1400);assert.equal(f.controller.locked,'adapt');
});
test('reduced motion moves between complete chapters without opening artworks',()=>{
  const f=fixture({introductions:true,reduced:true});f.go('adapt');
  f.wheel(120);f.advance(500);assert.equal(f.controller.locked,'liven');
  f.wheel(120);f.advance(500);assert.equal(f.controller.locked,'heal');
});


test('an installation suspends pending settling, wheel and keyboard movement until closed',()=>{
  const f=fixture();f.go('harm');f.controller.go('exhaust');f.advance(80);
  f.controller.setSuspended(true);const y=f.view.scrollY;
  f.controller.relayWheel(900);f.controller.key('PageDown',false,true);
  f.events.pointerup();f.controller.queueSettle();f.advance(2500);
  assert.equal(f.view.scrollY,y);assert.equal(f.controller.animation,null);
  f.controller.setSuspended(false);f.controller.go('exhaust');f.advance(1500);
  assert.equal(f.view.scrollY,1800);
});

test('a tall catalogue chapter preserves its readable range before releasing onward',()=>{
  const f=fixture({introductions:true});
  const bounds=f.bounds.map(b=>b.id==='harm'?{...b,bottom:b.bottom+300}:b.top>900?{...b,top:b.top+300,bottom:b.bottom+300}:b);
  f.controller.measure(bounds,900,6600);f.go('harm');
  assert.equal(f.controller.end(f.controller.at('harm')),1200);
  f.controller.key('ArrowDown',false,true);f.advance(1500);
  assert.equal(f.view.scrollY,940);
});



