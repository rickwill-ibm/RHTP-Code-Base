/**
 * Tiered Intervention Generator
 * 
 * Generates holistic, tiered care plans that:
 * - Address root cause first (Tier 1)
 * - Build on foundation with dependent interventions (Tiers 2-5)
 * - Adapt to patient's complete context
 * - Minimize burden and maximize success probability
 */

import type { HolisticPatientContext } from './holisticContextEngine';
import type { RootCauseAnalysis } from './rootCauseAnalyzer';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

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

// ============================================================================
// TIERED INTERVENTION GENERATOR
// ============================================================================

export class TieredInterventionGenerator {
  
  /**
   * Generate holistic care plan with tiered interventions
   */
  generate(
    context: HolisticPatientContext,
    analysis: RootCauseAnalysis
  ): HolisticCarePlan {
    
    const interventions = this.generateInterventions(context, analysis);
    const timeline = this.generateTimeline(interventions);
    const successProbability = analysis.successProbabilityWithIntervention;
    const estimatedCostSavings = this.calculateCostSavings(context, interventions);
    const estimatedBurdenReduction = this.calculateBurdenReduction(context, interventions);
    
    return {
      patient: {
        id: context.patient.id,
        name: context.patient.name
      },
      rootCauseAnalysis: analysis,
      interventions,
      timeline,
      successProbability,
      estimatedCostSavings,
      estimatedBurdenReduction,
      generatedAt: new Date().toISOString()
    };
  }
  
  /**
   * Generate tiered interventions based on root cause
   */
  private generateInterventions(
    context: HolisticPatientContext,
    analysis: RootCauseAnalysis
  ): TieredIntervention[] {
    
    const interventions: TieredIntervention[] = [];
    
    // TIER 1: Address root cause
    if (analysis.rootCause.type === 'caregiver-burden') {
      interventions.push(this.generateCaregiverSupportIntervention(context));
    } else if (analysis.rootCause.type === 'transportation') {
      interventions.push(this.generateTransportationIntervention(context));
    }
    
    // TIER 2: Transportation (if not root cause but still a barrier)
    if (analysis.rootCause.type !== 'transportation' && 
        context.barriers.transportation.severity === 'high') {
      interventions.push(this.generateHomeBasedLabTesting(context));
    }
    
    // TIER 3: Care delivery optimization
    interventions.push(this.generateCareDeliveryOptimization(context));
    
    // TIER 4: Clinical care
    // Add depression screening (Tier 3)
    interventions.push(this.generateDepressionScreening(context));
    
    // Add well-child visit (Tier 4) - only required in-person visit
    interventions.push(this.generateWellChildVisit(context));
    
    // TIER 5: Sustainability
    interventions.push(this.generateSustainabilityIntervention(context));
    
    return interventions;
  }
  
