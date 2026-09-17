import { stages } from './exhibition-content.js';
import { healMark } from './heal-mark.js';
import { endings, EndingSequence } from './artwork-endings.js';
import { SectionScroll } from './section-scroll.js';
import { MotionPreference, LivingMotion } from './living-motion.js';
import { introMarkup, briefMarkup, StageIntros } from './stage-intros.js';
import { Installation } from './installation.js';
import { LogoFlight } from './logo-flight.js';
import { UISounds } from './ui-sounds.js';

const initialHash = location.hash.slice(1);
history.scrollRestoration = 'manual';

const keyboardControls = {
  harm: '<button data-action="burn">BURN A PIECE OF COAL</button>',
  exhaust: '<button data-action="pollute">USE FOSSIL ENERGY</button>',
  adapt: '<label>Habitat<select data-habitat>'+Array.from({length:10},(_,i)=>`<option value="${i}">Habitat ${i+1}</option>`).join('')+'</select></label><button data-action="sun">SUPPLY SUN</button><button data-action="wind">SUPPLY WIND</button><button data-action="guide">PLAY GUIDED RECOVERY</button>',
  liven: '<label>Piece<select data-piece><option value="solar">Solar</option><option value="turbine">Wind</option><option value="water">Water</option></select></label><label>Earth slot<select data-slot><option value="solar">Top · solar</option><option value="water">Lower left · water</option><option value="turbine">Lower right · wind</option></select></label><button data-action="place">PLACE PIECE</button><button data-action="clear-waste">REMOVE PLACED WASTE</button>'
};

document.querySelectorAll('[data-heal-mark]').forEach(el => { el.innerHTML = healMark; });
document.querySelector('[data-chapters]').innerHTML = stages.map((stage,i) => `
  <section id="${stage.id}" class="chapter" data-section aria-labelledby="${stage.id}-title">
    <div class="chapter-composition">${introMarkup(stage,i)}
    <dialog open class="chapter-inner" id="${stage.id}-artwork" role="region" aria-labelledby="${stage.id}-artwork-title">
      <div class="installation-surface" aria-hidden="true"></div><button class="installation-close" data-action="close" aria-label="Close fullscreen ${stage.title} artwork">CLOSE <span aria-hidden="true">×</span></button>
      <h2 class="sr-only" id="${stage.id}-artwork-title" tabindex="-1">${stage.title} — interactive artwork</h2>
      <div class="artwork-frame" aria-busy="true">
        <div class="artwork-viewport"><iframe title="${stage.title} — interactive artwork by ${stage.artist}" data-src="artworks/${stage.id}/index.html?exhibition=heal" allow="fullscreen" allowfullscreen tabindex="-1"></iframe></div>
        <div class="artwork-loading" role="status"><strong>${stage.title}</strong><p>Preparing the artwork…</p></div>
        <div class="artwork-error" role="alert" hidden><p>The artwork could not load.</p><button data-action="retry">TRY AGAIN</button><a href="artworks/${stage.id}/index.html">OPEN THE ORIGINAL ARTWORK ↗</a></div>
      </div>
      <details class="artwork-tools"><summary aria-label="Artwork controls" title="Artwork controls"><svg viewBox="0 0 28 28" aria-hidden="true"><path d="M3 5h22v18H3zM7 10h2m4 0h2m4 0h2M7 14h2m4 0h2m4 0h2M8 19h12"/></svg></summary><div class="artwork-tools-panel"><div class="chapter-actions">
        <button data-action="sound" disabled aria-pressed="false">SOUND OFF</button>
        <button data-action="pause" disabled aria-pressed="false">PAUSE</button>
        <button data-action="close">BACK TO CHAPTER ↙</button>

      </div><div class="keyboard-controls">${keyboardControls[stage.id]}<button data-action="reset">RESET</button><button data-action="info">ARTWORK INFO</button><a href="#${stages[i+1]?.id || 'heal'}">CONTINUE ↓</a></div><output aria-live="polite" data-artwork-status></output></div></details>
      <div class="artwork-ending" role="region" aria-labelledby="${stage.id}-ending" aria-describedby="${stage.id}-ending-copy" tabindex="-1" hidden>
        <div class="ending-content"><p id="${stage.id}-ending" class="ending-message"></p><div id="${stage.id}-ending-copy"><p class="ending-subtitle" hidden></p><p class="ending-detail"></p></div></div>
        <div class="ending-actions"><button type="button" data-action="info" data-ending-final>INFORMATION</button><button type="button" data-action="reset" data-ending-final>RESTART</button><button type="button" data-action="continue-ending">CONTINUE</button></div>
      </div>
    </dialog>
    <button class="preview-trigger" aria-label="Open ${stage.title} artwork in fullscreen"><span class="preview-hover-label" aria-hidden="true">CLICK TO EXPERIENCE</span></button>
    </div>${briefMarkup(stage)}</div>
  </section>`).join('');

