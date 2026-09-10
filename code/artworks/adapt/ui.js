(() => {
  const infoButton = document.getElementById('info-button');
  const infoPopover = document.getElementById('info-popover');
  const infoClose = document.getElementById('info-close');
  const subtitle = document.getElementById('state-subtitle');
  const subtitleText = document.getElementById('state-subtitle-text');
  const controls = document.getElementById('artwork-controls');
  const toolButtons = Array.from(document.querySelectorAll('[data-command="tool"]'));
  const soundButton = document.getElementById('sound-button');
  const soundPanel = document.getElementById('sound-panel');
  const soundClose = document.getElementById('sound-close');
  const soundMute = document.getElementById('sound-mute');
  const mixRows = document.getElementById('sound-mix-rows');
  SOUND_MIX_CHANNELS.forEach(({ id, label, recommended }) => {
    const row = document.createElement('div');
    row.className = 'sound-mix-row';
    row.innerHTML = `<label for="mix-${id}">${label} <span>(${recommended}%)</span></label><input id="mix-${id}" type="range" min="0" max="100" step="1" value="${recommended}" aria-valuetext="${recommended} percent"><output for="mix-${id}">${recommended}%</output>`;
    const slider = row.querySelector('input');
    const output = row.querySelector('output');
    slider.addEventListener('input', () => {
      output.textContent = `${slider.value}%`;
      slider.setAttribute('aria-valuetext', `${slider.value} percent`);
      command('mix', { channel: id, level: Number(slider.value) });
    });
    slider.addEventListener('change', () => command('mix-preview', { channel: id }));
    mixRows.append(row);
  });

  const soundIsOpen = () => soundPanel.matches(':popover-open');
  function positionSoundPanel() {
    if (!soundIsOpen()) return;
    const stage = document.getElementById('artwork-stage').getBoundingClientRect();
    const stack = document.querySelector('.utility-controls').getBoundingClientRect();
    // Anchor to the resting button box, independent of hover/focus transforms.
    const button = {
      left: stack.left + soundButton.offsetLeft,
      top: stack.top + soundButton.offsetTop,
      height: soundButton.offsetHeight,
      bottom: stack.top + soundButton.offsetTop + soundButton.offsetHeight
    };
    const gap = 12;
    const available = Math.max(1, button.left - stage.left - gap - 12);
    soundPanel.style.width = `${Math.min(260, available)}px`;
    const portrait = window.matchMedia('(max-width: 700px) and (min-height: 430px)').matches;
    const targetHeight = Math.min(button.bottom - stage.top - 12, Math.max(portrait ? 320 : 230, stack.height + 80));
    soundPanel.style.setProperty('--sound-height', `${targetHeight}px`);
    const height = soundPanel.getBoundingClientRect().height;
    const top = button.bottom - height;
    soundPanel.style.left = `${button.left - gap - Math.min(260, available)}px`;
    soundPanel.style.top = `${top}px`;
    soundPanel.style.setProperty('--sound-pointer-top', `${Math.max(16, Math.min(height - 16, button.top + button.height / 2 - top))}px`);
  }
  function setSoundOpen(open, returnFocus = true) {
    if (open && !soundIsOpen()) {
      setInfoOpen(false);
      document.body.classList.add('sound-is-open');
      soundButton.setAttribute('aria-expanded', 'true');
      soundPanel.showPopover();
      positionSoundPanel();
      soundMute.focus({ preventScroll: true });
    } else if (!open && soundIsOpen()) {
      soundPanel.hidePopover();
      document.body.classList.remove('sound-is-open');
      soundButton.setAttribute('aria-expanded', 'false');
      if (returnFocus) soundButton.focus({ preventScroll: true });
    }
  }
  new ResizeObserver(positionSoundPanel).observe(document.getElementById('artwork-stage'));
  window.addEventListener('resize', positionSoundPanel);
  soundClose.addEventListener('click', () => setSoundOpen(false));
  soundMute.addEventListener('click', () => command('sound'));
  document.addEventListener('pointerdown', (event) => {
    if (soundIsOpen() && !soundPanel.contains(event.target) && !soundButton.contains(event.target)) setSoundOpen(false, false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && soundIsOpen()) {
      event.preventDefault(); setSoundOpen(false);
    }
  });
  soundPanel.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'm' && !event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault(); command('sound');
    }
  });
  document.getElementById('sound-recommended').addEventListener('click', () => {
    command('mix-reset');
    SOUND_MIX_CHANNELS.forEach(({ id, recommended }) => {
      const slider = document.getElementById(`mix-${id}`);
      slider.value = recommended;
      slider.setAttribute('aria-valuetext', `${recommended} percent`);
      slider.nextElementSibling.textContent = `${recommended}%`;
    });
  });
  const statusText = document.getElementById('interaction-status');
  const announcement = document.getElementById('artwork-announcement');
  const completionCopy = 'A connected clean-energy network is ready';
  const subtitleCopy = {
    1: 'Balance clean energy to clear pollution and restore life',
    2: completionCopy
  };
  const embedded = window.parent !== window;
  document.body.dataset.embedded = String(embedded);
  const meters = ['sun', 'wind', 'recovery'].map((name) => ({
    name,
    bar: document.getElementById(`${name}-progress`),
    value: document.getElementById(`${name}-value`)
  }));
  let subtitleTimer;
  let announcementTimer;
  let previousAnnouncementKey = '';
  let previousCompletion = false;
  let latestAnnouncement = { status: '', recovery: 0, paused: false };

  function queueSubtitle(state) {
    const safeState = Number(state) === 2 ? 2 : 1;
    const copy = subtitleCopy[safeState];
    document.body.dataset.artworkState = String(safeState);
    window.clearTimeout(subtitleTimer);
    subtitle.classList.remove('is-visible');
    subtitle.setAttribute('aria-hidden', 'true');
    subtitle.dataset.state = String(safeState);
    subtitleText.textContent = copy;
    subtitle.setAttribute('aria-label', copy);
    subtitleTimer = window.setTimeout(() => {
      subtitle.classList.add('is-visible');
      subtitle.setAttribute('aria-hidden', 'false');
    }, 1000);
  }

  function command(action, extra = {}) {
    window.dispatchEvent(new CustomEvent('adapt:command', {
      detail: { action, ...extra }
    }));
  }

  function notifyParent(type) {
    if (embedded) window.parent.postMessage({ type }, window.location.origin);
  }

  function setInfoOpen(open) {
    if (open && !infoPopover.open) {
      setSoundOpen(false);
      document.body.classList.add('info-is-open');
      infoButton.setAttribute('aria-expanded', 'true');
      infoPopover.showModal();
      infoClose.focus({ preventScroll: true });
    } else if (!open && infoPopover.open) {
      infoPopover.close();
    }
  }

  function setProgress(detail = {}) {
    const completed = Boolean(detail.completed);
    const guided = detail.mode === 'guided' && !completed;
    const paused = Boolean(detail.paused);
    const sound = detail.sound !== false;
    const selectedTool = detail.tool === 'wind' ? 'wind' : 'sun';
    const values = Object.fromEntries(meters.map(({ name }) => [
      name, Math.max(0, Math.min(100, Math.round(Number(detail[name]) || 0)))
    ]));

    meters.forEach(({ name, bar, value }) => {
      bar.value = values[name];
      value.textContent = `${values[name]}%`;
    });
    toolButtons.forEach((button) => {
      const selected = button.dataset.tool === selectedTool;
      button.setAttribute('aria-pressed', String(selected));
      button.dataset.tooltip = `${button.dataset.tool === 'sun' ? 'Sun energy · 1' : 'Wind energy · 2'}${selected ? ' · Selected' : ''}`;
    });

    document.body.dataset.mode = detail.mode === 'guided' ? 'guided' : 'manual';
    document.body.dataset.completed = String(completed);
    document.getElementById('recovery-label').textContent = completed ? 'NETWORK READY' : 'FIELD RECOVERY';
    statusText.textContent = completed
      ? completionCopy
      : detail.status || 'Drag SUN across the habitats, then add WIND to reconnect them.';
    document.getElementById('control-caption').textContent = guided
      ? 'Guided sequence · select SUN or WIND to take control.'
      : completed ? 'The clean-energy network is ready for the next stage.'
        : 'Select an energy source, then drag to supply it.';

    soundMute.querySelector('use').setAttribute('href', sound ? '#icon-sound' : '#icon-muted');
    soundMute.setAttribute('aria-pressed', String(!sound));
    soundMute.setAttribute('aria-label', sound ? 'Mute sound' : 'Unmute sound');
    soundMute.querySelector('span').textContent = sound ? 'M \u00b7 MUTE' : 'M \u00b7 UNMUTE';

    if (completed !== previousCompletion) {
      notifyParent(completed ? 'adapt:complete' : 'adapt:reset');
      previousCompletion = completed;
    }

    // Announce phases and broad milestones, not every animation frame or brush stroke.
    latestAnnouncement = { status: statusText.textContent, recovery: values.recovery, paused };
    const announcementKey = [detail.phase, selectedTool, paused, sound, completed, values.sun + values.wind === 0, Math.floor(values.recovery / 25)].join('|');
    if (announcementKey !== previousAnnouncementKey) {
      previousAnnouncementKey = announcementKey;
      window.clearTimeout(announcementTimer);
      announcementTimer = window.setTimeout(() => {
        const spokenStatus = latestAnnouncement.status.trim().replace(/[.!?…]+$/, '');
        announcement.textContent = `${latestAnnouncement.paused ? 'Animation paused. ' : ''}${spokenStatus}. Recovery ${latestAnnouncement.recovery}%.`;
      }, 650);
    }
  }

  controls.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-command]');
    if (!button || button.disabled) return;
    const action = button.dataset.command;
    if (action === 'info') setInfoOpen(true);
    else if (action === 'sound-panel') setSoundOpen(!soundIsOpen());
    else command(action, action === 'tool' ? { tool: button.dataset.tool } : {});
  });

  infoClose.addEventListener('click', () => setInfoOpen(false));
  infoPopover.addEventListener('close', () => {
    document.body.classList.remove('info-is-open');
    infoButton.setAttribute('aria-expanded', 'false');
    infoButton.focus({ preventScroll: true });
  });
  infoPopover.addEventListener('cancel', (event) => {
    event.preventDefault();
    setInfoOpen(false);
  });
  infoPopover.addEventListener('click', (event) => {
    if (event.target !== infoPopover) return;
    const rect = infoPopover.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
      setInfoOpen(false);
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === '!' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      setInfoOpen(!infoPopover.open);
    }
  });
  window.addEventListener('adapt:statechange', (event) => queueSubtitle(event.detail?.state));
  window.addEventListener('adapt:progress', (event) => setProgress(event.detail));

  const query = new URLSearchParams(window.location.search);
  const restoredPreview = ['2', 'restored'].includes(query.get('state'));
  queueSubtitle(restoredPreview ? 2 : 1);
  setProgress(restoredPreview
    ? { sun: 100, wind: 100, recovery: 100, completed: true }
    : { tool: 'sun', sun: 0, wind: 0, recovery: 0 });
  if (['1', 'open'].includes(query.get('info'))) setInfoOpen(true);
})();
