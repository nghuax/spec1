const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const artworkDirectory = path.join(__dirname, '../code/artworks/adapt');
const families = [
  'habitatIsland', 'basicHouse', 'solarHouse', 'solarArray', 'windTurbine',
  'tree', 'treeCluster', 'wildlife', 'landmark', 'pollutionCluster'
];

// Record actual p5 drawing calls. This checks shape budgets and renderer state
// without treating screenshots or a second copy of the drawing code as truth.
function environmentRuntime({ scene = false } = {}) {
  const commands = [];
  const shapes = [];
  let stackDepth = 0;
  let polygon = null;
  let seed = 73;
  const copy = (value) => JSON.parse(JSON.stringify(value));
  const numeric = (values) => {
    for (const value of values.flat(Infinity)) {
      if (typeof value === 'number') assert.ok(Number.isFinite(value), 'Drawing coordinates must be finite');
    }
  };
  const record = (name, values) => {
    numeric(values);
    commands.push([name, copy(values)]);
  };
  const primitive = (name) => (...values) => {
    record(name, values);
    shapes.push([name, copy(values)]);
  };
  const drawing = Object.fromEntries([
    'translate', 'rotate', 'scale', 'rectMode', 'colorMode', 'angleMode',
    'noStroke', 'fill', 'stroke', 'strokeWeight', 'noFill'
  ].map((name) => [name, (...values) => record(name, values)]));
  const seededRandom = (low, high) => {
    assert.ok(scene, 'Environmental assets must not generate random primary geometry');
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const value = seed / 4294967296;
    if (Array.isArray(low)) return low[Math.floor(value * low.length)];
    if (low === undefined) return value;
    return high === undefined ? value * low : low + value * (high - low);
  };
  const guardedMath = Object.create(Math);
  guardedMath.random = () => {
    assert.fail('Environmental assets must not call Math.random');
  };
  const makeColor = (value) => ({
    value, alpha: 255,
    setAlpha(alpha) { numeric([alpha]); this.alpha = alpha; }
  });
  const context = vm.createContext({
    console, URLSearchParams, Math: guardedMath,
    width: 1920, height: 1080,
    PI: Math.PI, TWO_PI: Math.PI * 2,
    CORNER: 'corner', CENTER: 'center', CLOSE: 'close', RGB: 'rgb', RADIANS: 'radians',
    min: Math.min, max: Math.max, round: Math.round, floor: Math.floor, ceil: Math.ceil,
    abs: Math.abs, sqrt: Math.sqrt, pow: Math.pow, exp: Math.exp,
    sin: Math.sin, cos: Math.cos, atan2: Math.atan2,
    constrain: (value, low, high) => Math.min(high, Math.max(low, value)),
    lerp: (start, end, amount) => start + (end - start) * amount,
    map: (value, a, b, c, d) => c + (value - a) / (b - a) * (d - c),
    dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
    noise: () => 0.5,
    random: seededRandom,
    color: (value) => makeColor(copy(value)),
    lerpColor: (from, to, amount) => makeColor({ from: copy(from), to: copy(to), amount }),
    ...drawing,
    push() { stackDepth++; record('push', []); },
    pop() {
      assert.ok(stackDepth > 0, 'Renderer must not pop its caller\'s drawing state');
      stackDepth--;
      record('pop', []);
    },
    beginShape() {
      assert.equal(polygon, null, 'Previous polygon must be closed');
      polygon = [];
      record('beginShape', []);
    },
    vertex(...values) {
      assert.notEqual(polygon, null, 'vertex must belong to a polygon');
      numeric(values);
      polygon.push(values);
      record('vertex', values);
    },
    endShape(mode) {
      assert.ok(polygon?.length >= 3, 'A filled polygon needs at least three vertices');
      assert.equal(mode, 'close', 'Environmental polygons must have a closed silhouette');
      shapes.push(['polygon', copy(polygon)]);
      polygon = null;
      record('endShape', [mode]);
    },
    rect: primitive('rect'), triangle: primitive('triangle'), quad: primitive('quad'),
    circle: primitive('circle'), ellipse: primitive('ellipse'), line: primitive('line'),
    performance: { now: () => 1000 },
    document: { body: { dataset: {} } },
    window: {
      matchMedia: () => ({ matches: false }),
      location: { search: '' },
      dispatchEvent() {}
    },
    CustomEvent: class {
      constructor(type, options) { this.type = type; this.detail = options.detail; }
    }
  });
  const run = (code) => vm.runInContext(code, context);
  const assetFile = path.join(artworkDirectory, 'environment-assets.js');
  vm.runInContext(readFileSync(assetFile, 'utf8'), context, { filename: assetFile });
  if (scene) {
    vm.runInContext(readFileSync(path.join(artworkDirectory, 'composition.js'), 'utf8'), context);
    const sketchFile = path.join(artworkDirectory, 'sketch.js');
    vm.runInContext(readFileSync(sketchFile, 'utf8'), context, { filename: sketchFile });
    run('playSelectSound = playEnergySound = playAssemblySound = playCompletionSound = () => {};');
  }
  return {
    run,
    state: (code) => copy(run(code)),
    draw(family, options = {}) {
      commands.length = shapes.length = 0;
      run(`ADAPT_ASSETS[${JSON.stringify(family)}](${JSON.stringify(options)});`);
      assert.equal(stackDepth, 0, `${family} must restore the caller's p5 drawing state`);
      assert.equal(polygon, null, `${family} must finish every polygon`);
      return { commands: copy(commands), shapes: copy(shapes) };
    }
  };
}

