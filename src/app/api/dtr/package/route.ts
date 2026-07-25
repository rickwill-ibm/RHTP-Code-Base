/**
 * BFF: fetch a DTR $questionnaire-package — plan Slice 4.
 * GET /api/dtr/package?questionnaire=<canonical>
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/server/smartSession';
import { fhirRead } from '@/lib/server/fhirServer';
import { correlationFrom } from '@/lib/server/correlation';
import { ooError } from '@/lib/fhir/operationOutcome';

export const runtime = 'nodejs';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const correlationId = correlationFrom(req.headers);
  if (!(await isAuthenticated().catch(() => false))) {
    return NextResponse.json(ooError('Not authenticated', 'login'), { status: 401 });
  }
  const questionnaire = req.nextUrl.searchParams.get('questionnaire');
  if (!questionnaire) {
    return NextResponse.json(ooError('questionnaire canonical required', 'required'), {
      status: 400,
    });
  }
  // $questionnaire-package is a FHIR operation served by fhir-service.
  const path = `Questionnaire/$questionnaire-package?questionnaire=${encodeURIComponent(questionnaire)}`;
  const result = await fhirRead(path, { actor: 'session-user', correlationId });
  return NextResponse.json(result.ok ? result.raw : result.error, {
    status: result.status || (result.ok ? 200 : 502),
  });
}
