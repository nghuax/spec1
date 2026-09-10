// COAL
// ------------------------------------------------------------

function spawnCoal(initial, index = 0) {
  const lanes = [150, 400, 700, 1030, 1350, 1640, 1840];
  const lane = lanes[index % lanes.length] + random(-42, 42);
  return {
    x: lane,
    y: initial ? random(-50, 900) : random(-260, -60),
    lane,
    laneVel: random(-.050, .050),
    speed: random(.86, 1.38),
    swayA: random(12, 29),
    swayB: random(6, 16),
    freqA: random(.28, .58),
    freqB: random(.12, .28),
    phaseA: random(TWO_PI),
    phaseB: random(TWO_PI),
    seed: random(1000),
    size: random(18, 31),
    rot: random(-.7, .7),
    rv: random(-.008, .008),
    type: floor(random(4))
  };
}

function updateCoal(dt) {
  const demandPressure = constrain((demandQueue.length * .72 + demandSignals.length * .28), 0, 1.4);
  const hopper = machineHopperPoint();

  for (let i = 0; i < coal.length; i++) {
    const c = coal[i];
    if (dragState && dragState.index === i) {
      c.x = mouseX + dragState.ox;
      c.y = mouseY + dragState.oy;
      c.rot += .008 * dt * 60;
      continue;
    }

    c.y += c.speed * (1 + pollution * .001 + demandPressure * .08) * dt * 60;
    c.lane += c.laneVel * dt * 60;
    if (c.lane < 90 || c.lane > W - 90) c.laneVel *= -1;

    const organic = (noise(c.seed * .01, sceneTime * .11 + i * .03) - .5) * 14;
    let px = c.lane
      + sin(sceneTime * c.freqA + c.phaseA) * c.swayA
      + cos(sceneTime * c.freqB + c.phaseB) * c.swayB
      + organic;

    if (demandPressure > .02) {
      const dd = dist(px, c.y, hopper.x, hopper.y);
      const attract = demandPressure * smooth01(map(dd, 980, 120, 0, 1)) * .032;
      px = lerp(px, hopper.x, attract);
      c.rot += sin(sceneTime * 4 + c.seed) * attract * .035;
    }
    c.x = px;

    c.rot += (c.rv + sin(sceneTime * .7 + c.phaseB) * .0012) * dt * 60;
    if (c.y > H + 70) coal[i] = spawnCoal(false, i);
  }
}

function findCoalAt(mx, my) {
  for (let i = coal.length - 1; i >= 0; i--) {
    const c = coal[i];
    if (dist(mx, my, c.x, c.y) < c.size * 1.5) return i;
  }
  return -1;
}


function fractureCoal(index, target) {
  const c = coal[index];
  if (!c) return;

  // The machine begins operating as soon as coal is intentionally committed.
  // The hum is quiet and will not restart if the machine is already running.
  if (window.HarmSound && window.HarmSound.cues && window.HarmSound.cues.machineStart) {
    window.HarmSound.cues.machineStart(constrain(0.82 + overdrive * 0.10, 0, 1));
  }

  coal[index] = spawnCoal(false, index);

  const hopper = machineHopperPoint();
  const pieces = 5 + floor(random(2));
  for (let k = 0; k < pieces; k++) {
    const tx = hopper.x + random(-12, 12);
    const ty = hopper.y + random(-8, 8);
    fragments.push({
      sx: c.x, sy: c.y,
      x: c.x, y: c.y,
      cx: lerp(c.x, tx, .48) + random(-90, 90),
      cy: min(c.y, ty) - random(70, 145),
      tx, ty,
      t: 0,
      speed: random(.028, .040) + (k === 0 ? .008 : 0),
      size: c.size * random(.23, .38),
      type: c.type,
      rot: c.rot,
      rv: random(-.05, .05),
      leader: k === 0,
      target
    });
  }
  feedPulse = 1;
}

function updateFragments(dt) {
  for (let i = fragments.length - 1; i >= 0; i--) {
    const f = fragments[i];
    f.t += f.speed * dt * 60;
    const q = ease(constrain(f.t, 0, 1));
    const p = quadratic(f.sx, f.sy, f.cx, f.cy, f.tx, f.ty, q);
    f.x = p.x;
    f.y = p.y;
    f.rot += f.rv * dt * 60;

    if (f.t >= 1) {
      const leader = f.leader;
      const target = f.target;
      fragments.splice(i, 1);
      if (leader) triggerBurn(target);
    }
  }
}

// ------------------------------------------------------------
// COMBUSTION / POWER
// ------------------------------------------------------------

function triggerBurn(target) {
  const previousBurnCount = burnCount;
  burnCount++;
  burnPulse = 1;
  feedPulse = 1;

  burnTimes.push(sceneTime);
  burnTimes = burnTimes.filter(t => sceneTime - t <= 4.5);
  overdrive = constrain((burnTimes.length - 2) / 3, 0, 1);
  overdrivePulse = max(overdrivePulse, overdrive);

  const emissionMul = 1 + overdrive * 1.85;

  // The natural Microwave bell is isolated from normal operation and only
  // becomes available when the machine's visual progress reaches 100%.
  if (previousBurnCount < MACHINE_SOUND_COMPLETE_BURNS && burnCount >= MACHINE_SOUND_COMPLETE_BURNS &&
      window.HarmSound && window.HarmSound.cues && window.HarmSound.cues.machineComplete) {
    window.HarmSound.cues.machineComplete();
  }

  machineHeat = min(1.45, machineHeat + .32 + overdrive * .28);

  // Every burn creates useful power and an environmental debt.
  // Rapid repeated burns deliberately make the emissions cost grow faster than the reward.
  pollution = min(100, pollution + 3.8 * emissionMul);

  // The first coal burns progressively construct the houses and factories.
  // This replaces the previous time-based self-assembly.
  const newlyFormingNode = unlockArchitectureForBurn(burnCount);
  const node = target || newlyFormingNode || chooseTarget();
  if (node) spawnEnergy(node);

  // Avoid one-click frame spikes. The machine gives a compact burst; the factories
  // provide the sustained industrial plume after architecture comes online.
  const smokeBurst = floor((3 + pollution * .012) * (1 + overdrive * .65));
  const carbonBurst = floor((3 + pollution * .014) * (1 + overdrive * .70));
  const ashBurst = floor((2 + pollution * .007) * (1 + overdrive * .45));
  for (let i = 0; i < smokeBurst; i++) emitMachineSmoke(true);
  for (let i = 0; i < carbonBurst; i++) emitCarbon(machineExhaustPoint(), 1 + overdrive * .24);
  for (let i = 0; i < ashBurst; i++) emitAsh();

  // A burn pulse also physically disturbs the visual field without directly damaging it.
  applyCombustionShockwave(.45 + overdrive * .55);

  if (overdrive > .22) setStatus('OVERDRIVE · THE GRID SURGES, BUT POLLUTION RISES FASTER', 3.0, 3);
  else setStatus('POWER ARRIVES IMMEDIATELY · SMOKE AND SOOT REMAIN AFTER EACH BURN', 2.8, 2);
}

