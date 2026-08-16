// ─── socialMockData.types.ts ──────────────────────────────────────────────────
// TypeScript interfaces for social, behavioral health, and CHW data.

export interface SocialPatient {
  id: string;
  patientId: string;
  name: string;
  dob: string;
  mrn: string;
  pcp: string;
  age: number;
  gender: string;
  riskLevel: 'High' | 'Medium' | 'Low';
  unmetNeeds: number;
  needs: string[];
  lastScreened: string | null;
  address: string;
  phone: string;
}

export interface ScreeningRecord {
  id: string;
  patientId: string;
  date: string;
  instrument: string;
  screener: string;
  unmetNeeds: number;
  tasksCreated: number;
  status: string;
}

export interface FindhelpScreeningResult {
  patientId: string;
  screeningDate: string;
  instrument: 'findhelp' | 'uniteus';
  provider: string;
  domains: {
    id: string;
    label: string;
    unmetNeed: boolean;
    responses: Record<string, number>;
    recommendedCBOs: string[];
  }[];
  totalUnmetNeeds: number;
  tasksCreated: string[];
  savedToRecord: boolean;
}

export interface Program {
  id: string;
  name: string;
  domain: string;
  fundingSource: string;
  status: 'eligible' | 'enrolled' | 'pending' | 'expired' | 'not-eligible';
  enrolledDate?: string;
  expiryDate?: string;
  actionRequired?: string;
}

export interface Enrollment {
  id: string;
  patientId: string;
  patient: string;
  mrn: string;
  program: string;
  domain: string;
  fundingSource: string;
  status: 'active' | 'pending' | 'expired' | 'gap';
  startDate: string;
  endDate: string;
  renewalDeadline: string;
  daysToRenewal: number;
  benefitValue: string;
  caseWorker: string;
  coverageGap?: string;
}

export interface CHWVisit {
  id: string;
  patientId: string;
  patient: string;
  mrn: string;
  address: string;
  date: string;
  time: string;
  purpose: string;
  status: 'scheduled' | 'completed' | 'missed';
  priority: 'High' | 'Medium' | 'Low';
  riskScore: number;
}

export interface OutreachRecord {
  id: string;
  patientId: string;
  patient: string;
  date: string;
  channel: string;
  outcome: string;
  notes: string;
  nextAction: string;
}

export interface CrisisEvent {
  id: string;
  patientId: string;
  patient: string;
  mrn: string;
  age: number;
  trigger: string;
  acuity: 'High' | 'Medium' | 'Low';
  timestamp: string;
  assignedTo: string;
  status: 'dispatched' | 'stabilized' | 'resolved';
  dispatchedTo: string;
  notes: string;
}

export interface CBO {
  id: string;
  name: string;
  type: string;
  domain: string;
  counties: string[];
  phone: string;
  address: string;
  capacity: 'Accepting' | 'Waitlist' | 'Full';
  activeReferrals: number;
  completionRate: number;
  avgDaysToClose: number;
  certifications: string[];
  contact: string;
  linkedPatients: string[];
}
