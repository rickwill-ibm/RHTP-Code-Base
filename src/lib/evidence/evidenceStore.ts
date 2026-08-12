/**
 * Evidence Record persistence (increment #1).
 *
 * The Evidence Record is built in-memory as the thread runs; to survive across
 * requests it must be saved. This defines a small store interface with an
 * in-memory implementation (default; fine for the mock demo and tests) and an
 * optional file-backed implementation mirroring the audit sink. In production
 * swap in an append-only store / FHIR persistence — the interface stays the same.
 */
import { promises as fs } from 'fs';
import path from 'path';
import type { EvidenceRecord } from './evidenceRecord';

export interface EvidenceStore {
  save(record: EvidenceRecord): Promise<void>;
  get(id: string): Promise<EvidenceRecord | null>;
  list(): Promise<string[]>;
}

/** In-memory store. Process-local; resets on restart. */
export function createInMemoryEvidenceStore(): EvidenceStore {
  const map = new Map<string, EvidenceRecord>();
  return {
    async save(record) {
      map.set(record.id, record);
    },
    async get(id) {
      return map.get(id) ?? null;
    },
    async list() {
      return [...map.keys()];
    },
  };
}

/** True when a parsed value has the shape of an EvidenceRecord. */
function isEvidenceRecord(v: unknown): v is EvidenceRecord {
  const r = v as Record<string, unknown> | null;
  return (
    !!r && typeof r.id === 'string' && typeof r.memberId === 'string' && Array.isArray(r.entries)
  );
}

/** File-backed store: one JSON file per record under EVIDENCE_DIR. */
export function createFileEvidenceStore(dir?: string): EvidenceStore {
  const baseDir = dir || process.env.EVIDENCE_DIR || path.join(process.cwd(), '.evidence');
  const safe = (id: string) => id.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const file = (id: string) => path.join(baseDir, `${safe(id)}.json`);
  return {
    async save(record) {
      await fs.mkdir(baseDir, { recursive: true });
      // atomic write: write to a temp file, then rename into place
      const tmp = path.join(baseDir, `.${safe(record.id)}.${process.pid}.tmp`);
      await fs.writeFile(tmp, JSON.stringify(record), 'utf8');
      await fs.rename(tmp, file(record.id));
    },
    async get(id) {
      try {
        const parsed = JSON.parse(await fs.readFile(file(id), 'utf8')) as unknown;
        return isEvidenceRecord(parsed) ? parsed : null; // reject corrupt/foreign files
      } catch {
        return null;
      }
    },
    async list() {
      try {
        const names = await fs.readdir(baseDir);
        return names
          .filter((n) => n.endsWith('.json') && !n.startsWith('.'))
          .map((n) => n.replace(/\.json$/, ''));
      } catch {
        return [];
      }
    },
  };
}

// A process-wide default so API routes share one store instance in dev.
let defaultStore: EvidenceStore | null = null;
export function defaultEvidenceStore(): EvidenceStore {
  if (!defaultStore) {
    defaultStore = process.env.EVIDENCE_DIR
      ? createFileEvidenceStore()
      : createInMemoryEvidenceStore();
  }
  return defaultStore;
}
