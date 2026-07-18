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
 * This service simulates AI-powered analysis and auto-population
 * to create a comprehensive care plan with minimal physician input.
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

import type { Patient, HCCSuspect, CareGap, UtilizationAlert } from '@/lib/types';
import type { CarePlan, CarePlanGoal, CarePlanIntervention, CareTeamMember, Referral } from '@/lib/mockData';
import { referralStore } from '@/lib/mockData';
import { holisticContextEngine } from './holisticContextEngine';
import { rootCauseAnalyzer } from './rootCauseAnalyzer';
import { tieredInterventionGenerator } from './tieredInterventionGenerator';
import type { HolisticCarePlan } from './tieredInterventionGenerator';

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

function createInterventionId(scope: string, interventionCounter: number): string {
  return `intervention-${scope}-${interventionCounter}`;
}

/**
 * Assign interventions to their related goals (FHIR-aligned approach)
 * Each goal can have multiple interventions that help achieve it
 */
function assignInterventionsToGoals(
  goals: CarePlanGoal[],
  interventions: CarePlanIntervention[],
  analysis: any
): void {
  // Safety check: if no goals or interventions, return early
  if (!goals || goals.length === 0) {
    return;
  }

  // Initialize interventions array for each goal
  goals.forEach(goal => {
    if (!goal.interventions) {
      goal.interventions = [];
    }
  });

  // Safety check: if no interventions, ensure each goal has a default one
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

  // Strategy: Distribute interventions across goals based on their purpose
  
  // Assign referrals to HCC documentation goals
  const hccGoals = goals.filter(g => g.description && g.description.includes('Document and code'));
  const referralInterventions = interventions.filter(i => i.type === 'Referral');
  if (hccGoals.length > 0 && referralInterventions.length > 0) {
    referralInterventions.forEach((intervention, idx) => {
      const targetGoal = hccGoals[idx % hccGoals.length];
      if (targetGoal && targetGoal.interventions) {
        targetGoal.interventions.push(intervention);
      }
    });
  }

  // Assign monitoring to quality gap goals
  const qualityGoals = goals.filter(g => g.description && g.description.includes('Close') && g.description.includes('quality gap'));
  const monitoringInterventions = interventions.filter(i => i.type === 'Monitoring');
  if (qualityGoals.length > 0 && monitoringInterventions.length > 0) {
    monitoringInterventions.forEach((intervention, idx) => {
      const targetGoal = qualityGoals[idx % qualityGoals.length];
      if (targetGoal && targetGoal.interventions) {
        targetGoal.interventions.push(intervention);
      }
    });
  }

  // Assign medication reviews to quality gap goals
  const medicationInterventions = interventions.filter(i => i.type === 'Medication');
  if (qualityGoals.length > 0 && medicationInterventions.length > 0) {
    medicationInterventions.forEach((intervention, idx) => {
      const targetGoal = qualityGoals[idx % qualityGoals.length];
      if (targetGoal && targetGoal.interventions) {
        targetGoal.interventions.push(intervention);
      }
    });
  }

  // Assign education to quality gap goals
  const educationInterventions = interventions.filter(i => i.type === 'Education');
  if (qualityGoals.length > 0 && educationInterventions.length > 0) {
    educationInterventions.forEach((intervention, idx) => {
      const targetGoal = qualityGoals[idx % qualityGoals.length];
      if (targetGoal && targetGoal.interventions) {
        targetGoal.interventions.push(intervention);
      }
    });
  }

  // Assign appointments to utilization risk goals
  const riskGoals = goals.filter(g => g.description && g.description.includes('Mitigate'));
  const appointmentInterventions = interventions.filter(i => i.type === 'Appointment');
  if (appointmentInterventions.length > 0) {
    appointmentInterventions.forEach((intervention, idx) => {
      if (riskGoals.length > 0) {
        const targetGoal = riskGoals[idx % riskGoals.length];
        if (targetGoal && targetGoal.interventions) {
          targetGoal.interventions.push(intervention);
        }
      } else if (goals.length > 0 && goals[0].interventions) {
        // If no risk goals, assign to first goal
        goals[0].interventions.push(intervention);
      }
    });
  }

  // Ensure every goal has at least one intervention
  goals.forEach((goal, idx) => {
    if (!goal.interventions || goal.interventions.length === 0) {
      // Assign a generic follow-up intervention
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
function createReferralsForCareGaps(
  patient: Patient,
  careGaps: CareGap[],
  specialtiesNeeded: string[]
): Referral[] {
  const referrals: Referral[] = [];
  let referralCounter = 1;

  // Map care gaps to specialist types
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

  careGaps.forEach((gap, index) => {
    // Determine specialist type based on gap measure name
    let specialistType = 'Primary Care';
    for (const [keyword, specialty] of Object.entries(gapToSpecialty)) {
      if (gap.measureName.toLowerCase().includes(keyword.toLowerCase())) {
        specialistType = specialty;
        break;
      }
    }

    // Calculate gainshare amount based on program
    let gainshareAmount = 2500; // Default
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
    
    // Add to referral store immediately
    referralStore.addReferral(referral);
  });

  return referrals;
}

/**
 * Main function to generate a comprehensive care plan
 * This is the "magic" that happens when physician clicks "Generate"
 * NOW WITH AUTO-REFERRAL CREATION
 */
export function generateComprehensiveCarePlan(input: ComprehensivePlanInput): GeneratedCarePlan {
  try {
    const { patient, hccSuspects, careGaps, alerts, clinicalData } = input;

    // Step 1: Analyze all data sources
    const analysis = analyzePatientData(input);

    // Step 2: Generate goals from all sources
    const goals = generateGoals(analysis);

    // Step 3: Generate interventions with smart assignment
    const interventions = generateInterventions(analysis);

    // Step 3.5: Assign interventions to goals (FHIR-aligned)
    try {
      assignInterventionsToGoals(goals, interventions, analysis);
    } catch (error) {
      console.error('Error assigning interventions to goals:', error);
      // Continue without intervention assignment if it fails
    }

    // Step 4: Assemble care team based on needs
    const careTeam = assembleCareTeam(analysis, patient);

    // Step 5: Determine sharing strategy
    const sharedWith = determineSharing(analysis);

    // Step 6: Create comprehensive title and description
    const { title, description } = generateTitleAndDescription(analysis);

    // Step 7: Extract all conditions being addressed
    const addresses = extractAddresses(analysis);

    // Step 8: Calculate estimated impact (now links measures to goals/interventions)
    const estimatedImpact = calculateImpact(analysis, goals, interventions);

    // Step 9: Generate clinical summary
    const clinicalSummary = generateClinicalSummary(analysis, goals, interventions, careTeam);

    // Step 10: AUTO-CREATE REFERRALS for all open care gaps
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
    throw error; // Re-throw to see the full error in console
  }
}

interface PatientAnalysis {
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

function analyzePatientData(input: ComprehensivePlanInput): PatientAnalysis {
  const { patient, hccSuspects, careGaps, alerts } = input;

  // Determine overall priority based on risk tier and alerts
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

  // Extract primary conditions from HCC suspects
  const primaryConditions = [...new Set(hccSuspects.map(h => h.hccDescription))];

  // Identify specialties needed based on conditions
  const specialtiesNeeded = identifySpecialties(hccSuspects, careGaps, alerts);

  // Detect SDoH needs (simulated - in real system would come from patient data)
  const sdohNeeds = detectSDoHNeeds(patient, alerts, careGaps);

  // Identify medication issues
  const medicationIssues = identifyMedicationIssues(patient, alerts);

  // Identify urgent actions
  const urgentActions = identifyUrgentActions(hccSuspects, careGaps, alerts);

  // Calculate total RAF and revenue impact
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

function identifySpecialties(
  hccSuspects: HCCSuspect[],
  careGaps: CareGap[],
  alerts: UtilizationAlert[]
): string[] {
  const specialties = new Set<string>();

  // Map HCC codes to specialties
  hccSuspects.forEach(hcc => {
    if (hcc.hccDescription.toLowerCase().includes('diabetes')) {
      specialties.add('Endocrinology');
    }
    if (hcc.hccDescription.toLowerCase().includes('heart') || 
        hcc.hccDescription.toLowerCase().includes('hypertension') ||
        hcc.hccDescription.toLowerCase().includes('cardiac')) {
      specialties.add('Cardiology');
    }
    if (hcc.hccDescription.toLowerCase().includes('kidney') ||
        hcc.hccDescription.toLowerCase().includes('renal')) {
      specialties.add('Nephrology');
    }
    if (hcc.hccDescription.toLowerCase().includes('lung') ||
        hcc.hccDescription.toLowerCase().includes('copd') ||
        hcc.hccDescription.toLowerCase().includes('asthma')) {
      specialties.add('Pulmonology');
    }
  });

  // Add care management for complex patients
  if (hccSuspects.length > 3 || alerts.length > 2) {
    specialties.add('Care Management');
  }

  // Add social work for SDoH needs
  if (alerts.some(a => a.description.toLowerCase().includes('social'))) {
    specialties.add('Social Work');
  }

  return Array.from(specialties);
}

function detectSDoHNeeds(
  patient: Patient,
  alerts: UtilizationAlert[],
  careGaps: CareGap[]
): string[] {
  const needs: string[] = [];

  // ONLY use actual documented SDoH needs from care gaps
  // NO RANDOM GENERATION - NO HALLUCINATIONS
  
  careGaps.forEach(gap => {
    // Only process social-related gaps (check measure name for social indicators)
    const isSocialGap = gap.measureName.toLowerCase().includes('social') ||
                        gap.measureName.toLowerCase().includes('transportation') ||
                        gap.measureName.toLowerCase().includes('childcare') ||
                        gap.measureName.toLowerCase().includes('food') ||
                        gap.measureName.toLowerCase().includes('housing') ||
                        gap.measureName.toLowerCase().includes('wic') ||
                        gap.measureName.toLowerCase().includes('snap') ||
                        gap.measureName.toLowerCase().includes('liheap');
    
    if (!isSocialGap) {
      return; // Skip non-social gaps
    }

    // Check for transportation barriers
    if (gap.measureName.toLowerCase().includes('transportation') ||
        gap.measureName.toLowerCase().includes('transport')) {
      needs.push(`Transportation barrier: ${gap.notes || 'documented'}`);
    }
    
    // Check for childcare needs
    if (gap.measureName.toLowerCase().includes('childcare') ||
        gap.measureName.toLowerCase().includes('child care')) {
      needs.push(`Childcare support: ${gap.notes || 'subsidy enrollment needed'}`);
    }
    
    // Check for food security
    if (gap.measureName.toLowerCase().includes('wic') ||
        gap.measureName.toLowerCase().includes('food') ||
        gap.measureName.toLowerCase().includes('snap')) {
      needs.push(`Food security: ${gap.notes || 'benefit enrollment needed'}`);
    }
    
    // Check for housing
    if (gap.measureName.toLowerCase().includes('housing') ||
        gap.measureName.toLowerCase().includes('liheap') ||
        gap.measureName.toLowerCase().includes('utility')) {
      needs.push(`Housing/utility support: ${gap.notes || 'assistance needed'}`);
    }
  });

  // Check alerts for documented SDoH issues ONLY
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

function identifyMedicationIssues(patient: Patient, alerts: UtilizationAlert[]): string[] {
  const issues: string[] = [];

  // Check for poly-pharmacy alerts
  const polyPharmacyAlert = alerts.find(a => a.type === 'Poly-Pharmacy');
  if (polyPharmacyAlert) {
    issues.push('Medication reconciliation needed - poly-pharmacy risk');
  }

  // Simulate other medication issues
  if (patient.openHCCSuspects > 2) {
    issues.push('Review medication adherence for chronic conditions');
  }

  return issues;
}

function identifyUrgentActions(
  hccSuspects: HCCSuspect[],
  careGaps: CareGap[],
  alerts: UtilizationAlert[]
): string[] {
  const urgent: string[] = [];

  // HCC suspects with approaching deadlines
  hccSuspects.forEach(hcc => {
    const daysUntilDeadline = Math.floor(
      (new Date(hcc.submissionDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilDeadline < 30) {
      urgent.push(`HCC ${hcc.hccCode} documentation due in ${daysUntilDeadline} days`);
    }
  });

  // Critical alerts
  alerts.forEach(alert => {
    if (alert.tier === 'Critical') {
      urgent.push(alert.description);
    }
  });

  // Overdue care gaps
  careGaps.forEach(gap => {
    if (gap.status === 'Open' && gap.daysOpen > 60) {
      urgent.push(`${gap.measureName} overdue by ${gap.daysOpen} days`);
    }
  });

  return urgent;
}

function generateGoals(analysis: PatientAnalysis): CarePlanGoal[] {
  const goals: CarePlanGoal[] = [];
  let goalCounter = 1;
  let interventionCounter = 1;

  // Check for barriers to inform goal/intervention design
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

    // Add specific interventions for each SDoH need
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

    // Add barrier-aware interventions based on gap type
    if (gap.measureName.toLowerCase().includes('lab') || gap.measureName.toLowerCase().includes('a1c') || gap.measureName.toLowerCase().includes('hba1c')) {
      // Lab tests - use home kit if transportation barrier
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
      // Behavioral health screenings - use digital portal
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
      // Physical exams - must be in-person but note barriers
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
      // Default - use telehealth if barriers exist
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

/**
 * Determine best care modality based on patient barriers
 * Prioritizes home-based and telehealth when barriers exist
 */
function determineOptimalModality(
  interventionType: string,
  hasTransportationBarrier: boolean,
  hasCaregiverBurden: boolean
): { modality: string; notes: string } {
  // For SDoH referrals - always digital/remote enrollment
  if (interventionType === 'SDoH_Referral') {
    return {
      modality: 'digital',
      notes: 'Remote enrollment via patient portal or phone'
    };
  }

  // For behavioral health screenings - prioritize digital
  if (interventionType === 'BH_Screening') {
    return {
      modality: 'digital',
      notes: 'Self-administered via patient portal (10-15 minutes)'
    };
  }

  // For lab tests - use home kits if transportation barrier exists
  if (interventionType === 'Lab_Test' && hasTransportationBarrier) {
    return {
      modality: 'home-based',
      notes: 'At-home test kit (mail-order, self-collection, mail back)'
    };
  }

  // For follow-up appointments - default to telehealth if barriers exist
  if (interventionType === 'Follow_Up' && (hasTransportationBarrier || hasCaregiverBurden)) {
    return {
      modality: 'telehealth',
      notes: 'Video visit via MyChart or phone call'
    };
  }

  // For physical exams/procedures - must be in-person but note barriers
  if (interventionType === 'Physical_Exam') {
    if (hasTransportationBarrier) {
      return {
        modality: 'in-person',
        notes: 'Required in-person visit - schedule after transportation assistance secured'
      };
    }
    return {
      modality: 'in-person',
      notes: 'Required for physical examination'
    };
  }

  // Default to telehealth if any barriers exist
  if (hasTransportationBarrier || hasCaregiverBurden) {
    return {
      modality: 'telehealth',
      notes: 'Video visit to minimize travel burden'
    };
  }

  return {
    modality: 'in-person',
    notes: 'Standard office visit'
  };
}

function generateInterventions(analysis: PatientAnalysis): CarePlanIntervention[] {
  const interventions: CarePlanIntervention[] = [];
  let interventionCounter = 1;

  // Check for barriers to determine optimal modalities
  const hasTransportationBarrier = analysis.sdohNeeds.some(need =>
    need.toLowerCase().includes('transportation')
  );
  const hasCaregiverBurden = analysis.sdohNeeds.some(need =>
    need.toLowerCase().includes('childcare') || need.toLowerCase().includes('caregiver')
  );

  // Referrals for each specialty needed - always referrals, not appointments
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

  // Monitoring for chronic conditions - always home-based
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

  // Medication review - use telehealth if barriers exist
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

  // Education for quality gaps - always digital/remote
  if (analysis.qualityGaps.length > 0) {
    interventions.push({
      id: createInterventionId('plan', interventionCounter++),
      type: 'Education',
      description: 'Patient education materials (digital)',
      status: 'Pending',
      notes: `Educational resources sent via patient portal. Topics: ${analysis.qualityGaps.map(g => g.measureName).slice(0, 2).join(', ')}`,
    });
  }

  // Follow-up appointments - barrier-aware modality
  const followUpModality = determineOptimalModality('Follow_Up', hasTransportationBarrier, hasCaregiverBurden);
  interventions.push({
    id: createInterventionId('plan', interventionCounter++),
    type: 'Appointment',
    description: `Care plan review (${followUpModality.modality})`,
    status: 'Pending',
    scheduledDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: `${followUpModality.notes}. Review progress on all goals and interventions.`,
  });

  // SDoH interventions - ALWAYS referrals, never appointments
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

function assembleCareTeam(
  analysis: PatientAnalysis,
  patient: Patient
): CareTeamMember[] {
  const team: CareTeamMember[] = [];
  let teamCounter = 1;

  // Use patient's ACTUAL primary care provider - NO FAKE NAMES
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

  // Add care manager if assigned (check if property exists)
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

  // Add specialists based on patient's documented care team ONLY
  // NO HARDCODED FAKE SPECIALISTS
  analysis.specialtiesNeeded.forEach(specialty => {
    // Only add if this is a care coordination role, not a clinical specialist
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
      // For clinical specialists, create referral but don't add fake names
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

function determineSharing(analysis: PatientAnalysis): string[] {
  const sharing: string[] = [];

  // Always share with patient portal
  sharing.push('Patient Portal');

  // Share with specialists
  analysis.specialtiesNeeded.forEach(specialty => {
    if (specialty !== 'Care Management' && specialty !== 'Social Work') {
      sharing.push(`${specialty} (via FHIR)`);
    }
  });

  // Share with care manager if complex case
  if (analysis.overallPriority === 'Critical' || analysis.overallPriority === 'High') {
    sharing.push('Care Manager');
  }

  // Share with health plan for high-value cases
  if (analysis.totalRevenueDelta > 5000) {
    sharing.push('Health Plan');
  }

  return sharing;
}

function generateTitleAndDescription(analysis: PatientAnalysis): { title: string; description: string } {
  const conditionCount = analysis.primaryConditions.length;
  const gapCount = analysis.qualityGaps.length;
  const hccCount = analysis.hccOpportunities.length;

  // Generate title based on primary focus
  let title = 'Comprehensive Care Plan';
  if (analysis.primaryConditions.length > 0) {
    title = `${analysis.primaryConditions[0]} Management Plan`;
    if (conditionCount > 1) {
      title = `Multi-Condition Care Plan (${conditionCount} conditions)`;
    }
  }

  // Generate description
  const descriptionParts: string[] = [];
  
  descriptionParts.push(`Holistic care plan addressing ${conditionCount} active condition${conditionCount !== 1 ? 's' : ''}`);
  
  if (hccCount > 0) {
    descriptionParts.push(`${hccCount} HCC documentation opportunit${hccCount !== 1 ? 'ies' : 'y'}`);
  }
  
  if (gapCount > 0) {
    descriptionParts.push(`${gapCount} quality gap${gapCount !== 1 ? 's' : ''}`);
  }
  
  if (analysis.sdohNeeds.length > 0) {
    descriptionParts.push(`${analysis.sdohNeeds.length} social determinant${analysis.sdohNeeds.length !== 1 ? 's' : ''} of health`);
  }

  descriptionParts.push(`Coordinated care across ${analysis.specialtiesNeeded.length} specialt${analysis.specialtiesNeeded.length !== 1 ? 'ies' : 'y'}`);

  const description = descriptionParts.join(', ') + '.';

  return { title, description };
}

function generateClinicalSummary(
  analysis: PatientAnalysis,
  goals: CarePlanGoal[],
  interventions: CarePlanIntervention[],
  careTeam: CareTeamMember[]
): {
  conditions: string[];
  needs: string[];
  goals: string[];
  interventions: string[];
  referrals: string[];
} {
  // Extract conditions (brief, clinical)
  const conditions: string[] = [];
  analysis.primaryConditions.forEach(condition => {
    conditions.push(condition);
  });
  
  // Extract patient needs (clinical + SDoH)
  const needs: string[] = [];
  
  // Add HCC documentation needs
  if (analysis.hccOpportunities.length > 0) {
    needs.push(`${analysis.hccOpportunities.length} HCC documentation opportunities`);
  }
  
  // Add quality gaps
  if (analysis.qualityGaps.length > 0) {
    needs.push(`${analysis.qualityGaps.length} quality measure gaps`);
  }
  
  // Add SDoH needs
  analysis.sdohNeeds.forEach(need => {
    needs.push(need);
  });
  
  // Add utilization concerns
  if (analysis.utilizationRisks.length > 0) {
    needs.push(`${analysis.utilizationRisks.length} utilization alerts`);
  }
  
  // Extract key goals (top 3-4 most important)
  const goalSummaries = goals
    .slice(0, 4)
    .map(g => g.description);
  
  // Extract key interventions (grouped by type)
  const interventionSummaries: string[] = [];
  const interventionsByType = interventions.reduce((acc, i) => {
    if (!acc[i.type]) acc[i.type] = [];
    acc[i.type].push(i);
    return acc;
  }, {} as Record<string, typeof interventions>);
  
  Object.entries(interventionsByType).forEach(([type, items]) => {
    if (items.length === 1) {
      interventionSummaries.push(items[0].description);
    } else {
      interventionSummaries.push(`${items.length} ${type.toLowerCase()} interventions`);
    }
  });
  
  // Extract referrals (specialists)
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
    interventions: interventionSummaries.slice(0, 5), // Top 5 interventions
    referrals,
  };
}

function extractAddresses(analysis: PatientAnalysis): string[] {
  const addresses: string[] = [];

  // Add HCC conditions with ICD codes
  analysis.hccOpportunities.forEach(hcc => {
    addresses.push(`${hcc.icdCode} - ${hcc.icdDescription}`);
  });

  // Add quality gap measures
  analysis.qualityGaps.forEach(gap => {
    addresses.push(`${gap.program}: ${gap.measureName}`);
  });

  // Add SDoH needs
  analysis.sdohNeeds.forEach(need => {
    addresses.push(`SDoH: ${need}`);
  });

  return [...new Set(addresses)]; // Remove duplicates
}

function calculateImpact(
  analysis: PatientAnalysis,
  goals: CarePlanGoal[],
  interventions: CarePlanIntervention[]
): {
  rafDelta: number;
  providerGainshare: number;
  qualityGapsClosed: number;
  qualityMeasureBreakdown: QualityMeasureImpact[];
} {
  // RAF impact from HCC documentation (positive = better documentation = higher reimbursement)
  const rafDelta = analysis.totalRafDelta;

  // Create detailed breakdown for each quality measure
  const qualityMeasureBreakdown: QualityMeasureImpact[] = analysis.qualityGaps.map(gap => {
    // Base bonus varies by program type
    let baseBonus = 2500; // Default HEDIS/STARS
    if (gap.program === 'MIPS') {
      baseBonus = 2000; // MIPS measures typically worth less
    } else if (gap.program === 'STARS') {
      baseBonus = 3000; // STARS measures worth more due to plan bonuses
    }

    // Find related goals - goals that mention this measure
    const relatedGoals = goals
      .filter(goal =>
        goal.description.toLowerCase().includes(gap.measureName.toLowerCase()) ||
        goal.notes?.toLowerCase().includes(gap.measureId.toLowerCase())
      )
      .map(goal => goal.id);

    // Find related interventions - interventions that address this gap
    const relatedInterventions = interventions
      .filter(intervention =>
        intervention.description.toLowerCase().includes(gap.measureName.toLowerCase()) ||
        intervention.notes?.toLowerCase().includes(gap.measureId.toLowerCase()) ||
        // Link referrals to measures that need specialist care
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

  // Provider gainshare calculation:
  // 1. Quality bonus from closing care gaps (sum of all measure bonuses)
  // 2. Shared savings from improved outcomes: 15% of RAF revenue increase
  const qualityBonus = qualityMeasureBreakdown.reduce((sum, m) => sum + m.estimatedBonus, 0);
  const rafRevenue = analysis.totalRevenueDelta; // Revenue from better RAF documentation
  const sharedSavings = rafRevenue * 0.15; // Provider gets 15% of RAF revenue increase
  const providerGainshare = qualityBonus + sharedSavings;

  // Number of quality gaps that will be closed
  const qualityGapsClosed = analysis.qualityGaps.length;

  return {
    rafDelta: Math.round(rafDelta * 100) / 100,
    providerGainshare: Math.round(providerGainshare),
    qualityGapsClosed,
    qualityMeasureBreakdown,
  };
}

/**
 * Generate holistic, context-aware care plan
 * Uses the new holistic context engine to understand the WHOLE patient
 * and generate tiered interventions that address root causes first
 */
export function generateHolisticCarePlan(input: ComprehensivePlanInput): GeneratedCarePlan & {
  holisticPlan?: HolisticCarePlan;
  rootCauseInsight?: string;
} {
  try {
    const { patient } = input;
    
    // Step 1: Build holistic context
    const context = holisticContextEngine.buildContext(patient.id);
    
    // Step 2: Analyze root cause
    const analysis = rootCauseAnalyzer.analyze(context);
    
    // Step 3: Generate tiered interventions
    const holisticPlan = tieredInterventionGenerator.generate(context, analysis);
    
    // Step 4: Convert holistic plan to standard care plan format
    const standardPlan = convertHolisticToStandardPlan(holisticPlan, input);
    
    // Step 5: Add holistic metadata
    return {
      ...standardPlan,
      holisticPlan,
      rootCauseInsight: analysis.criticalInsight,
    };
  } catch (error) {
    console.error('Error generating holistic care plan:', error);
    // Fallback to standard care plan generation
    return generateComprehensiveCarePlan(input);
  }
}

/**
 * Convert holistic care plan to standard care plan format
 * This maintains compatibility with existing UI components
 */
function convertHolisticToStandardPlan(
  holisticPlan: HolisticCarePlan,
  input: ComprehensivePlanInput
): GeneratedCarePlan {
  const { patient, careGaps } = input;
  
  // Convert tiered interventions to standard goals and interventions
  const goals: CarePlanGoal[] = [];
  const interventions: CarePlanIntervention[] = [];
  let goalCounter = 1;
  let interventionCounter = 1;
  
  // Process each tier
  holisticPlan.interventions.forEach((tieredIntervention, tierIndex) => {
    // Create a goal for this tier
    const goal: CarePlanGoal = {
      id: `goal-holistic-${goalCounter++}`,
      description: tieredIntervention.title,
      target: tieredIntervention.successMetrics[0] || 'Intervention completed',
      status: 'Not Started',
      dueDate: calculateDueDate(tieredIntervention.estimatedTimeframe),
      progress: 0,
      notes: `${tieredIntervention.rationale}\n\nSuccess Metrics:\n${tieredIntervention.successMetrics.join('\n')}`,
      interventions: [], // Will be populated below
    };
    
    // Convert actions to interventions
    tieredIntervention.actions.forEach(action => {
      const intervention: CarePlanIntervention = {
        id: `intervention-holistic-${interventionCounter++}`,
        type: mapModalityToType(action.modality, action.action), // Pass action description for smart type detection
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
  
  // Build care team from holistic plan - pass patient data to avoid hallucinations
  const careTeam = buildCareTeamFromHolisticPlan(holisticPlan, patient);
  
  // Create title and description
  const title = `Holistic Care Plan - ${holisticPlan.rootCauseAnalysis.primaryBlocker.type === 'caregiver-burden' ? 
    'Caregiver Support Focus' : 'Comprehensive Care'}`;
  
  const description = `Context-aware care plan addressing root cause: ${holisticPlan.rootCauseAnalysis.rootCause.description}. ` +
    `${holisticPlan.interventions.length} tiered interventions with ${holisticPlan.successProbability}% success probability.`;
  
  // Generate clinical summary
  const clinicalSummary = {
    conditions: holisticPlan.rootCauseAnalysis.primaryBlocker.description.split(','),
    needs: holisticPlan.rootCauseAnalysis.rootCause.cascadingEffects.slice(0, 3),
    goals: goals.slice(0, 3).map(g => g.description),
    interventions: interventions.slice(0, 5).map(i => i.description),
    referrals: careTeam.filter(m => m.role !== 'Primary Care Physician').map(m => m.role),
  };
  
  // Calculate impact
  const estimatedImpact = {
    rafDelta: 0, // Not applicable for holistic plan
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
  
  // Create referrals (maintain existing functionality)
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
function mapModalityToType(modality?: string, actionDescription?: string): CarePlanIntervention['type'] {
  // Check action description for keywords that indicate intervention type
  const description = (actionDescription || '').toLowerCase();
  
  // Social service enrollments/referrals - NEVER appointments
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
  
  // Monitoring/screening activities
  if (description.includes('monitor') ||
      description.includes('screening') ||
      description.includes('assessment')) {
    return 'Monitoring';
  }
  
  // Education/information
  if (description.includes('education') ||
      description.includes('training') ||
      description.includes('information')) {
    return 'Education';
  }
  
  // Procedures (labs, tests)
  if (description.includes('lab') ||
      description.includes('test') ||
      description.includes('procedure')) {
    return 'Procedure';
  }
  
  // Now check modality for remaining cases
  if (!modality) return 'Appointment';
  
  const modalityMap: Record<string, CarePlanIntervention['type']> = {
    'telehealth': 'Appointment',
    'in-person': 'Appointment',
    'home-visit': 'Monitoring',
    'phone': 'Referral', // Phone calls for enrollment = Referral
    'mobile-clinic': 'Appointment',
    'digital': 'Monitoring', // Digital screenings = Monitoring
  };
  
  return modalityMap[modality] || 'Appointment';
}

/**
 * Calculate due date from timeframe string
 */
function calculateDueDate(timeframe: string): string {
  const now = new Date();
  
  if (timeframe.includes('Immediate')) {
    now.setDate(now.getDate() + 7);
  } else if (timeframe.includes('Week 1')) {
    now.setDate(now.getDate() + 7);
  } else if (timeframe.includes('Week 2')) {
    now.setDate(now.getDate() + 14);
  } else if (timeframe.includes('Weeks 1-2')) {
    now.setDate(now.getDate() + 14);
  } else if (timeframe.includes('Weeks 3-4')) {
    now.setDate(now.getDate() + 28);
  } else if (timeframe.includes('Weeks 4-12')) {
    now.setDate(now.getDate() + 84);
  } else if (timeframe.includes('Ongoing')) {
    now.setDate(now.getDate() + 90);
  } else {
    now.setDate(now.getDate() + 30);
  }
  
  return now.toISOString().split('T')[0];
}

/**
 * Calculate date from week string (e.g., "Week 1" -> 7 days from now)
 */
function calculateDateFromWeek(weekString: string): string {
  const now = new Date();
  const weekMatch = weekString.match(/Week (\d+)/);
  
  if (weekMatch) {
    const weekNumber = parseInt(weekMatch[1]);
    now.setDate(now.getDate() + (weekNumber * 7));
  } else {
    now.setDate(now.getDate() + 7);
  }
  
  return now.toISOString().split('T')[0];
}

/**
 * Build care team from holistic plan
 */
function buildCareTeamFromHolisticPlan(holisticPlan: HolisticCarePlan, patient: Patient): CareTeamMember[] {
  const team: CareTeamMember[] = [];
  let teamCounter = 1;
  
  // Use patient's ACTUAL primary care provider - NO FAKE NAMES
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
  
  // Add care manager if assigned - NO FAKE NAMES
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
  
  // Add social worker if caregiver burden - NO FAKE NAMES
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
  
  // Extract specialists from interventions - NO FAKE NAMES
  const specialistProviders = new Set<string>();
  holisticPlan.interventions.forEach(intervention => {
    intervention.actions.forEach(action => {
      if (action.provider && !action.provider.includes('Team') &&
          !action.provider.includes('Services') && !action.provider.includes('Program')) {
        specialistProviders.add(action.provider);
      }
    });
  });
  
  // Add specialists as pending referrals - NO FAKE NAMES
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

/**
 * Map action status to standard intervention status
 * Valid values: 'Scheduled' | 'Active' | 'Completed' | 'Cancelled' | 'Pending'
 */
function mapStatusToStandard(status?: string): CarePlanIntervention['status'] {
  if (!status) return 'Pending';
  
  const statusMap: Record<string, CarePlanIntervention['status']> = {
    'pending': 'Pending',
    'in-progress': 'Active',
    'completed': 'Completed',
  };
  
  return statusMap[status] || 'Pending';
}

// Made with Bob