import { describe, it, expect } from 'vitest';
import { validate, isValid } from '@/lib/fhir/validate';

describe('FHIR structural validation (F-5)', () => {
  it('passes a well-formed Patient', () => {
    expect(validate({ resourceType: 'Patient', id: '101' }, 'Patient')).toBeNull();
    expect(isValid({ resourceType: 'Patient', id: '101' }, 'Patient')).toBe(true);
  });

  it('errors when resourceType is missing', () => {
    const oo = validate({ id: 'x' });
    expect(oo).not.toBeNull();
    expect(oo!.issue.some((i) => i.code === 'required')).toBe(true);
    expect(isValid({ id: 'x' })).toBe(false);
  });

  it('errors on type mismatch', () => {
    const oo = validate({ resourceType: 'Coverage' }, 'Patient');
    expect(oo!.issue.some((i) => i.code === 'invariant')).toBe(true);
  });

  it('warns (not errors) on an unknown/hallucinated resourceType', () => {
    const oo = validate({ resourceType: 'SuperClaim' });
    expect(oo).not.toBeNull();
    expect(oo!.issue.every((i) => i.severity !== 'error')).toBe(true);
    expect(isValid({ resourceType: 'SuperClaim' })).toBe(true); // warning only
  });

  it('errors when id is not a string', () => {
    const oo = validate({ resourceType: 'Patient', id: 123 });
    expect(oo!.issue.some((i) => i.expression?.includes('id'))).toBe(true);
  });
});
