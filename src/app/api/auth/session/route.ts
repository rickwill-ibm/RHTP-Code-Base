/**
 * Session status (plan F-3): returns a BOOLEAN only. Never returns a token —
 * client components read this to know whether a user is signed in.
 */
import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/server/smartSession';

export const runtime = 'nodejs';

export async function GET(): Promise<NextResponse> {
  let authenticated = false;
  try {
    authenticated = await isAuthenticated();
  } catch {
    authenticated = false;
  }
  return NextResponse.json({ authenticated });
}
