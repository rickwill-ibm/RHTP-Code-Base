/**
 * Network Adequacy library loader (increment NA-0/NA-1).
 *
 * Mock mode loads the bundled GA + SD seed (`data/network-adequacy.seed.json`).
 * Non-mock callers pass their own AdequacyInput (real directory + geo feed).
 */
import type { AdequacyInput } from './types';
import seed from './data/network-adequacy.seed.json';

let cache: AdequacyInput | null = null;

/** The bundled mock network (GA storyboard + SD / Maria's state). Memoized. */
export function loadMockNetwork(): AdequacyInput {
  if (cache) return cache;
  const s = seed as unknown as AdequacyInput;
  cache = { providers: s.providers, geo: s.geo, standards: s.standards, waitTimes: s.waitTimes };
  return cache;
}

/** States present in the loaded network. */
export function networkStates(input: AdequacyInput): string[] {
  return [...new Set(input.geo.map((g) => g.state))];
}
