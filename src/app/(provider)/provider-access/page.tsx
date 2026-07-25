'use client';

/**
 * Provider Access (plan Slice 2). A provider identifies a member via
 * $member-match, then reads member data under a treatment relationship.
 * Authorization basis differs from member access (see lib/authz/guard).
 */
import { useState } from 'react';
import { postJson, fhirGet } from '@/lib/client/bff';
import { canReadMemberData } from '@/lib/authz/guard';
import { toConditionVM, type ConditionVM } from '@/lib/fhir/viewModels';
import { flag } from '@/lib/flags/flags';

interface Bundle {
  entry?: { resource?: Record<string, unknown> }[];
}

export default function ProviderAccessPage(): React.ReactElement {
  const [memberId, setMemberId] = useState('');
  const [matched, setMatched] = useState<string | null>(null);
  const [conditions, setConditions] = useState<ConditionVM[]>([]);
  const [msg, setMsg] = useState('');

  const decision = canReadMemberData({
    role: 'provider',
    purpose: 'treatment',
    treatmentRelationship: true,
  });

  async function match(): Promise<void> {
    setMsg('Matching…');
    const params = {
      resourceType: 'Parameters',
      parameter: [{ name: 'MemberPatient', resource: { resourceType: 'Patient', id: memberId } }],
    };
    const r = await postJson<{ id?: string }>('/api/match', params);
    if (r.ok) {
      setMatched(memberId);
      setMsg('Member matched. Loading data under treatment relationship…');
      const cond = await fhirGet<Bundle>(`Condition?subject=Patient/${memberId}`);
      setConditions((cond.data?.entry ?? []).map((e) => toConditionVM(e.resource ?? {})));
      setMsg('');
    } else {
      setMsg('No match / not authorized.');
    }
  }

  if (!flag('providerAccess')) return <main className="p-6">Provider Access is not enabled.</main>;

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="text-xl font-semibold">Provider access</h1>
      <p className="text-xs text-slate-500">
        Authorization basis: {decision.reason} {decision.elevatedAudit ? '(elevated audit)' : ''}
      </p>
      <div className="flex gap-2">
        <input
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          placeholder="Member id (e.g. MARIA_SD_001)"
          className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
        />
        <button
          onClick={match}
          disabled={!memberId}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          $member-match
        </button>
      </div>
      {msg ? <p className="text-sm text-slate-600">{msg}</p> : null}
      {matched ? (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-500">Conditions for {matched}</h2>
          <div className="rounded border border-slate-200 p-3">
            {conditions.length === 0 ? (
              <p className="text-sm text-slate-400">No records.</p>
            ) : (
              conditions.map((c) => (
                <div key={c.id} className="border-b py-1 text-sm last:border-0">
                  {c.display} — {c.clinicalStatus}
                </div>
              ))
            )}
          </div>
        </section>
      ) : null}
    </main>
  );
}