  /**
   * TIER 1: Caregiver support intervention
   */
  private generateCaregiverSupportIntervention(
    context: HolisticPatientContext
  ): TieredIntervention {
    
    const dependentNames = context.caregiverStatus.dependents
      .map(d => `${d.name} (${d.age})`)
      .join(' and ');
    
    const actions: InterventionAction[] = [
      {
        action: 'Refer to South Dakota Lifespan Respite Care Program',
        provider: 'SD Department of Social Services',
        timeline: 'Immediate',
        expectedOutcome: '4-8 hours/week respite care',
        modality: 'in-person',
        status: 'pending'
      }
    ];
    
    // Add child-specific support if applicable
    const hasChildWithSpecialNeeds = context.caregiverStatus.dependents.some(
      d => d.relationship === 'child' && d.healthStatus === 'special-needs'
    );
    
    if (hasChildWithSpecialNeeds) {
      actions.push({
        action: 'Connect with Autism Family Support Services',
        provider: 'Autism Speaks South Dakota',
        timeline: 'Week 1',
        expectedOutcome: 'In-home support 2x/week',
        modality: 'home-visit',
        status: 'pending'
      });
    }
    
    // Add elder care support if applicable
    const hasElderlyDependent = context.caregiverStatus.dependents.some(
      d => d.relationship === 'parent' && d.healthStatus === 'frail'
    );
    
    if (hasElderlyDependent) {
      actions.push({
        action: 'Arrange adult day care program',
        provider: 'Senior Services of South Dakota',
        timeline: 'Week 2',
        expectedOutcome: '3 days/week adult day care',
        modality: 'in-person',
        status: 'pending'
      });
    }
    
    // Add caregiver support group
    actions.push({
      action: 'Enroll in caregiver support group',
      provider: 'Family Caregiver Alliance',
      timeline: 'Week 1',
      expectedOutcome: 'Peer support + resources',
      modality: 'telehealth',
      status: 'pending'
    });
    
    return {
      tier: 1,
      priority: 'critical',
      category: 'caregiver-support',
      title: 'Establish Respite Care and Caregiver Support',
      description: `Connect ${context.patient.name} with respite care services for ${dependentNames} to enable attendance at medical appointments`,
      rationale: `ROOT CAUSE: ${context.patient.name} cannot attend appointments because dependents cannot be left alone. Respite care must come first.`,
      actions,
      successMetrics: [
        `${context.patient.name} has 8+ hours/week without caregiving responsibilities`,
        `${context.patient.name} can attend medical appointments`,
        'Caregiver burden score decreases to < 60'
      ],
      blockerAddressed: 'caregiver-burden',
      enablesOtherInterventions: true,
      estimatedTimeframe: 'Weeks 1-2',
      estimatedCost: 0, // Covered by Medicaid waiver programs
      burdenScore: 20 // Low burden - services come to patient or provide relief
    };
  }
  
  /**
   * TIER 1: Transportation intervention (if root cause)
   */
  private generateTransportationIntervention(
    context: HolisticPatientContext
  ): TieredIntervention {
    
    return {
      tier: 1,
      priority: 'critical',
      category: 'transportation',
      title: 'Establish Reliable Transportation',
      description: 'Connect with transportation services and maximize alternative care delivery',
      rationale: `ROOT CAUSE: ${context.patient.name} cannot access healthcare due to transportation barrier`,
      actions: [
        {
          action: 'Activate Unite Us transportation services',
          provider: 'Unite Us',
          timeline: 'Immediate',
          expectedOutcome: 'Scheduled rides to appointments',
          modality: 'in-person'
        },
        {
          action: 'Enroll in Medicaid non-emergency medical transportation',
          provider: 'SD Medicaid',
          timeline: 'Week 1',
          expectedOutcome: 'Covered transportation to medical appointments',
          modality: 'in-person'
        }
      ],
      successMetrics: [
        'Reliable transportation available for all appointments',
        'Zero missed appointments due to transportation'
      ],
      blockerAddressed: 'transportation',
      enablesOtherInterventions: true,
      estimatedTimeframe: 'Weeks 1-2',
      estimatedCost: 0,
      burdenScore: 30
    };
  }
  