function chooseTarget() {
  const readyHouses = houses.filter(h => objectReady(h) && h.charge < .55);
  if (readyHouses.length && random() < .72) {
    const h = random(readyHouses);
    return { id: h.id, type: 'house', ref: h };
  }

  const readyFactories = factories.filter(f => objectReady(f) && f.activity < .45);
  if (readyFactories.length && random() < .60) {
    const f = random(readyFactories);
    return { id: f.id, type: 'factory', ref: f };
  }

  const ready = demandNodes.filter(n => objectReady(n.ref));
  return ready.length ? random(ready) : null;
}

function spawnEnergy(node) {
  const start = machineEnergyPoint();
  const end = nodePoint(node);
  const followerCount = 6 + floor(random(4)) + floor(overdrive * 4);
  energyClusters.push({
    node,
    sx: start.x, sy: start.y,
    ex: end.x, ey: end.y,
    x: start.x, y: start.y,
    t: 0,
    speed: random(.018, .026) * (1 + overdrive * .12),
    phase: random(TWO_PI),
    arcSign: random() < .5 ? -1 : 1,
    followers: Array.from({ length: followerCount }, () => ({
      x: start.x,
      y: start.y,
      phase: random(TWO_PI),
      radius: random(8, 25 + overdrive * 10),
      size: random(3, 7 + overdrive * 2)
    }))
  });

  if (energyClusters.length > MAX_ENERGY) energyClusters.shift();
}

function updateEnergy(dt) {
  for (let i = energyClusters.length - 1; i >= 0; i--) {
    const e = energyClusters[i];
    e.t += e.speed * dt * 60;
    const q = ease(constrain(e.t, 0, 1));
    const arc = sin(q * PI) * min(115, dist(e.sx, e.sy, e.ex, e.ey) * .14) * e.arcSign;
    e.x = lerp(e.sx, e.ex, q);
    e.y = lerp(e.sy, e.ey, q) - abs(arc) * .72;

    for (const f of e.followers) {
      f.phase += dt * 2.2;
      const tx = e.x + cos(f.phase) * f.radius;
      const ty = e.y + sin(f.phase) * f.radius * .38;
      f.x = lerp(f.x, tx, .18);
      f.y = lerp(f.y, ty, .18);
    }

    // Nearby poles briefly conduct even though the route remains visually direct.
    for (const p of poles) {
      if (dist(e.x, e.y, p.x, p.y - 128 * p.s) < 110) p.energy = max(p.energy, .72);
    }

    if (e.t >= 1) {
      applyPower(e.node);
      energyClusters.splice(i, 1);
    }
  }
}

function applyPower(node) {
  if (!node || !node.ref) return;
  powerDelivered++;

  if (node.type === 'house') {
    node.ref.charge = min(1.25, node.ref.charge + .78);
    node.ref.powerPulse = 1;
  } else if (node.type === 'factory') {
    node.ref.energy = min(1.35, node.ref.energy + .78);
    node.ref.activity = min(1.75, node.ref.activity + .95 + overdrive * .28);
    node.ref.powerPulse = 1;
    node.ref.startupBurst = max(node.ref.startupBurst, 1.35 + overdrive * .55);
  }

  // Power arrival is visual-only. Water Tap is reserved for the factory-smoke
  // background so electricity delivery does not add another foreground sound.
}


function applyCombustionShockwave(intensity = 1) {
  const origin = machineEnergyPoint();
  for (const a of ambientFragments) {
    const dx = a.x - origin.x, dy = a.y - origin.y;
    const d = max(20, sqrt(dx * dx + dy * dy));
    if (d < 620) {
      const f = (1 - d / 620) * intensity;
      a.vx += dx / d * f * .34;
      a.vy += dy / d * f * .18;
    }
  }
  for (const s of smoke) {
    // A burn pulse may disturb the machine exhaust, but it should not kick remote
    // factory plumes sideways. Industrial smoke keeps its chimney-defined airflow.
    if (s.legacyFactorySmoke || s.kind === 'factoryV21') continue;
    const dx = s.x - origin.x, dy = s.y - origin.y;
    const d = max(25, sqrt(dx * dx + dy * dy));
    if (d < 360) {
      const f = (1 - d / 360) * intensity;
      s.vx += dx / d * f * .085;
      s.vy += dy / d * f * .038;
      s.stretch = max(s.stretch || 0, f * .42);
    }
  }
  for (const p of poles) p.energy = max(p.energy, intensity * .08);
}

// ------------------------------------------------------------
// WORLD UPDATE / POLLUTION-DRIVEN DECAY
// ------------------------------------------------------------

