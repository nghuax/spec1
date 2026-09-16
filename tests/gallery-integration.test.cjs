const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('code/js/gallery-frame.js','utf8').replace('export function','function');
function fixture(stage='liven',saved='false') {
 const selectors=['gallery-frame','gallery-iframe','gallery-loading','gallery-error','gallery-mute','gallery-mix','gallery-reset','journey-complete','gallery-retry','gallery-fullscreen','dismiss-completion'];
 const nodes=Object.fromEntries(selectors.map(s=>[s,{hidden:false,disabled:false,attrs:{},events:{},setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,f){this.events[k]=f;},focus(){this.focused=true;}}]));
 const posted=[],events={},timers=new Map(),storage=new Map([['heal:muted',saved]]); let timer=0;
 nodes['gallery-iframe'].contentWindow={postMessage:(payload,origin)=>posted.push({payload,origin})};
 const host={querySelector:s=>s==='[rel="next"]'?nodes.next:s.startsWith('[data-')?nodes[s.slice(6,-1)]:null}; nodes.next={focus(){this.focused=true;}};
 const context=vm.createContext({window:{addEventListener:(k,f)=>events[k]=f},location:{origin:'http://localhost'},sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},setTimeout:f=>{timers.set(++timer,f);return timer;},clearTimeout:t=>timers.delete(t)});
 vm.runInContext(source,context);context.setupGalleryFrame(host,{id:stage},'/artwork?gallery=heal');
 const send=(data={},extra={})=>events.message({origin:'http://localhost',source:nodes['gallery-iframe'].contentWindow,data:{type:'heal:state',stage,muted:false,completed:false,...data},...extra});
 const click=id=>nodes[id].events.click();
 return {nodes,posted,send,click,storage,timers};
}
test('only the current same-origin artwork can enable the controls',()=>{
 const f=fixture();const n=f.nodes;
 f.send({}, {origin:'https://other.example'});f.send({}, {source:{}});f.send({stage:'harm'});f.send({type:'other'});
 assert.equal(n['gallery-mute'].disabled,true);assert.equal(n['gallery-loading'].hidden,false);
 f.send();assert.equal(n['gallery-mute'].disabled,false);assert.equal(n['gallery-loading'].hidden,true);assert.equal(f.timers.size,0);
});
test('saved mute is sent at readiness and native sound changes synchronize',()=>{
 const f=fixture('adapt','true');f.send();assert.equal(f.posted[0].payload.muted,true);
 f.send({muted:false});assert.equal(f.nodes['gallery-mute'].textContent,'SOUND ON');assert.equal(f.storage.get('heal:muted'),'false');
 f.click('gallery-mute');assert.equal(f.posted.at(-1).payload.muted,true);assert.equal(f.storage.get('heal:muted'),'true');
 f.click('gallery-mix');assert.equal(f.posted.at(-1).payload.action,'mix');
});
test('LIVEN conclusion follows completion, dismissal and a new attempt',()=>{
 const f=fixture();const n=f.nodes;
 f.send();assert.equal(n['journey-complete'].hidden,true);
 f.send({completed:true});assert.equal(n['journey-complete'].hidden,false);
 f.click('dismiss-completion');f.send({completed:true});assert.equal(n['journey-complete'].hidden,true);assert.equal(n.next.focused,true);
 f.send({completed:false});f.send({completed:true});assert.equal(n['journey-complete'].hidden,false);
 f.click('gallery-reset');assert.equal(n['journey-complete'].hidden,true);assert.equal(f.posted.at(-1).payload.action,'reset');
 const a=fixture('adapt');a.send({completed:true});assert.equal(a.nodes['journey-complete'].hidden,true);
});
test('timeout exposes retry and a late ready message recovers',()=>{
 const f=fixture();for(const run of [...f.timers.values()])run();assert.equal(f.nodes['gallery-error'].hidden,false);
 f.click('gallery-retry');assert.equal(f.nodes['gallery-error'].hidden,true);assert.equal(f.nodes['gallery-mute'].disabled,true);
 f.send();assert.equal(f.nodes['gallery-error'].hidden,true);assert.equal(f.nodes['gallery-mute'].disabled,false);
});
const bridge=fs.readFileSync('code/artworks/gallery-bridge.js','utf8');
test('LIVEN bridge reports puzzle completion and preserves standalone isolation',()=>{
 const messages=[],listeners={};let count=0,muted=false;const parent={postMessage:p=>messages.push(p)};
 const env={parent,location:{search:'?gallery=heal',pathname:'/code/artworks/liven/index.html',origin:'http://localhost'},URLSearchParams,document:{querySelector:()=>({}),getElementById:()=>({click:()=>count=0})},renewableCount:()=>count,earthIsRestored:()=>count===3,livenUI:{sync(){}},soundMuted:false,toggleSoundMute(){env.soundMuted=!env.soundMuted;},setInterval:f=>{env.tick=f;return 1;},clearInterval(){}};
 env.window={livenUI:env.livenUI,addEventListener:(name,fn)=>listeners[name]=fn};
 vm.runInNewContext(bridge,env);assert.equal(messages.at(-1).completed,false);
 count=2;env.tick();assert.equal(messages.at(-1).completed,false);
 count=3;env.tick();assert.equal(messages.at(-1).completed,true);
 listeners.message({origin:'https://other.example',source:parent,data:{type:'heal:command',action:'reset'}});assert.equal(count,3);
 listeners.message({origin:'http://localhost',source:parent,data:{type:'heal:command',action:'reset'}});assert.equal(messages.at(-1).completed,false);
 let started=false;const standalone={};vm.runInNewContext(bridge,{parent:standalone,window:standalone,setInterval:()=>started=true});assert.equal(started,false);
});
test('EXHAUST bridge calls its p5 mixer handler and reset directly',()=>{
 const listeners={};let opened=0,resets=0;const parent={postMessage(){}};
 const env={parent,location:{search:'?gallery=heal',pathname:'/code/artworks/exhaust/index.html',origin:'http://localhost'},URLSearchParams,document:{querySelector:()=>({})},projectMuted:false,ambienceButton:{},openSoundMixer:()=>opened++,regenerateArtwork:()=>resets++,setInterval:()=>1,clearInterval(){},window:{addEventListener:(n,f)=>listeners[n]=f}};
 vm.runInNewContext(bridge,env);
 for(const action of ['mix','reset'])listeners.message({source:parent,origin:'http://localhost',data:{type:'heal:command',action}});
 assert.equal(opened,1);assert.equal(resets,1);
});
