// ─── rootCauseAnalyzer.types.ts ───────────────────────────────────────────────
// Type definitions for the Root Cause Analyzer.

export type BlockerType =
  | 'caregiver-burden'
  | 'transportation'
  | 'financial'
  | 'clinical-complexity'
  | 'time-scarcity'
  | 'social-isolation'
  | 'health-literacy'
  | 'technology-access'
  | 'geographic-isolation';

export interface Blocker {
  type: BlockerType;
  severity: number; // 0-100
  impact: 'low' | 'moderate' | 'high' | 'critical';
  description: string;
  constraints: Record<string, unknown>;
  enablesOtherInterventions?: boolean;
}

export interface CompoundingFactor {
  factor: string;
  description: string;
  multiplierEffect: number; // 1.0 = no effect, 2.0 = doubles difficulty
}

export interface RootCause {
  type: BlockerType;
  description: string;
  cascadingEffects: string[];
  criticalIntervention: string;
  interventionDependencies: string[];
}

export interface RootCauseAnalysis {
  primaryBlocker: Blocker;
  secondaryBlockers: Blocker[];
  compoundingFactors: CompoundingFactor[];
  rootCause: RootCause;
  criticalInsight: string;
  successProbabilityWithoutIntervention: number;
  successProbabilityWithIntervention: number;
}
