/**
 * SMART logout (plan F-3): clear the server session cookie.
 */
import { NextRequest, NextResponse } from 'next/server';
import { logout } from '@/lib/server/smartSession';

export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<NextResponse> {
  await logout();
  return NextResponse.redirect(new URL('/', req.nextUrl.origin));
}
