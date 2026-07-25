import { describe, it, expect } from 'vitest';
import { canReadMemberData } from '@/lib/authz/guard';

describe('Access guard (Slice 2)', () => {
  it('member can read only their own record', () => {
    expect(
      canReadMemberData({
        role: 'member',
        purpose: 'patient-request',
        selfPatientId: '1',
        targetPatientId: '1',
      }).allow
    ).toBe(true);
    expect(
      canReadMemberData({
        role: 'member',
        purpose: 'patient-request',
        selfPatientId: '1',
        targetPatientId: '2',
      }).allow
    ).toBe(false);
  });

  it('provider needs a treatment relationship', () => {
    expect(
      canReadMemberData({ role: 'provider', purpose: 'treatment', treatmentRelationship: true })
        .allow
    ).toBe(true);
    expect(
      canReadMemberData({ role: 'provider', purpose: 'treatment', treatmentRelationship: false })
        .allow
    ).toBe(false);
  });

  it('provider break-glass is allowed but elevates audit', () => {
    const d = canReadMemberData({ role: 'provider', purpose: 'treatment', breakGlass: true });
    expect(d.allow).toBe(true);
    expect(d.elevatedAudit).toBe(true);
  });

  it('rejects a purpose not permitted for the role', () => {
    expect(canReadMemberData({ role: 'member', purpose: 'operations' }).allow).toBe(false);
  });

  it('member vs provider differ in authorization basis, not just UI', () => {
    const member = canReadMemberData({
      role: 'member',
      purpose: 'patient-request',
      selfPatientId: '1',
      targetPatientId: '1',
    });
    const provider = canReadMemberData({
      role: 'provider',
      purpose: 'treatment',
      treatmentRelationship: true,
    });
    expect(member.reason).not.toEqual(provider.reason);
  });
});
