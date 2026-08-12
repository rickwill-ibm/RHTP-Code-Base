/**
 * Generalized Policy Engine — public surface (Policy Engine increment PE-1..4).
 *
 * Ingest any payer/state policy → normalized model → evaluate a member's order
 * → Coverage Determination that threads into the Golden Thread Evidence Record.
 */
export * from './types';
export {
  loadMockLibrary,
  buildLibrary,
  ingestLibrary,
  governedCodes,
  type LoadedLibrary,
} from './policyLibrary';
export {
  ingestRecord,
  ingestRecords,
  registerAdapter,
  listAdapters,
  selectAdapter,
  type PolicyIngestionAdapter,
  type RawPolicyRecord,
} from './ingest';
export { evaluate, type EvaluateOptions } from './policyEngine';
export {
  scorePropensity,
  propensityInputFromDetermination,
  type PropensityInput,
  type PropensityResult,
  type PropensityBand,
  type PropensityFactor,
} from './propensity';
export {
  evaluateGoldCard,
  toEvidence as goldCardToEvidence,
  DEFAULT_PROGRAM,
  MOCK_GOLD_CARD_CONTEXT,
  type GoldCardProgram,
  type GoldCardStatus,
  type GoldCardContext,
  type GoldCardKey,
  type GrantedGoldCard,
  type ProviderPaHistory,
} from './goldCarding';
export { toMemberContext, serviceRequestToOrder, conditionToDiagnosis } from './fromFhir';
export {
  evaluateCriteria,
  evaluatePredicate,
  CARDIAC_MRI_0520_CRITERIA,
  type Predicate,
  type CriteriaRule,
  type CriteriaSet,
  type CriteriaMemberFacts,
  type CriteriaEvaluation,
} from './criteria';
export {
  mockDenialRateProvider,
  nullDenialRateProvider,
  type DenialRateProvider,
} from './denialRates';
export {
  mockGoldCardDataSource,
  emptyGoldCardDataSource,
  type GoldCardDataSource,
} from './goldCardSource';
