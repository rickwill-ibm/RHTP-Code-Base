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
      interventions.push(this.generateCaregiverFriendlyTransportation(context));
    }
    
    // TIER 3: Care delivery optimization
    interventions.push(this.generateCareDeliveryOptimization(context));
    
    // TIER 4: Clinical care
    interventions.push(this.generateClinicalCareIntervention(context));
    
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
   * TIER 2: Caregiver-friendly transportation
   */
  private generateCaregiverFriendlyTransportation(
    context: HolisticPatientContext
  ): TieredIntervention {
    
    // Get distance to nearest LabCorp (rural context)
    const distanceToLabCorp = context.accessProfile.distanceToNearestFacility || 45; // miles
    const travelTime = Math.round(distanceToLabCorp / 45 * 60); // minutes at 45mph
    const labLocation = context.accessProfile.nearestLabLocation || 'Rapid City';
    
    // Calculate specific dates
    const labDate = this.calculateSpecificDate(14); // 2 weeks from now
    const pickupTime = '9:15 AM';
    const appointmentTime = '10:00 AM';
    const returnTime = '11:30 AM';
    
    const actions: InterventionAction[] = [
      {
        action: 'Activate Unite Us transportation services',
        provider: 'Unite Us - (800) 555-RIDE',
        timeline: 'Immediate (within 48 hours)',
        expectedOutcome: 'Transportation account activated, rides can be scheduled',
        modality: 'phone',
        status: 'pending'
      },
      {
        action: `Schedule LabCorp appointment for HbA1c + Comprehensive Metabolic Panel`,
        provider: `LabCorp - 1234 Medical Plaza Dr, ${labLocation}, SD 57701`,
        timeline: `${labDate} at ${appointmentTime}`,
        expectedOutcome: `A1C gap closed, diabetes control assessed. Fasting required (8 hours, water only after 2am). Results in 48 hours.`,
        modality: 'in-person',
        status: 'pending'
      },
      {
        action: `Arrange Unite Us transportation pickup and return`,
        provider: 'Unite Us + Care Coordinator',
        timeline: `${labDate}: Pickup ${pickupTime}, Return ${returnTime}`,
        expectedOutcome: `Round-trip from home to LabCorp ${labLocation} (${distanceToLabCorp} miles, ${travelTime * 2} min total). Medicaid NEMT covered.`,
        modality: 'in-person',
        status: 'pending'
      },
      {
        action: 'Confirm respite care coverage during lab visit',
        provider: 'Care Coordinator',
        timeline: `${labDate} 9:00 AM - 12:00 PM`,
        expectedOutcome: 'Sophia with Autism support worker, Elena at adult day care. Backup contact confirmed.',
        modality: 'in-person',
        status: 'pending'
      }
    ];
    
    return {
      tier: 2,
      priority: 'high',
      category: 'transportation',
      title: 'Coordinate Transportation for Clinical Care',
      description: `Arrange transportation to LabCorp (${distanceToLabCorp} miles) during respite care windows`,
      rationale: `Rural distance (${distanceToLabCorp} miles) requires careful coordination with respite care schedule. Batch appointments to minimize trips.`,
      actions,
      successMetrics: [
        'Transportation scheduled for lab appointment',
        'Respite care active during travel time',
        'All in-person care batched on same day',
        'Zero missed appointments due to transportation'
      ],
      blockerAddressed: 'transportation',
      dependsOn: ['Tier 1: Respite care established'],
      estimatedTimeframe: 'Weeks 2-3',
      estimatedCost: 0,
      burdenScore: 35 // Higher burden due to rural distance
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
   * TIER 4: Clinical care intervention
   */
  private generateClinicalCareIntervention(
    context: HolisticPatientContext
  ): TieredIntervention {
    
    const actions: InterventionAction[] = [];
    const labLocation = context.accessProfile.nearestLabLocation || 'Rapid City';
    
    // Calculate specific dates for each action
    const labDate = this.calculateSpecificDate(21); // Week 3
    const pndDate = this.calculateSpecificDate(28); // Week 4
    const pcpFollowupDate = this.calculateSpecificDate(35); // Week 5
    const cardioDate = this.calculateSpecificDate(35); // Week 5
    const eyeExamDate = this.calculateSpecificDate(42); // Week 6
    
    // PRIMARY FOCUS: Address A1C gap (most critical for diabetes management)
    const hasA1CGap = context.clinicalProfile.openCareGaps.some(g => g.type === 'HEDIS_CDC');
    if (hasA1CGap) {
      actions.push({
        action: `Complete HbA1c + Comprehensive Metabolic Panel at LabCorp`,
        provider: `LabCorp - 1234 Medical Plaza Dr, ${labLocation}, SD 57701`,
        timeline: `${labDate} at 10:00 AM`,
        expectedOutcome: 'A1C gap closed, diabetes control assessed. Fasting required (8 hours). Results available in 48 hours for PCP review.',
        modality: 'in-person',
        status: 'pending'
      });
      
      actions.push({
        action: 'Schedule telehealth follow-up to review A1C results',
        provider: 'Dr. James Whitfield, Primary Care - MyChart video visit',
        timeline: `${pcpFollowupDate} at 2:00 PM`,
        expectedOutcome: 'Review A1C results, adjust diabetes medications if needed (target A1C < 8.0%). Discuss diet and exercise plan.',
        modality: 'telehealth',
        status: 'pending'
      });
    }
    
    // Address other care gaps with rural-appropriate modalities
    context.clinicalProfile.openCareGaps.forEach(gap => {
      if (gap.type === 'HEDIS_CBP') {
        actions.push({
          action: 'Schedule telehealth cardiology consultation for hypertension',
          provider: 'Dr. Michael Chen, Cardiology - MyChart video visit',
          timeline: `${cardioDate} at 3:00 PM`,
          expectedOutcome: 'BP medication review and adjustment. Bring 7-day BP log (3x daily readings). Target BP < 130/80.',
          modality: 'telehealth',
          status: 'pending'
        });
      } else if (gap.type === 'HEDIS_EED') {
        actions.push({
          action: 'Schedule diabetic eye exam (batch with quarterly labs)',
          provider: `Dr. Lisa Park, Ophthalmology - Same building as LabCorp ${labLocation}`,
          timeline: `${eyeExamDate} at 11:00 AM`,
          expectedOutcome: 'Dilated eye exam for diabetic retinopathy screening. Bring sunglasses. Same transportation as lab visit.',
          modality: 'in-person',
          status: 'pending'
        });
      } else if (gap.type === 'Depression_Screening') {
        actions.push({
          action: 'Schedule telehealth Edinburgh Postnatal Depression screening',
          provider: 'Dr. Sarah Johnson, Behavioral Health - Zoom video visit',
          timeline: `${pndDate} at 2:00 PM`,
          expectedOutcome: 'Complete Edinburgh PND Scale (10 questions, 30 min). Support plan if score > 10. Referral to therapy if needed.',
          modality: 'telehealth',
          status: 'pending'
        });
      }
    });
    
    // Add diabetes self-management education
    if (context.clinicalProfile.chronicConditions.some(c => c.name.includes('Diabetes'))) {
      actions.push({
        action: 'Enroll in virtual Diabetes Self-Management Education (DSME) program',
        provider: 'Sarah Martinez, Certified Diabetes Educator - Weekly Zoom sessions',
        timeline: `Starting ${pcpFollowupDate}, 8-week program`,
        expectedOutcome: 'Complete 8-week DSME course. Topics: nutrition, medication, monitoring, foot care. Certificate upon completion.',
        modality: 'telehealth',
        status: 'pending'
      });
    }
    
    return {
      tier: 4,
      priority: 'high', // Changed from moderate - clinical gaps are critical
      category: 'clinical-care',
      title: 'Close Clinical Care Gaps (A1C, Depression, Eye Exam)',
      description: `Address primary A1C gap and other clinical needs using rural-appropriate care delivery`,
      rationale: `With respite care (Tier 1) and transportation (Tier 2) in place, ${context.patient.name} can now complete essential clinical care. Prioritize A1C testing to assess diabetes control.`,
      actions,
      successMetrics: [
        'A1C gap closed within 3 weeks',
        'All HEDIS care gaps closed within 90 days',
        'HbA1c < 8.0% (target)',
        'BP < 130/80',
        'Depression screening completed',
        'Diabetic eye exam completed'
      ],
      blockerAddressed: 'clinical-complexity',
      dependsOn: ['Tier 1-3: Barriers addressed'],
      estimatedTimeframe: 'Weeks 4-12',
      estimatedCost: 0,
      burdenScore: 10 // Very low - care adapted to patient's needs
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
