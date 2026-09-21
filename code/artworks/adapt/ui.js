(() => {
  const infoButton = document.getElementById('info-button');
  const infoPopover = document.getElementById('info-popover');
  const infoClose = document.getElementById('info-close');
  const infoNudge = document.getElementById('info-nudge');
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

  // The first button click unlocks browser audio; hovering respects that gesture and mute.
  document.addEventListener('click', (event) => {
    if (!event.target.closest('button')) return;
    ensureAudioEnabled().then(() => {
      playSample('mouseClick', { gain: 0.58, exclusive: 'ui-click' });
    });
  });
  document.addEventListener('pointerover', (event) => {
    const control = event.target.closest('button, a[href], input, select, textarea, summary, [role="button"], [role="link"], [data-command], canvas');
    if (!control || control.matches(':disabled, [aria-disabled="true"]') || control.contains(event.relatedTarget) || event.pointerType === 'touch') return;
    if (control.tagName === 'CANVAS' && (paused || stateTwoAnnounced || document.body.matches('.info-is-open, .sound-is-open'))) return;
    // Let the recorded hover cue reach its natural end. Further hover events
    // during playback are ignored instead of cutting and restarting the sample.
    playSample('keyboardReverse', {
      gain: 0.4,
      exclusive: 'ui-hover',
      finishPrevious: true
    });
  });
  const soundIsOpen = () => soundPanel.matches(':popover-open');
  function positionSoundPanel() {
    if (!soundIsOpen()) return;
    const stage = document.getElementById('artwork-stage').getBoundingClientRect();
    const button = soundButton.getBoundingClientRect();
    const gap = 12;
    const margin = 12;
    soundPanel.style.removeProperty('--sound-height');
    soundPanel.style.width = '';
    const panel = soundPanel.getBoundingClientRect();
    const left = Math.max(stage.left + margin, button.left - panel.width - gap);
    const top = Math.max(
      stage.top + margin,
      Math.min(button.bottom - panel.height, stage.bottom - panel.height - margin)
    );
    soundPanel.style.left = `${left}px`;
    soundPanel.style.top = `${top}px`;
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
    1: 'Drag SUN across the habitats, then add WIND to reconnect them.',
    2: completionCopy
  };
  const embedded = window.parent !== window;
  document.body.dataset.embedded = String(embedded);
  const meters = ['sun', 'wind', 'recovery'].map((name) => ({
    name,
    bar: document.getElementById(`${name}-progress`),
    value: document.getElementById(`${name}-value`)
  }));
  let subtitleShowTimer;
  let subtitleHideTimer;
  let announcementTimer;
  let infoNudgeTimer;
  let infoNudgeHideTimer;
  let previousAnnouncementKey = '';
  let previousCompletion = false;
  let previousHintStatus = '';
  let previousRecoveryBand = 0;
  let initialProgressSeen = false;
  let latestAnnouncement = { status: '', recovery: 0, paused: false };

  function hideSubtitle() {
    window.clearTimeout(subtitleShowTimer);
    window.clearTimeout(subtitleHideTimer);
    subtitle.classList.remove('is-visible');
    subtitle.setAttribute('aria-hidden', 'true');
  }

  function showSubtitle(message, { delay = 0, duration = 3400, state } = {}) {
    if (!message) return;
    window.clearTimeout(subtitleShowTimer);
    window.clearTimeout(subtitleHideTimer);
    subtitle.classList.remove('is-visible');
    subtitle.setAttribute('aria-hidden', 'true');
    if (state != null) subtitle.dataset.state = String(state);
    subtitleText.textContent = message;
    subtitle.setAttribute('aria-label', message);
    subtitleShowTimer = window.setTimeout(() => {
      subtitle.classList.add('is-visible');
      subtitle.setAttribute('aria-hidden', 'false');
      subtitleHideTimer = window.setTimeout(hideSubtitle, duration);
    }, delay);
  }

  function queueSubtitle(state) {
    const safeState = Number(state) === 2 ? 2 : 1;
    document.body.dataset.artworkState = String(safeState);
    showSubtitle(subtitleCopy[safeState], {
      delay: safeState === 1 ? 850 : 250,
      duration: safeState === 1 ? 3900 : 5000,
      state: safeState
    });
  }

  function hideInfoNudge() {
    window.clearTimeout(infoNudgeHideTimer);
    if (!infoNudge) return;
    infoNudge.classList.remove('is-visible');
    infoNudge.setAttribute('aria-hidden', 'true');
  }

  function showInfoNudge() {
    if (!infoNudge || infoPopover.open || soundIsOpen() || document.hidden) return;
    infoNudge.classList.add('is-visible');
    infoNudge.setAttribute('aria-hidden', 'false');
    window.clearTimeout(infoNudgeHideTimer);
    infoNudgeHideTimer = window.setTimeout(hideInfoNudge, 3600);
  }

  function scheduleInfoNudge(first = false) {
    window.clearTimeout(infoNudgeTimer);
    const delay = first ? 8200 : 22000 + Math.random() * 12000;
    infoNudgeTimer = window.setTimeout(() => {
      // Keep the reminder occasional rather than permanent.
      if (first || Math.random() < 0.62) showInfoNudge();
      scheduleInfoNudge(false);
    }, delay);
  }

  const buttonHighlightTimers = new WeakMap();
  function flashButton(button) {
    window.clearTimeout(buttonHighlightTimers.get(button));
    button.classList.add('is-activated');
    buttonHighlightTimers.set(button, window.setTimeout(() => {
      button.classList.remove('is-activated');
      buttonHighlightTimers.delete(button);
    }, 350));
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
      hideInfoNudge();
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
    document.getElementById('recovery-value').textContent = `${values.recovery}%`;
    const nextHintStatus = (completed
      ? completionCopy
      : detail.status || 'Drag SUN across the habitats, then add WIND to reconnect them.').trim();

    // Keep the HUD informational only; all instructions/hints belong to the temporary subtitle box.
    statusText.textContent = completed
      ? 'SUN 100% · WIND 100%'
      : `SUN ${values.sun}% · WIND ${values.wind}%`;
    document.getElementById('control-caption').textContent = guided
      ? 'Guided sequence · select SUN or WIND to take control.'
      : completed ? 'The clean-energy network is ready for the next stage.'
        : 'Drag SUN + WIND: clean energy reconnects habitats.';

    // The subtitle is a temporary instruction / hint, not a permanent banner.
    if (!initialProgressSeen) {
      initialProgressSeen = true;
      previousHintStatus = nextHintStatus;
    } else if (nextHintStatus && nextHintStatus !== previousHintStatus) {
      previousHintStatus = nextHintStatus;
      showSubtitle(nextHintStatus, { duration: completed ? 5000 : 3200, state: completed ? 2 : 1 });
    }

    const recoveryBand = completed ? 4 : values.recovery >= 75 ? 3 : values.recovery >= 50 ? 2 : values.recovery >= 25 ? 1 : 0;
    if (!completed && recoveryBand > previousRecoveryBand) {
      previousRecoveryBand = recoveryBand;
      const milestoneHints = {
        1: 'Good start — keep dragging across the disconnected habitats.',
        2: 'Halfway restored — balance SUN and WIND across the field.',
        3: 'Almost there — reconnect the remaining habitat fragments.'
      };
      showSubtitle(milestoneHints[recoveryBand], { delay: 180, duration: 3300, state: 1 });
    } else if (values.recovery < 20 && previousRecoveryBand > 0) {
      previousRecoveryBand = 0;
    }

    soundMute.querySelector('use').setAttribute('href', sound ? '#icon-sound' : '#icon-muted');
    soundMute.setAttribute('aria-pressed', String(!sound));
    soundMute.setAttribute('aria-label', sound ? 'Mute sound' : 'Unmute sound');
    soundMute.querySelector('span').textContent = sound ? 'M \u00b7 MUTE' : 'M \u00b7 UNMUTE';

    if (completed !== previousCompletion) {
      notifyParent(completed ? 'adapt:complete' : 'adapt:reset');
      previousCompletion = completed;
    }

    // Announce phases and broad milestones, not every animation frame or brush stroke.
    latestAnnouncement = { status: nextHintStatus, recovery: values.recovery, paused };
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
    flashButton(button);
    const action = button.dataset.command;
    if (action === 'info') setInfoOpen(true);
    else if (action === 'sound-panel') setSoundOpen(!soundIsOpen());
    else command(action, action === 'tool' ? { tool: button.dataset.tool } : {});
  });

  infoButton.addEventListener('pointerenter', hideInfoNudge);
  infoButton.addEventListener('focus', hideInfoNudge);
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
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) hideInfoNudge();
  });

  const query = new URLSearchParams(window.location.search);
  const restoredPreview = ['2', 'restored'].includes(query.get('state'));
  queueSubtitle(restoredPreview ? 2 : 1);
  setProgress(restoredPreview
    ? { sun: 100, wind: 100, recovery: 100, completed: true }
    : { tool: 'sun', sun: 0, wind: 0, recovery: 0 });
  if (['1', 'open'].includes(query.get('info'))) setInfoOpen(true);
  scheduleInfoNudge(true);
})();
