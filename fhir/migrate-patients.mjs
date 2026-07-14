#!/usr/bin/env node
/**
 * TCOC → HAPI FHIR R4 Patient Migration Script
 *
 * Converts all patients in src/lib/patientRegistry.ts into FHIR R4 resources
 * and uploads them to the local HAPI FHIR server via FHIR transaction bundles.
 *
 * Prerequisites:
 *   • HAPI FHIR server running at http://localhost:8080/fhir
 *     (docker compose -f fhir/docker-compose.yml up -d)
 *
 * Usage:
 *   node fhir/migrate-patients.mjs [--fhir-url http://localhost:8080/fhir]
 *
 * Each patient yields the following FHIR R4 resources:
 *   • Patient            — demographics, identifiers, contact
 *   • Observation (×N)  — care gaps surfaced as clinical observations
 *   • Flag (×N)         — CDS alert cards as FHIR Flags
 *   • RiskAssessment     — RAF score + ER risk %
 */

import { argv } from 'node:process';
import { setTimeout as sleep } from 'node:timers/promises';

// ─── Configuration ────────────────────────────────────────────────────────────
const argIdx = argv.indexOf('--fhir-url');
const FHIR_BASE = argIdx !== -1 ? argv[argIdx + 1] : 'http://localhost:8080/fhir';

