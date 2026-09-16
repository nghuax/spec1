const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('code/artworks/exhibition-bridge.js', 'utf8');

function fixture(stage = 'liven') {
  const messages = [];
  const events = {};
  const keys = {};
  const calls = { loop: 0, stop: 0, reset: 0, drops: 0 };
  const parent = { postMessage: data => messages.push(data) };
  const pieces = ['solar', 'water', 'turbine'].map(kind => ({ kind, placed: false }));
  const slots = ['solar', 'water', 'turbine'].map((kind, i) => ({ kind, x: i, y: i }));
  const context = vm.createContext({
    URLSearchParams, console, innerHeight: 900,
    location: { pathname: `/repo/artworks/${stage}/index.html`, search: '?exhibition=heal', origin: 'http://localhost' },
    parent, frameCount: 1, soundMuted: false, soundPanelOpen: false,
    dragging: null, renewablePieces: pieces, renewableSlots: slots, trashSlots: [],
    burnCount: 0, MACHINE_SOUND_COMPLETE_BURNS: 20, dragState: null,
    HarmSound: { stopAll() {} },
    environmentDestructionClicks: 0, projectMuted: true,
    fossilEnergyButton: { elt: { addEventListener() {} } },
    informationButton: { elt: { addEventListener() {} } },
    stopActiveProjectSounds() {},
    launchFossilParticles: () => { context.environmentDestructionClicks=Math.min(21,context.environmentDestructionClicks+1); },
    regenerateArtwork: () => { calls.reset++;context.environmentDestructionClicks=0; },
    resetScene: () => { calls.reset++;context.burnCount=0; },
    document: {
      body: { dataset: {} }, querySelector: selector => selector === 'canvas' ? {} : null,
      getElementById: () => null, addEventListener: (name, fn) => { keys[name] = fn; }
    },
    window: { addEventListener: (name, fn) => { events[name] = fn; }, livenUI: { sync() {} } },
    noLoop: () => calls.stop++, loop: () => calls.loop++, frameRate: value=>calls.fps=value, stopAllSounds() {},
    toggleSoundMute: () => { context.soundMuted = !context.soundMuted; },
    earthIsRestored: () => pieces.every(piece => piece.placed),
    renewableCount: () => pieces.filter(piece => piece.placed).length,
    earthDisplayPoint: (x, y) => ({ x, y }), returnPieceToOrbit() {},
    tryRenewableDrop: piece => { calls.drops++; piece.placed = true; },
    regenerateScene: () => { calls.reset++; pieces.forEach(piece => { piece.placed = false; }); },
    setInterval: () => 1, setTimeout: () => 2, clearInterval() {}, clearTimeout() {},
  });
  vm.runInContext(source, context);
  function send(data, override = {}) {
    events.message({ origin: 'http://localhost', source: parent, data: { type: 'heal:command', ...data }, ...override });
  }
  return { context, calls, send, messages, events, keys };
}

test('a prefetched artwork starts stopped and ignores foreign or unrelated messages', () => {
  const f = fixture();
  assert.equal(f.context.document.body.dataset.healActive, 'false');
  assert.equal(f.calls.loop, 0);
  for (const override of [{ origin: 'https://foreign.example' }, { source: {} }, { data: { type: 'other', action: 'activity', active: true } }]) {
    f.send({ action: 'activity', active: true }, override);
  }
  assert.equal(f.calls.loop, 0);
  f.send({ action: 'reset' });
  assert.equal(f.calls.reset, 0, 'An inactive sketch must not accept gameplay commands');
});

test('leaving a chapter preserves its puzzle state and restores the chosen sound preference', () => {
  const f = fixture();
  f.send({ action: 'activity', active: true });
  f.send({ action: 'mute', muted: false });
  f.send({ action: 'place', piece: 'solar', slot: 'solar' });
  f.send({ action: 'activity', active: false });
  assert.equal(f.context.soundMuted, true);
  assert.equal(f.context.renewablePieces[0].placed, true);
  f.send({ action: 'activity', active: true });
  assert.equal(f.context.soundMuted, false);
  assert.equal(f.context.renewablePieces[0].placed, true);
  assert.equal(f.calls.reset, 0);
});

test('accessible placement rejects mismatched slots before calling the original drop handler', () => {
  const f = fixture();
  f.send({ action: 'activity', active: true });
  f.send({ action: 'place', piece: 'solar', slot: 'water' });
  assert.equal(f.calls.drops, 0);
  assert.equal(f.messages.at(-1).completed, false);
  assert.match(f.messages.at(-1).status, /matching slot/);
});

test('completion follows all three original placements and reset clears it', () => {
  const f = fixture();
  f.send({ action: 'activity', active: true });
  for (const piece of ['solar', 'water', 'turbine']) f.send({ action: 'place', piece, slot: piece });
  assert.equal(f.calls.drops, 3);
  assert.equal(f.messages.at(-1).completed, true);
  f.send({ action: 'reset' });
  assert.equal(f.messages.at(-1).completed, false);
  assert.equal(f.calls.reset, 1);
});

