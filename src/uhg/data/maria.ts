<<<<<<< HEAD
export const maria = {
  id: 'MARIA_SD_001',
  name: 'Maria Redhawk',
  age: 34,
  memberSince: 2019,
  memberId: 'UHG-2019-447821',
  dateOfBirth: '1991-11-14',
  riskScore: 2.18,
  riskTier: 'MODERATE' as const,
  
  // Family Members
  family: {
    mother: {
      name: 'Elena Redhawk',
      age: 66,
      relationship: 'Mother',
      insurance: 'Medicare',
      livingSituation: 'Lives alone, 15 miles from Maria',
      caregivingHours: 18, // hours per week Maria provides care
    },
    daughter: {
      name: 'Sophia Redhawk',
      age: 2, // 24 months
      relationship: 'Daughter',
      livingSituation: 'Lives with Maria',
    }
  },
  
  // Current Medications
  medications: [
    { name: 'Metformin', condition: 'Pre-diabetes', status: 'active' },
    { name: 'Lisinopril', condition: 'Hypertension', status: 'active' },
  ],
  
  // Primary Conditions
  conditions: [
    { code: 'R73.03', description: 'Pre-diabetes', status: 'active' },
    { code: 'I10', description: 'Hypertension', status: 'active' },
  ],
  
  episodes: [
    { id: 'EP-PREDIABETES-001', type: 'Pre-diabetes', since: '2024-06', status: 'active' },
    { id: 'EP-HYPERTENSION-001', type: 'Hypertension', since: '2024-03', status: 'active' },
  ],
  
  // Primary Blockers
  barriers: {
    transportation: {
      type: 'Geographic',
      description: '47 miles to Winner Regional Healthcare',
      severity: 'High',
      daysOpen: 38,
    },
    caregiverBurden: {
      type: 'Caregiver Burden',
      zaritScore: 48, // moderate-high
      description: 'Caring for elderly mother (18hrs/week) + toddler',
      severity: 'High',
      respiteCare: {
        status: 'In Progress',
        provider: 'SD Lifespan Respite Care',
        hoursPerWeek: 8,
        startDate: '2026-03-14',
      }
    }
  },
  
  // Care Gaps (9 Total)
  careGaps: {
    clinical: [
      {
        id: 'CAREGAP_HBA1C',
        type: 'HbA1c Testing',
        daysOpen: 38,
        status: 'open',
        lastMeasured: '2025-04-19',
        targetDate: '2026-06-03',
        priority: 'High',
      },
      {
        id: 'CAREGAP_BP',
        type: 'Blood Pressure Control',
        daysOpen: 45,
        status: 'open',
        priority: 'High',
      },
      {
        id: 'CAREGAP_CMP',
        type: 'Comprehensive Metabolic Panel',
        daysOpen: 38,
        status: 'open',
        priority: 'Moderate',
      }
    ],
    behavioralHealth: [
      {
        id: 'CAREGAP_EPDS',
        type: 'Edinburgh PND Screening',
        daysOpen: 427,
        status: 'open',
        priority: 'Critical',
        note: 'Can be completed via app screening survey',
      },
      {
        id: 'CAREGAP_DEPRESSION',
        type: 'Depression Follow-up',
        daysOpen: 60,
        status: 'open',
        priority: 'High',
        conditional: 'If EPDS > 10',
      }
    ],
    social: [
      {
        id: 'CAREGAP_TRANSPORT',
        type: 'Transportation Barrier',
        daysOpen: 38,
        status: 'open',
        priority: 'High',
      },
      {
        id: 'CAREGAP_CHILDCARE',
        type: 'Childcare Subsidy',
        daysOpen: 60,
        status: 'in_progress',
        priority: 'High',
        applicationDate: '2026-03-05',
      },
      {
        id: 'CAREGAP_WIC',
        type: 'WIC Re-enrollment',
        daysOpen: 45,
        status: 'open',
        priority: 'Moderate',
      },
      {
        id: 'CAREGAP_LIHEAP',
        type: 'LIHEAP Application',
        daysOpen: 30,
        status: 'open',
        priority: 'Moderate',
        deadline: '2026-03-31',
      }
    ]
  },
  
  authorization: {
    id: 'CAREGAP_HBA1C',
    status: 'EXPIRING',
    daysUntilExpiry: -4,
    procedure: 'HbA1c',
    procedureName: 'HbA1c lab',
    contested: true,
    authExpiryCountdown: 'T-4 days',
  },
  
  // Legacy single careGap for backward compatibility
  careGap: {
    id: 'CAREGAP_001',
    type: 'HbA1c',
    daysOpen: 38,
    status: 'open',
    lastMeasured: '2025-04-19',
    targetDate: '2026-06-03',
  },
  // Financial Metrics
  financialMetrics: {
    rafScore: 2.18,
    pmpmCost: 1240,
    pmpmTarget: 780,
    pmpmVariance: 460,
  },
  
  consent: {
    status: 'FULL',
    date: '2024-03-15',
    channels: ['PORTAL', 'EMAIL', 'PHONE'],
  },
  engagementScore: 8.2,
  portalFrequency: '2x/week',
  preferredChannel: 'PORTAL',
  address: {
    claims: '4821 Rural Route Dr, Martin SD 85034',
    careManagement: '4821 Rural Route Dr, Martin, SD 85034',
    crm: '482 Rural Route Drive, Martin SD 85034',
    clinical: '4821 Rural Route Dr, Martin SD 85034',
  },
  riskScoreBySystem: {
    claims: 2.18,
    careManagement: 2.0,
    crm: 2.18,
    clinical: 2.3,
  },
  consentBySystem: {
    claims: 'FULL',
    careManagement: 'PARTIAL',
    crm: 'FULL',
    clinical: 'UNKNOWN',
  },
};

