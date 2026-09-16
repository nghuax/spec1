const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('code/js/living-motion.js','utf8').replace('export class MotionPreference','globalThis.MotionPreference = class MotionPreference').replace('export class LivingMotion','globalThis.LivingMotion = class LivingMotion');
function fixture({system=true,saved=null,blocked=false}={}) {
  const root={dataset:{}},events={};
  const media={matches:system,addEventListener:(name,fn)=>events[name]=fn};
  const storage={getItem(){if(blocked)throw Error('blocked');return saved;},setItem(key,value){if(blocked)throw Error('blocked');saved=value;}};
  const context=vm.createContext({});vm.runInContext(source,context);
  const preference=new context.MotionPreference({media,root,storage});
  return {preference,root,media,events,saved:()=>saved};
}
test('the system reduced-motion preference wins until the visitor explicitly chooses motion',()=>{
  const f=fixture();assert.equal(f.preference.matches,true);assert.equal(f.root.dataset.motion,'reduced');
  let calls=0;f.preference.addEventListener('change',()=>calls++);f.preference.toggle();
  assert.equal(f.preference.matches,false);assert.equal(f.saved(),'full');assert.equal(calls,1);
  f.media.matches=true;f.events.change();assert.equal(f.preference.matches,false);assert.equal(calls,1);
});
test('system changes update every listener while no explicit choice exists',()=>{
  const f=fixture({system:false});const changes=[];f.preference.addEventListener('change',e=>changes.push(e.matches));
  f.media.matches=true;f.events.change();assert.equal(f.root.dataset.motion,'reduced');
  f.media.matches=false;f.events.change();assert.deepEqual(changes,[true,false]);
});
test('a saved pause remains paused even on a motion-enabled system',()=>{
  const f=fixture({system:false,saved:'reduced'});assert.equal(f.preference.matches,true);
  f.preference.toggle();assert.equal(f.root.dataset.motion,'full');
});
test('storage denial and invalid values preserve functionality and safe defaults',()=>{
  const f=fixture({blocked:true});assert.equal(f.preference.matches,true);
  assert.doesNotThrow(()=>f.preference.toggle());assert.equal(f.preference.matches,false);
  assert.equal(fixture({saved:'invalid'}).preference.matches,true);
});

test('a delayed explicit reset is accepted while settling and restores the suspended lifecycle',()=>{
  const journey=fs.readFileSync('code/js/journey.js','utf8');
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
  const journey=fs.readFileSync('code/js/journey.js','utf8');
  const helper=journey.slice(journey.indexOf('function performCommand('),journey.indexOf('function activity('));
  const calls=[];const context=vm.createContext({command(_frame,action){calls.push(action);}});
  vm.runInContext(helper,context);context.performCommand({active:true},'place',{piece:'solar',slot:'solar'});
  assert.deepEqual(calls,['place']);
});
