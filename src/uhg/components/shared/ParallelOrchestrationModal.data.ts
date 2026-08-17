// ─── ParallelOrchestrationModal.data.ts ──────────────────────────────────────
// Types and static member data for the ParallelOrchestrationModal.

export interface Barrier {
  label: string;
  type: 'BLOCKER' | 'BARRIER' | 'ELEVATED';
  color: string;
}

export interface AgentDispatched {
  id: string;
  name: string;
  status: 'COMPLETE' | 'ACTIVE' | 'PENDING';
}

export interface ParallelMember {
  id: string;
  name: string;
  riskScore: number;
  memberId: string;
  barriers: Barrier[];
  agents: AgentDispatched[];
  outcomeStage: string;
  outcomeColor: string;
  outcomeIcon: string;
  coalitionSize: number;
  progress: number; // 0–100
}

export const PARALLEL_MEMBERS: ParallelMember[] = [
  {
    id: 'pm-1',
    name: 'James Okafor',
    riskScore: 8.1,
    memberId: 'MBR-047',
    barriers: [
      { label: 'Transport Barrier', type: 'BLOCKER', color: '#ef4444' },
      { label: 'Financial Strain', type: 'ELEVATED', color: '#f97316' },
    ],
    agents: [
      { id: 'a1', name: 'SIGNAL_CLASSIFIER', status: 'COMPLETE' },
      { id: 'a2', name: 'SDOH_RESOLVER', status: 'COMPLETE' },
      { id: 'a3', name: 'AUTH_AGENT', status: 'COMPLETE' },
      { id: 'a4', name: 'CARE_GAP_AGENT', status: 'ACTIVE' },
      { id: 'a5', name: 'TRANSPORT_AGENT', status: 'ACTIVE' },
      { id: 'a6', name: 'FINANCIAL_AGENT', status: 'ACTIVE' },
      { id: 'a7', name: 'CARE_MGMT_AGENT', status: 'PENDING' },
      { id: 'a8', name: 'GOVERNANCE_AGENT', status: 'PENDING' },
    ],
    outcomeStage: 'INTERVENTION ACTIVE',
    outcomeColor: '#f59e0b',
    outcomeIcon: '⟳',
    coalitionSize: 8,
    progress: 62,
  },
  {
    id: 'pm-2',
    name: 'Priya Nair',
    riskScore: 7.6,
    memberId: 'MBR-112',
    barriers: [
      { label: 'Transport Barrier', type: 'BLOCKER', color: '#ef4444' },
      { label: 'Social Isolation', type: 'BARRIER', color: '#f97316' },
    ],
    agents: [
      { id: 'a1', name: 'SIGNAL_CLASSIFIER', status: 'COMPLETE' },
      { id: 'a2', name: 'SDOH_RESOLVER', status: 'COMPLETE' },
      { id: 'a3', name: 'AUTH_AGENT', status: 'COMPLETE' },
      { id: 'a4', name: 'CARE_GAP_AGENT', status: 'COMPLETE' },
      { id: 'a5', name: 'TRANSPORT_AGENT', status: 'COMPLETE' },
      { id: 'a6', name: 'OUTREACH_AGENT', status: 'ACTIVE' },
      { id: 'a7', name: 'CARE_MGMT_AGENT', status: 'ACTIVE' },
      { id: 'a8', name: 'GOVERNANCE_AGENT', status: 'PENDING' },
    ],
    outcomeStage: 'HOME KIT DISPATCHED',
    outcomeColor: '#42be65',
    outcomeIcon: '✓',
    coalitionSize: 8,
    progress: 78,
  },
  {
    id: 'pm-3',
    name: 'DeShawn Williams',
    riskScore: 8.4,
    memberId: 'MBR-203',
    barriers: [
      { label: 'Food Insecurity', type: 'BARRIER', color: '#f97316' },
      { label: 'Transport Barrier', type: 'BLOCKER', color: '#ef4444' },
    ],
    agents: [
      { id: 'a1', name: 'SIGNAL_CLASSIFIER', status: 'COMPLETE' },
      { id: 'a2', name: 'SDOH_RESOLVER', status: 'ACTIVE' },
      { id: 'a3', name: 'AUTH_AGENT', status: 'ACTIVE' },
      { id: 'a4', name: 'CARE_GAP_AGENT', status: 'ACTIVE' },
      { id: 'a5', name: 'TRANSPORT_AGENT', status: 'PENDING' },
      { id: 'a6', name: 'NUTRITION_AGENT', status: 'PENDING' },
      { id: 'a7', name: 'CARE_MGMT_AGENT', status: 'PENDING' },
      { id: 'a8', name: 'GOVERNANCE_AGENT', status: 'PENDING' },
    ],
    outcomeStage: 'COALITION ASSEMBLING',
    outcomeColor: '#78a9ff',
    outcomeIcon: '◎',
    coalitionSize: 8,
    progress: 38,
  },
  {
    id: 'pm-4',
    name: 'Luz Hernandez',
    riskScore: 7.9,
    memberId: 'MBR-318',
    barriers: [
      { label: 'Caregiver Burden', type: 'ELEVATED', color: '#f97316' },
      { label: 'Transport Barrier', type: 'BLOCKER', color: '#ef4444' },
    ],
    agents: [
      { id: 'a1', name: 'SIGNAL_CLASSIFIER', status: 'COMPLETE' },
      { id: 'a2', name: 'SDOH_RESOLVER', status: 'COMPLETE' },
      { id: 'a3', name: 'AUTH_AGENT', status: 'COMPLETE' },
      { id: 'a4', name: 'CARE_GAP_AGENT', status: 'COMPLETE' },
      { id: 'a5', name: 'TRANSPORT_AGENT', status: 'COMPLETE' },
      { id: 'a6', name: 'CAREGIVER_AGENT', status: 'COMPLETE' },
      { id: 'a7', name: 'CARE_MGMT_AGENT', status: 'COMPLETE' },
      { id: 'a8', name: 'GOVERNANCE_AGENT', status: 'COMPLETE' },
    ],
    outcomeStage: 'RESOLVED · H1ab UPDATED',
    outcomeColor: '#42be65',
    outcomeIcon: '✓✓',
    coalitionSize: 8,
    progress: 100,
  },
  {
    id: 'pm-5',
    name: 'Amir Khalil',
    riskScore: 8.7,
    memberId: 'MBR-441',
    barriers: [
      { label: 'Transport Barrier', type: 'BLOCKER', color: '#ef4444' },
      { label: 'Financial Strain', type: 'ELEVATED', color: '#f97316' },
    ],
    agents: [
      { id: 'a1', name: 'SIGNAL_CLASSIFIER', status: 'COMPLETE' },
      { id: 'a2', name: 'SDOH_RESOLVER', status: 'COMPLETE' },
      { id: 'a3', name: 'AUTH_AGENT', status: 'ACTIVE' },
      { id: 'a4', name: 'CARE_GAP_AGENT', status: 'ACTIVE' },
      { id: 'a5', name: 'TRANSPORT_AGENT', status: 'ACTIVE' },
      { id: 'a6', name: 'FINANCIAL_AGENT', status: 'PENDING' },
      { id: 'a7', name: 'CARE_MGMT_AGENT', status: 'PENDING' },
      { id: 'a8', name: 'GOVERNANCE_AGENT', status: 'PENDING' },
    ],
    outcomeStage: 'SIGNALS TRIAGED',
    outcomeColor: '#f59e0b',
    outcomeIcon: '⟳',
    coalitionSize: 8,
    progress: 50,
  },
];
