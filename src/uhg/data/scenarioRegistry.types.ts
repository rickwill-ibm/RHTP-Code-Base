// ─── scenarioRegistry.types.ts ───────────────────────────────────────────────
// Shared shapes imported by the RHTP-Orchestrate screens.

export interface ScSourceRecord {
  id: string; system: string; systemColor: string; systemBg: string;
  memberName: string; memberId: string; dob: string; address: string;
  riskScore: string; consentStatus: string; authStatus: string; conflicts: string[];
}
export interface ScLogEntry { id: string; text: string; color: string; delay: number; isSuccess?: boolean; }
export interface ScNode { id: string; x: number; y: number; r: number; label: string; color: string; delay: number; isCenter?: boolean; }
export interface ScEdge { id: string; from: string; to: string; color: string; label: string; delay: number; }
export interface ScReasoningLine { id: string; text: string; delay: number; }
export interface ScActivity { id: string; text: string; type: 'info' | 'success' | 'warning' | 'critical'; timestamp: string; }
export interface ScAgentPanel {
  id: string; name: string; role: string; roleColor: string; owns: number[];
  color: string; borderColor: string; activities: ScActivity[];
}
export interface ScCondition {
  id: number; type: string; label: string; deadline?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'; regulatory?: boolean; description: string;
}
export interface ScOtherScenario { id: string; member: string; complexity: string; countdown: string; type: string; }
export interface ScTriggerSignal { sig: string; detail: string; color: string; ts: string; }
export interface ScTrigger { signals: ScTriggerSignal[]; sdohProfile: string; familyContext: string; journeyPosition: string; }

export interface CitizenScenario {
  id: string; name: string; firstName: string; lastName: string; age: number; initials: string;
  identityConfidence: number;
  dataProductsLine: string;
  sourceRecords: ScSourceRecord[];
  resolutionLog: ScLogEntry[];
  kgNodes: ScNode[];
  kgEdges: ScEdge[];
  intakeLine: string;
  memberContext: string;
  reasoningLines: ScReasoningLine[];
  agentPanels: ScAgentPanel[];
  conditions: ScCondition[];
  backgroundAutoResolved: number;
  otherScenarios: ScOtherScenario[];
  trigger: ScTrigger;
}
