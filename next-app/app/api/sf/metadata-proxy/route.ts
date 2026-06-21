import { NextResponse } from 'next/server';
import { fetchOrgMetadata } from '@/lib/salesforce';

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

  let body: { accessToken: string; instanceUrl: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: cors(origin) });
  }

  const { accessToken, instanceUrl } = body;
  if (!accessToken || !instanceUrl) {
    return NextResponse.json({ error: 'accessToken and instanceUrl required' }, { status: 400, headers: cors(origin) });
  }

  try {
    const metadata = await fetchOrgMetadata(instanceUrl, accessToken);
    return NextResponse.json(metadata, { headers: cors(origin) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500, headers: cors(origin) });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: cors(request.headers.get('origin')) });
}
