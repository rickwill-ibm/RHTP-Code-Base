import { describe, it, expect } from 'vitest';
import { ooError, toOperationOutcome, isOperationOutcome } from '@/lib/fhir/operationOutcome';

describe('OperationOutcome helpers (F-5)', () => {
  it('builds an error outcome', () => {
    const oo = ooError('boom', 'processing');
    expect(isOperationOutcome(oo)).toBe(true);
    expect(oo.issue[0].severity).toBe('error');
    expect(oo.issue[0].diagnostics).toBe('boom');
  });

  it('coerces an Error', () => {
    const oo = toOperationOutcome(new Error('nope'));
    expect(oo.issue[0].diagnostics).toBe('nope');
    expect(oo.issue[0].code).toBe('exception');
  });

  it('passes through an existing OperationOutcome', () => {
    const src = ooError('x');
    expect(toOperationOutcome(src)).toBe(src);
  });

  it('rejects non-outcomes', () => {
    expect(isOperationOutcome({ resourceType: 'Patient' })).toBe(false);
  });
});
