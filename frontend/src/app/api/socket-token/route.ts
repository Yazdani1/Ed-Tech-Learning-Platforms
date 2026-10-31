import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const HTTP_UNAUTHORIZED = 401;
const NO_STORE = { 'Cache-Control': 'no-store, private' };

/**
 * GET /api/socket-token (a Next.js route: file routes win over the /api rewrite to the backend).
 * Socket.io connects straight to the backend, where the httpOnly session cookie of this site is not sent,
 * so the browser asks this same-origin route for the token and keeps it in memory only. Other sites cannot
 * read the answer (no CORS headers), and the backend still verifies the token on every connection.
 */
export const GET = async (): Promise<NextResponse> => {
  const token = (await cookies()).get('token')?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Not authorized, please login' },
      { status: HTTP_UNAUTHORIZED, headers: NO_STORE },
    );
  }
  return NextResponse.json({ success: true, data: { token } }, { headers: NO_STORE });
};
