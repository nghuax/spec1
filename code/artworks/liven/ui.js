/* Shared HEAL interface: ADAPT paper assets and Stack Sans Notch typography. */
(() => {
  const shell = `<svg class="button-shell" viewBox="0 0 169 159.523" aria-hidden="true"><path d="M42.6449 33.1682L169 0V159.523H42.6449V33.1682Z" fill="white"/><path d="M36.9589 28.7458H163.314V155.101H7.26542L36.9589 28.7458Z" fill="black"/><path d="M0 19.585H152.258L141.5 132L28.7221 145.624L0 19.585Z" fill="currentColor"/></svg>`;
  const icons = {
    sound: '<path d="M3 12h6l7-7v22l-7-7H3Z" fill="currentColor" stroke="none"/><path d="M21 10c4 3 4 9 0 12m5-17c7 6 7 16 0 22"/>',
    muted: '<path d="M3 12h6l7-7v22l-7-7H3Z" fill="currentColor" stroke="none"/><path d="m22 12 8 8m0-8-8 8"/>',
    reset: '<path d="M6 12a11 11 0 1 1 0 9M6 4v8h8"/>',
    info: '<path d="M13 3h6l-1 18h-4Z M13 25h6v6h-6Z" fill="currentColor" stroke="none"/>',
    close: '<path d="m8 8 16 16m0-16L8 24"/>'
  };
  const icon = name => `<svg class="control-icon" viewBox="0 0 32 32" aria-hidden="true">${icons[name]}</svg>`;
  const button = (id, name, label) => `<button id="${id}" class="icon-button" type="button" aria-label="${label}" data-tooltip="${label}">${shell}${icon(name)}</button>`;
  const root = document.createElement('div');
  root.id = 'liven-ui';
  root.innerHTML = `
    <div class="badge" aria-label="STAGE 4 · LIVEN">
      <img class="badge-back" src="assets/figma-ui/title-layer-back.svg" alt="">
      <img class="badge-middle" src="assets/figma-ui/title-layer-middle.svg" alt="">
      <img class="badge-front" src="assets/figma-ui/title-layer-front.svg" alt="">
      <span class="badge-stage">STAGE 4</span><span class="badge-title">LIVEN</span>
    </div>
    <section class="recovery-status" aria-label="Earth recovery">
      <div class="recovery-heading"><span>EARTH RECOVERY</span><strong id="recovery-value">0%</strong></div>
      <progress id="recovery-progress" max="3" value="0" aria-label="Renewable energy pieces placed"></progress>
      <p>Bring solar, wind and water back to Earth.</p>
    </section>
    <div class="subtitle" aria-live="polite"><img class="subtitle-shadow" src="assets/figma-ui/subtitle-shadow.svg" alt=""><img class="subtitle-frame" src="assets/figma-ui/subtitle-frame.svg" alt=""><img class="subtitle-panel" src="assets/figma-ui/subtitle-panel.svg" alt=""><p id="story-text"></p></div>
    <div class="utility-controls" role="group" aria-label="Sound, reset and information">
      ${button('sound-button', 'sound', 'Sound control panel')}
      ${button('reset-button', 'reset', 'Reset and replay · R')}
      ${button('info-button', 'info', 'Project information · I')}
    </div>
    <section id="sound-panel" class="sound-panel" hidden role="dialog" aria-labelledby="sound-title">
      <header><h2 id="sound-title">SOUND MIX</h2><button id="sound-close" class="plain-close" aria-label="Close sound control panel">${icon('close')}</button></header>
      <div class="sound-rows">${SOUND_DEFINITIONS.map(s => `<div class="sound-row"><label for="mix-${s.key}" title="Recommended: ${s.recommended}%">${s.label.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())} <span>(${s.recommended}%)</span></label><input id="mix-${s.key}" data-key="${s.key}" type="range" min="0" max="100" value="${s.level}" aria-label="${s.label} volume"><output for="mix-${s.key}">${s.level}%</output></div>`).join('')}</div>
      <footer><button id="sound-mute" type="button" aria-pressed="false" aria-keyshortcuts="M" title="Mute sound · M">${icon('sound')}<span>MUTE</span></button><button id="sound-recommended" type="button">USE RECOMMENDED</button></footer>
    </section>`;
  document.body.append(root);
  const info = document.createElement('dialog');
  info.className = 'info-popover';
  info.id = 'info-popover';
  info.setAttribute('aria-labelledby', 'info-title');
  info.innerHTML = `<header><h2 id="info-title">ABOUT LIVEN</h2>${button('info-close', 'close', 'Close information')}</header>
    ${livenInformationContent()}`;
  document.body.append(info);
  const $ = id => document.getElementById(id);
  const sound = $('sound-panel');
  $('sound-button').setAttribute('aria-controls', 'sound-panel');
  $('info-button').setAttribute('aria-controls', 'info-popover');
  function cancelDrag() {
    if (dragging) { dragging.dragging = false; returnPieceToOrbit(dragging); dragging = null; }
  }
  function toggleInfo() { cancelDrag(); infoOpen = !infoOpen; soundPanelOpen = false; sync(); }
  $('sound-button').onclick = () => { cancelDrag(); soundPanelOpen = !soundPanelOpen; infoOpen = false; sync(); if (soundPanelOpen) $('sound-close').focus(); };
  $('sound-close').onclick = () => { soundPanelOpen = false; sync(); $('sound-button').focus(); };
  $('info-button').onclick = toggleInfo;
  $('info-close').onclick = () => { infoOpen = false; sync(); };
  $('reset-button').onclick = () => { stopAllSounds(); regenerateScene(); infoOpen = soundPanelOpen = false; sync(); };
  $('sound-mute').onclick = () => { toggleSoundMute(); sync(); };
  $('sound-recommended').onclick = () => { useRecommendedMix(); sync(); };
  sound.querySelectorAll('input').forEach(input => {
    const channel = SOUND_DEFINITIONS.find(s => s.key === input.dataset.key);
    input.oninput = () => { channel.level = Number(input.value); const audio = soundEffects[channel.key]; if (audio) audio.volume = channel.level / 100; sync(); };
    input.onchange = () => playSound(channel.key);
  });
  info.addEventListener('cancel', event => { event.preventDefault(); infoOpen = false; sync(); });
  info.addEventListener('click', event => {
    const r = info.getBoundingClientRect();
    if (event.target === info && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) { infoOpen = false; sync(); }
  });
  document.addEventListener('pointerdown', event => {
    if (soundPanelOpen && !sound.contains(event.target) && !$('sound-button').contains(event.target)) { soundPanelOpen = false; sync(); }
  });
  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
    const k = event.key.toLowerCase();
    if (k === 'f') {
      event.preventDefault();
      const change = document.fullscreenElement
        ? document.exitFullscreen?.()
        : document.documentElement.requestFullscreen?.();
      change?.catch(() => { /* Browser full-screen controls remain available. */ });
      return;
    }
    if (k === '!' || (document.activeElement?.matches('button, input') && ['i', 'r', 'm', 'escape', 's'].includes(k))) {
      event.preventDefault();
      if (k === 'i' || k === '!') toggleInfo();
      if (k === 'm') toggleSoundMute();
      if (k === 'r') $('reset-button').click();
      if (k === 's') saveCanvas(`Liven-${sceneSeed}`, 'png');
      if (k === 'escape') { infoOpen = soundPanelOpen = false; }
      sync();
    }
  });
  let lastStory = '';
  function sync() {
    const count = renewableCount();
    $('recovery-progress').value = count;
    $('recovery-value').textContent = `${Math.round(count / 3 * 100)}%`;
    const story = storyMessages[storyIndex];
    if (story !== lastStory) { $('story-text').textContent = story; lastStory = story; }
    const openingSoundPanel = sound.hidden && soundPanelOpen;
    sound.hidden = !soundPanelOpen;
    if (openingSoundPanel) positionSoundPanel();
    $('sound-button').setAttribute('aria-expanded', String(soundPanelOpen));
    $('info-button').setAttribute('aria-expanded', String(infoOpen));
    $('sound-mute').querySelector('span').textContent = soundMuted ? 'UNMUTE' : 'MUTE';
    const muteIcon = $('sound-mute').querySelector('.control-icon');
    if (muteIcon.dataset.muted !== String(soundMuted)) { muteIcon.innerHTML = icons[soundMuted ? 'muted' : 'sound']; muteIcon.dataset.muted = String(soundMuted); }
    $('sound-mute').title = soundMuted ? 'Unmute sound · M' : 'Mute sound · M';
    $('sound-mute').setAttribute('aria-pressed', String(soundMuted));
    const soundIcon = $('sound-button').querySelector('.control-icon');
    if (soundIcon.dataset.muted !== String(soundMuted)) { soundIcon.innerHTML = icons[soundMuted ? 'muted' : 'sound']; soundIcon.dataset.muted = String(soundMuted); }
    SOUND_DEFINITIONS.forEach(s => { const input = $(`mix-${s.key}`); input.value = s.level; input.nextElementSibling.value = `${s.level}%`; });
    if (infoOpen && !info.open) { cancelDrag(); info.showModal(); $('info-close').focus(); }
    if (!infoOpen && info.open) { info.close(); $('info-button').focus(); }
  }
  function positionSoundPanel() {
    const rail = root.querySelector('.utility-controls');
    const button = $('sound-button');
    const buttonBottom = rail.offsetTop + button.offsetTop + button.offsetHeight;
    sound.style.bottom = `${root.clientHeight - buttonBottom}px`;
    sound.style.maxHeight = `${Math.max(0, buttonBottom - 16)}px`;
  }
  function resize() {
    root.style.width = `${innerWidth}px`;
    root.style.height = `${innerHeight}px`;
    positionSoundPanel();
  }
  window.addEventListener('resize', resize);
  resize();
  window.livenUI = { sync };
  if (new URLSearchParams(window.location.search).get('info') === 'open') {
    infoOpen = true;
    sync();
  }
})();
