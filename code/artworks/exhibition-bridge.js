/* A same-origin adapter. Source sketches keep their own global p5 worlds. */
(() => {
  if(parent === window || new URLSearchParams(location.search).get('exhibition') !== 'heal') return;
  const stage=location.pathname.split('/').at(-2);
  document.body.dataset.healEmbedded='true';
  document.body.dataset.healMode='off';
  let ready=false,active=false,wantedMute=true,last='',timer=0,status='',mode='off';
  const emit = data => parent.postMessage(data,location.origin);
  const adaptCommand = (action,extra={}) => window.dispatchEvent(new CustomEvent('adapt:command',{detail:{action,...extra}}));
  function sceneBackground() {
    // Match the source palette in unused viewport space, including behind the nav.
    if(typeof color!=='function') return undefined;
    if(stage==='exhaust') return '#141414';
    if(stage==='liven') return C.bg;
    if(stage==='adapt') return lerpColor(color(damagedField?.base||'#C87629'),color(restoredField?.palette.base||'#07152F'),smoothClamp(globalRecovery,.08,.92)).toString();
    const p=pollutionN();
    return (p<.4?lerpColor(color(C.skyClean),color(C.skyMid),smooth01(p/.4))
      :lerpColor(color(C.skyMid),color(C.skyDirty),smooth01((p-.4)/.6))).toString();
  }
  function mute(value) {
    if(stage==='harm') window.HarmSound?.setMuted(value);
    if(stage==='exhaust' && projectMuted!==value) toggleProjectMute();
    if(stage==='adapt' && audioMuted!==value) adaptCommand('sound');
    if(stage==='liven' && soundMuted!==value) {toggleSoundMute();window.livenUI?.sync();}
  }
  function setActive(value, nextMode='full') {
    mode=nextMode;
    document.body.dataset.healMode=mode;
    if(typeof frameRate==='function')frameRate(mode==='preview'?24:stage==='liven'?30:60);
    active=value;document.body.dataset.healActive=String(value);
    if(!value) {
      if(typeof noLoop==='function') noLoop();
      if(stage==='harm') {dragState=null;HarmSound?.stopAll();}
      if(stage==='exhaust') stopActiveProjectSounds();
      if(stage==='liven') {if(dragging){dragging.dragging=false;returnPieceToOrbit(dragging);dragging=null;}stopAllSounds();}
      if(stage==='adapt') {dragging=false;audioContext?.suspend().catch(()=>{});}
      mute(true);
    } else {
      mute(mode==='preview'?true:wantedMute);
      if(typeof loop==='function') loop();
      if(stage==='adapt' && mode==='full' && !wantedMute && audioEnabled) audioContext?.resume().catch(()=>{});
    }
    publish(true);
  }
  function publish(force=false) {
    if(!ready) return;
    const muted=stage==='harm'?window.HarmSound.muted:stage==='exhaust'?projectMuted:stage==='adapt'?audioMuted:soundMuted;
    if(active && mode!=='preview') wantedMute=muted;
    // Follow the supplied source completion flags, never a proxy click count.
    const completed=stage==='harm'?completionShown && pollution>=99.5
      :stage==='exhaust'?artworkComplete
      :stage==='adapt'?document.body.dataset.completed==='true'&&globalRecovery>=1
      :stage==='liven'?earthIsRestored():false;
    const progress=stage==='harm'?`${burnCount} coal pieces burned.`:stage==='exhaust'?`Environment damage: ${Math.floor(displayedEnvironmentProgress*100)}%.`:stage==='adapt'?`Field recovery: ${Math.round(globalRecovery*100)}%.`:`Earth recovery: ${Math.round(renewableCount()/3*100)}%.`;
    const background=sceneBackground();
    const paint=background?color(background):null;
    // Public accessors work in both p5 1.x and EXHAUST's p5 2.x.
    const channels=paint?[red(paint),green(paint),blue(paint)].map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}):[0,0,0];
    const lightSurface=channels[0]*.2126+channels[1]*.7152+channels[2]*.0722>.179;
    const infoOpen=stage==='exhaust'?informationPanelOpen:document.getElementById(stage==='harm'?'info-ui':'info-button')?.getAttribute('aria-expanded')==='true';
    const data={type:'heal:state',infoOpen,stage,muted:wantedMute,completed,background,lightSurface,audioAvailable:true,status:status?`${status} ${progress}`:progress,active};
    const encoded=JSON.stringify(data);
    if(force||encoded!==last){last=encoded;emit(data);}
  }
  function perform(data) {
    status='';
    if(data.action==='burn' && stage==='harm') {
      if(coal.length) fractureCoal(0,consumeDemandTarget()||chooseTarget());
    } else if(data.action==='pollute' && stage==='exhaust') {
      launchFossilParticles();
    } else if(['sun','wind'].includes(data.action)&&stage==='adapt') {
      const habitat=modules[data.habitat];
      if(habitat){experienceMode='manual';selectEnergyTool(data.action);applyEnergy(data.action,habitat.x,habitat.y,24,0);publishProgress(true);}
    } else if(data.action==='guide'&&stage==='adapt') adaptCommand('start');
    else if(data.action==='place'&&stage==='liven') {
      const piece=renewablePieces.find(p=>p.kind===data.piece&&!p.placed);
      const slot=renewableSlots.find(s=>s.kind===data.slot);
      if(piece&&slot){
        const pos=earthDisplayPoint(slot.x,slot.y);piece.x=pos.x;piece.y=pos.y;
        if(piece.kind===slot.kind) tryRenewableDrop(piece);
        if(!piece.placed){returnPieceToOrbit(piece);status='Choose the matching slot for this energy source.';}
        else status='Clean-energy piece placed.';
      } else status='That clean-energy piece is already placed.';
    } else if(data.action==='clear-waste'&&stage==='liven') {
      for(const slot of trashSlots)if(slot.occupied){const p=earthDisplayPoint(slot.x,slot.y);removePlacedTrash(p);}
    } else if(data.action==='reset') {
      if(stage==='harm') resetScene();
      if(stage==='exhaust') regenerateArtwork();
      if(stage==='adapt') adaptCommand('reset');
      if(stage==='liven'){stopAllSounds();regenerateScene();window.livenUI?.sync();}
    } else if(data.action==='info') {
      if(stage==='harm') document.getElementById('info-ui')?.click();
      if(stage==='exhaust') setInformationPanelOpen(!informationPanelOpen);
      if(stage==='adapt'||stage==='liven') document.getElementById('info-button')?.click();
    }
    publish(true);
  }
  window.addEventListener('message',event=>{
    if(!ready||event.origin!==location.origin||event.source!==parent||event.data?.type!=='heal:command') return;
    const data=event.data;
    if(data.action==='activity' && typeof data.active==='boolean') setActive(data.active,['full','preview','off'].includes(data.mode)?data.mode:'full');
    else if(data.action==='mute' && typeof data.muted==='boolean'){wantedMute=data.muted;mute(active && mode!=='preview'?wantedMute:true);publish(true);}
    else if(active && mode==='full') perform(data);
  });
  // Record panel ownership before a source handler closes its dialog. Otherwise
  // the same Escape can dismiss both an artwork panel and the installation.
  const panelEscapes=new WeakSet();
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    const panel=[...document.querySelectorAll('dialog[open],[role="dialog"]')].some(element=>{
      const style=getComputedStyle(element);
      return !element.hidden && style.display!=='none' && style.visibility!=='hidden';
    });
    const infoVisible=stage==='exhaust'?informationPanelOpen:document.getElementById(stage==='harm'?'info-ui':'info-button')?.getAttribute('aria-expanded')==='true';
    if(panel || infoVisible)panelEscapes.add(event);
  },true);
  document.addEventListener('keydown',event=>{
    if(event.defaultPrevented || panelEscapes.has(event))return;
    if(event.key==='Escape' && !document.querySelector('dialog[open]')) emit({type:'heal:escape'});
    else if(['PageDown','PageUp','ArrowDown','ArrowUp',' ','Home','End'].includes(event.key)
      && !event.ctrlKey && !event.metaKey && !event.altKey && !document.querySelector('dialog[open]')
      && !event.target.closest('input,select,textarea,button,a,summary,[contenteditable],[role="dialog"],[role="slider"]')) {
      event.preventDefault();emit({type:'heal:key',key:event.key,shiftKey:event.shiftKey});
    }
    else if(!active && !['Tab','Shift','Control','Alt','Meta'].includes(event.key)) emit({type:'heal:interact'});
  });
  // With reduced motion, deliberate interaction starts the paused current artwork.
  // Offscreen iframes are inert in the parent and cannot initiate this message.
  document.addEventListener('pointerdown',()=>{if(!active)emit({type:'heal:interact'});},true);
  // Only actual vertical wheel input is relayed. Canvas drags/touch gestures
  // stay in the original artwork; keyboard scroll keys escape a non-scrolling iframe.
  window.addEventListener('wheel',event=>{
    if(mode==='full')return; // The installation owns its wheel input; never scroll the catalogue.
    if(event.ctrlKey||event.metaKey||Math.abs(event.deltaX)>Math.abs(event.deltaY)||document.querySelector('dialog[open]')||event.target.closest('input,select,textarea,[contenteditable],[role="dialog"],[role="slider"]')) return;
    event.preventDefault();emit({type:'heal:wheel',deltaY:event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1)});
  },{passive:false});
  function boot() {
    if(!document.querySelector('canvas')||typeof frameCount==='undefined'||frameCount<1){timer=setTimeout(boot,80);return;}
    ready=true;
    if(stage==='exhaust') {
      fossilEnergyButton.elt.addEventListener('click',event=>{if(event.detail===0)launchFossilParticles();});
      informationButton.elt.addEventListener('click',event=>{if(event.detail===0)setInformationPanelOpen(!informationPanelOpen);});
    }
    setActive(false,'off');
    startPublishing();
  }
  function startPublishing() {
    clearInterval(timer);
    timer=setInterval(()=>{if(active)publish();},500);
  }
  window.addEventListener('pagehide',()=>{
    clearTimeout(timer);clearInterval(timer);
    if(ready)setActive(false,'off');
  });
  window.addEventListener('pageshow',event=>{
    if(!event.persisted)return;
    if(!ready){boot();return;}
    startPublishing();
    emit({type:'heal:resume'});
  });
  boot();
})();