// Tiered Care Plan for Maria Redhawk
export const mariaCarePlan = {
  patientId: 'MARIA_SD_001',
  generatedDate: '2026-03-08',
  lastUpdated: '2026-03-08',
  
  tiers: [
    {
      tier: 1,
      name: 'Establish Respite Care',
      priority: 'CRITICAL',
      status: 'IN_PROGRESS',
      goal: 'Enable Maria to attend medical appointments',
      progress: 67, // 2/3 actions completed
      actions: [
        {
          id: 'T1-A1',
          description: 'Complete SD Lifespan Respite Care application',
          status: 'Completed',
          completedDate: '2026-03-08',
          details: {
            services: '8 hrs/week in-home respite for Elena',
            startDate: '2026-03-14',
          }
        },
        {
          id: 'T1-A2',
          description: 'Schedule childcare for Sophia (24mo)',
          status: 'In Progress',
          details: {
            provider: 'Little Learners Daycare, Pine Ridge',
            waitlistPosition: 3,
            expectedDate: '2026-03-21',
            hours: 'Mon-Fri 8am-3pm',
            cost: '$0 (Childcare Subsidy pending)',
          }
        },
        {
          id: 'T1-A3',
          description: 'Activate Childcare Subsidy enrollment',
          status: 'Pending',
          details: {
            applicationDate: '2026-03-05',
            expectedApproval: '2-3 weeks',
            coverage: 'Up to $600/month daycare costs',
          }
        }
      ]
    },
    {
      tier: 2,
      name: 'Coordinate Transportation',
      priority: 'HIGH',
      status: 'PENDING',
      goal: 'Close HbA1c gap with coordinated logistics',
      progress: 0,
      actions: [
        {
          id: 'T2-A1',
          description: 'Activate Unite Us transportation services',
          status: 'Pending',
          details: {
            provider: 'Unite Us NEMT (Medicaid)',
            coverage: '47 miles to Winner Regional',
            booking: 'Call (605) 555-RIDE 48hrs advance',
            cost: '$0 (Medicaid NEMT benefit)',
          }
        },
        {
          id: 'T2-A2',
          description: 'Schedule LabCorp appointment for HbA1c + CMP',
          status: 'Pending',
          details: {
            facility: 'LabCorp - Winner Regional Healthcare',
            address: '745 E 8th St, Winner, SD (47 miles)',
            proposedDate: '2026-03-17',
            proposedTime: '10:00 AM',
            tests: ['HbA1c', 'Comprehensive Metabolic Panel'],
            fasting: '8 hours (water only after 2am)',
          }
        },
        {
          id: 'T2-A3',
          description: 'Arrange Unite Us transportation for lab visit',
          status: 'Pending',
          details: {
            pickup: '8:30am from home',
            destination: 'Winner Regional (47 miles)',
            return: '11:30am',
            totalTime: '3 hours',
          }
        },
        {
          id: 'T2-A4',
          description: 'Confirm respite care coverage during lab visit',
          status: 'Pending',
          details: {
            elena: 'In-home respite worker 8am-12pm',
            sophia: 'Daycare 8am-3pm (if enrolled)',
            backup: 'Neighbor contact if needed',
          }
        }
      ]
    },
    {
      tier: 3,
      name: 'Address Social Determinants',
      priority: 'MODERATE',
      status: 'PENDING',
      goal: 'Stabilize housing and nutrition security',
      progress: 0,
      actions: [
        {
          id: 'T3-A1',
          description: 'Complete WIC re-enrollment application',
          status: 'Pending',
          details: {
            provider: 'SD WIC Program - (605) 555-9424',
            lapsedDays: 45,
            benefits: '$50/month nutrition assistance',
            documents: ['Medicaid card', 'proof of address'],
          }
        },
        {
          id: 'T3-A2',
          description: 'Submit LIHEAP application for heating assistance',
          status: 'Pending',
          details: {
            provider: 'SD Dept of Social Services',
            benefit: 'Up to $400 heating assistance',
            deadline: '2026-03-31',
            application: 'Online or phone (605) 555-3377',
          }
        },
        {
          id: 'T3-A3',
          description: 'Update housing waitlist position',
          status: 'Pending',
          details: {
            currentPosition: 47,
            action: 'Confirm contact info is current',
            expected: '6-8 months for housing',
          }
        }
      ]
    },
    {
      tier: 4,
      name: 'Close Clinical & Behavioral Health Gaps',
      priority: 'HIGH',
      status: 'PENDING',
      goal: 'Address HbA1c, depression, hypertension',
      progress: 0,
      actions: [
        {
          id: 'T4-A1',
          description: 'Complete HbA1c + CMP at LabCorp',
          status: 'Pending',
          details: {
            scheduled: '2026-03-17 at 10:00 AM',
            location: 'Winner Regional Healthcare (47 miles)',
            fasting: 'Required (8 hours)',
            transportation: 'Unite Us NEMT arranged',
            results: 'Available in 48 hours',
          }
        },
        {
          id: 'T4-A2',
          description: 'Complete Edinburgh PND screening',
          status: 'Pending',
          details: {
            provider: 'Dr. Sarah Johnson, Behavioral Health',
            proposedDate: '2026-03-15',
            proposedTime: '2:00 PM',
            duration: '30 minutes',
            platform: 'Zoom (link sent 24hrs prior)',
            gapStatus: 'CRITICAL - open 427 days',
            note: 'Can be done via app screening survey',
          }
        },
        {
          id: 'T4-A3',
          description: 'Schedule PCP telehealth for lab results review',
          status: 'Pending',
          details: {
            provider: 'Dr. James Whitfield, Bennett County',
            proposedDate: '2026-03-21',
            proposedTime: '2:00 PM',
            platform: 'MyChart video visit',
            purpose: 'Review HbA1c, adjust Metformin dose',
          }
        },
        {
          id: 'T4-A4',
          description: 'Schedule telehealth BP management follow-up',
          status: 'Pending',
          details: {
            provider: 'Dr. James Whitfield, Bennett County',
            proposedDate: '2026-03-28',
            proposedTime: '2:00 PM',
            preparation: 'BP log 3x daily for 7 days',
            medications: 'Review Lisinopril effectiveness',
          }
        },
        {
          id: 'T4-A5',
          description: 'Schedule depression follow-up (if EPDS > 10)',
          status: 'Pending',
          conditional: true,
          details: {
            provider: 'Dr. Sarah Johnson, Behavioral Health',
            timing: '2 weeks after Edinburgh screening',
            modality: 'Telehealth preferred',
            purpose: 'Treatment plan if depression confirmed',
          }
        }
      ]
    }
  ],
  
  successMetrics: {
    blockerResolution: [
      { metric: 'Transportation: Unite Us NEMT activated and used successfully', achieved: false },
      { metric: 'Caregiver Burden: Zarit score reduced from 48 to < 40', achieved: false },
      { metric: 'Respite Care: 8+ hours/week established for Elena', achieved: true },
      { metric: 'Childcare: Sophia enrolled in daycare with subsidy', achieved: false },
    ],
    careGapClosure: [
      { metric: 'HbA1c gap closed (test completed, results reviewed)', achieved: false },
      { metric: 'Edinburgh PND gap closed (427 days → screened)', achieved: false },
      { metric: 'BP control gap closed (telehealth management established)', achieved: false },
      { metric: 'Social gaps addressed (WIC, LIHEAP, childcare subsidy)', achieved: false },
    ],
    patientExperience: [
      { metric: 'Only 1 in-person visit required (LabCorp)', achieved: false },
      { metric: 'All other appointments via telehealth', achieved: false },
      { metric: 'Transportation coordinated with respite care', achieved: false },
      { metric: 'No appointment conflicts with caregiving duties', achieved: false },
    ]
  }
};

