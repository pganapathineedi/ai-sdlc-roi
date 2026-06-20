import Link from 'next/link';

export default function ConnectPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-xl mb-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AI SDLC ROI Tool</h1>
          <p className="mt-2 text-gray-500 text-sm">
            Connect your Salesforce org to ground ROI estimates in your real metadata.
          </p>
        </div>

        {/* Error banner */}
        <ErrorBanner searchParams={searchParams} />

        {/* What we read */}
        <div className="mb-6 bg-blue-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">What we read (read-only)</p>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>User counts &amp; licence types</li>
            <li>Apex classes, triggers, LWC, Flows</li>
            <li>Custom object count</li>
            <li>Installed package names</li>
          </ul>
          <p className="mt-2 text-xs text-blue-600">We never write to or modify your org.</p>
        </div>

        {/* Connect buttons */}
        <div className="space-y-3">
          <a
            href="/api/sf/auth"
            className="flex items-center justify-center w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            Connect Production Org
          </a>
          <a
            href="/api/sf/auth?sandbox=1"
            className="flex items-center justify-center w-full gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-xl border border-gray-300 transition-colors"
          >
            Connect Sandbox
          </a>
        </div>

        {/* Divider */}
        <div className="flex items-center my-5">
          <div className="flex-1 border-t border-gray-200" />
          <span className="px-3 text-xs text-gray-400">or</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        {/* Skip link */}
        <Link
          href="/dashboard"
          className="flex items-center justify-center w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Continue without connecting (use defaults)
        </Link>
      </div>

      <p className="mt-6 text-xs text-gray-400 text-center max-w-xs">
        Uses Salesforce OAuth 2.0. Your access token is stored in an httpOnly cookie and never leaves the server.
      </p>
    </div>
  );
}

async function ErrorBanner({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  if (!params.error) return null;
  return (
    <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
      Connection failed: {decodeURIComponent(params.error)}
    </div>
  );
}
