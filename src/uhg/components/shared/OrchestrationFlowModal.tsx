'use client';

import React, { useState, useEffect, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SystemNode {
  id: string;
  label: string;
  sublabel?: string;
  side: 'fetch' | 'push';
  payloadKey: string;
}

interface AgentNode {
  id: string;
  label: string;
  sublabel: string;
  color: string;
  completionTime: string;
  completionMin: number;
  fetchSystems: SystemNode[];
  pushSystems: SystemNode[];
  intercepted?: boolean;
  interceptLabel?: string;
  tier?: string;
  rationale?: string;
  outcome?: string;
  confidence?: number;
}

interface GovernanceAgent {
  id: string;
  label: string;
  color: string;
  interceptAt?: number[];
  interceptLabel?: string;
  payloadKey: string;
  tier?: string;
  rationale?: string;
  outcome?: string;
  confidence?: number;
}

// ─── JSON Payloads ────────────────────────────────────────────────────────────

const JSON_PAYLOADS: Record<string, object> = {
  signal_classification: {
    engineId: 'SIGNAL_CLASSIFICATION_ENGINE',
    action: 'CLASSIFICATION_COMPLETE',
    timestamp: '2024-11-15T14:22:57Z',
    memberId: 'MARIA_SD_001',
    signals: [
      { type: 'AUTH_EXPIRY', severity: 'HIGH', source: 'Claims System', detail: 'CAREGAP_HBA1C expiring T-4 days · HbA1c lab order · Bennett County Health · Banner University' },
      { type: 'CARE_GAP', severity: 'HIGH', source: 'EHR/Quality Engine', detail: 'HbA1c gap open 45 days · last value 9.2% · Q4 SD Medicaid quality window closes Dec 31' },
      { type: 'BEHAVIORAL', severity: 'MEDIUM', source: 'Engagement Platform', detail: 'Portal logins 3x this week · receptivity 87% · caregiver stress elevated' },
    ],
    concurrentWindow: '30s',
    complexityScore: 'HIGH',
    contextFlags: ['CAREGIVER_RELATIONSHIP', 'DEPENDENT_RELATIONSHIP', 'Q4_SD Medicaid quality_WINDOW', 'CARDIAC_EPISODE_DAY34'],
    routingTarget: 'SUPER_ORCHESTRATION_CONTROLLER',
  },
  marketplace_query: {
    queryId: 'REGISTRY_QUERY_MARIA_SD_001_001',
    controllerAction: 'AGENT_MARKETPLACE_QUERY',
    timestamp: '2024-11-15T14:23:02Z',
    queryContext: {
      signalTypes: ['AUTH_EXPIRY', 'CARE_GAP', 'BEHAVIORAL'],
      memberContext: 'HIGH_RISK_CARDIAC_DAY34',
      relationshipContext: ['CAREGIVER', 'DEPENDENT'],
      operationalContext: ['Q4_SD Medicaid quality_WINDOW', 'TCOC_CEILING', 'AUTH_WINDOW'],
    },
    registryScanned: 31,
    matchedAgents: 8,
    unmatchedAgents: 23,
    coalitionAssembled: true,
    governanceOverlay: 'MANDATORY',
    matchedAgentRoster: [
      {
        rank: 1,
        agentId: 'CARE_AGENT_H1AB',
        agentName: 'Clinical Care Agent · H1AB Authorization',
        tier: 'FOUNDATION',
        matchScore: 0.97,
        confidenceScore: 0.94,
        matchReasons: ['AUTH_EXPIRY signal active', 'CARDIAC_EPISODE_DAY34 context', 'Q4_SD Medicaid quality_WINDOW operational flag'],
        assignedRole: 'PRIMARY_CARE_COORDINATOR',
      },
      {
        rank: 2,
        agentId: 'UTILIZATION_AGENT',
        agentName: 'Eligibility Management Agent',
        tier: 'FOUNDATION',
        matchScore: 0.95,
        confidenceScore: 0.91,
        matchReasons: ['AUTH_WINDOW context match', 'TCOC_CEILING exposure flag', 'Postpartum episode utilization pattern'],
        assignedRole: 'UTILIZATION_REVIEWER',
      },
      {
        rank: 3,
        agentId: 'FINANCIAL_INTELLIGENCE_AGENT',
        agentName: 'Financial Intelligence Agent',
        tier: 'FOUNDATION',
        matchScore: 0.93,
        confidenceScore: 0.89,
        matchReasons: ['TCOC_CEILING operational context', 'Q4_SD Medicaid quality_WINDOW financial exposure', 'HIGH_RISK member tier'],
        assignedRole: 'FINANCIAL_MODELER',
      },
      {
        rank: 4,
        agentId: 'SIGNAL_DISPOSITION_AGENT',
        agentName: 'Signal Disposition Agent',
        tier: 'FOUNDATION',
        matchScore: 0.91,
        confidenceScore: 0.88,
        matchReasons: ['Multi-signal triage required', 'AUTH_EXPIRY + CARE_GAP + BEHAVIORAL co-occurrence', 'Priority scoring active'],
        assignedRole: 'SIGNAL_TRIAGER',
      },
      {
        rank: 5,
        agentId: 'CAREGIVER_INTELLIGENCE_AGENT',
        agentName: 'Caregiver Intelligence Agent',
        tier: 'OPERATIONAL',
        matchScore: 0.88,
        confidenceScore: 0.85,
        matchReasons: ['CAREGIVER relationship context', 'Elena Redhawk proxy thread active', 'DEPENDENT relationship flag'],
        assignedRole: 'CAREGIVER_COORDINATOR',
      },
      {
        rank: 6,
        agentId: 'PROVIDER_ENABLEMENT_AGENT',
        agentName: 'Social / SDOH Agent',
        tier: 'OPERATIONAL',
        matchScore: 0.84,
        confidenceScore: 0.82,
        matchReasons: ['Eligibility gap detected', 'AUTH_EXPIRY requires provider validation', 'Network adequacy check needed'],
        assignedRole: 'PROVIDER_VALIDATOR',
      },
      {
        rank: 7,
        agentId: 'APPEALS_AGENT',
        agentName: 'Appeals & Grievance Agent',
        tier: 'OPERATIONAL',
        matchScore: 0.81,
        confidenceScore: 0.79,
        matchReasons: ['AUTH_EXPIRY creates appeal risk', 'CARDIAC_EPISODE_DAY34 clinical urgency', 'Q4_SD Medicaid quality_WINDOW deadline pressure'],
        assignedRole: 'APPEALS_HANDLER',
      },
      {
        rank: 8,
        agentId: 'Med review_AGENT',
        agentName: 'Medication Therapy Management Agent',
        tier: 'OPERATIONAL',
        matchScore: 0.78,
        confidenceScore: 0.76,
        matchReasons: ['BEHAVIORAL signal includes medication adherence', 'Postpartum medication reconciliation required', 'Duplicate therapy risk flag'],
        assignedRole: 'Med review_REVIEWER',
      },
    ],
    unmatchedAgentSample: [
      {
        agentId: 'DENTAL_BENEFITS_AGENT',
        agentName: 'Dental Benefits Agent',
        tier: 'OPERATIONAL',
        matchScore: 0.12,
        exclusionReason: 'No dental signal present; member context is cardiac/behavioral only',
      },
      {
        agentId: 'VISION_CARE_AGENT',
        agentName: 'Vision Clinical Care Agent',
        tier: 'OPERATIONAL',
        matchScore: 0.09,
        exclusionReason: 'Vision signal absent; no ophthalmology context in episode',
      },
      {
        agentId: 'MATERNITY_AGENT',
        agentName: 'Maternity & NICU Agent',
        tier: 'OPERATIONAL',
        matchScore: 0.04,
        exclusionReason: 'Member demographic mismatch; maternity context not applicable',
      },
      {
        agentId: 'BEHAVIORAL_CRISIS_AGENT',
        agentName: 'Behavioral Crisis Intervention Agent',
        tier: 'OPERATIONAL',
        matchScore: 0.31,
        exclusionReason: 'BEHAVIORAL signal present but below crisis threshold; standard care agent sufficient',
      },
      {
        agentId: 'TRANSPLANT_COORDINATION_AGENT',
        agentName: 'Transplant Coordination Agent',
        tier: 'SPECIALTY',
        matchScore: 0.07,
        exclusionReason: 'No transplant episode or organ waitlist context detected',
      },
      {
        agentId: 'PEDIATRIC_CARE_AGENT',
        agentName: 'Pediatric Clinical Care Agent',
        tier: 'OPERATIONAL',
        matchScore: 0.06,
        exclusionReason: 'Member age 67; adult care pathway applies',
      },
      {
        agentId: 'ONCOLOGY_AGENT',
        agentName: 'Oncology Navigation Agent',
        tier: 'SPECIALTY',
        matchScore: 0.14,
        exclusionReason: 'No active oncology diagnosis in member record; cardiac episode primary',
      },
      {
        agentId: 'WORKER_COMP_AGENT',
        agentName: "Worker's Compensation Agent",
        tier: 'OPERATIONAL',
        matchScore: 0.02,
        exclusionReason: 'No occupational injury claim; commercial health plan context only',
      },
      {
        agentId: 'SNOMED_CODING_AGENT',
        agentName: 'Clinical Coding Accuracy Agent',
        tier: 'QUALITY',
        matchScore: 0.22,
        exclusionReason: 'Coding review not triggered; AUTH_EXPIRY does not require recoding at this stage',
      },
      {
        agentId: 'FRAUD_WASTE_ABUSE_AGENT',
        agentName: 'Fraud, Waste & Abuse Detection Agent',
        tier: 'GOVERNANCE',
        matchScore: 0.18,
        exclusionReason: 'No anomaly pattern detected; claim history within expected variance for cardiac episode',
      },
    ],
    unmatchedAgentCount: 23,
    unmatchedSampleNote: 'Showing 10 of 23 unmatched agents. Remaining 13 excluded due to specialty mismatch, inactive contract status, or member demographic filters.',
  },
  graph_intel_push: {
    agentId: 'GRAPH_INTELLIGENCE',
    action: 'CONTEXT_ASSEMBLED',
    timestamp: '2024-11-15T14:23:00Z',
    memberId: 'MARIA_SD_001',
    graphNodes: 14,
    graphEdges: 17,
    identityConfidence: 0.97,
    resolvedRelationships: ['PARENT_OF → Sophia', 'CAREGIVER_FOR → Elena'],
    contextPackage: 'ORCHESTRATION_CONTEXT_001',
    auditId: 'AUDIT_20241115_142300_GRAPH_001',
  },
  identity_push: {
    agentId: 'IDENTITY_RESOLUTION',
    action: 'GOLDEN_RECORD_COMMITTED',
    timestamp: '2024-11-15T14:23:08Z',
    memberId: 'MARIA_SD_001',
    sourcesReconciled: 4,
    conflictsResolved: 3,
    goldenRecordId: 'GR_MARIA_SD_001',
    confidence: 0.97,
    authoritativeSource: 'CLAIMS',
    auditId: 'AUDIT_20241115_142308_IDENTITY_001',
  },
  consent_push: {
    agentId: 'CONSENT_AGENT',
    action: 'CONSENT_GATE_OPENED',
    timestamp: '2024-11-15T14:23:15Z',
    memberId: 'MARIA_SD_001',
    consentScope: 'FULL',
    proxyConsentFor: 'Elena Redhawk',
    proxyScope: ['MEDICATION_MGMT', 'APPT_COORDINATION'],
    consentGateStatus: 'OPEN',
    boundaryEnforced: true,
    auditId: 'AUDIT_20241115_142315_CONSENT_001',
  },
  person_state_push: {
    agentId: 'PERSON_STATE_INTELLIGENCE',
    action: 'STATE_PROFILE_ASSEMBLED',
    timestamp: '2024-11-15T14:23:18Z',
    memberId: 'MARIA_SD_001',
    behavioralState: 'ENGAGED',
    portalEngagement: '3 logins this week',
    receptivityScore: 0.87,
    communicationFatigue: 'LOW',
    lifeEventSignals: ['CAREGIVER_STRESS_ELEVATED', 'DEPENDENT_CARE_GAP'],
    recommendedChannel: 'PORTAL',
    recommendedTiming: '10am — peak engagement window',
    auditId: 'AUDIT_20241115_142318_PERSON_001',
  },
  care_push: {
    agentId: 'CARE_MANAGEMENT',
    action: 'AUTH_EVIDENCE_SUBMITTED',
    timestamp: '2024-11-15T14:31:08Z',
    memberId: 'MARIA_SD_001',
    authorizationId: 'CAREGAP_HBA1C',
    procedureCode: 'HbA1c',
    procedureDescription: 'HbA1c lab — transthoracic',
    expiryDaysRemaining: 4,
    clinicalEvidence: {
      diagnosisCodes: ['I25.10', 'E11.9'],
      primaryDiagnosis: 'Chronic ischemic heart disease, unspecified',
      supportingRecords: 3,
      medicalNecessityBasis: 'Active cardiac episode Day 34 — ongoing monitoring required per SD Medicaid LCD L38779',
      priorAuthHistory: 'AUTH_000 approved 2024-08-15 — same procedure, same provider',
    },
    sdohBarrierResolved: {
      barrierType: 'TRANSPORT_PROBABLE',
      resolution: 'Home lab kit dispatched 2024-11-14 — eliminates clinic transport requirement',
      evidence: '2 missed appointments in 12 months — same zip code pattern',
    },
    governanceCheck: 'PASSED',
    auditId: 'AUDIT_20241115_143108_CARE_001',
  },
  provider_push: {
    agentId: 'PROVIDER_ENABLEMENT',
    action: 'CREDENTIALING_RENEWAL_INITIATED',
    timestamp: '2024-11-15T14:45:22Z',
    providerId: 'NPI_1234567890',
    providerName: 'Bennett County Health',
    specialty: 'Cardiology',
    facility: 'Bennett County Health',
    eligibilityStatus: 'EXPIRING',
    renewalDeadlineDays: 21,
    renewalDeadlineDate: '2024-12-06',
    activeEpisodesAtRisk: 12,
    episodesProtectedByRenewal: 12,
    renewalWorkflow: 'AUTOMATED — no human intervention required',
    eligibilitySystemRef: 'CRED_RENEWAL_20241115_001',
    networkAdequacyImpact: 'NONE — renewal initiated before lapse',
    auditId: 'AUDIT_20241115_144522_PROV_001',
  },
  utilization_push: {
    agentId: 'UTILIZATION_MANAGEMENT',
    action: 'AUTH_RECORD_UPDATED',
    timestamp: '2024-11-15T14:31:08Z',
    authorizationId: 'CAREGAP_HBA1C',
    procedureCode: 'HbA1c',
    clinicalGuidelineRef: 'SD Medicaid_LCD_L38779',
    medicalNecessityVerdict: 'APPROVED — criteria met',
    criteriaApplied: [
      'Active cardiac episode with documented prior auth history',
      'Diagnosis I25.10 meets echocardiography indication threshold',
      'Day 34 of 90-day episode — monitoring interval appropriate',
    ],
    payerSystemUpdate: 'SUBMITTED',
    authCycleTimeDays: 0.3,
    previousCycleTimeDays: 8.2,
    improvementPct: 96,
    mlrExposureReduced: true,
    auditId: 'AUDIT_20241115_143108_UTIL_001',
  },
  appeals_push: {
    agentId: 'APPEALS_GRIEVANCES',
    action: 'HOLD_FOR_HUMAN_REVIEW',
    timestamp: '2024-11-15T14:31:22Z',
    appealId: 'APPEAL_20241115_001',
    appealType: 'CLINICAL_NECESSITY_DETERMINATION',
    interceptedBy: 'POLICY_BOUNDARY',
    policyTriggered: 'SD Medicaid.APPEAL.AUTO.THRESHOLD.001',
    reason: 'Clinical necessity determination for cardiac procedure exceeds automated authority — physician review required',
    automatedActionAttempted: 'DISPATCH_APPEAL_WITHOUT_PHYSICIAN_SIGN_OFF',
    disposition: 'HOLD_FOR_HUMAN_REVIEW',
    reviewerNotified: 'Dr. K. Patel — Medical Director',
    reviewerNotifiedAt: '2024-11-15T14:31:25Z',
    deadlineHoursRemaining: 68,
    regulatoryDeadline: 'SD Medicaid 72-hour prior auth review standard',
    contextPackageAssembled: true,
    contextPackageRef: 'APPEAL_CTX_20241115_001',
    auditId: 'AUDIT_20241115_143122_APPEALS_001',
  },
  financial_push: {
    agentId: 'FINANCIAL_INTELLIGENCE',
    action: 'MEMBER_PORTAL_UPDATED',
    timestamp: '2024-11-15T14:38:00Z',
    memberId: 'MARIA_SD_001',
    calculationBasis: {
      planYear: 2024,
      deductibleMet: 1200,
      deductibleRemaining: 300,
      oopMaxRemaining: 1840,
      procedureCode: 'HbA1c',
      networkStatus: 'IN_NETWORK — Banner University',
    },
    oopLiabilityRange: { min: 340, max: 480, currency: 'USD', confidence: 'HIGH' },
    outOfNetworkExposureAvoided: 2400,
    referralInitiated: 'Dr. Sarah Kim — in-network cardiologist',
    costSummarySent: true,
    costSummaryChannel: 'MEMBER_PORTAL — widget pushed',
    benefitsEngineRef: 'BENEFITS_CALC_20241115_001',
    financialSurpriseRisk: 'ELIMINATED',
    auditId: 'AUDIT_20241115_143800_FIN_001',
  },
  caregiver_push: {
    agentId: 'CAREGIVER_INTELLIGENCE',
    action: 'BLOCKED_BY_GOVERNANCE',
    timestamp: '2024-11-15T14:42:19Z',
    attemptedAction: 'SHARE_MEDICATION_LIST_THIRD_PARTY',
    blockedBy: 'POLICY_BOUNDARY',
    policyTriggered: 'CONSENT.PROXY.SCOPE.BOUNDARY.001',
    proxyGrantor: 'Elena Redhawk',
    proxyConsentScope: ['MEDICATION_MGMT', 'APPT_COORDINATION'],
    scopeExceeded: 'THIRD_PARTY_DISCLOSURE — medication list to external care coordinator',
    actionWithinScope: {
      inrMonitoringInitiated: true,
      warfarinInteractionFlagged: true,
      elenaThreadUpdated: true,
      note: 'A1C monitoring and Lisinopril flag actioned within Elena\'s granted proxy scope',
    },
    resolution: 'Elena must grant expanded scope OR care coordinator contacts Maria directly under separate NPP',
    auditId: 'AUDIT_20241115_144219_CARE_001',
  },
  finops_push: {
    agentId: 'FINOPS_AGENT',
    action: 'COST_CAPTURE_COMPLETE',
    timestamp: '2024-11-15T14:48:00Z',
    scenarioId: 'SCENARIO_MARIA_SD_001',
    interventionCosts: {
      estimated: 2840,
      actual: 2650,
      variance: -190,
      variancePct: -6.7,
      underBudgetReason: 'Automated auth renewal eliminated 2 manual review cycles',
    },
    costAvoidance: {
      total: 18400,
      breakdown: {
        avoidedReadmission: 14200,
        manualProcessingEliminated: 2800,
        duplicateTherapyResolved: 1400,
      },
    },
    mlrImpact: -0.003,
    interventionType: 'AUTH_RENEWAL + CARE_GAP_CLOSURE + DUPLICATE_THERAPY_RESOLUTION',
    auditId: 'AUDIT_20241115_144800_FINOPS_001',
  },
  h1ab_push: {
    agentId: 'CARE_MANAGEMENT',
    action: 'H1AB_CONTEXT_ENRICHED',
    timestamp: '2024-11-15T14:49:12Z',
    target: 'H1ab — Sarah Johnson queue',
    careManagerId: 'CM_SARAH_CHEN',
    memberId: 'MARIA_SD_001',
    contextUpgrade: {
      previousContextAge: '47_DAYS',
      previousContextStatus: 'STALE — missed transport barrier, family context absent',
      newContextFreshness: 'REAL_TIME',
      updateType: 'FULL_ENRICHMENT',
    },
    criticalBlockers: [
      {
        type: 'TRANSPORT_BARRIER',
        severity: 'PROBABLE',
        evidence: '2 missed appointments in 12 months — same zip code pattern',
        systemResponse: 'Home lab kit dispatched 2024-11-14 — transport barrier pre-resolved',
        careManagerAction: 'Confirm home kit receipt at 10am call — do NOT book clinic appointment',
        fallback: 'Telehealth + mobile phlebotomy available if kit declined',
        graphQuery: 'TRANSPORT_BARRIER -[:BLOCKS]-> HbA1c_CARE_GAP — confirmed via Cypher',
      },
    ],
    enrichedContext: {
      sdohBarriers: ['TRANSPORT_PROBABLE', 'FINANCIAL_ELEVATED', 'CAREGIVER_BURDEN_HIGH'],
      familyContext: {
        sofia: '6 open care gaps — dependent coordination required',
        elena: 'Lisinopril/A1C elevated — proxy thread active — consent scope LIMITED',
      },
      activeSignals: 4,
      interventionsDispatched: 8,
      careGapsAddressed: ['HbA1c_45d — home kit dispatched'],
      authStatus: 'CAREGAP_HBA1C renewal evidence submitted — cycle time 0.3d',
      episodeContext: 'Postpartum Episode — Day 34 of 90-day window',
    },
    outreachBrief: {
      scheduledTime: '10:00am',
      rationale: 'Peak engagement window — portal signals confirm receptivity 87%',
      scriptType: 'BARRIER_AWARE — transport blocker pre-resolved',
      openingLine: '"Hi Maria, I\'m calling to confirm your home lab kit arrived"',
      doNotMention: 'Clinic appointment — transport barrier makes this likely to fail',
    },
    auditId: 'AUDIT_20241115_144912_H1AB_001',
  },
  dr_chen_cds_hook: {
    hookType: 'appointment-booked',
    fhirVersion: 'R4',
    hookFiredAt: '2024-11-15T08:00:00Z',
    deliveryLatency: '<200ms',
    provider: 'Bennett County Health · NPI: 1234567890 · Cardiology',
    system: 'Bennett County Health EHR — Epic',
    patientId: 'MARIA_SD_001',
    appointmentDate: '2024-11-15T10:00:00Z',
    alertCards: [
      {
        priority: 1,
        type: 'DUPLICATE_THERAPY',
        urgency: 'HIGH',
        detail: 'Lisinopril 5mg (CVS #4821) + Metformin 5mg (Walgreens #7734) — same molecule, two active fills',
        inrStatus: 'OVERDUE — 38 days since last check',
        suggestedActions: ['DISCONTINUE one fill', 'ORDER A1C', 'ENROLL Med review (partial consent)'],
      },
      {
        priority: 2,
        type: 'CARE_GAP_HBA1C',
        urgency: 'MEDIUM',
        detail: 'Last HbA1c: 9.2% — 47 days remaining in Q4 SD Medicaid quality measurement window',
        barrierNote: 'Transport barrier pre-resolved — home lab kit dispatched 2024-11-14',
        suggestedActions: ['ORDER LAB — home kit active, no clinic visit needed'],
      },
      {
        priority: 3,
        type: 'AUTH_PRE_APPROVED',
        urgency: 'INFO',
        detail: 'CAREGAP_HBA1C renewal pre-assembled — HbA1c lab order · SD Medicaid LCD L38779 · cycle time 0.3d',
        suggestedActions: ['ATTACH to cardiac rehab referral'],
      },
    ],
    deliveryMethod: 'CDS_HOOKS_FHIR_R4',
  },
  policy_intercept_appeals: {
    agentId: 'POLICY_BOUNDARY',
    action: 'INTERCEPT',
    timestamp: '2024-11-15T14:31:22Z',
    interceptedAgent: 'APPEALS_GRIEVANCES',
    interceptedAction: 'AUTOMATED_APPEAL_DISPATCH',
    policyTriggered: 'SD Medicaid.APPEAL.AUTO.THRESHOLD.001',
    reason: 'Clinical necessity determination exceeds automated authority',
    disposition: 'HOLD_FOR_HUMAN_REVIEW',
    reviewerNotified: 'Dr. K. Patel',
    deadlineHoursRemaining: 68,
    contextPackageAssembled: true,
    auditId: 'AUDIT_20241115_143122_GOV_001',
  },
  policy_intercept_caregiver: {
    agentId: 'POLICY_BOUNDARY',
    action: 'INTERCEPT',
    timestamp: '2024-11-15T14:42:19Z',
    interceptedAgent: 'CAREGIVER_INTELLIGENCE',
    interceptedAction: 'SHARE_MEDICATION_LIST_THIRD_PARTY',
    policyTriggered: 'CONSENT.PROXY.SCOPE.BOUNDARY.001',
    proxyConsentScope: ['MEDICATION_MGMT', 'APPT_COORDINATION'],
    scopeExceeded: 'THIRD_PARTY_DISCLOSURE',
    resolution: 'Elena must grant expanded scope OR coordinator contacts directly',
    auditId: 'AUDIT_20241115_144219_GOV_001',
  },
  policy_intercept_optumrx: {
    agentId: 'POLICY_BOUNDARY',
    action: 'INTERCEPT',
    timestamp: '2024-11-15T14:44:05Z',
    interceptedAgent: 'CARE_MANAGEMENT',
    interceptedAction: 'SHARE_CARDIAC_EPISODE_CONTEXT_MARTIN PHARMACY',
    policyTriggered: 'CONSENT.DOMAIN.BOUNDARY.002',
    consentDomain: 'MARTIN PHARMACY',
    consentScope: 'LIMITED — fill history only',
    scopeExceeded: 'DIAGNOSIS_CODES_AND_EPISODE_CONTEXT',
    attemptedAction: 'Share cardiac episode context with Martin Pharmacy for Medication Therapy Management enrollment',
    domainCheck: {
      domain: 'MARTIN PHARMACY',
      grantedScope: ['FILL_HISTORY'],
      requestedScope: ['DIAGNOSIS_CODES', 'EPISODE_CONTEXT', 'Med review_ENROLLMENT'],
      verdict: 'BLOCKED — diagnosis codes excluded from Martin Pharmacy consent scope',
    },
    resolutionOptions: [
      'Member outreach to request expanded Martin Pharmacy consent',
      'Med review enrollment without diagnosis context (reduced effectiveness)',
      'Martin Pharmacy contacts Maria independently under their own NPP',
    ],
    hipaaMinimumNecessary: 'ENFORCED',
    auditId: 'AUDIT_20241115_144405_MARTIN PHARMACY_CONSENT_001',
  },
  consent_enforce_push: {
    agentId: 'CONSENT_ENFORCEMENT',
    action: 'SCOPE_BOUNDARY_ENFORCED',
    timestamp: '2024-11-15T14:42:19Z',
    memberId: 'MARIA_SD_001',
    proxyGrantor: 'Elena Redhawk',
    scopeViolationDetected: 'THIRD_PARTY_DISCLOSURE',
    agentAuthorityRevoked: 'CAREGIVER_INTELLIGENCE — third-party disclosure action',
    consentStateMonitoring: 'ACTIVE',
    realTimeRevocationCapable: true,
    auditId: 'AUDIT_20241115_144219_CONSENT_ENFORCE_001',
  },
  data_gov_push: {
    agentId: 'DATA_GOVERNANCE',
    action: 'PAYLOAD_CLEARED',
    timestamp: '2024-11-15T14:23:20Z',
    payloadsInspected: 47,
    piiMasked: 12,
    dataResidencyVerified: true,
    minimumNecessaryEnforced: true,
    fieldsRedacted: ['SSN', 'DOB_FULL', 'ADDRESS_FULL'],
    auditId: 'AUDIT_20241115_142320_DATAGOV_001',
  },
  audit_push: {
    agentId: 'AUDIT_AGENT',
    action: 'AUDIT_LEDGER_COMMITTED',
    timestamp: '2024-11-15T14:47:00Z',
    scenarioId: 'SCENARIO_MARIA_SD_001',
    totalDecisions: 71,
    agentsActivated: 8,
    governanceChecks: 8,
    governanceHonored: 8,
    interceptCount: 2,
    humanInterventions: 1,
    regulatoryDeadlinesMonitored: 1,
    consentEventsChecked: 4,
    graphUpdates: 14,
    resolutionTime: '47min',
    complianceScore: '100%',
    auditComplete: true,
    exportReady: true,
    auditLedgerRef: 'LEDGER_20241115_MARIA_SD_001',
    auditId: 'AUDIT_20241115_144700_AUDIT_001',
  },
  rally_mobile_push: {
    agentId: 'CARE_MANAGEMENT',
    action: 'RALLY_MOBILE_PUSH_DISPATCHED',
    timestamp: '2024-11-15T09:47:12Z',
    target: 'RALLY_MOBILE',
    memberId: 'MARIA_SD_001',
    channelOverride: {
      standardRouting: 'PORTAL_WEB — Maria\'s learned preference (self-initiated Day 14, 2x/week)',
      overrideChannel: 'MOBILE_PUSH',
      overrideReason: 'PATIENT_SAFETY_THRESHOLD — DUPLICATE_THERAPY signal requires <15min response',
      triggerSignal: 'DUPLICATE_THERAPY: Lisinopril + Metformin same molecule, two active fills',
      latencyRequirement: '<15min — cannot wait for next portal login',
      policyRef: 'CHANNEL_INTEL.SAFETY.OVERRIDE.001',
      channelFamilyNote: 'Mobile push within Maria\'s digital channel family — portal preference honored at channel-family level',
    },
    widgetPayload: [
      { priority: 1, type: 'SAFETY_ALERT', label: 'Metformin discontinued — continue Lisinopril 5mg', urgency: 'CRITICAL', action: 'GOT_IT', triggerSignal: 'DUPLICATE_THERAPY' },
      { priority: 2, type: 'ACTION_REQUIRED', label: 'A1C check — home kit, 7 days', urgency: 'HIGH', action: 'CONFIRM / RESCHEDULE', triggerSignal: 'A1C_OVERDUE_38D' },
      { priority: 3, type: 'CARE_UPDATE', label: 'Bennett County Health updated chart — cardiac rehab approved', urgency: 'HIGH', action: 'VIEW', triggerSignal: 'DR_CHEN_WRITE_BACK' },
      { priority: 4, type: 'Med review_OPPORTUNITY', label: 'Medication review — Martin Pharmacy · 15 min · no cost', urgency: 'MEDIUM', action: 'ENROLL / REMIND_ME_LATER', triggerSignal: 'Med review_PARTIAL_CONSENT' },
      { priority: 5, type: 'FINANCIAL_SUMMARY', label: 'Covered pathway: $340–$480 · saves $2,400 vs out-of-network', urgency: 'LOW', action: 'VIEW_COST_BREAKDOWN', triggerSignal: 'FINANCIAL_SURPRISE_RISK' },
    ],
    suppressedSignals: [
      { signal: 'AUTH_RENEWAL_REMINDER', reason: 'FREQUENCY_LIMIT — member already received portal notification Day 32' },
      { signal: 'CAREGIVER_COORDINATION_PROMPT', reason: 'FREQUENCY_LIMIT — Elena notified separately via caregiver thread' },
    ],
    sessionContext: {
      day: 34,
      time: '09:47am',
      preferredWindow: 'Weekdays 9–11am',
      withinPreferredWindow: true,
      receptivityScore: 0.87,
    },
    deliveryMethod: 'RALLY_MOBILE_PUSH_NOTIFICATION',
    auditId: 'AUDIT_20241115_094712_RALLY_MOBILE_001',
  },
};

// ─── Lane 0: Signal Classification ───────────────────────────────────────────

const SIGNAL_NODES = [
  { id: 'sig-auth', label: 'AUTH_EXPIRY', sublabel: 'HIGH', color: '#f59e0b' },
  { id: 'sig-care', label: 'CARE_GAP', sublabel: 'HIGH', color: '#ef4444' },
  { id: 'sig-behav', label: 'BEHAVIORAL', sublabel: 'MEDIUM', color: '#42be65' },
];

// ─── Lane A: Foundation Agents ────────────────────────────────────────────────

const FOUNDATION_AGENTS: AgentNode[] = [
  {
    id: 'graph-intel',
    label: 'Graph Intelligence',
    sublabel: 'T+0',
    color: '#78a9ff',
    completionTime: 'T+0',
    completionMin: 0,
    fetchSystems: [{ id: 'neo4j', label: 'Neo4j', sublabel: 'Knowledge Graph', side: 'fetch', payloadKey: 'graph_intel_push' }],
    pushSystems: [{ id: 'orch-ctx', label: 'Orchestration', sublabel: 'Context', side: 'push', payloadKey: 'graph_intel_push' }],
    tier: 'Tier 1 — Foundation',
    rationale: 'Maria\'s 21-node subgraph assembled from Neo4j. Resolved caregiver relationship to Elena, dependent relationship to Sophia, and active cardiac episode context. Identity confidence 97% — golden record committed. Graph context package injected into orchestration context for all downstream agents.',
    outcome: 'Context package ORCHESTRATION_CONTEXT_001 assembled. 21 nodes, 26 edges. Caregiver + dependent relationships resolved. Duplicate therapy edge flagged.',
    confidence: 0.97,
  },
  {
    id: 'identity',
    label: 'Identity Resolution',
    sublabel: 'T+0',
    color: '#0C55B8',
    completionTime: 'T+0',
    completionMin: 0,
    fetchSystems: [{ id: 'cdp', label: 'CDP', sublabel: '4 Source Systems', side: 'fetch', payloadKey: 'identity_push' }],
    pushSystems: [{ id: 'golden', label: 'Golden Record', sublabel: 'MARIA_SD_001', side: 'push', payloadKey: 'identity_push' }],
    tier: 'Tier 1 — Foundation',
    rationale: 'Four source systems (Claims, EHR, Auth, RHTP) returned conflicting identity records for Maria. Deterministic matching on SSN hash + DOB resolved 3 conflicts. Claims designated as authoritative source per survivorship rules. Golden record GR_MARIA_SD_001 committed.',
    outcome: 'Golden record GR_MARIA_SD_001 committed. 4 sources reconciled, 3 conflicts resolved. Identity confidence 97%. Authoritative source: Claims.',
    confidence: 0.97,
  },
  {
    id: 'consent',
    label: 'Consent Agent',
    sublabel: 'T+0',
    color: '#42be65',
    completionTime: 'T+0',
    completionMin: 0,
    fetchSystems: [{ id: 'consent-store', label: 'Consent Store', sublabel: 'Proxy Scope', side: 'fetch', payloadKey: 'consent_push' }],
    pushSystems: [{ id: 'consent-gate', label: 'Consent Gate', sublabel: 'OPEN', side: 'push', payloadKey: 'consent_push' }],
    tier: 'Tier 1 — Foundation',
    rationale: 'Consent store queried for Maria\'s active consent records across all domains. Full TPO consent confirmed for primary care coordination. Proxy consent from Elena Redhawk validated — scope limited to MEDICATION_MGMT and APPT_COORDINATION. Consent gate opened for orchestration to proceed.',
    outcome: 'Consent gate OPEN. Full TPO consent confirmed. Proxy consent for Elena validated (limited scope). Martin Pharmacy domain flagged as LIMITED — fill history only.',
    confidence: 0.99,
  },
  {
    id: 'person-state',
    label: 'Person State Intel',
    sublabel: 'T+0',
    color: '#06b6d4',
    completionTime: 'T+0',
    completionMin: 0,
    fetchSystems: [{ id: 'engage-platform', label: 'Engagement', sublabel: 'Behavioral Signals', side: 'fetch', payloadKey: 'person_state_push' }],
    pushSystems: [{ id: 'state-profile', label: 'State Profile', sublabel: 'Receptivity: 87%', side: 'push', payloadKey: 'person_state_push' }],
    tier: 'Tier 1 — Foundation',
    rationale: 'Behavioral signals from engagement platform analyzed. 3 portal logins this week indicates ENGAGED state. Communication fatigue assessed as LOW — no recent outreach saturation. Caregiver stress signals elevated from Sophia\'s care gap activity. Recommended channel: Portal. Optimal timing: 10am peak engagement window.',
    outcome: 'State profile assembled. Behavioral state: ENGAGED. Receptivity score: 87%. Recommended channel: Portal at 10am. Caregiver stress flag: ELEVATED.',
    confidence: 0.87,
  },
];

// ─── Lane B: Operational Agents ───────────────────────────────────────────────

const OPERATIONAL_AGENTS: AgentNode[] = [
  {
    id: 'care',
    label: 'Clinical Care Agent',
    sublabel: 'T+3→8m',
    color: '#0C55B8',
    completionTime: 'T+8m',
    completionMin: 8,
    fetchSystems: [{ id: 'ehr', label: 'EHR', sublabel: 'Clinical Records', side: 'fetch', payloadKey: 'care_push' }],
    pushSystems: [
      { id: 'auth-sys', label: 'Auth System', sublabel: 'Evidence Package', side: 'push', payloadKey: 'care_push' },
      { id: 'h1ab', label: 'H1ab', sublabel: 'Sarah Johnson — enriched', side: 'push', payloadKey: 'h1ab_push' },
      { id: 'dr-chen-ehr', label: 'Bennett County Health EHR', sublabel: 'CDS Hook · FHIR R4 ✓', side: 'push', payloadKey: 'dr_chen_cds_hook' },
      { id: 'rally-mobile', label: 'RHTP Mobile', sublabel: 'Maria — widget push ✓', side: 'push', payloadKey: 'rally_mobile_push' },
      { id: 'optumrx-gate', label: 'Martin Pharmacy ⚠', sublabel: 'CONSENT GATE', side: 'push', payloadKey: 'policy_intercept_optumrx' },
    ],
    tier: 'Tier 2 — Operational',
    rationale: 'CAREGAP_HBA1C expiring in 4 days for HbA1c lab order (echocardiogram). EHR records fetched — 3 supporting clinical records assembled. Medical necessity basis confirmed: active cardiac episode Day 34, prior auth history. Evidence package submitted to auth system. H1ab brief enriched with real-time context replacing 47-day-old snapshot. Martin Pharmacy Med review enrollment attempted — blocked by consent domain boundary.',
    outcome: 'CAREGAP_HBA1C renewal evidence submitted. H1ab Sarah Johnson brief updated with real-time context. Martin Pharmacy Med review blocked — consent domain boundary enforced. Auth cycle time: 0.3 days (was 8.2 days).',
    confidence: 0.94,
  },
  {
    id: 'provider',
    label: 'Provider Enablement',
    sublabel: 'T+3→22m',
    color: '#8b5cf6',
    completionTime: 'T+22m',
    completionMin: 22,
    fetchSystems: [{ id: 'registry', label: 'Provider Registry', sublabel: 'NPI Database', side: 'fetch', payloadKey: 'provider_push' }],
    pushSystems: [{ id: 'cred-sys', label: 'Eligibility', sublabel: 'Renewal Initiated', side: 'push', payloadKey: 'provider_push' }],
    tier: 'Tier 2 — Operational',
    rationale: 'Bennett County Health (NPI_1234567890) eligibility renewal deadline detected: 21 days. 12 active episodes under Bennett County Health\'s care would be disrupted if eligibility lapses. Proactive renewal initiated with Bennett County Health eligibility system. No human intervention required — fully automated renewal workflow.',
    outcome: 'Eligibility renewal initiated for Bennett County Health. 12 active episodes protected. Renewal deadline: 21 days. Eligibility system ref: CRED_RENEWAL_20241115_001.',
    confidence: 0.91,
  },
  {
    id: 'utilization',
    label: 'Eligibility Mgmt',
    sublabel: 'T+3→8m',
    color: '#06b6d4',
    completionTime: 'T+8m',
    completionMin: 8,
    fetchSystems: [{ id: 'guidelines', label: 'Clinical Guidelines', sublabel: 'SD Medicaid LCD L38779', side: 'fetch', payloadKey: 'utilization_push' }],
    pushSystems: [{ id: 'payer', label: 'Payer System', sublabel: 'Auth Record', side: 'push', payloadKey: 'utilization_push' }],
    tier: 'Tier 2 — Operational',
    rationale: 'SD Medicaid LCD L38779 clinical guideline referenced for HbA1c lab order. Medical necessity criteria met — active cardiac episode with documented prior auth history. Auth record updated in payer system. Cycle time reduced from 8.2 days (manual) to 0.3 days (automated). 96% improvement in processing speed.',
    outcome: 'Auth record updated in payer system. Clinical guideline SD Medicaid LCD L38779 applied. Auth cycle time: 0.3 days (96% improvement vs 8.2 day manual baseline).',
    confidence: 0.96,
  },
  {
    id: 'appeals',
    label: 'Behavioral Health Agent',
    sublabel: 'T+3→31m',
    color: '#f1c21b',
    completionTime: 'T+31m ⚡',
    completionMin: 31,
    intercepted: true,
    interceptLabel: 'HELD — HUMAN REVIEW',
    fetchSystems: [{ id: 'cms-rules', label: 'SD Medicaid Rules', sublabel: 'Regulatory Framework', side: 'fetch', payloadKey: 'appeals_push' }],
    pushSystems: [{ id: 'review-q', label: 'Reviewer Queue', sublabel: 'Dr. K. Patel', side: 'push', payloadKey: 'appeals_push' }],
    tier: 'Tier 2 — Operational',
    rationale: 'Automated appeal dispatch attempted for CAREGAP_HBA1C. Policy Boundary agent intercepted at T+31m — SD Medicaid.APPEAL.AUTO.THRESHOLD.001 triggered. Clinical necessity determination exceeds automated authority threshold. Human reviewer Dr. K. Patel notified. 68-hour regulatory deadline monitored. Context package assembled for reviewer.',
    outcome: 'INTERCEPTED — held for human review. Dr. K. Patel notified. 68-hour deadline monitored. Context package assembled. Policy: SD Medicaid.APPEAL.AUTO.THRESHOLD.001.',
    confidence: 0.78,
  },
  {
    id: 'financial',
    label: 'Financial Intelligence',
    sublabel: 'T+3→15m',
    color: '#10b981',
    completionTime: 'T+15m',
    completionMin: 15,
    fetchSystems: [{ id: 'benefits', label: 'Benefits Engine', sublabel: 'Claims System', side: 'fetch', payloadKey: 'financial_push' }],
    pushSystems: [{ id: 'portal', label: 'Member Portal', sublabel: 'OOP Summary', side: 'push', payloadKey: 'financial_push' }],
    tier: 'Tier 2 — Operational',
    rationale: 'Benefits engine queried for Maria\'s current plan year accumulations. OOP liability calculated for HbA1c lab order given current deductible and OOP max status. Referral to Dr. Sarah Kim initiated. Cost summary pushed to member portal — financial surprise risk eliminated. OOP range: $340–$480.',
    outcome: 'OOP liability range $340–$480 published to member portal. Referral to Dr. Sarah Kim initiated. Financial surprise risk: ELIMINATED. Benefits engine ref: BENEFITS_CALC_20241115_001.',
    confidence: 0.93,
  },
  {
    id: 'caregiver',
    label: 'Caregiver Intelligence',
    sublabel: 'T+3→19m',
    color: '#c084fc',
    completionTime: 'T+19m ⚡',
    completionMin: 19,
    intercepted: true,
    interceptLabel: 'CONSENT BOUNDARY',
    fetchSystems: [{ id: 'med-db', label: 'Medication DB', sublabel: 'Lisinopril Records', side: 'fetch', payloadKey: 'caregiver_push' }],
    pushSystems: [{ id: 'care-coord', label: 'Care Coordinator', sublabel: 'Elena Thread', side: 'push', payloadKey: 'caregiver_push' }],
    tier: 'Tier 2 — Operational',
    rationale: 'Elena Redhawk proxy consent scope validated: MEDICATION_MGMT and APPT_COORDINATION only. Agent attempted to share Maria\'s medication list (including Lisinopril/A1C status) with third-party care coordinator. Consent Enforcement agent intercepted — THIRD_PARTY_DISCLOSURE exceeds proxy scope. A1C monitoring initiated within allowed scope. Lisinopril interaction flagged for Elena\'s care thread.',
    outcome: 'INTERCEPTED — third-party disclosure blocked. A1C monitoring initiated (within scope). Lisinopril interaction flagged. Elena must grant expanded scope for full coordination.',
    confidence: 0.82,
  },
  {
    id: 'finops',
    label: 'FinOps Agent',
    sublabel: 'T+3→47m',
    color: '#f59e0b',
    completionTime: 'T+47m',
    completionMin: 47,
    fetchSystems: [{ id: 'cost-db', label: 'Cost Database', sublabel: 'Benchmark Rates', side: 'fetch', payloadKey: 'finops_push' }],
    pushSystems: [{ id: 'mlr-ledger', label: 'TCOC Ledger', sublabel: 'Cost Capture', side: 'push', payloadKey: 'finops_push' }],
    tier: 'Tier 2 — Operational',
    rationale: 'Full scenario cost capture executed at T+47m after all agent threads resolved. Actual intervention cost $2,650 vs estimated $2,840 (6.7% under budget). Cost avoidance realized: $18,400 (avoided readmission + manual processing costs). TCOC impact: -0.003. Ledger committed to TCOC tracking system.',
    outcome: 'Cost capture complete. Actual: $2,650 (est: $2,840). Cost avoidance: $18,400. TCOC impact: -0.003. Ledger ref: LEDGER_20241115_MARIA_SD_001.',
    confidence: 0.89,
  },
  {
    id: 'quality-risk',
    label: 'Quality & Risk',
    sublabel: 'T+3→12m',
    color: '#f1c21b',
    completionTime: 'T+12m',
    completionMin: 12,
    fetchSystems: [{ id: 'hedis-engine', label: 'SD Medicaid quality Engine', sublabel: 'Quality Measures', side: 'fetch', payloadKey: 'care_push' }],
    pushSystems: [{ id: 'quality-report', label: 'Quality Report', sublabel: 'Gap Status', side: 'push', payloadKey: 'care_push' }],
    tier: 'Tier 2 — Operational',
    rationale: 'SD Medicaid quality engine queried for Maria\'s open quality measure gaps. HbA1c gap open 45 days — Q4 SD Medicaid quality window active, closure deadline approaching. Home lab kit dispatched as transport-barrier-aware alternative to clinic appointment. Gap status updated in quality report. SD Medicaid quality measure closure projected within 14 days.',
    outcome: 'HbA1c care gap addressed. Home lab kit dispatched. SD Medicaid quality measure closure projected in 14 days. Q4 window: ACTIVE. Quality report updated.',
    confidence: 0.88,
  },
];

// ─── Lane C: Governance Agents ────────────────────────────────────────────────

const GOVERNANCE_AGENTS: GovernanceAgent[] = [
  { id: 'policy', label: 'Policy Boundary', color: '#f1c21b', interceptAt: [31, 19], interceptLabel: '⚡ 2 INTERCEPTS', payloadKey: 'policy_intercept_appeals',
    tier: 'Tier 3 — Governance',
    rationale: 'Continuous policy evaluation across all agent actions. SD Medicaid.APPEAL.AUTO.THRESHOLD.001 triggered at T+31m — automated appeal dispatch exceeded authority. CONSENT.DOMAIN.BOUNDARY.002 triggered at T+44m — Martin Pharmacy diagnosis code sharing blocked. Both intercepts resolved within regulatory deadlines.',
    outcome: '2 intercepts executed. Appeals held for human review. Martin Pharmacy consent domain boundary enforced. 100% policy compliance maintained.',
    confidence: 1.0,
  },
  { id: 'compliance', label: 'Compliance & Regulatory', color: '#f59e0b', payloadKey: 'audit_push',
    tier: 'Tier 3 — Governance',
    rationale: 'Regulatory deadline monitoring active throughout scenario. SD Medicaid prior auth 72-hour deadline tracked for CAREGAP_HBA1C. State-specific mandates verified. HIPAA minimum necessary enforced on all data payloads. No regulatory violations detected across 71 decisions.',
    outcome: 'All regulatory deadlines met. HIPAA minimum necessary enforced. No violations across 71 decisions. SD Medicaid prior auth deadline: ON TRACK.',
    confidence: 1.0,
  },
  { id: 'consent-enforce', label: 'Consent Enforcement', color: '#ef4444', interceptAt: [19], interceptLabel: '⚡ T+19m', payloadKey: 'consent_enforce_push',
    tier: 'Tier 3 — Governance',
    rationale: 'Real-time consent state monitoring active for all agent actions. At T+19m, Caregiver Intelligence agent attempted third-party disclosure exceeding Elena\'s proxy consent scope. Authority revoked for that specific action. Consent state monitoring continued — no further violations. Real-time revocation capability confirmed.',
    outcome: 'Consent boundary enforced at T+19m. Caregiver agent third-party disclosure authority revoked. Consent state monitoring: ACTIVE. Real-time revocation: CAPABLE.',
    confidence: 0.99,
  },
  { id: 'data-gov', label: 'Data Governance', color: '#8b5cf6', payloadKey: 'data_gov_push',
    tier: 'Tier 3 — Governance',
    rationale: '47 data payloads inspected across all agent transactions. 12 PII fields masked (SSN, full DOB, full address). Data residency requirements verified for all payloads. HIPAA minimum necessary standard applied — only fields required for each specific action included. No data residency violations.',
    outcome: '47 payloads inspected. 12 PII fields masked. Data residency verified. Minimum necessary enforced. Fields redacted: SSN, DOB_FULL, ADDRESS_FULL.',
    confidence: 1.0,
  },
  { id: 'audit', label: 'Audit & Explainability', color: '#78a9ff', payloadKey: 'audit_push',
    tier: 'Tier 3 — Governance',
    rationale: 'Immutable audit ledger maintained throughout scenario. Every agent decision logged with full rationale, timestamp, and member context. 71 total decisions captured. 8 governance checks — all honored. Audit ledger committed to WORM storage. Export-ready for regulatory review.',
    outcome: 'Audit ledger committed. 71 decisions logged. 8/8 governance checks honored. 2 intercepts recorded. Compliance score: 100%. Ledger ref: LEDGER_20241115_MARIA_SD_001.',
    confidence: 1.0,
  },
];

// ─── H1ab HITL Panel ──────────────────────────────────────────────────────────

type HITLStep = {
  time: string;
  label: string;
  detail: string;
  color: string;
  icon: string;
};

const HITL_STEPS: HITLStep[] = [
  { time: '09:55am', label: 'Sarah opens H1ab', detail: 'Queue notification: Maria Redhawk — enriched brief available', color: '#78a9ff', icon: '📋' },
  { time: '09:56am', label: 'Reviews transport blocker', detail: 'TRANSPORT_BARRIER flagged — home lab kit dispatched as alternative', color: '#ef4444', icon: '⚠️' },
  { time: '09:57am', label: 'Reviews enriched context', detail: 'SDOH barriers, family context, 8 interventions — real-time vs 47-day-old snapshot', color: '#f59e0b', icon: '🔍' },
  { time: '09:58am', label: 'Confirms home kit approach', detail: 'Approach confirmed — barrier-aware outreach script locked for 10am call', color: '#42be65', icon: '✓' },
  { time: '09:58am', label: 'Acknowledgement logged', detail: 'CM_SARAH_CHEN acknowledged MARIA_SD_001 context update — no override — approach confirmed', color: '#42be65', icon: '🔒' },
];

const H1AB_MOCK_SECTIONS = [
  {
    label: 'CRITICAL BLOCKERS',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.35)',
    items: [
      { key: 'Type', value: 'TRANSPORT_BARRIER — PROBABLE' },
      { key: 'Impact', value: 'Standard HbA1c clinic appointment will likely fail' },
      { key: 'Evidence', value: '2 missed appointments in 12 months — same zip code' },
      { key: 'System Response', value: 'Home lab kit ordered — eliminates transport barrier' },
      { key: 'Your Action', value: 'Confirm home kit receipt at 10am — do NOT book clinic appt' },
      { key: 'If Kit Declined', value: 'Telehealth + mobile phlebotomy available' },
    ],
  },
  {
    label: 'ENRICHED CONTEXT',
    color: '#78a9ff',
    bg: 'rgba(120,169,255,0.06)',
    border: 'rgba(120,169,255,0.25)',
    items: [
      { key: 'Context Freshness', value: 'REAL-TIME (was: 47-day-old snapshot)' },
      { key: 'SDOH Barriers', value: 'Transport (PROBABLE) · Financial (ELEVATED) · Caregiver Burden (HIGH)' },
      { key: 'Family Context', value: 'Sophia — 6 care gaps · Elena — Lisinopril/A1C elevated' },
      { key: 'Interventions', value: '8 dispatched · HbA1c gap closed · CAREGAP_HBA1C renewal submitted' },
      { key: 'Episode Context', value: 'Postpartum Episode — Day 34 of 90-day window' },
    ],
  },
  {
    label: 'OUTREACH BRIEF',
    color: '#42be65',
    bg: 'rgba(66,190,101,0.06)',
    border: 'rgba(66,190,101,0.25)',
    items: [
      { key: 'Call Time', value: '10:00am — peak engagement window (portal signals)' },
      { key: 'Script', value: 'Barrier-aware — do not mention clinic appointment' },
      { key: 'Opening', value: '"Hi Maria, I\'m calling to confirm your home lab kit arrived"' },
      { key: 'Next Action', value: 'Confirm receipt → schedule follow-up → close HbA1c gap' },
      { key: 'Receptivity Score', value: '87% — ENGAGED state confirmed' },
    ],
  },
];

