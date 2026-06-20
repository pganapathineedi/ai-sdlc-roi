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

export async function fetchOrgMetadata(instanceUrl: string, accessToken: string): Promise<SfOrgMetadata> {
  // Run queries in parallel where possible
  const [
    orgInfo,
    userCounts,
    devUserCount,
    apexClassCount,
    apexTriggerCount,
    lwcCount,
    auraCount,
    flowCount,
    customObjCount,
    packages,
    licenses,
  ] = await Promise.allSettled([
    sfRest(instanceUrl, accessToken, '/services/data/' + SF_VERSION + '/sobjects/Organization/describe').catch(() => ({})),
    sfQuery(instanceUrl, accessToken, "SELECT COUNT() FROM User WHERE IsActive = true"),
    sfQuery(instanceUrl, accessToken, "SELECT COUNT() FROM User WHERE IsActive = true AND UserType = 'Standard' AND Profile.UserLicense.Name LIKE '%Developer%'"),
    sfToolingQuery(instanceUrl, accessToken, "SELECT COUNT() FROM ApexClass WHERE NamespacePrefix = null"),
    sfToolingQuery(instanceUrl, accessToken, "SELECT COUNT() FROM ApexTrigger WHERE NamespacePrefix = null"),
    sfToolingQuery(instanceUrl, accessToken, "SELECT COUNT() FROM LightningComponentBundle WHERE NamespacePrefix = null"),
    sfToolingQuery(instanceUrl, accessToken, "SELECT COUNT() FROM AuraDefinitionBundle WHERE NamespacePrefix = null"),
    sfQuery(instanceUrl, accessToken, "SELECT COUNT() FROM Flow WHERE NamespacePrefix = null AND Status = 'Active'"),
    sfRest(instanceUrl, accessToken, '/services/data/' + SF_VERSION + '/describe').then((d: Record<string, unknown>) => {
      const sobjs = (d.sobjects as Array<{ custom: boolean; name: string }>) || [];
      return { count: sobjs.filter((o) => o.custom).length };
    }),
    sfQuery(instanceUrl, accessToken, "SELECT SubscriberPackage.Name, SubscriberPackage.NamespacePrefix, SubscriberPackageVersion.VersionNumber FROM InstalledSubscriberPackage LIMIT 50"),
    sfQuery(instanceUrl, accessToken, "SELECT Name, TotalLicenses, UsedLicenses FROM UserLicense ORDER BY UsedLicenses DESC LIMIT 20"),
  ]);

  function val<T>(settled: PromiseSettledResult<T>, fallback: T): T {
    return settled.status === 'fulfilled' ? settled.value : fallback;
  }

  const orgData = val(orgInfo, {}) as Record<string, unknown>;
  const userCountData = val(userCounts, { records: [{ expr0: 0 }] }) as { records: Record<string, unknown>[] };
  const devData = val(devUserCount, { records: [{ expr0: 0 }] }) as { records: Record<string, unknown>[] };
  const apexData = val(apexClassCount, { records: [{ expr0: 0 }] }) as { records: Record<string, unknown>[] };
  const triggerData = val(apexTriggerCount, { records: [{ expr0: 0 }] }) as { records: Record<string, unknown>[] };
  const lwcData = val(lwcCount, { records: [{ expr0: 0 }] }) as { records: Record<string, unknown>[] };
  const auraData = val(auraCount, { records: [{ expr0: 0 }] }) as { records: Record<string, unknown>[] };
  const flowData = val(flowCount, { records: [{ expr0: 0 }] }) as { records: Record<string, unknown>[] };
  const customObjData = val(customObjCount, { count: 0 }) as { count: number };
  const pkgData = val(packages, { records: [] }) as { records: Record<string, unknown>[] };
  const licData = val(licenses, { records: [] }) as { records: Record<string, unknown>[] };

  // Fetch org details separately (different endpoint)
  const orgRes = await sfQuery(instanceUrl, accessToken, "SELECT Name, Id, OrganizationType, InstanceName FROM Organization LIMIT 1").catch(() => ({ records: [] }));
  const org = orgRes.records[0] as Record<string, unknown> || {};

  return {
    orgName: (org.Name as string) || 'Your Org',
    orgId: (org.Id as string) || '',
    orgType: (org.OrganizationType as string) || 'Unknown',
    edition: (orgData.name as string) || 'Salesforce',
    totalUsers: (userCountData.records[0]?.expr0 as number) || 0,
    activeUsers: (userCountData.records[0]?.expr0 as number) || 0,
    developerUsers: (devData.records[0]?.expr0 as number) || 0,
    apexClasses: (apexData.records[0]?.expr0 as number) || 0,
    apexTriggers: (triggerData.records[0]?.expr0 as number) || 0,
    lwcComponents: (lwcData.records[0]?.expr0 as number) || 0,
    auraComponents: (auraData.records[0]?.expr0 as number) || 0,
    flows: (flowData.records[0]?.expr0 as number) || 0,
    customObjects: customObjData.count || 0,
    installedPackages: pkgData.records.map((r) => {
      const pkg = r.SubscriberPackage as Record<string, unknown>;
      const ver = r.SubscriberPackageVersion as Record<string, unknown>;
      return {
        name: (pkg?.Name as string) || '',
        namespace: (pkg?.NamespacePrefix as string) || '',
        version: (ver?.VersionNumber as string) || '',
      };
    }),
    sfLicenses: licData.records.map((r) => ({
      name: (r.Name as string) || '',
      total: (r.TotalLicenses as number) || 0,
      used: (r.UsedLicenses as number) || 0,
    })),
  };
}

export function buildOAuthUrl(clientId: string, callbackUrl: string, loginUrl: string = 'https://login.salesforce.com'): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: callbackUrl,
    scope: 'api refresh_token',
  });
  return loginUrl + '/services/oauth2/authorize?' + params.toString();
}

export async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
  callbackUrl: string,
  loginUrl: string = 'https://login.salesforce.com'
): Promise<{ access_token: string; instance_url: string; id: string }> {
  const res = await fetch(loginUrl + '/services/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error('Token exchange failed: ' + err);
  }
  return res.json();
}
