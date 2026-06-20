import { NextResponse } from 'next/server';
import { buildOAuthUrl } from '@/lib/salesforce';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sandbox = searchParams.get('sandbox') === '1';
  const loginUrl = sandbox ? 'https://test.salesforce.com' : 'https://login.salesforce.com';

  const clientId = process.env.SF_CLIENT_ID;
  const callbackUrl = process.env.SF_CALLBACK_URL;

  if (!clientId || !callbackUrl) {
    return NextResponse.json({ error: 'Salesforce credentials not configured' }, { status: 500 });
  }

  const authUrl = buildOAuthUrl(clientId, callbackUrl, loginUrl);
  return NextResponse.redirect(authUrl);
}