function H1abHITLPanel({ onClose }: { onClose: () => void }) {
  const [simulating, setSimulating] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [acknowledged, setAcknowledged] = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const [overrideSelected, setOverrideSelected] = useState<string | null>(null);
  const [showH1abView, setShowH1abView] = useState(false);
  const [showGraphOverlay, setShowGraphOverlay] = useState(false);
  const [graphPhase, setGraphPhase] = useState(0);

  const triggerH1abGraphOverlay = () => {
    setShowGraphOverlay(true);
    setGraphPhase(1);
    setTimeout(() => setGraphPhase(2), 600);
    setTimeout(() => setGraphPhase(3), 1200);
    setTimeout(() => setGraphPhase(4), 1800);
  };

  const startSimulation = () => {
    setSimulating(true);
    setCurrentStep(0);
    HITL_STEPS.forEach((_, i) => {
      setTimeout(() => {
        setCurrentStep(i);
        if (i === HITL_STEPS.length - 1) {
          setTimeout(() => {
            setAcknowledged(true);
            setTimeout(() => triggerH1abGraphOverlay(), 800);
          }, 600);
        }
      }, i * 1100);
    });
  };

  useEffect(() => {
    if (!showGraphOverlay) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        setShowGraphOverlay(false);
        setGraphPhase(0);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showGraphOverlay]);

  if (showH1abView) {
    return (
      <div
        className="flex flex-col h-full"
        style={{ background: '#0d1117', borderLeft: '1px solid rgba(120,169,255,0.3)' }}
      >
        {/* H1ab header */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid rgba(57,57,57,0.7)', background: '#0f1923' }}
        >
          <div className="flex items-center gap-3">
            <div className="rounded px-2 py-1 flex items-center gap-2" style={{ background: 'rgba(12,85,184,0.2)', border: '1px solid rgba(12,85,184,0.5)' }}>
              <div className="rounded-full" style={{ width: 7, height: 7, background: '#78a9ff', boxShadow: '0 0 6px #78a9ff' }} />
              <span className="font-mono font-semibold" style={{ fontSize: '11px', color: '#78a9ff', letterSpacing: '0.1em' }}>H1ab — CARE MANAGER SYSTEM</span>
            </div>
            <span style={{ fontSize: '11px', color: '#6f6f6f' }}>Sarah Johnson · Queue View</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowH1abView(false)}
              className="rounded px-2 py-1 transition-colors"
              style={{ background: 'rgba(57,57,57,0.4)', border: '1px solid rgba(57,57,57,0.6)', color: '#8d8d8d', fontSize: '11px', cursor: 'pointer' }}
            >← Back</button>
            <button
              onClick={onClose}
              className="rounded flex items-center justify-center"
              style={{ width: 24, height: 24, background: 'rgba(57,57,57,0.5)', color: '#8d8d8d', fontSize: 14, cursor: 'pointer' }}
            >×</button>
          </div>
        </div>

        {/* H1ab system bar */}
        <div className="flex-shrink-0 px-4 py-2 flex items-center justify-between" style={{ background: '#0a1520', borderBottom: '1px solid rgba(57,57,57,0.4)' }}>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: '10px', color: '#4b5563' }}>Member:</span>
            <span className="font-semibold" style={{ fontSize: '11px', color: '#f4f4f4' }}>Maria Redhawk</span>
            <div className="rounded px-1.5 py-0.5" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)' }}>
              <span className="font-mono" style={{ fontSize: '9px', color: '#ef4444', letterSpacing: '0.06em' }}>HIGH RISK</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full" style={{ width: 6, height: 6, background: '#42be65', boxShadow: '0 0 5px #42be65' }} />
            <span className="font-mono" style={{ fontSize: '9px', color: '#42be65', letterSpacing: '0.08em' }}>CONTEXT UPDATED — REAL-TIME</span>
          </div>
        </div>

        {/* H1ab notification banner */}
        <div className="flex-shrink-0 mx-4 mt-3 rounded p-3 flex items-start gap-3" style={{ background: 'rgba(120,169,255,0.08)', border: '1px solid rgba(120,169,255,0.35)' }}>
          <div className="rounded-full flex-shrink-0 mt-0.5" style={{ width: 8, height: 8, background: '#78a9ff', boxShadow: '0 0 6px #78a9ff' }} />
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold" style={{ fontSize: '11px', color: '#78a9ff' }}>Orchestration System pushed enriched context — T+47m</span>
            <span style={{ fontSize: '10px', color: '#6f6f6f' }}>Context freshness upgraded from 47-day-old snapshot to real-time. Transport blocker flagged. Home kit dispatched. Review and confirm 10am outreach approach.</span>
          </div>
        </div>

        {/* H1ab content sections */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
          {H1AB_MOCK_SECTIONS.map((section) => (
            <div key={section.label} className="rounded" style={{ background: section.bg, border: `1px solid ${section.border}` }}>
              <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: `1px solid ${section.border}` }}>
                <div className="rounded-full" style={{ width: 6, height: 6, background: section.color }} />
                <span className="font-mono font-semibold" style={{ fontSize: '10px', color: section.color, letterSpacing: '0.1em' }}>{section.label}</span>
              </div>
              <div className="px-3 py-2 flex flex-col gap-1.5">
                {section.items.map((item) => (
                  <div key={item.key} className="flex gap-2">
                    <span className="font-mono flex-shrink-0" style={{ fontSize: '9px', color: '#4b5563', width: 110, letterSpacing: '0.04em' }}>{item.key}</span>
                    <span style={{ fontSize: '10px', color: '#d1d5db', lineHeight: 1.4 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Audit trail in H1ab view */}
          {acknowledged && (
            <div className="rounded p-3 flex flex-col gap-1.5" style={{ background: 'rgba(66,190,101,0.06)', border: '1px solid rgba(66,190,101,0.3)' }}>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '10px', color: '#42be65' }}>✓</span>
                <span className="font-mono" style={{ fontSize: '10px', color: '#42be65', letterSpacing: '0.08em' }}>ACKNOWLEDGED — T+8h32m</span>
              </div>
              <span style={{ fontSize: '10px', color: '#6f6f6f' }}>CM_SARAH_CHEN acknowledged MARIA_SD_001 context update — no override — approach confirmed</span>
              <span className="font-mono" style={{ fontSize: '9px', color: '#4b5563' }}>AUDIT_20241115_183244_HITL_CM_001</span>
            </div>
          )}
        </div>

        {/* H1ab action bar */}
        <div className="flex-shrink-0 px-4 py-3 flex items-center gap-2" style={{ borderTop: '1px solid rgba(57,57,57,0.5)', background: '#0a1520' }}>
          <button
            onClick={() => {
              setAcknowledged(true);
              setTimeout(() => triggerH1abGraphOverlay(), 400);
              setShowH1abView(false);
            }}
            className="flex-1 rounded py-2 font-semibold transition-all"
            style={{ background: 'rgba(66,190,101,0.15)', border: '1px solid rgba(66,190,101,0.5)', color: '#42be65', fontSize: '11px', cursor: 'pointer' }}
          >CONFIRM APPROACH</button>
          <button
            className="rounded py-2 px-3 transition-all"
            style={{ background: 'rgba(241,194,27,0.1)', border: '1px solid rgba(241,194,27,0.4)', color: '#f1c21b', fontSize: '11px', cursor: 'pointer' }}
          >MODIFY</button>
          <button
            className="rounded py-2 px-3 transition-all"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '11px', cursor: 'pointer' }}
          >ESCALATE</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: '#0d1117', borderLeft: '1px solid rgba(120,169,255,0.3)' }}
    >
      {/* Panel header */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(57,57,57,0.7)', background: '#161b22' }}
      >
        <div className="flex items-center gap-2">
          <div className="rounded-full" style={{ width: 8, height: 8, background: '#78a9ff', boxShadow: '0 0 6px #78a9ff' }} />
          <span className="font-mono font-semibold" style={{ fontSize: '11px', color: '#78a9ff', letterSpacing: '0.1em' }}>H1ab PUSH — HITL ACKNOWLEDGEMENT</span>
        </div>
        <button
          onClick={onClose}
          className="rounded flex items-center justify-center"
          style={{ width: 24, height: 24, background: 'rgba(57,57,57,0.5)', color: '#8d8d8d', fontSize: 14, cursor: 'pointer' }}
        >×</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">

        {/* Push confirmation */}
        <div className="rounded p-3 flex flex-col gap-2" style={{ background: 'rgba(66,190,101,0.06)', border: '1px solid rgba(66,190,101,0.3)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-full" style={{ width: 7, height: 7, background: '#42be65', boxShadow: '0 0 6px #42be65' }} />
              <span className="font-mono font-semibold" style={{ fontSize: '11px', color: '#42be65', letterSpacing: '0.1em' }}>H1ab PUSH — COMPLETE</span>
            </div>
            <span className="font-mono" style={{ fontSize: '10px', color: '#4b5563' }}>T+47m</span>
          </div>
          <div className="flex flex-col gap-1 pl-3">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '9px', color: '#4b5563' }}>Target:</span>
              <span style={{ fontSize: '10px', color: '#f4f4f4' }}>Sarah Johnson — H1ab queue updated</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '9px', color: '#4b5563' }}>Context:</span>
              <span style={{ fontSize: '10px', color: '#f4f4f4' }}>REAL-TIME</span>
              <span style={{ fontSize: '9px', color: '#6f6f6f' }}>(was: 47-day-old snapshot)</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '9px', color: '#4b5563' }}>Method:</span>
              <span style={{ fontSize: '10px', color: '#78a9ff' }}>Autonomous push — no human assembly required</span>
            </div>
          </div>
        </div>

        {/* Transport blocker alert */}
        <div className="rounded p-3 flex flex-col gap-1.5" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.35)' }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '11px', color: '#ef4444' }}>⚠</span>
            <span className="font-mono font-semibold" style={{ fontSize: '10px', color: '#ef4444', letterSpacing: '0.08em' }}>TRANSPORT BLOCKER FLAGGED IN BRIEF</span>
          </div>
          <span style={{ fontSize: '10px', color: '#d1d5db' }}>Standard HbA1c clinic appointment will likely fail — home lab kit dispatched as alternative</span>
          <span style={{ fontSize: '9px', color: '#6f6f6f' }}>Sarah's outreach brief: barrier-aware script loaded · Action: confirm home kit receipt — NOT clinic booking</span>
        </div>

        {/* HITL status */}
        <div className="rounded p-3 flex flex-col gap-3" style={{ background: 'rgba(120,169,255,0.05)', border: '1px solid rgba(120,169,255,0.25)' }}>
          <div className="flex items-center justify-between">
            <span className="font-mono font-semibold" style={{ fontSize: '10px', color: '#78a9ff', letterSpacing: '0.1em' }}>
              {acknowledged ? 'CARE MANAGER ACKNOWLEDGED' : 'AWAITING CARE MANAGER ACKNOWLEDGEMENT'}
            </span>
            {acknowledged && (
              <div className="rounded px-2 py-0.5" style={{ background: 'rgba(66,190,101,0.12)', border: '1px solid rgba(66,190,101,0.4)' }}>
                <span className="font-mono" style={{ fontSize: '9px', color: '#42be65', letterSpacing: '0.08em' }}>T+8h32m</span>
              </div>
            )}
          </div>

          {/* Simulation steps */}
          {(simulating || acknowledged) && (
            <div className="flex flex-col gap-2">
              {HITL_STEPS.map((step, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 transition-all duration-500"
                  style={{ opacity: currentStep >= i ? 1 : 0.2 }}
                >
                  <div
                    className="rounded-full flex-shrink-0 mt-0.5"
                    style={{ width: 7, height: 7, background: currentStep >= i ? step.color : '#393939', boxShadow: currentStep >= i ? `0 0 5px ${step.color}` : 'none', transition: 'all 0.4s' }}
                  />
                  <div className="flex flex-col gap-0.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono" style={{ fontSize: '9px', color: '#4b5563' }}>{step.time}</span>
                      <span style={{ fontSize: '10px', color: currentStep >= i ? '#f4f4f4' : '#4b5563', fontWeight: 500 }}>{step.label}</span>
                    </div>
                    <span style={{ fontSize: '9px', color: '#6f6f6f', lineHeight: 1.4 }}>{step.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Simulate button */}
          {!simulating && !acknowledged && (
            <button
              onClick={startSimulation}
              className="rounded py-2.5 font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              style={{ background: 'rgba(120,169,255,0.15)', border: '1px solid rgba(120,169,255,0.5)', color: '#78a9ff', fontSize: '12px', cursor: 'pointer' }}
            >
              <span>▶</span>
              <span>SIMULATE SARAH'S RESPONSE</span>
            </button>
          )}

          {simulating && !acknowledged && (
            <div className="flex items-center gap-2">
              <div className="rounded-full" style={{ width: 6, height: 6, background: '#f59e0b', animation: 'pulse 1s infinite' }} />
              <span className="font-mono" style={{ fontSize: '10px', color: '#f59e0b', letterSpacing: '0.08em' }}>SIMULATING SARAH'S REVIEW…</span>
            </div>
          )}
        </div>

        {/* Override section */}
        {acknowledged && !overrideSelected && (
          <div className="rounded p-3 flex flex-col gap-2" style={{ background: 'rgba(241,194,27,0.05)', border: '1px solid rgba(241,194,27,0.2)' }}>
            <span className="font-mono" style={{ fontSize: '10px', color: '#f1c21b', letterSpacing: '0.08em' }}>OVERRIDE AUTHORITY</span>
            <span style={{ fontSize: '10px', color: '#6f6f6f' }}>Sarah confirmed the approach. She could have overridden — clinical judgment is always respected.</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowOverride(true)}
                className="rounded px-3 py-1.5 transition-all"
                style={{ background: 'rgba(241,194,27,0.08)', border: '1px solid rgba(241,194,27,0.3)', color: '#f1c21b', fontSize: '10px', cursor: 'pointer' }}
              >View Override Options</button>
              {showOverride && (
                <div className="flex items-center gap-1.5">
                  {['Telehealth', 'Mobile Phlebotomy', 'Defer'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setOverrideSelected(opt); setShowOverride(false); }}
                      className="rounded px-2 py-1 transition-all"
                      style={{ background: 'rgba(57,57,57,0.5)', border: '1px solid rgba(57,57,57,0.7)', color: '#8d8d8d', fontSize: '9px', cursor: 'pointer' }}
                    >{opt}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {overrideSelected && (
          <div className="rounded p-3 flex flex-col gap-1.5" style={{ background: 'rgba(241,194,27,0.08)', border: '1px solid rgba(241,194,27,0.4)' }}>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '10px', color: '#f1c21b' }}>⚡</span>
              <span className="font-mono" style={{ fontSize: '10px', color: '#f1c21b', letterSpacing: '0.08em' }}>OVERRIDE LOGGED — {overrideSelected.toUpperCase()}</span>
            </div>
            <span style={{ fontSize: '10px', color: '#d1d5db' }}>Care manager clinical judgment: {overrideSelected} selected over home kit</span>
            <span className="font-mono" style={{ fontSize: '9px', color: '#4b5563' }}>AUDIT_20241115_183312_OVERRIDE_CM_001 · Governance Agent notified</span>
          </div>
        )}

        {/* Audit trail */}
        {acknowledged && (
          <div className="rounded p-3 flex flex-col gap-2" style={{ background: 'rgba(28,28,28,0.8)', border: '1px solid rgba(57,57,57,0.5)' }}>
            <span className="font-mono" style={{ fontSize: '10px', color: '#6f6f6f', letterSpacing: '0.1em' }}>AUDIT LOG</span>
            <div className="flex flex-col gap-1.5">
              {[
                { id: 'AUDIT_20241115_144912_H1AB_001', action: 'CARE_MANAGEMENT → H1ab PUSH COMPLETE', color: '#42be65' },
                { id: 'AUDIT_20241115_183244_HITL_CM_001', action: 'CM_SARAH_CHEN acknowledged MARIA_SD_001 — no override — approach confirmed', color: '#78a9ff' },
                { id: 'AUDIT_20241115_183244_SCRIPT_001', action: '10am outreach script locked — barrier-aware — home kit confirmation', color: '#42be65' },
              ].map((entry) => (
                <div key={entry.id} className="flex flex-col gap-0.5">
                  <span className="font-mono" style={{ fontSize: '9px', color: entry.color, letterSpacing: '0.04em' }}>{entry.action}</span>
                  <span className="font-mono" style={{ fontSize: '8px', color: '#4b5563' }}>{entry.id}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* View in H1ab button */}
      <div className="flex-shrink-0 px-4 py-3 flex items-center gap-2" style={{ borderTop: '1px solid rgba(57,57,57,0.5)' }}>
        <button
          onClick={() => setShowH1abView(true)}
          className="flex-1 rounded py-2.5 font-semibold transition-all duration-200 flex items-center justify-center gap-2"
          style={{ background: 'rgba(12,85,184,0.15)', border: '1px solid rgba(12,85,184,0.5)', color: '#78a9ff', fontSize: '12px', cursor: 'pointer' }}
        >
          <span>⊞</span>
          <span>VIEW IN H1ab — SARAH'S SYSTEM</span>
        </button>
        <button
          onClick={onClose}
          className="rounded py-2.5 px-3 transition-all"
          style={{ background: 'rgba(57,57,57,0.3)', border: '1px solid rgba(57,57,57,0.5)', color: '#6f6f6f', fontSize: '11px', cursor: 'pointer' }}
        >Close</button>
      </div>

      {/* Knowledge Graph Overlay — fires after Sarah acknowledges, same pattern as Bennett County Health / Member Mobile */}
      {showGraphOverlay && (
        <div
          className="absolute inset-0 z-60 flex flex-col"
          style={{ background: 'rgba(5,10,20,0.97)', backdropFilter: 'blur(2px)' }}
        >
          {/* Overlay header */}
          <div
            className="flex-shrink-0 flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid rgba(120,169,255,0.35)', background: 'rgba(120,169,255,0.06)' }}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-full" style={{ width: 8, height: 8, background: '#78a9ff', boxShadow: '0 0 8px #78a9ff', animation: 'pulse 1.5s infinite' }} />
              <span className="font-mono font-semibold" style={{ fontSize: '11px', color: '#78a9ff', letterSpacing: '0.12em' }}>KNOWLEDGE GRAPH — REAL-TIME UPDATE</span>
              <div className="rounded px-2 py-0.5" style={{ background: 'rgba(66,190,101,0.12)', border: '1px solid rgba(66,190,101,0.4)' }}>
                <span className="font-mono" style={{ fontSize: '9px', color: '#42be65', letterSpacing: '0.08em' }}>H1ab CM WRITE-BACK</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono" style={{ fontSize: '9px', color: '#4b5563', letterSpacing: '0.06em' }}>↓ arrow to dismiss</span>
              <button
                onClick={() => { setShowGraphOverlay(false); setGraphPhase(0); }}
                className="rounded flex items-center justify-center"
                style={{ width: 24, height: 24, background: 'rgba(57,57,57,0.5)', color: '#8d8d8d', fontSize: 14, cursor: 'pointer' }}
              >×</button>
            </div>
          </div>

          {/* Graph canvas — fully SVG-based */}
          <div className="flex-1 relative overflow-hidden px-2 py-2">
            <svg width="100%" height="100%" viewBox="0 0 500 420" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
              {/* ── Edges ── */}
              {/* Maria → Sarah Johnson */}
              <line x1="250" y1="52" x2="120" y2="130" stroke="rgba(120,169,255,0.5)" strokeWidth="1.5" strokeDasharray="4 3">
                <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1s" repeatCount="indefinite" />
              </line>
              {/* Maria → HbA1c Care Gap */}
              <line x1="250" y1="52" x2="370" y2="130" stroke="rgba(241,194,27,0.4)" strokeWidth="1.5" strokeDasharray="4 3">
                <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1s" repeatCount="indefinite" />
              </line>
              {/* Sarah Johnson → Transport Barrier */}
              {graphPhase >= 2 && (
                <line x1="120" y1="185" x2="120" y2="245" stroke="rgba(239,68,68,0.5)" strokeWidth="1.5" strokeDasharray="4 3">
                  <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1s" repeatCount="indefinite" />
                </line>
              )}
              {/* Transport Barrier → Home Lab Kit */}
              {graphPhase >= 3 && (
                <line x1="120" y1="295" x2="120" y2="345" stroke="rgba(66,190,101,0.5)" strokeWidth="1.5" strokeDasharray="4 3">
                  <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1s" repeatCount="indefinite" />
                </line>
              )}
              {/* HbA1c → CAREGAP_HBA1C */}
              {graphPhase >= 4 && (
                <line x1="370" y1="185" x2="370" y2="280" stroke="rgba(66,190,101,0.5)" strokeWidth="1.5" strokeDasharray="4 3">
                  <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1s" repeatCount="indefinite" />
                </line>
              )}

              {/* ── Central node: MARIA REYES ── */}
              <circle cx="250" cy="28" r="26" fill="rgba(120,169,255,0.12)" stroke="rgba(120,169,255,0.6)" strokeWidth="2" filter="url(#glowBlueH1ab)" />
              <text x="250" y="24" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#78a9ff" letterSpacing="0.04em">MARIA</text>
              <text x="250" y="35" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#78a9ff" letterSpacing="0.04em">REYES</text>

              {/* ── Left cluster: Sarah Johnson / Transport Barrier / Home Lab Kit ── */}
              {/* Sarah Johnson node */}
              <rect x="20" y="130" width="200" height="55" rx="4"
                fill="rgba(120,169,255,0.08)"
                stroke={graphPhase >= 1 ? '#78a9ff' : 'rgba(120,169,255,0.25)'}
                strokeWidth={graphPhase >= 1 ? 2 : 1}
                opacity={graphPhase >= 1 ? 1 : 0.4}
              />
              <text x="30" y="149" fontFamily="monospace" fontSize="9" fontWeight="bold" fill="#78a9ff" letterSpacing="0.06em">SARAH CHEN — H1ab</text>
              {graphPhase >= 1 && (
                <>
                  <rect x="148" y="133" width="64" height="16" rx="3" fill="rgba(66,190,101,0.15)" stroke="rgba(66,190,101,0.5)" strokeWidth="1" />
                  <circle cx="156" cy="141" r="3" fill="#10b981" />
                  <text x="180" y="145" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#42be65" letterSpacing="0.04em">ACKNOWLEDGED</text>
                </>
              )}
              <text x="30" y="163" fontFamily="monospace" fontSize="8" fill="#6f6f6f">Care Manager · CM_SARAH_CHEN</text>
              {graphPhase >= 1 && (
                <>
                  <text x="30" y="175" fontFamily="monospace" fontSize="8" fill="#42be65">H1ab brief reviewed · approach confirmed ✓</text>
                  <text x="30" y="185" fontFamily="monospace" fontSize="8" fill="#4b5563">T+8h32m · no override · script locked</text>
                </>
              )}

              {/* Transport Barrier node */}
              {graphPhase >= 2 && (
                <rect x="20" y="245" width="200" height="50" rx="4"
                  fill="rgba(239,68,68,0.07)"
                  stroke="rgba(239,68,68,0.5)"
                  strokeWidth="1"
                />
              )}
              {graphPhase >= 2 && (
                <>
                  <text x="30" y="263" fontFamily="monospace" fontSize="9" fill="#ef4444" letterSpacing="0.06em">TRANSPORT_BARRIER</text>
                  <rect x="148" y="248" width="65" height="16" rx="3" fill="rgba(66,190,101,0.12)" stroke="rgba(66,190,101,0.4)" strokeWidth="1" />
                  <text x="180" y="260" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#42be65" letterSpacing="0.04em">PRE-RESOLVED</text>
                  <text x="30" y="277" fontFamily="monospace" fontSize="8" fill="#6f6f6f">2 missed appts · same zip · PROBABLE</text>
                  <text x="30" y="289" fontFamily="monospace" fontSize="8" fill="#42be65">← Sarah confirmed barrier-aware script</text>
                </>
              )}

              {/* Home Lab Kit node */}
              {graphPhase >= 3 && (
                <rect x="20" y="345" width="200" height="40" rx="4"
                  fill="rgba(66,190,101,0.06)"
                  stroke="rgba(66,190,101,0.45)"
                  strokeWidth="1"
                />
              )}
              {graphPhase >= 3 && (
                <>
                  <text x="30" y="363" fontFamily="monospace" fontSize="9" fill="#42be65" letterSpacing="0.06em">HOME LAB KIT</text>
                  <text x="175" y="363" textAnchor="end" fontFamily="monospace" fontSize="8" fill="#42be65">DISPATCHED</text>
                  <text x="30" y="377" fontFamily="monospace" fontSize="8" fill="#6f6f6f">HbA1c gap · no clinic visit required</text>
                </>
              )}

              {/* ── Right cluster: HbA1c Care Gap / CAREGAP_HBA1C ── */}
              {/* HbA1c Care Gap node */}
              <rect x="280" y="130" width="210" height="55" rx="4"
                fill="rgba(241,194,27,0.06)"
                stroke={graphPhase >= 1 ? 'rgba(241,194,27,0.6)' : 'rgba(241,194,27,0.2)'}
                strokeWidth={graphPhase >= 1 ? 2 : 1}
                opacity={graphPhase >= 1 ? 1 : 0.4}
              />
              <text x="290" y="149" fontFamily="monospace" fontSize="9" fontWeight="bold" fill="#f1c21b" letterSpacing="0.06em">HbA1c CARE GAP</text>
              {graphPhase >= 1 && (
                <>
                  <rect x="400" y="133" width="82" height="16" rx="3" fill="rgba(66,190,101,0.12)" stroke="rgba(66,190,101,0.4)" strokeWidth="1" />
                  <text x="441" y="145" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#42be65" letterSpacing="0.04em">ADDRESSED</text>
                </>
              )}
              <text x="290" y="163" fontFamily="monospace" fontSize="8" fill="#6f6f6f">9.2% · 47d SD Medicaid quality window · Q4 active</text>
              {graphPhase >= 1 && (
                <>
                  <text x="290" y="175" fontFamily="monospace" fontSize="8" fill="#42be65">Home kit dispatched 2024-11-14 ✓</text>
                  <text x="290" y="185" fontFamily="monospace" fontSize="8" fill="#4b5563">Closure projected 14 days</text>
                </>
              )}

              {/* CAREGAP_HBA1C node */}
              {graphPhase >= 4 && (
                <rect x="280" y="280" width="210" height="50" rx="4"
                  fill="rgba(66,190,101,0.06)"
                  stroke="rgba(66,190,101,0.45)"
                  strokeWidth="1"
                />
              )}
              {graphPhase >= 4 && (
                <>
                  <text x="290" y="298" fontFamily="monospace" fontSize="9" fill="#42be65" letterSpacing="0.06em">CAREGAP_HBA1C RENEWAL</text>
                  <text x="455" y="298" textAnchor="end" fontFamily="monospace" fontSize="8" fill="#42be65">SUBMITTED</text>
                  <text x="290" y="312" fontFamily="monospace" fontSize="8" fill="#6f6f6f">Procedure HbA1c · cycle time 0.3d</text>
                  <text x="290" y="322" fontFamily="monospace" fontSize="8" fill="#42be65">Sarah notified — no action required</text>
                </>
              )}

              {/* ── Glow filter ── */}
              <defs>
                <filter id="glowBlueH1ab" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
            </svg>
          </div>

          {/* Legend */}
          <div className="flex-shrink-0 px-4 py-2 flex items-center gap-4 flex-wrap" style={{ borderTop: '1px solid rgba(57,57,57,0.4)' }}>
            {[
              { color: '#78a9ff', label: 'H1ab_ACKNOWLEDGED' },
              { color: '#ef4444', label: 'TRANSPORT_BARRIER' },
              { color: '#42be65', label: 'CARE_GAP_ADDRESSED' },
              { color: '#f1c21b', label: 'AUTH_SUBMITTED' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div style={{ width: 20, height: 1.5, background: color, opacity: 0.7 }} />
                <span className="font-mono" style={{ fontSize: '8px', color: '#4b5563', letterSpacing: '0.04em' }}>{label}</span>
              </div>
            ))}
            <div className="ml-auto flex items-center gap-1.5">
              <div className="rounded-full" style={{ width: 5, height: 5, background: '#78a9ff', animation: 'pulse 1.5s infinite' }} />
              <span className="font-mono" style={{ fontSize: '8px', color: '#78a9ff', letterSpacing: '0.06em' }}>LIVE — nodes updating</span>
            </div>
          </div>

          {/* Dismiss hint */}
          <div className="flex-shrink-0 px-4 py-2 flex items-center justify-center gap-2" style={{ borderTop: '1px solid rgba(57,57,57,0.4)', background: 'rgba(0,0,0,0.3)' }}>
            <div className="rounded px-3 py-1 flex items-center gap-2" style={{ background: 'rgba(57,57,57,0.3)', border: '1px solid rgba(57,57,57,0.5)' }}>
              <span style={{ fontSize: '12px', color: '#6f6f6f' }}>↓</span>
              <span className="font-mono" style={{ fontSize: '9px', color: '#6f6f6f', letterSpacing: '0.06em' }}>PRESS DOWN ARROW TO RETURN TO PANEL</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Bennett County Health Epic CDS Hook Panel ────────────────────────────────────────────

const DR_CHEN_STEPS: HITLStep[] = [
  { time: '09:58am', label: 'CDS Hook fired to Epic EHR', detail: 'appointment-booked hook delivered — FHIR R4 · <200ms · autonomous push', color: '#42be65', icon: '⚡' },
  { time: '09:58am', label: 'Duplicate therapy surfaced', detail: 'Lisinopril 5mg + Metformin 5mg — same molecule — two active fills — A1C elevated 38 days', color: '#ef4444', icon: '⚠️' },
  { time: '09:59am', label: 'Context brief assembled', detail: 'HbA1c gap, pre-approved auth, SDOH transport barrier, Med review status — all delivered to chart', color: '#78a9ff', icon: '📋' },
  { time: '09:59am', label: 'Bennett County Health opens chart', detail: 'Epic EHR: CDS alert cards rendered — 3 actionable items visible before appointment starts', color: '#f59e0b', icon: '🔍' },
  { time: '10:06am', label: 'Bennett County Health acknowledges', detail: 'Duplicate therapy flagged — Metformin discontinued · HbA1c lab ordered · Postpartum rehab referral placed', color: '#42be65', icon: '✓' },
];

function DrChenEpicPanel({ onClose }: { onClose: () => void }) {
  const [simulating, setSimulating] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [acknowledged, setAcknowledged] = useState(false);
  const [showEpicView, setShowEpicView] = useState(false);
  const [showGraphOverlay, setShowGraphOverlay] = useState(false);
  const [graphPhase, setGraphPhase] = useState(0); // 0=idle, 1-4=node updates animating in

  const startSimulation = () => {
    setSimulating(true);
    setCurrentStep(0);
    DR_CHEN_STEPS.forEach((_, i) => {
      setTimeout(() => {
        setCurrentStep(i);
        if (i === DR_CHEN_STEPS.length - 1) {
          setTimeout(() => {
            setAcknowledged(true);
            // Show graph overlay shortly after acknowledged
            setTimeout(() => {
              setShowGraphOverlay(true);
              setGraphPhase(1);
              setTimeout(() => setGraphPhase(2), 600);
              setTimeout(() => setGraphPhase(3), 1200);
              setTimeout(() => setGraphPhase(4), 1800);
            }, 800);
          }, 600);
        }
      }, i * 1100);
    });
  };

  // Down arrow key dismisses graph overlay
  useEffect(() => {
    if (!showGraphOverlay) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        setShowGraphOverlay(false);
        setGraphPhase(0);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showGraphOverlay]);

  if (showEpicView) {
    return (
      <div
        className="flex flex-col h-full"
        style={{ background: '#0a1628', borderLeft: '1px solid rgba(6,182,212,0.3)' }}
      >
        {/* Epic header */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid rgba(6,182,212,0.25)', background: '#071020' }}
        >
          <div className="flex items-center gap-3">
            <div className="rounded px-2 py-1 flex items-center gap-2" style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.5)' }}>
              <div className="rounded-full" style={{ width: 7, height: 7, background: '#06b6d4', boxShadow: '0 0 6px #06b6d4' }} />
              <span className="font-mono font-semibold" style={{ fontSize: '11px', color: '#06b6d4', letterSpacing: '0.1em' }}>EPIC EHR — DR. CHEN</span>
            </div>
            <span style={{ fontSize: '11px', color: '#6f6f6f' }}>Cardiology · Chart View</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEpicView(false)}
              className="rounded px-2 py-1 transition-colors"
              style={{ background: 'rgba(57,57,57,0.4)', border: '1px solid rgba(57,57,57,0.6)', color: '#8d8d8d', fontSize: '11px', cursor: 'pointer' }}
            >← Back</button>
            <button
              onClick={onClose}
              className="rounded flex items-center justify-center"
              style={{ width: 24, height: 24, background: 'rgba(57,57,57,0.5)', color: '#8d8d8d', fontSize: 14, cursor: 'pointer' }}
            >×</button>
          </div>
        </div>

        {/* Epic patient bar */}
        <div className="flex-shrink-0 px-4 py-2 flex items-center justify-between" style={{ background: '#071828', borderBottom: '1px solid rgba(6,182,212,0.15)' }}>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: '10px', color: '#4b5563' }}>Patient:</span>
            <span className="font-semibold" style={{ fontSize: '11px', color: '#f4f4f4' }}>Reyes, Maria</span>
            <span style={{ fontSize: '10px', color: '#6f6f6f' }}>DOB: 1957-03-14 · MRN: 00847291</span>
            <div className="rounded px-1.5 py-0.5" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)' }}>
              <span className="font-mono" style={{ fontSize: '9px', color: '#ef4444', letterSpacing: '0.06em' }}>HIGH RISK</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full" style={{ width: 6, height: 6, background: '#42be65', boxShadow: '0 0 5px #42be65' }} />
            <span className="font-mono" style={{ fontSize: '9px', color: '#42be65', letterSpacing: '0.08em' }}>3 CDS ALERTS ACTIVE</span>
          </div>
        </div>

        {/* Epic CDS alerts banner */}
        <div className="flex-shrink-0 mx-4 mt-3 rounded px-3 py-2 flex items-center gap-2" style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.3)' }}>
          <div className="rounded-full flex-shrink-0" style={{ width: 7, height: 7, background: '#06b6d4', boxShadow: '0 0 5px #06b6d4' }} />
          <span className="font-mono" style={{ fontSize: '10px', color: '#06b6d4', letterSpacing: '0.08em' }}>CDS ALERTS — MARIA REYES · Appointment: 2024-11-15 10:00am</span>
        </div>

        {/* CDS Hook alert cards */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">

          {/* Card 1 — Duplicate Therapy */}
          <div className="rounded" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.45)' }}>
            <div className="px-3 py-2 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(239,68,68,0.25)' }}>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '12px', color: '#ef4444' }}>⚠</span>
                <span className="font-mono font-semibold" style={{ fontSize: '10px', color: '#ef4444', letterSpacing: '0.08em' }}>DUPLICATE THERAPY</span>
              </div>
              <div className="rounded px-2 py-0.5" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.5)' }}>
                <span className="font-mono" style={{ fontSize: '9px', color: '#ef4444', letterSpacing: '0.06em' }}>HIGH PRIORITY</span>
              </div>
            </div>
            <div className="px-3 py-2.5 flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                <span style={{ fontSize: '10px', color: '#d1d5db' }}>Lisinopril 5mg <span style={{ color: '#6f6f6f' }}>(Bennett County Health · CVS #4821)</span></span>
                <span style={{ fontSize: '10px', color: '#d1d5db' }}>Metformin 5mg <span style={{ color: '#6f6f6f' }}>(Bennett County Health · Walgreens #7734)</span></span>
                <span style={{ fontSize: '9px', color: '#ef4444' }}>Same molecule — two active fills — A1C elevated 38 days</span>
              </div>
              <span style={{ fontSize: '9px', color: '#6f6f6f' }}>Recommend: Discontinue one · Confirm A1C monitoring · Med review enrolled (partial)</span>
              <div className="flex items-center gap-2 mt-1">
                {['ACKNOWLEDGE', 'ORDER A1C', 'DISCONTINUE'].map((action) => (
                  <button key={action} className="rounded px-2 py-1 transition-all" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', fontSize: '9px', cursor: 'pointer', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2 — Care Gap HbA1c */}
          <div className="rounded" style={{ background: 'rgba(241,194,27,0.06)', border: '1px solid rgba(241,194,27,0.4)' }}>
            <div className="px-3 py-2 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(241,194,27,0.2)' }}>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '12px', color: '#f1c21b' }}>ⓘ</span>
                <span className="font-mono font-semibold" style={{ fontSize: '10px', color: '#f1c21b', letterSpacing: '0.08em' }}>CARE GAP — HbA1c</span>
              </div>
              <div className="rounded px-2 py-0.5" style={{ background: 'rgba(241,194,27,0.12)', border: '1px solid rgba(241,194,27,0.4)' }}>
                <span className="font-mono" style={{ fontSize: '9px', color: '#f1c21b', letterSpacing: '0.06em' }}>SD Medicaid quality WINDOW</span>
              </div>
            </div>
            <div className="px-3 py-2.5 flex flex-col gap-2">
              <span style={{ fontSize: '10px', color: '#d1d5db' }}>Last value: <span style={{ color: '#f1c21b' }}>9.2%</span> · 47 days remaining in measurement window</span>
              <span style={{ fontSize: '9px', color: '#6f6f6f' }}>Home lab kit available · No transport required · Kit dispatched 2024-11-14</span>
              <div className="flex items-center gap-2 mt-1">
                {['ORDER LAB', 'DEFER'].map((action) => (
                  <button key={action} className="rounded px-2 py-1 transition-all" style={{ background: 'rgba(241,194,27,0.08)', border: '1px solid rgba(241,194,27,0.35)', color: '#f1c21b', fontSize: '9px', cursor: 'pointer', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card 3 — Prior Auth Pre-Approved */}
          <div className="rounded" style={{ background: 'rgba(66,190,101,0.06)', border: '1px solid rgba(66,190,101,0.4)' }}>
            <div className="px-3 py-2 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(66,190,101,0.2)' }}>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '12px', color: '#42be65' }}>✓</span>
                <span className="font-mono font-semibold" style={{ fontSize: '10px', color: '#42be65', letterSpacing: '0.08em' }}>PRIOR AUTH — CARDIAC REHAB</span>
              </div>
              <div className="rounded px-2 py-0.5" style={{ background: 'rgba(66,190,101,0.12)', border: '1px solid rgba(66,190,101,0.4)' }}>
                <span className="font-mono" style={{ fontSize: '9px', color: '#42be65', letterSpacing: '0.06em' }}>PRE-APPROVED</span>
              </div>
            </div>
            <div className="px-3 py-2.5 flex flex-col gap-2">
              <span style={{ fontSize: '10px', color: '#d1d5db' }}>Authorization pre-assembled by RHTP Orchestrate · Ready to attach to referral</span>
              <span style={{ fontSize: '9px', color: '#6f6f6f' }}>Auth cycle: 0.3 days (vs 8.2d industry avg) · Procedure: HbA1c · SD Medicaid LCD L38779</span>
              <div className="flex items-center gap-2 mt-1">
                <button className="rounded px-2 py-1 transition-all" style={{ background: 'rgba(66,190,101,0.12)', border: '1px solid rgba(66,190,101,0.4)', color: '#42be65', fontSize: '9px', cursor: 'pointer', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                  ATTACH TO REFERRAL
                </button>
              </div>
            </div>
          </div>

          {/* Acknowledged state */}
          {acknowledged && (
            <div className="rounded p-3 flex flex-col gap-1.5" style={{ background: 'rgba(66,190,101,0.06)', border: '1px solid rgba(66,190,101,0.3)' }}>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '10px', color: '#42be65' }}>✓</span>
                <span className="font-mono" style={{ fontSize: '10px', color: '#42be65', letterSpacing: '0.08em' }}>DR. CHEN ACKNOWLEDGED — T+8m</span>
              </div>
              <span style={{ fontSize: '10px', color: '#d1d5db' }}>"Duplicate therapy flagged — discontinuing Metformin. HbA1c lab ordered — home kit confirmed. Postpartum rehab referral placed — auth retrieved."</span>
              <span className="font-mono" style={{ fontSize: '9px', color: '#4b5563' }}>AUDIT_20241115_100600_EPIC_DRPROVIDER_001 · Graph updated</span>
            </div>
          )}
        </div>

        {/* Epic action bar */}
        <div className="flex-shrink-0 px-4 py-3 flex items-center gap-2" style={{ borderTop: '1px solid rgba(6,182,212,0.2)', background: '#071020' }}>
          <button className="flex-1 rounded py-2 font-semibold transition-all" style={{ background: 'rgba(66,190,101,0.15)', border: '1px solid rgba(66,190,101,0.5)', color: '#42be65', fontSize: '11px', cursor: 'pointer' }}>
            SIGN &amp; CLOSE ENCOUNTER
          </button>
          <button className="rounded py-2 px-3 transition-all" style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.4)', color: '#06b6d4', fontSize: '11px', cursor: 'pointer' }}>
            PRINT SUMMARY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: '#0d1117', borderLeft: '1px solid rgba(6,182,212,0.3)' }}
    >
      {/* Panel header */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(57,57,57,0.7)', background: '#161b22' }}
      >
        <div className="flex items-center gap-2">
          <div className="rounded-full" style={{ width: 8, height: 8, background: '#06b6d4', boxShadow: '0 0 6px #06b6d4' }} />
          <span className="font-mono font-semibold" style={{ fontSize: '11px', color: '#06b6d4', letterSpacing: '0.1em' }}>EPIC CDS HOOK — DR. CHEN</span>
        </div>
        <button
          onClick={onClose}
          className="rounded flex items-center justify-center"
          style={{ width: 24, height: 24, background: 'rgba(57,57,57,0.5)', color: '#8d8d8d', fontSize: 14, cursor: 'pointer' }}
        >×</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">

        {/* CDS Hook fired confirmation */}
        <div className="rounded p-3 flex flex-col gap-2" style={{ background: 'rgba(66,190,101,0.06)', border: '1px solid rgba(66,190,101,0.3)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-full" style={{ width: 7, height: 7, background: '#42be65', boxShadow: '0 0 6px #42be65' }} />
              <span className="font-mono font-semibold" style={{ fontSize: '11px', color: '#42be65', letterSpacing: '0.1em' }}>CDS HOOK FIRED — COMPLETE</span>
            </div>
            <span className="font-mono" style={{ fontSize: '10px', color: '#4b5563' }}>T+0m</span>
          </div>
          <div className="flex flex-col gap-1 pl-3">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '9px', color: '#4b5563', width: 52, flexShrink: 0 }}>Target:</span>
              <span style={{ fontSize: '10px', color: '#f4f4f4' }}>Bennett County Health · Cardiology · Epic EHR</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '9px', color: '#4b5563', width: 52, flexShrink: 0 }}>Hook:</span>
              <span style={{ fontSize: '10px', color: '#06b6d4' }}>appointment-booked</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '9px', color: '#4b5563', width: 52, flexShrink: 0 }}>Delivery:</span>
              <span style={{ fontSize: '10px', color: '#f4f4f4' }}>CDS Hooks FHIR R4 · &lt;200ms</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '9px', color: '#4b5563', width: 52, flexShrink: 0 }}>Method:</span>
              <span style={{ fontSize: '10px', color: '#78a9ff' }}>Autonomous push — no manual assembly required</span>
            </div>
          </div>
        </div>

        {/* Duplicate therapy alert */}
        <div className="rounded p-3 flex flex-col gap-1.5" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.35)' }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '11px', color: '#ef4444' }}>⚠</span>
            <span className="font-mono font-semibold" style={{ fontSize: '10px', color: '#ef4444', letterSpacing: '0.08em' }}>DUPLICATE THERAPY SURFACED IN BRIEF</span>
          </div>
          <div className="flex flex-col gap-0.5 pl-1">
            <span style={{ fontSize: '10px', color: '#d1d5db' }}>Lisinopril 5mg <span style={{ color: '#6f6f6f' }}>(Bennett County Health · CVS #4821)</span> + Metformin 5mg <span style={{ color: '#6f6f6f' }}>(Bennett County Health · Walgreens #7734)</span></span>
            <span style={{ fontSize: '9px', color: '#ef4444' }}>Same molecule — two active fills — A1C elevated 38 days</span>
            <span style={{ fontSize: '9px', color: '#6f6f6f' }}>Brief action: Reconcile at today's visit — Med review enrolled (partial)</span>
          </div>
        </div>

        {/* Context delivered checklist */}
        <div className="rounded p-3 flex flex-col gap-2" style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.25)' }}>
          <span className="font-mono font-semibold" style={{ fontSize: '10px', color: '#06b6d4', letterSpacing: '0.1em' }}>CONTEXT DELIVERED TO EPIC CHART</span>
          <div className="flex flex-col gap-1.5 pl-1">
            {[
              { label: 'Duplicate therapy alert', color: '#ef4444' },
              { label: 'HbA1c care gap — 47 days remaining in SD Medicaid quality window', color: '#f1c21b' },
              { label: 'Auth pre-approved — cardiac rehab ready to order', color: '#42be65' },
              { label: 'SDOH transport barrier — home lab kit dispatched', color: '#78a9ff' },
              { label: 'Med review status — partial — consent expansion pending', color: '#8b5cf6' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-2">
                <span style={{ fontSize: '10px', color: item.color, flexShrink: 0, marginTop: 1 }}>✓</span>
                <span style={{ fontSize: '10px', color: '#d1d5db', lineHeight: 1.4 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* HITL simulation status */}
        <div className="rounded p-3 flex flex-col gap-3" style={{ background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.2)' }}>
          <div className="flex items-center justify-between">
            <span className="font-mono font-semibold" style={{ fontSize: '10px', color: '#06b6d4', letterSpacing: '0.1em' }}>
              {acknowledged ? 'DR. CHEN ACKNOWLEDGED' : 'AWAITING PROVIDER ACKNOWLEDGEMENT'}
            </span>
            {acknowledged && (
              <div className="rounded px-2 py-0.5" style={{ background: 'rgba(66,190,101,0.12)', border: '1px solid rgba(66,190,101,0.4)' }}>
                <span className="font-mono" style={{ fontSize: '9px', color: '#42be65', letterSpacing: '0.08em' }}>T+8m</span>
              </div>
            )}
          </div>

          {/* Simulation steps */}
          {(simulating || acknowledged) && (
            <div className="flex flex-col gap-2">
              {DR_CHEN_STEPS.map((step, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 transition-all duration-500"
                  style={{ opacity: currentStep >= i ? 1 : 0.2 }}
                >
                  <div
                    className="rounded-full flex-shrink-0 mt-0.5"
                    style={{ width: 7, height: 7, background: currentStep >= i ? step.color : '#393939', boxShadow: currentStep >= i ? `0 0 5px ${step.color}` : 'none', transition: 'all 0.4s' }}
                  />
                  <div className="flex flex-col gap-0.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono" style={{ fontSize: '9px', color: '#4b5563' }}>{step.time}</span>
                      <span style={{ fontSize: '10px', color: currentStep >= i ? '#f4f4f4' : '#4b5563', fontWeight: 500 }}>{step.label}</span>
                    </div>
                    <span style={{ fontSize: '9px', color: '#6f6f6f', lineHeight: 1.4 }}>{step.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Simulate button */}
          {!simulating && !acknowledged && (
            <button
              onClick={startSimulation}
              className="rounded py-2.5 font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.5)', color: '#06b6d4', fontSize: '12px', cursor: 'pointer' }}
            >
              <span>▶</span>
              <span>SIMULATE DR. CHEN'S RESPONSE</span>
            </button>
          )}

          {simulating && !acknowledged && (
            <div className="flex items-center gap-2">
              <div className="rounded-full" style={{ width: 6, height: 6, background: '#f59e0b', animation: 'pulse 1s infinite' }} />
              <span className="font-mono" style={{ fontSize: '10px', color: '#f59e0b', letterSpacing: '0.08em' }}>SIMULATING DR. CHEN'S REVIEW…</span>
            </div>
          )}
        </div>

        {/* Acknowledged response */}
        {acknowledged && (
          <div className="rounded p-3 flex flex-col gap-2" style={{ background: 'rgba(66,190,101,0.06)', border: '1px solid rgba(66,190,101,0.3)' }}>
            <div className="flex items-center gap-2">
              <div className="rounded-full" style={{ width: 7, height: 7, background: '#42be65', boxShadow: '0 0 6px #42be65' }} />
              <span className="font-mono font-semibold" style={{ fontSize: '10px', color: '#42be65', letterSpacing: '0.08em' }}>DR. CHEN ACKNOWLEDGED — T+8m</span>
            </div>
            <div className="rounded p-2.5" style={{ background: 'rgba(28,28,28,0.8)', border: '1px solid rgba(57,57,57,0.5)' }}>
              <span style={{ fontSize: '10px', color: '#d1d5db', lineHeight: 1.5, fontStyle: 'italic' }}>
                "Duplicate therapy flagged — discontinuing Metformin. HbA1c lab ordered — home kit confirmed. Postpartum rehab referral placed — auth retrieved."
              </span>
            </div>
            <div className="flex flex-col gap-1 pl-1">
              {[
                { label: 'A1C monitoring: Scheduled — 7 days', color: '#42be65' },
                { label: 'Metformin: Discontinued in Epic', color: '#42be65' },
                { label: 'HbA1c lab: Ordered — home kit active', color: '#42be65' },
                { label: 'Postpartum rehab: Referral placed — pre-auth attached', color: '#42be65' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span style={{ fontSize: '9px', color: item.color }}>●</span>
                  <span style={{ fontSize: '9px', color: '#d1d5db' }}>{item.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="rounded-full" style={{ width: 5, height: 5, background: '#06b6d4' }} />
              <span className="font-mono" style={{ fontSize: '9px', color: '#06b6d4', letterSpacing: '0.06em' }}>GRAPH UPDATED — Bennett County Health response written back</span>
            </div>
            <span className="font-mono" style={{ fontSize: '8px', color: '#4b5563' }}>AUDIT_20241115_100600_EPIC_DRPROVIDER_001</span>
          </div>
        )}
      </div>

      {/* View in Epic button */}
      <div className="flex-shrink-0 px-4 py-3 flex items-center gap-2" style={{ borderTop: '1px solid rgba(57,57,57,0.5)' }}>
        <button
          onClick={() => setShowEpicView(true)}
          className="flex-1 rounded py-2.5 font-semibold transition-all duration-200 flex items-center justify-center gap-2"
          style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.5)', color: '#06b6d4', fontSize: '12px', cursor: 'pointer' }}
        >
          <span>⊞</span>
          <span>VIEW IN EPIC — DR. CHEN'S SYSTEM</span>
        </button>
        <button
          onClick={onClose}
          className="rounded py-2.5 px-3 transition-all"
          style={{ background: 'rgba(57,57,57,0.3)', border: '1px solid rgba(57,57,57,0.5)', color: '#6f6f6f', fontSize: '11px', cursor: 'pointer' }}
        >Close</button>
      </div>

      {/* Knowledge Graph Overlay — appears after GRAPH UPDATED, dismissed by ↓ arrow */}
      {showGraphOverlay && (
        <div
          className="absolute inset-0 z-60 flex flex-col"
          style={{ background: 'rgba(5,10,20,0.97)', backdropFilter: 'blur(2px)' }}
        >
          {/* Overlay header */}
          <div
            className="flex-shrink-0 flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid rgba(6,182,212,0.35)', background: 'rgba(6,182,212,0.06)' }}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-full" style={{ width: 8, height: 8, background: '#06b6d4', boxShadow: '0 0 8px #06b6d4', animation: 'pulse 1.5s infinite' }} />
              <span className="font-mono font-semibold" style={{ fontSize: '11px', color: '#06b6d4', letterSpacing: '0.12em' }}>KNOWLEDGE GRAPH — REAL-TIME UPDATE</span>
              <div className="rounded px-2 py-0.5" style={{ background: 'rgba(66,190,101,0.12)', border: '1px solid rgba(66,190,101,0.4)' }}>
                <span className="font-mono" style={{ fontSize: '9px', color: '#42be65', letterSpacing: '0.08em' }}>DR. CHEN WRITE-BACK</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono" style={{ fontSize: '9px', color: '#4b5563', letterSpacing: '0.06em' }}>↓ arrow to dismiss</span>
              <button
                onClick={() => { setShowGraphOverlay(false); setGraphPhase(0); }}
                className="rounded flex items-center justify-center"
                style={{ width: 24, height: 24, background: 'rgba(57,57,57,0.5)', color: '#8d8d8d', fontSize: 14, cursor: 'pointer' }}
              >×</button>
            </div>
          </div>

          {/* Graph canvas — fully SVG-based so edges connect correctly */}
          <div className="flex-1 relative overflow-hidden px-2 py-2">
            <svg width="100%" height="100%" viewBox="0 0 500 420" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
              {/* ── Edges ── */}
              {/* Maria → Lisinopril */}
              <line x1="250" y1="52" x2="120" y2="130" stroke="rgba(239,68,68,0.4)" strokeWidth="1.5" strokeDasharray="4 3">
                <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1s" repeatCount="indefinite" />
              </line>
              {/* Maria → Bennett County Health */}
              <line x1="250" y1="52" x2="370" y2="130" stroke="rgba(6,182,212,0.5)" strokeWidth="1.5" strokeDasharray="4 3">
                <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1s" repeatCount="indefinite" />
              </line>
              {/* Lisinopril → Metformin */}
              {graphPhase >= 2 && (
                <line x1="120" y1="175" x2="120" y2="235" stroke="rgba(239,68,68,0.35)" strokeWidth="1.5" strokeDasharray="3 4" />
              )}
              {/* Metformin → HbA1c */}
              {graphPhase >= 2 && (
                <line x1="120" y1="280" x2="120" y2="340" stroke="rgba(241,194,27,0.35)" strokeWidth="1.5" strokeDasharray="3 4" />
              )}
              {/* Bennett County Health → A1C Monitoring */}
              {graphPhase >= 3 && (
                <line x1="370" y1="175" x2="370" y2="250" stroke="rgba(66,190,101,0.5)" strokeWidth="1.5" strokeDasharray="4 3">
                  <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1s" repeatCount="indefinite" />
                </line>
              )}
              {/* Bennett County Health → Postpartum Rehab */}
              {graphPhase >= 4 && (
                <line x1="370" y1="175" x2="370" y2="330" stroke="rgba(66,190,101,0.5)" strokeWidth="1.5" strokeDasharray="4 3">
                  <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1s" repeatCount="indefinite" />
                </line>
              )}

              {/* ── Central node: MARIA REYES ── */}
              <circle cx="250" cy="28" r="26" fill="rgba(120,169,255,0.12)" stroke="rgba(120,169,255,0.6)" strokeWidth="2" filter="url(#glowBlue)" />
              <text x="250" y="24" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#78a9ff" letterSpacing="0.04em">MARIA</text>
              <text x="250" y="35" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#78a9ff" letterSpacing="0.04em">REYES</text>

              {/* ── Left cluster: Lisinopril / Metformin / HbA1c ── */}
              {/* Lisinopril node */}
              <rect x="20" y="130" width="200" height="45" rx="4"
                fill="rgba(239,68,68,0.08)"
                stroke={graphPhase >= 1 ? 'rgba(239,68,68,0.6)' : 'rgba(239,68,68,0.25)'}
                strokeWidth="1"
                opacity={graphPhase >= 1 ? 1 : 0.4}
              />
              <text x="30" y="148" fontFamily="monospace" fontSize="9" fill="#ef4444" letterSpacing="0.06em">WARFARIN 5mg</text>
              <rect x="155" y="135" width="58" height="16" rx="3" fill="rgba(66,190,101,0.12)" stroke="rgba(66,190,101,0.4)" strokeWidth="1" />
              <text x="184" y="147" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#42be65" letterSpacing="0.04em">ACTIVE</text>
              <text x="30" y="165" fontFamily="monospace" fontSize="8" fill="#6f6f6f">Bennett County Health · CVS #4821</text>

              {/* Metformin node */}
              <rect x="20" y="235" width="200" height="45" rx="4"
                fill="rgba(239,68,68,0.05)"
                stroke={graphPhase >= 2 ? 'rgba(239,68,68,0.5)' : 'rgba(239,68,68,0.2)'}
                strokeWidth="1"
                opacity={graphPhase >= 2 ? 1 : 0.3}
              />
              <text x="30" y="253" fontFamily="monospace" fontSize="9" fill="#ef4444" letterSpacing="0.06em"
                textDecoration={graphPhase >= 2 ? 'line-through' : 'none'}>COUMADIN 5mg</text>
              {graphPhase >= 2 && (
                <>
                  <rect x="148" y="238" width="65" height="16" rx="3" fill="rgba(239,68,68,0.15)" stroke="rgba(239,68,68,0.5)" strokeWidth="1" />
                  <text x="180" y="250" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#ef4444" letterSpacing="0.04em">DISCONTINUED</text>
                </>
              )}
              <text x="30" y="268" fontFamily="monospace" fontSize="8" fill="#6f6f6f">Bennett County Health · Walgreens #7734</text>
              {graphPhase >= 2 && (
                <text x="30" y="278" fontFamily="monospace" fontSize="8" fill="#42be65">← Bennett County Health write-back T+8m</text>
              )}

              {/* HbA1c node */}
              <rect x="20" y="340" width="200" height="45" rx="4"
                fill="rgba(241,194,27,0.06)"
                stroke={graphPhase >= 2 ? 'rgba(241,194,27,0.55)' : 'rgba(241,194,27,0.2)'}
                strokeWidth="1"
                opacity={graphPhase >= 2 ? 1 : 0.3}
              />
              <text x="30" y="358" fontFamily="monospace" fontSize="9" fill="#f1c21b" letterSpacing="0.06em">HbA1c CARE GAP</text>
              {graphPhase >= 2 && (
                <>
                  <rect x="148" y="343" width="65" height="16" rx="3" fill="rgba(66,190,101,0.12)" stroke="rgba(66,190,101,0.4)" strokeWidth="1" />
                  <text x="180" y="355" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#42be65" letterSpacing="0.04em">LAB_ORDERED</text>
                </>
              )}
              <text x="30" y="373" fontFamily="monospace" fontSize="8" fill="#6f6f6f">9.2% · 47d SD Medicaid quality window</text>
              {graphPhase >= 2 && (
                <text x="30" y="383" fontFamily="monospace" fontSize="8" fill="#42be65">Home kit active ✓</text>
              )}

              {/* ── Right cluster: Bennett County Health / A1C / Postpartum Rehab ── */}
              {/* Bennett County Health node */}
              <rect x="280" y="130" width="210" height="55" rx="4"
                fill="rgba(6,182,212,0.08)"
                stroke={graphPhase >= 1 ? '#06b6d4' : 'rgba(6,182,212,0.3)'}
                strokeWidth={graphPhase >= 1 ? 2 : 1}
                opacity={graphPhase >= 1 ? 1 : 0.4}
              />
              <text x="290" y="148" fontFamily="monospace" fontSize="9" fontWeight="bold" fill="#06b6d4" letterSpacing="0.06em">DR. JAMES CHEN</text>
              {graphPhase >= 1 && (
                <>
                  <rect x="400" y="133" width="82" height="16" rx="3" fill="rgba(66,190,101,0.15)" stroke="rgba(66,190,101,0.5)" strokeWidth="1" />
                  <circle cx="408" cy="141" r="3" fill="#42be65" />
                  <text x="448" y="145" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#42be65" letterSpacing="0.04em">ACKNOWLEDGED</text>
                </>
              )}
              <text x="290" y="163" fontFamily="monospace" fontSize="8" fill="#6f6f6f">Cardiology · Epic EHR · NPI: 1234567890</text>
              {graphPhase >= 1 && (
                <>
                  <text x="290" y="175" fontFamily="monospace" fontSize="8" fill="#42be65">CDS_HOOK → appointment-booked ✓</text>
                  <text x="290" y="185" fontFamily="monospace" fontSize="8" fill="#4b5563">T+8m · FHIR R4 write-back</text>
                </>
              )}

              {/* A1C Monitoring node */}
              {graphPhase >= 3 && (
                <rect x="280" y="250" width="210" height="40" rx="4"
                  fill="rgba(66,190,101,0.06)"
                  stroke="rgba(66,190,101,0.45)"
                  strokeWidth="1"
                />
              )}
              {graphPhase >= 3 && (
                <>
                  <text x="290" y="268" fontFamily="monospace" fontSize="9" fill="#42be65" letterSpacing="0.06em">A1C MONITORING</text>
                  <text x="455" y="268" textAnchor="end" fontFamily="monospace" fontSize="8" fill="#42be65">NEW</text>
                  <text x="290" y="282" fontFamily="monospace" fontSize="8" fill="#6f6f6f">Scheduled — 7 days · Bennett County Health order</text>
                </>
              )}

              {/* Postpartum Rehab node */}
              {graphPhase >= 4 && (
                <rect x="280" y="330" width="210" height="40" rx="4"
                  fill="rgba(66,190,101,0.06)"
                  stroke="rgba(66,190,101,0.45)"
                  strokeWidth="1"
                />
              )}
              {graphPhase >= 4 && (
                <>
                  <text x="290" y="348" fontFamily="monospace" fontSize="9" fill="#42be65" letterSpacing="0.06em">CARDIAC REHAB</text>
                  <text x="455" y="348" textAnchor="end" fontFamily="monospace" fontSize="8" fill="#42be65">REFERRAL PLACED</text>
                  <text x="290" y="362" fontFamily="monospace" fontSize="8" fill="#6f6f6f">Pre-auth attached · Auth cycle 0.3d</text>
                </>
              )}

              {/* ── Glow filter ── */}
              <defs>
                <filter id="glowBlue" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
            </svg>
          </div>

          {/* Legend */}
          <div className="flex-shrink-0 px-4 py-2 flex items-center gap-4 flex-wrap" style={{ borderTop: '1px solid rgba(57,57,57,0.4)' }}>
            {[
              { color: '#06b6d4', label: 'CDS_HOOK' },
              { color: '#ef4444', label: 'DUPLICATE_THERAPY' },
              { color: '#42be65', label: 'WRITE_BACK' },
              { color: '#f1c21b', label: 'LAB_ORDERED' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div style={{ width: 20, height: 1.5, background: color, opacity: 0.7 }} />
                <span className="font-mono" style={{ fontSize: '8px', color: '#4b5563', letterSpacing: '0.04em' }}>{label}</span>
              </div>
            ))}
            <div className="ml-auto flex items-center gap-1.5">
              <div className="rounded-full" style={{ width: 5, height: 5, background: '#06b6d4', animation: 'pulse 1.5s infinite' }} />
              <span className="font-mono" style={{ fontSize: '8px', color: '#06b6d4', letterSpacing: '0.06em' }}>LIVE — nodes updating</span>
            </div>
          </div>

          {/* Dismiss hint */}
          <div className="flex-shrink-0 px-4 py-2 flex items-center justify-center gap-2" style={{ borderTop: '1px solid rgba(57,57,57,0.4)', background: 'rgba(0,0,0,0.3)' }}>
            <div className="rounded px-3 py-1 flex items-center gap-2" style={{ background: 'rgba(57,57,57,0.3)', border: '1px solid rgba(57,57,57,0.5)' }}>
              <span style={{ fontSize: '12px', color: '#6f6f6f' }}>↓</span>
              <span className="font-mono" style={{ fontSize: '9px', color: '#6f6f6f', letterSpacing: '0.06em' }}>PRESS DOWN ARROW TO RETURN TO PANEL</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Agent Marketplace Library Panel ─────────────────────────────────────────

function MarketplacePanel({ onClose }: { onClose: () => void }) {
  const mq = JSON_PAYLOADS['marketplace_query'] as typeof import('./OrchestrationFlowModal')['default'] extends never ? never : Record<string, unknown>;
  const data = mq as {
    registryScanned: number;
    matchedAgents: number;
    unmatchedAgents: number;
    matchedAgentRoster: Array<{
      rank: number;
      agentId: string;
      agentName: string;
      tier: string;
      matchScore: number;
      confidenceScore: number;
      matchReasons: string[];
      assignedRole: string;
    }>;
    unmatchedAgentSample: Array<{
      agentId: string;
      agentName: string;
      tier: string;
      matchScore: number;
      exclusionReason: string;
    }>;
    unmatchedSampleNote: string;
  };

  const TIER_COLORS: Record<string, string> = {
    FOUNDATION: '#78a9ff',
    OPERATIONAL: '#42be65',
    SPECIALTY: '#c084fc',
    QUALITY: '#f59e0b',
    GOVERNANCE: '#ef4444',
  };

  return (
    <div className="flex flex-col h-full" style={{ background: '#0d1117', borderLeft: '1px solid rgba(120,169,255,0.3)' }}>
      {/* Header */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(57,57,57,0.7)', background: '#0f1923' }}
      >
        <div className="flex items-center gap-2">
          <div className="rounded-full" style={{ width: 8, height: 8, background: '#78a9ff', boxShadow: '0 0 6px #78a9ff' }} />
          <span className="font-mono font-semibold" style={{ fontSize: '11px', color: '#78a9ff', letterSpacing: '0.1em' }}>AGENT MARKETPLACE LIBRARY</span>
        </div>
        <button
          onClick={onClose}
          className="rounded flex items-center justify-center"
          style={{ width: 24, height: 24, background: 'rgba(57,57,57,0.5)', color: '#8d8d8d', fontSize: 14, cursor: 'pointer' }}
        >×</button>
      </div>

      {/* Registry summary bar */}
      <div className="flex-shrink-0 px-4 py-2 flex items-center gap-4" style={{ borderBottom: '1px solid rgba(57,57,57,0.5)', background: '#0a1520' }}>
        <div className="flex items-center gap-1.5">
          <span style={{ fontSize: '9px', color: '#4b5563' }}>SCANNED</span>
          <span className="font-mono font-semibold" style={{ fontSize: '12px', color: '#f4f4f4' }}>{data.registryScanned}</span>
        </div>
        <div style={{ width: 1, height: 16, background: 'rgba(57,57,57,0.6)' }} />
        <div className="flex items-center gap-1.5">
          <div className="rounded-full" style={{ width: 5, height: 5, background: '#42be65' }} />
          <span style={{ fontSize: '9px', color: '#4b5563' }}>MATCHED</span>
          <span className="font-mono font-semibold" style={{ fontSize: '12px', color: '#42be65' }}>{data.matchedAgents}</span>
        </div>
        <div style={{ width: 1, height: 16, background: 'rgba(57,57,57,0.6)' }} />
        <div className="flex items-center gap-1.5">
          <div className="rounded-full" style={{ width: 5, height: 5, background: '#4b5563' }} />
          <span style={{ fontSize: '9px', color: '#4b5563' }}>EXCLUDED</span>
          <span className="font-mono font-semibold" style={{ fontSize: '12px', color: '#6f6f6f' }}>{data.unmatchedAgents}</span>
        </div>
        <div className="ml-auto">
          <div className="rounded px-2 py-0.5" style={{ background: 'rgba(66,190,101,0.1)', border: '1px solid rgba(66,190,101,0.4)' }}>
            <span className="font-mono" style={{ fontSize: '9px', color: '#42be65', letterSpacing: '0.08em' }}>COALITION ASSEMBLED</span>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4">

        {/* Matched agents section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold" style={{ fontSize: '9px', color: '#42be65', letterSpacing: '0.1em' }}>MATCHED AGENTS — {data.matchedAgents} SELECTED</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(66,190,101,0.2)' }} />
          </div>

          {data.matchedAgentRoster.map((agent) => {
            const tierColor = TIER_COLORS[agent.tier] || '#78a9ff';
            const matchPct = Math.round(agent.matchScore * 100);
            const confPct = Math.round(agent.confidenceScore * 100);
            return (
              <div
                key={agent.agentId}
                className="rounded p-2.5 flex flex-col gap-1.5"
                style={{ background: 'rgba(15,25,35,0.8)', border: '1px solid rgba(57,57,57,0.6)' }}
              >
                {/* Agent header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono flex-shrink-0" style={{ fontSize: '8px', color: '#4b5563' }}>#{agent.rank}</span>
                    <span className="font-semibold truncate" style={{ fontSize: '10px', color: '#f4f4f4' }}>{agent.agentName}</span>
                  </div>
                  <div className="rounded px-1.5 py-0.5 flex-shrink-0" style={{ background: `${tierColor}15`, border: `1px solid ${tierColor}40` }}>
                    <span className="font-mono" style={{ fontSize: '7px', color: tierColor, letterSpacing: '0.06em' }}>{agent.tier}</span>
                  </div>
                </div>

                {/* Match score bar */}
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '8px', color: '#4b5563', width: 60, flexShrink: 0 }}>Match</span>
                  <div className="flex-1 rounded-full" style={{ height: 4, background: 'rgba(57,57,57,0.5)' }}>
                    <div className="rounded-full" style={{ width: `${matchPct}%`, height: 4, background: '#42be65', transition: 'width 0.5s ease' }} />
                  </div>
                  <span className="font-mono flex-shrink-0" style={{ fontSize: '8px', color: '#42be65', width: 28, textAlign: 'right' }}>{matchPct}%</span>
                </div>

                {/* Confidence score */}
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '8px', color: '#4b5563', width: 60, flexShrink: 0 }}>Confidence</span>
                  <div className="flex-1 rounded-full" style={{ height: 4, background: 'rgba(57,57,57,0.5)' }}>
                    <div className="rounded-full" style={{ width: `${confPct}%`, height: 4, background: '#78a9ff', transition: 'width 0.5s ease' }} />
                  </div>
                  <span className="font-mono flex-shrink-0" style={{ fontSize: '8px', color: '#78a9ff', width: 28, textAlign: 'right' }}>{confPct}%</span>
                </div>

                {/* Match reasons */}
                <div className="flex flex-col gap-0.5">
                  {agent.matchReasons.map((reason, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span style={{ fontSize: '8px', color: '#42be65', flexShrink: 0, marginTop: 1 }}>›</span>
                      <span style={{ fontSize: '8px', color: '#6f6f6f', lineHeight: 1.4 }}>{reason}</span>
                    </div>
                  ))}
                </div>

                {/* Assigned role */}
                <div className="flex items-center gap-1.5">
                  <span style={{ fontSize: '7px', color: '#4b5563' }}>ROLE:</span>
                  <span className="font-mono" style={{ fontSize: '8px', color: tierColor, letterSpacing: '0.04em' }}>{agent.assignedRole}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Unmatched agents section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold" style={{ fontSize: '9px', color: '#4b5563', letterSpacing: '0.1em' }}>EXCLUDED AGENTS — SAMPLE</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(57,57,57,0.4)' }} />
          </div>

          {data.unmatchedAgentSample.slice(0, 5).map((agent) => {
            const tierColor = TIER_COLORS[agent.tier] || '#6f6f6f';
            return (
              <div
                key={agent.agentId}
                className="rounded p-2 flex flex-col gap-1"
                style={{ background: 'rgba(10,10,15,0.6)', border: '1px solid rgba(57,57,57,0.4)' }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span style={{ fontSize: '9px', color: '#6f6f6f' }}>{agent.agentName}</span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="font-mono" style={{ fontSize: '8px', color: '#4b5563' }}>{Math.round(agent.matchScore * 100)}%</span>
                    <div className="rounded px-1 py-0.5" style={{ background: 'rgba(57,57,57,0.4)', border: '1px solid rgba(57,57,57,0.6)' }}>
                      <span className="font-mono" style={{ fontSize: '7px', color: '#4b5563', letterSpacing: '0.04em' }}>{agent.tier}</span>
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '8px', color: '#4b5563', lineHeight: 1.4 }}>{agent.exclusionReason}</span>
              </div>
            );
          })}

          <div className="rounded px-2 py-1.5" style={{ background: 'rgba(57,57,57,0.15)', border: '1px solid rgba(57,57,57,0.3)' }}>
            <span style={{ fontSize: '8px', color: '#4b5563', lineHeight: 1.4 }}>{data.unmatchedSampleNote}</span>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-4 py-2 flex items-center gap-2" style={{ borderTop: '1px solid rgba(57,57,57,0.5)', background: '#0a1520' }}>
        <span className="font-mono" style={{ fontSize: '8px', color: '#4b5563', letterSpacing: '0.06em' }}>QUERY_ID: REGISTRY_QUERY_MARIA_SD_001_001</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="rounded-full" style={{ width: 5, height: 5, background: '#42be65', boxShadow: '0 0 4px #42be65' }} />
          <span className="font-mono" style={{ fontSize: '8px', color: '#42be65', letterSpacing: '0.06em' }}>GOVERNANCE OVERLAY: MANDATORY</span>
        </div>
      </div>
    </div>
  );
}

// ─── Member Mobile App Panel ──────────────────────────────────────────────────

const MOBILE_SIM_STEPS: HITLStep[] = [
  { time: '09:47am', label: 'Maria opens RHTP mobile app', detail: 'Authenticated session · Day 34 · within preferred 9–11am window', color: '#10b981', icon: '📱' },
  { time: '09:47am', label: 'Chat query received', detail: '"What\'s going on with my heart medication? I got a message saying something changed."', color: '#78a9ff', icon: '💬' },
  { time: '09:47am', label: 'Longitudinal context projected', detail: 'Query mapped against full record — clinical, relationship, auth, financial, channel context assembled', color: '#f59e0b', icon: '🔍' },
  { time: '09:47am', label: 'Widget payload assembled', detail: '5 widgets in priority order · 2 signals suppressed · CHANNEL_OVERRIDE: PATIENT_SAFETY_THRESHOLD applied', color: '#8b5cf6', icon: '⚙️' },
  { time: '09:48am', label: 'Maria taps GOT IT on safety alert', detail: 'Member acknowledged duplicate therapy resolution — CHANNEL_HISTORY node updated', color: '#42be65', icon: '✓' },
];

const MOBILE_WIDGETS = [
  {
    priority: 1,
    icon: '⚠',
    title: 'Your medication was updated',
    badge: 'IMPORTANT',
    badgeColor: '#ef4444',
    body: 'Metformin has been discontinued. Continue taking Lisinopril 5mg as prescribed.',
    actions: ['GOT IT'],
    actionColor: '#ef4444',
    borderColor: 'rgba(239,68,68,0.5)',
    bg: 'rgba(239,68,68,0.06)',
  },
  {
    priority: 2,
    icon: '📅',
    title: 'A1C check scheduled',
    badge: 'ACTION',
    badgeColor: '#f59e0b',
    body: 'Home kit — no travel needed. 7 days from today.',
    actions: ['CONFIRM', 'RESCHEDULE'],
    actionColor: '#f59e0b',
    borderColor: 'rgba(245,158,11,0.4)',
    bg: 'rgba(245,158,11,0.05)',
  },
  {
    priority: 3,
    icon: '✓',
    title: 'Updates from Bennett County Health',
    badge: 'INFO',
    badgeColor: '#78a9ff',
    body: 'Postpartum rehab approved. Home lab kit on its way.',
    actions: ['VIEW'],
    actionColor: '#78a9ff',
    borderColor: 'rgba(120,169,255,0.35)',
    bg: 'rgba(120,169,255,0.05)',
  },
  {
    priority: 4,
    icon: '💊',
    title: 'Medication review available',
    badge: 'OPTIONAL',
    badgeColor: '#8b5cf6',
    body: 'Martin Pharmacy · 15 min · no cost to you.',
    actions: ['ENROLL', 'REMIND ME LATER'],
    actionColor: '#8b5cf6',
    borderColor: 'rgba(139,92,246,0.3)',
    bg: 'rgba(139,92,246,0.04)',
  },
  {
    priority: 5,
    icon: '💰',
    title: 'Your cost summary',
    badge: 'INFO',
    badgeColor: '#10b981',
    body: 'Covered pathway: $340–$480. Savings vs out-of-network: $2,400.',
    actions: ['VIEW BREAKDOWN'],
    actionColor: '#10b981',
    borderColor: 'rgba(16,185,129,0.3)',
    bg: 'rgba(16,185,129,0.04)',
  },
];

function MemberMobilePanel({ onClose }: { onClose: () => void }) {
  const [simulating, setSimulating] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [acknowledged, setAcknowledged] = useState(false);
  const [showMobileUI, setShowMobileUI] = useState(false);
  const [showGraphOverlay, setShowGraphOverlay] = useState(false);
  const [graphPhase, setGraphPhase] = useState(0);
  const [followOnVisible, setFollowOnVisible] = useState(false);
  const [gotItPressed, setGotItPressed] = useState(false);
  const [widgetAcknowledged, setWidgetAcknowledged] = useState(false);
  const [mobileAcknowledgedBanner, setMobileAcknowledgedBanner] = useState(false);

  const triggerGraphOverlay = () => {
    setShowMobileUI(false);
    setAcknowledged(true);
    setShowGraphOverlay(true);
    setGraphPhase(1);
    setTimeout(() => setGraphPhase(2), 600);
    setTimeout(() => setGraphPhase(3), 1200);
    setTimeout(() => setGraphPhase(4), 1800);
  };

  const startSimulation = () => {
    setSimulating(true);
    setCurrentStep(0);
    MOBILE_SIM_STEPS.forEach((_, i) => {
      setTimeout(() => {
        setCurrentStep(i);
        if (i === MOBILE_SIM_STEPS.length - 1) {
          setTimeout(() => {
            setAcknowledged(true);
            setTimeout(() => {
              setShowGraphOverlay(true);
              setGraphPhase(1);
              setTimeout(() => setGraphPhase(2), 600);
              setTimeout(() => setGraphPhase(3), 1200);
              setTimeout(() => setGraphPhase(4), 1800);
            }, 800);
          }, 600);
        }
      }, i * 1100);
    });
  };

  useEffect(() => {
    if (!showGraphOverlay) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        setShowGraphOverlay(false);
        setGraphPhase(0);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showGraphOverlay]);

  if (showMobileUI) {
    return (
      <div
        className="flex flex-col h-full"
        style={{ width: '100%', background: '#0a1628', borderLeft: 'none' }}
      >
        {/* RHTP header */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid rgba(16,185,129,0.25)', background: '#071020' }}
        >
          <div className="flex items-center gap-3">
            <div className="rounded px-2 py-1 flex items-center gap-2" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.5)' }}>
              <div className="rounded-full" style={{ width: 7, height: 7, background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
              <span className="font-mono font-semibold" style={{ fontSize: '11px', color: '#10b981', letterSpacing: '0.1em' }}>RALLY HEALTH MOBILE — MARIA REYES</span>
            </div>
            <span style={{ fontSize: '11px', color: '#6f6f6f' }}>Authenticated · Day 34</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMobileUI(false)}
              className="rounded px-2 py-1 transition-colors"
              style={{ background: 'rgba(57,57,57,0.4)', border: '1px solid rgba(57,57,57,0.6)', color: '#8d8d8d', fontSize: '11px', cursor: 'pointer' }}
            >← Back</button>
            <button
              onClick={onClose}
              className="rounded flex items-center justify-center"
              style={{ width: 24, height: 24, background: 'rgba(57,57,57,0.5)', color: '#8d8d8d', fontSize: 14, cursor: 'pointer' }}
            >×</button>
          </div>
        </div>

        {/* Channel override annotation */}
        <div className="flex-shrink-0 mx-4 mt-3 rounded p-2.5 flex flex-col gap-1" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.4)' }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '10px', color: '#f59e0b' }}>⚡</span>
            <span className="font-mono font-semibold" style={{ fontSize: '9px', color: '#f59e0b', letterSpacing: '0.08em' }}>CHANNEL_OVERRIDE: PATIENT_SAFETY_THRESHOLD</span>
          </div>
          <span style={{ fontSize: '9px', color: '#6f6f6f', lineHeight: 1.4 }}>Standard portal routing superseded — safety alert cannot wait for next portal login. Mobile push within Maria's digital channel family. Preference honored, clinical urgency not compromised.</span>
        </div>

        {/* Acknowledgement confirmation banner */}
        {mobileAcknowledgedBanner && (
          <div
            className="flex-shrink-0 mx-4 mt-3 rounded-xl p-3 flex flex-col gap-2"
            style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.6)', boxShadow: '0 0 16px rgba(16,185,129,0.15)' }}
          >
            <div className="flex items-center gap-2">
              <div className="rounded-full flex items-center justify-center" style={{ width: 20, height: 20, background: 'rgba(16,185,129,0.25)', border: '1px solid rgba(16,185,129,0.7)', flexShrink: 0 }}>
                <span style={{ fontSize: '11px', color: '#10b981' }}>✓</span>
              </div>
              <span className="font-mono font-semibold" style={{ fontSize: '10px', color: '#10b981', letterSpacing: '0.08em' }}>MEMBER ACKNOWLEDGED — T+1m</span>
            </div>
            <div className="flex flex-col gap-1 pl-1">
              {[
                'Safety alert confirmed — duplicate therapy resolution logged',
                'CHANNEL_HISTORY node updated — Mobile engagement Day 34',
                'COUMADIN: MEMBER_ACKNOWLEDGED write-back complete',
              ].map((line) => (
                <div key={line} className="flex items-start gap-1.5">
                  <span style={{ fontSize: '9px', color: '#42be65', flexShrink: 0, marginTop: 1 }}>●</span>
                  <span style={{ fontSize: '9px', color: '#d1d5db', lineHeight: 1.4 }}>{line}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="rounded-full" style={{ width: 5, height: 5, background: '#10b981', boxShadow: '0 0 4px #10b981' }} />
              <span className="font-mono" style={{ fontSize: '8px', color: '#10b981', letterSpacing: '0.06em' }}>Knowledge graph updating — view overlay →</span>
            </div>
          </div>
        )}

        {/* Mobile phone frame */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
          <div className="rounded-2xl overflow-hidden mx-auto" style={{ width: 340, background: '#111827', border: '2px solid rgba(57,57,57,0.8)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            {/* Phone status bar */}
            <div className="flex items-center justify-between px-4 py-2" style={{ background: '#0f172a', borderBottom: '1px solid rgba(57,57,57,0.5)' }}>
              <span className="font-mono" style={{ fontSize: '9px', color: '#6f6f6f' }}>9:47 AM</span>
              <span className="font-mono font-semibold" style={{ fontSize: '10px', color: '#10b981', letterSpacing: '0.06em' }}>RHTP Care Management</span>
              <span style={{ fontSize: '9px', color: '#6f6f6f' }}>●●●</span>
            </div>

            {/* Chat bubble */}
            <div className="px-3 py-3 flex flex-col gap-2">
              <div className="flex justify-end">
                <div className="rounded-2xl rounded-tr-sm px-3 py-2 max-w-xs" style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)' }}>
                  <span style={{ fontSize: '10px', color: '#d1d5db', lineHeight: 1.5 }}>What's going on with my heart medication? I got a message saying something changed.</span>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-sm px-3 py-2 max-w-xs" style={{ background: 'rgba(28,28,28,0.9)', border: '1px solid rgba(57,57,57,0.5)' }}>
                  <span style={{ fontSize: '10px', color: '#d1d5db', lineHeight: 1.5 }}>Hi Maria — I have important updates about your medications. Here's what you need to know:</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="mx-3 mb-2" style={{ height: 1, background: 'rgba(57,57,57,0.5)' }} />

            {/* Widget stack */}
            <div className="px-3 pb-3 flex flex-col gap-2">
              {MOBILE_WIDGETS.map((w) => (
                <div
                  key={w.priority}
                  className="rounded-xl p-3 flex flex-col gap-2 transition-all duration-300"
                  style={{
                    background: w.priority === 1 && widgetAcknowledged ? 'rgba(16,185,129,0.1)' : w.bg,
                    border: w.priority === 1 && widgetAcknowledged ? '1px solid rgba(16,185,129,0.6)' : `1px solid ${w.borderColor}`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span style={{ fontSize: '12px' }}>{w.priority === 1 && widgetAcknowledged ? '✓' : w.icon}</span>
                      <span style={{ fontSize: '10px', color: w.priority === 1 && widgetAcknowledged ? '#10b981' : '#f4f4f4', fontWeight: 600 }}>{w.title}</span>
                    </div>
                    <div
                      className="rounded-full px-2 py-0.5"
                      style={{
                        background: w.priority === 1 && widgetAcknowledged ? 'rgba(16,185,129,0.2)' : `${w.badgeColor}20`,
                        border: w.priority === 1 && widgetAcknowledged ? '1px solid rgba(16,185,129,0.6)' : `1px solid ${w.badgeColor}60`,
                      }}
                    >
                      <span className="font-mono" style={{ fontSize: '8px', color: w.priority === 1 && widgetAcknowledged ? '#10b981' : w.badgeColor, letterSpacing: '0.06em' }}>
                        {w.priority === 1 && widgetAcknowledged ? 'CONFIRMED' : w.badge}
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: '9px', color: '#9ca3af', lineHeight: 1.4 }}>{w.body}</span>
                  {w.priority === 1 && widgetAcknowledged ? (
                    <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.4)' }}>
                      <div className="rounded-full" style={{ width: 5, height: 5, background: '#10b981', boxShadow: '0 0 4px #10b981' }} />
                      <span className="font-mono" style={{ fontSize: '8px', color: '#10b981', letterSpacing: '0.04em' }}>Acknowledged · CHANNEL_HISTORY updated · T+1m</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {w.actions.map((action) => (
                        <button
                          key={action}
                          onClick={() => {
                            if (action === 'GOT IT' && w.priority === 1) {
                              setGotItPressed(true);
                              setWidgetAcknowledged(true);
                              setMobileAcknowledgedBanner(true);
                              setTimeout(() => {
                                triggerGraphOverlay();
                              }, 1800);
                            }
                          }}
                          className="rounded-full px-3 py-1 transition-all"
                          style={{ background: `${w.actionColor}18`, border: `1px solid ${w.actionColor}50`, color: w.actionColor, fontSize: '9px', cursor: 'pointer', fontFamily: 'monospace', letterSpacing: '0.04em', fontWeight: 600 }}
                        >{action}</button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Follow-on chat input */}
              <div className="rounded-xl p-2.5 flex flex-col gap-1.5" style={{ background: 'rgba(28,28,28,0.8)', border: '1px solid rgba(57,57,57,0.5)' }}>
                <span style={{ fontSize: '9px', color: '#6f6f6f' }}>Maria types:</span>
                <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: 'rgba(57,57,57,0.4)', border: '1px solid rgba(57,57,57,0.6)' }}>
                  <span style={{ fontSize: '9px', color: '#9ca3af', fontStyle: 'italic' }}>"Thank you, when will I get the kit?"</span>
                  <button
                    onClick={() => setFollowOnVisible(true)}
                    className="ml-auto rounded-full flex items-center justify-center"
                    style={{ width: 20, height: 20, background: 'rgba(16,185,129,0.3)', border: '1px solid rgba(16,185,129,0.6)', color: '#10b981', fontSize: '10px', cursor: 'pointer' }}
                  >↑</button>
                </div>
                {followOnVisible && (
                  <div className="rounded-xl rounded-tl-sm px-3 py-2 mt-1" style={{ background: 'rgba(28,28,28,0.9)', border: '1px solid rgba(57,57,57,0.5)' }}>
                    <span style={{ fontSize: '9px', color: '#d1d5db', lineHeight: 1.5 }}>Your home lab kit ships tomorrow — arrives in 2 days. We'll send a reminder when it's delivered.</span>
                    <div className="mt-1 flex items-center gap-1">
                      <div className="rounded-full" style={{ width: 4, height: 4, background: '#10b981' }} />
                      <span className="font-mono" style={{ fontSize: '8px', color: '#10b981' }}>Widget 3 updated · no new widget</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Suppressed signals note */}
          <div className="rounded p-2.5 flex flex-col gap-1" style={{ background: 'rgba(57,57,57,0.2)', border: '1px solid rgba(57,57,57,0.4)' }}>
            <span className="font-mono" style={{ fontSize: '9px', color: '#4b5563', letterSpacing: '0.08em' }}>SUPPRESSED (2 signals — frequency limit)</span>
            <span style={{ fontSize: '9px', color: '#4b5563' }}>× Auth renewal reminder — already seen</span>
            <span style={{ fontSize: '9px', color: '#4b5563' }}>× Caregiver coordination prompt — Elena notified separately</span>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex-shrink-0 px-4 py-3 flex items-center gap-2" style={{ borderTop: '1px solid rgba(16,185,129,0.2)', background: '#071020' }}>
          <button
            onClick={() => {
              setWidgetAcknowledged(true);
              setMobileAcknowledgedBanner(true);
              setTimeout(() => {
                triggerGraphOverlay();
              }, 1800);
            }}
            className="flex-1 rounded py-2 font-semibold transition-all"
            style={{
              background: mobileAcknowledgedBanner ? 'rgba(16,185,129,0.25)' : 'rgba(16,185,129,0.15)',
              border: mobileAcknowledgedBanner ? '1px solid rgba(16,185,129,0.8)' : '1px solid rgba(16,185,129,0.5)',
              color: '#10b981',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            {mobileAcknowledgedBanner ? '✓ ACKNOWLEDGED — UPDATING GRAPH…' : 'MEMBER ACKNOWLEDGED'}
          </button>
          <button className="rounded py-2 px-3 transition-all" style={{ background: 'rgba(120,169,255,0.1)', border: '1px solid rgba(120,169,255,0.4)', color: '#78a9ff', fontSize: '11px', cursor: 'pointer' }}>
            VIEW AUDIT
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ width: '100%', background: '#0d1117', borderLeft: 'none' }}
    >
      {/* Panel header */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(57,57,57,0.7)', background: '#161b22' }}
      >
        <div className="flex items-center gap-2">
          <div className="rounded-full" style={{ width: 8, height: 8, background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
          <span className="font-mono font-semibold" style={{ fontSize: '11px', color: '#10b981', letterSpacing: '0.1em' }}>RALLY MOBILE PUSH — MEMBER SIMULATION</span>
        </div>
        <button
          onClick={onClose}
          className="rounded flex items-center justify-center"
          style={{ width: 24, height: 24, background: 'rgba(57,57,57,0.5)', color: '#8d8d8d', fontSize: 14, cursor: 'pointer' }}
        >×</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">

        {/* Channel override annotation — key differentiator */}
        <div className="rounded p-3 flex flex-col gap-2" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.45)' }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '11px', color: '#f59e0b' }}>⚡</span>
            <span className="font-mono font-semibold" style={{ fontSize: '10px', color: '#f59e0b', letterSpacing: '0.08em' }}>CHANNEL_OVERRIDE: PATIENT_SAFETY_THRESHOLD</span>
          </div>
          <div className="flex flex-col gap-1 pl-1">
            <div className="flex items-start gap-2">
              <span style={{ fontSize: '9px', color: '#4b5563', width: 90, flexShrink: 0 }}>Standard routing:</span>
              <span style={{ fontSize: '9px', color: '#d1d5db' }}>PORTAL_WEB · weekdays 9–11am (Maria's learned preference)</span>
            </div>
            <div className="flex items-start gap-2">
              <span style={{ fontSize: '9px', color: '#4b5563', width: 90, flexShrink: 0 }}>Override channel:</span>
              <span style={{ fontSize: '9px', color: '#10b981' }}>MOBILE_PUSH · RHTP Care Management app</span>
            </div>
            <div className="flex items-start gap-2">
              <span style={{ fontSize: '9px', color: '#4b5563', width: 90, flexShrink: 0 }}>Override reason:</span>
              <span style={{ fontSize: '9px', color: '#f59e0b' }}>DUPLICATE_THERAPY signal · &lt;15min latency requirement</span>
            </div>
            <div className="flex items-start gap-2">
              <span style={{ fontSize: '9px', color: '#4b5563', width: 90, flexShrink: 0 }}>Policy ref:</span>
              <span className="font-mono" style={{ fontSize: '9px', color: '#4b5563' }}>CHANNEL_INTEL.SAFETY.OVERRIDE.001</span>
            </div>
          </div>
          <div className="rounded p-2 mt-1" style={{ background: 'rgba(28,28,28,0.7)', border: '1px solid rgba(57,57,57,0.5)' }}>
            <span style={{ fontSize: '9px', color: '#9ca3af', lineHeight: 1.5, fontStyle: 'italic' }}>
              "The system knows Maria prefers portal. But it also knows this is a safety alert that can't wait for her next login. Mobile push within the digital channel family she trusts — preference honored, clinical urgency not compromised."
            </span>
          </div>
        </div>

        {/* Push confirmation */}
        <div className="rounded p-3 flex flex-col gap-2" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.3)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-full" style={{ width: 7, height: 7, background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
              <span className="font-mono font-semibold" style={{ fontSize: '11px', color: '#10b981', letterSpacing: '0.1em' }}>RALLY MOBILE PUSH — DISPATCHED</span>
            </div>
            <span className="font-mono" style={{ fontSize: '10px', color: '#4b5563' }}>T+8m</span>
          </div>
          <div className="flex flex-col gap-1 pl-3">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '9px', color: '#4b5563', width: 52, flexShrink: 0 }}>Target:</span>
              <span style={{ fontSize: '10px', color: '#f4f4f4' }}>Maria Redhawk · RHTP Care Management mobile app</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '9px', color: '#4b5563', width: 52, flexShrink: 0 }}>Session:</span>
              <span style={{ fontSize: '10px', color: '#10b981' }}>Day 34 · 9:47am · within preferred window ✓</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '9px', color: '#4b5563', width: 52, flexShrink: 0 }}>Method:</span>
              <span style={{ fontSize: '10px', color: '#78a9ff' }}>Autonomous push · widget payload · priority-ordered</span>
            </div>
          </div>
        </div>

        {/* Phase 2 — Longitudinal context projection */}
        <div className="rounded p-3 flex flex-col gap-2" style={{ background: 'rgba(120,169,255,0.05)', border: '1px solid rgba(120,169,255,0.25)' }}>
          <span className="font-mono font-semibold" style={{ fontSize: '10px', color: '#78a9ff', letterSpacing: '0.1em' }}>PHASE 2 — LONGITUDINAL CONTEXT PROJECTION</span>
          <div className="flex flex-col gap-1.5 pl-1">
            {[
              { label: 'Clinical context', value: '⚠ Lisinopril + Metformin RESOLVED · A1C scheduled · HbA1c gap 47d', color: '#ef4444' },
              { label: 'Relationship context', value: 'Elena aware · Bennett County Health acknowledged · chart updated', color: '#c084fc' },
              { label: 'Auth context', value: 'Postpartum rehab pre-approved · auth cycle 0.3d', color: '#42be65' },
              { label: 'Financial context', value: 'OOP $340–$480 · covered pathway available', color: '#10b981' },
              { label: 'Channel context', value: 'Preferred: Portal/Mobile · 9–11am ✓ · suppression: CLEAR', color: '#f59e0b' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-2">
                <span style={{ fontSize: '9px', color: '#4b5563', width: 110, flexShrink: 0 }}>{item.label}</span>
                <span style={{ fontSize: '9px', color: item.color, lineHeight: 1.4 }}>{item.value}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="rounded-full" style={{ width: 5, height: 5, background: '#78a9ff' }} />
            <span className="font-mono" style={{ fontSize: '9px', color: '#78a9ff', letterSpacing: '0.06em' }}>5 NEXT BEST ACTIONS IDENTIFIED — widget payload queued</span>
          </div>
        </div>

        {/* Phase 3 — Widget payload assembly */}
        <div className="rounded p-3 flex flex-col gap-2" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.25)' }}>
          <span className="font-mono font-semibold" style={{ fontSize: '10px', color: '#8b5cf6', letterSpacing: '0.1em' }}>PHASE 3 — WIDGET PAYLOAD — PRIORITY ORDER</span>
          <div className="flex flex-col gap-1.5 pl-1">
            {MOBILE_WIDGETS.map((w) => (
              <div key={w.priority} className="flex items-center gap-2">
                <div className="rounded-full flex-shrink-0" style={{ width: 5, height: 5, background: w.badgeColor }} />
                <span className="font-mono" style={{ fontSize: '9px', color: '#4b5563', width: 18 }}>W{w.priority}</span>
                <div className="rounded px-1.5 py-0.5 flex-shrink-0" style={{ background: `${w.badgeColor}15`, border: `1px solid ${w.badgeColor}40` }}>
                  <span className="font-mono" style={{ fontSize: '8px', color: w.badgeColor, letterSpacing: '0.04em' }}>{w.badge}</span>
                </div>
                <span style={{ fontSize: '9px', color: '#d1d5db', lineHeight: 1.3 }}>{w.title}</span>
              </div>
            ))}
            <div className="mt-1 pt-1.5" style={{ borderTop: '1px solid rgba(57,57,57,0.4)' }}>
              <span style={{ fontSize: '9px', color: '#4b5563' }}>SUPPRESSED (2): Auth renewal reminder · Caregiver coordination prompt — frequency limit</span>
            </div>
          </div>
        </div>

        {/* Simulation status */}
        <div className="rounded p-3 flex flex-col gap-3" style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div className="flex items-center justify-between">
            <span className="font-mono font-semibold" style={{ fontSize: '10px', color: '#10b981', letterSpacing: '0.1em' }}>
              {acknowledged ? 'MARIA ACKNOWLEDGED' : 'AWAITING MEMBER ACKNOWLEDGEMENT'}
            </span>
            {acknowledged && (
              <div className="rounded px-2 py-0.5" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.4)' }}>
                <span className="font-mono" style={{ fontSize: '9px', color: '#10b981', letterSpacing: '0.08em' }}>T+1m</span>
              </div>
            )}
          </div>

          {(simulating || acknowledged) && (
            <div className="flex flex-col gap-2">
              {MOBILE_SIM_STEPS.map((step, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 transition-all duration-500"
                  style={{ opacity: currentStep >= i ? 1 : 0.2 }}
                >
                  <div
                    className="rounded-full flex-shrink-0 mt-0.5"
                    style={{ width: 7, height: 7, background: currentStep >= i ? step.color : '#393939', boxShadow: currentStep >= i ? `0 0 5px ${step.color}` : 'none', transition: 'all 0.4s' }}
                  />
                  <div className="flex flex-col gap-0.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono" style={{ fontSize: '9px', color: '#4b5563' }}>{step.time}</span>
                      <span style={{ fontSize: '10px', color: currentStep >= i ? '#f4f4f4' : '#4b5563', fontWeight: 500 }}>{step.label}</span>
                    </div>
                    <span style={{ fontSize: '9px', color: '#6f6f6f', lineHeight: 1.4 }}>{step.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!simulating && !acknowledged && (
            <button
              onClick={startSimulation}
              className="rounded py-2.5 font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.5)', color: '#10b981', fontSize: '12px', cursor: 'pointer' }}
            >
              <span>▶</span>
              <span>SIMULATE MARIA'S RESPONSE</span>
            </button>
          )}

          {simulating && !acknowledged && (
            <div className="flex items-center gap-2">
              <div className="rounded-full" style={{ width: 6, height: 6, background: '#f59e0b', animation: 'pulse 1s infinite' }} />
              <span className="font-mono" style={{ fontSize: '10px', color: '#f59e0b', letterSpacing: '0.08em' }}>SIMULATING MARIA'S SESSION…</span>
            </div>
          )}
        </div>

        {/* Acknowledged response */}
        {acknowledged && (
          <div className="rounded p-3 flex flex-col gap-2" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <div className="flex items-center gap-2">
              <div className="rounded-full" style={{ width: 7, height: 7, background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
              <span className="font-mono font-semibold" style={{ fontSize: '10px', color: '#10b981', letterSpacing: '0.08em' }}>MARIA ACKNOWLEDGED — T+1m</span>
            </div>
            <div className="flex flex-col gap-1 pl-1">
              {[
                { label: 'Safety alert: GOT IT — duplicate therapy resolution confirmed', color: '#42be65' },
                { label: 'A1C appointment: CONFIRM tapped', color: '#42be65' },
                { label: 'Follow-on query: "when will I get the kit?" — widget 3 updated', color: '#78a9ff' },
                { label: 'CHANNEL_HISTORY: Mobile engagement Day 34 logged', color: '#10b981' },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-2">
                  <span style={{ fontSize: '9px', color: item.color, flexShrink: 0, marginTop: 1 }}>●</span>
                  <span style={{ fontSize: '9px', color: '#d1d5db', lineHeight: 1.4 }}>{item.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="rounded-full" style={{ width: 5, height: 5, background: '#10b981' }} />
              <span className="font-mono" style={{ fontSize: '9px', color: '#10b981', letterSpacing: '0.06em' }}>GRAPH UPDATED — CHANNEL_HISTORY node write-back</span>
            </div>
            <span className="font-mono" style={{ fontSize: '8px', color: '#4b5563' }}>AUDIT_20241115_094812_RALLY_MOBILE_ACK_001</span>
          </div>
        )}
      </div>

      {/* View in RHTP Mobile button */}
      <div className="flex-shrink-0 px-4 py-3 flex items-center gap-2" style={{ borderTop: '1px solid rgba(57,57,57,0.5)' }}>
        <button
          onClick={() => setShowMobileUI(true)}
          className="flex-1 rounded py-2.5 font-semibold transition-all duration-200 flex items-center justify-center gap-2"
          style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.5)', color: '#10b981', fontSize: '12px', cursor: 'pointer' }}
        >
          <span>📱</span>
          <span>VIEW IN RALLY MOBILE — MARIA'S APP</span>
        </button>
        <button
          onClick={onClose}
          className="rounded py-2.5 px-3 transition-all"
          style={{ background: 'rgba(57,57,57,0.3)', border: '1px solid rgba(57,57,57,0.5)', color: '#6f6f6f', fontSize: '11px', cursor: 'pointer' }}
        >Close</button>
      </div>

      {/* Knowledge Graph Overlay — fires on member acknowledgement */}
      {showGraphOverlay && (
        <div
          className="absolute inset-0 z-60 flex flex-col"
          style={{ background: 'rgba(5,10,20,0.97)', backdropFilter: 'blur(2px)' }}
        >
          {/* Overlay header */}
          <div
            className="flex-shrink-0 flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid rgba(16,185,129,0.35)', background: 'rgba(16,185,129,0.06)' }}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-full" style={{ width: 8, height: 8, background: '#10b981', boxShadow: '0 0 8px #10b981', animation: 'pulse 1.5s infinite' }} />
              <span className="font-mono font-semibold" style={{ fontSize: '11px', color: '#10b981', letterSpacing: '0.12em' }}>KNOWLEDGE GRAPH — REAL-TIME UPDATE</span>
              <div className="rounded px-2 py-0.5" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.4)' }}>
                <span className="font-mono" style={{ fontSize: '9px', color: '#10b981', letterSpacing: '0.08em' }}>MEMBER ACKNOWLEDGEMENT WRITE-BACK</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono" style={{ fontSize: '9px', color: '#4b5563', letterSpacing: '0.06em' }}>↓ arrow to dismiss</span>
              <button
                onClick={() => { setShowGraphOverlay(false); setGraphPhase(0); }}
                className="rounded flex items-center justify-center"
                style={{ width: 24, height: 24, background: 'rgba(57,57,57,0.5)', color: '#8d8d8d', fontSize: 14, cursor: 'pointer' }}
              >×</button>
            </div>
          </div>

          {/* Graph canvas — fully SVG-based so edges connect correctly */}
          <div className="flex-1 relative overflow-hidden px-2 py-2">
            <svg width="100%" height="100%" viewBox="0 0 500 420" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
              {/* ── Edges ── */}
              {/* Maria → CHANNEL_HISTORY */}
              <line x1="250" y1="52" x2="120" y2="130" stroke="rgba(16,185,129,0.5)" strokeWidth="1.5" strokeDasharray="4 3">
                <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1s" repeatCount="indefinite" />
              </line>
              {/* Maria → RALLY_MOBILE_SESSION */}
              <line x1="250" y1="52" x2="370" y2="130" stroke="rgba(120,169,255,0.4)" strokeWidth="1.5" strokeDasharray="4 3">
                <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1s" repeatCount="indefinite" />
              </line>
              {/* CHANNEL_HISTORY → COUMADIN */}
              {graphPhase >= 2 && (
                <line x1="120" y1="185" x2="120" y2="245" stroke="rgba(66,190,101,0.5)" strokeWidth="1.5" strokeDasharray="4 3">
                  <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1s" repeatCount="indefinite" />
                </line>
              )}
              {/* COUMADIN → A1C MONITORING */}
              {graphPhase >= 3 && (
                <line x1="120" y1="295" x2="120" y2="345" stroke="rgba(66,190,101,0.5)" strokeWidth="1.5" strokeDasharray="4 3">
                  <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1s" repeatCount="indefinite" />
                </line>
              )}
              {/* RALLY_MOBILE_SESSION → Med review CONSENT_OFFERED */}
              {graphPhase >= 4 && (
                <line x1="370" y1="190" x2="370" y2="280" stroke="rgba(139,92,246,0.4)" strokeWidth="1.5" strokeDasharray="4 3">
                  <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1s" repeatCount="indefinite" />
                </line>
              )}

              {/* ── Central node: MARIA REYES ── */}
              <circle cx="250" cy="28" r="26" fill="rgba(120,169,255,0.12)" stroke="rgba(120,169,255,0.6)" strokeWidth="2" />
              <text x="250" y="24" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#78a9ff" letterSpacing="0.04em">MARIA</text>
              <text x="250" y="35" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#78a9ff" letterSpacing="0.04em">REYES</text>

              {/* ── Left cluster: CHANNEL_HISTORY / COUMADIN / A1C MONITORING ── */}
              {/* CHANNEL_HISTORY node */}
              <rect x="20" y="130" width="200" height="55" rx="4"
                fill="rgba(16,185,129,0.08)"
                stroke={graphPhase >= 1 ? '#10b981' : 'rgba(16,185,129,0.3)'}
                strokeWidth={graphPhase >= 1 ? 2 : 1}
                opacity={graphPhase >= 1 ? 1 : 0.4}
              />
              <text x="30" y="149" fontFamily="monospace" fontSize="9" fontWeight="bold" fill="#10b981" letterSpacing="0.06em">CHANNEL_HISTORY</text>
              {graphPhase >= 1 && (
                <>
                  <rect x="148" y="133" width="64" height="16" rx="3" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.5)" strokeWidth="1" />
                  <circle cx="156" cy="141" r="3" fill="#10b981" />
                  <text x="180" y="145" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#42be65" letterSpacing="0.04em">ACKNOWLEDGED</text>
                </>
              )}
              <text x="30" y="163" fontFamily="monospace" fontSize="8" fill="#6f6f6f">Care Manager · CM_SARAH_CHEN</text>
              {graphPhase >= 1 && (
                <>
                  <text x="30" y="175" fontFamily="monospace" fontSize="8" fill="#42be65">H1ab brief reviewed · approach confirmed ✓</text>
                  <text x="30" y="185" fontFamily="monospace" fontSize="8" fill="#4b5563">T+8h32m · no override · script locked</text>
                </>
              )}

              {/* Transport Barrier node */}
              {graphPhase >= 2 && (
                <rect x="20" y="245" width="200" height="50" rx="4"
                  fill="rgba(239,68,68,0.07)"
                  stroke="rgba(239,68,68,0.5)"
                  strokeWidth="1"
                />
              )}
              {graphPhase >= 2 && (
                <>
                  <text x="30" y="263" fontFamily="monospace" fontSize="9" fill="#ef4444" letterSpacing="0.06em">TRANSPORT_BARRIER</text>
                  <rect x="148" y="248" width="65" height="16" rx="3" fill="rgba(66,190,101,0.12)" stroke="rgba(66,190,101,0.4)" strokeWidth="1" />
                  <text x="180" y="260" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#42be65" letterSpacing="0.04em">PRE-RESOLVED</text>
                  <text x="30" y="277" fontFamily="monospace" fontSize="8" fill="#6f6f6f">2 missed appts · same zip · PROBABLE</text>
                  <text x="30" y="289" fontFamily="monospace" fontSize="8" fill="#42be65">← Sarah confirmed barrier-aware script</text>
                </>
              )}

              {/* Home Lab Kit node */}
              {graphPhase >= 3 && (
                <rect x="20" y="345" width="200" height="40" rx="4"
                  fill="rgba(66,190,101,0.06)"
                  stroke="rgba(66,190,101,0.45)"
                  strokeWidth="1"
                />
              )}
              {graphPhase >= 3 && (
                <>
                  <text x="30" y="363" fontFamily="monospace" fontSize="9" fill="#42be65" letterSpacing="0.06em">HOME LAB KIT</text>
                  <text x="175" y="363" textAnchor="end" fontFamily="monospace" fontSize="8" fill="#42be65">DISPATCHED</text>
                  <text x="30" y="377" fontFamily="monospace" fontSize="8" fill="#6f6f6f">HbA1c gap · no clinic visit required</text>
                </>
              )}

              {/* ── Right cluster: HbA1c Care Gap / CAREGAP_HBA1C ── */}
              {/* HbA1c Care Gap node */}
              <rect x="280" y="130" width="210" height="55" rx="4"
                fill="rgba(241,194,27,0.06)"
                stroke={graphPhase >= 1 ? 'rgba(241,194,27,0.6)' : 'rgba(241,194,27,0.2)'}
                strokeWidth={graphPhase >= 1 ? 2 : 1}
                opacity={graphPhase >= 1 ? 1 : 0.4}
              />
              <text x="290" y="149" fontFamily="monospace" fontSize="9" fontWeight="bold" fill="#f1c21b" letterSpacing="0.06em">HbA1c CARE GAP</text>
              {graphPhase >= 1 && (
                <>
                  <rect x="400" y="133" width="82" height="16" rx="3" fill="rgba(66,190,101,0.12)" stroke="rgba(66,190,101,0.4)" strokeWidth="1" />
                  <text x="441" y="145" textAnchor="middle" fontFamily="monospace" fontSize="8" fill="#42be65" letterSpacing="0.04em">ADDRESSED</text>
                </>
              )}
              <text x="290" y="163" fontFamily="monospace" fontSize="8" fill="#6f6f6f">9.2% · 47d SD Medicaid quality window · Q4 active</text>
              {graphPhase >= 1 && (
                <>
                  <text x="290" y="175" fontFamily="monospace" fontSize="8" fill="#42be65">Home kit dispatched 2024-11-14 ✓</text>
                  <text x="290" y="185" fontFamily="monospace" fontSize="8" fill="#4b5563">Closure projected 14 days</text>
                </>
              )}

              {/* CAREGAP_HBA1C node */}
              {graphPhase >= 4 && (
                <rect x="280" y="280" width="210" height="50" rx="4"
                  fill="rgba(66,190,101,0.06)"
                  stroke="rgba(66,190,101,0.45)"
                  strokeWidth="1"
                />
              )}
              {graphPhase >= 4 && (
                <>
                  <text x="290" y="298" fontFamily="monospace" fontSize="9" fill="#42be65" letterSpacing="0.06em">CAREGAP_HBA1C RENEWAL</text>
                  <text x="455" y="298" textAnchor="end" fontFamily="monospace" fontSize="8" fill="#42be65">SUBMITTED</text>
                  <text x="290" y="312" fontFamily="monospace" fontSize="8" fill="#6f6f6f">Procedure HbA1c · cycle time 0.3d</text>
                  <text x="290" y="322" fontFamily="monospace" fontSize="8" fill="#42be65">Sarah notified — no action required</text>
                </>
              )}

              {/* ── Glow filter ── */}
              <defs>
                <filter id="glowBlueH1ab" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
            </svg>
          </div>

          {/* Legend */}
          <div className="flex-shrink-0 px-4 py-2 flex items-center gap-4 flex-wrap" style={{ borderTop: '1px solid rgba(57,57,57,0.4)' }}>
            {[
              { color: '#78a9ff', label: 'H1ab_ACKNOWLEDGED' },
              { color: '#ef4444', label: 'TRANSPORT_BARRIER' },
              { color: '#42be65', label: 'CARE_GAP_ADDRESSED' },
              { color: '#f1c21b', label: 'AUTH_SUBMITTED' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div style={{ width: 20, height: 1.5, background: color, opacity: 0.7 }} />
                <span className="font-mono" style={{ fontSize: '8px', color: '#4b5563', letterSpacing: '0.04em' }}>{label}</span>
              </div>
            ))}
            <div className="ml-auto flex items-center gap-1.5">
              <div className="rounded-full" style={{ width: 5, height: 5, background: '#78a9ff', animation: 'pulse 1.5s infinite' }} />
              <span className="font-mono" style={{ fontSize: '8px', color: '#78a9ff', letterSpacing: '0.06em' }}>LIVE — nodes updating</span>
            </div>
          </div>

          {/* Dismiss hint */}
          <div className="flex-shrink-0 px-4 py-2 flex items-center justify-center gap-2" style={{ borderTop: '1px solid rgba(57,57,57,0.4)', background: 'rgba(0,0,0,0.3)' }}>
            <div className="rounded px-3 py-1 flex items-center gap-2" style={{ background: 'rgba(57,57,57,0.3)', border: '1px solid rgba(57,57,57,0.5)' }}>
              <span style={{ fontSize: '12px', color: '#6f6f6f' }}>↓</span>
              <span className="font-mono" style={{ fontSize: '9px', color: '#6f6f6f', letterSpacing: '0.06em' }}>PRESS DOWN ARROW TO RETURN TO PANEL</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main OrchestrationFlowModal ─────────────────────────────────────────────

interface OrchestrationFlowModalProps {
  onClose: () => void;
}

const OrchestrationFlowModal: React.FC<OrchestrationFlowModalProps> = ({ onClose }) => {
  type ActivePanel = 'none' | 'marketplace' | 'h1ab' | 'drchen' | 'mobile' | 'optumrx' | 'json';
  const [activePanel, setActivePanel] = useState<ActivePanel>('none');
  const [jsonPayloadKey, setJsonPayloadKey] = useState<string>('');
  const [popout, setPopout] = useState<{ agent: AgentNode | GovernanceAgent; rect: DOMRect } | null>(null);
  const [laneProgress, setLaneProgress] = useState(0);
  const [timelineProgress, setTimelineProgress] = useState(0);
  const [scenarioResolved, setScenarioResolved] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-animate lanes on mount
  useEffect(() => {
    const t1 = setTimeout(() => setLaneProgress(1), 400);
    const t2 = setTimeout(() => setLaneProgress(2), 1200);
    const t3 = setTimeout(() => setLaneProgress(3), 2000);
    const t4 = setTimeout(() => setTimelineProgress(1), 2400);
    const t5 = setTimeout(() => setTimelineProgress(2), 3200);
    const t6 = setTimeout(() => setScenarioResolved(true), 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); clearTimeout(t6); };
  }, []);

  // Close popout on outside click
  useEffect(() => {
    if (!popout) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-popout]')) setPopout(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [popout]);

  const openJsonPanel = (key: string) => {
    setJsonPayloadKey(key);
    setActivePanel('json');
  };

  const openAgentPopout = (agent: AgentNode | GovernanceAgent, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    setPopout({ agent, rect });
  };

  const closePanel = () => setActivePanel('none');

  // ── Right panel renderer ──────────────────────────────────────────────────
  const renderRightPanel = () => {
    if (activePanel === 'h1ab') return <H1abHITLPanel onClose={closePanel} />;
    if (activePanel === 'drchen') return <DrChenEpicPanel onClose={closePanel} />;
    if (activePanel === 'mobile') return <MemberMobilePanel onClose={closePanel} />;
    if (activePanel === 'marketplace') return <MarketplacePanel onClose={closePanel} />;
    if (activePanel === 'optumrx') {
      const payload = JSON_PAYLOADS['policy_intercept_optumrx'];
      return (
        <div className="flex flex-col h-full" style={{ background: '#0d1117', borderLeft: '1px solid rgba(239,68,68,0.3)' }}>
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(57,57,57,0.7)', background: '#161b22' }}>
            <div className="flex items-center gap-2">
              <div className="rounded-full" style={{ width: 8, height: 8, background: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />
              <span className="font-mono font-semibold" style={{ fontSize: '11px', color: '#ef4444', letterSpacing: '0.1em' }}>MARTIN PHARMACY — CONSENT GATE</span>
            </div>
            <button onClick={closePanel} className="rounded flex items-center justify-center" style={{ width: 24, height: 24, background: 'rgba(57,57,57,0.5)', color: '#8d8d8d', fontSize: 14, cursor: 'pointer' }}>×</button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <pre className="font-mono text-xs whitespace-pre-wrap" style={{ color: '#d1d5db', lineHeight: 1.6 }}>
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>
        </div>
      );
    }
    if (activePanel === 'json' && jsonPayloadKey) {
      const payload = JSON_PAYLOADS[jsonPayloadKey];
      return (
        <div className="flex flex-col h-full" style={{ background: '#0d1117', borderLeft: '1px solid rgba(120,169,255,0.3)' }}>
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(57,57,57,0.7)', background: '#161b22' }}>
            <div className="flex items-center gap-2">
              <div className="rounded-full" style={{ width: 8, height: 8, background: '#78a9ff', boxShadow: '0 0 6px #78a9ff' }} />
              <span className="font-mono font-semibold" style={{ fontSize: '11px', color: '#78a9ff', letterSpacing: '0.1em' }}>JSON PAYLOAD</span>
            </div>
            <button onClick={closePanel} className="rounded flex items-center justify-center" style={{ width: 24, height: 24, background: 'rgba(57,57,57,0.5)', color: '#8d8d8d', fontSize: 14, cursor: 'pointer' }}>×</button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <pre className="font-mono text-xs whitespace-pre-wrap" style={{ color: '#d1d5db', lineHeight: 1.6 }}>
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>
        </div>
      );
    }
    // Empty state with quick-access buttons
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 px-4" style={{ background: '#0d1117', borderLeft: '1px solid rgba(57,57,57,0.4)' }}>
        <span className="font-mono" style={{ fontSize: '10px', color: '#4b5563', letterSpacing: '0.1em' }}>SELECT AN ENDPOINT PILL TO VIEW PAYLOAD</span>
        <div className="flex flex-col gap-2 w-full">
          {[
            { label: 'H1ab HITL Panel', color: '#78a9ff', panel: 'h1ab' as ActivePanel },
            { label: 'Bennett County Health Epic CDS', color: '#8b5cf6', panel: 'drchen' as ActivePanel },
            { label: 'RHTP Mobile Push', color: '#10b981', panel: 'mobile' as ActivePanel },
            { label: 'Agent Marketplace', color: '#f59e0b', panel: 'marketplace' as ActivePanel },
          ].map(({ label, color, panel }) => (
            <button
              key={panel}
              onClick={() => setActivePanel(panel)}
              className="rounded px-3 py-2 text-left transition-all"
              style={{ background: `${color}10`, border: `1px solid ${color}30`, color, fontSize: '11px', cursor: 'pointer' }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ── Agent card renderer ───────────────────────────────────────────────────
  const renderAgentCard = (agent: AgentNode, laneVisible: boolean) => {
    const isIntercepted = agent.intercepted;
    const borderColor = isIntercepted ? 'rgba(241,194,27,0.5)' : `${agent.color}40`;
    const bg = isIntercepted ? 'rgba(241,194,27,0.06)' : `${agent.color}10`;
    return (
      <div
        key={agent.id}
        className="rounded flex flex-col gap-1.5 transition-all duration-500"
        style={{
          background: bg,
          border: `1px solid ${borderColor}`,
          padding: '8px 10px',
          opacity: laneVisible ? 1 : 0.3,
          minWidth: 0,
        }}
      >
        {/* Agent header */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="rounded-full flex-shrink-0" style={{ width: 7, height: 7, background: agent.color, boxShadow: laneVisible ? `0 0 5px ${agent.color}` : 'none' }} />
            <span className="font-mono font-semibold truncate" style={{ fontSize: '9px', color: agent.color, letterSpacing: '0.08em' }}>{agent.label}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {isIntercepted && (
              <div className="rounded px-1 py-0.5" style={{ background: 'rgba(241,194,27,0.15)', border: '1px solid rgba(241,194,27,0.4)' }}>
                <span className="font-mono" style={{ fontSize: '8px', color: '#f1c21b', letterSpacing: '0.06em' }}>⚡ INTERCEPT</span>
              </div>
            )}
            <button
              onClick={(e) => openAgentPopout(agent, e.currentTarget)}
              className="rounded flex items-center justify-center"
              style={{ width: 16, height: 16, background: 'rgba(57,57,57,0.5)', color: '#6f6f6f', fontSize: '10px', cursor: 'pointer', border: '1px solid rgba(57,57,57,0.6)', flexShrink: 0 }}
            >ⓘ</button>
          </div>
        </div>
        {/* Completion time */}
        <span className="font-mono" style={{ fontSize: '8px', color: '#4b5563', letterSpacing: '0.06em' }}>{agent.completionTime}</span>
        {/* Fetch/Push pills */}
        <div className="flex flex-col gap-1">
          {agent.fetchSystems.map((sys) => (
            <button
              key={sys.id}
              onClick={() => openJsonPanel(sys.payloadKey)}
              className="rounded px-2 py-1 flex items-center gap-1.5 transition-all text-left"
              style={{ background: 'rgba(120,169,255,0.08)', border: '1px solid rgba(120,169,255,0.25)', cursor: 'pointer' }}
            >
              <span className="font-mono" style={{ fontSize: '7px', color: '#78a9ff', letterSpacing: '0.06em' }}>FETCH</span>
              <span style={{ fontSize: '8px', color: '#c6c6c6' }}>{sys.label}</span>
              <span style={{ fontSize: '7px', color: '#6f6f6f' }}>{sys.sublabel}</span>
              <span className="ml-auto font-mono" style={{ fontSize: '7px', color: '#4b5563' }}>SCOPED</span>
            </button>
          ))}
          {agent.pushSystems.map((sys) => {
            const isH1ab = sys.id === 'h1ab';
            const isDrChen = sys.id === 'dr-chen-ehr';
            const isRHTP = sys.id === 'rally-mobile';
            const isPharmacyGate = sys.id === 'optumrx-gate';
            const pillColor = isPharmacyGate ? '#ef4444' : '#42be65';
            return (
              <button
                key={sys.id}
                onClick={() => {
                  if (isH1ab) setActivePanel('h1ab');
                  else if (isDrChen) setActivePanel('drchen');
                  else if (isRHTP) setActivePanel('mobile');
                  else if (isPharmacyGate) setActivePanel('optumrx');
                  else openJsonPanel(sys.payloadKey);
                }}
                className="rounded px-2 py-1 flex items-center gap-1.5 transition-all text-left"
                style={{ background: `${pillColor}08`, border: `1px solid ${pillColor}25`, cursor: 'pointer' }}
              >
                <span className="font-mono" style={{ fontSize: '7px', color: pillColor, letterSpacing: '0.06em' }}>PUSH</span>
                <span style={{ fontSize: '8px', color: '#c6c6c6' }}>{sys.label}</span>
                <span style={{ fontSize: '7px', color: '#6f6f6f' }}>{sys.sublabel}</span>
                <span className="ml-auto font-mono" style={{ fontSize: '7px', color: '#4b5563' }}>SCOPED</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderGovernanceCard = (gov: GovernanceAgent, laneVisible: boolean) => {
    const hasIntercept = gov.interceptAt && gov.interceptAt.length > 0;
    return (
      <div
        key={gov.id}
        className="rounded flex flex-col gap-1.5 transition-all duration-500"
        style={{
          background: `${gov.color}08`,
          border: `1px solid ${gov.color}35`,
          padding: '8px 10px',
          opacity: laneVisible ? 1 : 0.3,
        }}
      >
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="rounded-full flex-shrink-0" style={{ width: 7, height: 7, background: gov.color }} />
            <span className="font-mono font-semibold truncate" style={{ fontSize: '9px', color: gov.color, letterSpacing: '0.08em' }}>{gov.label}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {hasIntercept && (
              <div className="rounded px-1 py-0.5" style={{ background: 'rgba(241,194,27,0.12)', border: '1px solid rgba(241,194,27,0.4)' }}>
                <span className="font-mono" style={{ fontSize: '8px', color: '#f1c21b' }}>CONTAINED</span>
              </div>
            )}
            <button
              onClick={(e) => openAgentPopout(gov, e.currentTarget)}
              className="rounded flex items-center justify-center"
              style={{ width: 16, height: 16, background: 'rgba(57,57,57,0.5)', color: '#6f6f6f', fontSize: '10px', cursor: 'pointer', border: '1px solid rgba(57,57,57,0.6)', flexShrink: 0 }}
            >ⓘ</button>
          </div>
        </div>
        {gov.interceptLabel && (
          <span className="font-mono" style={{ fontSize: '8px', color: '#f1c21b', letterSpacing: '0.06em' }}>{gov.interceptLabel}</span>
        )}
        <button
          onClick={() => openJsonPanel(gov.payloadKey)}
          className="rounded px-2 py-1 flex items-center gap-1.5 transition-all text-left"
          style={{ background: 'rgba(57,57,57,0.2)', border: '1px solid rgba(57,57,57,0.4)', cursor: 'pointer' }}
        >
          <span className="font-mono" style={{ fontSize: '7px', color: '#6f6f6f', letterSpacing: '0.06em' }}>AUDIT LOG</span>
          <span style={{ fontSize: '8px', color: '#c6c6c6' }}>View payload</span>
        </button>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(4px)' }}
    >
      {/* Header */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-6 py-3"
        style={{ background: '#0d1117', borderBottom: '1px solid rgba(57,57,57,0.7)', height: 52 }}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-full" style={{ width: 8, height: 8, background: '#78a9ff', boxShadow: '0 0 8px #78a9ff', animation: 'pulse 2s infinite' }} />
          <span className="font-mono font-semibold" style={{ fontSize: '13px', color: '#78a9ff', letterSpacing: '0.12em' }}>SUPER ORCHESTRATION CONTROLLER</span>
          <div className="rounded px-2 py-0.5" style={{ background: 'rgba(120,169,255,0.1)', border: '1px solid rgba(120,169,255,0.3)' }}>
            <span className="font-mono" style={{ fontSize: '9px', color: '#78a9ff', letterSpacing: '0.08em' }}>INSTRUCTION_SOURCE: VALIDATED · CONTEXT_INTEGRITY: SHA-256</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePanel('marketplace')}
            className="rounded px-3 py-1.5 font-mono transition-all"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.4)', color: '#f59e0b', fontSize: '10px', cursor: 'pointer', letterSpacing: '0.08em' }}
          >AGENT MARKETPLACE</button>
          <button
            onClick={onClose}
            className="rounded flex items-center justify-center"
            style={{ width: 28, height: 28, background: 'rgba(57,57,57,0.5)', color: '#8d8d8d', fontSize: 16, cursor: 'pointer', border: '1px solid rgba(57,57,57,0.6)' }}
          >×</button>
        </div>
      </div>

      {/* Body — two columns */}
      <div className="flex-1 flex overflow-hidden" ref={containerRef}>
        {/* Left column — 72% — coalition flow */}
        <div
          className="flex flex-col overflow-y-auto"
          style={{ width: activePanel !== 'none' ? '72%' : '100%', transition: 'width 0.3s ease', borderRight: activePanel !== 'none' ? '1px solid rgba(57,57,57,0.5)' : 'none' }}
        >
          <div className="flex-1 px-5 py-4 flex flex-col gap-4">

            {/* Lane 0 — Signal Classification */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono" style={{ fontSize: '9px', color: '#4b5563', letterSpacing: '0.12em' }}>LANE 0 — SIGNAL CLASSIFICATION ENGINE</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(57,57,57,0.5)' }} />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {SIGNAL_NODES.map((sig) => (
                  <button
                    key={sig.id}
                    onClick={() => openJsonPanel('signal_classification')}
                    className="rounded px-3 py-1.5 flex items-center gap-2 transition-all"
                    style={{ background: `${sig.color}12`, border: `1px solid ${sig.color}40`, cursor: 'pointer' }}
                  >
                    <div className="rounded-full" style={{ width: 6, height: 6, background: sig.color }} />
                    <span className="font-mono font-semibold" style={{ fontSize: '9px', color: sig.color, letterSpacing: '0.08em' }}>{sig.label}</span>
                    <span className="font-mono" style={{ fontSize: '8px', color: '#6f6f6f' }}>{sig.sublabel}</span>
                  </button>
                ))}
                <div className="rounded px-2 py-1" style={{ background: 'rgba(120,169,255,0.08)', border: '1px solid rgba(120,169,255,0.25)' }}>
                  <span className="font-mono" style={{ fontSize: '8px', color: '#78a9ff', letterSpacing: '0.08em' }}>→ SUPER ORCHESTRATION CONTROLLER</span>
                </div>
              </div>
            </div>

            {/* Lane A — Foundation Agents */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono" style={{ fontSize: '9px', color: '#4b5563', letterSpacing: '0.12em' }}>LANE A — FOUNDATION AGENTS · T+0</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(57,57,57,0.5)' }} />
              </div>
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {FOUNDATION_AGENTS.map((agent) => renderAgentCard(agent, laneProgress >= 1))}
              </div>
            </div>

            {/* Lane B — Operational Agents */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono" style={{ fontSize: '9px', color: '#4b5563', letterSpacing: '0.12em' }}>LANE B — OPERATIONAL AGENTS · T+3m</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(57,57,57,0.5)' }} />
              </div>
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {OPERATIONAL_AGENTS.map((agent) => renderAgentCard(agent, laneProgress >= 2))}
              </div>
            </div>

            {/* Parallel Execution Timeline */}
            <div className="rounded p-3 flex flex-col gap-2" style={{ background: 'rgba(120,169,255,0.04)', border: '1px solid rgba(120,169,255,0.2)' }}>
              <div className="flex items-center justify-between">
                <span className="font-mono" style={{ fontSize: '9px', color: '#78a9ff', letterSpacing: '0.1em' }}>PARALLEL EXECUTION TIMELINE</span>
                <span className="font-mono" style={{ fontSize: '8px', color: '#4b5563' }}>T+0 → T+47m</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {OPERATIONAL_AGENTS.slice(0, 6).map((agent) => {
                  const pct = timelineProgress >= 1 ? Math.min(100, (agent.completionMin / 47) * 100) : 0;
                  return (
                    <div key={agent.id} className="flex items-center gap-2">
                      <span className="font-mono flex-shrink-0" style={{ fontSize: '8px', color: agent.color, width: 120, letterSpacing: '0.04em' }}>{agent.label}</span>
                      <div className="flex-1 rounded-full" style={{ height: 4, background: 'rgba(57,57,57,0.5)' }}>
                        <div
                          className="rounded-full transition-all duration-1000"
                          style={{ width: `${pct}%`, height: '100%', background: agent.intercepted ? '#f1c21b' : agent.color, opacity: 0.8 }}
                        />
                      </div>
                      <span className="font-mono flex-shrink-0" style={{ fontSize: '8px', color: '#4b5563', width: 40 }}>{agent.completionTime}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lane C — Governance Agents */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono" style={{ fontSize: '9px', color: '#4b5563', letterSpacing: '0.12em' }}>LANE C — GOVERNANCE AGENTS · CONTINUOUS</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(57,57,57,0.5)' }} />
              </div>
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                {GOVERNANCE_AGENTS.map((gov) => renderGovernanceCard(gov, laneProgress >= 3))}
              </div>
            </div>

            {/* Scenario Resolved bar */}
            <div
              className="rounded p-3 flex items-center gap-3 transition-all duration-700"
              style={{
                background: scenarioResolved ? 'rgba(66,190,101,0.08)' : 'rgba(57,57,57,0.2)',
                border: `1px solid ${scenarioResolved ? 'rgba(66,190,101,0.4)' : 'rgba(57,57,57,0.4)'}`,
                opacity: scenarioResolved ? 1 : 0.4,
              }}
            >
              <div className="rounded-full" style={{ width: 10, height: 10, background: scenarioResolved ? '#42be65' : '#393939', boxShadow: scenarioResolved ? '0 0 8px #42be65' : 'none', transition: 'all 0.5s' }} />
              <div className="flex flex-col gap-0.5">
                <span className="font-mono font-semibold" style={{ fontSize: '11px', color: scenarioResolved ? '#42be65' : '#6f6f6f', letterSpacing: '0.1em' }}>
                  {scenarioResolved ? 'SCENARIO RESOLVED — T+47m' : 'SCENARIO IN PROGRESS…'}
                </span>
                {scenarioResolved && (
                  <span style={{ fontSize: '10px', color: '#6f6f6f' }}>8 agents · 71 decisions · 2 intercepts · 100% governance compliance · $18,400 cost avoidance</span>
                )}
              </div>
              {scenarioResolved && (
                <div className="ml-auto flex items-center gap-2">
                  <div className="rounded px-2 py-0.5" style={{ background: 'rgba(66,190,101,0.12)', border: '1px solid rgba(66,190,101,0.4)' }}>
                    <span className="font-mono" style={{ fontSize: '9px', color: '#42be65', letterSpacing: '0.08em' }}>AUDIT LEDGER COMMITTED</span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Right column — 28% — active panel */}
        {activePanel !== 'none' && (
          <div className="flex-shrink-0 overflow-hidden" style={{ width: '28%' }}>
            {renderRightPanel()}
          </div>
        )}
      </div>

      {/* Agent popout */}
      {popout && (
        <div
          data-popout
          className="fixed z-[60] rounded shadow-2xl flex flex-col gap-2"
          style={{
            top: Math.min(popout.rect.bottom + 8, window.innerHeight - 260),
            left: Math.min(popout.rect.left, window.innerWidth - 320),
            width: 300,
            background: '#161b22',
            border: '1px solid rgba(57,57,57,0.8)',
            padding: '12px',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-full" style={{ width: 7, height: 7, background: popout.agent.color }} />
              <span className="font-mono font-semibold" style={{ fontSize: '10px', color: popout.agent.color, letterSpacing: '0.08em' }}>{popout.agent.label}</span>
            </div>
            <button onClick={() => setPopout(null)} style={{ color: '#6f6f6f', fontSize: 14, cursor: 'pointer', background: 'none', border: 'none' }}>×</button>
          </div>
          {popout.agent.tier && (
            <span className="font-mono" style={{ fontSize: '8px', color: '#4b5563', letterSpacing: '0.06em' }}>{popout.agent.tier}</span>
          )}
          {popout.agent.rationale && (
            <p style={{ fontSize: '10px', color: '#d1d5db', lineHeight: 1.5 }}>{popout.agent.rationale}</p>
          )}
          {popout.agent.outcome && (
            <div className="rounded p-2" style={{ background: 'rgba(66,190,101,0.06)', border: '1px solid rgba(66,190,101,0.25)' }}>
              <span style={{ fontSize: '9px', color: '#42be65', lineHeight: 1.4 }}>{popout.agent.outcome}</span>
            </div>
          )}
          {popout.agent.confidence !== undefined && (
            <div className="flex items-center gap-2">
              <span className="font-mono" style={{ fontSize: '8px', color: '#4b5563' }}>CONFIDENCE</span>
              <div className="flex-1 rounded-full" style={{ height: 3, background: 'rgba(57,57,57,0.5)' }}>
                <div className="rounded-full" style={{ width: `${(popout.agent.confidence ?? 0) * 100}%`, height: '100%', background: popout.agent.color }} />
              </div>
              <span className="font-mono" style={{ fontSize: '8px', color: popout.agent.color }}>{Math.round((popout.agent.confidence ?? 0) * 100)}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default OrchestrationFlowModal;