function updateWorld(dt) {
  const globalP = pollution / 100;
  const smokeLoad = constrain(smoke.length / max(1, MAX_SMOKE), 0, 1);
  updateDemandQueue();

  for (const h of houses) {
    if (h.locked) continue;
    h.unlockPulse = max(0, (h.unlockPulse || 0) - dt * .75);
    h.charge = max(0, h.charge - dt * .040);
    h.powerPulse = max(0, h.powerPulse - dt * 1.3);
    h.demandFlash = max(0, h.demandFlash - dt * .50);
    updateObjectExposure(h, 'house', dt, globalP);

    const houseCharge = constrain(h.charge, 0, 1.2);
    if (burnCount > 0 && objectReady(h) && houseCharge > .18) {
      if (!Number.isFinite(h.housePuffTimer)) h.housePuffTimer = random(1.0, 2.4);
      h.housePuffTimer -= dt;
      if (h.housePuffTimer <= 0 && smoke.length < MAX_SMOKE - 10) {
        emitHouseSmoke(h, .34 + houseCharge * .18 + globalP * .14);
        const houseRate = lerp(2.35, .98, constrain(houseCharge * .70 + smokeLoad * .30, 0, 1));
        h.housePuffTimer = max(.48, houseRate * random(.82, 1.16) / max(.76, h.smokeBias || 1));
      }
    }
  }

  for (const t of trees) {
    updateObjectExposure(t, 'tree', dt, globalP);
    t.exposure = constrain((t.exposure || 0) + smokeLoad * (.030 + (t.localAir || 0) * .018) * dt, 0, 1);
    t.soot = constrain((t.soot || 0) + smokeLoad * .020 * dt + globalP * .010 * dt, 0, 1);
    const localDamage = getObjectDamageLevel(t);
    const wilt = constrain(localDamage + smokeLoad * .72 + globalP * .16, 0, 1.7);
    t.health = constrain(1 - wilt * 1.02, .015, 1);
  }

  for (const po of poles) {
    po.energy = max(0, po.energy - dt * .09);
    updateObjectExposure(po, 'pole', dt, globalP);
  }

  let factoryAudioLevel = 0;

  for (let fi = 0; fi < factories.length; fi++) {
    const f = factories[fi];
    if (f.locked) continue;
    f.unlockPulse = max(0, (f.unlockPulse || 0) - dt * .75);
    f.energy = max(0, f.energy - dt * .08);
    f.activity = max(0, f.activity - dt * .065);
    f.powerPulse = max(0, f.powerPulse - dt * 1.0);
    f.demandFlash = max(0, f.demandFlash - dt * .50);
    f.startupBurst = max(0, f.startupBurst - dt);
    f.emissionClock += dt;

    updateObjectExposure(f, 'factory', dt, globalP);
    const damage = getObjectDamageLevel(f);
    f.soot = lerp(f.soot, constrain(f.activity * .45 + f.localAir * .72 + damage * .28, 0, 1), .030);


    // Once the fossil system has started, EVERY formed factory becomes an industrial source.
    // Emission timing is cadence-based, not frame-random: this creates a coherent plume.
    const industrialSystemRunning = burnCount > 0;
    if (industrialSystemRunning && objectReady(f)) {
      const activity = constrain(f.activity, 0, 1.55);
      const origins = factorySmokeOrigins(f);
      const liveChimneys = [];
      for (let ci = 0; ci < origins.length; ci++) {
        const partIndex = ci === 0 ? 2 : 3;
        if (formationProgress(f, partIndex) > .82) liveChimneys.push(ci);
      }

      // Idle stacks now breathe a little more continuously so factory plumes read as sustained
      // industrial exhaust rather than isolated puffs. Powered / startup / overdrive states
      // shorten the interval, while each stack keeps its own offset so twin chimneys never pulse in lock-step.
      const activeN = constrain(activity / 1.55, 0, 1);
      if (liveChimneys.length) {
        const chimneyPresence = constrain(liveChimneys.length / max(1, origins.length), 0, 1);
        const bed = constrain(0.20 + chimneyPresence * 0.22 + activeN * 0.34 + min(0.20, f.startupBurst * 0.08), 0, 1);
        factoryAudioLevel = max(factoryAudioLevel, bed);
      }
      const baseInterval = lerp(.74, .18, activeN);
      const startupBoost = 1 + f.startupBurst * 1.36;
      const overdriveBoost = 1 + overdrive * .70;
      const intervalScale = 1 / max(.56, f.smokeBias * startupBoost * overdriveBoost);

      if (!Array.isArray(f.puffTimers)) f.puffTimers = [random(.2, .9), random(.5, 1.2)];
      for (const ci of liveChimneys) {
        if (!Number.isFinite(f.puffTimers[ci])) f.puffTimers[ci] = random(.2, 1.0);
        f.puffTimers[ci] -= dt;
        if (f.puffTimers[ci] <= 0 && smoke.length < MAX_SMOKE - 18) {
          const strength = 1.06 + activity * .30 + f.startupBurst * .25 + overdrive * .13 + smokeLoad * .05;
          emitFactorySmoke(f, ci, strength);
          const phaseOffset = ci * .07 + .03 * sin(f.chimneyPhase + ci * 1.7);
          f.puffTimers[ci] = max(.21, baseInterval * intervalScale * random(.80, 1.06) + phaseOffset);
        }
      }

      // Dust uses a slower independent cadence so it does not visually fire with every puff.
      if (!Number.isFinite(f.dustTimer)) f.dustTimer = random(.7, 1.7);
      f.dustTimer -= dt;
      if (liveChimneys.length && f.dustTimer <= 0 && carbonDust.length < MAX_CARBON - 12) {
        const ci = random(liveChimneys);
        emitFactoryDust(f, ci, .78 + activity * .24 + overdrive * .08);
        const dustBase = lerp(2.4, .82, activeN) / (1 + f.startupBurst * .60 + overdrive * .34);
        f.dustTimer = dustBase * random(.78, 1.26);
      }
    }
  }

  if (window.HarmSound && typeof window.HarmSound.setFactoryAtmosphere === 'function') {
    window.HarmSound.setFactoryAtmosphere(factoryAudioLevel);
  }

  // The central coal plant remains the strongest primary combustion source.
  if (burnCount > 0 && random() < dt * (.032 + machineHeat * .22 + overdrive * .13) && smoke.length < MAX_SMOKE - 8) {
    emitMachineSmoke(false);
  }
}

function objectTopY(o, source) {
  if (source === 'tree') return o.y - 126 * o.s;
  if (source === 'house') return o.y - 82 * o.s;
  if (source === 'pole') return o.y - 154 * o.s;
  return o.y - 230 * o.s;
}

function updateObjectExposure(o, source, dt, globalP) {
  const local = constrain(samplePollution(o.x, o.y) * .92 + globalP * .10, 0, 1);
  const ceiling = getCeilingDepthAtX(o.x, 5);
  const topY = objectTopY(o, source);
  const ceilingStress = smooth01(map(ceiling - topY, -180, 100, 0, 1));

  o.localAir = lerp(o.localAir || 0, local, constrain(dt * 1.2, .01, .10));
  o.exposure = constrain((o.exposure || 0) + (local * .034 + ceilingStress * .060) * dt, 0, 1);
  o.soot = constrain((o.soot || 0) + local * .018 * dt - (local < .08 ? .0012 * dt : 0), 0, 1);
  o.stress = lerp(o.stress || 0, ceilingStress, constrain(dt * .85, .01, .08));

  const damage = getObjectDamageLevel(o);
  updateDamageParts(o, damage, source);
}

function getObjectDamageLevel(o) {
  return constrain((o.exposure || 0) * .64 + (o.soot || 0) * .20 + (o.stress || 0) * .52 + (o.localAir || 0) * .22, 0, 1);
}