// ─── Source patient data (mirrors src/lib/patientRegistry.ts) ─────────────────
const PATIENTS = [
  {
    platformId: 'MARIA_SD_001',
    fhirId: 'patient-maria-001',
    carePlan: {
      domains: [
        {
          domain: 'Clinical', color: '#0043ce', icon: 'HeartIcon',
          goals: [
            { goal: 'HbA1c recheck by June 22, 2026', status: 'open', owner: 'Bennett County Health', dueDate: '2026-06-22', tasks: ['NEMT enrollment for lab visit', 'Bundle with Sophia well-child', 'HbA1c result review with PCP'] },
          ],
        },
        {
          domain: 'Behavioral Health', color: '#6929c4', icon: 'SparklesIcon',
          goals: [
            { goal: 'Edinburgh PND score < 7 by Q4 2026', status: 'in-progress', owner: 'Postpartum Support Group', dueDate: '2026-10-31', tasks: ['Enroll in Postpartum Support Group', 'Weekly BH check-in', 'Sertraline titration review'] },
            { goal: 'Caregiver burden assessment completed', status: 'open', owner: 'Sarah Johnson', dueDate: '2026-06-30', tasks: ['Schedule PAM assessment', 'Refer to respite care resources'] },
          ],
        },
        {
          domain: 'Social Needs', color: '#b45309', icon: 'HomeIcon',
          goals: [
            { goal: 'Transportation barrier resolved by Q3 2026', status: 'in-progress', owner: 'Sarah Johnson', dueDate: '2026-09-30', tasks: ['Medicaid NEMT benefit activated', 'Rideshare coordination for appointments'] },
            { goal: 'Childcare subsidy enrolled by Jun 2026', status: 'open', owner: 'Sarah Johnson', dueDate: '2026-06-30', tasks: ['Complete DHS childcare application', 'Submit income verification'] },
            { goal: 'WIC re-enrollment by Jul 2026', status: 'open', owner: 'Sarah Johnson', dueDate: '2026-07-31', tasks: ['Schedule WIC office appointment', 'Gather household income documents'] },
          ],
        },
      ],
    },
    ehrMrn: 'MARIA_SD_001',
    name: 'Maria Redhawk',
    age: 34,
    gender: 'F',
    dob: '1992-06-15',
    phone: '(605) 555-0234',
    location: 'Martin, SD 57551',
    pcp: 'Bennett County Health',
    careManager: 'Sarah Johnson',
    organization: 'Bennett County Health (CAH)',
    contract: 'SD Medicaid',
    rafScore: 2.18,
    riskTier: 'Moderate',
    erRiskPct: 42,
    hccSuspects: 3,
    hccValue: 12400,
    pmpm: 1240,
    pmpmTarget: 780,
    episodeType: 'Postpartum Health',
    language: 'English',
    careGaps: [
      { id: 'mg-1', domain: 'Clinical', name: 'HbA1c Lab', status: 'Open', daysOpen: 38 },
      { id: 'mg-2', domain: 'Clinical', name: 'Edinburgh PND Screening', status: 'Open', daysOpen: 427 },
      { id: 'mg-4', domain: 'BH', name: 'Postpartum Depression Follow-up', status: 'In Progress', daysOpen: 427 },
      { id: 'mg-6', domain: 'Social', name: 'Transportation Barrier Resolution', status: 'In Progress', daysOpen: 38 },
      { id: 'mg-7', domain: 'Social', name: 'Childcare Subsidy Enrollment', status: 'Open', daysOpen: 60 },
    ],
    cdsCards: [
      { id: 'cds-maria-1', indicator: 'critical', summary: 'Edinburgh PND overdue 427 days — postpartum depression untreated', detail: 'Postpartum depression screening shows Edinburgh PND score 11 (Moderate). Immediate follow-up required.' },
      { id: 'cds-maria-2', indicator: 'warning', summary: 'HbA1c gap 38 days — pre-diabetes monitoring critical', detail: 'Pre-diabetic HbA1c recheck is 38 days overdue. Consider NEMT enrollment.' },
    ],
    // BH scores (written as FHIR Observations)
    bhScores: [
      { loinc: '89204-2', display: 'Edinburgh Postnatal Depression Scale', value: 11, unit: '{score}', date: '2026-05-01' },
      { loinc: '75624-7', display: 'AUDIT-C Total Score', value: 0, unit: '{score}', date: '2026-05-01' },
    ],
    // SDOH Observations (PRAPARE)
    sdohObservations: [
      { loinc: '93030-5', display: 'Housing instability', value: 'Waitlist #47 — SDHDA', date: '2026-05-01' },
      { loinc: '93031-3', display: 'Food insecurity', value: 'SNAP active · WIC expired', date: '2026-05-01' },
      { loinc: '93034-7', display: 'Transportation need', value: '47 miles — no reliable transport', date: '2026-05-01' },
    ],
    // Conditions (ICD-10 → FHIR Condition)
    conditions: [
      { id: 'mar-c1', icd10: 'O90.6', display: 'Postpartum mood disturbance', onset: '2025-07', status: 'active', category: 'encounter-diagnosis' },
      { id: 'mar-c2', icd10: 'R73.09', display: 'Pre-diabetes', onset: '2024-11', status: 'active', category: 'problem-list-item' },
      { id: 'mar-c3', icd10: 'Z62.89', display: 'Caregiver stress — mother and infant', onset: '2025-06', status: 'active', category: 'problem-list-item' },
    ],
    // Medications (→ FHIR MedicationRequest)
    medications: [
      { id: 'mar-m1', rxnorm: '378129', display: 'Prenatal Vitamin 1 tab Daily', dose: '1 tab', frequency: 'daily', prescriber: 'Bennett County Health', lastFill: '2026-04-15', status: 'active' },
      { id: 'mar-m2', rxnorm: '36437', display: 'Sertraline 25mg Daily', dose: '25 mg', frequency: 'daily', prescriber: 'Bennett County Health', lastFill: '2026-05-01', status: 'active' },
    ],
  },
  {
    platformId: 'PAT-0042',
    fhirId: 'patient-dorothy-042',
    carePlan: {
      domains: [
        {
          domain: 'Clinical', color: '#0043ce', icon: 'HeartIcon',
          goals: [
            { goal: 'A1C < 8.0 by Q3 2026', status: 'in-progress', owner: 'Dr. Whitfield', dueDate: '2026-09-30', tasks: ['Metformin titration', 'Diabetes education referral', 'A1C recheck in 90 days'] },
            { goal: 'BP < 130/80 by Q2 2026', status: 'open', owner: 'Dr. Whitfield', dueDate: '2026-06-30', tasks: ['Lisinopril 20mg titration', 'Home BP monitoring kit ordered'] },
            { goal: 'Spirometry completed by May 2026', status: 'open', owner: 'Dr. Whitfield', dueDate: '2026-05-31', tasks: ['Schedule spirometry at Ozark FQHC', 'COPD action plan update'] },
          ],
        },
        {
          domain: 'Behavioral Health', color: '#6929c4', icon: 'SparklesIcon',
          goals: [
            { goal: 'PHQ-9 score < 10 by Q3 2026', status: 'in-progress', owner: 'Cascade Valley BH', dueDate: '2026-09-30', tasks: ['Weekly BH counseling sessions', 'Antidepressant medication review', 'Safety plan documented'] },
          ],
        },
        {
          domain: 'Social Needs', color: '#b45309', icon: 'HomeIcon',
          goals: [
            { goal: 'Transport referral active by May 2026', status: 'completed', owner: 'Maria Gonzalez', dueDate: '2026-05-31', tasks: ['Unite Us TU-48821 activated', 'Transport coordinator assigned'] },
            { goal: 'SNAP re-certification by Jun 2026', status: 'open', owner: 'Maria Gonzalez', dueDate: '2026-06-30', tasks: ['Recertification paperwork submitted', 'DHS appointment confirmed'] },
          ],
        },
      ],
    },
    ehrMrn: 'MRN-0042',
    name: 'Dorothy Simmons',
    age: 75,
    gender: 'F',
    dob: '1951-03-14',
    phone: '(417) 555-0198',
    location: 'Ozark Regional FQHC Service Area',
    pcp: 'Dr. Whitfield',
    careManager: 'Sarah Johnson',
    organization: 'Ozark Regional FQHC',
    contract: 'MSSP Trk 3',
    rafScore: 3.42,
    riskTier: 'Critical',
    erRiskPct: 84,
    hccSuspects: 4,
    hccValue: 24800,
    pmpm: 2840,
    pmpmTarget: 890,
    episodeType: 'COPD Exacerbation',
    language: 'English',
    careGaps: [
      { id: 'gap-1', domain: 'Clinical', name: 'Spirometry (COPD)', status: 'Open', daysOpen: 42 },
      { id: 'gap-4', domain: 'Clinical', name: 'A1C Recheck', status: 'Open', daysOpen: 61 },
      { id: 'gap-7', domain: 'BH', name: 'PHQ-9 Follow-up', status: 'In Progress', daysOpen: 21 },
      { id: 'gap-9', domain: 'Social', name: 'Transport Referral — Active', status: 'In Progress', daysOpen: 18 },
    ],
    cdsCards: [
      { id: 'cds-dorothy-1', indicator: 'critical', summary: 'PHQ-9 14 — BH referral open since Mar 15, not engaged', detail: 'Moderate depression. BH referral to Cascade Valley BH sent Mar 15 — not engaged.' },
      { id: 'cds-dorothy-2', indicator: 'warning', summary: 'COPD Exacerbation — spirometry overdue 42 days', detail: 'Active COPD exacerbation episode. Follow-up within 7 days required per care plan.' },
    ],
    bhScores: [
      { loinc: '44249-1', display: 'PHQ-9 quick depression assessment panel', value: 14, unit: '{score}', date: '2026-03-15' },
      { loinc: '75624-7', display: 'AUDIT-C Total Score', value: 2, unit: '{score}', date: '2026-03-15' },
    ],
    sdohObservations: [
      { loinc: '93034-7', display: 'Transportation need', value: '38 miles to FQHC — active NEMT referral', date: '2026-03-15' },
      { loinc: '93031-3', display: 'Food insecurity', value: 'Screened — no flag', date: '2026-03-15' },
    ],
    conditions: [
      { id: 'dor-c1', icd10: 'J44.1', display: 'COPD with acute exacerbation', onset: '2026-03', status: 'active', category: 'encounter-diagnosis' },
      { id: 'dor-c2', icd10: 'E11.9', display: 'Type 2 diabetes without complications', onset: '2018-01', status: 'active', category: 'problem-list-item' },
      { id: 'dor-c3', icd10: 'F32.1', display: 'Major depressive disorder, single episode, moderate', onset: '2026-02', status: 'active', category: 'problem-list-item' },
      { id: 'dor-c4', icd10: 'I10', display: 'Essential hypertension', onset: '2010-06', status: 'active', category: 'problem-list-item' },
    ],
    medications: [
      { id: 'dor-m1', rxnorm: '435', display: 'Metformin 1000mg BID', dose: '1000 mg', frequency: 'twice daily', prescriber: 'Dr. Whitfield', lastFill: '2026-04-01', status: 'active' },
      { id: 'dor-m2', rxnorm: '29046', display: 'Lisinopril 10mg Daily', dose: '10 mg', frequency: 'daily', prescriber: 'Dr. Whitfield', lastFill: '2026-04-01', status: 'active' },
      { id: 'dor-m3', rxnorm: '41493', display: 'Tiotropium 18mcg Inhaled Daily', dose: '18 mcg', frequency: 'daily', prescriber: 'Dr. Whitfield', lastFill: '2026-03-20', status: 'active' },
      { id: 'dor-m4', rxnorm: '36567', display: 'Sertraline 50mg Daily', dose: '50 mg', frequency: 'daily', prescriber: 'Cascade Valley BH', lastFill: '2026-03-15', status: 'active' },
    ],
  },
  {
    platformId: 'PAT-0087',
    fhirId: 'patient-james-087',
    carePlan: {
      domains: [
        {
          domain: 'Clinical', color: '#0043ce', icon: 'HeartIcon',
          goals: [
            { goal: 'A1C < 7.5% by Q3 2026', status: 'in-progress', owner: 'Dr. Okonkwo', dueDate: '2026-09-30', tasks: ['Metformin 1000mg BID compliance review', 'A1C lab recheck', 'Diabetes education reinforcement'] },
            { goal: 'CHF BNP panel current', status: 'open', owner: 'Dr. Okonkwo', dueDate: '2026-05-15', tasks: ['BNP + CBC lab order', 'Daily weight log review', 'Carvedilol dose assessment'] },
          ],
        },
        {
          domain: 'Behavioral Health', color: '#6929c4', icon: 'SparklesIcon',
          goals: [
            { goal: 'PHQ-9 follow-up completed', status: 'open', owner: 'Sarah Johnson', dueDate: '2026-06-30', tasks: ['PHQ-9 re-assessment', 'BH referral if score > 10', 'Medication adherence counseling'] },
          ],
        },
        {
          domain: 'Social Needs', color: '#b45309', icon: 'HomeIcon',
          goals: [
            { goal: 'Transportation barrier addressed for specialist visits', status: 'open', owner: 'Sarah Johnson', dueDate: '2026-07-31', tasks: ['Medicaid NEMT enrollment', 'Coordinate cardiology transport'] },
            { goal: 'Medication adherence support enrolled', status: 'in-progress', owner: 'Sarah Johnson', dueDate: '2026-05-31', tasks: ['Pill organizer provided', 'Weekly check-in calls scheduled'] },
          ],
        },
      ],
    },
    ehrMrn: 'MRN-0087',
    name: 'James Wilson',
    age: 58,
    gender: 'M',
    dob: '1968-07-14',
    phone: '(605) 555-0223',
    location: 'Rural Route 2, Winner SD 57580',
    pcp: 'Dr. Okonkwo',
    careManager: 'Sarah Johnson',
    organization: 'Winner Regional Medical Center',
    contract: 'Medicaid RHTP Track 3',
    rafScore: 2.8,
    riskTier: 'High',
    erRiskPct: 67,
    hccSuspects: 3,
    hccValue: 18600,
    pmpm: 1840,
    pmpmTarget: 1200,
    episodeType: 'Diabetes · CHF',
    language: 'English',
    careGaps: [
      { id: 'jw-1', domain: 'Clinical', name: 'A1C Recheck (Diabetes)', status: 'Open', daysOpen: 45 },
      { id: 'jw-2', domain: 'Clinical', name: 'BNP Lab Panel (CHF)', status: 'Open', daysOpen: 22 },
      { id: 'jw-5', domain: 'BH', name: 'PHQ-9 Follow-up', status: 'Open', daysOpen: 30 },
      { id: 'jw-6', domain: 'Social', name: 'Transportation — Specialist Visits', status: 'Open', daysOpen: 45 },
    ],
    cdsCards: [
      { id: 'cds-james-1', indicator: 'warning', summary: 'A1C overdue 45 days — diabetes management gap', detail: 'Diabetic A1C recheck is 45 days overdue. Bundle labs to reduce patient travel burden.' },
      { id: 'cds-james-2', indicator: 'warning', summary: 'BNP panel overdue 22 days — CHF monitoring gap', detail: 'CHF monitoring BNP panel is 22 days overdue. Active CHF episode (89 days).' },
    ],
    bhScores: [
      { loinc: '44249-1', display: 'PHQ-9 quick depression assessment panel', value: 8, unit: '{score}', date: '2026-04-10' },
      { loinc: '75624-7', display: 'AUDIT-C Total Score', value: 4, unit: '{score}', date: '2026-04-10' },
    ],
    sdohObservations: [
      { loinc: '93034-7', display: 'Transportation need', value: 'Rural Route 2 — no public transit', date: '2026-04-10' },
    ],
    conditions: [
      { id: 'jaw-c1', icd10: 'E11.9', display: 'Type 2 diabetes without complications', onset: '2015-03', status: 'active', category: 'problem-list-item' },
      { id: 'jaw-c2', icd10: 'I50.9', display: 'Heart failure, unspecified', onset: '2024-06', status: 'active', category: 'encounter-diagnosis' },
      { id: 'jaw-c3', icd10: 'I10', display: 'Essential hypertension', onset: '2012-01', status: 'active', category: 'problem-list-item' },
    ],
    medications: [
      { id: 'jaw-m1', rxnorm: '435', display: 'Metformin 1000mg BID', dose: '1000 mg', frequency: 'twice daily', prescriber: 'Dr. Okonkwo', lastFill: '2026-04-15', status: 'active' },
      { id: 'jaw-m2', rxnorm: '203644', display: 'Carvedilol 25mg BID', dose: '25 mg', frequency: 'twice daily', prescriber: 'Dr. Okonkwo', lastFill: '2026-04-15', status: 'active' },
      { id: 'jaw-m3', rxnorm: '29046', display: 'Lisinopril 20mg Daily', dose: '20 mg', frequency: 'daily', prescriber: 'Dr. Okonkwo', lastFill: '2026-04-15', status: 'active' },
      { id: 'jaw-m4', rxnorm: '392464', display: 'Furosemide 40mg Daily', dose: '40 mg', frequency: 'daily', prescriber: 'Dr. Okonkwo', lastFill: '2026-04-01', status: 'active' },
    ],
  },
  {
    platformId: 'PAT-0103',
    fhirId: 'patient-robert-103',
    carePlan: {
      domains: [
        {
          domain: 'Clinical', color: '#0043ce', icon: 'HeartIcon',
          goals: [
            { goal: 'BP < 130/80 by Q3 2026', status: 'in-progress', owner: 'Dr. Castillo', dueDate: '2026-09-30', tasks: ['Amlodipine 10mg + Losartan 100mg continued', 'Home BP log weekly', 'Sodium-restricted diet counseling'] },
            { goal: 'eGFR stabilized ≥ 40 by Q4 2026', status: 'in-progress', owner: 'Dr. Castillo', dueDate: '2026-12-31', tasks: ['Quarterly eGFR monitoring', 'UACR lab ordered', 'Nephrology referral if eGFR < 35'] },
          ],
        },
        {
          domain: 'Behavioral Health', color: '#6929c4', icon: 'SparklesIcon',
          goals: [
            { goal: 'AUDIT-C counseling completed', status: 'open', owner: 'Sarah Johnson', dueDate: '2026-06-30', tasks: ['Brief alcohol intervention session', 'Follow-up AUDIT-C in 3 months'] },
          ],
        },
        {
          domain: 'Social Needs', color: '#b45309', icon: 'HomeIcon',
          goals: [
            { goal: 'Medication cost assistance enrolled', status: 'in-progress', owner: 'Sarah Johnson', dueDate: '2026-05-31', tasks: ['Patient Assistance Program application submitted', 'Pharmacy discount card provided'] },
          ],
        },
      ],
    },
    ehrMrn: 'MRN-0103',
    name: 'Robert Chen',
    age: 62,
    gender: 'M',
    dob: '1964-11-03',
    phone: '(605) 555-0334',
    location: '847 Oak Street, Rapid City SD 57701',
    pcp: 'Dr. Castillo',
    careManager: 'Sarah Johnson',
    organization: 'Rapid City Regional Health',
    contract: 'Medicaid RHTP Track 3',
    rafScore: 1.9,
    riskTier: 'High',
    erRiskPct: 52,
    hccSuspects: 2,
    hccValue: 11200,
    pmpm: 980,
    pmpmTarget: 750,
    episodeType: 'Hypertension · CKD',
    language: 'English / Mandarin',
    careGaps: [
      { id: 'rc-1', domain: 'Clinical', name: 'BP Control Check', status: 'Open', daysOpen: 28 },
      { id: 'rc-2', domain: 'Clinical', name: 'eGFR / Creatinine (CKD)', status: 'Open', daysOpen: 42 },
      { id: 'rc-4', domain: 'BH', name: 'AUDIT-C Follow-up Counseling', status: 'Open', daysOpen: 21 },
    ],
    cdsCards: [
      { id: 'cds-robert-1', indicator: 'warning', summary: 'BP control check overdue 28 days — hypertension gap', detail: 'Last BP reading 158/96. Target <130/80. CKD makes BP control critical.' },
      { id: 'cds-robert-2', indicator: 'warning', summary: 'eGFR overdue 42 days — CKD monitoring gap', detail: 'CKD monitoring labs overdue. Last eGFR 42 (Stage 3b). Nephrology referral recommended.' },
    ],
    bhScores: [
      { loinc: '44249-1', display: 'PHQ-9 quick depression assessment panel', value: 3, unit: '{score}', date: '2026-04-20' },
      { loinc: '75624-7', display: 'AUDIT-C Total Score', value: 6, unit: '{score}', date: '2026-04-20' },
    ],
    sdohObservations: [
      { loinc: '93031-3', display: 'Food insecurity', value: 'Secure', date: '2026-04-20' },
    ],
    conditions: [
      { id: 'roc-c1', icd10: 'I10', display: 'Essential hypertension', onset: '2008-01', status: 'active', category: 'problem-list-item' },
      { id: 'roc-c2', icd10: 'N18.3', display: 'Chronic kidney disease, stage 3', onset: '2020-06', status: 'active', category: 'problem-list-item' },
    ],
    medications: [
      { id: 'roc-m1', rxnorm: '29046', display: 'Lisinopril 10mg Daily', dose: '10 mg', frequency: 'daily', prescriber: 'Dr. Castillo', lastFill: '2026-04-15', status: 'active' },
      { id: 'roc-m2', rxnorm: '41127', display: 'Amlodipine 5mg Daily', dose: '5 mg', frequency: 'daily', prescriber: 'Dr. Castillo', lastFill: '2026-04-15', status: 'active' },
    ],
  },
  {
    platformId: 'PAT-0156',
    fhirId: 'patient-lisa-156',
    carePlan: {
      domains: [
        {
          domain: 'Clinical', color: '#0043ce', icon: 'HeartIcon',
          goals: [
            { goal: 'Asthma action plan updated by Jun 2026', status: 'open', owner: 'Dr. Torres', dueDate: '2026-06-30', tasks: ['Spirometry scheduled', 'Inhaler technique re-evaluation', 'Rescue medication plan updated'] },
            { goal: 'BMI reduction -15 lbs by Q4 2026', status: 'in-progress', owner: 'Dr. Torres', dueDate: '2026-12-31', tasks: ['Weight management program enrolled', 'Weekly weigh-in log', 'SNAP-Ed nutrition counseling'] },
          ],
        },
        {
          domain: 'Behavioral Health', color: '#6929c4', icon: 'SparklesIcon',
          goals: [
            { goal: 'PHQ-9 annual screening completed', status: 'open', owner: 'Sarah Johnson', dueDate: '2026-06-30', tasks: ['PHQ-9 assessment scheduled', 'Review results with PCP'] },
          ],
        },
        {
          domain: 'Social Needs', color: '#b45309', icon: 'HomeIcon',
          goals: [
            { goal: 'Nutrition counseling enrollment by Jul 2026', status: 'open', owner: 'Sarah Johnson', dueDate: '2026-07-31', tasks: ['SNAP-Ed program referral sent', 'Confirm enrollment with community partner'] },
          ],
        },
      ],
    },
    ehrMrn: 'MRN-0156',
    name: 'Lisa Thompson',
    age: 41,
    gender: 'F',
    dob: '1985-05-19',
    phone: '(605) 555-0412',
    location: '223 Pine Ave, Sioux Falls SD 57104',
    pcp: 'Dr. Torres',
    careManager: 'Sarah Johnson',
    organization: 'Sioux Falls Community Health',
    contract: 'Medicaid RHTP Track 3',
    rafScore: 1.4,
    riskTier: 'Moderate',
    erRiskPct: 31,
    hccSuspects: 1,
    hccValue: 5800,
    pmpm: 620,
    pmpmTarget: 480,
    episodeType: 'Asthma · Obesity',
    language: 'English',
    careGaps: [
      { id: 'lt-1', domain: 'Clinical', name: 'Asthma Action Plan Update', status: 'Open', daysOpen: 35 },
      { id: 'lt-2', domain: 'Clinical', name: 'BMI / Weight Management Referral', status: 'In Progress', daysOpen: 60 },
      { id: 'lt-3', domain: 'BH', name: 'PHQ-9 Annual Screening', status: 'Open', daysOpen: 18 },
      { id: 'lt-4', domain: 'Social', name: 'Nutrition Counseling Enrollment', status: 'Open', daysOpen: 45 },
    ],
    cdsCards: [
      { id: 'cds-lisa-1', indicator: 'info', summary: 'Asthma action plan update overdue 35 days', detail: 'Annual asthma action plan review is 35 days overdue. Consider spirometry.' },
      { id: 'cds-lisa-2', indicator: 'info', summary: 'Weight management referral in progress — BMI elevated', detail: 'BMI elevated. SNAP-Ed nutrition counseling eligible.' },
    ],
    bhScores: [
      { loinc: '44249-1', display: 'PHQ-9 quick depression assessment panel', value: 5, unit: '{score}', date: '2026-04-25' },
      { loinc: '75624-7', display: 'AUDIT-C Total Score', value: 1, unit: '{score}', date: '2026-04-25' },
    ],
    sdohObservations: [
      { loinc: '93031-3', display: 'Food insecurity', value: 'Secure', date: '2026-04-25' },
      { loinc: '93034-7', display: 'Transportation need', value: 'Urban — bus accessible', date: '2026-04-25' },
    ],
    conditions: [
      { id: 'lit-c1', icd10: 'J45.20', display: 'Mild intermittent asthma, uncomplicated', onset: '2010-01', status: 'active', category: 'problem-list-item' },
      { id: 'lit-c2', icd10: 'E66.9', display: 'Obesity, unspecified', onset: '2018-01', status: 'active', category: 'problem-list-item' },
    ],
    medications: [
      { id: 'lit-m1', rxnorm: '745679', display: 'Albuterol 90mcg inhaler 2 puffs PRN', dose: '90 mcg', frequency: 'as needed', prescriber: 'Dr. Torres', lastFill: '2026-04-20', status: 'active' },
      { id: 'lit-m2', rxnorm: '866514', display: 'Fluticasone 110mcg inhaler Daily', dose: '110 mcg', frequency: 'daily', prescriber: 'Dr. Torres', lastFill: '2026-04-20', status: 'active' },
    ],
  },
];

