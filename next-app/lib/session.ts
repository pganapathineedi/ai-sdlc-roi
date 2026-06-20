import { cookies } from 'next/headers';
import type { SfSession } from './types';

const SESSION_COOKIE = 'sf_session';
const MAX_AGE = 60 * 60 * 8; // 8 hours

export async function getSession(): Promise<SfSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, 'base64').toString('utf-8')) as SfSession;
  } catch {
    return null;
  }
}

export function encodeSession(session: SfSession): string {
  return Buffer.from(JSON.stringify(session)).toString('base64');
}

export { SESSION_COOKIE, MAX_AGE };
