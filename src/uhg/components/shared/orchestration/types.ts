// ─── orchestration/types.ts ───────────────────────────────────────────────────
// Shared type definitions for OrchestrationFlowModal sub-components.

export interface SystemNode {
  id: string;
  label: string;
  sublabel?: string;
  side: 'fetch' | 'push';
  payloadKey: string;
}

export interface AgentNode {
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

export interface GovernanceAgent {
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

export type HITLStep = {
  time: string;
  label: string;
  detail: string;
  color: string;
  icon: string;
};