test('the scene loads one shared pack with exactly ten families and ten palette tokens', () => {
  const app = environmentRuntime();
  assert.deepEqual(app.state('Object.keys(ADAPT_ASSETS)').sort(), [...families].sort());
  assert.equal(app.run('Object.values(ADAPT_ASSETS).every((asset) => typeof asset === "function")'), true);
  const palette = app.state('Object.values(ADAPT_COLORS)');
  assert.equal(palette.length, 10);
  assert.equal(new Set(palette).size, 10);
  assert.ok(palette.every((value) => /^#[0-9a-f]{6}$/i.test(value)));

  const html = readFileSync(path.join(artworkDirectory, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)/g)].map((match) => match[1].split('?')[0]);
  assert.ok(scripts.indexOf('environment-assets.js') >= 0, 'Standalone scene must load the asset pack');
  assert.ok(scripts.indexOf('environment-assets.js') < scripts.indexOf('sketch.js'), 'Assets must load before the scene');
});

test('every asset stays within its shape budget at all recovery states and practical scales', () => {
  const app = environmentRuntime();
  for (const family of families) {
    for (const recovery of [0, 0.5, 1]) {
      for (const scale of [0.6, 1, 1.8]) {
        for (const variant of [0, 1, 2]) {
          const result = app.draw(family, { recovery, scale, variant, x: 130, y: 90, rotation: 0.15 });
          const budget = family === 'pollutionCluster' ? 7 : family === 'wildlife' ? 8 : 12;
          assert.ok(result.shapes.length <= budget, `${family} at ${recovery}: ${result.shapes.length} shapes exceeds ${budget}`);
          if (family !== 'wildlife' && family !== 'pollutionCluster') {
            assert.ok(result.shapes.length > 0, `${family} must remain visible throughout restoration`);
          }
        }
      }
    }
  }
});

test('asset geometry is deterministic and both explicit states use the same renderer', () => {
  const app = environmentRuntime();
  for (const family of families) {
    for (const state of ['polluted', 'recovered']) {
      const options = { state, x: 40, y: 70, scale: 0.75, rotation: -0.12, variant: 1 };
      const first = app.draw(family, options);
      const repeated = app.draw(family, options);
      assert.deepEqual(repeated, first, `${family} ${state} changed without parameter changes`);
      const numericState = app.draw(family, { ...options, recovery: state === 'recovered' ? 1 : 0 });
      assert.deepEqual(numericState, first, `${family} state and recovery endpoints disagree`);
    }
  }
});

test('UPDATES solar panels respond to energy before full restoration', () => {
  const app = environmentRuntime();
  for (const family of ['solarHouse', 'solarArray']) {
    const dormant = app.draw(family, { recovery: 0.2, energy: 0 });
    const powered = app.draw(family, { recovery: 0.2, energy: 1 });
    assert.deepEqual(powered.shapes, dormant.shapes, 'Power must not move placement geometry');
    assert.notDeepEqual(powered.commands, dormant.commands, `${family} must show activation`);
  }
});

test('UPDATES rotor rotation leaves support geometry stationary', () => {
  const app = environmentRuntime();
  for (const [family, motion] of [['windTurbine', {angle: 1.2}]]) {
    const still = app.draw(family, {recovery: 1});
    const moving = app.draw(family, {recovery: 1, ...motion});
    assert.deepEqual(still.shapes, moving.shapes);
    assert.notDeepEqual(still.commands, moving.commands);
    const supportIndex = still.commands.findIndex(([name]) => name === 'beginShape' || name === 'triangle');
    assert.deepEqual(still.commands.slice(0, supportIndex + 1), moving.commands.slice(0, supportIndex + 1));
  }
});

test('wildlife returns only after recovery and the controlled pollution cluster disappears', () => {
  const app = environmentRuntime();
  for (const recovery of [0, 0.5, 0.65]) {
    assert.equal(app.draw('wildlife', { recovery }).shapes.length, 0);
  }
  assert.ok(app.draw('wildlife', { recovery: 1 }).shapes.length > 0);
  for (const variant of [0, 1, 2]) {
    const polluted = app.draw('pollutionCluster', { recovery: 0, variant });
    assert.ok(polluted.shapes.length >= 3 && polluted.shapes.length <= 7);
    assert.equal(app.draw('pollutionCluster', { recovery: 1, variant }).shapes.length, 0);
  }
});

test('reset varies the composition while explicit seeds reproduce the same layout', () => {
  const app = environmentRuntime({ scene: true });
  const layout = `modules.map(({id, kind, homeX, homeY, s, sharedLand}) => ({id, kind, homeX, homeY, s, sharedLand}))`;
  app.run('regenerate(307);');
  const first = app.state(layout);
  assert.equal(first.length, 12);
  assert.equal(app.run('Number(document.body.dataset.assetCount)'), 9);
  app.run('for (let i = 0; i < 31; i++) random(); regenerate();');
  assert.notDeepEqual(app.state(layout), first);
  const second = app.state(layout);
  app.run('regenerate();');
  assert.notDeepEqual(app.state(layout), second);
  app.run('regenerate(307);');
  assert.deepEqual(app.state(layout), first);
  assert.equal(app.run('modules.every((habitat) => habitat.sun === 0 && habitat.wind === 0)'), true);
});

test('all floating layers randomize on reset and keep their anchors through recovery', () => {
  const app = environmentRuntime({ scene: true });
  const snapshot = '({texture: floatingTextureLayout, edges: floatingEdgeLayout, scraps: modules.map(m => m.scraps)})';
  app.run('regenerate(307);');
  const first = app.state(snapshot);
  app.run('globalRecovery = 1; modules.forEach(m => {m.visualRecovery = 1;});');
  assert.deepEqual(app.state(snapshot), first);
  app.run('regenerate();');
  const next = app.state(snapshot);
  for (const layer of ['texture', 'edges', 'scraps']) assert.notDeepEqual(next[layer], first[layer]);
  app.run('regenerate(307);');
  assert.deepEqual(app.state(snapshot), first);
});

test('perimeter texture has controlled density and varied deterministic sizes', () => {
  const app = environmentRuntime({ scene: true });
  app.run('regenerate(307);');
  const edge = app.state('floatingEdgeLayout');
  const texture = app.state('floatingTextureLayout');
  assert.equal(edge.length, 28);
  assert.ok(new Set(edge.map(([, , size]) => Math.round(size))).size >= 8);
  assert.ok(Math.min(...edge.map(([, , size]) => size)) >= 24);
  assert.ok(Math.max(...edge.map(([, , size]) => size)) <= 148);
  assert.ok(new Set(texture.map(([, , size]) => Math.round(size))).size >= 12);
  assert.ok(Math.min(...texture.map(([, , size]) => size)) >= 8);
  assert.ok(Math.max(...texture.map(([, , size]) => size)) <= 64);
});

test('ambient offsets stay bounded and idle animation does not move layout coordinates', () => {
  const app = environmentRuntime({ scene: true });
  app.run('regenerate(307);');
  const before = app.state('modules.map(m => [m.x,m.y,m.homeX,m.homeY])');
  app.run(`
    for(let frame=0;frame<3600;frame++) {tm += 1/60; updateModules(1/60);}
  `);
  assert.deepEqual(app.state('modules.map(m => [m.x,m.y,m.homeX,m.homeY])'), before);
  const extrema = app.state(`(() => {
    const out={}; const bounds={x:0,y:0,r:0};
    for(let t=0;t<60;t+=0.1) {
      getFloatOffset(t, 1.7, 4, 6, 7, 0.017, 1, out);
      for(const k of ['x','y','r']) bounds[k]=Math.max(bounds[k],Math.abs(out[k]));
    }
    return bounds;
  })()`);
  assert.ok(extrema.x <= 4 && extrema.y <= 6 && extrema.r <= 0.017);
});

test('polluted structures have bounded disassembly that closes at recovery', () => {
  const app = environmentRuntime();
  for (const family of ['habitatIsland', 'basicHouse', 'solarHouse', 'solarArray', 'windTurbine', 'tree', 'treeCluster', 'landmark']) {
    const broken = app.draw(family, { recovery: 0 });
    const clean = app.draw(family, { recovery: 1 });
    assert.ok(broken.shapes.length > clean.shapes.length, `${family} needs meaningful separated structural pieces`);
    assert.ok(broken.shapes.length <= 12, `${family} fragmentation must stay bounded`);
    assert.deepEqual(app.draw(family, { recovery: 1 }).shapes, clean.shapes);
  }
});

test('atmospheric texture persists at both endpoints behind habitats with a fixed density cap', () => {
  const app = environmentRuntime({ scene: true });
  app.run('regenerate();');
  assert.equal(app.run('ADAPT_TEXTURE_LAYOUT.length'), 420);
  for (const recovery of [0, 1]) {
    app.run(`globalRecovery = ${recovery};`);
    // Count paths and fail if the texture tries to enter an asset/UI region.
    app.run(`
      texturePaths = 0;
      originalPoly = poly;
      poly = (points) => { texturePaths++; originalPoly(points); };
      drawEnvironmentalTexture();
      poly = originalPoly;
    `);
    const count = app.run('texturePaths');
    assert.ok(count >= 50 && count <= (recovery === 1 ? 336 : 420));
  }
  const sketch = readFileSync(path.join(artworkDirectory, 'sketch.js'), 'utf8');
  const draw = sketch.slice(sketch.indexOf('function draw()'), sketch.indexOf('function drawBackground()'));
  assert.ok(draw.indexOf('drawEnvironmentalTexture()') < draw.indexOf('drawPlatforms()'));
  assert.ok(draw.indexOf('drawEnvironmentalTexture()') < draw.indexOf('drawModules()'));
});
