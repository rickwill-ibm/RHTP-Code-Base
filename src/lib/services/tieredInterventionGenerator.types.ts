// tieredInterventionGenerator.types.ts — Type definitions for tiered intervention generator

import type { RootCauseAnalysis } from './rootCauseAnalyzer';

export interface HolisticCarePlan {
  patient: {
    id: string;
    name: string;
  };
  rootCauseAnalysis: RootCauseAnalysis;
  interventions: TieredIntervention[];
  timeline: Timeline;
  successProbability: number;
  estimatedCostSavings: number;
  estimatedBurdenReduction: number; // percentage
  generatedAt: string;
}

export interface TieredIntervention {
  tier: 1 | 2 | 3 | 4 | 5;
  priority: 'critical' | 'high' | 'moderate' | 'low';
  category: InterventionCategory;
  title: string;
  description: string;
  rationale: string;
  actions: InterventionAction[];
  successMetrics: string[];
  blockerAddressed: string;
  dependsOn?: string[];
  enablesOtherInterventions?: boolean;
  estimatedTimeframe: string;
  estimatedCost?: number;
  burdenScore: number; // 0-100, lower is better
}

export type InterventionCategory =
  | 'caregiver-support'
  | 'transportation'
  | 'care-delivery-optimization'
  | 'clinical-care'
  | 'sustainability'
  | 'financial-assistance'
  | 'social-support'
  | 'technology-enablement';

export interface InterventionAction {
  action: string;
  provider: string;
  timeline: string;
  expectedOutcome: string;
  modality?: 'in-person' | 'telehealth' | 'home-visit' | 'phone' | 'mobile-clinic';
  status?: 'pending' | 'in-progress' | 'completed';
}

export interface Timeline {
  totalDuration: string;
  phases: TimelinePhase[];
}

export interface TimelinePhase {
  phase: string;
  weeks: string;
  focus: string;
  keyMilestones: string[];
}
