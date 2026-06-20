import type { SfSession, SfOrgMetadata } from '@/lib/types';
import Link from 'next/link';

interface Props {
  session: SfSession | null;
  metadata: SfOrgMetadata | null;
}

export default function OrgBanner({ session, metadata }: Props) {
  if (!session) {
    return (
      <Link
        href="/connect"
        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
      >
        Connect Salesforce
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 bg-green-500 rounded-full" />
        <span className="text-xs text-gray-600">
          {metadata?.orgName || 'Connected'} &middot; {session.displayName}
        </span>
      </div>
      <form action="/api/sf/disconnect" method="POST">
        <button
          type="submit"
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Disconnect
        </button>
      </form>
    </div>
  );
}
