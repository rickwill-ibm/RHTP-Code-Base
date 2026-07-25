import { describe, it, expect } from 'vitest';
import { newJob, advance, dedupeImport, applyFilesReady } from '@/lib/workflow/bulkJob';

describe('Payer-to-Payer bulk job (Slice 3)', () => {
  it('creates and advances a job', () => {
    const j = newJob('job1', 'OldPayer');
    expect(j.status).toBe('requested');
    expect(advance(j, 'in-progress').status).toBe('in-progress');
  });

  it('dedupes imports against the Member 360', () => {
    const { fresh, duplicates } = dedupeImport(
      ['Claim/1', 'Claim/2'],
      ['Claim/2', 'Claim/3', 'Claim/3']
    );
    expect(fresh).toEqual(['Claim/3']);
    expect(duplicates).toEqual(['Claim/2', 'Claim/3']);
  });

  it('applies files-ready idempotently (duplicate callbacks)', () => {
    let j = newJob('job1', 'OldPayer');
    j = applyFilesReady(j, ['u1']);
    j = applyFilesReady(j, ['u1', 'u2']);
    expect(j.status).toBe('files-ready');
    expect(j.fileUrls.sort()).toEqual(['u1', 'u2']);
  });

  it('ignores a late callback once importing/reconciled', () => {
    const j = advance(newJob('job1', 'OldPayer'), 'reconciled');
    expect(applyFilesReady(j, ['late']).fileUrls).toEqual([]);
  });
});
