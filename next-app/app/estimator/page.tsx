import { getSession } from '@/lib/session';
import { fetchOrgMetadata } from '@/lib/salesforce';
import EstimatorClient from '@/components/estimator/EstimatorClient';
import type { SfOrgMetadata, EstimatorOrgSnapshot } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function EstimatorPage() {
  const session = await getSession();

  let metadata: SfOrgMetadata | null = null;
  if (session) {
    try {
      metadata = await fetchOrgMetadata(session.instanceUrl, session.accessToken);
    } catch {
      // fall through to no-org mode
    }
  }

  const orgSnapshot: EstimatorOrgSnapshot | undefined = metadata ? {
    orgName: metadata.orgName,
    orgType: metadata.orgType,
    activeUsers: metadata.activeUsers,
    apexClasses: metadata.apexClasses,
    apexTriggers: metadata.apexTriggers,
    lwcComponents: metadata.lwcComponents,
    auraComponents: metadata.auraComponents,
    flows: metadata.flows,
    sfLicenses: metadata.sfLicenses,
  } : undefined;

  return (
    <EstimatorClient
      orgName={metadata?.orgName}
      orgSnapshot={orgSnapshot}
      isConnected={!!session}
    />
  );
}
