// The same live iframe stays in its original DOM position. The dialog's top
// layer expands it without reparenting, reloading or duplicating the artwork.
export function expansionTransform(first,last) {
  const scale=last.width ? first.width/last.width : 1;
  return `translate(${first.left-last.left}px, ${first.top-last.top}px) scale(${scale})`;
}

export class Installation {
  constructor({frames,preference,scroll,fit,onChange}) {
    Object.assign(this,{frames,preference,scroll,fit,onChange});
    this.frame=null;this.phase='closed';this.animations=[];
    for(const frame of frames.values()) {
      frame.dialog=frame.section.querySelector('.chapter-inner');
      frame.trigger=frame.section.querySelector('.preview-trigger');
      frame.trigger.addEventListener('click',()=>this.open(frame));
      frame.dialog.addEventListener('cancel',event=>{event.preventDefault();this.close();});
    }
    window.addEventListener('resize',()=>{
      this.animations.forEach(animation=>animation.finish());
      if(this.frame){this.fit();this.savedY=window.scrollY;}
    });
    preference.addEventListener('change',()=>{
      if(preference.matches)this.animations.forEach(animation=>animation.finish());
    });
  }
  setPhase(phase) {
    this.phase=phase;
    document.documentElement.dataset.installation=phase;
    if(this.frame)this.frame.dialog.dataset.phase=phase;
    this.onChange();
  }
  async animate(frame,first,last,opening) {
    const duration=this.preference.matches?100:opening?560:460;
    const invert=expansionTransform(first,last);
    const motion=this.preference.matches
      ? [{opacity:opening?0:1},{opacity:opening?1:0}]
      : [{transform:opening?invert:'none'},{transform:opening?'none':invert}];
    const options={duration,easing:'cubic-bezier(.22,.7,.2,1)',fill:'both'};
    this.animations=[frame.iframe.animate(motion,options),
      frame.dialog.querySelector('.installation-surface').animate([{opacity:opening?0:1},{opacity:opening?1:0}],options)];
    await Promise.all(this.animations.map(animation=>animation.finished.catch(()=>{})));
    this.animations.forEach(animation=>animation.cancel());this.animations=[];
  }
  open(frame) {
    if(this.frame)return this.pending;
    this.frame=frame;
    this.scroll.setSuspended(true);
    this.savedOverflow=document.documentElement.style.overflow;
    this.savedY=window.scrollY;
    const first=frame.iframe.getBoundingClientRect();
    frame.dialog.close();
    frame.dialog.classList.add('is-fullscreen');
    frame.dialog.setAttribute('role','dialog');
    frame.dialog.setAttribute('aria-modal','true');
    frame.dialog.showModal();
    document.documentElement.style.overflow='hidden';
    document.body.classList.add('installation-open');
    if(frame.motionPaused){
      frame.paused=false;frame.motionPaused=false;
      const pause=frame.dialog.querySelector('[data-action="pause"]');
      pause.textContent='PAUSE';pause.setAttribute('aria-pressed','false');
    }
    this.fit();
    this.setPhase('opening');
    const last=frame.iframe.getBoundingClientRect();
    frame.dialog.querySelector('.installation-close').focus({preventScroll:true});
    this.pending=this.animate(frame,first,last,true).then(()=>{
      this.setPhase('open');
      const ending=frame.dialog.querySelector('.artwork-ending');
      (ending && !ending.hidden ? ending : frame.dialog.querySelector('.installation-close')).focus({preventScroll:true});
    });
    return this.pending;
  }
  close({focus=true}={}) {
    if(!this.frame)return Promise.resolve();
    if(this.closing)return this.closing;
    this.closing=this.finishClose(focus).finally(()=>{this.closing=null;});
    return this.closing;
  }
  async finishClose(focus) {
    if(this.phase==='opening')await this.pending;
    const frame=this.frame;
    if(!frame)return;
    frame.dialog.querySelector('.artwork-tools').open=false;
    this.setPhase('closing');
    // The retained slot never changes size when its dialog enters the top layer.
    const first=frame.section.querySelector('.artwork-slot').getBoundingClientRect();
    const last=frame.iframe.getBoundingClientRect();
    document.body.classList.remove('installation-open');
    await this.animate(frame,first,last,false);
    frame.dialog.close();
    frame.dialog.classList.remove('is-fullscreen');
    frame.dialog.removeAttribute('aria-modal');
    frame.dialog.setAttribute('role','region');
    frame.dialog.setAttribute('open','');
    document.documentElement.style.overflow=this.savedOverflow;
    this.frame=null;
    this.fit();
    window.scrollTo({top:this.savedY,behavior:'instant'});
    this.scroll.setSuspended(false);
    this.setPhase('closed');
    if(focus)frame.trigger.focus({preventScroll:true});
  }
}