// ─── FHIR R4 Resource Builders ────────────────────────────────────────────────

function buildGender(g) {
  return g === 'M' ? 'male' : g === 'F' ? 'female' : 'unknown';
}

/** Build a FHIR R4 Patient resource */
function buildPatient(p) {
  const [family, ...givenParts] = p.name.split(' ').reverse();
  const given = givenParts.reverse();
  return {
    resourceType: 'Patient',
    id: p.fhirId,
    identifier: [
      { system: 'urn:tcoc:platform-id', value: p.platformId },
      { system: 'urn:tcoc:ehr-mrn', value: p.ehrMrn },
    ],
    name: [{ use: 'official', family, given }],
    gender: buildGender(p.gender),
    birthDate: p.dob,
    telecom: [{ system: 'phone', value: p.phone, use: 'home' }],
    address: [{ use: 'home', text: p.location }],
    communication: [
      {
        language: {
          coding: [{ system: 'urn:ietf:bcp:47', code: p.language.startsWith('English') ? 'en' : 'zh' }],
          text: p.language,
        },
        preferred: true,
      },
    ],
    extension: [
      {
        url: 'http://tcoc.example.org/fhir/StructureDefinition/raf-score',
        valueDecimal: p.rafScore,
      },
      {
        url: 'http://tcoc.example.org/fhir/StructureDefinition/risk-tier',
        valueString: p.riskTier,
      },
      {
        url: 'http://tcoc.example.org/fhir/StructureDefinition/er-risk-pct',
        valueInteger: p.erRiskPct,
      },
      {
        url: 'http://tcoc.example.org/fhir/StructureDefinition/care-manager',
        valueString: p.careManager,
      },
      {
        url: 'http://tcoc.example.org/fhir/StructureDefinition/episode-type',
        valueString: p.episodeType,
      },
      {
        url: 'http://tcoc.example.org/fhir/StructureDefinition/pmpm',
        valueDecimal: p.pmpm,
      },
      {
        url: 'http://tcoc.example.org/fhir/StructureDefinition/pmpm-target',
        valueDecimal: p.pmpmTarget,
      },
      {
        url: 'http://tcoc.example.org/fhir/StructureDefinition/contract',
        valueString: p.contract,
      },
    ],
    managingOrganization: { display: p.organization },
    generalPractitioner: [{ display: p.pcp }],
  };
}

