import Link from 'next/link';
import { getSession } from '@/lib/session';
import { fetchOrgMetadata } from '@/lib/salesforce';
import { DEF_TEAM, DEF_PHASES, DEF_MODELS, calcRoi, estimateFteFromOrg, fk, fm } from '@/lib/calculations';
import type { SfOrgMetadata } from '@/lib/types';
import OrgBanner from '@/components/sf/OrgBanner';
import RoiSummary from '@/components/roi/RoiSummary';
import PhaseTable from '@/components/roi/PhaseTable';
import MaturityCards from '@/components/roi/MaturityCards';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getSession();

  let metadata: SfOrgMetadata | null = null;
  if (session) {
    try {
      metadata = await fetchOrgMetadata(session.instanceUrl, session.accessToken);
    } catch {
      // Continue with defaults if metadata fetch fails
    }
  }

  // Ground estimates in SF metadata where available
  const fte = metadata
    ? estimateFteFromOrg(metadata.apexClasses, metadata.lwcComponents, metadata.flows, metadata.activeUsers)
    : DEF_TEAM.fte;

  const params = { ...DEF_TEAM, fte };

  // Annual cost estimate (simplified for lean v1)
  const annualCost = fte * 12000; // ~$12k/FTE/yr tooling estimate

  const roi = calcRoi(params, DEF_PHASES, annualCost);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="font-semibold text-gray-900 text-sm">AI SDLC ROI</span>
            </div>
            <nav className="hidden sm:flex items-center gap-1">
              <Link href="/dashboard" className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">Dashboard</Link>
              <Link href="/estimator" className="text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors">Use case estimator</Link>
            </nav>
          </div>
          <OrgBanner session={session} metadata={metadata} />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Org metadata insight bar */}
        {metadata && <MetadataInsightBar metadata={metadata} fte={fte} />}

        {/* Executive summary cards */}
        <RoiSummary roi={roi} params={params} fk={fk} fm={fm} />

        {/* Maturity model comparison */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Crawl / Walk / Run / Fly comparison</h2>
          <MaturityCards params={params} phases={DEF_PHASES} models={DEF_MODELS} annualCost={annualCost} fk={fk} />
        </section>

        {/* Phase breakdown */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-4">SDLC phase breakdown</h2>
          <PhaseTable phases={DEF_PHASES} params={params} fm={fm} />
        </section>

        {/* Estimator CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-white font-bold text-base">Ready to estimate a specific use case?</h2>
            <p className="text-blue-100 text-sm mt-1">
              Describe any Salesforce or IT initiative — the AI agent breaks it into tasks, recommends tools,
              and returns three delivery options{metadata ? ' grounded in your ' + metadata.orgName + ' org' : ''}.
            </p>
          </div>
          <Link
            href="/estimator"
            className="shrink-0 bg-white text-blue-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors"
          >
            Open estimator
          </Link>
        </div>
      </main>
    </div>
  );
}

function MetadataInsightBar({ metadata, fte }: { metadata: SfOrgMetadata; fte: number }) {
  const items = [
    { label: 'Org', value: metadata.orgName },
    { label: 'Active users', value: metadata.activeUsers.toLocaleString() },
    { label: 'Apex classes', value: metadata.apexClasses.toLocaleString() },
    { label: 'LWC components', value: metadata.lwcComponents.toLocaleString() },
    { label: 'Active flows', value: metadata.flows.toLocaleString() },
    { label: 'Est. dev FTE', value: fte.toString(), highlight: true },
  ];

  return (
    <div className="bg-blue-600 rounded-xl p-4 text-white">
      <p className="text-xs font-semibold text-blue-200 uppercase tracking-wide mb-3">
        Grounded from your Salesforce org
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className={'text-lg font-bold ' + (item.highlight ? 'text-yellow-300' : 'text-white')}>
              {item.value}
            </div>
            <div className="text-xs text-blue-200">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
