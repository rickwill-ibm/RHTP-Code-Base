/**
 * AI-Powered Comprehensive Care Plan Generator
 *
 * Automatically generates holistic care plans by analyzing:
 * - All open care gaps (HCC suspects, quality measures)
 * - All active conditions
 * - Medications needing review
 * - SDoH needs (transportation, food insecurity, housing)
 * - Multiple referrals to different specialists
 *
 * CLOSED-LOOP REFERRAL WORKFLOW:
 * When a care plan is generated, referrals are automatically created
 * for each care gap and added to the referralStore for specialist action.
 *
 * HOLISTIC CONTEXT-AWARE SYSTEM:
 * Now integrates with holistic context engine to understand the WHOLE patient:
 * - Root cause analysis (what's the PRIMARY blocker?)
 * - Tiered interventions (address root cause FIRST)
 * - Barrier-aware care delivery (adapt to patient's reality)
 * - Success probability calculation (realistic expectations)
 */

export type { ComprehensivePlanInput, QualityMeasureImpact, GeneratedCarePlan } from './carePlanGenerator.types';

import { holisticContextEngine } from './holisticContextEngine';
import { rootCauseAnalyzer } from './rootCauseAnalyzer';
import { tieredInterventionGenerator } from './tieredInterventionGenerator';
import { convertHolisticToStandardPlan } from './carePlanGenerator.holistic';
import { analyzePatientData, assignInterventionsToGoals, createReferralsForCareGaps } from './carePlanGenerator.helpers';
import { generateGoals, generateInterventions, assembleCareTeam } from './carePlanGenerator.goals';
import type { ComprehensivePlanInput, GeneratedCarePlan, QualityMeasureImpact, PatientAnalysis } from './carePlanGenerator.types';
import type { CarePlanGoal, CarePlanIntervention, CareTeamMember } from './carePlanGenerator.types';

/**
 * Main function to generate a comprehensive care plan
 * This is the "magic" that happens when physician clicks "Generate"
 * NOW WITH AUTO-REFERRAL CREATION
 */
export function generateComprehensiveCarePlan(input: ComprehensivePlanInput): GeneratedCarePlan {
  try {
    const { patient, careGaps } = input;

    const analysis = analyzePatientData(input);
    const goals = generateGoals(analysis);
    const interventions = generateInterventions(analysis);

    try {
      assignInterventionsToGoals(goals, interventions, analysis);
    } catch (error) {
      console.error('Error assigning interventions to goals:', error);
    }

    const careTeam = assembleCareTeam(analysis, patient);
    const sharedWith = determineSharing(analysis);
    const { title, description } = generateTitleAndDescription(analysis);
    const addresses = extractAddresses(analysis);
    const estimatedImpact = calculateImpact(analysis, goals, interventions);
    const clinicalSummary = generateClinicalSummary(analysis, goals, interventions, careTeam);

    const referralsCreated = createReferralsForCareGaps(
      patient,
      careGaps.filter(g => g.status === 'Open' || g.status === 'In Progress'),
      analysis.specialtiesNeeded
    );

    console.log(`✅ Auto-created ${referralsCreated.length} referrals for ${patient.name}`);

    return {
      title,
      description,
      clinicalSummary,
      addresses,
      goals,
      interventions,
      careTeam,
      sharedWith,
      priority: analysis.overallPriority,
      estimatedImpact,
      referralsCreated,
    };
  } catch (error) {
    console.error('Error in generateComprehensiveCarePlan:', error);
    throw error;
  }
}

/**
 * Generate holistic, context-aware care plan
 * Uses the new holistic context engine to understand the WHOLE patient
 * and generate tiered interventions that address root causes first
 */
export function generateHolisticCarePlan(input: ComprehensivePlanInput): GeneratedCarePlan & {
  holisticPlan?: ReturnType<typeof tieredInterventionGenerator.generate>;
  rootCauseInsight?: string;
} {
  try {
    const { patient } = input;
    const context = holisticContextEngine.buildContext(patient.id);
    const analysis = rootCauseAnalyzer.analyze(context);
    const holisticPlan = tieredInterventionGenerator.generate(context, analysis);
    const standardPlan = convertHolisticToStandardPlan(holisticPlan, input);
    return {
      ...standardPlan,
      holisticPlan,
      rootCauseInsight: analysis.criticalInsight,
    };
  } catch (error) {
    console.error('Error generating holistic care plan:', error);
    return generateComprehensiveCarePlan(input);
  }
}

function determineSharing(analysis: PatientAnalysis): string[] {
  const sharing: string[] = ['Patient Portal'];

  analysis.specialtiesNeeded.forEach(specialty => {
    if (specialty !== 'Care Management' && specialty !== 'Social Work') {
      sharing.push(`${specialty} (via FHIR)`);
    }
  });

  if (analysis.overallPriority === 'Critical' || analysis.overallPriority === 'High') {
    sharing.push('Care Manager');
  }
  if (analysis.totalRevenueDelta > 5000) {
    sharing.push('Health Plan');
  }

  return sharing;
}