test('preview wheel relays leave form controls alone', () => {
  const f = fixture();
  f.send({ action: 'activity', active: true, mode:'preview' });
  let prevented = 0;
  const event = { ctrlKey: false, deltaY: 3, deltaMode: 1, target: { closest: () => null }, preventDefault: () => prevented++ };
  f.events.wheel(event);
  assert.equal(f.messages.at(-1).type, 'heal:wheel');
  assert.equal(f.messages.at(-1).deltaY, 48);
  const count = f.messages.length;
  f.events.wheel({ ...event, target: { closest: () => ({}) } });
  assert.equal(f.messages.length, count);
  assert.equal(prevented, 1);
});

test('iframe navigation keys relay while controls, horizontal wheels and pinch zoom stay local', () => {
  const f=fixture(); f.send({action:'activity',active:true,mode:'preview'});
  let prevented=0;
  const event={key:'PageDown',target:{closest:()=>null},preventDefault:()=>prevented++};
  f.keys.keydown(event);
  assert.equal(f.messages.at(-1).type,'heal:key');
  assert.equal(f.messages.at(-1).key,'PageDown');
  const count=f.messages.length;
  f.keys.keydown({...event,target:{closest:()=>({})}});
  f.events.wheel({...event,deltaX:100,deltaY:3});
  f.events.wheel({...event,ctrlKey:true,deltaY:3});
  assert.equal(f.messages.length,count);
  assert.equal(prevented,1);
  f.events.wheel({...event,deltaX:0,deltaY:1,deltaMode:2});
  assert.equal(f.messages.at(-1).deltaY,900);
});

test('HARM ends at the source full-machine threshold and resets only that artwork', () => {
  const f=fixture('harm');
  f.context.burnCount=19;
  f.send({action:'activity',active:true});
  assert.equal(f.messages.at(-1).completed,false);
  f.context.burnCount=20;
  f.send({action:'activity',active:true});
  assert.equal(f.messages.at(-1).completed,true);
  f.send({action:'activity',active:false});
  assert.equal(f.messages.at(-1).completed,true,'Leaving must preserve the ending');
  f.send({action:'activity',active:true});
  f.send({action:'reset'});
  assert.equal(f.context.burnCount,0);
  assert.equal(f.messages.at(-1).completed,false);
  assert.equal(f.calls.reset,1);
});

test('EXHAUST requires all 21 original pollution actions, then resets its counter', () => {
  const f=fixture('exhaust');
  f.send({action:'activity',active:true});
  for(let i=0;i<20;i++)f.send({action:'pollute'});
  assert.equal(f.messages.at(-1).completed,false);
  f.send({action:'pollute'});
  assert.equal(f.messages.at(-1).completed,true);
  f.send({action:'reset'});
  assert.equal(f.context.environmentDestructionClicks,0);
  assert.equal(f.messages.at(-1).completed,false);
  assert.equal(f.calls.reset,1);
});

test('a deliberate interaction can resume a paused visible artwork', () => {
  const f=fixture();
  f.keys.pointerdown();
  assert.equal(f.messages.at(-1).type,'heal:interact');
  assert.equal(f.calls.loop,0,'Only the parent can authorize resuming');
  f.send({action:'activity',active:true});
  const count=f.messages.length;
  f.keys.pointerdown();
  assert.equal(f.messages.length,count);
});


test('preview animation is throttled, muted and cannot accept primary gameplay',()=>{
  const f=fixture();f.send({action:'activity',active:true,mode:'full'});f.send({action:'mute',muted:false});
  f.send({action:'activity',active:true,mode:'preview'});
  assert.equal(f.calls.fps,24);assert.equal(f.context.soundMuted,true);
  f.send({action:'place',piece:'solar',slot:'solar'});assert.equal(f.calls.drops,0);
  f.send({action:'activity',active:true,mode:'full'});
  assert.equal(f.calls.fps,30);assert.equal(f.context.soundMuted,false);
  f.send({action:'place',piece:'solar',slot:'solar'});assert.equal(f.calls.drops,1);
  f.send({action:'activity',active:false,mode:'off'});assert.equal(f.context.document.body.dataset.healActive,'false');
});

test('fullscreen wheel stays with the installation rather than moving the catalogue',()=>{
  const f=fixture();f.send({action:'activity',active:true,mode:'full'});const count=f.messages.length;
  let prevented=false;f.events.wheel({deltaX:0,deltaY:120,deltaMode:0,target:{closest:()=>null},preventDefault(){prevented=true;}});
  assert.equal(f.messages.length,count);assert.equal(prevented,false);
});
