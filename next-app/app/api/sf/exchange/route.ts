import { NextResponse } from 'next/server';
import { exchangeCodeForToken } from '@/lib/salesforce';

const ALLOWED_ORIGINS = [
  'https://ai-sdlc-roi.onrender.com',
  'http://localhost:3000',
];

function cors(origin: string | null): Record<string, string> {
  const o = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');

  let body: { code: string; codeVerifier: string; redirectUri: string; sandbox?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: cors(origin) });
  }

  const { code, codeVerifier, redirectUri, sandbox } = body;
  if (!code || !codeVerifier || !redirectUri) {
    return NextResponse.json({ error: 'code, codeVerifier and redirectUri are required' }, { status: 400, headers: cors(origin) });
  }

  const clientId = process.env.SF_CLIENT_ID;
  const clientSecret = process.env.SF_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'SF credentials not configured' }, { status: 500, headers: cors(origin) });
  }

  const loginUrl = sandbox ? 'https://test.salesforce.com' : 'https://login.salesforce.com';

  try {
    const token = await exchangeCodeForToken(code, clientId, clientSecret, redirectUri, loginUrl, codeVerifier);

    let orgName = 'Salesforce Org';
    try {
      const orgRes = await fetch(
        token.instance_url + '/services/data/v60.0/query?q=' + encodeURIComponent('SELECT Name FROM Organization LIMIT 1'),
        { headers: { Authorization: 'Bearer ' + token.access_token } },
      );
      const orgData = await orgRes.json() as { records: Array<{ Name: string }> };
      if (orgData.records?.[0]?.Name) orgName = orgData.records[0].Name;
    } catch {
      // org name is best-effort
    }

    return NextResponse.json(
      { accessToken: token.access_token, instanceUrl: token.instance_url, orgName },
      { headers: cors(origin) },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400, headers: cors(origin) });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: cors(request.headers.get('origin')) });
}
