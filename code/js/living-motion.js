/* Shared motion preference. System settings are the default; an explicit
   session choice lets the visitor preview or pause the exhibition shell. */
export class MotionPreference {
  constructor({ media = matchMedia('(prefers-reduced-motion: reduce)'), root = document.documentElement, storage } = {}) {
    this.media=media; this.root=root; this.storage=storage; this.listeners=new Set();
    // Accessing the storage property itself can throw in restricted contexts.
    try { this.storage ??= sessionStorage; this.choice=this.storage.getItem('heal-motion'); } catch { this.choice=null; }
    if(!['full','reduced'].includes(this.choice)) this.choice=null;
    this.sync();
    media.addEventListener('change',()=>{ if(!this.choice) this.sync(true); });
  }
  get matches() { return this.choice ? this.choice==='reduced' : this.media.matches; }
  addEventListener(name,callback) { if(name==='change') this.listeners.add(callback); }
  sync(notify=false) {
    this.root.dataset.motion=this.matches?'reduced':'full';
    if(notify) this.listeners.forEach(callback=>callback({matches:this.matches}));
  }
  toggle() {
    this.choice=this.matches?'full':'reduced';
    try { this.storage.setItem('heal-motion',this.choice); } catch { /* session-only in memory */ }
    this.sync(true);
  }
}

export class LivingMotion {
  constructor(preference) {
    this.preference=preference;
    this.root=document.documentElement;
    this.landing=document.getElementById('landing');
    this.ambient=document.querySelector('.heal-atmosphere');
    const shardPlates = [
      '<svg viewBox="0 0 220 160" aria-hidden="true" focusable="false"><path class="ambient-face" d="M8 24 151 0 220 38 96 104 0 83Z"/><path class="ambient-facet" d="M96 104 220 38 203 158 40 133Z"/><path class="ambient-edge" d="m8 24 88 80 124-66"/></svg>',
      '<svg viewBox="0 0 220 160" aria-hidden="true" focusable="false"><path class="ambient-face" d="M20 0 168 28 220 112 72 160 0 83Z"/><path class="ambient-facet" d="M20 0 72 160 0 83Z"/><path class="ambient-edge" d="M168 28 72 160"/></svg>',
      '<svg viewBox="0 0 220 160" aria-hidden="true" focusable="false"><path class="ambient-face" d="M0 36 86 0 220 30 180 128 46 160Z"/><path class="ambient-facet" d="M86 0 180 128 46 160Z"/><path class="ambient-edge" d="M0 36 46 160 180 128 220 30"/></svg>'
    ];
    const mark = '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path class="ambient-mark-shape" d="M20 0 39 13 32 35 9 40 0 18Z"/><path class="ambient-mark-cut" d="m8 20 13-8 10 7-12 10Z"/></svg>';
    // Loose, asymmetric paper forms: decorative direction, never UI controls.
    const arrowForms = [
      '<path d="m14 92 6-25 48 2 18-22-23-7 72-23-7 71-19-23-25 26Z"/><path class="ambient-arrow-cut" d="m22 86 45-7 19-21-9 23-30 12Z"/>',
      '<path d="M9 67Q40 80 77 49L54 40 140 22 128 94 108 73Q65 112 13 97Z"/><path class="ambient-arrow-cut" d="M21 89Q66 99 98 68 64 108 21 99Z"/>',
      '<path d="m15 89 12-25 38 6 20-16-16-16 66-20-5 68-21-16-33 27Z"/><path d="m2 101 5-13 13 6-6 14Z"/><path class="ambient-arrow-cut" d="m33 78 31 3 12 8-37 2Z"/>'
    ];
    // Faceted planes and small environmental fragments echo LIVEN's layered
    // background language while remaining separate from its central artwork.
    this.ambient.innerHTML=Array.from({length:12},(_,i)=>`<i class="ambient-piece ambient-piece-${i+1} ${i%4===2?'ambient-outline':''}">${shardPlates[i%shardPlates.length]}</i>`).join('')+Array.from({length:14},(_,i)=>`<i class="ambient-mark ambient-mark-${i+1}">${mark}</i>`).join('')+Array.from({length:6},(_,i)=>`<i class="ambient-arrow ambient-arrow-${i+1}"><svg viewBox="0 0 160 112" aria-hidden="true" focusable="false">${arrowForms[i%arrowForms.length]}</svg></i>`).join('');
    this.buttons=[...document.querySelectorAll('[data-motion-toggle]')];
    const sync=()=>this.buttons.forEach(button=>{
      button.textContent=preference.matches?'MOTION OFF':'MOTION ON';
      button.setAttribute('aria-pressed',String(!preference.matches));
      button.setAttribute('aria-label',preference.matches?'Turn exhibition motion on':'Pause exhibition motion');
    });
    this.buttons.forEach(button=>button.addEventListener('click',()=>preference.toggle()));
    preference.addEventListener('change',sync);sync();
    const revealGroups=[...document.querySelectorAll('.conclusion-inner > *, .about-heading, .about-overview > div, .sdg-section, .about-journey, .about-credits')];
    revealGroups.forEach((element,i)=>{
      element.dataset.reveal='';
      element.style.setProperty('--reveal-delay',`${Math.min(i%3,2)*65}ms`);
    });
    this.observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('is-revealed');this.observer.unobserve(entry.target);}
    }),{threshold:.12,rootMargin:'0px 0px -5% 0px'});
    revealGroups.forEach(element=>this.observer.observe(element));
    // Existing typography stays readable with scripting off or motion paused.
    this.root.classList.add('living-motion-ready');
    if(!location.hash||location.hash==='#landing') this.landing.classList.add('is-introducing');
    document.addEventListener('visibilitychange',()=>{
      this.root.classList.toggle('motion-suspended',document.hidden);
    });
  }
  update(bounds,y,height,controller) {
    if(!bounds.length) return;
    const progress=y/Math.max(1,height);
    this.root.style.setProperty('--ambient-scroll-x',`${Math.sin(progress*.7)*18}px`);
    this.root.style.setProperty('--ambient-scroll-y',`${Math.cos(progress*.6)*14}px`);
    const landingExit=Math.min(1,Math.max(0,y/Math.max(1,bounds[1].top)));
    this.landing.style.setProperty('--landing-exit',landingExit.toFixed(4));
    const phase=controller.isSectionTransitioning ? Math.sin(Math.PI*controller.transitionProgress) : 0;
    this.ambient.style.setProperty('--ambient-passage',phase.toFixed(4));
  }
}
