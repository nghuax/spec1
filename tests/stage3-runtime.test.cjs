const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const sketchPath = path.join(__dirname, '../code/artworks/adapt/sketch.js');
const sketch = readFileSync(sketchPath, 'utf8');

// Exercise student runtime logic without emulating the canvas or audio output.
// Numeric helpers match the p5 operations used by generation and animation.
function runtime() {
  let seed = 73;
  const events = [];
  const context = vm.createContext({
    console, URLSearchParams, HEALMaster: { bus: context => context.destination },
    width: 1920, height: 1080,
    PI: Math.PI, TWO_PI: Math.PI * 2,
    min: Math.min, max: Math.max, round: Math.round, floor: Math.floor,
    abs: Math.abs, sqrt: Math.sqrt, pow: Math.pow, exp: Math.exp,
    sin: Math.sin, cos: Math.cos, atan2: Math.atan2,
    constrain: (value, low, high) => Math.min(high, Math.max(low, value)),
    lerp: (start, end, amount) => start + (end - start) * amount,
    map: (value, a, b, c, d) => c + (value - a) / (b - a) * (d - c),
    dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
    noise: () => 0.5,
    random: (low, high) => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const value = seed / 4294967296;
      if (Array.isArray(low)) return low[Math.floor(value * low.length)];
      if (low === undefined) return value;
      return high === undefined ? value * low : low + value * (high - low);
    },
    performance: { now: () => 1000 },
    document: { body: { dataset: {} } },
    window: {
      matchMedia: () => ({ matches: false }),
      location: { search: '' },
      dispatchEvent: (event) => { events.push(event); }
    },
    CustomEvent: class {
      constructor(type, options) { this.type = type; this.detail = options.detail; }
    }
  });
  vm.runInContext(sketch, context, { filename: sketchPath });
  // Sound rendering is covered by browser QA; preserve the real state logic.
  vm.runInContext(`
    playSelectSound = () => {};
    playEnergySound = () => {};
    playAssemblySound = () => {};
    playCompletionSound = () => {};
  `, context);
  return {
    run: (code) => vm.runInContext(code, context),
    state: (code) => JSON.parse(vm.runInContext(`JSON.stringify(${code})`, context)),
    events
  };
}

test('one energy source gives visible preparation; both are needed for full charge', () => {
  const app = runtime();
  assert.equal(app.run('moduleCharge({sun: 0, wind: 0})'), 0);
  assert.equal(app.run('moduleCharge({sun: 1, wind: 0})'), 0.3);
  assert.equal(app.run('moduleCharge({sun: 0, wind: 1})'), 0.3);
  assert.equal(app.run('moduleCharge({sun: 1, wind: 1})'), 1);
  assert.ok(app.run('moduleCharge({sun: 0.6, wind: 0.6})') > 0.3);
});

test('sound can be muted before the first gesture and remains muted after reset', async () => {
  const app = runtime();
  app.run('toggleSound()');
  assert.equal(app.run('audioMuted'), true);
  await app.run('ensureAudioEnabled(true)');
  assert.equal(app.run('audioContext'), null);
  app.run('regenerate()');
  assert.equal(app.run('audioMuted'), true);
  const progress = app.events.filter((event) => event.type === 'adapt:progress').at(-1);
  assert.equal(progress.detail.sound, false);
});

test('the generated network connects each receiving habitat to renewable sources', () => {
  const app = runtime();
  app.run(`modules = [
    {id: 0, kind: 'solar', homeX: 0, homeY: 0},
    {id: 1, kind: 'wind', homeX: 100, homeY: 0},
    {id: 2, kind: 'community', homeX: 20, homeY: 20},
    {id: 3, kind: 'forest', homeX: 80, homeY: 20},
    {id: 4, kind: 'water', homeX: 40, homeY: 50}
  ]; buildEnergyNetwork();`);
  const links = app.state('energyLinks');
  assert.deepEqual(links.map((link) => link.target.id).sort(), [2, 3, 4]);
  assert.deepEqual([...new Set(links.map((link) => link.source.kind))].sort(), ['solar', 'wind']);
  assert.ok(links.every((link) => Number.isFinite(link.phase)));
  assert.equal(app.run('modules.length'), 5);
});

test('network generation handles a missing source family and a source-free field', () => {
  const app = runtime();
  app.run(`modules = [
    {id: 0, kind: 'wind', homeX: 0, homeY: 0},
    {id: 1, kind: 'community', homeX: 50, homeY: 30},
    {id: 2, kind: 'forest', homeX: 20, homeY: 10}
  ]; buildEnergyNetwork();`);
  assert.equal(app.run('energyLinks.length'), 2);
  assert.equal(app.run('energyLinks.every((link) => link.source.kind === "wind")'), true);
  app.run('modules = modules.filter((habitat) => habitat.kind !== "wind"); buildEnergyNetwork();');
  assert.equal(app.run('energyLinks.length'), 0);
});

