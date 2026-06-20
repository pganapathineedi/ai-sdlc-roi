import type { SfOrgMetadata } from './types';

const SF_VERSION = 'v60.0';

async function sfQuery(instanceUrl: string, accessToken: string, soql: string): Promise<{ records: Record<string, unknown>[] }> {
  const url = instanceUrl + '/services/data/' + SF_VERSION + '/query?q=' + encodeURIComponent(soql);
  const res = await fetch(url, {
    headers: { Authorization: 'Bearer ' + accessToken, Accept: 'application/json' },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error('SF query failed: ' + err);
  }
  return res.json();
}

async function sfToolingQuery(instanceUrl: string, accessToken: string, soql: string): Promise<{ records: Record<string, unknown>[] }> {
  const url = instanceUrl + '/services/data/' + SF_VERSION + '/tooling/query?q=' + encodeURIComponent(soql);
  const res = await fetch(url, {
    headers: { Authorization: 'Bearer ' + accessToken, Accept: 'application/json' },
  });
  if (!res.ok) return { records: [] };
  return res.json();
}

async function sfRest(instanceUrl: string, accessToken: string, path: string): Promise<Record<string, unknown>> {
  const res = await fetch(instanceUrl + path, {
    headers: { Authorization: 'Bearer ' + accessToken, Accept: 'application/json' },
  });
  if (!res.ok) return {};
  return res.json();
}

// COUNT() queries return totalSize at the root; records array is always empty.
// Tooling API does the same. Never read records[0].expr0.
type SfCountResult = { totalSize: number; records: unknown[] };

function countOf(settled: PromiseSettledResult<SfCountResult>): number {
  return settled.status === 'fulfilled' ? (settled.value.totalSize || 0) : 0;
}

function rowsOf(settled: PromiseSettledResult<SfCountResult>): Record<string, unknown>[] {
  return settled.status === 'fulfilled'
    ? (settled.value.records as Record<string, unknown>[]) || []
    : [];
}

export async function fetchOrgMetadata(instanceUrl: string, accessToken: string): Promise<SfOrgMetadata> {
  const [
    orgResult,
    activeUserCount,
    apexClassCount,
    apexTriggerCount,
    lwcCount,
    auraCount,
    flowCount,
    licenseResult,
  ] = await Promise.allSettled([
    sfQuery(instanceUrl, accessToken, 'SELECT Name, Id, OrganizationType FROM Organization LIMIT 1'),
    sfQuery(instanceUrl, accessToken, 'SELECT COUNT() FROM User WHERE IsActive = true'),
    sfToolingQuery(instanceUrl, accessToken, 'SELECT COUNT() FROM ApexClass WHERE NamespacePrefix = null'),
    sfToolingQuery(instanceUrl, accessToken, 'SELECT COUNT() FROM ApexTrigger WHERE NamespacePrefix = null'),
    sfToolingQuery(instanceUrl, accessToken, 'SELECT COUNT() FROM LightningComponentBundle WHERE NamespacePrefix = null'),
    sfToolingQuery(instanceUrl, accessToken, 'SELECT COUNT() FROM AuraDefinitionBundle WHERE NamespacePrefix = null'),
    // FlowDefinitionView is the correct queryable object for active flows
    sfQuery(instanceUrl, accessToken, 'SELECT COUNT() FROM FlowDefinitionView WHERE IsActive = true'),
    sfQuery(instanceUrl, accessToken, 'SELECT Name, TotalLicenses, UsedLicenses FROM UserLicense ORDER BY UsedLicenses DESC LIMIT 20'),
  ]);

  const orgRow = rowsOf(orgResult as PromiseSettledResult<SfCountResult>)[0] as Record<string, unknown> || {};

  return {
    orgName: (orgRow.Name as string) || 'Your Org',
    orgId: (orgRow.Id as string) || '',
    orgType: (orgRow.OrganizationType as string) || 'Developer Edition',
    edition: 'Salesforce',
    totalUsers: countOf(activeUserCount as PromiseSettledResult<SfCountResult>),
    activeUsers: countOf(activeUserCount as PromiseSettledResult<SfCountResult>),
    developerUsers: 0,
    apexClasses: countOf(apexClassCount as PromiseSettledResult<SfCountResult>),
    apexTriggers: countOf(apexTriggerCount as PromiseSettledResult<SfCountResult>),
    lwcComponents: countOf(lwcCount as PromiseSettledResult<SfCountResult>),
    auraComponents: countOf(auraCount as PromiseSettledResult<SfCountResult>),
    flows: countOf(flowCount as PromiseSettledResult<SfCountResult>),
    customObjects: 0,
    installedPackages: [],
    sfLicenses: rowsOf(licenseResult as PromiseSettledResult<SfCountResult>).map((r) => ({
      name: (r.Name as string) || '',
      total: (r.TotalLicenses as number) || 0,
      used: (r.UsedLicenses as number) || 0,
    })),
  };
}

// ── PKCE helpers ─────────────────────────────────────────────────────────────

function base64urlEncode(buf: ArrayBuffer): string {
  return Buffer.from(buf).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function generateCodeVerifier(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64urlEncode(bytes.buffer);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoded = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', encoded);
  return base64urlEncode(hash);
}

// ── OAuth helpers ─────────────────────────────────────────────────────────────

export function buildOAuthUrl(
  clientId: string,
  callbackUrl: string,
  loginUrl: string = 'https://login.salesforce.com',
  codeChallenge?: string,
): string {
  const params: Record<string, string> = {
    response_type: 'code',
    client_id: clientId,
    redirect_uri: callbackUrl,
    scope: 'api refresh_token',
  };
  if (codeChallenge) {
    params.code_challenge = codeChallenge;
    params.code_challenge_method = 'S256';
  }
  return loginUrl + '/services/oauth2/authorize?' + new URLSearchParams(params).toString();
}

export async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
  callbackUrl: string,
  loginUrl: string = 'https://login.salesforce.com',
  codeVerifier?: string,
): Promise<{ access_token: string; instance_url: string; id: string }> {
  const body: Record<string, string> = {
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: callbackUrl,
  };
  if (codeVerifier) {
    body.code_verifier = codeVerifier;
  }
  const res = await fetch(loginUrl + '/services/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error('Token exchange failed: ' + err);
  }
  return res.json();
}
