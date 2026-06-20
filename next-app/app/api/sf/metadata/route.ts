import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { fetchOrgMetadata } from '@/lib/salesforce';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const metadata = await fetchOrgMetadata(session.instanceUrl, session.accessToken);
    return NextResponse.json(metadata);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