test('particle updates advance live effects and remove expired effects', () => {
  const app = runtime();
  app.run(`
    sunBursts = [{life: 1, r: 10}, {life: 0.001, r: 10}];
    windLines = [{life: 1, x: 0, y: 0, dx: 1, dy: 1}, {life: 0.001, x: 0, y: 0, dx: 1, dy: 1}];
    pollen = [{life: 1, x: 0, y: 0, vx: 0, vy: 0}, {life: 0.001, x: 0, y: 0, vx: 0, vy: 0}];
    updateParticles(1 / 60);
  `);
  const { sunBursts, windLines, pollen } = app.state('({sunBursts, windLines, pollen})');
  assert.equal(sunBursts.length, 1);
  assert.equal(windLines.length, 1);
  assert.equal(pollen.length, 1);
  assert.ok(sunBursts[0].r > 10 && sunBursts[0].life < 1);
  assert.ok(windLines[0].x > 0 && windLines[0].y > 0 && windLines[0].life < 1);
  assert.ok(Math.hypot(pollen[0].x, pollen[0].y) > 0 && pollen[0].life < 1);
});

test('guided regeneration supplies sunlight before wind and stops on manual takeover', () => {
  const app = runtime();
  app.run(`modules = [{sun: 0, wind: 0}, {sun: 0, wind: 0}]; experienceMode = 'guided'; updateGuidedSequence(6 / PROGRESSION_PACE);`);
  assert.equal(app.run('modules.every((habitat) => habitat.sun > 0 && habitat.wind === 0)'), true);
  app.run('updateGuidedSequence(6 / PROGRESSION_PACE);');
  assert.equal(app.run('modules.every((habitat) => habitat.sun === 1 && habitat.wind > 0)'), true);
  const before = app.state('modules');
  app.run('experienceMode = "manual"; updateGuidedSequence(4 / PROGRESSION_PACE);');
  assert.deepEqual(app.state('modules'), before);
  app.run('experienceMode = "guided"; updateGuidedSequence(4 / PROGRESSION_PACE);');
  assert.equal(app.run('modules.every((habitat) => habitat.sun === 1 && habitat.wind === 1)'), true);
});

test('a generated field completes the guided transformation once within thirty seconds', () => {
  const app = runtime();
  app.run(`
    regenerate(); experienceMode = 'guided';
    for (let frame = 0; frame < 30 * 60; frame++) {
      updateGuidedSequence(1 / 60);
      updateModules(1 / 60);
      updateParticles(1 / 60);
    }
  `);
  const result = app.state('({globalRecovery, finalTriggered, stateTwoAnnounced})');
  assert.deepEqual(result, { globalRecovery: 1, finalTriggered: true, stateTwoAnnounced: true });
  assert.equal(app.events.filter((event) => event.type === 'adapt:statechange' && event.detail.state === 2).length, 1);
  assert.equal(app.run('modules.every((habitat) => habitat.sun === 1 && habitat.wind === 1 && habitat.visualRecovery === 1)'), true);
});

test('reset clears completion and playback state while preserving the sound preference', () => {
  const app = runtime();
  app.run(`
    audioMuted = true; paused = true; experienceMode = 'guided'; guidedTime = 25;
    globalRecovery = 1; finalTriggered = true; stateTwoAnnounced = true;
    sunBursts = [{life: 1}]; windLines = [{life: 1}]; pollen = [{life: 1}];
    regenerate();
  `);
  assert.deepEqual(app.state('({audioMuted, paused, experienceMode, guidedTime, globalRecovery, finalTriggered, stateTwoAnnounced})'), {
    audioMuted: true, paused: false, experienceMode: 'manual', guidedTime: 0,
    globalRecovery: 0, finalTriggered: false, stateTwoAnnounced: false
  });
  assert.equal(app.run('sunBursts.length + windLines.length + pollen.length'), 0);
  assert.equal(app.run('modules.every((habitat) => habitat.sun === 0 && habitat.wind === 0)'), true);
  assert.ok(app.run('Number(document.body.dataset.assetCount) >= 8 && Number(document.body.dataset.assetCount) <= 10'));
  assert.ok(app.run('modules.length >= 11 && modules.length <= 13'));
  assert.ok(app.run('energyLinks.length > 0'));
});


