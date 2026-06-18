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
      referringOrganization: 'TCOC Primary Care Network',
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
    const careTeam = assembleCareTeam(analysis);

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
  const sdohNeeds = detectSDoHNeeds(patient, alerts);

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

function detectSDoHNeeds(patient: Patient, alerts: UtilizationAlert[]): string[] {
  const needs: string[] = [];

  // Simulate SDoH detection based on patient data and alerts
  if (patient.riskTier === 'Critical' || patient.riskTier === 'High') {
    // High-risk patients often have SDoH needs
    if (Math.random() > 0.5) needs.push('Transportation assistance needed');
    if (Math.random() > 0.6) needs.push('Medication cost concerns');
  }

  // Check alerts for SDoH indicators
  alerts.forEach(alert => {
    if (alert.description.toLowerCase().includes('readmission')) {
      needs.push('Post-discharge support needed');
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

  // Goals for quality gaps
  analysis.qualityGaps.forEach(gap => {
    goals.push({
      id: `goal-${goalCounter++}`,
      description: `Close ${gap.measureName} quality gap`,
      target: gap.closureRequirement,
      status: gap.status === 'In Progress' ? 'In Progress' : 'Not Started',
      dueDate: gap.dueDate,
      progress: gap.status === 'In Progress' ? 30 : 0,
      notes: `${gap.program} measure - ${gap.daysOpen} days open`,
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

  // Goals for SDoH needs
  analysis.sdohNeeds.forEach(need => {
    goals.push({
      id: `goal-${goalCounter++}`,
      description: `Address: ${need}`,
      target: 'Need resolved or support in place',
      status: 'Not Started',
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      progress: 0,
    });
  });

  return goals;
}

function generateInterventions(analysis: PatientAnalysis): CarePlanIntervention[] {
  const interventions: CarePlanIntervention[] = [];
  let interventionCounter = 1;

  // Referrals for each specialty needed
  analysis.specialtiesNeeded.forEach(specialty => {
    interventions.push({
      id: `intervention-${interventionCounter++}`,
      type: 'Referral',
      description: `${specialty} consultation`,
      status: 'Pending',
      provider: `${specialty} specialist (to be assigned)`,
      notes: `Auto-assigned based on patient conditions`,
    });
  });

  // Monitoring for chronic conditions
  if (analysis.primaryConditions.length > 0) {
    interventions.push({
      id: `intervention-${interventionCounter++}`,
      type: 'Monitoring',
      description: 'Home monitoring program',
      status: 'Pending',
      frequency: 'Daily',
      notes: `Monitor: ${analysis.primaryConditions.slice(0, 2).join(', ')}`,
    });
  }

  // Medication review if needed
  if (analysis.medicationIssues.length > 0) {
    interventions.push({
      id: `intervention-${interventionCounter++}`,
      type: 'Medication',
      description: 'Comprehensive medication review',
      status: 'Pending',
      notes: analysis.medicationIssues.join('; '),
    });
  }

  // Education for quality gaps
  if (analysis.qualityGaps.length > 0) {
    interventions.push({
      id: `intervention-${interventionCounter++}`,
      type: 'Education',
      description: 'Patient education on preventive care',
      status: 'Pending',
      notes: `Address: ${analysis.qualityGaps.map(g => g.measureName).slice(0, 2).join(', ')}`,
    });
  }

  // Follow-up appointments
  interventions.push({
    id: `intervention-${interventionCounter++}`,
    type: 'Appointment',
    description: 'Care plan review appointment',
    status: 'Pending',
    scheduledDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: 'Review progress on all goals and interventions',
  });

  // SDoH interventions
  if (analysis.sdohNeeds.length > 0) {
    interventions.push({
      id: `intervention-${interventionCounter++}`,
      type: 'Referral',
      description: 'Social services referral',
      status: 'Pending',
      provider: 'Social Work',
      notes: `Address: ${analysis.sdohNeeds.join('; ')}`,
    });
  }

  return interventions;
}

function assembleCareTeam(analysis: PatientAnalysis): CareTeamMember[] {
  const team: CareTeamMember[] = [];
  let teamCounter = 1;

  // Primary care physician (always included - always in network)
  team.push({
    id: `team-${teamCounter++}`,
    name: 'Dr. James Whitfield',
    role: 'Primary Care Physician',
    relationship: 'Primary',
    phone: '(312) 555-0100',
    email: 'j.whitfield@tcoc.health',
    networkTier: 'Preferred',
    npi: '1234567890',
  });

  // Add specialists based on needs with network tier assignments
  const specialtyMap: Record<string, {
    role: string;
    name: string;
    phone: string;
    networkTier: 'Preferred' | 'In-Network' | 'Out-of-Network';
    npi: string;
  }> = {
    'Cardiology': {
      role: 'Cardiologist',
      name: 'Dr. Emily Chen',
      phone: '(312) 555-0200',
      networkTier: 'Preferred',
      npi: '1234567891'
    },
    'Endocrinology': {
      role: 'Endocrinologist',
      name: 'Dr. Michael Rodriguez',
      phone: '(312) 555-0210',
      networkTier: 'In-Network',
      npi: '1234567892'
    },
    'Nephrology': {
      role: 'Nephrologist',
      name: 'Dr. Sarah Johnson',
      phone: '(312) 555-0220',
      networkTier: 'In-Network',
      npi: '1234567893'
    },
    'Pulmonology': {
      role: 'Pulmonologist',
      name: 'Dr. David Lee',
      phone: '(312) 555-0230',
      networkTier: 'Preferred',
      npi: '1234567894'
    },
    'Care Management': {
      role: 'Care Manager',
      name: 'Angela Torres, NP',
      phone: '(312) 555-0150',
      networkTier: 'Preferred',
      npi: '1234567895'
    },
    'Social Work': {
      role: 'Social Worker',
      name: 'Maria Garcia, LCSW',
      phone: '(312) 555-0160',
      networkTier: 'Preferred',
      npi: '1234567896'
    },
  };

  analysis.specialtiesNeeded.forEach(specialty => {
    const specialistInfo = specialtyMap[specialty];
    if (specialistInfo) {
      team.push({
        id: `team-${teamCounter++}`,
        name: specialistInfo.name,
        role: specialistInfo.role,
        specialty: specialty,
        relationship: specialty === 'Care Management' ? 'Care Manager' : 'Consultant',
        phone: specialistInfo.phone,
        email: `${specialistInfo.name.toLowerCase().replace(/[,.\s]/g, '')}@tcoc.health`,
        networkTier: specialistInfo.networkTier,
        npi: specialistInfo.npi,
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
        type: mapModalityToType(action.modality),
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
  
  // Build care team from holistic plan
  const careTeam = buildCareTeamFromHolisticPlan(holisticPlan);
  
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
 * Map modality to intervention type
 */
function mapModalityToType(modality?: string): CarePlanIntervention['type'] {
  if (!modality) return 'Appointment';
  
  const modalityMap: Record<string, CarePlanIntervention['type']> = {
    'telehealth': 'Appointment',
    'in-person': 'Appointment',
    'home-visit': 'Monitoring',
    'phone': 'Education',
    'mobile-clinic': 'Appointment',
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
function buildCareTeamFromHolisticPlan(holisticPlan: HolisticCarePlan): CareTeamMember[] {
  const team: CareTeamMember[] = [];
  let teamCounter = 1;
  
  // Always include PCP
  team.push({
    id: `team-${teamCounter++}`,
    name: 'Dr. James Whitfield',
    role: 'Primary Care Physician',
    relationship: 'Primary',
    phone: '(312) 555-0100',
    email: 'j.whitfield@tcoc.health',
    networkTier: 'Preferred',
    npi: '1234567890',
  });
  
  // Add care manager for complex cases
  team.push({
    id: `team-${teamCounter++}`,
    name: 'Angela Torres, NP',
    role: 'Care Manager',
    relationship: 'Care Manager',
    phone: '(312) 555-0150',
    email: 'atorres@tcoc.health',
    networkTier: 'Preferred',
    npi: '1234567895',
  });
  
  // Add social worker if caregiver burden
  if (holisticPlan.rootCauseAnalysis.primaryBlocker.type === 'caregiver-burden') {
    team.push({
      id: `team-${teamCounter++}`,
      name: 'Maria Garcia, LCSW',
      role: 'Social Worker',
      relationship: 'Consultant',
      phone: '(312) 555-0160',
      email: 'mgarcia@tcoc.health',
      networkTier: 'Preferred',
      npi: '1234567896',
    });
  }
  
  // Extract specialists from interventions
  const specialistProviders = new Set<string>();
  holisticPlan.interventions.forEach(intervention => {
    intervention.actions.forEach(action => {
      if (action.provider && !action.provider.includes('Team') && 
          !action.provider.includes('Services') && !action.provider.includes('Program')) {
        specialistProviders.add(action.provider);
      }
    });
  });
  
  // Add specialists (simplified - in production would map to actual providers)
  specialistProviders.forEach(provider => {
    if (provider.toLowerCase().includes('cardio')) {
      team.push({
        id: `team-${teamCounter++}`,
        name: 'Dr. Emily Chen',
        role: 'Cardiologist',
        specialty: 'Cardiology',
        relationship: 'Consultant',
        phone: '(312) 555-0200',
        email: 'echen@tcoc.health',
        networkTier: 'Preferred',
        npi: '1234567891',
      });
    }
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