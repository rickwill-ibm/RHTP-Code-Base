/**
 * Network Adequacy — public surface (increments NA-0/NA-1/NA-2).
 */
export * from './types';
export {
  haversineMiles,
  computeCell,
  computeMetrics,
  computeGaps,
  validateCell,
  recommendAugmentation,
  type CellKey,
} from './adequacyEngine';
export { loadMockNetwork, networkStates } from './network';
export {
  parseIntent,
  runAssistant,
  type AssistantIntent,
  type AssistantIntentKind,
  type AssistantScope,
  type AssistantResponse,
} from './assistant';
