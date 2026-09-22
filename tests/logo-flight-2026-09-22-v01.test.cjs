const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync('code/js/logo-flight-2026-09-22-v01.js', 'utf8').replaceAll('export ', ''), context);
const geometry = {
  landing: {x:100,y:200,width:1000}, nav: {x:40,y:8,width:150},
  final: {x:150,y:4200,width:800}, landingEnd:720,
  finalStart:3300, finalEnd:4000, exitStart:4192, exitEnd:4642
};
const pose = (y, reduced=false) => JSON.parse(JSON.stringify(context.logoPose(y, geometry, reduced)));

test('without a final banner the logo stays in navigation through both conclusion stops', () => {
  const withoutBanner={landing:geometry.landing,nav:geometry.nav,landingEnd:720};
  for(const reduced of [false,true]) {
    for(const y of [720,4000,5200,7000,5200,720]) {
      assert.deepEqual(JSON.parse(JSON.stringify(context.logoPose(y,withoutBanner,reduced))),geometry.nav);
    }
  }
});
test('landing contracts continuously into the precise navigation position', () => {
  assert.deepEqual(pose(0), geometry.landing);
  assert.deepEqual(pose(720), geometry.nav);
  const halfway = pose(360);
  assert.equal(halfway.width,575);
  assert.equal(halfway.x,70);
  assert.equal(halfway.y,104);
});
test('navigation size remains fixed throughout the artwork chapters', () => {
  for (const y of [720,1000,2000,3000,3300]) assert.deepEqual(pose(y),geometry.nav);
});
test('final arrival lands on the document anchor and follows it while reading', () => {
  assert.deepEqual(pose(3650),{x:95,y:104,width:475});
  assert.deepEqual(pose(4000),{x:150,y:200,width:800});
  assert.deepEqual(pose(4100),{x:150,y:100,width:800});
  assert.deepEqual(pose(4642),geometry.nav);
  for (const boundary of [720,3300,4000,4192,4642]) {
    const before=pose(boundary-.001), after=pose(boundary+.001);
    for (const key of ['x','y','width']) assert.ok(Math.abs(before[key]-after[key])<.01);
  }
});
test('reverse scrolling retraces the same positions without state or accumulated error', () => {
  const offsets=[0,360,720,2400,3300,3600,4000,4192,4400,4642,5200];
  const forward=offsets.map(y=>pose(y));
  assert.deepEqual(offsets.toReversed().map(y=>pose(y)).toReversed(),forward);
});
test('reduced motion uses endpoint sizes instead of a prolonged scaling flight', () => {
  assert.deepEqual(pose(100,true),geometry.landing);
  assert.deepEqual(pose(600,true),geometry.nav);
  assert.deepEqual(pose(3400,true),geometry.nav);
  assert.deepEqual(pose(3900,true),{x:150,y:300,width:800});
  assert.deepEqual(pose(4600,true),geometry.nav);
});
