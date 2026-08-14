import { referralStore } from '@/lib/mockData';
import type {
  Patient,
  HCCSuspect,
  CareGap,
  UtilizationAlert,
  CarePlanGoal,
  CarePlanIntervention,
  Referral,
  ComprehensivePlanInput,
  PatientAnalysis,
} from './carePlanGenerator.types';

export function createInterventionId(scope: string, interventionCounter: number): string {
  return `intervention-${scope}-${interventionCounter}`;
}

/**
 * Assign interventions to their related goals (FHIR-aligned approach)
 * Each goal can have multiple interventions that help achieve it
 */
export function assignInterventionsToGoals(
  goals: CarePlanGoal[],
  interventions: CarePlanIntervention[],
  analysis: any
): void {
  if (!goals || goals.length === 0) return;

  goals.forEach(goal => {
    if (!goal.interventions) goal.interventions = [];
  });

  if (!interventions || interventions.length === 0) {
    goals.forEach((goal, idx) => {
      goal.interventions = [{
        id: `intervention-default-${idx}`,
        type: 'Appointment',
        description: 'Follow-up to assess goal progress',
        status: 'Pending',
        notes: `Review progress on: ${goal.description}`,
      }];
    });
    return;
  }

  const hccGoals = goals.filter(g => g.description && g.description.includes('Document and code'));
  const referralInterventions = interventions.filter(i => i.type === 'Referral');
  if (hccGoals.length > 0 && referralInterventions.length > 0) {
    referralInterventions.forEach((intervention, idx) => {
      const targetGoal = hccGoals[idx % hccGoals.length];
      if (targetGoal && targetGoal.interventions) targetGoal.interventions.push(intervention);
    });
  }

  const qualityGoals = goals.filter(g => g.description && g.description.includes('Close') && g.description.includes('quality gap'));
  const monitoringInterventions = interventions.filter(i => i.type === 'Monitoring');
  if (qualityGoals.length > 0 && monitoringInterventions.length > 0) {
    monitoringInterventions.forEach((intervention, idx) => {
      const targetGoal = qualityGoals[idx % qualityGoals.length];
      if (targetGoal && targetGoal.interventions) targetGoal.interventions.push(intervention);
    });
  }

  const medicationInterventions = interventions.filter(i => i.type === 'Medication');
  if (qualityGoals.length > 0 && medicationInterventions.length > 0) {
    medicationInterventions.forEach((intervention, idx) => {
      const targetGoal = qualityGoals[idx % qualityGoals.length];
      if (targetGoal && targetGoal.interventions) targetGoal.interventions.push(intervention);
    });
  }

  const educationInterventions = interventions.filter(i => i.type === 'Education');
  if (qualityGoals.length > 0 && educationInterventions.length > 0) {
    educationInterventions.forEach((intervention, idx) => {
      const targetGoal = qualityGoals[idx % qualityGoals.length];
      if (targetGoal && targetGoal.interventions) targetGoal.interventions.push(intervention);
    });
  }

  const riskGoals = goals.filter(g => g.description && g.description.includes('Mitigate'));
  const appointmentInterventions = interventions.filter(i => i.type === 'Appointment');
  if (appointmentInterventions.length > 0) {
    appointmentInterventions.forEach((intervention, idx) => {
      if (riskGoals.length > 0) {
        const targetGoal = riskGoals[idx % riskGoals.length];
        if (targetGoal && targetGoal.interventions) targetGoal.interventions.push(intervention);
      } else if (goals.length > 0 && goals[0].interventions) {
        goals[0].interventions.push(intervention);
      }
    });
  }

  goals.forEach((goal, idx) => {
    if (!goal.interventions || goal.interventions.length === 0) {
      goal.interventions = [{
        id: `intervention-followup-${idx}`,
        type: 'Appointment',
        description: 'Follow-up to assess goal progress',
        status: 'Pending',
        notes: `Review progress on: ${goal.description || 'this goal'}`,
      }];
    }
  });
}

/**
 * Create referrals for care gaps automatically
 * Each care gap gets a referral to the appropriate specialist
 */
