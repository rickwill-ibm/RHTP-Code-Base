import type {
  Patient,
  CareGap,
  CarePlanGoal,
  CarePlanIntervention,
  CareTeamMember,
  GeneratedCarePlan,
  ComprehensivePlanInput,
} from './carePlanGenerator.types';
import type { HolisticCarePlan } from './tieredInterventionGenerator';
import { createReferralsForCareGaps } from './carePlanGenerator.helpers';

/**
 * Convert holistic care plan to standard care plan format
 * This maintains compatibility with existing UI components
 */
export function convertHolisticToStandardPlan(
  holisticPlan: HolisticCarePlan,
  input: ComprehensivePlanInput
): GeneratedCarePlan {
  const { patient, careGaps } = input;

  const goals: CarePlanGoal[] = [];
  const interventions: CarePlanIntervention[] = [];
  let goalCounter = 1;
  let interventionCounter = 1;

  holisticPlan.interventions.forEach((tieredIntervention) => {
    const goal: CarePlanGoal = {
      id: `goal-holistic-${goalCounter++}`,
      description: tieredIntervention.title,
      target: tieredIntervention.successMetrics[0] || 'Intervention completed',
      status: 'Not Started',
      dueDate: calculateDueDate(tieredIntervention.estimatedTimeframe),
      progress: 0,
      notes: `${tieredIntervention.rationale}\n\nSuccess Metrics:\n${tieredIntervention.successMetrics.join('\n')}`,
      interventions: [],
    };

    tieredIntervention.actions.forEach(action => {
      const intervention: CarePlanIntervention = {
        id: `intervention-holistic-${interventionCounter++}`,
        type: mapModalityToType(action.modality, action.action),
        description: action.action,
        status: mapStatusToStandard(action.status),
        provider: action.provider,
        notes: `${action.expectedOutcome}\n\nTimeline: ${action.timeline}\n\nModality: ${action.modality || 'TBD'}`,
        scheduledDate: action.timeline.includes('Week') ?
          calculateDateFromWeek(action.timeline) : undefined,
      };

      interventions.push(intervention);
      goal.interventions!.push(intervention);
    });

    goals.push(goal);
  });

  const careTeam = buildCareTeamFromHolisticPlan(holisticPlan, patient);

  const title = `Holistic Care Plan - ${holisticPlan.rootCauseAnalysis.primaryBlocker.type === 'caregiver-burden' ?
    'Caregiver Support Focus' : 'Comprehensive Care'}`;

  const description = `Context-aware care plan addressing root cause: ${holisticPlan.rootCauseAnalysis.rootCause.description}. ` +
    `${holisticPlan.interventions.length} tiered interventions with ${holisticPlan.successProbability}% success probability.`;

  const clinicalSummary = {
    conditions: holisticPlan.rootCauseAnalysis.primaryBlocker.description.split(','),
    needs: holisticPlan.rootCauseAnalysis.rootCause.cascadingEffects.slice(0, 3),
    goals: goals.slice(0, 3).map(g => g.description),
    interventions: interventions.slice(0, 5).map(i => i.description),
    referrals: careTeam.filter(m => m.role !== 'Primary Care Physician').map(m => m.role),
  };

  const estimatedImpact = {
    rafDelta: 0,
    providerGainshare: holisticPlan.estimatedCostSavings,
    qualityGapsClosed: careGaps.filter(g => g.status === 'Open').length,
    qualityMeasureBreakdown: careGaps.map(gap => ({
      measureId: gap.measureId,
      measureName: gap.measureName,
      program: gap.program,
      relatedGoals: goals.filter(g =>
        g.description.toLowerCase().includes(gap.measureName.toLowerCase())
      ).map(g => g.id),
      relatedInterventions: interventions.filter(i =>
        i.description.toLowerCase().includes(gap.measureName.toLowerCase())
      ).map(i => i.id),
      estimatedBonus: 2500,
    })),
  };

  const referralsCreated = createReferralsForCareGaps(
    patient,
    careGaps.filter(g => g.status === 'Open' || g.status === 'In Progress'),
    []
  );

  return {
    title,
    description,
    clinicalSummary,
    addresses: holisticPlan.rootCauseAnalysis.rootCause.cascadingEffects,
    goals,
    interventions,
    careTeam,
    sharedWith: ['Patient Portal', 'Care Manager', 'Health Plan'],
    priority: holisticPlan.rootCauseAnalysis.primaryBlocker.impact === 'critical' ? 'Critical' : 'High',
    estimatedImpact,
    referralsCreated,
  };
}

/**
 * Map modality and action description to correct intervention type
 * BARRIER-AWARE: Social services should be Referrals, not Appointments
 */
