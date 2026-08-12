import { describe, it, expect } from 'vitest';
import { toCoverageVM, toConditionVM, toPaStatusVM } from '@/lib/fhir/viewModels';

describe('FHIR view models (Slice 1)', () => {
  it('projects Coverage', () => {
    const vm = toCoverageVM({
      id: 'c1',
      status: 'active',
      type: { text: 'Medicaid MC' },
      payor: [{ display: 'SD Medicaid' }],
    });
    expect(vm).toEqual({ id: 'c1', status: 'active', payer: 'SD Medicaid', type: 'Medicaid MC' });
  });

  it('projects Condition using coding fallback', () => {
    const vm = toConditionVM({
      id: 'x',
      code: { coding: [{ display: 'Type 2 diabetes mellitus' }] },
      clinicalStatus: { coding: [{ code: 'active' }] },
    });
    expect(vm.display).toBe('Type 2 diabetes mellitus');
    expect(vm.clinicalStatus).toBe('active');
  });

  it('maps ClaimResponse outcome to a PA status + denial reasons', () => {
    expect(toPaStatusVM({ id: '1', outcome: 'complete', type: { text: 'MRI' } }).status).toBe(
      'approved'
    );
    const denied = toPaStatusVM({
      id: '2',
      outcome: 'error',
      error: [{ code: { text: 'not medically necessary' } }],
    });
    expect(denied.status).toBe('denied');
    expect(denied.denialReasons).toEqual(['not medically necessary']);
    expect(toPaStatusVM({ id: '3', outcome: 'queued' }).status).toBe('pending');
  });
});