export const drChen = {
  id: 'PROVIDER_001',
  name: 'Bennett County Health',
  specialty: 'Cardiologist',
  npi: '1234567890',
  networkStatus: 'IN_NETWORK' as const,
  eligibilityStatus: 'EXPIRING' as const,
  eligibilityDaysRemaining: 21,
  riskAlignment: 8.1,
  activeEpisodes: 12,
  facility: 'Bennett County Health',
  phone: '(602) 555-0147',
};

export const population = {
  members: 124847,
  providers: 8293,
  activeEpisodes: 47291,
  openAuths: 23104,
  openCareGaps: 18472,
=======
export const maria = {
  id: 'MARIA_SD_001',
  name: 'Maria Redhawk',
  age: 58,
  memberSince: 2019,
  memberId: 'UHG-2019-447821',
  dateOfBirth: '1967-11-14',
  riskScore: 7.8,
  riskTier: 'HIGH' as const,
  episodes: [
    { id: 'EP-CARDIAC-001', type: 'Postpartum', since: '2023-01', status: 'active' },
    { id: 'EP-DIABETES-001', type: 'Diabetes', since: '2021-06', status: 'active' },
  ],
  authorization: {
    id: 'CAREGAP_HBA1C',
    status: 'EXPIRING',
    daysUntilExpiry: -4,
    procedure: 'HbA1c',
    procedureName: 'HbA1c lab',
    contested: true,
    authExpiryCountdown: 'T-4 days',
  },
  careGap: {
    id: 'CAREGAP_001',
    type: 'HbA1c',
    daysOpen: 45,
    status: 'open',
    lastMeasured: '2025-04-19',
    targetDate: '2026-06-03',
  },
  consent: {
    status: 'FULL',
    date: '2024-03-15',
    channels: ['PORTAL', 'EMAIL', 'PHONE'],
  },
  engagementScore: 8.2,
  portalFrequency: '2x/week',
  preferredChannel: 'PORTAL',
  address: {
    claims: '4821 Rural Route Dr, Martin SD 85034',
    careManagement: '4821 Rural Route Dr, Martin, SD 85034',
    crm: '482 Rural Route Drive, Martin SD 85034',
    clinical: '4821 Rural Route Dr, Martin SD 85034',
  },
  riskScoreBySystem: {
    claims: 7.8,
    careManagement: 6.2,
    crm: 7.8,
    clinical: 8.1,
  },
  consentBySystem: {
    claims: 'FULL',
    careManagement: 'PARTIAL',
    crm: 'FULL',
    clinical: 'UNKNOWN',
  },
};

export const drChen = {
  id: 'PROVIDER_001',
  name: 'Bennett County Health',
  specialty: 'Cardiologist',
  npi: '1234567890',
  networkStatus: 'IN_NETWORK' as const,
  eligibilityStatus: 'EXPIRING' as const,
  eligibilityDaysRemaining: 21,
  riskAlignment: 8.1,
  activeEpisodes: 12,
  facility: 'Bennett County Health',
  phone: '(602) 555-0147',
};

export const population = {
  members: 124847,
  providers: 8293,
  activeEpisodes: 47291,
  openAuths: 23104,
  openCareGaps: 18472,
>>>>>>> c235a9e90cfeccbdc390c6f3155370c2f75da71e
};