  /**
   * TIER 2: Home-Based Lab Testing (Barrier-Aware)
   * ELIMINATES need for transportation by using at-home test kit
   */
  private generateHomeBasedLabTesting(
    context: HolisticPatientContext
  ): TieredIntervention {
    
    // Calculate specific dates
    const kitOrderDate = this.calculateSpecificDate(3); // 3 days from now
    const resultsDate = this.calculateSpecificDate(14); // 2 weeks from now
    
    const actions: InterventionAction[] = [
      {
        action: 'Order at-home HbA1c test kit',
        provider: 'Quest Diagnostics Home Testing',
        timeline: `${kitOrderDate} (ships within 3-5 business days)`,
        expectedOutcome: 'Mail-order kit arrives at home. Patient collects finger-stick sample, mails back in prepaid envelope. Results in 5-7 days.',
        modality: 'home-visit', // Home-based service
        status: 'pending'
      },
      {
        action: 'Schedule telehealth appointment to review A1C results',
        provider: 'Primary Care Provider',
        timeline: `${resultsDate} at 2:00 PM`,
        expectedOutcome: 'Review A1C results via video visit. Adjust pre-diabetes management plan if needed (target A1C < 5.7%). No travel required.',
        modality: 'telehealth',
        status: 'pending'
      }
    ];
    
    return {
      tier: 2,
      priority: 'high',
      category: 'care-delivery-optimization',
      title: 'Complete HbA1c Lab Test (Home-Based)',
      description: `Use at-home lab kit to eliminate transportation barrier`,
      rationale: `BARRIER-AWARE: ${context.patient.name} has transportation and childcare barriers. Home lab kit eliminates need for 94-mile round trip and childcare coordination.`,
      actions,
      successMetrics: [
        'A1C gap closed within 2 weeks',
        'Zero transportation burden',
        'Zero childcare coordination needed',
        'HbA1c < 5.7% (pre-diabetes target)'
      ],
      blockerAddressed: 'transportation',
      dependsOn: ['Tier 1: Respite care established'],
      estimatedTimeframe: 'Weeks 1-2',
      estimatedCost: 0, // Covered by Medicaid
      burdenScore: 10 // Very low burden - no travel required
    };
  }
  
  /**
   * TIER 3: Care delivery optimization
   */
  private generateCareDeliveryOptimization(
    context: HolisticPatientContext
  ): TieredIntervention {
    
    const actions: InterventionAction[] = [
      {
        action: 'Schedule consolidated care days',
        provider: 'Care Coordination Team',
        timeline: 'Ongoing',
        expectedOutcome: 'All in-person appointments on same day',
        modality: 'in-person'
      },
      {
        action: 'Convert eligible appointments to telehealth',
        provider: 'Multiple specialists',
        timeline: 'Immediate',
        expectedOutcome: '60% reduction in travel needs',
        modality: 'telehealth'
      },
      {
        action: 'Arrange home-based lab services',
        provider: 'Mobile Lab Services',
        timeline: 'Week 1',
        expectedOutcome: 'Zero trips for routine labs',
        modality: 'home-visit'
      },
      {
        action: 'Set up mail-order pharmacy',
        provider: 'Pharmacy',
        timeline: 'Week 1',
        expectedOutcome: 'Medications delivered to home',
        modality: 'home-visit'
      }
    ];
    
    // If caregiver, coordinate family appointments
    if (context.caregiverStatus.isCaregiverForOthers) {
      actions.push({
        action: 'Coordinate family care days',
        provider: 'Care Coordination Team',
        timeline: 'Ongoing',
        expectedOutcome: 'All family members seen same day/location when possible',
        modality: 'in-person'
      });
    }
    
    return {
      tier: 3,
      priority: 'high',
      category: 'care-delivery-optimization',
      title: 'Minimize Appointment Burden Through Smart Scheduling',
      description: 'Consolidate appointments and maximize telehealth to reduce time away from caregiving',
      rationale: `Even with respite care, minimize time burden on ${context.patient.name}`,
      actions,
      successMetrics: [
        'Maximum 1 in-person visit per month',
        '80% of care delivered via telehealth or home visits',
        'Family appointments consolidated when applicable'
      ],
      blockerAddressed: 'time-scarcity',
      dependsOn: ['Tier 1: Root cause addressed', 'Tier 2: Transportation'],
      estimatedTimeframe: 'Weeks 3-4',
      estimatedCost: 0,
      burdenScore: 15 // Very low burden - care comes to patient
    };
  }
  