export function createReferralsForCareGaps(
  patient: Patient,
  careGaps: CareGap[],
  specialtiesNeeded: string[]
): Referral[] {
  const referrals: Referral[] = [];
  let referralCounter = 1;

  const gapToSpecialty: Record<string, string> = {
    'HbA1c': 'Endocrinology',
    'Diabetes': 'Endocrinology',
    'Eye Exam': 'Ophthalmology',
    'Retinal': 'Ophthalmology',
    'Colorectal': 'Gastroenterology',
    'Blood Pressure': 'Cardiology',
    'Hypertension': 'Cardiology',
    'Kidney': 'Nephrology',
    'Renal': 'Nephrology',
  };

  careGaps.forEach((gap) => {
    let specialistType = 'Primary Care';
    for (const [keyword, specialty] of Object.entries(gapToSpecialty)) {
      if (gap.measureName.toLowerCase().includes(keyword.toLowerCase())) {
        specialistType = specialty;
        break;
      }
    }

    let gainshareAmount = 2500;
    if (gap.program === 'STARS') gainshareAmount = 3000;
    if (gap.program === 'MIPS') gainshareAmount = 2000;

    const referralId = `ref-margaret-${Date.now()}-${referralCounter++}`;

    const referral: Referral = {
      referralId,
      serviceRequestId: `sr-${referralId}`,
      patientName: patient.name,
      patientId: patient.id,
      patientDOB: patient.dob,
      referringProvider: patient.primaryCareProvider,
      referringOrganization: (patient as any).organization || patient.primaryCareProvider,
      referralDate: new Date().toISOString().split('T')[0],
      urgency: gap.daysOpen > 90 ? 'urgent' : 'routine',
      specialistType,
      clinicalNotes: `Referral for ${gap.measureName}. ${gap.notes}`,
      careGap: {
        measure: gap.measureId,
        description: gap.measureName,
        daysOpen: gap.daysOpen,
        gainshareAmount,
        targetCriteria: gap.closureRequirement,
        currentValue: `Gap open ${gap.daysOpen} days`,
      },
      status: 'pending',
      clinicalContext: {
        primaryDiagnosis: gap.measureName,
        icd10: gap.measureId,
      },
    };

    referrals.push(referral);
    referralStore.addReferral(referral);
  });

  return referrals;
}

export function analyzePatientData(input: ComprehensivePlanInput): PatientAnalysis {
  const { patient, hccSuspects, careGaps, alerts } = input;

  let overallPriority: 'Critical' | 'High' | 'Moderate' | 'Low' = 'Moderate';
  if (patient.riskTier === 'Critical' || alerts.some(a => a.tier === 'Critical')) {
    overallPriority = 'Critical';
  } else if (patient.riskTier === 'High' || alerts.some(a => a.tier === 'Important')) {
    overallPriority = 'High';
  } else if (patient.riskTier === 'Moderate') {
    overallPriority = 'Moderate';
  } else {
    overallPriority = 'Low';
  }

  const primaryConditions = [...new Set(hccSuspects.map(h => h.hccDescription))];
  const specialtiesNeeded = identifySpecialties(hccSuspects, careGaps, alerts);
  const sdohNeeds = detectSDoHNeeds(patient, alerts, careGaps);
  const medicationIssues = identifyMedicationIssues(patient, alerts);
  const urgentActions = identifyUrgentActions(hccSuspects, careGaps, alerts);
  const totalRafDelta = hccSuspects.reduce((sum, h) => sum + h.estimatedRafDelta, 0);
  const totalRevenueDelta = hccSuspects.reduce((sum, h) => sum + h.estimatedRevenueDelta, 0);

  return {
    overallPriority,
    primaryConditions,
    hccOpportunities: hccSuspects,
    qualityGaps: careGaps,
    utilizationRisks: alerts,
    sdohNeeds,
    medicationIssues,
    specialtiesNeeded,
    urgentActions,
    totalRafDelta,
    totalRevenueDelta,
  };
}

