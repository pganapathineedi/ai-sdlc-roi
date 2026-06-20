import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

const SF_VERSION = 'v60.0';

async function tryQuery(instanceUrl: string, token: string, label: string, soql: string, tooling = false) {
  const base = tooling ? '/services/data/' + SF_VERSION + '/tooling/query' : '/services/data/' + SF_VERSION + '/query';
  const url = instanceUrl + base + '?q=' + encodeURIComponent(soql);
  try {
    const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' } });
    const text = await res.text();
    let body: unknown;
    try { body = JSON.parse(text); } catch { body = text; }
    return { label, ok: res.ok, status: res.status, body };
  } catch (e) {
    return { label, ok: false, status: 0, body: String(e) };
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { instanceUrl, accessToken } = session;

  const results = await Promise.all([
    tryQuery(instanceUrl, accessToken, 'Organization', 'SELECT Name, Id, OrganizationType FROM Organization LIMIT 1'),
    tryQuery(instanceUrl, accessToken, 'Active users', 'SELECT COUNT() FROM User WHERE IsActive = true'),
    tryQuery(instanceUrl, accessToken, 'ApexClass (tooling)', 'SELECT COUNT() FROM ApexClass WHERE NamespacePrefix = null', true),
    tryQuery(instanceUrl, accessToken, 'ApexTrigger (tooling)', 'SELECT COUNT() FROM ApexTrigger WHERE NamespacePrefix = null', true),
    tryQuery(instanceUrl, accessToken, 'LWC (tooling)', 'SELECT COUNT() FROM LightningComponentBundle WHERE NamespacePrefix = null', true),
    tryQuery(instanceUrl, accessToken, 'AuraBundle (tooling)', 'SELECT COUNT() FROM AuraDefinitionBundle WHERE NamespacePrefix = null', true),
    tryQuery(instanceUrl, accessToken, 'Flow', 'SELECT COUNT() FROM Flow WHERE NamespacePrefix = null AND Status = \'Active\''),
    tryQuery(instanceUrl, accessToken, 'InstalledPackage', 'SELECT SubscriberPackage.Name FROM InstalledSubscriberPackage LIMIT 5'),
  ]);

  return NextResponse.json({ instanceUrl, results });
}