function updateDamageParts(o, p, source) {
  if (!o.damageThresholds) return;

  // Factories remain visible and keep polluting.
  // They can darken and look stressed, but they should not fall apart.
  if (source === 'factory') return;

  for (let i = 0; i < o.damageThresholds.length; i++) {
    if (o.damageTriggered[i]) continue;
    if (p >= o.damageThresholds[i]) {
      o.damageTriggered[i] = true;
      o.detached[i] = true;
      const wp = damagePartWorldPoint(o, source, i);
      emitDebris(wp.x, wp.y, source, o.s * random(.75, 1.20), i);
      // The Plastic Bag cue now always has a visible partner: a short gust of
      // wind-blown litter released from the same damaged object.
      triggerDamageMoment(wp.x, wp.y, constrain(.46 + p * .32, 0, 1), source);
    }
  }
}

function damagePartWorldPoint(o, source, i) {
  if (source === 'tree') {
    const pts = [[0, -45], [-28, -82], [3, -112], [34, -82], [6, -62]];
    return localToWorld(o, pts[i % pts.length][0], pts[i % pts.length][1]);
  }
  if (source === 'house') {
    const pts = [[0, -15], [0, -53], [-25, -44], [3, -47], [19, -15], [34, -32]];
    return localToWorld(o, pts[i % pts.length][0], pts[i % pts.length][1]);
  }
  if (source === 'pole') {
    const pts = [[0, -74], [0, -146], [-31, -139], [31, -139], [0, -126]];
    return localToWorld(o, pts[i % pts.length][0], pts[i % pts.length][1]);
  }
  const pts = [[0, 36], [-40, -44], [-80, 18], [-40, 18], [2, 18], [78, 28], [58, -160]];
  return localToWorld(o, pts[i % pts.length][0], pts[i % pts.length][1]);
}

function localToWorld(o, lx, ly) {
  const cs = cos(o.rot), sn = sin(o.rot);
  const x = lx * o.s;
  const y = ly * o.s;
  return { x: o.x + x * cs - y * sn, y: o.y + x * sn + y * cs };
}

// ------------------------------------------------------------
// DAMAGE MOMENT — PLASTIC / LITTER GUST
// ------------------------------------------------------------

function triggerDamageMoment(x, y, intensity = 1, source = 'environment') {
  const strength = constrain(intensity, .25, 1);

  // Visual starts immediately with the same event that requests Plastic Bag audio.
  // If sound is muted the environmental consequence remains visible.
  emitDamageWaste(x, y, strength, source);

  if (window.HarmSound && window.HarmSound.cues && window.HarmSound.cues.damage) {
    window.HarmSound.cues.damage(strength);
  }
  return true;
}

function emitDamageWaste(x, y, intensity = 1, source = 'environment') {
  const strength = constrain(intensity, 0, 1);
  // Slightly richer burst than the previous version, but still capped so this
  // remains a supporting visual layer rather than another particle system.
  const count = floor(4 + strength * 6);
  const globalP = pollutionN();

  for (let i = 0; i < count; i++) {
    // Eight deliberately different silhouettes keep repeated DAMAGE moments from
    // looking stamped or repetitive while preserving the angular HARM language.
    // 0 bag / 1 wrapper / 2 film ribbon / 3 crushed can / 4 bottle shard /
    // 5 loop / 6 foil shard / 7 hooked cable-strip.
    const roll = random();
    let kind = 0;
    if (roll < .22) kind = 0;
    else if (roll < .40) kind = 1;
    else if (roll < .55) kind = 2;
    else if (roll < .67) kind = 3;
    else if (roll < .78) kind = 4;
    else if (roll < .86) kind = 5;
    else if (roll < .94) kind = 6;
    else kind = 7;

    const direction = random() < .18 ? -1 : 1;
    const lift = source === 'pollution' ? random(-1.62, -.76) : random(-1.28, -.34);

    damageWaste.push({
      x: x + random(-20, 20),
      y: y + random(-14, 14),
      vx: direction * random(.32, .88) + smokeWind * .34,
      vy: lift,
      g: random(.010, .020),
      rot: random(-.95, .95),
      rv: random(-.060, .060),
      phase: random(TWO_PI),
      flutter: random(7.0, 12.4),
      size: random(12, 27) * (0.86 + strength * .36),
      kind,
      variant: floor(random(4)),
      mirror: random() < .5 ? -1 : 1,
      stretch: random(.78, 1.34),
      age: 0,
      life: random(8.5, 13.8),
      ground: random(H * .79, H - 24),
      settled: false,
      alpha: random(145, 218),
      tint: random(),
      pollutionAtBirth: globalP
    });
  }

  while (damageWaste.length > 105) damageWaste.shift();
}

function updateDamageWaste(dt) {
  for (let i = damageWaste.length - 1; i >= 0; i--) {
    const w = damageWaste[i];
    w.age += dt;

    if (!w.settled) {
      const air = samplePollution(w.x, w.y);
      const gust = sin(sceneTime * 1.7 + w.phase) * (.006 + air * .018);
      w.vx += (smokeWind * .0019 + gust) * dt * 60;
      w.vy += w.g * dt * 60;
      w.x += (w.vx + sin(w.age * w.flutter + w.phase) * .22) * dt * 60;
      w.y += (w.vy + cos(w.age * (w.flutter * .72) + w.phase) * .07) * dt * 60;
      w.rot += (w.rv + sin(w.age * 6.4 + w.phase) * .004) * dt * 60;
      w.vx *= .996;

      if (w.x < -36) w.x = W + 34;
      else if (w.x > W + 36) w.x = -34;

      if (w.y >= w.ground) {
        w.y = w.ground;
        w.vy *= -.12;
        w.vx *= .56;
        if (abs(w.vy) < .07) {
          w.vy = 0;
          w.vx *= .18;
          w.settled = true;
          w.settledAt = sceneTime;
          w.rot *= .45;
        }
      }
    }

    const settledAge = sceneTime - (w.settledAt || sceneTime);
    if (w.age > w.life || (w.settled && settledAge > 7.5)) {
      damageWaste.splice(i, 1);
    }
  }
}

function drawDamageWaste() {
  for (const w of damageWaste) {
    const fadeIn = constrain(w.age / .16, 0, 1);
    const remaining = constrain((w.life - w.age) / 2.0, 0, 1);
    const a = w.alpha * fadeIn * (w.settled ? min(1, remaining + .30) : max(.30, remaining));
    if (a <= 2) continue;

    push();
    translate(w.x, w.y);
    rotate(w.rot);
    const flutterY = w.settled ? .70 : .72 + sin(w.age * w.flutter + w.phase) * .20;
    const flutterX = w.settled ? 1 : 1 + cos(w.age * (w.flutter * .54) + w.phase) * .06;
    scale(w.mirror * flutterX, flutterY);
    drawDamageWastePiece(w, a);
    pop();
  }
}

