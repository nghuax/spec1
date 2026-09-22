/* Same-origin integration: each p5 sketch keeps its own state and controls. */
(() => {
  if (parent===window || new URLSearchParams(location.search).get('gallery')!=='heal') return;
  const stage=location.pathname.split('/').at(-2);
  let last='',ready=false;
  function state() {
    if(!document.querySelector('canvas')) return null;
    if(stage==='harm' && window.HarmSound) return {muted:HarmSound.muted,completed:false};
    if(stage==='exhaust' && typeof projectMuted!=='undefined' && ambienceButton) return {muted:projectMuted,completed:false};
    if(stage==='adapt' && typeof audioMuted!=='undefined') return {muted:audioMuted,completed:document.body.dataset.completed==='true'};
    if(stage==='liven' && typeof renewableCount==='function' && window.livenUI) return {muted:soundMuted,completed:earthIsRestored()};
    return null;
  }
  function publish() {
    const value=state();if(!value) return;
    ready=true;const payload={type:'heal:state',stage,...value};const encoded=JSON.stringify(payload);
    if(encoded!==last) {last=encoded;parent.postMessage(payload,location.origin);}
  }
  function setMute(value) {
    if(stage==='harm') HarmSound.setMuted(value);
    if(stage==='exhaust' && projectMuted!==value) toggleProjectMute();
    if(stage==='adapt' && audioMuted!==value) window.dispatchEvent(new CustomEvent('adapt:command',{detail:{action:'sound'}}));
    if(stage==='liven' && soundMuted!==value) {toggleSoundMute();livenUI.sync();}
  }
  window.addEventListener('message',event=>{
    if(!ready || event.source!==parent || event.origin!==location.origin || event.data?.type!=='heal:command') return;
    const {action}=event.data;
    if(action==='mute' && typeof event.data.muted==='boolean') setMute(event.data.muted);
    else if(action==='reset') {
      if(stage==='harm') document.getElementById('reset-ui')?.click();
      if(stage==='exhaust') regenerateArtwork();
      if(stage==='adapt') window.dispatchEvent(new CustomEvent('adapt:command',{detail:{action:'reset'}}));
      if(stage==='liven') document.getElementById('reset-button')?.click();
    } else if(action==='mix') {
      if(stage==='exhaust') openSoundMixer();
      else document.getElementById('sound-button')?.click();
    }
    publish();
  });
  const interval=setInterval(publish,250);
  window.addEventListener('pagehide',()=>clearInterval(interval),{once:true});
  publish();
})();
