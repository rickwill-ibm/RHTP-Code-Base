/**
 * Session status (plan F-3): returns a BOOLEAN + the launch/patient context
 * (an id, never a token). Client components read this to know sign-in state
 * and which patient the session is scoped to.
 */
import { NextResponse } from 'next/server';
import { isAuthenticated, getSessionPatient } from '@/lib/server/smartSession';

export const runtime = 'nodejs';

export async function GET(): Promise<NextResponse> {
  let authenticated = false;
  let patient: string | null = null;
  try {
    authenticated = await isAuthenticated();
    if (authenticated) patient = await getSessionPatient();
  } catch {
    authenticated = false;
  }
  return NextResponse.json({ authenticated, patient });
}
