import type {
  Patient,
  CareGap,
  UtilizationAlert,
  CarePlanGoal,
  CarePlanIntervention,
  CareTeamMember,
  PatientAnalysis,
} from './carePlanGenerator.types';
import { createInterventionId } from './carePlanGenerator.helpers';

/**
 * Determine best care modality based on patient barriers
 * Prioritizes home-based and telehealth when barriers exist
 */
export function determineOptimalModality(
  interventionType: string,
  hasTransportationBarrier: boolean,
  hasCaregiverBurden: boolean
): { modality: string; notes: string } {
  if (interventionType === 'SDoH_Referral') {
    return { modality: 'digital', notes: 'Remote enrollment via patient portal or phone' };
  }
  if (interventionType === 'BH_Screening') {
    return { modality: 'digital', notes: 'Self-administered via patient portal (10-15 minutes)' };
  }
  if (interventionType === 'Lab_Test' && hasTransportationBarrier) {
    return { modality: 'home-based', notes: 'At-home test kit (mail-order, self-collection, mail back)' };
  }
  if (interventionType === 'Follow_Up' && (hasTransportationBarrier || hasCaregiverBurden)) {
    return { modality: 'telehealth', notes: 'Video visit via MyChart or phone call' };
  }
  if (interventionType === 'Physical_Exam') {
    if (hasTransportationBarrier) {
      return { modality: 'in-person', notes: 'Required in-person visit - schedule after transportation assistance secured' };
    }
    return { modality: 'in-person', notes: 'Required for physical examination' };
  }
  if (hasTransportationBarrier || hasCaregiverBurden) {
    return { modality: 'telehealth', notes: 'Video visit to minimize travel burden' };
  }
  return { modality: 'in-person', notes: 'Standard office visit' };
}

