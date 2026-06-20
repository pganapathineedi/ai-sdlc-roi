import { NextResponse } from 'next/server';
import { buildOAuthUrl, generateCodeVerifier, generateCodeChallenge } from '@/lib/salesforce';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sandbox = searchParams.get('sandbox') === '1';
  const loginUrl = sandbox ? 'https://test.salesforce.com' : 'https://login.salesforce.com';

  const clientId = process.env.SF_CLIENT_ID;
  const callbackUrl = process.env.SF_CALLBACK_URL;

  if (!clientId || !callbackUrl) {
    return NextResponse.json({ error: 'Salesforce credentials not configured' }, { status: 500 });
  }

  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);

  const authUrl = buildOAuthUrl(clientId, callbackUrl, loginUrl, challenge);
  const response = NextResponse.redirect(authUrl);

  // Store the verifier in a short-lived httpOnly cookie; the callback reads it
  response.cookies.set('sf_pkce_verifier', verifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes — just long enough to complete the flow
    path: '/',
  });

  return response;
}
