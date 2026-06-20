import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCodeForToken } from '@/lib/salesforce';
import { encodeSession, SESSION_COOKIE, MAX_AGE } from '@/lib/session';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(origin + '/connect?error=' + encodeURIComponent(error || 'no_code'));
  }

  const clientId = process.env.SF_CLIENT_ID;
  const clientSecret = process.env.SF_CLIENT_SECRET;
  const callbackUrl = process.env.SF_CALLBACK_URL;

  if (!clientId || !clientSecret || !callbackUrl) {
    return NextResponse.redirect(origin + '/connect?error=missing_config');
  }

  // Retrieve the PKCE verifier stored during the auth redirect
  const cookieStore = await cookies();
  const codeVerifier = cookieStore.get('sf_pkce_verifier')?.value;

  try {
    const token = await exchangeCodeForToken(code, clientId, clientSecret, callbackUrl, undefined, codeVerifier);

    // Fetch user identity
    const idRes = await fetch(token.id, {
      headers: { Authorization: 'Bearer ' + token.access_token },
    });
    const identity = await idRes.json() as { organization_id?: string; user_id?: string; display_name?: string };

    const session = {
      accessToken: token.access_token,
      instanceUrl: token.instance_url,
      orgId: identity.organization_id || '',
      userId: identity.user_id || '',
      displayName: identity.display_name || 'Salesforce User',
    };

    const response = NextResponse.redirect(origin + '/dashboard');
    response.cookies.set(SESSION_COOKIE, encodeSession(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: MAX_AGE,
      path: '/',
    });
    // Clean up the one-time PKCE verifier cookie
    response.cookies.delete('sf_pkce_verifier');
    return response;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    return NextResponse.redirect(origin + '/connect?error=' + encodeURIComponent(msg));
  }
}
