const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('code/js/living-motion-2026-09-22-v01.js','utf8').replace('export class MotionPreference','globalThis.MotionPreference = class MotionPreference').replace('export class LivingMotion','globalThis.LivingMotion = class LivingMotion');
function fixture({system=true,saved=null,blocked=false}={}) {
  const root={dataset:{}},events={};
  const media={matches:system,addEventListener:(name,fn)=>events[name]=fn};
  const storage={getItem(){if(blocked)throw Error('blocked');return saved;},setItem(key,value){if(blocked)throw Error('blocked');saved=value;}};
  const context=vm.createContext({});vm.runInContext(source,context);
  const preference=new context.MotionPreference({media,root,storage});
  return {preference,root,media,events,saved:()=>saved};
}
test('motion stays enabled and ignores obsolete saved pause choices',()=>{
  const f=fixture({system:false,saved:'reduced'});
  assert.equal(f.preference.matches,false);assert.equal(f.root.dataset.motion,'full');
  assert.equal(typeof f.preference.toggle,'undefined');
});
test('system reduced motion cannot disable exhibition motion',()=>{
  const f=fixture({system:true,saved:'reduced'});
  assert.equal(f.preference.matches,false);assert.equal(f.root.dataset.motion,'full');
});
test('blocked storage cannot affect motion initialization',()=>{
  const f=fixture({system:false,blocked:true});assert.equal(f.preference.matches,false);
});
test('a delayed explicit reset is accepted while settling and restores the suspended lifecycle',()=>{
  const journey=fs.readFileSync('code/js/journey-2026-09-22-v01.js','utf8');
  const helper=journey.slice(journey.indexOf('function performCommand('),journey.indexOf('function activity('));
  let sourceActive=false,resets=0;
  const frame={active:false};
  const context=vm.createContext({command(_frame,action,detail){
    if(action==='activity')sourceActive=detail.active;
    else if(action==='reset'&&sourceActive)resets++;
  }});
  vm.runInContext(helper,context);
  context.performCommand(frame,'reset');
  assert.equal(resets,1);assert.equal(sourceActive,false);assert.equal(frame.active,false);
});

test('an active artwork receives its explicit action without a lifecycle interruption',()=>{
  const journey=fs.readFileSync('code/js/journey-2026-09-22-v01.js','utf8');
  const helper=journey.slice(journey.indexOf('function performCommand('),journey.indexOf('function activity('));
  const calls=[];const context=vm.createContext({command(_frame,action){calls.push(action);}});
  vm.runInContext(helper,context);context.performCommand({active:true},'place',{piece:'solar',slot:'solar'});
  assert.deepEqual(calls,['place']);
});

