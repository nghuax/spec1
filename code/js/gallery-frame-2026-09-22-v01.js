// Messages are accepted only from this artwork on the same origin.
export function setupGalleryFrame(host,stage,src) {
  const frame=host.querySelector('[data-gallery-frame]');
  const iframe=host.querySelector('[data-gallery-iframe]');
  const loader=host.querySelector('[data-gallery-loading]');
  const error=host.querySelector('[data-gallery-error]');
  const mute=host.querySelector('[data-gallery-mute]');
  const mix=host.querySelector('[data-gallery-mix]');
  const reset=host.querySelector('[data-gallery-reset]');
  const conclusion=host.querySelector('[data-journey-complete]');
  let timer,ready=false,dismissed=false,muted=false;
  try { muted=sessionStorage.getItem('heal:muted')==='true'; } catch {}
  function command(action,extra={}) { if(ready) iframe.contentWindow.postMessage({type:'heal:command',action,...extra},location.origin); }
  function syncSound(value) {
    muted=value;mute.textContent=muted?'SOUND OFF':'SOUND ON';
    mute.setAttribute('aria-pressed',String(muted));
    mute.setAttribute('aria-label',muted?'Unmute artwork sound':'Mute artwork sound');
    try {sessionStorage.setItem('heal:muted',String(muted));} catch {}
  }
  function showError() {clearTimeout(timer);loader.hidden=true;error.hidden=false;frame.setAttribute('aria-busy','false');}
  function start() {
    clearTimeout(timer);ready=false;dismissed=false;conclusion.hidden=true;
    [mute,mix,reset].forEach(b=>b.disabled=true);
    loader.hidden=false;error.hidden=true;frame.setAttribute('aria-busy','true');
    timer=setTimeout(showError,20000);iframe.src=src;
  }
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin || event.source!==iframe.contentWindow || event.data?.stage!==stage.id || event.data?.type!=='heal:state') return;
    const state=event.data;
    if(!ready) {
      ready=true;clearTimeout(timer);loader.hidden=true;error.hidden=true;frame.setAttribute('aria-busy','false');
      [mute,mix,reset].forEach(b=>b.disabled=false);command('mute',{muted});
    } else syncSound(Boolean(state.muted));
    if(stage.id==='liven') {
      if(!state.completed) dismissed=false;
      conclusion.hidden=!state.completed || dismissed;
    }
  });
  iframe.addEventListener('error',showError);
  host.querySelector('[data-gallery-retry]').addEventListener('click',start);
  mute.addEventListener('click',()=>{syncSound(!muted);command('mute',{muted});});
  mix.addEventListener('click',()=>{command('mix');iframe.focus();});
  reset.addEventListener('click',()=>{dismissed=false;conclusion.hidden=true;command('reset');});
  host.querySelector('[data-gallery-fullscreen]').addEventListener('click',async()=>{try {await iframe.requestFullscreen();} catch {location.assign(src);}});
  host.querySelector('[data-dismiss-completion]').addEventListener('click',()=>{dismissed=true;conclusion.hidden=true;host.querySelector('[rel="next"]').focus();});
  syncSound(muted);start();
}