export function identifySpecialties(
  hccSuspects: HCCSuspect[],
  careGaps: CareGap[],
  alerts: UtilizationAlert[]
): string[] {
  const specialties = new Set<string>();

  hccSuspects.forEach(hcc => {
    if (hcc.hccDescription.toLowerCase().includes('diabetes')) specialties.add('Endocrinology');
    if (hcc.hccDescription.toLowerCase().includes('heart') ||
        hcc.hccDescription.toLowerCase().includes('hypertension') ||
        hcc.hccDescription.toLowerCase().includes('cardiac')) specialties.add('Cardiology');
    if (hcc.hccDescription.toLowerCase().includes('kidney') ||
        hcc.hccDescription.toLowerCase().includes('renal')) specialties.add('Nephrology');
    if (hcc.hccDescription.toLowerCase().includes('lung') ||
        hcc.hccDescription.toLowerCase().includes('copd') ||
        hcc.hccDescription.toLowerCase().includes('asthma')) specialties.add('Pulmonology');
  });

  if (hccSuspects.length > 3 || alerts.length > 2) specialties.add('Care Management');
  if (alerts.some(a => a.description.toLowerCase().includes('social'))) specialties.add('Social Work');

  return Array.from(specialties);
}

export function detectSDoHNeeds(
  patient: Patient,
  alerts: UtilizationAlert[],
  careGaps: CareGap[]
): string[] {
  const needs: string[] = [];

  careGaps.forEach(gap => {
    const isSocialGap = gap.measureName.toLowerCase().includes('social') ||
                        gap.measureName.toLowerCase().includes('transportation') ||
                        gap.measureName.toLowerCase().includes('childcare') ||
                        gap.measureName.toLowerCase().includes('food') ||
                        gap.measureName.toLowerCase().includes('housing') ||
                        gap.measureName.toLowerCase().includes('wic') ||
                        gap.measureName.toLowerCase().includes('snap') ||
                        gap.measureName.toLowerCase().includes('liheap');
    if (!isSocialGap) return;

    if (gap.measureName.toLowerCase().includes('transportation') ||
        gap.measureName.toLowerCase().includes('transport')) {
      needs.push(`Transportation barrier: ${gap.notes || 'documented'}`);
    }
    if (gap.measureName.toLowerCase().includes('childcare') ||
        gap.measureName.toLowerCase().includes('child care')) {
      needs.push(`Childcare support: ${gap.notes || 'subsidy enrollment needed'}`);
    }
    if (gap.measureName.toLowerCase().includes('wic') ||
        gap.measureName.toLowerCase().includes('food') ||
        gap.measureName.toLowerCase().includes('snap')) {
      needs.push(`Food security: ${gap.notes || 'benefit enrollment needed'}`);
    }
    if (gap.measureName.toLowerCase().includes('housing') ||
        gap.measureName.toLowerCase().includes('liheap') ||
        gap.measureName.toLowerCase().includes('utility')) {
      needs.push(`Housing/utility support: ${gap.notes || 'assistance needed'}`);
    }
  });

  alerts.forEach(alert => {
    if (alert.description.toLowerCase().includes('readmission')) {
      needs.push('Post-discharge support needed');
    }
    if (alert.description.toLowerCase().includes('housing') &&
        !needs.some(n => n.includes('Housing'))) {
      needs.push('Housing stability support needed');
    }
  });

  return needs;
}

export function identifyMedicationIssues(patient: Patient, alerts: UtilizationAlert[]): string[] {
  const issues: string[] = [];
  const polyPharmacyAlert = alerts.find(a => a.type === 'Poly-Pharmacy');
  if (polyPharmacyAlert) issues.push('Medication reconciliation needed - poly-pharmacy risk');
  if (patient.openHCCSuspects > 2) issues.push('Review medication adherence for chronic conditions');
  return issues;
}

export function identifyUrgentActions(
  hccSuspects: HCCSuspect[],
  careGaps: CareGap[],
  alerts: UtilizationAlert[]
): string[] {
  const urgent: string[] = [];

  hccSuspects.forEach(hcc => {
    const daysUntilDeadline = Math.floor(
      (new Date(hcc.submissionDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilDeadline < 30) {
      urgent.push(`HCC ${hcc.hccCode} documentation due in ${daysUntilDeadline} days`);
    }
  });

  alerts.forEach(alert => {
    if (alert.tier === 'Critical') urgent.push(alert.description);
  });

  careGaps.forEach(gap => {
    if (gap.status === 'Open' && gap.daysOpen > 60) {
      urgent.push(`${gap.measureName} overdue by ${gap.daysOpen} days`);
    }
  });

  return urgent;
}