function drawDamageWastePiece(w, a) {
  const s = w.size;
  const dirt = constrain(pollutionN() * .55 + w.pollutionAtBirth * .20, 0, .72);
  const darkA = a * (.48 + dirt * .16);

  if (w.kind === 0) {
    // Crumpled plastic bag — asymmetric handles and fold lines vary per particle.
    const bagBase = lerpColor(color(C.paper), color(C.violet), .14 + w.tint * .16);
    fill(red(bagBase) * (1 - dirt * .18), green(bagBase) * (1 - dirt * .18), blue(bagBase) * (1 - dirt * .12), a);
    noStroke();
    const lean = (w.variant - 1.5) * .07 * s;
    polygon([[-.68*s,-.46*s],[.48*s + lean,-.57*s],[.72*s,.44*s],[.10*s,.69*s],[-.64*s,.49*s]]);
    fill(20, 21, 28, darkA);
    polygon([[-.50*s,-.14*s],[.45*s,-.25*s],[.36*s,-.04*s],[-.43*s,.05*s]]);
    noFill();
    stroke(18, 19, 25, a * .78);
    strokeWeight(max(1, s * .070));
    arc(-.24*s, -.48*s, .32*s, .42*s, PI, TWO_PI);
    arc(.22*s, -.52*s, .36*s, .46*s, PI, TWO_PI);
    noStroke();
    return;
  }

  if (w.kind === 1) {
    // Folded snack / packaging wrapper with a clipped corner and offset band.
    fill(lerpColor(color(C.orange), color(C.paper), .40 + w.tint * .34));
    polygon([[-.75*s,-.34*s],[.42*s,-.54*s],[.76*s,-.14*s],[.59*s,.38*s],[.10*s,.57*s],[-.66*s,.38*s]]);
    fill(18, 19, 25, darkA);
    polygon([[-.56*s,-.02*s],[.54*s,-.20*s],[.58*s,-.02*s],[-.52*s,.18*s]]);
    fill(C.blue);
    rect(.30*s, .30*s, s * .24, s * .10);
    return;
  }

  if (w.kind === 2) {
    // Thin torn film / ribbon: long, bent and intentionally strange in silhouette.
    fill(lerpColor(color(C.grey), color(C.violet), .28 + w.tint * .26));
    const l = s * (1.15 + .28 * w.stretch);
    polygon([[-l,-.16*s],[-.40*l,-.34*s],[.06*l,-.11*s],[.47*l,-.31*s],[l,-.04*s],[.54*l,.18*s],[.02*l,.08*s],[-.48*l,.30*s]]);
    fill(10, 11, 16, darkA * .72);
    polygon([[-.42*l,-.07*s],[.02*l,-.17*s],[.30*l,-.08*s],[-.05*l,.02*s]]);
    return;
  }

  if (w.kind === 3) {
    // Crushed can / cup — abstracted into a skewed industrial capsule.
    fill(lerpColor(color(C.light), color(C.orange), .18 + w.tint * .22));
    polygon([[-.50*s,-.62*s],[.40*s,-.52*s],[.58*s,-.18*s],[.42*s,.55*s],[-.34*s,.65*s],[-.61*s,.24*s]]);
    fill(19, 20, 27, darkA);
    polygon([[-.37*s,-.19*s],[.42*s,-.27*s],[.32*s,-.04*s],[-.28*s,.04*s]]);
    noFill();
    stroke(17, 18, 24, a * .74);
    strokeWeight(max(1, s * .06));
    line(-.34*s, -.48*s, .31*s, -.41*s);
    line(-.30*s, .47*s, .27*s, .40*s);
    noStroke();
    return;
  }

  if (w.kind === 4) {
    // Bottle / label shard — recognizable only as a broken container silhouette.
    fill(lerpColor(color(C.blue), color(C.paper), .35 + w.tint * .30));
    polygon([[-.26*s,-.72*s],[.18*s,-.72*s],[.22*s,-.47*s],[.48*s,-.25*s],[.38*s,.62*s],[-.36*s,.67*s],[-.50*s,-.12*s],[-.28*s,-.43*s]]);
    fill(C.lime);
    polygon([[-.36*s,-.05*s],[.40*s,-.13*s],[.37*s,.17*s],[-.31*s,.23*s]]);
    fill(15,16,22,darkA*.74);
    rect(-.02*s, -.60*s, .30*s, .08*s);
    return;
  }

  if (w.kind === 5) {
    // Loop / gasket / ring fragment — introduces negative-space-looking geometry
    // without erase(), so it remains robust in the 2D renderer.
    noFill();
    stroke(lerpColor(color(C.orange), color(C.violet), .42));
    strokeWeight(max(2, s * .16));
    ellipse(0, 0, s * 1.12, s * .78);
    stroke(15, 16, 21, a * .70);
    strokeWeight(max(1, s * .055));
    line(.20*s, -.30*s, .68*s, -.58*s);
    line(.68*s, -.58*s, .80*s, -.35*s);
    noStroke();
    return;
  }

  if (w.kind === 6) {
    // Jagged foil shard — star-like but asymmetric, useful as a quick flash shape.
    fill(lerpColor(color(C.paper), color(C.grey), .34 + dirt * .16));
    polygon([[-.78*s,-.12*s],[-.30*s,-.30*s],[-.12*s,-.78*s],[.18*s,-.30*s],[.70*s,-.54*s],[.46*s,-.02*s],[.84*s,.32*s],[.24*s,.34*s],[-.12*s,.76*s],[-.34*s,.30*s],[-.78*s,.42*s],[-.55*s,.08*s]]);
    fill(C.orange);
    polygon([[-.22*s,-.16*s],[.35*s,-.24*s],[.22*s,.12*s],[-.12*s,.22*s]]);
    return;
  }

  // Hooked cable-tie / torn strap — a crooked silhouette unlike the flat wrappers.
  fill(lerpColor(color(C.violet), color(C.grey), .18 + w.tint * .22));
  polygon([[-.82*s,-.16*s],[-.18*s,-.30*s],[.34*s,-.10*s],[.70*s,-.48*s],[.88*s,-.29*s],[.48*s,.08*s],[.80*s,.32*s],[.55*s,.50*s],[.18*s,.18*s],[-.20*s,.34*s],[-.72*s,.18*s]]);
  fill(14,15,20,darkA*.72);
  polygon([[-.52*s,-.04*s],[-.10*s,-.12*s],[.18*s,-.02*s],[-.16*s,.10*s]]);
}

