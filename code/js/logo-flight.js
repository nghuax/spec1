const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => value * value * (3 - 2 * value);
const mix = (a, b, progress) => ({
  x: a.x + (b.x - a.x) * progress,
  y: a.y + (b.y - a.y) * progress,
  width: a.width + (b.width - a.width) * progress
});

// Pure scroll geometry: the same offset produces the same pose in either direction.
export function logoPose(y, geometry, reduced = false) {
  const { landing, nav, final, landingEnd, finalStart, finalEnd, exitStart, exitEnd } = geometry;
  const progress = (start, end) => {
    const value = clamp((y - start) / Math.max(1, end - start));
    return reduced ? Number(value >= .5) : ease(value);
  };
  if (y < landingEnd) return mix(landing, nav, progress(0, landingEnd));
  const finalOnScreen = { ...final, y: final.y - y };
  if (y < finalStart) return nav;
  // Fly directly to the resting banner position, without chasing a moving
  // document anchor and dipping below it partway through the approach.
  if (y < finalEnd) return mix(nav, reduced ? finalOnScreen : { ...final, y: final.y - finalEnd }, progress(finalStart, finalEnd));
  if (y <= exitStart) return finalOnScreen;
  if (y < exitEnd) return mix(finalOnScreen, nav, progress(exitStart, exitEnd));
  return nav;
}

export class LogoFlight {
  constructor(preference, markup) {
    this.preference = preference;
    this.sources = ['#landing-title svg', '.nav-brand svg', '#heal-title svg'].map(selector => document.querySelector(selector));
    this.visual = document.createElement('div');
    this.visual.className = 'heal-logo-flight';
    this.visual.setAttribute('aria-hidden', 'true');
    this.visual.innerHTML = markup;
    document.body.append(this.visual);
    document.documentElement.classList.add('logo-flight-ready');
    preference.addEventListener('change', () => this.update(window.scrollY));
  }

  measure(bounds, height) {
    const read = (element, fixed = false) => {
      const rect = element.getBoundingClientRect();
      // Account for SVG meet/centering when its CSS box is not the artwork ratio.
      const ratio = 1513 / 544.5;
      const width = Math.min(rect.width, rect.height * ratio);
      return { x: rect.left + (rect.width - width) / 2,
        y: rect.top + (rect.height - width / ratio) / 2 + (fixed ? 0 : window.scrollY), width };
    };
    const [landing, nav, final] = this.sources.map((source, index) => read(source, index === 1));
    const heal = bounds.find(bound => bound.id === 'heal');
    const about = bounds.find(bound => bound.id === 'about');
    if (!heal || !about || !landing.width || !nav.width || !final.width) return;
    const exitStart = Math.max(heal.top, final.y - nav.y);
    this.geometry = { landing, nav, final, landingEnd: Math.min(bounds[1].top, height * .72),
      finalStart: heal.top - height * .7, finalEnd: heal.top,
      exitStart, exitEnd: Math.min(about.top, exitStart + height * .45) };
    this.update(window.scrollY);
  }

  update(y) {
    if (!this.geometry) return;
    const pose = logoPose(y, this.geometry, this.preference.matches);
    this.visual.style.transform = `translate3d(${pose.x}px,${pose.y}px,0) scale(${pose.width / 1513})`;
    this.visual.dataset.positioned = '';
  }
}
