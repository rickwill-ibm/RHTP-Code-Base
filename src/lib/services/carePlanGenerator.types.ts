import type { CarePlanGoal, CarePlanIntervention, CareTeamMember, Referral } from '@/lib/mockData';
import type { Patient, HCCSuspect, CareGap, UtilizationAlert } from '@/lib/types';

export type { Patient, HCCSuspect, CareGap, UtilizationAlert };
export type { CarePlanGoal, CarePlanIntervention, CareTeamMember, Referral };

export interface ComprehensivePlanInput {
  patient: Patient;
  hccSuspects: HCCSuspect[];
  careGaps: CareGap[];
  alerts: UtilizationAlert[];
  clinicalData?: any;
}

export interface QualityMeasureImpact {
  measureId: string;
  measureName: string;
  program: 'HEDIS' | 'STARS' | 'MIPS';
  relatedGoals: string[]; // Goal IDs that address this measure
  relatedInterventions: string[]; // Intervention IDs that address this measure
  estimatedBonus: number; // Financial value of closing this gap
}

export interface GeneratedCarePlan {
  title: string;
  description: string;
  clinicalSummary: {
    conditions: string[];
    needs: string[];
    goals: string[];
    interventions: string[];
    referrals: string[];
  };
  addresses: string[];
  goals: CarePlanGoal[];
  interventions: CarePlanIntervention[];
  careTeam: CareTeamMember[];
  sharedWith: string[];
  priority: 'Critical' | 'High' | 'Moderate' | 'Low';
  estimatedImpact: {
    rafDelta: number;
    providerGainshare: number;
    qualityGapsClosed: number;
    qualityMeasureBreakdown: QualityMeasureImpact[]; // Detailed breakdown by measure
  };
  referralsCreated: Referral[]; // Auto-created referrals for care gaps
}

export interface PatientAnalysis {
  overallPriority: 'Critical' | 'High' | 'Moderate' | 'Low';
  primaryConditions: string[];
  hccOpportunities: HCCSuspect[];
  qualityGaps: CareGap[];
  utilizationRisks: UtilizationAlert[];
  sdohNeeds: string[];
  medicationIssues: string[];
  specialtiesNeeded: string[];
  urgentActions: string[];
  totalRafDelta: number;
  totalRevenueDelta: number;
}
