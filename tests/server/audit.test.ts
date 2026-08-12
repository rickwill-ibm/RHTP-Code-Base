import { describe, it, expect } from 'vitest';
import { redactPhi, assertPhiSafe, type AuditEvent } from '@/lib/server/audit';

describe('Audit PHI-safety (F-6)', () => {
  it('redacts common PHI-bearing keys from arbitrary FHIR-ish objects', () => {
    const patient = {
      resourceType: 'Patient',
      id: '101',
      name: [{ family: 'Redhawk', given: ['Maria'] }],
      birthDate: '1992-01-01',
      address: [{ city: 'Martin' }],
    };
    const red = redactPhi(patient) as Record<string, unknown>;
    expect(red.resourceType).toBe('Patient');
    expect(red.id).toBe('101');
    expect(red.name).toBe('[redacted]');
    expect(red.birthDate).toBe('[redacted]');
    expect(red.address).toBe('[redacted]');
  });

  it('accepts a reference-only audit event as PHI-safe', () => {
    const evt: AuditEvent = {
      ts: '2026-01-01T00:00:00.000Z',
      actor: 'practitioner:123',
      action: 'fhir.get',
      resourceRef: 'Patient/101',
      correlationId: 'cid-abc',
      outcome: 'success',
      detail: 'status 200',
    };
    expect(() => assertPhiSafe(evt)).not.toThrow();
  });

  it('throws if a PHI key sneaks into an audit event', () => {
    const bad = {
      ts: '2026-01-01T00:00:00.000Z',
      actor: 'x',
      action: 'fhir.get',
      correlationId: 'cid',
      outcome: 'success',
      name: 'Maria Redhawk', // PHI that must never appear in an audit event
    } as unknown as AuditEvent;
    expect(() => assertPhiSafe(bad)).toThrow();
  });
});