function generateTitleAndDescription(analysis: PatientAnalysis): { title: string; description: string } {
  const conditionCount = analysis.primaryConditions.length;
  const gapCount = analysis.qualityGaps.length;
  const hccCount = analysis.hccOpportunities.length;

  let title = 'Comprehensive Care Plan';
  if (analysis.primaryConditions.length > 0) {
    title = `${analysis.primaryConditions[0]} Management Plan`;
    if (conditionCount > 1) title = `Multi-Condition Care Plan (${conditionCount} conditions)`;
  }

  const descriptionParts: string[] = [];
  descriptionParts.push(`Holistic care plan addressing ${conditionCount} active condition${conditionCount !== 1 ? 's' : ''}`);
  if (hccCount > 0) descriptionParts.push(`${hccCount} HCC documentation opportunit${hccCount !== 1 ? 'ies' : 'y'}`);
  if (gapCount > 0) descriptionParts.push(`${gapCount} quality gap${gapCount !== 1 ? 's' : ''}`);
  if (analysis.sdohNeeds.length > 0) descriptionParts.push(`${analysis.sdohNeeds.length} social determinant${analysis.sdohNeeds.length !== 1 ? 's' : ''} of health`);
  descriptionParts.push(`Coordinated care across ${analysis.specialtiesNeeded.length} specialt${analysis.specialtiesNeeded.length !== 1 ? 'ies' : 'y'}`);

  return { title, description: descriptionParts.join(', ') + '.' };
}

function generateClinicalSummary(
  analysis: PatientAnalysis,
  goals: CarePlanGoal[],
  interventions: CarePlanIntervention[],
  careTeam: CareTeamMember[]
): GeneratedCarePlan['clinicalSummary'] {
  const conditions = [...analysis.primaryConditions];
  const needs: string[] = [];

  if (analysis.hccOpportunities.length > 0) needs.push(`${analysis.hccOpportunities.length} HCC documentation opportunities`);
  if (analysis.qualityGaps.length > 0) needs.push(`${analysis.qualityGaps.length} quality measure gaps`);
  analysis.sdohNeeds.forEach(need => needs.push(need));
  if (analysis.utilizationRisks.length > 0) needs.push(`${analysis.utilizationRisks.length} utilization alerts`);

  const goalSummaries = goals.slice(0, 4).map(g => g.description);

  const interventionSummaries: string[] = [];
  const interventionsByType = interventions.reduce((acc, i) => {
    if (!acc[i.type]) acc[i.type] = [];
    acc[i.type].push(i);
    return acc;
  }, {} as Record<string, typeof interventions>);

  Object.entries(interventionsByType).forEach(([type, items]) => {
    if (items.length === 1) interventionSummaries.push(items[0].description);
    else interventionSummaries.push(`${items.length} ${type.toLowerCase()} interventions`);
  });

  const referrals = careTeam
    .filter(member =>
      member.role !== 'Primary Care Physician' &&
      member.role !== 'Care Manager' &&
      member.role !== 'Social Worker'
    )
    .map(member => `${member.role}${member.specialty ? ` (${member.specialty})` : ''}`);

  return {
    conditions,
    needs,
    goals: goalSummaries,
    interventions: interventionSummaries.slice(0, 5),
    referrals,
  };
}

function extractAddresses(analysis: PatientAnalysis): string[] {
  const addresses: string[] = [];
  analysis.hccOpportunities.forEach(hcc => addresses.push(`${hcc.icdCode} - ${hcc.icdDescription}`));
  analysis.qualityGaps.forEach(gap => addresses.push(`${gap.program}: ${gap.measureName}`));
  analysis.sdohNeeds.forEach(need => addresses.push(`SDoH: ${need}`));
  return [...new Set(addresses)];
}

function calculateImpact(
  analysis: PatientAnalysis,
  goals: CarePlanGoal[],
  interventions: CarePlanIntervention[]
): GeneratedCarePlan['estimatedImpact'] {
  const rafDelta = analysis.totalRafDelta;

  const qualityMeasureBreakdown: QualityMeasureImpact[] = analysis.qualityGaps.map(gap => {
    let baseBonus = 2500;
    if (gap.program === 'MIPS') baseBonus = 2000;
    else if (gap.program === 'STARS') baseBonus = 3000;

    const relatedGoals = goals
      .filter(goal =>
        goal.description.toLowerCase().includes(gap.measureName.toLowerCase()) ||
        goal.notes?.toLowerCase().includes(gap.measureId.toLowerCase())
      )
      .map(goal => goal.id);

    const relatedInterventions = interventions
      .filter(intervention =>
        intervention.description.toLowerCase().includes(gap.measureName.toLowerCase()) ||
        intervention.notes?.toLowerCase().includes(gap.measureId.toLowerCase()) ||
        (intervention.type === 'Referral' && gap.closureRequirement.toLowerCase().includes(intervention.description.toLowerCase()))
      )
      .map(intervention => intervention.id);

    return {
      measureId: gap.measureId,
      measureName: gap.measureName,
      program: gap.program,
      relatedGoals,
      relatedInterventions,
      estimatedBonus: baseBonus,
    };
  });

  const qualityBonus = qualityMeasureBreakdown.reduce((sum, m) => sum + m.estimatedBonus, 0);
  const sharedSavings = analysis.totalRevenueDelta * 0.15;
  const providerGainshare = qualityBonus + sharedSavings;

  return {
    rafDelta: Math.round(rafDelta * 100) / 100,
    providerGainshare: Math.round(providerGainshare),
    qualityGapsClosed: analysis.qualityGaps.length,
    qualityMeasureBreakdown,
  };
}

// Made with Bob