/** Build a FHIR R4 Observation for a care gap */
function buildCareGapObservation(p, gap) {
  const statusMap = {
    Open: 'preliminary',
    'In Progress': 'registered',
    Closed: 'final',
    Waived: 'cancelled',
  };
  const categoryCode = gap.domain === 'Clinical' ? '11503-0' : gap.domain === 'BH' ? '75626-2' : '75630-4';
  return {
    resourceType: 'Observation',
    id: `${p.fhirId}-gap-${gap.id}`,
    status: statusMap[gap.status] ?? 'preliminary',
    category: [
      {
        coding: [
          { system: 'http://loinc.org', code: categoryCode, display: gap.domain + ' Care Gap' },
        ],
      },
    ],
    code: { text: gap.name },
    subject: { reference: `Patient/${p.fhirId}` },
    valueInteger: gap.daysOpen,
    note: [{ text: `Care gap open for ${gap.daysOpen} days. Domain: ${gap.domain}. Status: ${gap.status}.` }],
    extension: [
      { url: 'http://tcoc.example.org/fhir/StructureDefinition/care-gap-domain', valueString: gap.domain },
      { url: 'http://tcoc.example.org/fhir/StructureDefinition/care-gap-status', valueString: gap.status },
      { url: 'http://tcoc.example.org/fhir/StructureDefinition/care-gap-days-open', valueInteger: gap.daysOpen },
      { url: 'http://tcoc.example.org/fhir/StructureDefinition/tcoc-gap-id', valueString: gap.id },
    ],
  };
}

