const clamp = value => Math.max(0,Math.min(1,value));
const smooth = value => { const t=clamp(value);return t*t*(3-2*t); };

export const stageBriefs = {
  harm: {statement:'The way we power life shapes the world around us.',body:'Fossil energy keeps communities moving, but every use leaves pollution behind.',thread:'FOSSIL ENERGY → ENVIRONMENTAL COST'},
  exhaust: {statement:'What we release doesn’t stay in one place.',body:'Pollution builds across the air, land and water we all share, putting more pressure on nature.',thread:'POLLUTION → SHARED IMPACT'},
  adapt: {statement:'Change starts with what powers our everyday lives.',body:'Shifting toward renewable energy can reduce pollution and help damaged environments recover.',thread:'RENEWABLE ENERGY → POSITIVE CHANGE'},
  liven: {statement:'Cleaner energy can reshape the places we call home.',body:'When renewable energy becomes part of our communities, recovery becomes something we can see, share and build on.',thread:'CLEAN ENERGY → STRONGER COMMUNITIES'}
};

export function briefMarkup(stage) {
  const brief=stageBriefs[stage.id];
  return `<div class="chapter-copy">
    <div class="stage-brief"><span class="brief-header-tab" aria-hidden="true"></span><span class="brief-corner-marks" aria-hidden="true"></span><h3>${brief.statement}</h3><p>${brief.body}</p><p class="stage-thread">${brief.thread}</p></div>
  </div>`;
}

export function introMarkup(stage,index) {
  return `<div class="artwork-slot">
    <span class="artwork-corner-accents" aria-hidden="true">
      <svg class="frame-shard frame-shard-top" viewBox="0 0 160 100" focusable="false"><path class="shard-muted" d="M0 26 111 49 53 52Z"/><path class="shard-main" d="m61 17 83 15 13 64-46-47Z"/><path class="shard-light" d="m61 17 50 32 33-17Z"/><path class="shard-dark" d="m111 49 46 47-13-64Z"/></svg>
      <svg class="frame-shard frame-shard-right" viewBox="0 0 160 130" focusable="false"><path class="shard-muted" d="m3 103 72-30 78-66-35 111Z"/><path class="shard-main" d="m3 103 57-43 22 31 36 27Z"/><path class="shard-light" d="m75 73 78-66-35 60-36 24Z"/><path class="shard-dark" d="m82 91 36-24 0 51Z"/><path class="shard-deep" d="m3 103 57-43 22 31Z"/></svg>
      <svg class="frame-shard frame-shard-left" viewBox="0 0 85 120" focusable="false"><path class="shard-main" d="m5 5 37 61-5 30 47 21H7Z"/><path class="shard-light" d="m5 5 37 61-21-18Z"/><path class="shard-dark" d="m7 117 30-21-16-48Z"/><path class="shard-muted" d="m7 117 30-21 47 21Z"/></svg>
      <svg class="frame-shard frame-shard-pin" viewBox="0 0 100 90" focusable="false"><path class="shard-deep" d="M5 0 98 19 9 87Z"/><path class="shard-main" d="m9 87 37-58 52-10Z"/></svg>
    </span>
    <div class="stage-banner"><p class="stage-number">STAGE ${index+1}</p><h2 id="${stage.id}-title" tabindex="-1">${stage.title}</h2></div>`;
}

// One useful resting composition per chapter. Reveal happens on approach,
// rather than adding separate title, brief or automatic fullscreen stops.
export function chapterStops(bound) {
  return [{...bound,chapter:bound.id,phase:'preview',artwork:false,strong:true}];
}
export function introProgress(y,start,height,reduced=false) {
  const progress=reduced?1:smooth((y-(start-height*.85))/(height*.85));
  return {progress,scale:reduced?1:1.08-.08*progress,
    briefOpacity:reduced?1:smooth((progress-.08)/.65),
    previewOpacity:reduced?1:smooth((progress-.22)/.72)};
}
export class StageIntros {
  constructor(preference) {
    this.preference=preference;
    this.items=[...document.querySelectorAll('.chapter')].map(section=>({section}));
    preference.addEventListener('change',()=>this.update(window.scrollY));
  }
  measure(bounds,height) {
    this.height=height;
    const byId=new Map(this.items.map(item=>[item.section.id,item]));
    return bounds.flatMap(bound=>{
      const item=byId.get(bound.id);
      if(!item)return [{...bound,chapter:bound.id,phase:'editorial'}];
      item.start=bound.top;
      return chapterStops(bound);
    });
  }
  update(y) {
    for(const item of this.items) {
      if(item.start===undefined)continue;
      const p=introProgress(y,item.start,this.height,this.preference.matches);
      const key=JSON.stringify(p);if(key===item.last)continue;item.last=key;
      item.section.style.setProperty('--chapter-reveal',p.progress.toFixed(4));
      item.section.style.setProperty('--title-scale',p.scale.toFixed(4));
      item.section.style.setProperty('--brief-opacity',p.briefOpacity.toFixed(4));
      item.section.style.setProperty('--preview-opacity',p.previewOpacity.toFixed(4));
    }
  }
}
