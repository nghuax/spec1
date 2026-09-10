const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context=vm.createContext({});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../code/artworks/adapt/composition.js'),'utf8'),context);
const generate=(seed,w=1920,h=1080)=>context.generateAdaptLayout(seed,w,h);
test('100 seeds preserve UI clearance, silhouette spacing, visibility and hierarchy',()=>{
  const positions=new Set(),scales=new Set();
  for(let seed=0;seed<100;seed++){
    const result=generate(seed);
    assert.equal(result.evaluation.valid,true,JSON.stringify(result.evaluation.issues));
    assert.equal(result.groups.length,9);
    assert.ok(result.evaluation.score>85);
    positions.add(Math.round(result.groups[0].x/20));
    scales.add(result.groups[0].scale.toFixed(2));
  }
  assert.ok(positions.size>10,'Anchor positions must vary meaningfully');
  assert.ok(scales.size>10,'Anchor scales must vary meaningfully');
});
test('same seed reproduces the composition and proportional viewports preserve it',()=>{
  const original=generate(3911);
  assert.equal(JSON.stringify(original),JSON.stringify(generate(3911)));
  for(const [w,h] of [[1280,720],[960,540]]){
    const smaller=generate(3911,w,h);
    assert.equal(smaller.evaluation.valid,true);
    original.groups.forEach((group,i)=>{
      assert.ok(Math.abs(group.x/1920-smaller.groups[i].x/w)<1e-10);
      assert.ok(Math.abs(group.y/1080-smaller.groups[i].y/h)<1e-10);
      assert.equal(group.scale,smaller.groups[i].scale);
    });
  }
});