test('habitats cross former UI boundaries without sudden position jumps', () => {
  const app = runtime();
  app.run(`
    regenerate();
    flowAt = () => ({x: 0, y: 0});
    modules = [
      Object.assign(makeModule(0, 'solar', 688.17, 488.93, 1.22), {
        sharedLand: true, x: 700.02, y: 513.55, vx: 0, vy: 0
      }),
      Object.assign(makeModule(1, 'wind', 1321, 350, 1), {
        x: 1321, y: 359.9, vx: 0, vy: 0
      })
    ];
  `);
  let largestStep = 0;
  for (let frame = 0; frame < 180; frame++) {
    const before = app.state('modules.map(({x, y}) => ({x, y}))');
    app.run('updateModules(1 / 60)');
    const after = app.state('modules.map(({x, y}) => ({x, y}))');
    after.forEach((point, i) => {
      largestStep = Math.max(largestStep, Math.hypot(point.x - before[i].x, point.y - before[i].y));
    });
  }
  assert.ok(largestStep < 1, `Unexpected position jump: ${largestStep.toFixed(2)} pixels`);
  assert.ok(app.run('Math.hypot(modules[0].x - modules[0].homeX, modules[0].y - modules[0].homeY) < 4'));
});


test('sound mix clamps levels and survives regeneration without overriding mute', () => {
  const app = runtime();
  app.run("setSoundMixLevel('windPaper', 0); setSoundMixLevel('solarEnergy', 125); setSoundMixLevel('confirmation', NaN); toggleSound(); regenerate();");
  assert.equal(app.run('soundMixLevels.windPaper'), 0);
  assert.equal(app.run('soundMixLevels.solarEnergy'), 100);
  assert.equal(app.run('soundMixLevels.confirmation'), 60);
  app.run('resetSoundMix()');
  assert.equal(app.run('soundMixLevels.windPaper'), 60);
  assert.equal(app.run('soundMixLevels.solarEnergy'), 60);
  assert.equal(app.run('audioMuted'), true);
});

test('sample envelopes route through live per-sound gains before the master', () => {
  const app = runtime();
  app.run(`
    let createdSource;
    createAudioGraph(class {
      currentTime = 0;
      destination = {};
      createGain() {
        return { connections: [], gain: {
          value: 0,
          setValueAtTime(value) { this.value = value; },
          linearRampToValueAtTime(value) { this.value = value; },
          setTargetAtTime(value) { this.value = value; }
        }, connect(node) { this.connections.push(node); }, disconnect() {} };
      }
      createBufferSource() {
        createdSource = { playbackRate: {}, connect(node) { this.output = node; }, start() {}, addEventListener() {} };
        return createdSource;
      }
    });
    audioEnabled = true;
    audioBuffers.set('windPaper', { duration: 1 });
    playSample('windPaper', { gain: 0.3 });
  `);
  assert.equal(app.run("createdSource.output.connections[0] === audioChannelGains.get('windPaper')"), true);
  assert.equal(app.run("audioChannelGains.get('windPaper').connections[0] === audioMaster"), true);
  app.run("setSoundMixLevel('windPaper', 0)");
  assert.equal(app.run("audioChannelGains.get('windPaper').gain.value"), 0);
  assert.equal(app.run("audioChannelGains.get('solarEnergy').gain.value"), 1);
  app.run('resetSoundMix()');
  assert.equal(app.run("audioChannelGains.get('windPaper').gain.value"), 1);
});


test('portrait touch coordinates reach the habitat and dragging ends cleanly', () => {
  const app = runtime();
  app.run(`
    regenerate();
    document.body.classList = { contains: () => false };
    const phoneCanvas = { tagName: 'CANVAS', getBoundingClientRect: () => ({ left: 0, top: 194, width: 320, height: 180, right: 320, bottom: 374 }) };
    document.querySelector = () => phoneCanvas;
    document.elementFromPoint = () => null;
    ensureAudioEnabled = async () => {};
    const habitat = modules[0];
    const touch = { clientX: habitat.x / 6, clientY: 194 + habitat.y / 6 };
    touchStarted({ target: phoneCanvas, touches: [touch] });
    touchMoved({ target: phoneCanvas, touches: [{ clientX: touch.clientX + 4, clientY: touch.clientY + 2 }] });
  `);
  assert.ok(app.run('modules[0].sun') > 0);
  assert.equal(app.run('dragging'), true);
  app.run('touchEnded({ changedTouches: [touch] })');
  assert.equal(app.run('dragging'), false);
  assert.equal(app.run('experienceMode'), 'manual');
});
