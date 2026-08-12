import { describe, it, expect, afterEach } from 'vitest';
import { flag } from '@/lib/flags/flags';

afterEach(() => {
  delete process.env.NEXT_PUBLIC_FLAG_AI_DTR;
  delete process.env.NEXT_PUBLIC_FLAG_PATIENT_ACCESS;
});

describe('Feature flags (Slice 6)', () => {
  it('uses safe defaults (AI DTR off until human-review gate)', () => {
    expect(flag('aiDtrGeneration')).toBe(false);
    expect(flag('patientAccess')).toBe(true);
  });

  it('honors env overrides', () => {
    process.env.NEXT_PUBLIC_FLAG_AI_DTR = 'true';
    expect(flag('aiDtrGeneration')).toBe(true);
    process.env.NEXT_PUBLIC_FLAG_PATIENT_ACCESS = 'false';
    expect(flag('patientAccess')).toBe(false);
  });
});
