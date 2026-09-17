import { sectionCurve, sectionSlope, sectionTiming } from './motion.js';

/* One owner and one motion loop. Intent releases directly into a continuous
   trajectory; native touch/keyboard movement hands off its measured velocity. */
export class SectionScroll {
  constructor({ view = window, root = document.documentElement, reducedMotion, onChange = () => {} }) {
    this.view = view;
    this.root = root;
    this.reducedMotion = reducedMotion;
    this.onChange = onChange;
    this.bounds = [];
    this.height = view.innerHeight;
    this.max = 0;
    this.locked = null;
    this.release = null;
    this.animation = null;
    this.isSectionTransitioning = false;
    this.touching = false;
    this.touchScroll = false;
    this.pointerHeld = false;
    this.direction = 0;
    this.velocity = 0;
    this.scrollVelocity = 0;
    this.transitionProgress = 0;
    this.currentSection = null;
    this.targetSection = null;
    this.lastY = view.scrollY;
    this.lastScrollAt = this.now();
    this.lastWheelAt = -Infinity;
    this.lastDelta = 0;
    this.wheelDirection = 0;
    this.intent = 0;
    this.tail = false;
    this.tailIntent = 0;
    this.lockedAt = 0;
    this.pending = 0;
    this.idleTimer = 0;

    view.addEventListener('scroll', () => this.scrolled(), { passive: true });
    view.addEventListener('wheel', event => {
      if (event.ctrlKey || event.metaKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || this.ownsInput(event.target)) return;
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? this.height : 1);
      if (event.cancelable && this.wheel(delta)) event.preventDefault();
    }, { passive: false });
    view.addEventListener('keydown', event => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || this.ownsInput(event.target, true)) return;
      this.key(event.key, event.shiftKey);
    });
    // Never cancel a touchmove. A finger/scrollbar takes control immediately;
    // settlement waits for both release and the end of browser momentum.
    view.addEventListener('pointerdown', () => { this.pointerHeld = true; this.cancel(); }, { passive: true });
    view.addEventListener('pointerup', () => { this.pointerHeld = false; this.queueSettle(); }, { passive: true });
    view.addEventListener('pointercancel', () => { this.pointerHeld = false; this.queueSettle(); }, { passive: true });
    view.addEventListener('touchstart', () => { this.touching = this.touchScroll = true; this.release = null; this.cancel(); }, { passive: true });
    const touchEnd = event => { this.touching = event.touches.length > 0; this.queueSettle(); };
    view.addEventListener('touchend', touchEnd, { passive: true });
    view.addEventListener('touchcancel', touchEnd, { passive: true });
    view.addEventListener('blur', () => { this.touching = this.pointerHeld = false; this.queueSettle(); });
    reducedMotion.addEventListener('change', () => {
      if (reducedMotion.matches && this.animation) this.finish();
    });
    root.dataset.sectionMotion = 'free';
  }

  now() { return this.view.performance.now(); }
  setSuspended(value) {
    this.suspended=value;
    this.cancel(false);
    this.view.clearTimeout(this.idleTimer);
    this.view.cancelAnimationFrame(this.pending);this.pending=0;
    this.touching=this.pointerHeld=this.touchScroll=false;
    this.intent=this.tailIntent=0;this.tail=false;this.release=null;
    this.lastY=this.view.scrollY;this.scrollVelocity=0;
  }
  clamp(y) { return Math.max(0, Math.min(this.max, y)); }
  at(id) { return this.bounds.find(bound => bound.id === id); }
  target(bound) { return this.clamp(bound.top); }
  // Long editorial sections retain their full readable scrolling interval.
  end(bound) { return bound.artwork || bound.bottom - bound.top <= this.height + 2
    ? this.target(bound) : this.clamp(Math.max(bound.top, bound.bottom - this.height)); }
  ownsInput(target, keyboard = false) {
    return Boolean(target?.closest(keyboard
      ? 'input,select,textarea,button,a,summary,[contenteditable]:not([contenteditable="false"]),[role="slider"],dialog[open],.artwork-tools-panel'
      : 'input,select,textarea,[contenteditable]:not([contenteditable="false"]),[role="slider"],dialog[open],.artwork-tools-panel'));
  }
  current() {
    const y = this.view.scrollY;
    let current = this.bounds[0], largest = -1;
    for (const bound of this.bounds) {
      const visible = Math.max(0, Math.min(y + this.height, bound.bottom) - Math.max(y, bound.top));
      if (visible > largest) { largest = visible; current = bound; }
    }
    return current;
  }
  phase(value) { this.root.dataset.sectionMotion = value; this.onChange(); }

  measure(bounds, height, max) {
    const changed = height !== this.height || Math.abs(max - this.max) > 1 || bounds.some((bound, i) =>
      !this.bounds[i] || Math.abs(bound.top - this.bounds[i].top) > 1 || Math.abs(bound.bottom - this.bounds[i].bottom) > 1);
    const transition = this.animation;
    const anchored = this.locked && Math.abs(this.view.scrollY - this.target(this.at(this.locked))) <= 2;
    this.bounds = bounds;
    this.height = height;
    this.max = Math.max(0, max);
    if (transition) {
      if (changed) this.go(transition.id, { instant: true, onComplete: transition.onComplete });
      return;
    }
    if (anchored) this.view.scrollTo({ top: this.target(this.at(this.locked)), behavior: 'instant' });
    else if (!this.locked) {
      const aligned = bounds.find(bound => Math.abs(this.view.scrollY - this.target(bound)) <= 2);
      if (aligned) { this.locked = aligned.id; this.phase('locked'); }
    }
  }

  neighbor(origin, direction) { return this.bounds[this.bounds.indexOf(origin) + direction]; }
  beginRelease(direction) {
    const origin = this.at(this.locked) || this.current();
    // Release is latched for this gesture: it cannot repeatedly pull back into
    // the chapter that has just accepted a deliberate wheel movement.
    this.release = { origin: origin.id, direction };
    this.locked = null;
    this.tail = false;
    this.intent = 0;
    this.phase('released');
  }

  wheel(rawDelta) {
    if(this.suspended)return true;
    if (!Number.isFinite(rawDelta) || !rawDelta || !this.bounds.length || this.touching) return false;
    const delta = Math.max(-this.height * 1.5, Math.min(this.height * 1.5, rawDelta));
    const amount = Math.abs(delta), direction = Math.sign(delta), now = this.now();
    this.touchScroll = false;
    const gap = now - this.lastWheelAt;
    const reversed = direction !== this.wheelDirection;
    const surge = amount >= 28 && amount > this.lastDelta * 1.7;
    const fresh = gap > 190 || reversed || surge;
    this.lastWheelAt = now;
    this.lastDelta = amount;
    this.wheelDirection = direction;
    this.direction = direction;
    this.view.clearTimeout(this.idleTimer);
    this.queueSettle();

    if (this.animation) {
      this.tailIntent = fresh ? amount : this.tailIntent + amount;
      const opposite = direction !== this.animation.direction;
      // Retarget from the current position/velocity. Strong input must not cause
      // either the old instant finish or an instantaneous reverse displacement.
      if (now - this.animation.started > 160 && this.tailIntent >= Math.max(180, this.height * .3) && (fresh || opposite)) {
        if (opposite) {
          const behind = this.bounds.map(bound => ({ bound, position: direction > 0 ? this.target(bound) : this.end(bound) }))
            .filter(candidate => (candidate.position-this.view.scrollY)*direction > 2)
            .sort((a,b) => Math.abs(a.position-this.view.scrollY)-Math.abs(b.position-this.view.scrollY))[0];
          if (behind) this.go(behind.bound.id, { position: behind.position, quick: true });
          return true;
        }
        this.go(this.animation.id, { position: this.animation.end, onComplete: this.animation.onComplete, quick: true });
      }
      return true;
    }
    if (this.tail) {
      this.tailIntent += amount;
      const sustained = now - this.lockedAt > 380 && this.tailIntent > Math.max(260, this.height * .4) && amount >= 12;
      if (!fresh && !sustained) return true;
      this.tail = false;
      this.intent = 0;
    }
    const locked = this.at(this.locked);
    if (locked && Math.abs(this.view.scrollY - this.target(locked)) <= 3) {
      if (reversed || gap > 220) this.intent = 0;
      this.intent += amount;
      const threshold = locked.artwork || locked.strong ? Math.max(54, Math.min(108, this.height * .1)) : 28;
      if (this.intent < threshold) return true;
      this.beginRelease(direction);
      const next = this.neighbor(locked, direction);
      const atEdge = direction > 0 ? this.view.scrollY >= this.end(locked)-2 : this.view.scrollY <= this.target(locked)+2;
      if (next && atEdge) {
        // No raw wheel jump followed by a timer and a second acceleration.
        this.go(next.id, { position: direction > 0 ? this.target(next) : this.end(next), strength: amount / Math.max(32, Math.min(120, gap)) });
        return true;
      }
    } else if (this.locked) this.locked = null;

    // An opposite gesture releases the earlier destination, instead of fighting it.
    if (this.release && direction !== this.release.direction) this.release = null;
    const origin = this.release ? this.at(this.release.origin) : this.current();
    const next = this.neighbor(origin, direction);
    if (next) {
      const destination = direction > 0 ? this.target(next) : this.end(next);
      if ((destination - this.view.scrollY) * direction >= 0 && (this.view.scrollY + rawDelta - destination) * direction >= 0) {
        this.go(next.id, { position: destination });
        return true;
      }
    }
    return false; // Normal browser scrolling (or the equivalent iframe relay).
  }

  relayWheel(delta) {
    if(this.suspended)return;
    if (!this.wheel(delta)) this.view.scrollBy({ top: Math.max(-this.height, Math.min(this.height, delta)), behavior: 'instant' });
  }
  key(key, shift = false, relayed = false) {
    if(this.suspended)return;
    const direction = ['PageDown', 'ArrowDown'].includes(key) || (key === ' ' && !shift) ? 1
      : ['PageUp', 'ArrowUp'].includes(key) || (key === ' ' && shift) ? -1 : 0;
    if (!direction && key !== 'Home' && key !== 'End') return;
    this.cancel();
    this.locked = null;
    this.tail = false;
    this.release = null;
    this.direction = direction || (key === 'Home' ? -1 : 1);
    if (relayed) {
      const distance = key.startsWith('Arrow') ? 40 : this.height * .875;
      this.view.scrollTo({ top: key === 'Home' ? 0 : key === 'End' ? this.max : this.view.scrollY + direction * distance, behavior: 'instant' });
    }
    this.queueSettle();
  }

  scrolled() {
    if(this.suspended)return;
    if (this.animation) return; // The animation loop publishes its own position.
    if (!this.pending) this.pending = this.view.requestAnimationFrame(() => {
      this.pending = 0;
      const now = this.now(), y = this.view.scrollY, distance = y - this.lastY;
      this.velocity = Math.abs(distance) / Math.max(16, now - this.lastScrollAt);
      this.scrollVelocity = distance / Math.max(16, now - this.lastScrollAt);
      if (!this.animation && distance) this.direction = Math.sign(distance);
      this.lastY = y;
      this.lastScrollAt = now;
      this.onChange();
      if (!this.animation) {
        if (this.locked && Math.abs(y - this.target(this.at(this.locked))) > 3) {
          this.locked = null;
          this.root.dataset.sectionMotion = 'free';
        }
        if (!this.touchScroll && !this.pointerHeld && this.velocity < 2.4) this.attract();
        this.queueSettle();
      }
    });
  }
  attract() {
    const y = this.view.scrollY;
    const approaching = this.bounds.find(bound => {
      const target = this.direction > 0 ? this.target(bound) : this.end(bound);
      const distance = (target - y) * this.direction;
      return distance > 3 && distance <= this.height * (bound.artwork || bound.strong ? .32 : .22);
    });
    if (approaching) this.go(approaching.id, { position: this.direction > 0 ? this.target(approaching) : this.end(approaching) });
  }
  queueSettle() {
    if(this.suspended)return;
    this.view.clearTimeout(this.idleTimer);
    this.idleTimer = this.view.setTimeout(() => this.settle(), 190);
  }
  settle() {
    if (this.suspended || this.animation || this.touching || this.pointerHeld || !this.bounds.length) return;
    this.touchScroll = false;
    const y = this.view.scrollY;
    // Intent accepted at a wheel hold commits to the adjacent stop on rest.
    // A reverse gesture clears this latch, and touch always uses actual proximity.
    if (this.release) {
      const origin = this.at(this.release.origin), direction = this.release.direction;
      const moved = (y - (direction > 0 ? this.end(origin) : this.target(origin))) * direction;
      const next = this.neighbor(origin, direction);
      if (next && moved > 2) { this.go(next.id, { position: direction > 0 ? this.target(next) : this.end(next) }); return; }
    }
    let best = null;
    for (const bound of this.bounds) {
      const position = Math.max(this.target(bound), Math.min(this.end(bound), y));
      const distance = Math.abs(position - y);
      if (!best || distance < best.distance) best = { bound, position, distance };
    }
    if (best.distance > 2) this.go(best.bound.id, { position: best.position });
    else if (Math.abs(y - this.target(best.bound)) <= 2 && !this.locked) {
      this.locked = best.bound.id;
      this.release = null;
      this.phase('locked');
    }
  }

  go(id, { instant = false, position, onComplete, quick = false, strength = 0 } = {}) {
    const bound = this.at(id);
    if (!bound) return;
    const incomingVelocity = this.animation?.velocity ?? (this.now()-this.lastScrollAt < 90 ? this.scrollVelocity : 0);
    this.cancel(false);
    this.view.cancelAnimationFrame(this.pending);
    this.pending = 0;
    this.view.clearTimeout(this.idleTimer);
    const start = this.view.scrollY, end = this.clamp(position ?? bound.top), distance = Math.abs(end - start);
    this.locked = null;
    this.release = null;
    this.intent = this.tailIntent = 0;
    const direction = Math.sign(end-start);
    const duration = instant || this.reducedMotion.matches || distance <= 2 ? 0 : sectionTiming(distance, this.height, strength || incomingVelocity, quick);
    const tangent = distance > 0 ? Math.max(0, Math.min(3, incomingVelocity*direction*duration/distance)) : 0;
    this.currentSection = this.current().id;
    this.targetSection = id;
    this.transitionProgress = 0;
    this.root.dataset.sectionFrom = this.currentSection;
    this.root.dataset.sectionTarget = id;
    this.animation = { id, start, end, started: this.now(), direction, onComplete, duration, tangent, velocity: incomingVelocity, raf: 0 };
    this.isSectionTransitioning = true;
    this.phase('settling');
    if (!this.animation.duration) { this.finish(); return; }
    let lastPaint=-Infinity;
    const tick = () => {
      const animation = this.animation;
      if (!animation) return;
      const progress = Math.min(1, (this.now() - animation.started) / animation.duration);
      if(progress<1 && this.now()-lastPaint<1000/30){animation.raf=this.view.requestAnimationFrame(tick);return;}
      lastPaint=Number.isFinite(lastPaint)?this.now()-((this.now()-lastPaint)%(1000/30)):this.now();
      const position = sectionCurve(progress, animation.tangent);
      animation.velocity = (animation.end-animation.start)/animation.duration * sectionSlope(progress, animation.tangent);
      this.transitionProgress = position;
      this.view.scrollTo({ top: animation.start + (animation.end - animation.start) * position, behavior: 'instant' });
      this.lastY = this.view.scrollY;
      this.lastScrollAt = this.now();
      this.scrollVelocity = animation.velocity;
      this.onChange();
      if (progress < 1) animation.raf = this.view.requestAnimationFrame(tick);
      else this.finish();
    };
    this.animation.raf = this.view.requestAnimationFrame(tick);
  }
  finish() {
    const animation = this.animation;
    if (!animation) return;
    this.view.cancelAnimationFrame(animation.raf);
    this.view.scrollTo({ top: animation.end, behavior: 'instant' });
    this.animation = null;
    this.isSectionTransitioning = false;
    this.transitionProgress = 1;
    this.currentSection = animation.id;
    this.targetSection = null;
    this.scrollVelocity = 0;
    this.locked = Math.abs(animation.end - this.target(this.at(animation.id))) <= 2 ? animation.id : null;
    this.release = null;
    this.lockedAt = this.now();
    this.tail = this.now() - this.lastWheelAt < 210;
    this.tailIntent = 0;
    this.intent = 0;
    this.lastY = this.view.scrollY;
    this.phase(this.locked ? 'locked' : 'free');
    animation.onComplete?.();
  }
  cancel(notify = true) {
    if (!this.animation) return;
    this.view.cancelAnimationFrame(this.animation.raf);
    this.animation = null;
    this.isSectionTransitioning = false;
    this.targetSection = null;
    this.tail = false;
    if (notify) this.phase('free');
  }
}