export function generateGoals(analysis: PatientAnalysis): CarePlanGoal[] {
  const goals: CarePlanGoal[] = [];
  let goalCounter = 1;
  let interventionCounter = 1;

  const hasTransportationBarrier = analysis.sdohNeeds.some(need =>
    need.toLowerCase().includes('transportation')
  );
  const hasCaregiverBurden = analysis.sdohNeeds.some(need =>
    need.toLowerCase().includes('childcare') || need.toLowerCase().includes('caregiver')
  );

  // Goals for SDoH needs - PRIORITIZE FIRST (barrier-first approach)
  if (analysis.sdohNeeds.length > 0) {
    const sdohGoal: CarePlanGoal = {
      id: `goal-${goalCounter++}`,
      description: `Address Social Determinants of Health barriers`,
      target: 'All identified barriers have support services in place',
      status: 'Not Started',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      progress: 0,
      notes: 'Priority: Address barriers FIRST to enable clinical care completion',
      interventions: []
    };

    analysis.sdohNeeds.forEach(need => {
      const modality = determineOptimalModality('SDoH_Referral', hasTransportationBarrier, hasCaregiverBurden);
      sdohGoal.interventions!.push({
        id: createInterventionId('goal', interventionCounter++),
        type: 'Referral',
        description: `${need} - Community resource connection`,
        status: 'Pending',
        provider: 'Social Services / Community Resources',
        notes: `${modality.notes}. No appointment needed - can be completed remotely.`,
      });
    });

    goals.push(sdohGoal);
  }

  // Goals for quality gaps - with barrier-aware interventions
  analysis.qualityGaps.forEach(gap => {
    const qualityGoal: CarePlanGoal = {
      id: `goal-${goalCounter++}`,
      description: `Close ${gap.measureName} quality gap`,
      target: gap.closureRequirement,
      status: gap.status === 'In Progress' ? 'In Progress' : 'Not Started',
      dueDate: gap.dueDate,
      progress: gap.status === 'In Progress' ? 30 : 0,
      notes: `${gap.program} measure - ${gap.daysOpen} days open`,
      interventions: []
    };

    if (gap.measureName.toLowerCase().includes('lab') || gap.measureName.toLowerCase().includes('a1c') || gap.measureName.toLowerCase().includes('hba1c')) {
      if (hasTransportationBarrier) {
        qualityGoal.interventions!.push({
          id: createInterventionId('goal', interventionCounter++),
          type: 'Procedure',
          description: 'Order at-home lab test kit',
          status: 'Pending',
          provider: 'Quest Diagnostics Home Testing',
          notes: 'Mail-order kit, self-collection at home, mail back for processing. Results in 5-7 days.',
        });
        qualityGoal.interventions!.push({
          id: createInterventionId('goal', interventionCounter++),
          type: 'Appointment',
          description: 'Telehealth follow-up to review lab results',
          status: 'Pending',
          provider: 'Primary Care Provider',
          notes: 'Video visit via MyChart to discuss results and adjust care plan.',
        });
      } else {
        qualityGoal.interventions!.push({
          id: createInterventionId('goal', interventionCounter++),
          type: 'Appointment',
          description: 'Schedule lab test',
          status: 'Pending',
          notes: 'In-person lab visit',
        });
      }
    } else if (gap.measureName.toLowerCase().includes('depression') || gap.measureName.toLowerCase().includes('phq') || gap.measureName.toLowerCase().includes('edinburgh')) {
      qualityGoal.interventions!.push({
        id: createInterventionId('goal', interventionCounter++),
        type: 'Monitoring',
        description: 'Complete screening via patient portal',
        status: 'Pending',
        provider: 'Care Manager (via patient portal)',
        notes: 'Self-administered digital screening (10-15 minutes). No appointment needed.',
      });
      qualityGoal.interventions!.push({
        id: createInterventionId('goal', interventionCounter++),
        type: 'Appointment',
        description: 'Telehealth follow-up if screening indicates need',
        status: 'Pending',
        provider: 'Behavioral Health Specialist',
        notes: 'Conditional - only scheduled if screening score indicates clinical concern.',
      });
    } else if (gap.measureName.toLowerCase().includes('well-child') || gap.measureName.toLowerCase().includes('physical exam') || gap.measureName.toLowerCase().includes('immunization')) {
      if (hasTransportationBarrier) {
        qualityGoal.interventions!.push({
          id: createInterventionId('goal', interventionCounter++),
          type: 'Appointment',
          description: 'Schedule in-person visit (after transportation secured)',
          status: 'Pending',
          notes: 'Required in-person visit. Schedule AFTER transportation assistance is in place (Goal 1). Bundle with any other necessary in-person care.',
        });
      } else {
        qualityGoal.interventions!.push({
          id: createInterventionId('goal', interventionCounter++),
          type: 'Appointment',
          description: 'Schedule in-person visit',
          status: 'Pending',
          notes: 'Required for physical examination and/or immunizations.',
        });
      }
    } else {
      const modality = determineOptimalModality('Follow_Up', hasTransportationBarrier, hasCaregiverBurden);
      qualityGoal.interventions!.push({
        id: createInterventionId('goal', interventionCounter++),
        type: 'Appointment',
        description: `Address ${gap.measureName} (${modality.modality})`,
        status: 'Pending',
        notes: modality.notes,
      });
    }

    goals.push(qualityGoal);
  });

  // Goals for HCC documentation
  analysis.hccOpportunities.forEach(hcc => {
    goals.push({
      id: `goal-${goalCounter++}`,
      description: `Document and code ${hcc.hccDescription}`,
      target: `ICD-10: ${hcc.icdCode} documented and submitted`,
      status: 'Not Started',
      dueDate: hcc.submissionDeadline,
      progress: 0,
      notes: `RAF Delta: +${hcc.estimatedRafDelta.toFixed(2)}, Revenue: $${hcc.estimatedRevenueDelta.toLocaleString()}`,
    });
  });

  // Goals for utilization risks
  analysis.utilizationRisks.forEach(alert => {
    if (alert.tier === 'Critical' || alert.tier === 'Important') {
      goals.push({
        id: `goal-${goalCounter++}`,
        description: `Mitigate ${alert.type}`,
        target: 'Risk reduced to low level',
        status: 'Not Started',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        progress: 0,
        notes: `Estimated cost impact: $${alert.estimatedCost.toLocaleString()}`,
      });
    }
  });

  return goals;
}

