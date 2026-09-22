const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function setup() {
  const context=vm.createContext({});
  vm.runInContext(fs.readFileSync('code/js/ui-sounds-2026-09-22-v01.js','utf8').replace('export class UISounds','this.UISounds = class UISounds'),context);
  const events={}, players=[];
  const root={hidden:false,addEventListener:(name,fn)=>events[name]=fn};
  const manager=new context.UISounds({root,view:{addEventListener(){}},sources:{hover:'hover.mp3',click:'click.wav'},createAudio:()=>{
    const audio={currentTime:0,plays:0,load(){},pause(){this.paused=true;},play(){this.plays++;this.paused=false;return this.reject?Promise.reject(new Error('NotAllowedError')):Promise.resolve();}};
    players.push(audio);return audio;
  }});
  const control={closest:()=>null,contains:node=>node===child};
  const child={closest:()=>control};
  const emit=(type,extra={})=>events[type]({isTrusted:true,target:child,pointerType:'mouse',relatedTarget:null,...extra});
  return {root,manager,players,child,emit};
}
test('preloads two players silently and triggers once per pointer entry, not child crossings or touch',()=>{
  const s=setup();
  assert.deepEqual(s.players.map(p=>[p.preload,p.volume,p.plays]),[['auto',.25,0],['auto',.35,0]]);
  s.emit('pointerover');s.emit('pointerover',{relatedTarget:s.child});s.emit('pointerover',{pointerType:'touch'});
  assert.equal(s.players[0].plays,1);
  s.emit('pointerover');assert.equal(s.players[0].plays,2);
});
test('keyboard activation clicks once and rapid clicks reuse players without stacking',()=>{
  const s=setup();s.emit('pointerover');s.emit('click',{detail:0});
  assert.equal(s.players[0].paused,true);assert.equal(s.players[1].plays,1);
  s.players[1].currentTime=.2;s.emit('click');
  assert.equal(s.players[1].currentTime,0);assert.equal(s.players[1].plays,2);
  s.emit('click',{isTrusted:false});assert.equal(s.players[1].plays,2);
});
test('disabled/decorative controls and background documents stay silent; autoplay rejection is handled',async()=>{
  const s=setup();
  s.emit('click',{target:{closest:()=>null}});
  s.emit('click',{target:{closest:()=>({closest:()=>({})})}});
  s.root.hidden=true;s.emit('click');assert.equal(s.players[1].plays,0);
  s.root.hidden=false;s.players[1].reject=true;s.emit('click');await Promise.resolve();
  assert.equal(s.players[1].plays,1);
});