  /**
   * TIER 3: Depression Screening (Digital + Telehealth Follow-up)
   * BARRIER-AWARE: Use digital screening to minimize burden
   */
  private generateDepressionScreening(
    context: HolisticPatientContext
  ): TieredIntervention {
    
    const screeningDate = this.calculateSpecificDate(7); // Week 1
    const followupDate = this.calculateSpecificDate(14); // Week 2
    
    const actions: InterventionAction[] = [
      {
        action: 'Complete Edinburgh Postnatal Depression Scale via patient portal',
        provider: 'Care Manager (via MyChart patient portal)',
        timeline: `${screeningDate} (self-administered, 10-15 minutes)`,
        expectedOutcome: 'Complete 10-question screening online. Score calculated automatically. No appointment needed.',
        modality: 'phone', // Digital/portal screening - closest valid modality
        status: 'pending'
      },
      {
        action: 'Telehealth follow-up if screening indicates clinical concern',
        provider: 'Behavioral Health Specialist - Zoom video visit',
        timeline: `${followupDate} at 2:00 PM (conditional)`,
        expectedOutcome: 'If Edinburgh PND score > 10, schedule telehealth counseling session. Develop mental health support plan. Referral to therapy if needed.',
        modality: 'telehealth',
        status: 'pending'
      }
    ];
    
    return {
      tier: 3,
      priority: 'critical', // 427 days overdue
      category: 'clinical-care',
      title: 'Complete Edinburgh Postnatal Depression Screening',
      description: `Digital screening via patient portal with conditional telehealth follow-up`,
      rationale: `BARRIER-AWARE: ${context.patient.name} has been postpartum for 427 days without depression screening. Digital portal eliminates transportation and childcare barriers.`,
      actions,
      successMetrics: [
        'Edinburgh PND screening completed within 1 week',
        'Mental health support plan in place if needed',
        'Zero transportation burden',
        'Zero childcare coordination needed'
      ],
      blockerAddressed: 'clinical-complexity',
      dependsOn: ['Tier 1: Respite care established'],
      estimatedTimeframe: 'Weeks 1-2',
      estimatedCost: 0,
      burdenScore: 5 // Very low burden - digital screening
    };
  }
  
  /**
   * TIER 4: Well-Child Visit (In-Person - Required)
   * BARRIER-AWARE: Schedule AFTER transportation secured, bundle with any other in-person needs
   */
  private generateWellChildVisit(
    context: HolisticPatientContext
  ): TieredIntervention {
    
    const visitDate = this.calculateSpecificDate(28); // Week 4 - after transportation secured
    
    const actions: InterventionAction[] = [
      {
        action: 'Schedule 24-month well-child visit for Sophia',
        provider: 'Pediatrician at Bennett County Health (CAH)',
        timeline: `${visitDate} at 10:00 AM`,
        expectedOutcome: 'Complete developmental screening, growth assessment, and immunizations. Required in-person visit.',
        modality: 'in-person',
        status: 'pending'
      }
    ];
    
    return {
      tier: 4,
      priority: 'high',
      category: 'clinical-care',
      title: 'Complete Well-Child Visit (In-Person)',
      description: `Schedule Sophia's 24-month well-child visit after transportation assistance is in place`,
      rationale: `BARRIER-AWARE: This is the ONLY required in-person visit. Scheduled after transportation assistance (Tier 1) is secured. Bundle with any other necessary in-person care to minimize trips.`,
      actions,
      successMetrics: [
        'Well-child visit completed',
        'Developmental screening completed',
        'Immunizations up to date',
        'Transportation coordinated via Unite Us'
      ],
      blockerAddressed: 'clinical-complexity',
      dependsOn: ['Tier 1: Transportation assistance secured'],
      estimatedTimeframe: 'Week 4',
      estimatedCost: 0,
      burdenScore: 25 // Moderate burden - requires in-person visit
    };
  }
  