/** Build a FHIR R4 Flag for a CDS alert card */
function buildCdsFlag(p, card) {
  const severityMap = { critical: 'error', warning: 'warning', info: 'information' };
  return {
    resourceType: 'Flag',
    id: `${p.fhirId}-flag-${card.id}`,
    status: 'active',
    category: [
      {
        coding: [
          { system: 'http://terminology.hl7.org/CodeSystem/flag-category', code: 'clinical', display: 'Clinical' },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: 'http://tcoc.example.org/fhir/CodeSystem/cds-indicator',
          code: card.indicator,
          display: severityMap[card.indicator],
        },
      ],
      text: card.summary,
    },
    subject: { reference: `Patient/${p.fhirId}` },
    extension: [
      { url: 'http://tcoc.example.org/fhir/StructureDefinition/cds-detail', valueString: card.detail },
      { url: 'http://tcoc.example.org/fhir/StructureDefinition/tcoc-cds-id', valueString: card.id },
    ],
  };
}

/** Build a FHIR R4 RiskAssessment */
function buildRiskAssessment(p) {
  return {
    resourceType: 'RiskAssessment',
    id: `${p.fhirId}-risk`,
    status: 'final',
    subject: { reference: `Patient/${p.fhirId}` },
    prediction: [
      {
        outcome: { text: 'Emergency Room Visit' },
        probabilityDecimal: p.erRiskPct / 100,
        rationale: `Predicted ER risk ${p.erRiskPct}% based on RAF score ${p.rafScore} and clinical profile.`,
      },
    ],
    extension: [
      { url: 'http://tcoc.example.org/fhir/StructureDefinition/raf-score', valueDecimal: p.rafScore },
      { url: 'http://tcoc.example.org/fhir/StructureDefinition/hcc-suspects', valueInteger: p.hccSuspects },
      { url: 'http://tcoc.example.org/fhir/StructureDefinition/hcc-value', valueDecimal: p.hccValue },
    ],
  };
}

/** Build a FHIR R4 Observation for a BH screening score (PHQ-9, Edinburgh PND, AUDIT-C) */
function buildBhScoreObservation(p, bh) {
  return {
    resourceType: 'Observation',
    id: `${p.fhirId}-bh-${bh.loinc}`,
    status: 'final',
    category: [
      { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'survey', display: 'Survey' }] },
    ],
    code: {
      coding: [{ system: 'http://loinc.org', code: bh.loinc, display: bh.display }],
      text: bh.display,
    },
    subject: { reference: `Patient/${p.fhirId}` },
    effectiveDateTime: bh.date,
    valueQuantity: { value: bh.value, unit: bh.unit, system: 'http://unitsofmeasure.org', code: bh.unit },
    extension: [
      { url: 'http://tcoc.example.org/fhir/StructureDefinition/tcoc-bh-score', valueDecimal: bh.value },
    ],
  };
}

/** Build a FHIR R4 Observation for a SDOH / PRAPARE item */
function buildSdohObservation(p, sdoh) {
  return {
    resourceType: 'Observation',
    id: `${p.fhirId}-sdoh-${sdoh.loinc}`,
    status: 'final',
    category: [
      { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'social-history', display: 'Social History' }] },
    ],
    code: {
      coding: [{ system: 'http://loinc.org', code: sdoh.loinc, display: sdoh.display }],
      text: sdoh.display,
    },
    subject: { reference: `Patient/${p.fhirId}` },
    effectiveDateTime: sdoh.date,
    valueString: sdoh.value,
  };
}

/** Build a FHIR R4 Condition resource from an ICD-10 entry */
function buildCondition(p, cond) {
  return {
    resourceType: 'Condition',
    id: `${p.fhirId}-cond-${cond.id}`,
    clinicalStatus: {
      coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: cond.status }],
    },
    category: [
      { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-category', code: cond.category, display: cond.category }] },
    ],
    code: {
      coding: [{ system: 'http://hl7.org/fhir/sid/icd-10', code: cond.icd10, display: cond.display }],
      text: cond.display,
    },
    subject: { reference: `Patient/${p.fhirId}` },
    onsetDateTime: cond.onset,
  };
}

/** Build a FHIR R4 MedicationRequest resource */
function buildMedicationRequest(p, med) {
  return {
    resourceType: 'MedicationRequest',
    id: `${p.fhirId}-med-${med.id}`,
    status: med.status,
    intent: 'order',
    medicationCodeableConcept: {
      coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: med.rxnorm, display: med.display }],
      text: med.display,
    },
    subject: { reference: `Patient/${p.fhirId}` },
    requester: { display: med.prescriber },
    dosageInstruction: [
      {
        text: `${med.dose} ${med.frequency}`,
        timing: { code: { text: med.frequency } },
      },
    ],
    note: [{ text: `Last fill: ${med.lastFill}` }],
    extension: [
      { url: 'http://tcoc.example.org/fhir/StructureDefinition/last-fill-date', valueString: med.lastFill },
    ],
  };
}

/** Normalize a platform ID to a FHIR-safe resource ID (no underscores/spaces) */
function safeFhirId(platformId) {
  return platformId.replace(/[^A-Za-z0-9\-\.]/g, '-');
}

/** Build a FHIR R4 CarePlan resource from carePlan.domains data */
function buildCarePlan(p) {
  const domains = p.carePlan?.domains ?? [];
  const activity = domains.flatMap((d) =>
    d.goals.map((g) => ({
      detail: {
        status: g.status === 'completed' ? 'completed' : g.status === 'in-progress' ? 'in-progress' : 'not-started',
        description: `[${d.domain}] ${g.goal} — Owner: ${g.owner}, Due: ${g.dueDate}, Tasks: ${g.tasks.join(' | ')}`,
      },
    }))
  );
  return {
    resourceType: 'CarePlan',
    id: `cp-${safeFhirId(p.platformId)}`,
    status: 'active',
    intent: 'plan',
    title: `Whole Person Care Plan — ${p.name}`,
    subject: { reference: `Patient/${p.fhirId}` },
    created: '2026-01-01',
    author: { display: 'TCOC Platform (auto-seeded)' },
    activity,
    note: [{ text: JSON.stringify(domains) }],
    extension: [
      { url: 'http://tcoc.example.org/fhir/StructureDefinition/care-plan-domains', valueString: JSON.stringify(domains) },
    ],
  };
}

/** Build a FHIR R4 CareTeam resource */
function buildCareTeam(p) {
  // SNOMED-CT role codes
  const SNOMED = {
    PCP: '446050000',           // Primary Care Physician
    CareManager: '768820003',   // Care Coordinator
    CHW: '56961003',            // Community Health Worker
    BHProvider: '224587008',    // Mental Health Practitioner
    Pharmacist: '46255001',     // Pharmacist
  };

  // Per-patient team members derived from the patient data
  const pcpName = p.pcp || 'PCP';
  const cmName = p.careManager || 'Care Manager';

  // BH provider from the care gaps
  const hasBhGap = p.careGaps.some((g) => g.domain === 'BH');
  const bhProviderName = hasBhGap
    ? (p.platformId === 'PAT-0042' ? 'Cascade Valley BH'
       : p.platformId === 'MARIA_SD_001' ? 'Postpartum Support Group'
       : 'RHTP BH Services')
    : null;

  const participants = [
    {
      role: [{ coding: [{ system: 'http://snomed.info/sct', code: SNOMED.PCP, display: 'Primary Care Physician' }] }],
      member: { display: pcpName },
      extension: [{ url: 'http://tcoc.example.org/fhir/StructureDefinition/careteam-role', valueString: 'PCP' }],
    },
    {
      role: [{ coding: [{ system: 'http://snomed.info/sct', code: SNOMED.CareManager, display: 'Care Coordinator' }] }],
      member: { display: cmName },
      extension: [{ url: 'http://tcoc.example.org/fhir/StructureDefinition/careteam-role', valueString: 'CareManager' }],
    },
    {
      role: [{ coding: [{ system: 'http://snomed.info/sct', code: SNOMED.CHW, display: 'Community Health Worker' }] }],
      member: { display: 'CHW Navigator' },
      extension: [{ url: 'http://tcoc.example.org/fhir/StructureDefinition/careteam-role', valueString: 'CHW' }],
    },
  ];

  if (bhProviderName) {
    participants.push({
      role: [{ coding: [{ system: 'http://snomed.info/sct', code: SNOMED.BHProvider, display: 'Mental Health Practitioner' }] }],
      member: { display: bhProviderName },
      extension: [{ url: 'http://tcoc.example.org/fhir/StructureDefinition/careteam-role', valueString: 'BHProvider' }],
    });
  }

  return {
    resourceType: 'CareTeam',
    id: `${p.fhirId}-careteam`,
    status: 'active',
    name: `${p.name} — RHTP Integrated Care Team`,
    subject: { reference: `Patient/${p.fhirId}`, display: p.name },
    managingOrganization: [{ display: p.organization || 'RHTP Platform' }],
    participant: participants,
    extension: [
      { url: 'http://tcoc.example.org/fhir/StructureDefinition/tcoc-platform-id', valueString: p.platformId },
    ],
  };
}