export function mapModalityToType(modality?: string, actionDescription?: string): CarePlanIntervention['type'] {
  const description = (actionDescription || '').toLowerCase();

  if (description.includes('enroll') ||
      description.includes('connect with') ||
      description.includes('activate unite us') ||
      description.includes('medicaid') ||
      description.includes('support group') ||
      description.includes('caregiver alliance') ||
      description.includes('autism family support') ||
      description.includes('adult day care') ||
      description.includes('respite care program')) {
    return 'Referral';
  }
  if (description.includes('monitor') ||
      description.includes('screening') ||
      description.includes('assessment')) {
    return 'Monitoring';
  }
  if (description.includes('education') ||
      description.includes('training') ||
      description.includes('information')) {
    return 'Education';
  }
  if (description.includes('lab') ||
      description.includes('test') ||
      description.includes('procedure')) {
    return 'Procedure';
  }

  if (!modality) return 'Appointment';

  const modalityMap: Record<string, CarePlanIntervention['type']> = {
    'telehealth': 'Appointment',
    'in-person': 'Appointment',
    'home-visit': 'Monitoring',
    'phone': 'Referral',
    'mobile-clinic': 'Appointment',
    'digital': 'Monitoring',
  };

  return modalityMap[modality] || 'Appointment';
}

/** Calculate due date from timeframe string */
export function calculateDueDate(timeframe: string): string {
  const now = new Date();
  if (timeframe.includes('Immediate')) now.setDate(now.getDate() + 7);
  else if (timeframe.includes('Week 1')) now.setDate(now.getDate() + 7);
  else if (timeframe.includes('Week 2')) now.setDate(now.getDate() + 14);
  else if (timeframe.includes('Weeks 1-2')) now.setDate(now.getDate() + 14);
  else if (timeframe.includes('Weeks 3-4')) now.setDate(now.getDate() + 28);
  else if (timeframe.includes('Weeks 4-12')) now.setDate(now.getDate() + 84);
  else if (timeframe.includes('Ongoing')) now.setDate(now.getDate() + 90);
  else now.setDate(now.getDate() + 30);
  return now.toISOString().split('T')[0];
}

/** Calculate date from week string (e.g., "Week 1" -> 7 days from now) */
export function calculateDateFromWeek(weekString: string): string {
  const now = new Date();
  const weekMatch = weekString.match(/Week (\d+)/);
  if (weekMatch) {
    now.setDate(now.getDate() + (parseInt(weekMatch[1]) * 7));
  } else {
    now.setDate(now.getDate() + 7);
  }
  return now.toISOString().split('T')[0];
}

/** Build care team from holistic plan */
export function buildCareTeamFromHolisticPlan(holisticPlan: HolisticCarePlan, patient: Patient): CareTeamMember[] {
  const team: CareTeamMember[] = [];
  let teamCounter = 1;

  team.push({
    id: `team-${teamCounter++}`,
    name: patient.primaryCareProvider || 'Primary Care Provider (to be assigned)',
    role: 'Primary Care Physician',
    relationship: 'Primary',
    phone: patient.phone || 'See patient record',
    email: `contact@${(patient.primaryCareProvider || 'provider').toLowerCase().replace(/\s+/g, '')}.health`,
    networkTier: 'Preferred',
    npi: 'See patient record',
  });

  const careManager = (patient as any).careManager;
  if (careManager && typeof careManager === 'string') {
    team.push({
      id: `team-${teamCounter++}`,
      name: careManager,
      role: 'Care Manager',
      relationship: 'Care Manager',
      phone: 'See care team assignment',
      email: `${careManager.toLowerCase().replace(/\s+/g, '')}@careteam.health`,
      networkTier: 'Preferred',
      npi: 'See care team assignment',
    });
  }

  if (holisticPlan.rootCauseAnalysis.primaryBlocker.type === 'caregiver-burden') {
    team.push({
      id: `team-${teamCounter++}`,
      name: 'Social Worker (to be assigned)',
      role: 'Social Worker',
      relationship: 'Consultant',
      phone: 'Pending assignment',
      email: 'Pending assignment',
      networkTier: 'Preferred',
      npi: 'Pending assignment',
    });
  }

  const specialistProviders = new Set<string>();
  holisticPlan.interventions.forEach(intervention => {
    intervention.actions.forEach(action => {
      if (action.provider && !action.provider.includes('Team') &&
          !action.provider.includes('Services') && !action.provider.includes('Program')) {
        specialistProviders.add(action.provider);
      }
    });
  });

  specialistProviders.forEach(provider => {
    const specialty = provider.includes('Cardio') ? 'Cardiology' :
                     provider.includes('Endo') ? 'Endocrinology' :
                     provider.includes('Nephro') ? 'Nephrology' :
                     provider.includes('Pulmo') ? 'Pulmonology' : provider;

    team.push({
      id: `team-${teamCounter++}`,
      name: `${specialty} Specialist (referral pending)`,
      role: `${specialty} Specialist`,
      specialty: specialty,
      relationship: 'Consultant',
      phone: 'Pending referral',
      email: 'Pending referral',
      networkTier: 'In-Network',
      npi: 'Pending referral',
    });
  });

  return team;
}

/** Map action status to standard intervention status */
export function mapStatusToStandard(status?: string): CarePlanIntervention['status'] {
  if (!status) return 'Pending';
  const statusMap: Record<string, CarePlanIntervention['status']> = {
    'pending': 'Pending',
    'in-progress': 'Active',
    'completed': 'Completed',
  };
  return statusMap[status] || 'Pending';
}
