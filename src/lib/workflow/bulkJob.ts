/**
 * Payer-to-Payer bulk-export job model (plan Slice 3 / blueprint §6.3).
 *
 * Treats P2P as a long-running workflow: start → polling → files → import
 * (validate/dedupe/provenance) → reconcile. Pure logic here; the network calls
 * live in src/lib/server/bulkClient.ts.
 */

export type BulkJobStatus =
  'requested' | 'in-progress' | 'files-ready' | 'importing' | 'reconciled' | 'failed';

export interface BulkJob {
  id: string;
  priorPayer: string;
  status: BulkJobStatus;
  fileUrls: string[];
  importedRefs: string[]; // FHIR references imported into the Member 360
  errors: string[];
}

export function newJob(id: string, priorPayer: string): BulkJob {
  return { id, priorPayer, status: 'requested', fileUrls: [], importedRefs: [], errors: [] };
}

export function advance(job: BulkJob, status: BulkJobStatus): BulkJob {
  return { ...job, status };
}

/**
 * Deduplicate incoming FHIR references against what the Member 360 already has.
 * Provenance is preserved by keeping the source payer with each new ref.
 */
export function dedupeImport(
  existing: string[],
  incoming: string[]
): { fresh: string[]; duplicates: string[] } {
  const seen = new Set(existing);
  const fresh: string[] = [];
  const duplicates: string[] = [];
  for (const ref of incoming) {
    if (seen.has(ref)) duplicates.push(ref);
    else {
      seen.add(ref);
      fresh.push(ref);
    }
  }
  return { fresh, duplicates };
}

/** A callback/poll may arrive more than once — apply idempotently. */
export function applyFilesReady(job: BulkJob, fileUrls: string[]): BulkJob {
  if (job.status === 'reconciled' || job.status === 'importing') return job; // late/duplicate callback
  const urls = Array.from(new Set([...job.fileUrls, ...fileUrls]));
  return { ...job, status: 'files-ready', fileUrls: urls };
}
