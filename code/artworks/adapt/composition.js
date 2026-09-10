/* Pure seeded composition in normalized artboard space. Bounds reserve both
 * state silhouettes, hover enlargement and the full ambient motion envelope.
 * Related objects remain authored children of a procedurally placed habitat. */
const ADAPT_SAFE_ZONES = Object.freeze([
  {name:'title', x:0, y:0, w:0.30, h:0.29},
  {name:'energy controls', x:0, y:0.29, w:0.20, h:0.19},
  {name:'status, progress and instructions', x:0.72, y:0, w:0.28, h:0.30},
  {name:'utility controls', x:0.91, y:0.71, w:0.09, h:0.29},
  {name:'bottom message', x:0.21, y:0.85, w:0.59, h:0.15}
]);
const ADAPT_COMPOSITION_ZONES = Object.freeze([
  {name:'upper', x:0.34,y:0.20,w:0.35,h:0.17},
  {name:'left', x:0.12,y:0.53,w:0.24,h:0.22},
  {name:'center', x:0.38,y:0.38,w:0.30,h:0.30},
  {name:'right', x:0.75,y:0.40,w:0.15,h:0.32},
  {name:'lower', x:0.31,y:0.69,w:0.55,h:0.10}
]);
const ADAPT_GROUP_SCALES = Object.freeze({
  water:[0.90,1.02,1.20], solar:[0.88,1.00,1.12], wind:[0.84,0.95,1.09],
  community:[0.88,1.00,1.15], forest:[0.78,0.90,1.03], wildlife:[0.78,0.88,1.00]
});
function adaptRectsOverlap(a,b,gap=0) {
  return a.x < b.x+b.w+gap && a.x+a.w+gap > b.x && a.y < b.y+b.h+gap && a.y+a.h+gap > b.y;
}
function adaptGroupBounds(group, width=1920, height=1080) {
  const unit=Math.min(width/1920,height/1080);
  // Local bounds cover lifted polluted objects, broken roofs/platform edges,
  // slow float, and 2.5% hover. Anchor bounds cover all four children.
  const half=group.kind==='anchor' ? group.width/2+28*unit : 109*group.scale*unit;
  const top=group.kind==='anchor' ? 214*group.scale*unit : (group.kind==='wind'?184:164)*group.scale*unit;
  const bottom=group.kind==='anchor' ? 75*unit : 52*group.scale*unit;
  return {x:group.x-half,y:group.y-top,w:half*2,h:top+bottom};
}
function evaluateAdaptComposition(groups,width=1920,height=1080) {
  const unit=Math.min(width/1920,height/1080), issues=[];
  const bounds=groups.map(g=>adaptGroupBounds(g,width,height));
  const safe=ADAPT_SAFE_ZONES.map(z=>({x:z.x*width,y:z.y*height,w:z.w*width,h:z.h*height}));
  bounds.forEach((b,i)=>{
    if(b.x<18*unit||b.y<20*unit||b.x+b.w>width-18*unit||b.y+b.h>height-30*unit)issues.push('clipping:'+i);
    if(safe.some(s=>adaptRectsOverlap(b,s,10*unit)))issues.push('ui:'+i);
    for(let j=0;j<i;j++)if(adaptRectsOverlap(b,bounds[j],18*unit))issues.push('collision:'+j+','+i);
  });
  const satellites=groups.filter(g=>g.kind!=='anchor');
  const left=satellites.filter(g=>g.x<width*.43).length;
  const right=satellites.filter(g=>g.x>width*.68).length;
  const upper=satellites.filter(g=>g.y<height*.43).length;
  const lower=satellites.filter(g=>g.y>height*.66).length;
  if(left<1||right<1||upper<1||lower<2)issues.push('distribution');
  const weights=groups.map(g=>g.kind==='anchor'?3:g.scale*g.scale);
  const total=weights.reduce((a,b)=>a+b,0);
  const cx=groups.reduce((sum,g,i)=>sum+g.x*weights[i],0)/total/width;
  const cy=groups.reduce((sum,g,i)=>sum+g.y*weights[i],0)/total/height;
  const balance= Math.max(0,1-Math.abs(cx-.57)*2.5-Math.abs(cy-.57)*2);
  const area=bounds.reduce((sum,b)=>sum+b.w*b.h,0)/(width*height);
  const hierarchy=groups[0]?.kind==='anchor'&&satellites.filter(g=>g.scale>=.92).length>=3;
  if(!hierarchy)issues.push('hierarchy');
  const spacing=1-Math.min(1,Math.abs(area-.38)*2);
  return {valid:issues.length===0,issues,score:40+balance*25+spacing*15+(hierarchy?20:0),balance,coverage:area,bounds};
}
function generateAdaptLayout(seed,width=1920,height=1080) {
  let state=seed>>>0;
  const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  const range=(a,b)=>a+(b-a)*random();
  const weighted=(min,preferred,max)=>{
    const v=(random()+random()+random())/3;
    return v<.5 ? min+(preferred-min)*v*2 : preferred+(max-preferred)*(v-.5)*2;
  };
  const unit=Math.min(width/1920,height/1080);
  const safe=ADAPT_SAFE_ZONES.map(z=>({x:z.x*width,y:z.y*height,w:z.w*width,h:z.h*height}));
  const fits=(g,groups)=>{
    const b=adaptGroupBounds(g,width,height);
    return b.x>=18*unit&&b.y>=20*unit&&b.x+b.w<=width-18*unit&&b.y+b.h<=height-30*unit
      &&!safe.some(s=>adaptRectsOverlap(b,s,10*unit))
      &&!groups.some(other=>adaptRectsOverlap(b,adaptGroupBounds(other,width,height),18*unit));
  };
  let best=null,validCandidates=0;
  // Twenty-four complete candidate compositions; bounded retries within each.
  // A second deterministic batch is available only if the first has no valid fit.
  for(let attempt=0;attempt<96;attempt++) {
    if(attempt>=24&&best)break;
    const anchorScale=weighted(.90,1,1.10);
    const anchor={kind:'anchor',x:range(.40,.66)*width,y:range(.48,.66)*height,
      scale:anchorScale,width:760*anchorScale*unit};
    if(!fits(anchor,[]))continue;
    const groups=[anchor];
    // Pass 1 landmark, pass 2 energy/community, pass 3 vegetation/wildlife.
    const kinds=['water','water','wind','solar','community','forest','wildlife','wildlife'];
    for(const kind of kinds) {
      let chosen=null,merit=-Infinity;
      const preferred=kind==='water'?[0,0,1,4]:kind==='wildlife'?[1,3,4,4]:[0,1,2,3,4];
      const scale=weighted(...ADAPT_GROUP_SCALES[kind]);
      for(let candidate=0;candidate<190;candidate++) {
        const z=ADAPT_COMPOSITION_ZONES[preferred[Math.floor(random()*preferred.length)]];
        const g={kind,scale,x:range(z.x,z.x+z.w)*width,y:range(z.y,z.y+z.h)*height};
        if(!fits(g,groups))continue;
        const nearest=Math.min(...groups.map(other=>Math.hypot((g.x-other.x)/width,(g.y-other.y)/height)));
        const spread=nearest+random()*.06;
        if(spread>merit){chosen=g;merit=spread;}
      }
      if(!chosen)break;
      groups.push(chosen);
    }
    if(groups.length!==9)continue;
    const evaluation=evaluateAdaptComposition(groups,width,height);
    if(!evaluation.valid)continue;
    validCandidates++;
    if(!best||evaluation.score>best.evaluation.score)best={seed:seed>>>0,groups,evaluation,attempts:attempt+1};
  }
  if(!best)throw new Error('No valid ADAPT composition for seed '+seed);
  best.validCandidates=validCandidates;
  return best;
}
