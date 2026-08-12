'use client';

/**
 * Prior Authorization (plan Slice 4). CRD → DTR → PAS with a HUMAN gate before
 * submission. The PA state is driven by the deterministic paMachine; the LLM
 * never sets Approved/Denied.
 */
import React, { useState } from 'react';
import { postJson } from '@/lib/client/bff';
import { QuestionnaireRenderer } from '@/components/dtr/QuestionnaireRenderer';
import {
  transition,
  INITIAL,
  slaHours,
  type PaState,
  type PaContext,
} from '@/lib/workflow/paMachine';
import type { QuestionnaireItemDef, QuestionnaireResponse } from '@/lib/dtr/questionnaireResponse';
import type { CdsCard } from '@/lib/server/cdsClient';
import { flag } from '@/lib/flags/flags';
import { PaHandoffBanner } from '@/components/goldenThread/PaHandoffBanner';
import AppLayout from '@/components/AppLayout';

// Representative DTR items (real flow loads these from $questionnaire-package).
const ITEMS: QuestionnaireItemDef[] = [
  {
    linkId: 'q1',
    text: 'Conservative therapy attempted (≥6 weeks)?',
    type: 'boolean',
    required: true,
  },
  { linkId: 'q2', text: 'Neurological deficit present?', type: 'boolean', required: true },
  { linkId: 'q3', text: 'Relevant clinical notes', type: 'string' },
];

export default function PriorAuthPage(): React.ReactElement {
  const ctx: PaContext = { priority: 'expedited' };
  const [state, setState] = useState<PaState>(INITIAL);
  const [cards, setCards] = useState<CdsCard[]>([]);
  const [qr, setQr] = useState<QuestionnaireResponse | null>(null);
  const [approver, setApprover] = useState('');
  const [note, setNote] = useState('');

  // stateRef keeps the live value accessible inside async callbacks
  // without relying on stale React state closures.
  const stateRef = React.useRef<PaState>(state);
  function apply(event: Parameters<typeof transition>[1], fromState?: PaState): PaState {
    const current = fromState ?? stateRef.current;
    const t = transition(current, event, ctx);
    if (t.error) { setNote(t.error); return current; }
    stateRef.current = t.state;
    setNote('');
    setState(t.state);
    return t.state;
  }

  async function runCrd(): Promise<void> {
    // Chain transitions: Draft → CRD, then CRD → RequirementsKnown.
    // Both must use the live state from stateRef, not the React state snapshot.
    const afterOrderCreated = apply({ type: 'order-created' });
    const hookRequest = {
      hook: 'order-sign',
      context: {
        draftOrders: {
          entry: [
            { resource: { resourceType: 'ServiceRequest', code: { coding: [{ code: '72148' }] } } },
          ],
        },
      },
    };
    const r = await postJson<{ cards: CdsCard[] }>('/api/cds', {
      hookId: 'crd-mri-spine-order-sign',
      hookRequest,
    });
    setCards(r.data?.cards ?? []);
    apply({ type: 'crd-required' }, afterOrderCreated);
  }

  async function submit(): Promise<void> {
    // HUMAN GATE — approver required; the machine also enforces this.
    const t = transition(
      'EvidenceComplete',
      { type: 'submit', approvedBy: approver || undefined },
      ctx
    );
    if (t.error) {
      setNote(t.error);
      return;
    }
    const res = await postJson('/api/pas/submit', {
      claimBundle: { resourceType: 'Bundle', type: 'collection' },
      approvedBy: approver,
    });
    setNote(
      res.status === 202
        ? 'Submission pending human approval.'
        : `Submitted (status ${res.status}).`
    );
    setState(t.state);
  }

  if (!flag('priorAuth')) return <main className="p-6">Prior Authorization is not enabled.</main>;

  return (
    <AppLayout>
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <PaHandoffBanner />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Prior authorization</h1>
        <span className="rounded bg-slate-100 px-2 py-1 text-xs">
          state: <strong>{state}</strong> · SLA {slaHours(ctx.priority)}h
        </span>
      </div>
      {note ? <p className="rounded bg-amber-50 px-3 py-2 text-sm text-amber-800">{note}</p> : null}

      <button onClick={runCrd} className="rounded bg-blue-600 px-4 py-2 text-sm text-white">
        1 · Run coverage discovery (CRD)
      </button>

      {cards.length > 0 && (
        <div className="space-y-1">
          {cards.map((c, i) => (
            <div key={i} className="rounded border border-slate-200 px-3 py-2 text-sm">
              <strong className="capitalize">{c.indicator}</strong>: {c.summary}
            </div>
          ))}
        </div>
      )}

      {(state === 'RequirementsKnown' || state === 'DTR' || state === 'Prepopulated') && (
        <section className="rounded border border-slate-200 p-4">
          <h2 className="mb-2 text-sm font-semibold">2 · Documentation (DTR)</h2>
          <QuestionnaireRenderer
            items={ITEMS}
            questionnaireCanonical="http://example.org/Questionnaire/mri-lumbar"
            patientRef="Patient/MARIA_SD_001"
            onComplete={(r) => {
              setQr(r);
              apply({ type: 'launch-dtr' });
              apply({ type: 'prepopulated' });
              apply({ type: 'evidence-complete' });
            }}
          />
        </section>
      )}

      {qr && (
        <section className="rounded border border-slate-200 p-4">
          <h2 className="mb-2 text-sm font-semibold">3 · Submit (human-approved)</h2>
          <p className="mb-2 text-xs text-slate-500">
            A person must approve before submission — an agent may only prepare it.
          </p>
          <div className="flex gap-2">
            <input
              value={approver}
              onChange={(e) => setApprover(e.target.value)}
              placeholder="Approver name"
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
            />
            <button
              onClick={submit}
              disabled={!approver}
              className="rounded bg-green-600 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              Approve &amp; submit PAS
            </button>
          </div>
        </section>
      )}
    </main>
    </AppLayout>
  );
}
