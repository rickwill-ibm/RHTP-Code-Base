/**
 * Role + permitted-purpose authorization (plan §7, Slice 2).
 *
 * Pure, unit-testable policy. Member access and Provider access differ in their
 * AUTHORIZATION BASIS, not just UI — this encodes that (blueprint §6.2).
 */

export type Role =
  'member' | 'provider' | 'payer-ops' | 'pa-reviewer' | 'care-manager' | 'admin' | 'auditor';

export type Purpose = 'treatment' | 'payment' | 'operations' | 'patient-request' | 'audit';

export interface AccessContext {
  role: Role;
  purpose: Purpose;
  /** Provider must have a treatment relationship to read member data. */
  treatmentRelationship?: boolean;
  /** Member may only read their own record. */
  selfPatientId?: string;
  targetPatientId?: string;
  /** Break-glass must be explicit + is always audited. */
  breakGlass?: boolean;
}

export interface AccessDecision {
  allow: boolean;
  reason: string;
  /** True when the action must be recorded with elevated audit (e.g. break-glass). */
  elevatedAudit: boolean;
}

const ALLOWED_PURPOSE: Record<Role, Purpose[]> = {
  member: ['patient-request'],
  provider: ['treatment'],
  'payer-ops': ['operations', 'payment'],
  'pa-reviewer': ['operations'],
  'care-manager': ['treatment', 'operations'],
  admin: ['operations'],
  auditor: ['audit'],
};

/** Decide whether a subject may read a member's clinical data. */
export function canReadMemberData(ctx: AccessContext): AccessDecision {
  if (!ALLOWED_PURPOSE[ctx.role]?.includes(ctx.purpose)) {
    return {
      allow: false,
      reason: `purpose "${ctx.purpose}" not permitted for role "${ctx.role}"`,
      elevatedAudit: false,
    };
  }

  if (ctx.role === 'member') {
    const ok = !!ctx.selfPatientId && ctx.selfPatientId === ctx.targetPatientId;
    return {
      allow: ok,
      reason: ok ? 'member self-access' : 'member may only access their own record',
      elevatedAudit: false,
    };
  }

  if (ctx.role === 'provider') {
    if (ctx.breakGlass) {
      return { allow: true, reason: 'break-glass emergency access', elevatedAudit: true };
    }
    const ok = ctx.treatmentRelationship === true;
    return {
      allow: ok,
      reason: ok
        ? 'provider treatment relationship'
        : 'provider requires a treatment relationship (or break-glass)',
      elevatedAudit: false,
    };
  }

  // ops / reviewer / care-manager / admin / auditor: purpose already checked.
  return {
    allow: true,
    reason: `${ctx.role} permitted for ${ctx.purpose}`,
    elevatedAudit: ctx.role === 'auditor',
  };
}
