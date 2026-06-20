import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session';

export async function POST(request: Request) {
  const { origin } = new URL(request.url);
  const response = NextResponse.redirect(origin + '/connect');
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
