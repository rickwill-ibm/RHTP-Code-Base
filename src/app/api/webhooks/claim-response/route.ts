/**
 * BFF: inbound PA ClaimResponse webhook — plan Slice 4.
 *
 * AUTHENTICATED (guardrail §8): verifies a shared secret before accepting a
 * ClaimResponse; a spoofed callback must not move a PA to Approved/Denied.
 * In production replace the shared secret with signature/mTLS verification.
 */
import { NextRequest, NextResponse } from 'next/server';
import { audit } from '@/lib/server/audit';
import { correlationFrom } from '@/lib/server/correlation';
import { ooError } from '@/lib/fhir/operationOutcome';

export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const correlationId = correlationFrom(req.headers);
  const secret = process.env.WEBHOOK_SHARED_SECRET || '';
  const provided = req.headers.get('x-webhook-secret') || '';

  if (!secret || provided !== secret) {
    await audit({
      ts: new Date().toISOString(),
      actor: 'webhook',
      action: 'webhook.claim-response.rejected',
      correlationId,
      outcome: 'failure',
      detail: 'bad or missing shared secret',
    });
    return NextResponse.json(ooError('Unauthorized webhook', 'security'), { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { id?: string; outcome?: string } | null;
  await audit({
    ts: new Date().toISOString(),
    actor: 'webhook',
    action: 'webhook.claim-response',
    resourceRef: body?.id ? `ClaimResponse/${body.id}` : undefined,
    correlationId,
    outcome: 'success',
    detail: `outcome=${body?.outcome ?? 'unknown'}`,
  });

  // NOTE: persisting the decision to workflow state is a backbone-gated step
  // (MySQL via the reference services); here we only accept + audit.
  return NextResponse.json({ received: true, correlationId }, { status: 202 });
}
