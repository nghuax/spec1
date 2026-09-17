const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../code');

// Check the actual entry points and their dependency graph, not archived shells.
test('production entry points resolve assets with Linux/GitHub Pages filename casing',()=>{
  const pending=['index.html','about.html',...['harm','exhaust','adapt','liven'].flatMap(id=>[`works/${id}.html`,`artworks/${id}/index.html`])];
  const seen=new Set();
  while(pending.length) {
    const relative=pending.pop();if(seen.has(relative))continue;seen.add(relative);
    let directory=root;
    for(const part of relative.split('/')) {
      assert.ok(fs.readdirSync(directory).includes(part),`Missing or incorrectly cased: ${relative}`);
      directory=path.join(directory,part);
    }
    if(!/\.(html|css|js)$/.test(relative))continue;
    const source=fs.readFileSync(directory,'utf8');
    const refs=[];
    if(relative.endsWith('.html')) for(const m of source.matchAll(/(?:src|href)=["']([^"']+)["']/g))refs.push(m[1]);
    if(relative.endsWith('.css')) {
      for(const m of source.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g))refs.push(m[1]);
      for(const m of source.matchAll(/@import\s+["']([^"']+)["']/g))refs.push(m[1]);
    }
    if(relative.endsWith('.js')&&!/(?:p5|vendor)/.test(relative)) {
      for(const m of source.matchAll(/^import\s+.*?from\s+["']([^"']+)["']/gm))refs.push(m[1]);
      for(const m of source.matchAll(/src=["'](assets\/[^"']+)["']/g))refs.push(m[1]);
    }
    for(const ref of refs) {
      if(/^(?:[a-z]+:|\/\/|#)/i.test(ref))continue;
      assert.ok(!ref.startsWith('/'),`Root-relative URL breaks repository hosting: ${relative}: ${ref}`);
      if(ref.includes('${'))continue;
      const clean=decodeURIComponent(ref.split(/[?#]/)[0]);if(!clean)continue;
      const next=path.posix.normalize(path.posix.join(path.posix.dirname(relative),clean));
      assert.ok(!next.startsWith('../'),`Asset escapes publication directory: ${ref}`);
      pending.push(next);
    }
  }
  assert.ok(seen.size>50,'Walked the real application dependency graph');
});

test('all four exact chapter briefs and directional statements survive the final refinement',()=>{
  const context=vm.createContext({});
  const source=fs.readFileSync(path.join(root,'js/stage-intros.js'),'utf8').replaceAll('export ','');
  vm.runInContext(source+'\nthis.copy=stageBriefs;',context);
  const expected={
    harm:['The way we live life shapes the world around us.','Current power usage is heavily polluting the Earth.'],
    exhaust:['What we release, destroys.','Pollution builds across the environment, destroying everything that matters to us.'],
    adapt:['Change starts with what powers our everyday lives.','Shifting toward renewable energy can reduce pollution and help damaged environments recover.'],
    liven:['There is still time to turn back.','When renewable energy becomes part of our communities, recovery becomes something we can see, share and build on.']
  };
  for(const [id,copy] of Object.entries(expected))assert.deepEqual(Array.from(Object.values(context.copy[id])),copy);
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
  for(const copy of ['The change doesn’t end here.','It starts where you live - from inside your home to the surroundings.','LET’S SUPPORT RENEWABLE ENERGY IN YOUR COMMUNITY.'])assert.ok(html.includes(copy),copy);
});
