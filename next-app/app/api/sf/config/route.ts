import { NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  'https://ai-sdlc-roi.onrender.com',
  'http://localhost:3000',
];

function cors(origin: string | null): Record<string, string> {
  const o = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function GET(request: Request) {
  const origin = request.headers.get('origin');
  const clientId = process.env.SF_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'SF not configured' }, { status: 500, headers: cors(origin) });
  }
  return NextResponse.json({ clientId }, { headers: cors(origin) });
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: cors(request.headers.get('origin')) });
}
