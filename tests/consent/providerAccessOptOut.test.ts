import { describe, expect, it, beforeEach } from 'vitest';
import { mockProviderAccessConsentStore } from '@/lib/consent/providerAccessOptOut';

describe('Provider Access opt-out consent store (Dev Plan Workstream A)', () => {
  it('defaults to not opted out for a member with no record', () => {
    expect(mockProviderAccessConsentStore.isOptedOut('NO_RECORD_MEMBER')).toBe(false);
    expect(mockProviderAccessConsentStore.getStatus('NO_RECORD_MEMBER')).toBeNull();
  });

  it('records an opt-out, attributed to the recorder', () => {
    const record = mockProviderAccessConsentStore.optOut('MEMBER_A', 'member-portal-session-1');
    expect(record.optedOut).toBe(true);
    expect(record.recordedBy).toBe('member-portal-session-1');
    expect(record.recordedAt).toBeTruthy();
    expect(mockProviderAccessConsentStore.isOptedOut('MEMBER_A')).toBe(true);
  });

  it('supports revocation (opting back in), also attributed', () => {
    mockProviderAccessConsentStore.optOut('MEMBER_B', 'member-portal-session-2');
    expect(mockProviderAccessConsentStore.isOptedOut('MEMBER_B')).toBe(true);

    const revoked = mockProviderAccessConsentStore.revokeOptOut(
      'MEMBER_B',
      'member-portal-session-3',
      'member changed their mind'
    );
    expect(revoked.optedOut).toBe(false);
    expect(revoked.recordedBy).toBe('member-portal-session-3');
    expect(mockProviderAccessConsentStore.isOptedOut('MEMBER_B')).toBe(false);
  });

  it('never records a consent change without an attributed recorder', () => {
    expect(() => mockProviderAccessConsentStore.optOut('MEMBER_C', '')).toThrow(/recordedBy/);
    expect(() => mockProviderAccessConsentStore.revokeOptOut('MEMBER_C', '')).toThrow(
      /recordedBy/
    );
  });

  it('keeps a full audit trail accessible via getStatus after each change', () => {
    mockProviderAccessConsentStore.optOut('MEMBER_D', 'admin-1', 'initial opt-out');
    const afterOptOut = mockProviderAccessConsentStore.getStatus('MEMBER_D');
    expect(afterOptOut?.reason).toBe('initial opt-out');

    mockProviderAccessConsentStore.revokeOptOut('MEMBER_D', 'admin-2', 'revoked on request');
    const afterRevoke = mockProviderAccessConsentStore.getStatus('MEMBER_D');
    expect(afterRevoke?.reason).toBe('revoked on request');
    expect(afterRevoke?.recordedBy).toBe('admin-2');
  });
});