const sections = [...document.querySelectorAll('[data-section]')];
new UISounds({ sources: {
  hover: new URL('../assets/audio/COMM2754-2026-S4010990-A2w09-Heal-KeyboardReverse.mp3', import.meta.url).href,
  click: new URL('../assets/audio/COMM2754-2026-S4010990-A2w09-Heal-MouseClick.wav', import.meta.url).href
} });
const chrome = [...document.querySelectorAll('[data-chrome]')];
const rail = document.querySelector('.journey-rail');
const railLinks = [...rail.querySelectorAll('a')];
const navLinks = [...document.querySelectorAll('[data-chrome] a[href^="#"]')];
const reduceMotion = new MotionPreference();
const livingMotion = new LivingMotion(reduceMotion);
const stageIntros = new StageIntros(reduceMotion);
const logoFlight = new LogoFlight(reduceMotion, healMark);
const state = { section: 'landing', phase:'editorial', stop:'landing', bounds: [], pending: 0, entered: false, initializing: true, navigation: null, transitioning: false, departure: null };
const frames = new Map(stages.map(stage => {
  const section = document.getElementById(stage.id);
  const paused = reduceMotion.matches;
  if(paused) {
    const control = section.querySelector('[data-action="pause"]');
    control.textContent = 'PLAY ARTWORK';
    control.setAttribute('aria-pressed','true');
  }
  return [stage.id, { section, iframe: section.querySelector('iframe'), loaded: false, ready: false, active: false, paused, motionPaused:paused, muted: true, timeout: 0, resetTimer:0 }];
}));
const sectionScroll = new SectionScroll({ reducedMotion: reduceMotion, onChange: () => {
  update();
} });

const installation = new Installation({frames,preference:reduceMotion,scroll:sectionScroll,fit:measure,onChange:()=>frames.forEach(activity)});
stages.forEach((stage,i)=>{
  const frame=frames.get(stage.id);
  frame.ending=new EndingSequence(frame.section.querySelector('.artwork-ending'),endings[stage.id],reduceMotion,()=>navigate(stages[i+1]?.id || 'heal'));
});

function command(frame, action, detail = {}) {
  if (frame.loaded) frame.iframe.contentWindow?.postMessage({ type: 'heal:command', action, ...detail }, location.origin);
}
function performCommand(frame, action, detail = {}) {
  // A focus-induced settle can suspend rendering between a button press and
  // its delayed action. Deliver explicit controls in order, then restore the
  // lifecycle state so an offscreen canvas never keeps running.
  if(!frame.active) command(frame,'activity',{active:true});
  command(frame,action,detail);
  if(!frame.active) command(frame,'activity',{active:false});
}
function activity(frame) {
  const fullscreen=installation.frame===frame;
  const interactive=fullscreen && installation.phase==='open';
  const mode=fullscreen?'full':state.section===frame.section.id && frame.visible?'preview':'off';
  const active=!document.hidden && mode!=='off' && !frame.paused && (fullscreen || !reduceMotion.matches) && !sectionScroll.isSectionTransitioning;
  if(frame.ready && (frame.active!==active || frame.mode!==mode)) {
    frame.active=active;frame.mode=mode;
    command(frame,'activity',{active,mode});
  }
  frame.iframe.inert=!interactive;
  frame.iframe.tabIndex=interactive?0:-1;
  frame.section.querySelector('.artwork-tools').inert=!interactive;
  frame.section.querySelector('.artwork-ending').inert=!interactive;
  frame.interactive=interactive;
}

function load(frame) {
  if(frame.loaded) return;
  frame.loaded = true;
  frame.iframe.src = frame.iframe.dataset.src;
  frame.timeout = setTimeout(() => {
    if(frame.ready) return;
    frame.section.querySelector('.artwork-loading').hidden = true;
    frame.section.querySelector('.artwork-error').hidden = false;
    frame.section.querySelector('.artwork-frame').setAttribute('aria-busy','false');
  }, 20000);
}
const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if(entry.isIntersecting) load(frames.get(entry.target.closest('.chapter').id));
}), { rootMargin: '150px 0px', threshold: 0 });
frames.forEach(frame => observer.observe(frame.section));

const previewObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
  const frame=frames.get(entry.target.closest('.chapter').id);
  frame.visible=entry.isIntersecting;activity(frame);
}),{threshold:.05});
frames.forEach(frame=>previewObserver.observe(frame.section.querySelector('.artwork-slot')));

function measure() {
  // Each source fits its 1920 × 1080 canvas and DOM controls to this same ratio.
  // Size the actual iframe viewport so browser focus cannot scroll to unscaled UI.
  frames.forEach(frame => {
    const viewport=frame.section.querySelector('.artwork-viewport');
    const scale=Math.min(viewport.clientWidth/1920,viewport.clientHeight/1080);
    viewport.style.setProperty('--art-width',`${1920*scale}px`);
    viewport.style.setProperty('--art-height',`${1080*scale}px`);
  });
  state.bounds = sections.map(section => {
    const rect = section.getBoundingClientRect();
    return { id: section.id, top: rect.top + scrollY, bottom: rect.bottom + scrollY, artwork: frames.has(section.id) };
  });
  const stops=stageIntros.measure(state.bounds,innerHeight);
  logoFlight.measure(state.bounds,innerHeight);
  sectionScroll.measure(stops, innerHeight, document.documentElement.scrollHeight - innerHeight);
  schedule();
}
function update() {
  state.pending = 0;
  const current = sectionScroll.current();
  if(!current)return;
  const chapter=current.chapter || current.id;
  if(installation.frame)return;
  const transitioning = sectionScroll.isSectionTransitioning;
  livingMotion.update(state.bounds,scrollY,innerHeight,sectionScroll);
  stageIntros.update(scrollY);
  logoFlight.update(scrollY);
  const departure=transitioning && sectionScroll.currentSection!==sectionScroll.targetSection ? sectionScroll.at(sectionScroll.currentSection)?.chapter : null;
  if(departure!==state.departure) {
    state.departure=departure;
    frames.forEach(frame => frame.section.classList.toggle('is-departing', departure===frame.section.id));
  }
  if(transitioning!==state.transitioning) {
    state.transitioning=transitioning;
    frames.forEach(activity);
  }
  const entered = scrollY > Math.max(80, state.bounds[1].top - innerHeight * .55);
  if(entered !== state.entered) {
    state.entered = entered;
    document.body.classList.toggle('exhibition-entered', entered);
    chrome.forEach(el => { el.inert = !entered; });
  }
  if(current.id !== state.stop) {
    state.stop=current.id;
    state.phase=current.phase;
    state.section = chapter;
    document.body.dataset.state = chapter;
    document.body.dataset.stagePhase=current.phase;
    document.body.dataset.navTone = frames.get(chapter)?.lightSurface ? 'dark' : 'light';
    navLinks.forEach(link => {
      if(link.hash === '#'+chapter) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    });
    frames.forEach(activity);
  }
  // Active visual emphasis follows the page. History changes only at rest,
  // so intermediate chapters in a long navigation jump don't rewrite the URL.
  if(!state.initializing && !transitioning && sectionScroll.locked===current.id) {
    const url = chapter === 'landing' ? location.pathname + location.search : '#'+chapter;
    if((location.hash.slice(1)||'landing')!==chapter) {
      const push=state.navigation?.id===chapter && state.navigation.push;
      history[push?'pushState':'replaceState'](null,'',url);
    }
    state.navigation=null;
  }
  for(const link of navLinks) {
    const bound=state.bounds.find(bound=>'#'+bound.id===link.hash);
    if(!bound) continue;
    const visible=Math.max(0,Math.min(scrollY+innerHeight,bound.bottom)-Math.max(scrollY,bound.top));
    link.style.setProperty('--chapter-presence',Math.min(1,visible/innerHeight).toFixed(3));
  }
  // Both conclusion stops share the existing rail interval before ABOUT.
  const journey = railLinks.map(link => state.bounds.find(bound => '#'+bound.id === link.hash)).filter(Boolean);
  let position = 0;
  for(let i=0;i<journey.length;i++) {
    if(scrollY >= journey[i].top) {
      const span = (journey[i+1]?.top ?? journey[i].top + innerHeight) - journey[i].top;
      position = i + Math.min(1,Math.max(0,(scrollY - journey[i].top)/span));
    }
  }
  rail.style.setProperty('--progress',Math.min(1,position/(journey.length-1)).toFixed(4));
  railLinks.forEach((link,i) => link.classList.toggle('is-travelled',i < position));
  frames.forEach(activity);
}
let lastShellFrame=0;
function schedule() {
  if(state.pending)return;
  const tick=timestamp=>{
    if(timestamp-lastShellFrame<1000/30){state.pending=requestAnimationFrame(tick);return;}
    lastShellFrame=timestamp-((timestamp-lastShellFrame)%(1000/30));update();
  };
  state.pending=requestAnimationFrame(tick);
}
async function navigate(id, {push = true, focus = true, behavior} = {}) {
  if(installation.frame)await installation.close({focus:false});
  const target = document.getElementById(id);
  if(!target?.matches('[data-section]')) return;
  frames.forEach(frame=>{if(frame.resetTimer)finishRestart(frame);});
  if(!push && sectionScroll.targetSection===id) return;
  state.navigation={id,push};
  if(frames.has(id)) load(frames.get(id));
  document.querySelectorAll('.artwork-tools[open]').forEach(el => { el.open=false; });
  sectionScroll.go(id, { instant: behavior === 'instant', onComplete: () => {
    update();
    if(!focus) return;
    const heading = target.querySelector('h1,h2');
    heading.tabIndex = -1;
    heading.focus({preventScroll:true});
  } });
}
document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if(!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  if(!document.querySelector(link.hash)?.matches('[data-section]')) return;
  event.preventDefault();
  navigate(link.hash.slice(1));
});
window.addEventListener('popstate', () => navigate(location.hash.slice(1)||'landing',{push:false}));
window.addEventListener('hashchange', () => navigate(location.hash.slice(1)||'landing',{push:false}));
window.addEventListener('resize',measure,{passive:true});
document.addEventListener('visibilitychange', () => frames.forEach(activity));
reduceMotion.addEventListener('change', event => {
  frames.forEach(frame => {
    if(event.matches) { frame.motionPaused=!frame.paused; frame.paused=true; }
    else if(frame.motionPaused) {frame.paused=false;frame.motionPaused=false;}
    const button = frame.section.querySelector('[data-action="pause"]');
    button.textContent = frame.paused?'PLAY ARTWORK':'PAUSE';
    button.setAttribute('aria-pressed',String(frame.paused));
    activity(frame);
  });
});
new ResizeObserver(measure).observe(document.querySelector('main'));

