// Independent two-leg study. No browser clock, game state, storage or activation.
export const connectedJourney = Object.freeze({
  asset: 'assets/ui/road-studies/busan-yangsan-miryang-v2.webp',
  source: [2160, 720],
  camera: Object.freeze({busan: 0, yangsan: 0.5, miryang: 1}),
  legs: [{from: 'busan', to: 'yangsan', km: 20}, {from: 'yangsan', to: 'miryang', km: 34}],
  productionApproved: false,
});
const clamp = x => Math.max(0, Math.min(1, x));
const smooth = p => p * p * (3 - 2 * p);
export function cameraPosition({at, from, to, gone = 0, dist} = {}) {
  const nodes = connectedJourney.camera;
  if (at) {
    if (!(at in nodes)) throw new RangeError('Unknown study place');
    return nodes[at];
  }
  const leg = connectedJourney.legs.find(l => (l.from === from && l.to === to) || (l.from === to && l.to === from));
  if (!leg || !Number.isFinite(gone) || (dist !== undefined && (!Number.isFinite(dist) || dist <= 0))) throw new RangeError('Invalid study leg');
  return nodes[from] + (nodes[to] - nodes[from]) * clamp(gone / (dist ?? leg.km));
}
export function frame(state, width) {
  if (!Number.isFinite(width) || width <= 0) throw new RangeError('Invalid width');
  const camera = cameraPosition(state);
  // Same unmirrored source window at incoming end / stop / outgoing start.
  return {asset: connectedJourney.asset, sourceX: camera * 1080, sourceWidth: 1080,
    left: -camera * width, width: width * 2, height: width * 2 / 3, baseline: width * 344 / 360 * 0.75,
    posts: -camera * 2880, markings: -camera * 5760, mirrored: false};
}
export function sampleTimeline(seconds, reverse = false) {
  if (!Number.isFinite(seconds)) throw new RangeError('Invalid time');
  const t = Math.max(0, Math.min(100, seconds));
  let camera = t < 40 ? smooth(t / 40) * 0.5 : t <= 50 ? 0.5 : t < 90 ? 0.5 + smooth((t - 50) / 40) * 0.5 : 1;
  // Continuous speed envelope, zero throughout the stop. Mirrors CSS cubic(.3333,0,.6667,1).
  const p = t < 40 ? t / 40 : t > 50 && t < 90 ? (t - 50) / 40 : 0;
  const speed = 3 * p * (1 - p) / 40;
  return {camera: reverse ? 1 - camera : camera, speed, phase: t < 40 ? 'first-leg' : t < 50 ? 'yangsan-stop' : t < 90 ? 'second-leg' : 'arrived'};
}
