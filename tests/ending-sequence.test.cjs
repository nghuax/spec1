const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ctx=vm.createContext({});
vm.runInContext(fs.readFileSync('code/js/artwork-endings.js','utf8').replaceAll('export ','')+';this.api={endings,EndingSequence};',ctx);
function setup(stage='liven') {
  const nodes={},animations=[];let exits=0;
  const panel={querySelectorAll(){return [nodes.info??={},nodes.restart??={}];},classList:{toggle(){}},querySelector(selector){return nodes[selector]??=(selector==='.ending-content'?{animate(frames,options){let resolve;const finished=new Promise(r=>resolve=r);const animation={finished,cancel:()=>resolve(),resolve,options};animations.push(animation);return animation;}}:{textContent:'',setAttribute(){},removeAttribute(){}});},focus(){this.focused=true;}};
  const sequence=new ctx.api.EndingSequence(panel,ctx.api.endings[stage],{matches:false},async()=>{exits++;});
  return {sequence,nodes,animations,panel,get exits(){return exits;}};
}
async function finishTransition(s,pending){s.animations.at(-1).resolve();await new Promise(setImmediate);s.animations.at(-1).resolve();await pending;}
test('LIVEN continues one message at a time and only exits after message three',async()=>{
  const s=setup();assert.equal(s.nodes['.ending-message'].textContent,'Life returns.');
  let pending=s.sequence.advance();await s.sequence.advance();await finishTransition(s,pending);
  assert.equal(s.sequence.button.textContent,'CONTINUE');assert.equal(s.nodes.info.hidden,true);assert.equal(s.sequence.index,1);assert.equal(s.exits,0);assert.equal(s.panel.focused,true);
  pending=s.sequence.advance();await finishTransition(s,pending);
  assert.equal(s.nodes['.ending-message'].textContent,'Now, take it beyond the screen.');assert.equal(s.exits,0);
  assert.equal(s.sequence.button.textContent,'NEXT');assert.equal(s.nodes.info.hidden,false);await s.sequence.advance();assert.equal(s.exits,1);
});
test('reset during a transition cancels stale progression and restores the first message',async()=>{
  const s=setup();const pending=s.sequence.advance();s.sequence.reset();await pending;
  assert.equal(s.sequence.index,0);assert.equal(s.sequence.busy,false);assert.equal(s.exits,0);
});
test('each earlier stage continues immediately without altering completion logic',async()=>{
  for(const stage of ['harm','exhaust','adapt']){const s=setup(stage);assert.equal(s.sequence.button.textContent,'NEXT');assert.equal(s.nodes.info.hidden,false);await s.sequence.advance();assert.equal(s.exits,1);assert.equal(s.animations.length,0);}
});