function finishRestart(frame) {
  clearTimeout(frame.resetTimer);frame.resetTimer=0;
  performCommand(frame,'reset');
}

frames.forEach(frame => {
  frame.section.querySelector('.artwork-tools').addEventListener('keydown', event => {
    if(event.key!=='Escape') return;
    event.preventDefault();
    installation.close();
  });
  frame.section.addEventListener('click', async event => {
    const button = event.target.closest('button[data-action]');
    if(!button || button.disabled) return;
    const action = button.dataset.action;
    if(action === 'retry') {
      frame.loaded = false; frame.ready = false; frame.active = false;
      clearTimeout(frame.timeout);
      frame.section.querySelector('.artwork-error').hidden = true;
      frame.section.querySelector('.artwork-loading').hidden = false;
      frame.section.querySelector('.artwork-frame').setAttribute('aria-busy','true');
      load(frame); return;
    }
    if(action === 'close') { installation.close(); return; }
    if(action === 'continue-ending') { frame.ending.advance(); return; }
    if(!frame.ready) { load(frame); return; }
    if(action === 'sound') { frame.muted = !frame.muted; command(frame,'mute',{muted:frame.muted}); }
    else if(action === 'pause') {
      frame.paused = !frame.paused;
      frame.motionPaused=false;
      button.textContent = frame.paused ? 'RESUME' : 'PAUSE';
      button.setAttribute('aria-pressed',String(frame.paused));
      activity(frame);
    } else {
      frame.motionPaused=false;
      if(frame.paused) {
        frame.paused=false;
        const pause=frame.section.querySelector('[data-action="pause"]');pause.textContent='PAUSE';pause.setAttribute('aria-pressed','false');activity(frame);
      }
      if(action==='reset' && button.closest('.artwork-ending') && !reduceMotion.matches) {
        if(frame.resetTimer) return;
        const ending=frame.section.querySelector('.artwork-ending');
        ending.classList.add('is-restarting');
        frame.resetTimer=setTimeout(()=>finishRestart(frame),180);
      } else performCommand(frame,action,{habitat:Number(frame.section.querySelector('[data-habitat]')?.value),piece:frame.section.querySelector('[data-piece]')?.value,slot:frame.section.querySelector('[data-slot]')?.value});
      if(action==='reset') frame.section.querySelector('.artwork-tools').open=false;
    }
  });
});
window.addEventListener('message', event => {
  if(event.origin !== location.origin) return;
  const frame = [...frames.values()].find(f => f.iframe.contentWindow === event.source);
  if(!frame) return;
  const data = event.data;
  if(data?.type === 'heal:state') {
    if(!frame.ready) {
      frame.ready = true;
      clearTimeout(frame.timeout);
      frame.section.querySelector('.artwork-loading').hidden = true;
      frame.section.querySelector('.artwork-error').hidden = true;
      frame.section.querySelector('.artwork-frame').setAttribute('aria-busy','false');
      frame.section.querySelectorAll('button').forEach(b=>{b.disabled=false;});
      // Force the first lifecycle message, including for a prefetched frame.
      frame.active = null;
      activity(frame);
      command(frame,'mute',{muted:frame.muted});
    } else if(typeof data.muted === 'boolean' && frame.active) frame.muted=data.muted;
    const sound = frame.section.querySelector('[data-action="sound"]');
    sound.disabled = data.audioAvailable === false;
    sound.textContent = data.audioAvailable === false ? 'SOUND UNAVAILABLE' : frame.muted ? 'SOUND OFF' : 'SOUND ON';
    sound.setAttribute('aria-pressed',String(!frame.muted));
    if(data.audioAvailable === false) sound.title='The six HARM recordings were not included in the supplied package.';
    if(data.status) frame.section.querySelector('[data-artwork-status]').textContent = data.status;
    if(typeof data.background==='string' && CSS.supports('color',data.background)) frame.section.querySelector('.chapter-inner').style.setProperty('--scene-background',data.background);
    frame.lightSurface=Boolean(data.lightSurface);
    if(state.section===frame.section.id) document.body.dataset.navTone=frame.lightSurface?'dark':'light';
    const completionPanel=frame.section.querySelector('.artwork-ending');
    if(data.completed && frame.completed && frame.endingInfoOpen !== Boolean(data.infoOpen)) {
      frame.endingInfoOpen=Boolean(data.infoOpen);
      completionPanel.hidden=frame.endingInfoOpen;
      if(frame.endingInfoOpen && installation.frame===frame) frame.iframe.focus();
      if(!frame.endingInfoOpen && installation.frame===frame) completionPanel.querySelector('[data-action="info"]').focus({preventScroll:true});
    }
    if(data.completed && !frame.completed) {
      frame.completed=true;
      const ending=frame.section.querySelector('.artwork-ending');
      ending.hidden=false;
      measure();
      if(installation.frame===frame) {
        frame.section.querySelector('.artwork-tools').open=false;
        document.querySelector('[data-announcement]').textContent=`${frame.section.id.toUpperCase()} complete. ${endings[frame.section.id][0].message}`;
        ending.focus({preventScroll:true});
      }
    }
    if(!data.completed) {
      if(frame.completed)frame.ending.reset();
      const ending=frame.section.querySelector('.artwork-ending');
      if(ending.contains(document.activeElement)) frame.section.querySelector('.chapter-inner h2').focus({preventScroll:true});
      ending.hidden=true;
      ending.classList.remove('is-restarting');
      frame.completed=false;
    }
  } else if(data?.type === 'heal:interact' && installation.frame===frame) {
    frame.paused=false;
    frame.motionPaused=false;
    const pause=frame.section.querySelector('[data-action="pause"]');
    pause.textContent='PAUSE';pause.setAttribute('aria-pressed','false');activity(frame);
  } else if(data?.type === 'heal:resume') {
    // A cached iframe may restore after the parent pageshow event. Handshake
    // again so the current visibility, pause and fullscreen state always wins.
    frame.active=null;
    activity(frame);
  } else if(data?.type === 'heal:escape') {
    if(installation.frame===frame)installation.close();
  } else if(data?.type === 'heal:wheel' && Number.isFinite(data.deltaY)) {
    if(!installation.frame)sectionScroll.relayWheel(data.deltaY);
  } else if(data?.type === 'heal:key' && installation.frame===frame) {
    // Page-scroll keys cannot move the catalogue behind an installation.
  } else if(data?.type === 'adapt:continue' && installation.frame===frame) navigate('liven');
});
window.addEventListener('pagehide',()=>frames.forEach(frame=>{
  command(frame,'activity',{active:false,mode:'off'});
  frame.active=null;
}));
window.addEventListener('pageshow',event=>{
  if(!event.persisted)return;
  measure();
  frames.forEach(frame=>{frame.active=null;activity(frame);});
});
measure();
requestAnimationFrame(()=>{
  state.initializing=false;
  if(initialHash) navigate(initialHash,{push:false,focus:false,behavior:'instant'});
  else update();
});
document.fonts.ready.then(measure);


