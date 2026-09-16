// ============================================================
// HARM — SOUND SYSTEM / V8 SEMANTIC MIX
//
// Six designed recordings, six semantic roles:
//   CLICK        = any intentional canvas press.
//   MACHINE      = long, quiet machine bed from Microwave recording.
//                  The natural bell/"ting" is isolated and ONLY plays at 100%.
//   SMOKE        = very quiet Water Tap ambience while factory chimneys run.
//   CONSTRUCTION = light Rice texture while factories form.
//   FACTORY      = subtle Oral Irrigator mechanical accent.
//   DAMAGE       = Plastic Bag texture at environmental damage milestones.
//
// Audio state is kept independent from the p5 animation/physics systems.
// ============================================================

(() => {
  'use strict';

  const SOUND_ROOT = '../designed-sounds/';
  // Integration manifest: the supplied HARM package omits all six recordings.
  // Set to true after placing those original recordings in SOUND_ROOT.
  const RECORDINGS_AVAILABLE = false;
  const FILES = {
    mouseclick: 'COMM2754-2026-S3936790-A2w09-Heal-Mouseclickwav.wav',
    microwave: 'COMM2754-2026-S3936790-A2w09-Heal-Microwave.wav',
    water: 'COMM2754-2026-S3936790-A2w09-Heal-Water Tap.wav',
    rice: 'COMM2754-2026-S3936790-A2w09-Heal-Rice.wav',
    irrigator: 'COMM2754-2026-S3936790-A2w09-Heal-Oral irrigator.wav',
    plastic: 'COMM2754-2026-S3936790-A2w09-Heal-PlasticBag.wav'
  };

  // Recommended mix shown in the panel. These values are intentionally not equal:
  // CLICK stays clear, MACHINE stays behind it, SMOKE is barely-there ambience,
  // and DAMAGE is audible enough to register when it finally occurs.
  const RECOMMENDED = {
    mouseclick: 0.70,
    microwave: 0.38,
    water: 0.08,
    rice: 0.14,
    irrigator: 0.12,
    plastic: 0.26
  };

  // Per-recording loudness calibration. Sliders remain user-friendly percentages;
  // this hidden layer compensates for the recordings having different source levels.
  const CALIBRATION_GAIN = {
    mouseclick: 0.72,
    microwave: 0.52,
    water: 0.36,
    rice: 0.46,
    irrigator: 0.40,
    plastic: 0.62
  };

  // The submitted Microwave recording is pre-shaped inside this package:
  // 0.00–6.10 s = extended machine hum/body with crossfaded continuation;
  // 6.20 s onward = the source recording's natural bell/ting + tail.
  // Normal machine playback stops before 6.10 s, so the ting can only be heard
  // through machineComplete() when the visual machine reaches 100%.
  const MACHINE_HUM_END = 6.06;
  const MACHINE_ACTIVE_AFTER_CLICK_MS = 5900;
  const MACHINE_WATCH_MS = 34;
  const TING_START = 6.20;
  const TING_DURATION_MS = 1280;

  const state = {
    muted: false,
    settingsOpen: false,
    levels: { ...RECOMMENDED },
    clips: {},
    tingClip: null,
    activeIntensity: {},
    lastPlay: {},
    timers: new Set(),
    unlocked: false,

    machinePlaying: false,
    machineStopAt: 0,
    machineWatcher: null,
    machineIntensity: 0.58,
    machineCompleted: false,
    tingActive: false,

    formationBusyUntil: 0,
    smokeTarget: 0,
    smokeLevel: 0,
    atmosphereTimer: null,

    pollutionLevel: 0,
    damageMilestones: [false, false, false]
  };

  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch (_) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (_) {} }
  };

  const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0));
  const nowMs = () => performance.now();

  function gainFor(key, intensity = 1) {
    if (state.muted) return 0;
    const level = key in state.levels ? state.levels[key] : 1;
    return clamp01((CALIBRATION_GAIN[key] || 0.5) * level * clamp01(intensity));
  }

  function buildClips() {
    if (!RECORDINGS_AVAILABLE) return;
    Object.entries(FILES).forEach(([key, file]) => {
      const audio = new Audio(SOUND_ROOT + file);
      audio.preload = 'auto';
      audio.playsInline = true;
      audio.loop = false;
      audio.addEventListener('ended', () => {
        state.activeIntensity[key] = 0;
        if (key === 'microwave' && nowMs() >= state.machineStopAt) {
          state.machinePlaying = false;
        }
      });
      state.clips[key] = audio;
    });

    // Second HTMLAudioElement, same Microwave source. This remains one designed
    // recording; the separate player only isolates the natural bell region.
    state.tingClip = new Audio(SOUND_ROOT + FILES.microwave);
    state.tingClip.preload = 'auto';
    state.tingClip.playsInline = true;
    state.tingClip.loop = false;
  }

  function schedule(delayMs, fn) {
    const id = setTimeout(() => {
      state.timers.delete(id);
      fn();
    }, Math.max(0, delayMs));
    state.timers.add(id);
    return id;
  }

  function clearScheduled() {
    state.timers.forEach(id => clearTimeout(id));
    state.timers.clear();
  }

  function stopKey(key, reset = true) {
    const audio = state.clips[key];
    if (!audio) return;
    try {
      audio.pause();
      if (reset) audio.currentTime = 0;
    } catch (_) {}
    state.activeIntensity[key] = 0;
    if (key === 'microwave') state.machinePlaying = false;
  }

  function stopTing() {
    if (!state.tingClip) return;
    try {
      state.tingClip.pause();
      state.tingClip.currentTime = 0;
    } catch (_) {}
    state.tingActive = false;
    refreshMachineVolume();
  }

  function playClip(key, options = {}) {
    if (state.muted) return false;
    const audio = state.clips[key];
    if (!audio) return false;

    const now = nowMs();
    const cooldownMs = Math.max(0, Number(options.cooldown) || 0) * 1000;
    if (cooldownMs && state.lastPlay[key] && now - state.lastPlay[key] < cooldownMs) return false;

    if (options.restart === false && !audio.paused) {
      const nextIntensity = clamp01(options.intensity == null ? 1 : options.intensity);
      state.activeIntensity[key] = Math.max(state.activeIntensity[key] || 0, nextIntensity);
      audio.volume = gainFor(key, state.activeIntensity[key]);
      return true;
    }

    state.lastPlay[key] = now;
    if (options.restart !== false) stopKey(key);

    const intensity = clamp01(options.intensity == null ? 1 : options.intensity);
    state.activeIntensity[key] = intensity;

    try {
      audio.loop = Boolean(options.loop);
      audio.currentTime = Math.max(0, Number(options.offset) || 0);
      audio.playbackRate = Math.max(0.94, Math.min(1.06, Number(options.rate) || 1));
      audio.volume = gainFor(key, intensity);
      const result = audio.play();
      state.unlocked = true;
      if (result && typeof result.catch === 'function') result.catch(() => {});
      return true;
    } catch (_) {
      return false;
    }
  }

  // ----------------------------------------------------------
  // MACHINE BED + 100% TING
  // ----------------------------------------------------------
  function refreshMachineVolume() {
    const audio = state.clips.microwave;
    if (!audio || audio.paused) return;
    const duck = state.tingActive ? 0.28 : 1;
    audio.volume = gainFor('microwave', state.machineIntensity * duck);
  }

  function ensureMachineWatcher() {
    if (state.machineWatcher) return;
    state.machineWatcher = setInterval(() => {
      const audio = state.clips.microwave;
      if (!audio) return;

      if (state.muted || nowMs() >= state.machineStopAt) {
        stopKey('microwave');
        if (state.machineWatcher) {
          clearInterval(state.machineWatcher);
          state.machineWatcher = null;
        }
        return;
      }

      if (audio.currentTime >= MACHINE_HUM_END) {
        // If another coal interaction recently extended the machine window, begin
        // a fresh long bed. The packaged hum has its own fade tail, so this restart
        // is much calmer than looping the original short recording every ~2 seconds.
        if (nowMs() + 120 < state.machineStopAt) {
          try {
            audio.currentTime = 0;
            audio.volume = gainFor('microwave', state.machineIntensity * (state.tingActive ? 0.28 : 1));
            const result = audio.play();
            if (result && typeof result.catch === 'function') result.catch(() => {});
          } catch (_) {}
        } else {
          stopKey('microwave');
          if (state.machineWatcher) {
            clearInterval(state.machineWatcher);
            state.machineWatcher = null;
          }
        }
        return;
      }

      if (audio.paused) {
        try {
          audio.currentTime = 0;
          audio.volume = gainFor('microwave', state.machineIntensity * (state.tingActive ? 0.28 : 1));
          const result = audio.play();
          if (result && typeof result.catch === 'function') result.catch(() => {});
          state.machinePlaying = true;
        } catch (_) {}
        return;
      }

      refreshMachineVolume();
    }, MACHINE_WATCH_MS);
  }

  function startMachineBed(intensity = 1) {
    if (state.muted) return false;
    const audio = state.clips.microwave;
    if (!audio) return false;

    state.unlocked = true;
    state.machineStopAt = Math.max(state.machineStopAt, nowMs() + MACHINE_ACTIVE_AFTER_CLICK_MS);
    state.machineIntensity = clamp01(0.52 + intensity * 0.10);

    if (audio.paused) {
      try {
        audio.loop = false;
        audio.playbackRate = 1;
        audio.currentTime = 0;
        audio.volume = gainFor('microwave', state.machineIntensity);
        const result = audio.play();
        if (result && typeof result.catch === 'function') result.catch(() => {});
        state.machinePlaying = true;
      } catch (_) {}
    } else {
      state.machinePlaying = true;
      refreshMachineVolume();
    }

    ensureMachineWatcher();
    return true;
  }

  function playCompletionTing() {
    if (state.muted || state.machineCompleted || !state.tingClip) return false;
    const audio = state.tingClip;
    state.machineCompleted = true;
    state.tingActive = true;
    refreshMachineVolume();

    const start = () => {
      try {
        audio.pause();
        audio.currentTime = TING_START;
        audio.playbackRate = 1;
        // The ting is intentionally much clearer than the machine bed but still
        // follows the MACHINE slider. At the recommended mix it lands around 50% gain.
        audio.volume = clamp01(CALIBRATION_GAIN.microwave * state.levels.microwave * 2.55);
        const result = audio.play();
        if (result && typeof result.catch === 'function') result.catch(() => {});
        schedule(TING_DURATION_MS, stopTing);
      } catch (_) {
        state.tingActive = false;
        refreshMachineVolume();
      }
    };

    if (audio.readyState >= 1) start();
    else audio.addEventListener('loadedmetadata', start, { once: true });
    return true;
  }

  // ----------------------------------------------------------
  // SEMANTIC CUES
  // ----------------------------------------------------------
  const cues = {
    // Clear foreground feedback for any intentional press on the p5 canvas.
    uiClick(intensity = 1) {
      return playClip('mouseclick', {
        intensity: 0.94 * intensity,
        cooldown: 0.060,
        rate: 1
      });
    },

    // Coal commitment starts / extends a long machine background bed.
    machineStart(intensity = 1) {
      return startMachineBed(intensity);
    },

    // Called once by sketch.js when burn count crosses the machine's true 100% mark.
    machineComplete() {
      return playCompletionTing();
    },

    // Factory formation remains a soft background layer rather than a foreground hit.
    factoryForm(count = 1) {
      const now = nowMs();
      if (now < state.formationBusyUntil) return false;

      const n = Math.max(1, Number(count) || 1);
      state.formationBusyUntil = now + 3200;

      schedule(650, () => {
        playClip('rice', {
          intensity: clamp01(0.24 + n * 0.020),
          restart: false,
          rate: 0.99,
          cooldown: 2.6
        });
      });

      schedule(1800, () => {
        playClip('irrigator', {
          intensity: clamp01(0.18 + n * 0.015),
          restart: true,
          rate: 0.98,
          cooldown: 3.0
        });
      });
      return true;
    },

    // Plastic Bag now has enough gain to be perceptible, while cooldown keeps it rare.
    damage(intensity = 1) {
      return playClip('plastic', {
        intensity: 0.56 * intensity,
        restart: true,
        rate: 0.99,
        cooldown: 3.8
      });
    }
  };

  // ----------------------------------------------------------
  // SMOKE BACKGROUND — WATER TAP
  // ----------------------------------------------------------
  function setFactoryAtmosphere(level) {
    state.smokeTarget = clamp01(level);
  }

  function updateSmokeBed() {
    const water = state.clips.water;
    if (!water) return;

    const target = state.muted ? 0 : state.smokeTarget;
    state.smokeLevel += (target - state.smokeLevel) * 0.032;
    if (Math.abs(target - state.smokeLevel) < 0.0015) state.smokeLevel = target;

    const shouldRun = state.unlocked && !state.muted &&
      (state.smokeTarget > 0.10 || state.smokeLevel > 0.018);

    if (shouldRun) {
      if (water.paused) {
        try {
          water.loop = true;
          water.playbackRate = 0.982;
          water.currentTime = 0;
          state.activeIntensity.water = 0.10;
          water.volume = gainFor('water', 0.10);
          const result = water.play();
          if (result && typeof result.catch === 'function') result.catch(() => {});
        } catch (_) {}
      }

      // Extra conservative: Water Tap should feel like air/smoke in the room,
      // not like a foreground effect. Machine and ting duck it even further.
      const activity = clamp01(0.10 + state.smokeLevel * 0.30);
      const duck = state.tingActive ? 0.38 : state.machinePlaying ? 0.66 : 1;
      state.activeIntensity.water = activity * duck;
      water.volume = gainFor('water', state.activeIntensity.water);
    } else if (!water.paused) {
      state.activeIntensity.water = state.smokeLevel * 0.16;
      water.volume = gainFor('water', state.activeIntensity.water);
      if (state.smokeLevel < 0.010 || state.muted) stopKey('water');
    }
  }

  // ----------------------------------------------------------
  // POLLUTION LEVEL MIRROR
  // ----------------------------------------------------------
  // sketch.js now owns DAMAGE timing so the Plastic Bag cue can be launched on
  // the exact same frame as its litter/plastic animation. This function only keeps
  // a copy of pollution for audio-side state/diagnostics; it never emits sound.
  function setPollutionLevel(level) {
    state.pollutionLevel = clamp01(level);
  }

  function refreshPlayingVolumes() {
    Object.entries(state.clips).forEach(([key, audio]) => {
      if (!audio || audio.paused) return;
      if (key === 'microwave') {
        refreshMachineVolume();
      } else {
        audio.volume = gainFor(key, state.activeIntensity[key] || 1);
      }
    });
    if (state.tingClip && !state.tingClip.paused) {
      state.tingClip.volume = clamp01(CALIBRATION_GAIN.microwave * state.levels.microwave * 2.55);
    }
  }

  function resetMachineCycle() {
    state.machineStopAt = 0;
    if (state.machineWatcher) {
      clearInterval(state.machineWatcher);
      state.machineWatcher = null;
    }
    stopKey('microwave');
    stopTing();
    state.machinePlaying = false;
    state.machineCompleted = false;
    state.tingActive = false;
    state.damageMilestones = [false, false, false];
    state.pollutionLevel = 0;
  }

  function stopAll(resetTargets = true) {
    Object.keys(state.clips).forEach(key => stopKey(key));
    stopTing();
    clearScheduled();
    if (state.machineWatcher) {
      clearInterval(state.machineWatcher);
      state.machineWatcher = null;
    }
    state.machineStopAt = 0;
    state.machinePlaying = false;
    state.formationBusyUntil = 0;
    if (resetTargets) {
      state.smokeTarget = 0;
      state.smokeLevel = 0;
      state.pollutionLevel = 0;
      state.damageMilestones = [false, false, false];
    }
  }

  function setMuted(next) {
    if (!RECORDINGS_AVAILABLE) next = true;
    state.muted = Boolean(next);
    storage.set('harmSoundV8Muted', state.muted ? '1' : '0');
    if (state.muted) stopAll(false);
    updateUI();
    return state.muted;
  }

  function toggleMute() {
    return setMuted(!state.muted);
  }

  function setLevel(key, value) {
    if (!(key in RECOMMENDED)) return;
    state.levels[key] = clamp01(value);
    storage.set('harmSoundV8Levels', JSON.stringify(state.levels));
    refreshPlayingVolumes();
    updateUI();
  }

  function resetRecommended() {
    state.levels = { ...RECOMMENDED };
    storage.set('harmSoundV8Levels', JSON.stringify(state.levels));
    refreshPlayingVolumes();
    updateUI();
  }

  function restoreSettings() {
    // The old MUTE control was removed from the UI. Always start audible so a
    // previously-saved muted state cannot leave the new single SOUND button silent.
    state.muted = !RECORDINGS_AVAILABLE;
    storage.set('harmSoundV8Muted', '0');
    try {
      const saved = JSON.parse(storage.get('harmSoundV8Levels') || '{}');
      Object.keys(RECOMMENDED).forEach(key => {
        if (Number.isFinite(Number(saved[key]))) state.levels[key] = clamp01(saved[key]);
      });
    } catch (_) {}
  }

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------
  function updateUI() {
    const settings = document.getElementById('sound-settings');
    const soundButton = document.getElementById('sound-button');
    const muteButton = document.getElementById('sound-mute-toggle');
    const muteLabel = muteButton ? muteButton.querySelector('.sound-mute__label') : null;

    if (settings) settings.hidden = !state.settingsOpen;
    if (soundButton) {
      soundButton.disabled = !RECORDINGS_AVAILABLE;
      if (!RECORDINGS_AVAILABLE) soundButton.setAttribute('aria-label', 'Sound unavailable — original recordings not supplied');
      soundButton.setAttribute('aria-expanded', state.settingsOpen ? 'true' : 'false');
      soundButton.setAttribute('data-tooltip', state.muted
        ? (state.settingsOpen ? 'Muted · close sound mix' : 'Muted · open sound mix')
        : (state.settingsOpen ? 'Close sound mix' : 'Sound mix'));
      soundButton.classList.toggle('is-muted', state.muted);
    }
    if (muteButton) {
      if (muteLabel) muteLabel.textContent = state.muted ? 'UNMUTE' : 'MUTE';
      muteButton.setAttribute('aria-pressed', state.muted ? 'true' : 'false');
      muteButton.setAttribute('aria-label', state.muted ? 'Unmute sound' : 'Mute sound');
      muteButton.classList.toggle('is-muted', state.muted);
    }

    document.querySelectorAll('[data-sound-key]').forEach(input => {
      const key = input.dataset.soundKey;
      if (!(key in state.levels)) return;
      input.value = String(Math.round(state.levels[key] * 100));
      const output = document.querySelector(`[data-sound-value="${key}"]`);
      if (output) output.textContent = `${Math.round(state.levels[key] * 100)}%`;
    });
  }

  function bindUI() {
    const control = document.getElementById('sound-control');
    const soundButton = document.getElementById('sound-button');
    const muteButton = document.getElementById('sound-mute-toggle');
    const resetButton = document.getElementById('sound-reset-recommended');
    const closeButton = document.getElementById('sound-settings-close');

    if (control) {
      ['pointerdown', 'pointerup', 'click', 'mousedown', 'mouseup', 'touchstart', 'touchend']
        .forEach(type => control.addEventListener(type, event => event.stopPropagation()));
    }

    if (soundButton) {
      soundButton.addEventListener('click', () => {
        state.settingsOpen = !state.settingsOpen;
        if (window.HarmSound) window.HarmSound.cues.uiClick(0.82);
        updateUI();
      });
    }
    if (muteButton) {
      muteButton.addEventListener('click', () => {
        const isMuted = toggleMute();
        if (!isMuted && window.HarmSound) window.HarmSound.cues.uiClick(0.72);
      });
    }
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        resetRecommended();
        if (window.HarmSound) window.HarmSound.cues.uiClick(0.72);
      });
    }
    if (closeButton) {
      ['pointerdown', 'pointerup', 'click', 'mousedown', 'mouseup', 'touchstart', 'touchend']
        .forEach(type => closeButton.addEventListener(type, event => event.stopPropagation()));
      closeButton.addEventListener('click', () => {
        state.settingsOpen = false;
        if (window.HarmSound) window.HarmSound.cues.uiClick(0.76);
        updateUI();
      });
    }

    document.querySelectorAll('[data-sound-key]').forEach(input => {
      input.addEventListener('input', event => {
        setLevel(event.target.dataset.soundKey, Number(event.target.value) / 100);
      });
    });
  }

  restoreSettings();
  buildClips();
  if (RECORDINGS_AVAILABLE) state.atmosphereTimer = setInterval(updateSmokeBed, 100);

  window.HarmSound = {
    cues,
    stopAll,
    resetMachineCycle,
    setFactoryAtmosphere,
    setPollutionLevel,
    setMuted,
    toggleMute,
    setLevel,
    resetRecommended,
    get muted() { return state.muted; },
    get levels() { return { ...state.levels }; },
    get recommended() { return { ...RECOMMENDED }; }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      bindUI();
      updateUI();
    }, { once: true });
  } else {
    bindUI();
    updateUI();
  }
})();