/** Build FHIR R4 Encounter resources (recent encounters for episode summary) */
function buildEncounters(p) {
  // Each patient gets 2–3 recent encounters based on their episodeType
  const baseDate = new Date('2026-05-01');
  const encounters = [];

  // Primary episode encounter
  encounters.push({
    resourceType: 'Encounter',
    id: `${p.fhirId}-enc-1`,
    status: 'finished',
    class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'ambulatory' },
    type: [{ coding: [{ system: 'http://snomed.info/sct', code: '11429006', display: 'Consultation' }], text: `${p.episodeType} Episode Consultation` }],
    subject: { reference: `Patient/${p.fhirId}`, display: p.name },
    participant: [{ individual: { display: p.pcp } }],
    period: {
      start: new Date(baseDate.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date(baseDate.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    serviceProvider: { display: p.organization },
    reasonCode: [{ text: `${p.episodeType} — follow-up visit` }],
  });

  // Care management visit
  encounters.push({
    resourceType: 'Encounter',
    id: `${p.fhirId}-enc-2`,
    status: 'finished',
    class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'PHN', display: 'phone' },
    type: [{ coding: [{ system: 'http://snomed.info/sct', code: '386372002', display: 'Care management service' }], text: 'Care Management Check-in' }],
    subject: { reference: `Patient/${p.fhirId}`, display: p.name },
    participant: [{ individual: { display: p.careManager } }],
    period: {
      start: new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    serviceProvider: { display: p.organization },
    reasonCode: [{ text: 'Care management follow-up call' }],
  });

  // Most recent encounter
  encounters.push({
    resourceType: 'Encounter',
    id: `${p.fhirId}-enc-3`,
    status: 'finished',
    class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'ambulatory' },
    type: [{ coding: [{ system: 'http://snomed.info/sct', code: '11429006', display: 'Consultation' }], text: 'Preventive Care Visit' }],
    subject: { reference: `Patient/${p.fhirId}`, display: p.name },
    participant: [{ individual: { display: p.pcp } }],
    period: {
      start: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    serviceProvider: { display: p.organization },
    reasonCode: [{ text: 'Annual preventive care' }],
  });

  return encounters;
}

/** Build FHIR R4 Goal resources from carePlan domains */
function buildGoals(p) {
  const goals = [];
  const domains = p.carePlan?.domains ?? [];
  for (const domain of domains) {
    for (let i = 0; i < domain.goals.length; i++) {
      const g = domain.goals[i];
      const statusMap = { open: 'planned', 'in-progress': 'active', completed: 'completed', pending: 'proposed' };
      goals.push({
        resourceType: 'Goal',
        id: `${p.fhirId}-goal-${domain.domain.toLowerCase().replace(/\s+/g, '-')}-${i}`,
        lifecycleStatus: statusMap[g.status] ?? 'planned',
        description: { text: g.goal },
        subject: { reference: `Patient/${p.fhirId}`, display: p.name },
        target: [
          {
            measure: { text: domain.domain },
            detailString: g.goal,
            dueDate: g.dueDate,
          },
        ],
        note: [{ text: `Owner: ${g.owner}. Tasks: ${g.tasks.join(' | ')}` }],
        extension: [
          { url: 'http://tcoc.example.org/fhir/StructureDefinition/care-plan-domain', valueString: domain.domain },
          { url: 'http://tcoc.example.org/fhir/StructureDefinition/goal-owner', valueString: g.owner },
        ],
      });
    }
  }
  return goals;
}

/** Build a FHIR R4 Task resource for a care gap */
function buildTask(p, gap) {
  const isClinicOrBh = gap.domain === 'Clinical' || gap.domain === 'BH';
  const owner = isClinicOrBh ? 'practitioner-rick' : 'practitioner-jon';
  const priority = gap.daysOpen > 30 ? 'urgent' : 'routine';
  return {
    resourceType: 'Task',
    id: `${p.fhirId}-task-${gap.id}`,
    status: 'requested',
    intent: 'order',
    priority,
    code: { text: gap.name },
    description: gap.name,
    for: { reference: `Patient/${p.fhirId}`, display: p.name },
    executionPeriod: {
      start: new Date().toISOString().split('T')[0],
      end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    owner: { reference: `Practitioner/${owner}`, display: isClinicOrBh ? 'Dr. Rick Williams' : 'Dr. Jon Noyes' },
    requester: { display: p.careManager },
    note: [{ text: `${gap.domain} care gap. Days open: ${gap.daysOpen}. Status: ${gap.status}.` }],
    extension: [
      { url: 'http://tcoc.example.org/fhir/StructureDefinition/care-gap-domain', valueString: gap.domain },
      { url: 'http://tcoc.example.org/fhir/StructureDefinition/care-gap-status', valueString: gap.status },
      { url: 'http://tcoc.example.org/fhir/StructureDefinition/tcoc-gap-id', valueString: gap.id },
    ],
  };
}

/** Assemble a FHIR transaction Bundle for one patient */
function buildTransactionBundle(p) {
  const entries = [];

  // Patient resource (upsert via conditional PUT)
  entries.push({
    resource: buildPatient(p),
    request: { method: 'PUT', url: `Patient/${p.fhirId}` },
  });

  // Care gap observations
  for (const gap of p.careGaps) {
    const obs = buildCareGapObservation(p, gap);
    entries.push({ resource: obs, request: { method: 'PUT', url: `Observation/${obs.id}` } });
  }

  // BH screening score observations
  for (const bh of (p.bhScores ?? [])) {
    const obs = buildBhScoreObservation(p, bh);
    entries.push({ resource: obs, request: { method: 'PUT', url: `Observation/${obs.id}` } });
  }

  // SDOH / PRAPARE observations
  for (const sdoh of (p.sdohObservations ?? [])) {
    const obs = buildSdohObservation(p, sdoh);
    entries.push({ resource: obs, request: { method: 'PUT', url: `Observation/${obs.id}` } });
  }

  // CDS alert flags
  for (const card of p.cdsCards) {
    const flag = buildCdsFlag(p, card);
    entries.push({ resource: flag, request: { method: 'PUT', url: `Flag/${flag.id}` } });
  }

  // Conditions (ICD-10)
  for (const cond of (p.conditions ?? [])) {
    const res = buildCondition(p, cond);
    entries.push({ resource: res, request: { method: 'PUT', url: `Condition/${res.id}` } });
  }

  // MedicationRequests
  for (const med of (p.medications ?? [])) {
    const res = buildMedicationRequest(p, med);
    entries.push({ resource: res, request: { method: 'PUT', url: `MedicationRequest/${res.id}` } });
  }

  // Risk assessment
  const risk = buildRiskAssessment(p);
  entries.push({ resource: risk, request: { method: 'PUT', url: `RiskAssessment/${risk.id}` } });

  // CarePlan (whole person)
  if (p.carePlan) {
    const cp = buildCarePlan(p);
    entries.push({ resource: cp, request: { method: 'PUT', url: `CarePlan/${cp.id}` } });
  }

  // CareTeam
  const careTeam = buildCareTeam(p);
  entries.push({ resource: careTeam, request: { method: 'PUT', url: `CareTeam/${careTeam.id}` } });

  // Encounters
  for (const enc of buildEncounters(p)) {
    entries.push({ resource: enc, request: { method: 'PUT', url: `Encounter/${enc.id}` } });
  }

  // Goals
  for (const goal of buildGoals(p)) {
    entries.push({ resource: goal, request: { method: 'PUT', url: `Goal/${goal.id}` } });
  }

  // Tasks (one per care gap)
  for (const gap of p.careGaps) {
    const task = buildTask(p, gap);
    entries.push({ resource: task, request: { method: 'PUT', url: `Task/${task.id}` } });
  }

  // EpisodeOfCare
  const eoc = buildEpisodeOfCare(p);
  entries.push({ resource: eoc, request: { method: 'PUT', url: `EpisodeOfCare/${eoc.id}` } });

  return {
    resourceType: 'Bundle',
    type: 'transaction',
    entry: entries,
  };
}

/** Build a FHIR R4 EpisodeOfCare resource */
function buildEpisodeOfCare(p) {
  const episodeTypeMap = {
    'Postpartum Care Management': { code: '58332002', display: 'Postpartum care' },
    'CHF Care Management': { code: '84114007', display: 'Heart failure' },
    'Diabetes Care Management': { code: '73211009', display: 'Diabetes mellitus' },
    'COPD Care Management': { code: '13645005', display: 'COPD' },
    'Multi-Chronic Condition Management': { code: '134407002', display: 'Multiple chronic conditions' },
  };
  const epType = episodeTypeMap[p.episodeType] ?? { code: '134407002', display: p.episodeType || 'Episode of Care' };
  return {
    resourceType: 'EpisodeOfCare',
    id: `${p.fhirId}-episode`,
    status: 'active',
    type: [{ coding: [{ system: 'http://snomed.info/sct', code: epType.code, display: epType.display }], text: p.episodeType }],
    patient: { reference: `Patient/${p.fhirId}`, display: p.name },
    managingOrganization: { display: p.organization || 'RHTP Network' },
    period: { start: '2026-01-01' },
    careManager: { display: p.careManager || 'Care Manager' },
    team: [{ reference: `CareTeam/${p.fhirId}-careteam` }],
    extension: [
      { url: 'http://tcoc.example.org/fhir/StructureDefinition/tcoc-platform-id', valueString: p.platformId },
      { url: 'http://tcoc.example.org/fhir/StructureDefinition/episode-status', valueString: p.episodeStatus || 'Active' },
      { url: 'http://tcoc.example.org/fhir/StructureDefinition/episode-days-active', valueInteger: p.episodeDaysActive || 0 },
    ],
  };
}

// ─── CBO Organization resources ───────────────────────────────────────────────

const CBO_ORGANIZATIONS = [
  { id: 'org-bennett-cbo-001', name: 'Bennett County Food Pantry', domain: 'Food Security', phone: '(605) 685-1122', city: 'Martin, SD', zip: '57551', capacity: 'Accepting' },
  { id: 'org-bennett-cbo-002', name: 'SD Section 8 Housing Assist.', domain: 'Housing', phone: '(605) 685-2200', city: 'Martin, SD', zip: '57551', capacity: 'Waitlist' },
  { id: 'org-bennett-cbo-003', name: 'Bennett County NEMT', domain: 'Transportation', phone: '(605) 685-3300', city: 'Martin, SD', zip: '57551', capacity: 'Accepting' },
  { id: 'org-bennett-cbo-004', name: 'Postpartum Support Network', domain: 'Behavioral Health', phone: '(605) 685-4400', city: 'Martin, SD', zip: '57551', capacity: 'Accepting' },
  { id: 'org-bennett-cbo-005', name: 'SNAP / DHS Outreach', domain: 'Food Security', phone: '(605) 685-5500', city: 'Martin, SD', zip: '57551', capacity: 'Accepting' },
  { id: 'org-bennett-cbo-006', name: 'Cascade Valley BH Services', domain: 'Behavioral Health', phone: '(509) 428-8500', city: 'Arlington, WA', zip: '98223', capacity: 'Accepting' },
  { id: 'org-bennett-cbo-007', name: 'WA Apple Health NEMT', domain: 'Transportation', phone: '(800) 523-8278', city: 'Olympia, WA', zip: '98501', capacity: 'Accepting' },
  { id: 'org-bennett-cbo-008', name: 'King County Housing Auth.', domain: 'Housing', phone: '(206) 214-1300', city: 'Seattle, WA', zip: '98104', capacity: 'Accepting' },
];

function buildCboOrganizationBundle() {
  const entries = CBO_ORGANIZATIONS.map((cbo) => ({
    resource: {
      resourceType: 'Organization',
      id: cbo.id,
      active: true,
      name: cbo.name,
      type: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/organization-type', code: 'cbo', display: 'Community-Based Organization' }] }],
      telecom: [{ system: 'phone', value: cbo.phone }],
      address: [{ city: cbo.city, postalCode: cbo.zip, country: 'US' }],
      extension: [
        { url: 'http://tcoc.example.org/fhir/StructureDefinition/cbo-domain', valueString: cbo.domain },
        { url: 'http://tcoc.example.org/fhir/StructureDefinition/cbo-capacity', valueString: cbo.capacity },
      ],
    },
    request: { method: 'PUT', url: `Organization/${cbo.id}` },
  }));
  return { resourceType: 'Bundle', type: 'transaction', entry: entries };
}

// ─── Practitioner resources ───────────────────────────────────────────────────

function buildPractitionerBundle() {
  const practitioners = [
    {
      id: 'practitioner-rick',
      family: 'Hennessy', given: ['Rick'],
      role: 'PCP', specialty: 'Primary Care',
      npi: '1234567890', org: 'Bennett County Health',
    },
    {
      id: 'practitioner-jon',
      family: 'Specialist', given: ['Jon'],
      role: 'Specialist', specialty: 'Internal Medicine',
      npi: '0987654321', org: 'Avera Sacred Heart',
    },
    {
      id: 'practitioner-whitfield',
      family: 'Whitfield', given: ['James'],
      role: 'PCP', specialty: 'Primary Care',
      npi: '1122334455', org: 'Bennett County Health',
    },
    {
      id: 'practitioner-sarah',
      family: 'Johnson', given: ['Sarah'],
      role: 'CareManager', specialty: 'Care Management',
      npi: '5544332211', org: 'RHTP Network',
    },
  ];

  const entries = practitioners.map((prac) => ({
    resource: {
      resourceType: 'Practitioner',
      id: prac.id,
      active: true,
      name: [{ use: 'official', family: prac.family, given: prac.given }],
      identifier: [{ system: 'http://hl7.org/fhir/sid/us-npi', value: prac.npi }],
      qualification: [{ code: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0360', code: 'MD' }], text: prac.specialty } }],
      extension: [
        { url: 'http://tcoc.example.org/fhir/StructureDefinition/practitioner-role', valueString: prac.role },
        { url: 'http://tcoc.example.org/fhir/StructureDefinition/practitioner-org', valueString: prac.org },
      ],
    },
    request: { method: 'PUT', url: `Practitioner/${prac.id}` },
  }));
  return { resourceType: 'Bundle', type: 'transaction', entry: entries };
}

// ─── Consent resources ────────────────────────────────────────────────────────

function buildConsentBundle() {
  /**
   * Seeds FHIR R4 Consent records matching the CONSENT_RECORDS shape in
   * consent-sovereignty-panel/page.tsx.  Three records for Maria Redhawk,
   * one for Dorothy Simmons — all PUT so re-runs are idempotent.
   */
  const entries = [
    // cns-001 — Maria: Data Sharing (ACTIVE)
    {
      resource: {
        resourceType: 'Consent',
        id: 'cns-001',
        status: 'active',
        scope: {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/consentscope', code: 'patient-privacy', display: 'Privacy Consent' }],
        },
        category: [{ coding: [{ system: 'http://loinc.org', code: '59284-0', display: 'Consent Document' }] }],
        patient: { reference: 'Patient/patient-maria-001', display: 'Maria Redhawk' },
        dateTime: '2024-03-12',
        organization: [{ display: 'Bennett County Health Network' }],
        provision: {
          type: 'permit',
          period: { start: '2024-03-12', end: '2025-03-12' },
          purpose: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ActReason', code: 'TREAT', display: 'Treatment' }],
        },
        extension: [
          { url: 'http://tcoc.example.org/fhir/StructureDefinition/consent-type', valueString: 'Data Sharing' },
          { url: 'http://tcoc.example.org/fhir/StructureDefinition/consent-scope-text', valueString: 'Clinical + Claims + SDOH' },
          { url: 'http://tcoc.example.org/fhir/StructureDefinition/consent-method', valueString: 'Electronic' },
        ],
      },
      request: { method: 'PUT', url: 'Consent/cns-001' },
    },
    // cns-002 — Maria: Research (ACTIVE)
    {
      resource: {
        resourceType: 'Consent',
        id: 'cns-002',
        status: 'active',
        scope: {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/consentscope', code: 'research', display: 'Research' }],
        },
        category: [{ coding: [{ system: 'http://loinc.org', code: '59284-0', display: 'Consent Document' }] }],
        patient: { reference: 'Patient/patient-maria-001', display: 'Maria Redhawk' },
        dateTime: '2024-03-12',
        organization: [{ display: 'RHTP Research Registry' }],
        provision: {
          type: 'permit',
          period: { start: '2024-03-12', end: '2026-03-12' },
          purpose: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ActReason', code: 'HRESCH', display: 'Healthcare Research' }],
        },
        extension: [
          { url: 'http://tcoc.example.org/fhir/StructureDefinition/consent-type', valueString: 'Research' },
          { url: 'http://tcoc.example.org/fhir/StructureDefinition/consent-scope-text', valueString: 'De-identified Clinical' },
          { url: 'http://tcoc.example.org/fhir/StructureDefinition/consent-method', valueString: 'Electronic' },
        ],
      },
      request: { method: 'PUT', url: 'Consent/cns-002' },
    },
    // cns-003 — Maria: BH Data (REVOKED)
    {
      resource: {
        resourceType: 'Consent',
        id: 'cns-003',
        status: 'rejected',
        scope: {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/consentscope', code: 'patient-privacy', display: 'Privacy Consent' }],
        },
        category: [{ coding: [{ system: 'http://loinc.org', code: '59284-0', display: 'Consent Document' }] }],
        patient: { reference: 'Patient/patient-maria-001', display: 'Maria Redhawk' },
        dateTime: '2023-11-01',
        organization: [{ display: 'CCBHC — Clay County' }],
        provision: {
          type: 'deny',
          period: { start: '2023-11-01', end: '2024-11-01' },
        },
        extension: [
          { url: 'http://tcoc.example.org/fhir/StructureDefinition/consent-type', valueString: 'BH Data' },
          { url: 'http://tcoc.example.org/fhir/StructureDefinition/consent-scope-text', valueString: 'Behavioral Health Records' },
          { url: 'http://tcoc.example.org/fhir/StructureDefinition/consent-method', valueString: 'Paper' },
        ],
      },
      request: { method: 'PUT', url: 'Consent/cns-003' },
    },
    // cns-004 — Dorothy: Data Sharing (ACTIVE)
    {
      resource: {
        resourceType: 'Consent',
        id: 'cns-004',
        status: 'active',
        scope: {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/consentscope', code: 'patient-privacy', display: 'Privacy Consent' }],
        },
        category: [{ coding: [{ system: 'http://loinc.org', code: '59284-0', display: 'Consent Document' }] }],
        patient: { reference: 'Patient/patient-dorothy-042', display: 'Dorothy Simmons' },
        dateTime: '2024-01-08',
        organization: [{ display: 'Jackson County Memorial' }],
        provision: {
          type: 'permit',
          period: { start: '2024-01-08', end: '2025-01-08' },
          purpose: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ActReason', code: 'TREAT', display: 'Treatment' }],
        },
        extension: [
          { url: 'http://tcoc.example.org/fhir/StructureDefinition/consent-type', valueString: 'Data Sharing' },
          { url: 'http://tcoc.example.org/fhir/StructureDefinition/consent-scope-text', valueString: 'Clinical + Claims' },
          { url: 'http://tcoc.example.org/fhir/StructureDefinition/consent-method', valueString: 'Electronic' },
        ],
      },
      request: { method: 'PUT', url: 'Consent/cns-004' },
    },
  ];

  return { resourceType: 'Bundle', type: 'transaction', entry: entries };
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function postBundle(bundle) {
  const res = await fetch(FHIR_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/fhir+json', Accept: 'application/fhir+json' },
    body: JSON.stringify(bundle),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

async function waitForServer(maxAttempts = 30) {
  console.log(`⏳  Waiting for HAPI FHIR server at ${FHIR_BASE} …`);
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${FHIR_BASE}/metadata`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        console.log('✅  Server is ready.\n');
        return;
      }
    } catch {
      // not ready yet
    }
    await sleep(3000);
    process.stdout.write('.');
  }
  throw new Error(`Server not reachable after ${maxAttempts} attempts. Is docker compose running?`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   TCOC → HAPI FHIR R4  Patient Migration                ║');
  console.log(`╚══════════════════════════════════════════════════════════╝`);
  console.log(`FHIR base URL : ${FHIR_BASE}`);
  console.log(`Patients      : ${PATIENTS.length}\n`);

  await waitForServer();

  let success = 0;
  let failed = 0;

  // ── Seed global resources (Practitioners + CBO Organizations) ──────────────
  process.stdout.write('  → Practitioners + CBO Organizations … ');
  try {
    const pracBundle = buildPractitionerBundle();
    await postBundle(pracBundle);
    const cboBundle = buildCboOrganizationBundle();
    await postBundle(cboBundle);
    console.log(`✅  ${pracBundle.entry.length + cboBundle.entry.length} resources`);
  } catch (err) {
    console.error(`❌  ${err.message}`);
  }

  // ── Seed Consent records ────────────────────────────────────────────────────
  process.stdout.write('  → Consent records … ');
  try {
    const consentBundle = buildConsentBundle();
    await postBundle(consentBundle);
    console.log(`✅  ${consentBundle.entry.length} resources`);
  } catch (err) {
    console.error(`❌  ${err.message}`);
  }

  for (const p of PATIENTS) {
    process.stdout.write(`  → ${p.name.padEnd(20)} (${p.platformId}) … `);
    try {
      const bundle = buildTransactionBundle(p);
      const result = await postBundle(bundle);
      const resourceCount = result.entry?.length ?? '?';
      console.log(`✅  ${resourceCount} resources`);
      success++;
    } catch (err) {
      console.log(`❌  ${err.message}`);
      failed++;
    }
  }

  console.log(`\n─────────────────────────────────────────────────`);
  console.log(`  Migrated : ${success} / ${PATIENTS.length} patients`);
  if (failed > 0) console.log(`  Failed   : ${failed}`);
  console.log(`\n  View patients : ${FHIR_BASE}/Patient?_count=20`);
  console.log(`  HAPI web UI   : ${FHIR_BASE.replace('/fhir', '')}`);
}

main().catch((err) => {
  console.error('\n💥  Fatal:', err.message);
  process.exit(1);
});
