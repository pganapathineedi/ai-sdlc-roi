import { getSession } from '@/lib/session';
import { fetchOrgMetadata } from '@/lib/salesforce';
import { estimateFteFromOrg } from '@/lib/calculations';
import EstimatorClient from '@/components/estimator/EstimatorClient';
import type { SfOrgMetadata } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function EstimatorPage() {
  const session = await getSession();

  let metadata: SfOrgMetadata | null = null;
  if (session) {
    try {
      metadata = await fetchOrgMetadata(session.instanceUrl, session.accessToken);
    } catch {
      // fall through to defaults
    }
  }

  const defaultFte = metadata
    ? estimateFteFromOrg(metadata.apexClasses, metadata.lwcComponents, metadata.flows, metadata.activeUsers)
    : 5;

  const orgContext = metadata
    ? metadata.orgName +
      ' org: ' + metadata.apexClasses + ' Apex classes, ' +
      metadata.lwcComponents + ' LWC, ' +
      metadata.flows + ' flows, ' +
      metadata.activeUsers + ' active users, ' +
      metadata.customObjects + ' custom objects'
    : undefined;

  return (
    <EstimatorClient
      defaultFte={defaultFte}
      orgName={metadata?.orgName}
      orgContext={orgContext}
      isConnected={!!session}
    />
  );
}
