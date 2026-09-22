const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');
const context=vm.createContext({});
vm.runInContext(fs.readFileSync('code/js/stage-intros-2026-09-22-v01.js','utf8').replaceAll('export ',''),context);

test('each catalogue chapter has exactly one resting point and supports tall content',()=>{
  const stops=context.chapterStops({id:'harm',top:900,bottom:2000,artwork:true});
  assert.equal(stops.length,1);assert.equal(stops[0].id,'harm');
  assert.equal(stops[0].artwork,false);assert.equal(stops[0].strong,true);
  assert.equal(stops[0].bottom,2000);
});
test('approach reveals the complete composition by the chapter resting point',()=>{
  const before=context.introProgress(0,900,900);
  const middle=context.introProgress(500,900,900);
  const composed=context.introProgress(900,900,900);
  assert.equal(before.previewOpacity,0);assert.ok(middle.scale>1);
  assert.equal(composed.scale,1);assert.equal(composed.briefOpacity,1);assert.equal(composed.previewOpacity,1);
  assert.equal(context.introProgress(1200,900,900).previewOpacity,1);
});
test('reduced motion shows the complete catalogue without scaling or delayed reveals',()=>{
  for(const y of [0,500,900,1300]) {
    const p=context.introProgress(y,900,900,true);
    assert.equal(p.scale,1);assert.equal(p.previewOpacity,1);assert.equal(p.briefOpacity,1);
  }
});
test('live previews stay inert; only the open installation accepts input',()=>{
  const journey=fs.readFileSync('code/js/journey-2026-09-22-v01.js','utf8');
  const source=journey.slice(journey.indexOf('function activity('),journey.indexOf('function load('));
  const elements={'.artwork-tools':{},'.artwork-ending':{}};
  const frame={section:{id:'harm',querySelector:s=>elements[s]},iframe:{},ready:true,active:null,paused:false,visible:true};
  const commands=[];const installation={frame:null,phase:'closed'};
  const c=vm.createContext({state:{section:'harm'},document:{hidden:false},installation,reduceMotion:{matches:false},sectionScroll:{isSectionTransitioning:false},command:(_f,action,detail)=>commands.push({action,...detail})});
  vm.runInContext(source,c);c.activity(frame);
  assert.equal(frame.active,true);assert.equal(frame.iframe.inert,true);assert.equal(frame.mode,'preview');
  installation.frame=frame;installation.phase='opening';c.activity(frame);assert.equal(frame.iframe.inert,true);
  installation.phase='open';c.activity(frame);assert.equal(frame.iframe.inert,false);assert.equal(frame.mode,'full');
  installation.frame=null;installation.phase='closed';c.activity(frame);assert.equal(frame.iframe.inert,true);assert.equal(frame.mode,'preview');
  frame.visible=false;c.activity(frame);assert.equal(frame.active,false);
});
