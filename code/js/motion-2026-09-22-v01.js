// A quick acceleration followed by a long, quiet tail. The optional tangent
// carries existing page velocity into magnetic assistance without a speed jump.
export function sectionCurve(t, tangent = 0) {
  return 10*t*t - 20*t**3 + 15*t**4 - 4*t**5 + tangent*t*(1-t)**4;
}
export function sectionSlope(t, tangent = 0) {
  return (1-t)**3 * (20*t + tangent*(1-5*t));
}
export function sectionTiming(distance, height, velocity = 0, quick = false) {
  const screens = distance / Math.max(1, height);
  const base = screens <= .35 ? 280 + 160*screens/.35
    : screens <= 1.1 ? 440 + 320*(screens-.35)/.75
    : 760 + Math.min(180, (screens-1.1)*65);
  return Math.max(250, (quick ? base*.76 : base) - Math.min(90, Math.abs(velocity)*18));
}
