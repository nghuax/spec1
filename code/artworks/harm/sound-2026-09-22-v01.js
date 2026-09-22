// ============================================================
// HARM — SOUND SYSTEM / V13 CLEAR EVENT IDENTITIES + POPUP MICROWAVE TING
//
// Folder layout expected by this file:
//   parent/
//     HARM/               <- index-2026-09-22-v01.html + this file
//     designed-sounds/    <- supplied A3w12 designed recordings
//
// Sound roles:
//   HOVER        KeyboardReverse  — short UI hover tick only
//   CLICK        Mouseclick       — intentional button/canvas press
//   BURN         Exhaust          — coal committed to the machine
//   MACHINE      Microwave        — restrained machine bed
//   SMOKE        Water Tap        — very low factory/smoke atmosphere
//   CONSTRUCTION Rice             — architecture formation texture
//   FACTORY      Oral Irrigator   — mechanical accent during formation
//   DAMAGE       Plastic Bag      — pollution/damage milestones
//   ALERT        Car Signal       — one short critical cue at AIR LOAD 100%
//
// Important: KeyboardReverse belongs to hover only.
// The delayed completion popup gets a dedicated short ting extracted from the bright tail of Microwave.
// ============================================================

(() => {
  'use strict';

  const SOUND_ROOT = 'designed-sounds/';
  const FILES = Object.freeze({
    hover: 'COMM2754-2026-S3936790-A3w12-Heal-KeyboardReverse.mp3',
    mouseclick: 'COMM2754-2026-S3936790-A3w12-Heal-Mouseclick.wav',
    exhaust: 'COMM2754-2026-S3936790-A3w12-Heal-Exhaust.wav',
    microwave: 'COMM2754-2026-S3936790-A3w12-Heal-Microwave.wav',
    water: 'COMM2754-2026-S3936790-A3w12-Heal-Water-Tap.wav',
    rice: 'COMM2754-2026-S3936790-A3w12-Heal-Rice.wav',
    irrigator: 'COMM2754-2026-S3936790-A3w12-Heal-Oral-Irrigator.wav',
    plastic: 'COMM2754-2026-S3936790-A3w12-Heal-PlasticBag.wav',
    alert: 'COMM2754-2026-S3936790-A3w12-Heal-Car-Signal.wav'
  });

  // A quiet mix is intentional: the artwork remains visual-first.
  const RECOMMENDED = Object.freeze({
    hover: 0.60, mouseclick: 0.60, exhaust: 0.60, microwave: 0.45,
    water: 0.40, rice: 0.60, irrigator: 0.60, plastic: 0.60, alert: 0.60
  });
  const RECOMMENDED_MASTER = 1.00;
  const RECOMMENDED_AMBIENCE = 0.50;

  // Source recordings are mastered to a shared level before the role mix.

  // The microwave recording contains a brighter tail late in the file. Restart the
  // bed before that region so routine machine ambience stays soft and continuous.
  // Measured audible onsets in the supplied files. Event cues skip the silent
  // lead-in so visual action and sound feel locked together rather than late.
  const AUDIBLE_ONSET = Object.freeze({
    exhaust: 0.26,
    microwave: 0.40,
    rice: 0.30,
    irrigator: 0.01,
    plastic: 0.02,
    alert: 0.29
  });
  const MACHINE_LOOP_START = AUDIBLE_ONSET.microwave;
  const MACHINE_LOOP_END = 5.90;
  const MACHINE_ACTIVE_AFTER_BURN_MS = 5600;
  const MACHINE_WATCH_MS = 42;

  const state = {
    muted: false,
    settingsOpen: false,
    master: RECOMMENDED_MASTER,
    ambience: RECOMMENDED_AMBIENCE,
    levels: { ...RECOMMENDED },
    clips: {},
    voicePools: {},
    activeIntensity: {},
    lastPlay: {},
    timers: new Set(),
    unlocked: false,

    machinePlaying: false,
    machineStopAt: 0,
    machineWatcher: null,
    machineIntensity: 0.55,
    machineCompleted: false,

    formationBusyUntil: 0,
    smokeTarget: 0,
    smokeLevel: 0,
    atmosphereTimer: null,
    pollutionLevel: 0,

    // v10 layered ambience: independent from direct interaction cues.
    ambientVoices: new Set(),
    ambientTimer: null,
    ambientSequenceStarted: false,
    sceneSoundscapeWanted: false,
    autoplayTried: false,
    machineClimax: false,
    nextSmokeBreathAt: 0,
    smokeBreathFlip: false
  };

  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch (_) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (_) {} }
  };

  const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0));
  const nowMs = () => performance.now();

  function gainFor(key, intensity = 1) {
    if (state.muted) return 0;
    return clamp01(
      state.master *
      (state.levels[key] == null ? 1 : state.levels[key]) *
      (key === 'hover' || key === 'mouseclick' ? 1 :
        (clamp01(intensity) > 0 ? 0.75 + 0.25 * clamp01(intensity) : 0))
    );
  }

  function buildClips() {
    Object.entries(FILES).forEach(([key, file]) => {
      const audio = new Audio(HEALMaster.url(key));
      audio.preload = 'auto';
      audio.playsInline = true;
      audio.loop = false;
      audio.addEventListener('ended', () => {
        state.activeIntensity[key] = 0;
        if (key === 'microwave' && nowMs() >= state.machineStopAt) state.machinePlaying = false;
      });
      audio.addEventListener('error', () => {
        console.warn(`[HARM sound] Could not load ${SOUND_ROOT + file}`);
      });
      // Force the browser to begin fetching/decoding early instead of waiting for
      // the first interaction. This reduces first-hit latency on Safari/Chrome.
      try { audio.load(); } catch (_) {}
      state.clips[key] = audio;

      // Keep a few already-created/preloaded voices for tactile one-shots. Creating
      // and decoding a fresh clone at the moment of impact can add noticeable lag,
      // especially on Safari. The pool is reused for crack/trash/popup cues.
      state.voicePools[key] = Array.from({ length: 3 }, () => {
        const voice = audio.cloneNode(true);
        voice.preload = 'auto';
        voice.playsInline = true;
        voice.loop = false;
        try { voice.load(); } catch (_) {}
        return voice;
      });
    });
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

  function stopAmbientVoices() {
    state.ambientVoices.forEach(voice => {
      try { voice.audio.pause(); voice.audio.currentTime = 0; } catch (_) {}
    });
    state.ambientVoices.clear();
    if (state.ambientTimer) {
      clearTimeout(state.ambientTimer);
      state.ambientTimer = null;
    }
    state.ambientSequenceStarted = false;
  }

  // Ambient voices use clones so a distant texture never cuts off a direct cue.
  function playAmbientVoice(key, options = {}) {
    const direct = Boolean(options.direct);
    if (state.muted || !state.unlocked || (!direct && state.ambience <= 0.01)) return false;
    const source = state.clips[key];
    if (!source) return false;
    let audio;
    if (direct) {
      const pool = state.voicePools[key] || (state.voicePools[key] = []);
      audio = pool.find(candidate => candidate.paused || candidate.ended);
      if (!audio) {
        audio = source.cloneNode(true);
        audio.preload = 'auto';
        audio.playsInline = true;
        try { audio.load(); } catch (_) {}
        pool.push(audio);
      }
    } else {
      audio = source.cloneNode(true);
    }
    const intensity = clamp01(options.intensity == null ? 0.12 : options.intensity);
    const voice = { audio, key, intensity, direct };
    state.ambientVoices.add(voice);
    try {
      audio.loop = false;
      audio.currentTime = Math.max(0, Number(options.offset) || 0);
      audio.playbackRate = Math.max(0.94, Math.min(1.06, Number(options.rate) || 1));
      audio.volume = gainFor(key, intensity) * (direct ? 1 : state.ambience);
      audio.addEventListener('ended', () => state.ambientVoices.delete(voice), { once: true });
      const durationMs = Math.max(0, Number(options.duration) || 0);
      if (durationMs > 0) {
        schedule(durationMs, () => {
          try { audio.pause(); audio.currentTime = 0; } catch (_) {}
          state.ambientVoices.delete(voice);
        });
      }
      const result = HEALMaster.play(audio);
      if (result && typeof result.catch === 'function') {
        result.catch(() => state.ambientVoices.delete(voice));
      }
      return true;
    } catch (_) {
      state.ambientVoices.delete(voice);
      return false;
    }
  }

  function scheduleAmbientTick(delayMs) {
    if (state.ambientTimer) clearTimeout(state.ambientTimer);
    state.ambientTimer = setTimeout(() => {
      state.ambientTimer = null;
      if (!state.sceneSoundscapeWanted) return;
      if (!state.muted && state.unlocked && state.ambience > 0.02) {
        const p = state.pollutionLevel;
        const r = Math.random();
        let key = 'rice', intensity = 0.10, offset = 0, rate = 1;
        if (p < 0.22) {
          if (r < 0.52) { key = 'rice'; intensity = 0.052; offset = Math.random() * 1.4; rate = 0.98 + Math.random() * 0.025; }
          else if (r < 0.82) { key = 'irrigator'; intensity = 0.038; offset = 0.4 + Math.random() * 1.6; rate = 0.98; }
          else { key = 'exhaust'; intensity = 0.036; offset = 0.2; rate = 0.96; }
        } else if (p < 0.66) {
          if (r < 0.34) { key = 'rice'; intensity = 0.060 + p * 0.020; offset = Math.random() * 1.6; }
          else if (r < 0.68) { key = 'irrigator'; intensity = 0.050 + p * 0.025; offset = 0.6 + Math.random() * 1.8; rate = 0.985; }
          else if (r < 0.86) { key = 'exhaust'; intensity = 0.050 + p * 0.030; offset = 0.1; rate = 0.97; }
          else { key = 'plastic'; intensity = 0.040 + p * 0.025; offset = Math.random() * 1.0; rate = 0.98; }
        } else {
          if (r < 0.30) { key = 'irrigator'; intensity = 0.060 + p * 0.030; offset = 0.7 + Math.random() * 1.8; }
          else if (r < 0.56) { key = 'plastic'; intensity = 0.055 + p * 0.030; offset = Math.random() * 1.3; rate = 0.97; }
          else if (r < 0.78) { key = 'exhaust'; intensity = 0.060 + p * 0.030; offset = 0.05; rate = 0.96; }
          else { key = 'rice'; intensity = 0.052; offset = Math.random() * 1.4; rate = 0.97; }
        }
        playAmbientVoice(key, { intensity, offset, rate });
      }
      const p = state.pollutionLevel;
      const density = Math.max(0.12, state.ambience);
      const base = 11200 - p * 2200;
      const jitter = 2800 + Math.random() * 4200;
      scheduleAmbientTick((base + jitter) / (0.72 + density * 0.55));
    }, Math.max(500, delayMs));
  }

  function startAmbientSequence() {
    if (!state.sceneSoundscapeWanted || !state.unlocked || state.ambientSequenceStarted) return;
    state.ambientSequenceStarted = true;
    // Tiny opening details: audible enough to make the scene feel alive, but not a melody.
    schedule(600, () => playAmbientVoice('rice', { intensity: 0.045, offset: 0.35, rate: 0.99 }));
    schedule(2700, () => playAmbientVoice('irrigator', { intensity: 0.032, offset: 1.15, rate: 0.98 }));
    schedule(5200, () => playAmbientVoice('exhaust', { intensity: 0.032, offset: 0.18, rate: 0.96 }));
    scheduleAmbientTick(9200);
  }

  function tryAutostartSoundscape() {
    if (state.autoplayTried || state.muted || !state.sceneSoundscapeWanted) return;
    state.autoplayTried = true;
    const water = state.clips.water;
    if (!water) return;
    try {
      water.loop = true;
      water.playbackRate = 0.982;
      water.currentTime = 0;
      water.volume = gainFor('water', 0.035) * state.ambience;
      const result = HEALMaster.play(water);
      if (result && typeof result.then === 'function') {
        result.then(() => {
          state.unlocked = true;
          startAmbientSequence();
        }).catch(() => {});
      } else {
        state.unlocked = true;
        startAmbientSequence();
      }
    } catch (_) {}
  }

  function restartSceneSoundscape() {
    state.sceneSoundscapeWanted = true;
    state.autoplayTried = false;
    stopAmbientVoices();
    // Keep the atmosphere target alive at zero pollution; updateSmokeBed blends it in.
    state.smokeTarget = 0;
    tryAutostartSoundscape();
    if (state.unlocked) startAmbientSequence();
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

  function playClip(key, options = {}) {
    if (state.muted) return false;
    const audio = state.clips[key];
    if (!audio) return false;

    const now = nowMs();
    const cooldownMs = Math.max(0, Number(options.cooldown) || 0) * 1000;
    if (cooldownMs && state.lastPlay[key] && now - state.lastPlay[key] < cooldownMs) return false;

    const intensity = clamp01(options.intensity == null ? 1 : options.intensity);
    state.lastPlay[key] = now;
    state.activeIntensity[key] = intensity;

    try {
      if (options.restart !== false) {
        audio.pause();
        audio.currentTime = Math.max(0, Number(options.offset) || 0);
      } else if (!audio.paused) {
        audio.volume = Math.max(audio.volume, gainFor(key, intensity));
        return true;
      }
      audio.loop = Boolean(options.loop);
      audio.playbackRate = Math.max(0.94, Math.min(1.06, Number(options.rate) || 1));
      audio.volume = gainFor(key, intensity);
      const result = HEALMaster.play(audio);
      state.unlocked = true;
      if (result && typeof result.catch === 'function') result.catch(() => {});
      return true;
    } catch (_) {
      return false;
    }
  }

  function refreshMachineVolume() {
    const audio = state.clips.microwave;
    if (!audio || audio.paused) return;
    audio.volume = gainFor('microwave', state.machineIntensity);
  }

  function ensureMachineWatcher() {
    if (state.machineWatcher) return;
    state.machineWatcher = setInterval(() => {
      const audio = state.clips.microwave;
      if (!audio) return;

      if (state.muted || nowMs() >= state.machineStopAt) {
        stopKey('microwave');
        clearInterval(state.machineWatcher);
        state.machineWatcher = null;
        return;
      }

      if (audio.currentTime >= MACHINE_LOOP_END || audio.paused) {
        try {
          audio.currentTime = MACHINE_LOOP_START;
          audio.loop = false;
          audio.playbackRate = 1;
          audio.volume = gainFor('microwave', state.machineIntensity);
          const result = HEALMaster.play(audio);
          if (result && typeof result.catch === 'function') result.catch(() => {});
          state.machinePlaying = true;
        } catch (_) {}
      } else {
        refreshMachineVolume();
      }
    }, MACHINE_WATCH_MS);
  }

  function startMachineBed(intensity = 1) {
    if (state.muted) return false;
    const audio = state.clips.microwave;
    if (!audio) return false;

    state.machineStopAt = Math.max(state.machineStopAt, nowMs() + MACHINE_ACTIVE_AFTER_BURN_MS);
    state.machineIntensity = clamp01(0.48 + intensity * 0.12);
    state.unlocked = true;

    if (audio.paused) {
      try {
        audio.currentTime = MACHINE_LOOP_START;
        audio.loop = false;
        audio.playbackRate = 1;
        audio.volume = gainFor('microwave', state.machineIntensity);
        const result = HEALMaster.play(audio);
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

  function startMachineClimax() {
    const audio = state.clips.microwave;
    if (!audio || state.muted) return false;
    if (state.machineWatcher) {
      clearInterval(state.machineWatcher);
      state.machineWatcher = null;
    }
    state.machineClimax = true;
    state.machinePlaying = true;
    state.machineIntensity = 1;
    state.machineStopAt = nowMs() + 8200;
    try {
      audio.pause();
      audio.currentTime = MACHINE_LOOP_START;
      audio.loop = false;
      audio.playbackRate = 1;
      audio.volume = gainFor('microwave', 1);
      const result = HEALMaster.play(audio);
      if (result && typeof result.catch === 'function') result.catch(() => {});
      schedule(7650, () => {
        state.machineClimax = false;
        state.machinePlaying = false;
      });
      return true;
    } catch (_) {
      state.machineClimax = false;
      return false;
    }
  }

  const cues = {
    // 120 ms reverse-keyboard tick. Short cooldown prevents accidental chatter when
    // moving quickly between nested controls. Never called by the completion popup.
    uiHover(intensity = 1) {
      return playClip('hover', {
        intensity: 0.72 * intensity,
        cooldown: 0.075,
        rate: 1
      });
    },

    uiClick(intensity = 1) {
      return playClip('mouseclick', {
        intensity: 0.92 * intensity,
        cooldown: 0.055,
        rate: 1
      });
    },

    // Tiny granular crack at the exact moment a coal piece separates. It uses
    // very short slices of the supplied Rice + PlasticBag recordings, so it reads
    // as a tactile fracture rather than a second UI click or a long sample.
    coalFracture(intensity = 1) {
      const amount = clamp01(intensity);
      // Crisp Rice transient = the actual fracture. A tiny PlasticBag tail adds grit,
      // but both are short direct voices so the sound reads as one coal crack.
      const crack = playAmbientVoice('rice', {
        direct: true,
        intensity: 0.34 * amount,
        offset: AUDIBLE_ONSET.rice + Math.random() * 0.055,
        rate: 1.045 + Math.random() * 0.012,
        duration: 145
      });
      // Grit starts in the same frame; the source offset supplies separation without
      // adding perceptible scheduling latency.
      playAmbientVoice('plastic', {
        direct: true,
        intensity: 0.105 * amount,
        offset: AUDIBLE_ONSET.plastic + Math.random() * 0.055,
        rate: 1.035 + Math.random() * 0.014,
        duration: 105
      });
      return crack;
    },

    // Each coal commitment gets a short exhaust breath plus a low machine bed.
    machineStart(intensity = 1) {
      playClip('exhaust', {
        intensity: 0.78 * intensity,
        offset: AUDIBLE_ONSET.exhaust,
        cooldown: 0.18,
        rate: 0.99
      });
      return startMachineBed(intensity);
    },

    // At AIR LOAD 100% the supplied Microwave recording becomes the hero machine
    // sound. Supporting layers are deliberately sparse so each event remains legible;
    // the popup five seconds later gets its own short Microwave ting.
    machineComplete() {
      if (state.machineCompleted) return false;
      state.machineCompleted = true;
      // Keep the 100% moment machine-led: Microwave is the hero, Exhaust confirms
      // the final burn, and Car Signal is only a small distant warning accent.
      startMachineClimax();
      playClip('exhaust', { intensity: 0.42, offset: AUDIBLE_ONSET.exhaust, rate: 0.97, cooldown: 0 });
      schedule(110, () => playClip('alert', { intensity: 0.24, offset: AUDIBLE_ONSET.alert, rate: 1, cooldown: 0 }));
      return true;
    },

    // Dedicated popup punctuation. The bright microwave ding sits around 6.3 s in
    // the supplied Microwave recording. Play only that slice on a clone, without
    // restarting the machine bed. Briefly duck the running machine so the ting reads.
    popupTing() {
      if (state.muted) return false;
      const machine = state.clips.microwave;
      if (machine && !machine.paused) machine.volume = gainFor('microwave', 0.30);
      const ting = playAmbientVoice('microwave', {
        direct: true,
        intensity: 0.92,
        offset: 6.34,
        rate: 1,
        duration: 1050
      });
      schedule(880, () => {
        if (machine && !machine.paused) machine.volume = gainFor('microwave', state.machineIntensity || 0.55);
      });
      return ting;
    },

    factoryForm(count = 1) {
      const now = nowMs();
      if (now < state.formationBusyUntil) return false;
      const n = Math.max(1, Number(count) || 1);
      state.formationBusyUntil = now + 3000;

      // First construction transient lands with the visual formation instead of
      // hundreds of milliseconds later; the second texture follows as a short layer.
      playClip('rice', {
        intensity: clamp01(0.25 + n * 0.018),
        offset: AUDIBLE_ONSET.rice,
        restart: true,
        rate: 0.99,
        cooldown: 2.4
      });
      schedule(360, () => {
        playClip('irrigator', {
          intensity: clamp01(0.18 + n * 0.015),
          offset: AUDIBLE_ONSET.irrigator,
          restart: true,
          rate: 0.985,
          cooldown: 2.8
        });
      });
      return true;
    },

    damage(intensity = 1) {
      const amount = clamp01(intensity);
      const now = nowMs();
      if (state.lastPlay.damageTrash && now - state.lastPlay.damageTrash < 2100) return false;
      state.lastPlay.damageTrash = now;
      // A concise PlasticBag crinkle = visible waste/damage. Kept under 0.7 s so it
      // never turns into a long ambient layer or masks the machine.
      return playAmbientVoice('plastic', {
        direct: true,
        intensity: 0.62 * amount,
        offset: AUDIBLE_ONSET.plastic + Math.random() * 0.075,
        rate: 0.99 + Math.random() * 0.018,
        duration: 620
      });
    }

  };

  function setFactoryAtmosphere(level) {
    state.smokeTarget = clamp01(level);
  }

  function updateSmokeBed() {
    const water = state.clips.water;
    if (!water) return;

    const ambientBase = 0.050 * state.ambience;
    const target = state.muted ? 0 : Math.max(state.smokeTarget, ambientBase);
    state.smokeLevel += (target - state.smokeLevel) * 0.026;
    if (Math.abs(target - state.smokeLevel) < 0.0015) state.smokeLevel = target;

    const shouldRun = state.unlocked && !state.muted && state.sceneSoundscapeWanted &&
      (state.smokeTarget > 0.02 || state.smokeLevel > 0.006 || state.ambience > 0.02);

    if (shouldRun) {
      if (water.paused) {
        try {
          water.loop = true;
          water.currentTime = 0;
          const result = HEALMaster.play(water);
          if (result && typeof result.catch === 'function') result.catch(() => {});
        } catch (_) {}
      }

      // Water Tap is only the soft body of the smoke texture. Slight rate drift keeps
      // it from reading as a literal faucet and makes the bed breathe with pollution.
      const p = state.pollutionLevel;
      const drift = Math.sin(nowMs() * 0.00031) * 0.010 + Math.sin(nowMs() * 0.00013) * 0.006;
      water.playbackRate = Math.max(0.955, Math.min(1.018, 0.978 - p * 0.010 + drift));
      const activity = clamp01(0.045 + state.smokeLevel * 0.25 + p * 0.050);
      const duck = state.machinePlaying ? 0.70 : 1;
      state.activeIntensity.water = activity * duck;
      water.volume = gainFor('water', state.activeIntensity.water);

      // Short irregular breaths are layered on top of the bed. At lower pollution
      // they are mostly Exhaust; at higher pollution, Oral Irrigator occasionally
      // enters as a distant mechanical hiss. Both are quiet and use independent
      // ambient voices, so they never interrupt direct interaction sounds.
      const now = nowMs();
      if (now >= state.nextSmokeBreathAt && state.ambience > 0.04) {
        const smokeEnergy = clamp01(state.smokeLevel * 0.78 + p * 0.72);
        if (smokeEnergy > 0.035) {
          const useIrrigator = p > 0.46 && state.smokeBreathFlip && Math.random() < 0.42;
          if (useIrrigator) {
            playAmbientVoice('irrigator', {
              intensity: 0.030 + smokeEnergy * 0.052,
              offset: 0.8 + Math.random() * 1.7,
              rate: 0.965 + Math.random() * 0.022
            });
          } else {
            playAmbientVoice('exhaust', {
              intensity: 0.032 + smokeEnergy * 0.060,
              offset: 0.08 + Math.random() * 0.26,
              rate: 0.955 + Math.random() * 0.025
            });
          }
          state.smokeBreathFlip = !state.smokeBreathFlip;
        }
        const density = 1.0 - clamp01(state.ambience * 0.44 + p * 0.36 + state.smokeLevel * 0.26);
        state.nextSmokeBreathAt = now + 1850 + density * 3300 + Math.random() * 1500;
      }
    } else if (!water.paused) {
      state.activeIntensity.water = state.smokeLevel * 0.14;
      water.volume = gainFor('water', state.activeIntensity.water);
      if (state.smokeLevel < 0.010 || state.muted) stopKey('water');
    }
  }

  function setPollutionLevel(level) {
    state.pollutionLevel = clamp01(level);
  }

  function refreshPlayingVolumes() {
    Object.entries(state.clips).forEach(([key, audio]) => {
      if (!audio || audio.paused) return;
      if (key === 'microwave') refreshMachineVolume();
      else audio.volume = gainFor(key, state.activeIntensity[key] || 1);
    });
    state.ambientVoices.forEach(voice => {
      if (!voice.audio.paused) voice.audio.volume = gainFor(voice.key, voice.intensity) * (voice.direct ? 1 : state.ambience);
    });
  }

  function resetMachineCycle() {
    state.machineStopAt = 0;
    if (state.machineWatcher) {
      clearInterval(state.machineWatcher);
      state.machineWatcher = null;
    }
    stopKey('microwave');
    state.machinePlaying = false;
    state.machineCompleted = false;
    state.machineClimax = false;
    state.pollutionLevel = 0;
    state.nextSmokeBreathAt = 0;
    state.smokeBreathFlip = false;
  }

  function stopAll(resetTargets = true) {
    Object.keys(state.clips).forEach(key => stopKey(key));
    clearScheduled();
    stopAmbientVoices();
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
      state.nextSmokeBreathAt = 0;
      state.smokeBreathFlip = false;
    }
  }

  function setMuted(next) {
    state.muted = Boolean(next);
    storage.set('harmSoundV12Muted', state.muted ? '1' : '0');
    if (state.muted) stopAll(false);
    else if (state.sceneSoundscapeWanted) {
      state.unlocked = true;
      startAmbientSequence();
    }
    updateUI();
    return state.muted;
  }

  function toggleMute() {
    return setMuted(!state.muted);
  }

  function setMaster(value) {
    state.master = clamp01(value);
    storage.set('harmSoundV12Master', String(state.master));
    refreshPlayingVolumes();
    updateUI();
  }

  function setAmbience(value) {
    state.ambience = clamp01(value);
    storage.set('harmSoundV12Ambience', String(state.ambience));
    refreshPlayingVolumes();
    if (state.sceneSoundscapeWanted && state.unlocked && !state.muted) startAmbientSequence();
    updateUI();
  }

  function setLevel(key, value) {
    if (!(key in RECOMMENDED)) return;
    state.levels[key] = clamp01(value);
    storage.set('harmSoundV12Levels', JSON.stringify(state.levels));
    refreshPlayingVolumes();
    updateUI();
  }

  function resetRecommended() {
    state.master = RECOMMENDED_MASTER;
    state.ambience = RECOMMENDED_AMBIENCE;
    state.levels = { ...RECOMMENDED };
    storage.set('harmSoundV12Master', String(state.master));
    storage.set('harmSoundV12Ambience', String(state.ambience));
    storage.set('harmSoundV12Levels', JSON.stringify(state.levels));
    refreshPlayingVolumes();
    updateUI();
  }

  function restoreSettings() {
    // Presentation-safe startup: every fresh page load begins SOUND ON at the
    // recommended mix, regardless of an old mute/custom value left in localStorage.
    // The mixer is still fully adjustable for the current session.
    state.muted = false;
    state.master = RECOMMENDED_MASTER;
    state.ambience = RECOMMENDED_AMBIENCE;
    state.levels = { ...RECOMMENDED };
    storage.set('harmSoundV12Muted', '0');
    storage.set('harmSoundV12Master', String(state.master));
    storage.set('harmSoundV12Ambience', String(state.ambience));
    storage.set('harmSoundV12Levels', JSON.stringify(state.levels));
  }

  function updateUI() {
    const settings = document.getElementById('sound-settings');
    const soundButton = document.getElementById('sound-button');
    const muteButton = document.getElementById('sound-mute-toggle');
    const muteLabel = muteButton ? muteButton.querySelector('.sound-mute__label') : null;

    if (settings) settings.hidden = !state.settingsOpen;
    if (soundButton) {
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

    const masterInput = document.querySelector('[data-sound-master]');
    if (masterInput) masterInput.value = String(Math.round(state.master * 100));
    const masterOutput = document.querySelector('[data-sound-master-value]');
    if (masterOutput) masterOutput.textContent = `${Math.round(state.master * 100)}%`;

    const ambienceInput = document.querySelector('[data-sound-ambience]');
    if (ambienceInput) ambienceInput.value = String(Math.round(state.ambience * 100));
    const ambienceOutput = document.querySelector('[data-sound-ambience-value]');
    if (ambienceOutput) ambienceOutput.textContent = `${Math.round(state.ambience * 100)}%`;

    document.querySelectorAll('[data-sound-key]').forEach(input => {
      const key = input.dataset.soundKey;
      if (!(key in state.levels)) return;
      input.value = String(Math.round(state.levels[key] * 100));
      const label = input.closest('label');
      if (label?.querySelector('b')) label.querySelector('b').textContent = '(' + Math.round(RECOMMENDED[key] * 100) + '%)';
      input.setAttribute('aria-label', key + ' sound level, recommended ' + Math.round(RECOMMENDED[key] * 100) + ' percent');
      const output = document.querySelector(`[data-sound-value="${key}"]`);
      if (output) output.textContent = `${Math.round(state.levels[key] * 100)}%`;
    });
  }

  function bindHoverSounds() {
    document.querySelectorAll('button').forEach(button => {
      button.addEventListener('pointerenter', event => {
        if (event.pointerType === 'touch' || button.disabled || button.hasAttribute('data-no-hover-sound')) return;
        cues.uiHover(button.id === 'completion-close' ? 0.68 : 0.86);
      });
    });
  }

  function bindUI() {
    const control = document.getElementById('sound-control');
    const soundButton = document.getElementById('sound-button');
    const muteButton = document.getElementById('sound-mute-toggle');
    const resetButton = document.getElementById('sound-reset-recommended');
    const closeButton = document.getElementById('sound-settings-close');
    const masterInput = document.querySelector('[data-sound-master]');
    const ambienceInput = document.querySelector('[data-sound-ambience]');

    if (control) {
      ['pointerdown', 'pointerup', 'click', 'mousedown', 'mouseup', 'touchstart', 'touchend']
        .forEach(type => control.addEventListener(type, event => event.stopPropagation()));
    }

    // A real press unlocks HTMLAudio on browsers that block hover audio before the
    // first user gesture. Subsequent button hovers can then play immediately.
    const unlock = () => {
      state.unlocked = true;
      if (state.sceneSoundscapeWanted && !state.muted) startAmbientSequence();
    };
    document.addEventListener('pointerdown', unlock, { once: true, capture: true });
    document.addEventListener('keydown', unlock, { once: true, capture: true });

    if (soundButton) {
      soundButton.addEventListener('click', () => {
        state.settingsOpen = !state.settingsOpen;
        cues.uiClick(0.82);
        updateUI();
      });
    }
    if (muteButton) {
      muteButton.addEventListener('click', () => {
        const isMuted = toggleMute();
        if (!isMuted) cues.uiClick(0.72);
      });
    }
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        resetRecommended();
        cues.uiClick(0.72);
      });
    }
    if (closeButton) {
      ['pointerdown', 'pointerup', 'click', 'mousedown', 'mouseup', 'touchstart', 'touchend']
        .forEach(type => closeButton.addEventListener(type, event => event.stopPropagation()));
      closeButton.addEventListener('click', () => {
        state.settingsOpen = false;
        cues.uiClick(0.76);
        updateUI();
      });
    }

    if (masterInput) {
      masterInput.addEventListener('input', event => setMaster(Number(event.target.value) / 100));
    }
    if (ambienceInput) {
      ambienceInput.addEventListener('input', event => setAmbience(Number(event.target.value) / 100));
    }
    document.querySelectorAll('[data-sound-key]').forEach(input => {
      input.addEventListener('input', event => setLevel(event.target.dataset.soundKey, Number(event.target.value) / 100));
    });

    bindHoverSounds();
  }

  restoreSettings();
  buildClips();
  state.atmosphereTimer = setInterval(updateSmokeBed, 100);

  window.HarmSound = {
    cues,
    stopAll,
    resetMachineCycle,
    setFactoryAtmosphere,
    setPollutionLevel,
    setMuted,
    toggleMute,
    setMaster,
    setAmbience,
    setLevel,
    resetRecommended,
    restartSceneSoundscape,
    get muted() { return state.muted; },
    get master() { return state.master; },
    get ambience() { return state.ambience; },
    get levels() { return { ...state.levels }; },
    get recommended() { return { master: RECOMMENDED_MASTER, ambience: RECOMMENDED_AMBIENCE, ...RECOMMENDED }; }
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
