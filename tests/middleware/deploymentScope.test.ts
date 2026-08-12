import { describe, expect, it } from 'vitest';
import { isOutOfScopePath, OUT_OF_SCOPE_PREFIXES } from '@/middleware';

describe('deployment-scope guard (Dev Plan Workstream E2)', () => {
  it('flags unrelated client routes as out of scope', () => {
    expect(isOutOfScopePath('/uhg-orchestrate')).toBe(true);
    expect(isOutOfScopePath('/uhg-orchestrate/dashboard')).toBe(true);
    expect(isOutOfScopePath('/md-smart-launch')).toBe(true);
    expect(isOutOfScopePath('/md-smart-launch/launch')).toBe(true);
    expect(isOutOfScopePath('/api/care-manager/patients')).toBe(true);
  });

  it('does not flag CMS-0057-F routes as out of scope', () => {
    expect(isOutOfScopePath('/work-queue')).toBe(false);
    expect(isOutOfScopePath('/financial-clearance')).toBe(false);
    expect(isOutOfScopePath('/api/pas/submit')).toBe(false);
    expect(isOutOfScopePath('/api/cds-hooks')).toBe(false);
  });

  it('does not false-positive on paths that merely share a prefix substring', () => {
    // e.g. a hypothetical "/uhg-orchestrate-lite" route should not match "/uhg-orchestrate"
    expect(isOutOfScopePath('/uhg-orchestrate-lite')).toBe(false);
  });

  it('covers every prefix declared for exclusion', () => {
    for (const prefix of OUT_OF_SCOPE_PREFIXES) {
      expect(isOutOfScopePath(prefix)).toBe(true);
      expect(isOutOfScopePath(`${prefix}/nested/route`)).toBe(true);
    }
  });
});