function damageMilestoneOrigin(index) {
  // Prefer the most active, already-unlocked factory. If none is available, use
  // the central coal machine so the litter gust still has a clear physical source.
  const active = factories
    .filter(f => !f.locked)
    .slice()
    .sort((a, b) => (b.activity || 0) - (a.activity || 0));
  const f = active[index % max(1, active.length)];
  if (f) {
    const origins = factorySmokeOrigins(f);
    const o = origins[index % origins.length] || { x: f.x, y: f.y - 150 * f.s };
    return { x: o.x + random(-25, 25), y: o.y + random(20, 55) };
  }
  const m = machineExhaustPoint();
  return { x: m.x + random(-20, 20), y: m.y + random(18, 42) };
}

function updateDamageMilestones() {
  const p = pollutionN();
  const marks = [.28, .55, .78];
  const strengths = [.66, .80, .96];

  for (let i = 0; i < marks.length; i++) {
    if (damageWasteMilestones[i] || p < marks[i]) continue;
    damageWasteMilestones[i] = true;
    const o = damageMilestoneOrigin(i);
    triggerDamageMoment(o.x, o.y, strengths[i], 'pollution');
  }
}

// ------------------------------------------------------------
// SMOKE / SOOT / ASH / DEBRIS
// ------------------------------------------------------------

function machineExhaustPoint() {
  return { x: MACHINE.x + 84 * MACHINE.scale, y: MACHINE.y - 108 * MACHINE.scale };
}

function factorySmokeOrigins(f) {
  const local = factoryChimneys(f.variant).filter(Boolean);
  if (!local.length) return [{ x: f.x + 60 * f.s, y: f.y - 190 * f.s }];
  return local.map(c => localToWorld(f, c.x, c.y - c.h * .50));
}


function houseSmokeOrigin(h) {
  return localToWorld(h, 34, -58);
}

function emitHouseSmoke(h, strength = 1) {
  if (smoke.length >= MAX_SMOKE) return;
  const o = houseSmokeOrigin(h);
  emitSmoke(o.x, o.y, constrain(strength, .26, .78), `house-${h.id}`, .18, 0);
}

function emitMachineSmoke(burst = false) {
  const o = machineExhaustPoint();
  // Keep the machine as the ignition source, but visually secondary to the wider
  // industrial field. Smaller puffs and a lower burst count make the main factories
  // read as the larger atmospheric contributors.
  emitSmoke(o.x, o.y, burst ? .66 : .46, burst ? 'machineBurst' : 'machine', .22, null);
}

function emitFactorySmoke(f, chimneyIndex = 0, strength = 1) {
  if (smoke.length >= MAX_SMOKE) return;
  const origins = factorySmokeOrigins(f);
  const o = origins[constrain(chimneyIndex, 0, origins.length - 1)] || origins[0];
  const src = `factory-${f.id}-${chimneyIndex}`;
  const k = constrain(strength, .72, 1.30);

  // Keep the V20 / V21 chunky polygon language, but make the motion plume-based.
  // Factory smoke is slightly fuller and longer-lived than before, while small factories
  // remain proportionally smaller so the composition does not become a single grey mass.
  const factoryScale = map(constrain(f.s, .20, .56), .20, .56, .66, 1.06);
  const baseSize = random(16, 26) * factoryScale;
  const maxSize = random(104, 186) * factoryScale * (1 + constrain(f.activity, 0, 1.55) * .13);
  const spawnJitter = lerp(3.0, 6.2, factoryScale);
  const plumeSeed = (f.plumeSeed || f.seed) + chimneyIndex * 71.37;

  smoke.push({
    kind: 'factoryV21',
    source: src,
    factoryId: f.id,
    chimneyIndex,
    originX: o.x,
    originY: o.y,
    x: o.x + random(-spawnJitter, spawnJitter),
    y: o.y + random(-2.2, 1.8),
    // Near the mouth, all puffs rise nearly vertically. Horizontal drift develops later.
    vx: random(-.055, .055),
    vy: random(-1.22, -1.00) * lerp(.96, 1.08, k - .72),
    baseSize,
    size: baseSize,
    maxSize,
    age: 0,
    life: random(14.0, 20.5),
    seed: random(1000),
    plumeSeed,
    plumeBias: (f.plumeBias || 0) + random(-.025, .025),
    baseRot: random(-.18, .18),
    rot: 0,
    depth: 0,
    accent: random() < .055 ? 'orange' : random() < .14 ? 'violet' : 'grey',
    stained: false,
    legacyFactorySmoke: true
  });
}

function emitFactoryDust(f, chimneyIndex = 0, strength = 1) {
  const origins = factorySmokeOrigins(f);
  const o = origins[constrain(chimneyIndex, 0, origins.length - 1)] || origins[0];
  const count = 2 + floor(random(3));
  for (let i = 0; i < count; i++) {
    emitCarbon({
      x: o.x + random(-12, 12),
      y: o.y + random(-5, 18)
    }, strength * random(.72, 1.08));
  }
}

function emitSmoke(x, y, strength = 1, source = 'machine', sizeScale = 1, forcedDepth = null) {
  if (smoke.length >= MAX_SMOKE) return;
  const p = pollution / 100;
  smoke.push({
    originX: x,
    originY: y,
    x: x + random(-5, 5),
    y: y + random(-3, 3),
    vx: random(-.12, .12) * strength,
    vy: random(-1.22, -.78) * strength,
    size: random(9, 15) * strength * sizeScale,
    maxSize: random(48, 106) * strength * (1 + p * .18) * sizeScale,
    grow: random(.11, .22) * lerp(.68, .96, sizeScale),
    age: 0,
    life: String(source).startsWith('machine') ? random(7.0, 10.8) : random(10.0, 16.0),
    seed: random(1000),
    rot: random(TWO_PI),
    rv: random(-.006, .006),
    family: floor(random(6)),
    depth: forcedDepth === 0 || forcedDepth === 1 ? forcedDepth : (random() < .72 ? 0 : 1),
    source,
    accent: random() < .03 ? 'orange' : random() < .09 ? 'violet' : 'grey',
    stained: false,
    stretch: 0,
    disturbance: 0
  });
}