export function generateInterventions(analysis: PatientAnalysis): CarePlanIntervention[] {
  const interventions: CarePlanIntervention[] = [];
  let interventionCounter = 1;

  const hasTransportationBarrier = analysis.sdohNeeds.some(need =>
    need.toLowerCase().includes('transportation')
  );
  const hasCaregiverBurden = analysis.sdohNeeds.some(need =>
    need.toLowerCase().includes('childcare') || need.toLowerCase().includes('caregiver')
  );

  analysis.specialtiesNeeded.forEach(specialty => {
    interventions.push({
      id: createInterventionId('plan', interventionCounter++),
      type: 'Referral',
      description: `${specialty} consultation (referral pending)`,
      status: 'Pending',
      provider: `${specialty} specialist (to be assigned)`,
      notes: `Referral will be sent electronically. Specialist will contact patient to schedule.`,
    });
  });

  if (analysis.primaryConditions.length > 0) {
    interventions.push({
      id: createInterventionId('plan', interventionCounter++),
      type: 'Monitoring',
      description: 'Home monitoring program enrollment',
      status: 'Pending',
      frequency: 'Daily',
      notes: `Remote monitoring for: ${analysis.primaryConditions.slice(0, 2).join(', ')}. Equipment shipped to home.`,
    });
  }

  if (analysis.medicationIssues.length > 0) {
    const modality = determineOptimalModality('Follow_Up', hasTransportationBarrier, hasCaregiverBurden);
    interventions.push({
      id: createInterventionId('plan', interventionCounter++),
      type: 'Appointment',
      description: `Medication review (${modality.modality})`,
      status: 'Pending',
      notes: `${modality.notes}. Review: ${analysis.medicationIssues.join('; ')}`,
    });
  }

  if (analysis.qualityGaps.length > 0) {
    interventions.push({
      id: createInterventionId('plan', interventionCounter++),
      type: 'Education',
      description: 'Patient education materials (digital)',
      status: 'Pending',
      notes: `Educational resources sent via patient portal. Topics: ${analysis.qualityGaps.map(g => g.measureName).slice(0, 2).join(', ')}`,
    });
  }

  const followUpModality = determineOptimalModality('Follow_Up', hasTransportationBarrier, hasCaregiverBurden);
  interventions.push({
    id: createInterventionId('plan', interventionCounter++),
    type: 'Appointment',
    description: `Care plan review (${followUpModality.modality})`,
    status: 'Pending',
    scheduledDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: `${followUpModality.notes}. Review progress on all goals and interventions.`,
  });

  if (analysis.sdohNeeds.length > 0) {
    analysis.sdohNeeds.forEach(need => {
      const modality = determineOptimalModality('SDoH_Referral', hasTransportationBarrier, hasCaregiverBurden);
      interventions.push({
        id: createInterventionId('plan', interventionCounter++),
        type: 'Referral',
        description: `${need} - Community resource referral`,
        status: 'Pending',
        provider: 'Social Services / Community Resources',
        notes: `${modality.notes}. No appointment needed - enrollment can be completed remotely.`,
      });
    });
  }

  return interventions;
}

export function assembleCareTeam(
  analysis: PatientAnalysis,
  patient: Patient
): CareTeamMember[] {
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

  analysis.specialtiesNeeded.forEach(specialty => {
    if (specialty === 'Care Management' || specialty === 'Social Work') {
      const roleName = specialty === 'Care Management' ? 'Care Manager' : 'Social Worker';
      team.push({
        id: `team-${teamCounter++}`,
        name: `${specialty} (to be assigned)`,
        role: roleName,
        relationship: specialty === 'Care Management' ? 'Care Manager' : 'Consultant',
        phone: 'See care team assignment',
        email: `${specialty.toLowerCase().replace(/\s+/g, '')}@careteam.health`,
        networkTier: 'Preferred',
        npi: 'Pending assignment',
      });
    } else {
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
    }
  });

  return team;
}
