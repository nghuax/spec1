// Exact exhibition copy. Source artworks still own completion and reset.
export const endings = {
  harm: [{ message: 'Your air has been polluted', detail: 'Overuse fossil energy cause air pollution' }],
  exhaust: [{ message: 'There is nothing left', detail: 'Pollution has destroyed resources' }],
  adapt: [{ message: 'Reforming the environment', detail: 'The cleaner world begins' }],
  liven: [
    { message: 'Life returns.', subtitle: 'You made it possible.', detail: 'You restored the planet by choosing cleaner sources of energy.\nOne action changed the whole world.' },
    { message: 'Keep the change alive.', subtitle: 'Support local renewable projects, choose cleaner energy,\nand encourage others around you to do the same.', detail: "Let's support renewable energy in your community." },
    { message: 'Now, take it beyond the screen.', subtitle: 'Renewable energy does not grow through technology alone.\nIt grows when communities choose to support it.', detail: 'Your next move can happen in real world.' }
  ]
};

export class EndingSequence {
  constructor(panel, pages, preference, continueJourney) {
    Object.assign(this, {panel, pages, preference, continueJourney});
    this.index=0; this.busy=false; this.generation=0;
    this.content=panel.querySelector('.ending-content');
    panel.classList.toggle('ending-sequence',pages.length>1);
    this.button=panel.querySelector('[data-action="continue-ending"]');
    this.render();
  }
  render() {
    const page=this.pages[this.index];
    const final=this.index===this.pages.length-1;
    this.panel.querySelectorAll('[data-ending-final]').forEach(button=>{button.hidden=!final;});
    this.button.textContent=final?'NEXT':'CONTINUE';
    this.panel.querySelector('.ending-message').textContent=page.message;
    const subtitle=this.panel.querySelector('.ending-subtitle');
    subtitle.textContent=page.subtitle || ''; subtitle.hidden=!page.subtitle;
    this.panel.querySelector('.ending-detail').textContent=page.detail;
  }
  reset() {
    this.generation++; this.animation?.cancel();
    this.index=0; this.busy=false; this.button.removeAttribute('aria-disabled');
    this.render();
  }
  async fade(frames, duration) {
    this.animation=this.content.animate(frames,{duration:this.preference.matches?0:duration,easing:'cubic-bezier(.22,.7,.2,1)',fill:'both'});
    await this.animation.finished.catch(()=>{});
  }
  async advance() {
    if(this.busy)return;
    this.busy=true; this.button.setAttribute('aria-disabled','true');
    const generation=this.generation;
    try {
      if(this.index===this.pages.length-1) { await this.continueJourney(); return; }
      await this.fade([{opacity:1,translate:'0 0'},{opacity:0,translate:'0 -6px'}],140);
      if(generation!==this.generation)return;
      this.animation.cancel(); this.index++; this.render();
      await this.fade([{opacity:0,translate:'0 6px'},{opacity:1,translate:'0 0'}],220);
      if(generation!==this.generation)return;
      this.animation.cancel();
      this.panel.focus({preventScroll:true});
    } finally {
      if(generation===this.generation){this.busy=false;this.button.removeAttribute('aria-disabled');}
    }
  }
}