function updateSmoke(dt) {
  const p = pollution / 100;
  const mouseVX = mouseX - pmouseX;
  const perfFrame = (typeof frameCount === 'number' && Number.isFinite(frameCount)) ? frameCount : floor(sceneTime * 60);
  const smokeDensity = constrain(smoke.length / max(1, MAX_SMOKE), 0, 1);
  const smokeDensityBoost = 1 + smokeDensity * 1.9;

  const pointerWind = constrain(mouseVX * .0018, -.14, .14);
  smokeWindMouse = lerp(smokeWindMouse, pointerWind, constrain(dt * 3.0, .015, .16));
  smokeWindMouse *= pow(.988, dt * 60);
  const ambientWind = (noise(sceneSeed * .00017 + 17.3, sceneTime * .024) - .5) * .20
    + sin(sceneTime * .04 + sceneSeed * .0003) * .03;
  smokeWindTarget = ambientWind + smokeWindMouse;
  smokeWind = lerp(smokeWind, smokeWindTarget, constrain(1 - Math.exp(-dt * 1.05), .006, .10));

  for (let i = smoke.length - 1; i >= 0; i--) {
    const s = smoke[i];
    s.age += dt;

    if (s.legacyFactorySmoke || s.kind === 'factoryV21') {
      const lifeN = constrain(s.age / s.life, 0, 1);
      const rise = max(0, (s.originY || s.y) - s.y);
      const windMix = smooth01(map(rise, 18, 150, 0, 1));
      const highMix = smooth01(map(rise, 110, 320, 0, 1));

      // Noise fields are expensive. Recalculate every other frame per puff and reuse
      // the previous result in-between; position still updates every frame, so motion stays smooth.
      if (!Number.isFinite(s.cachedShared) || ((perfFrame + i) & 1) === 0) {
        s.cachedShared = (noise(s.plumeSeed * .0017, sceneTime * .062 + rise * .0012) - .5) * 2;
        s.cachedMicro = (noise(s.seed * .0019 + 8.2, sceneTime * .10) - .5) * 2;
      }
      const sharedField = s.cachedShared || 0;
      const microField = s.cachedMicro || 0;
      const targetVX = smokeWind * (.10 + windMix * .86)
        + (s.plumeBias || 0) * windMix
        + sharedField * (.018 + highMix * .060)
        + microField * .010;
      const targetVY = lerp(-1.08, -.34, smooth01(map(lifeN, .08, .86, 0, 1)));

      s.vx = lerp(s.vx, targetVX, constrain(dt * lerp(.92, 1.35, windMix), .004, .08));
      s.vy = lerp(s.vy, targetVY, constrain(dt * 1.22, .006, .09));
      s.x += s.vx * dt * 60;
      s.y += (s.vy + microField * .012 * highMix) * dt * 60;

      const growthT = (1 - Math.exp(-lifeN * 2.8)) / .93919;
      s.size = lerp(s.baseSize || s.size, s.maxSize, constrain(growthT, 0, 1));
      s.rot = (s.baseRot || 0) + sharedField * .045 + microField * .016;

      // Deposit the same approximate pollution, but only once every three frames.
      if ((perfFrame + i) % 3 === 0) {
        depositPollution(s.x, s.y, dt * 3 * (.00092 + s.size * .0000088) * 1.04 * smokeDensityBoost * (1 + constrain((s.size - 18) / 90, 0, 1) * .42));
      }
      if (!s.stained && s.y < 324 && p > .14 && random() < dt * (.014 + p * .070)) {
        s.stained = true;
        addStain(s);
      }
      if (s.age > s.life || s.y < -360 || s.x < -430 || s.x > W + 430) smoke.splice(i, 1);
      continue;
    }

    const lifeN = constrain(s.age / s.life, 0, 1);
    const sourceY = Number.isFinite(s.originY) ? s.originY : s.y;
    const rise = max(0, sourceY - s.y);
    const windMix = smooth01(map(rise, 18, 120, 0, 1));
    if (!Number.isFinite(s.cachedShared) || ((perfFrame + i) & 1) === 0) {
      s.cachedShared = (noise(s.seed * .0012 + 19, sceneTime * .070) - .5) * 2;
    }
    const sharedField = s.cachedShared || 0;
    const targetVX = smokeWind * (.08 + windMix * .55) + sharedField * (.010 + windMix * .028);
    const targetVY = lerp(-.98, -.30, smooth01(map(lifeN, .10, .84, 0, 1)));

    s.vx = lerp(s.vx, targetVX, constrain(dt * 1.10, .005, .08));
    s.vy = lerp(s.vy, targetVY, constrain(dt * 1.18, .005, .08));
    s.x += s.vx * dt * 60;
    s.y += s.vy * dt * 60;
    s.rot += s.rv * dt * 60 + sharedField * .004;
    s.size = min(s.maxSize, s.size + s.grow * dt * 60);

    if ((perfFrame + i) % 3 === 0) {
      depositPollution(s.x, s.y, dt * 3 * (.00086 + s.size * .0000078) * smokeDensityBoost * (1 + constrain((s.size - 14) / 80, 0, 1) * .36));
    }
    if (!s.stained && s.y < 324 && p > .18 && random() < dt * (.010 + p * .055)) {
      s.stained = true;
      addStain(s);
    }
    if (s.age > s.life || s.y < -340 || s.x < -380 || s.x > W + 380) smoke.splice(i, 1);
  }
}

function addStain(s) {
  stains.push({
    x: s.x + random(-22, 22),
    y: constrain(s.y + random(-10, 12), 20, 420),
    w: s.size * random(1.2, 2.5),
    h: s.size * random(.24, .64),
    a: random(2.0, 4.8),
    accent: s.accent,
    phase: random(TWO_PI)
  });
  if (stains.length > MAX_STAINS) stains.shift();
}

function emitCarbon(origin, strength = 1) {
  if (carbonDust.length >= MAX_CARBON) return;
  carbonDust.push({
    x: origin.x + random(-12, 12),
    y: origin.y + random(-4, 8),
    vx: random(-.32, .32),
    vy: random(.20, .85),
    g: random(.010, .024),
    size: random(1.7, 6.2) * strength,
    rot: random(TWO_PI),
    rv: random(-.05, .05),
    age: 0,
    life: random(8, 15),
    depth: random() < .76 ? 0 : 1,
    shape: floor(random(5)),
    settled: false,
    deposited: false,
    ground: random(H * .74, H - 24)
  });
}

