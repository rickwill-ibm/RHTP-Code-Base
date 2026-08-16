// ─── devStubs.ts ─────────────────────────────────────────────────────────────
// Barrel — import from here as before.
// CRD stubs   → devStubs.cds.ts
// DTR stubs   → devStubs.dtr.ts
// PAS stubs   → devStubs.pas.ts
// Profiles    → devStubs.profiles.ts

import { serverEnv } from './env';

export function devMockEnabled(): boolean {
  return serverEnv().allowDevMockAuth === true;
}

export { devCrdCards } from './devStubs.cds';
export { devDtrEvaluation, devQuestionnairePackage } from './devStubs.dtr';
export { devMemberMatch, devBulkStart, devBulkStatus, devWorkQueueItems, devClaimResponseApproved } from './devStubs.pas';