  /**
   * TIER 5: Sustainability intervention
   */
  private generateSustainabilityIntervention(
    context: HolisticPatientContext
  ): TieredIntervention {
    
    const actions: InterventionAction[] = [
      {
        action: 'Enroll in care management program',
        provider: 'RHTP Care Management',
        timeline: 'Immediate',
        expectedOutcome: 'Dedicated care manager',
        modality: 'phone'
      }
    ];
    
    // Add financial assistance if needed
    if (context.financialProfile.financialStressScore > 60) {
      actions.push({
        action: 'Connect with caregiver financial assistance programs',
        provider: 'SD Medicaid Waiver Programs',
        timeline: 'Week 2',
        expectedOutcome: 'Financial support for caregiving',
        modality: 'phone'
      });
    }
    
    // Add peer support
    if (context.psychosocialProfile.socialIsolation) {
      actions.push({
        action: 'Establish peer support network',
        provider: 'Caregiver Support Group',
        timeline: 'Ongoing',
        expectedOutcome: 'Social connection + shared resources',
        modality: 'telehealth'
      });
    }
    
    return {
      tier: 5,
      priority: 'moderate',
      category: 'sustainability',
      title: 'Build Long-term Support System',
      description: 'Ensure patient has ongoing support to maintain health',
      rationale: 'Prevent future crises by building sustainable support',
      actions,
      successMetrics: [
        'Ongoing care management support',
        'Financial burden reduced by 30%',
        'Social isolation score improved'
      ],
      blockerAddressed: 'sustainability',
      dependsOn: ['Tier 1-4: Foundation established'],
      estimatedTimeframe: 'Ongoing',
      estimatedCost: 0,
      burdenScore: 5 // Minimal burden - support services
    };
  }
  
  /**
   * Generate timeline from interventions
   */
  private generateTimeline(interventions: TieredIntervention[]): Timeline {
    return {
      totalDuration: '12 weeks',
      phases: [
        {
          phase: 'Phase 1: Foundation',
          weeks: 'Weeks 1-2',
          focus: 'Address root cause',
          keyMilestones: [
            'Respite care established',
            'Transportation coordinated',
            'Support services connected'
          ]
        },
        {
          phase: 'Phase 2: Optimization',
          weeks: 'Weeks 3-4',
          focus: 'Optimize care delivery',
          keyMilestones: [
            'Telehealth appointments scheduled',
            'Home services arranged',
            'Appointments consolidated'
          ]
        },
        {
          phase: 'Phase 3: Clinical Care',
          weeks: 'Weeks 4-12',
          focus: 'Close care gaps',
          keyMilestones: [
            'All labs completed',
            'Specialist follow-ups done',
            'Care gaps closed'
          ]
        },
        {
          phase: 'Phase 4: Sustainability',
          weeks: 'Ongoing',
          focus: 'Maintain improvements',
          keyMilestones: [
            'Care management active',
            'Support system established',
            'Health maintained'
          ]
        }
      ]
    };
  }
  
  /**
   * Calculate specific date from days offset
   * Returns formatted date string like "Thursday, March 17, 2026"
   */
  private calculateSpecificDate(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    return date.toLocaleDateString('en-US', options);
  }
  
  /**
   * Calculate estimated cost savings
   */
  private calculateCostSavings(
    context: HolisticPatientContext,
    interventions: TieredIntervention[]
  ): number {
    let savings = 0;
    
    // Telehealth vs in-person savings
    const telehealthActions = interventions
      .flatMap(i => i.actions)
      .filter(a => a.modality === 'telehealth').length;
    savings += telehealthActions * 40; // $40 saved per telehealth visit (no travel)
    
    // Home visit consolidation
    const homeVisitActions = interventions
      .flatMap(i => i.actions)
      .filter(a => a.modality === 'home-visit').length;
    savings += homeVisitActions * 60; // $60 saved per home visit
    
    // Prevented ER visits (better management)
    if (context.clinicalProfile.riskLevel === 'high') {
      savings += 1500; // Prevent 1 ER visit
    }
    
    return savings;
  }
  
  /**
   * Calculate burden reduction percentage
   */
  private calculateBurdenReduction(
    context: HolisticPatientContext,
    interventions: TieredIntervention[]
  ): number {
    // Calculate average burden score of interventions
    const avgBurdenScore = interventions.reduce((sum, i) => sum + i.burdenScore, 0) / interventions.length;
    
    // Lower burden score = higher reduction
    // Burden score of 50 = 50% reduction, 25 = 75% reduction, etc.
    return Math.round(100 - avgBurdenScore);
  }
}

// Export singleton instance
export const tieredInterventionGenerator = new TieredInterventionGenerator();

// Made with Bob