function updateCarbon(dt) {
  const perfFrame = (typeof frameCount === 'number' && Number.isFinite(frameCount)) ? frameCount : floor(sceneTime * 60);
  for (let i = carbonDust.length - 1; i >= 0; i--) {
    const c = carbonDust[i];
    c.age += dt;
    if (!c.settled) {
      if (((perfFrame + i) & 1) === 0) c.windNoise = (noise(c.x * .003, c.y * .003, sceneTime * .06 + i * .01) - .5) * .018;
      c.vx += (c.windNoise || 0) * dt * 60;
      c.vy += c.g * dt * 60;
      c.x += c.vx * dt * 60;
      c.y += c.vy * dt * 60;
      c.rot += c.rv * dt * 60;
      c.vx *= .994;
      if (c.y >= c.ground) {
        c.y = c.ground;
        c.vy *= -.07;
        c.vx *= .42;
        if (abs(c.vy) < .07) {
          c.vy = 0;
          c.vx = 0;
          c.settled = true;
          c.settledAt = sceneTime;
        }
      }
    }
    if (c.settled && !c.deposited) {
      c.deposited = true;
      depositPollution(c.x, c.y, .022 + c.size * .0010);
    }
    // Local pollution preserves the consequence; the live particle no longer needs to
    // remain in the active simulation forever after it has settled.
    if ((c.settled && sceneTime - (c.settledAt || sceneTime) > 1.4) || (c.age > c.life && !c.settled)) {
      carbonDust.splice(i, 1);
    }
  }
}

function emitAsh() {
  if (ash.length >= MAX_ASH) return;
  const o = machineExhaustPoint();
  ash.push({
    x: o.x + random(-8, 8),
    y: o.y,
    vx: random(-.18, .18),
    vy: random(.40, .90),
    g: random(.012, .025),
    size: random(3, 8),
    rot: random(TWO_PI),
    rv: random(-.04, .04),
    ground: random(H * .80, H - 18),
    settled: false,
    deposited: false
  });
}

function updateAsh(dt) {
  for (let i = ash.length - 1; i >= 0; i--) {
    const a = ash[i];
    if (a.settled) {
      if (!a.deposited) {
        a.deposited = true;
        depositPollution(a.x, a.y, .008 + a.size * .0006);
      }
      if (sceneTime - (a.settledAt || sceneTime) > 1.8) ash.splice(i, 1);
      continue;
    }
    a.vy += a.g * dt * 60;
    a.x += a.vx * dt * 60;
    a.y += a.vy * dt * 60;
    a.rot += a.rv * dt * 60;
    if (a.y >= a.ground) {
      a.y = a.ground;
      a.vy *= -.07;
      a.vx *= .42;
      if (abs(a.vy) < .07) {
        a.vy = 0;
        a.vx = 0;
        a.settled = true;
        a.settledAt = sceneTime;
      }
    }
  }
}

function emitDebris(x, y, source, scaleFactor, partIndex) {
  const count = source === 'tree' ? 2 : 1;
  for (let k = 0; k < count; k++) {
    debris.push({
      x: x + random(-7, 7),
      y: y + random(-4, 4),
      vx: random(-.68, .68),
      vy: random(-.95, -.18),
      g: random(.020, .043),
      size: random(8, 16) * scaleFactor,
      rot: random(TWO_PI),
      rv: random(-.07, .07),
      age: 0,
      life: random(8, 18),
      source,
      partIndex,
      identitySeed: random(1000),
      settled: false,
      ground: random(H * .77, H - 18)
    });
  }
  while (debris.length > MAX_DEBRIS) debris.shift();
}

function updateDebris(dt) {
  for (let i = debris.length - 1; i >= 0; i--) {
    const d = debris[i];
    d.age += dt;
    if (!d.settled) {
      d.vy += d.g * dt * 60;
      d.x += d.vx * dt * 60;
      d.y += d.vy * dt * 60;
      d.rot += d.rv * dt * 60;
      d.vx *= .994;
      if (d.y >= d.ground) {
        d.y = d.ground;
        d.vy *= -.08;
        d.vx *= .45;
        if (abs(d.vy) < .08) {
          d.vy = 0;
          d.vx = 0;
          d.settled = true;
          d.settledAt = sceneTime;
        }
      }
    }
    if ((d.settled && sceneTime - (d.settledAt || sceneTime) > 9.0) || (d.age > d.life && !d.settled)) {
      debris.splice(i, 1);
    }
  }
}

function updateGlobal(dt) {
  burnPulse = max(0, burnPulse - dt * 1.55);
  feedPulse = max(0, feedPulse - dt * 2.05);
  machineHeat = max(0, machineHeat - dt * .026);
  overdrivePulse = max(0, overdrivePulse - dt * .34);

  burnTimes = burnTimes.filter(t => sceneTime - t <= 4.5);
  const targetOverdrive = constrain((burnTimes.length - 2) / 3, 0, 1);
  overdrive = lerp(overdrive, targetOverdrive, constrain(dt * 2.6, .02, .18));

  // Residue sustains dirty air but does not create pollution forever.
  let fieldAvg = 0;
  for (const v of pollutionField) fieldAvg += v;
  fieldAvg = pollutionField.length ? fieldAvg / pollutionField.length : 0;
  const persistenceFloor = fieldAvg * 82;
  const recovery = burnTimes.length ? .004 : .018;
  pollution = constrain(max(persistenceFloor, pollution - dt * recovery), 0, 100);

  const p = pollution / 100;
  updateDamageMilestones();
  const target = p < .08 ? 0 : map(p, .08, 1, 6, 540);
  smokeCeiling = lerp(smokeCeiling, target, .018);

  if (sceneTime > statusUntil) {
    if (pollution > 88) setStatus('CRITICAL AIR LOAD · POLLUTION NOW DOMINATES THE ATMOSPHERE', 2.1, 1);
    else if (pollution > 68) setStatus('HIGH AIR LOAD · THE GRID STAYS ACTIVE WHILE THE LANDSCAPE WEAKENS', 2.1, 1);
    else if (pollution > 42) setStatus('RISING AIR LOAD · POWER CONTINUES AS THE ENVIRONMENT DRIES AND DEGRADES', 2.1, 1);
    else if (demandQueue.length) setStatus('POWER DEMAND IS WAITING · EACH NEW BURN ALSO ADDS POLLUTION', 2.0, 1);
    else if (burnCount > 0) setStatus('THE GRID IS ACTIVE · THE ENVIRONMENTAL COST REMAINS IN THE AIR', 2.0, 1);
  }
}

// ------------------------------------------------------------
