'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { EstimatorOption, EstimatorResponse, EstimatorTask, ToolchainLayer } from '@/lib/types';

const DEMO_UC =
  'Build an AI-powered Apex code review and quality gate bot for Salesforce that automatically reviews pull requests, enforces coding standards, detects security vulnerabilities in Apex and LWC code, and blocks deployments that fail quality thresholds. The bot should integrate with GitHub Actions and Copado CI/CD pipelines.';

const EXAMPLES = [
  'Automate Salesforce lead scoring using Einstein AI and route high-value leads to senior reps',
  'Build an Agentforce-powered customer service agent that resolves tier-1 cases without human intervention',
  'Create a Copado AI-assisted release pipeline with automated regression testing and one-click rollback',
  'Implement AI-generated LWC components from Figma designs using GitHub Copilot and Einstein Code',
];

const TC_BG: Record<string, string> = {
  'Code Gen': '#E6F1FB',
  'Test Automation': '#EAF3DE',
  'Requirements': '#EEEDFE',
  'Deployment': '#FAEEDA',
  'Monitoring': '#f0ede8',
  'Docs': '#F1EFE8',
  'LLM/Agent': '#E1F5EE',
};
const TC_FG: Record<string, string> = {
  'Code Gen': '#185FA5',
  'Test Automation': '#3B6D11',
  'Requirements': '#3C3489',
  'Deployment': '#854F0B',
  'Monitoring': '#5F5E5A',
  'Docs': '#5F5E5A',
  'LLM/Agent': '#0F6E56',
};

interface Props {
  defaultFte: number;
  orgName?: string;
  orgContext?: string;
  isConnected: boolean;
}

type Status = 'idle' | 'loading' | 'done' | 'error';

function fk(n: number): string {
  if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (Math.abs(n) >= 1e3) return '$' + Math.round(n / 1000) + 'k';
  return '$' + Math.round(n);
}

function fmt(n: number): string {
  return '$' + Math.round(n).toLocaleString('en-US');
}

export default function EstimatorClient({ defaultFte, orgName, orgContext, isConnected }: Props) {
  const [usecase, setUsecase] = useState('');
  const [fte, setFte] = useState(defaultFte);
  const [rate, setRate] = useState(120000);
  const [platform, setPlatform] = useState<'salesforce' | 'generic' | 'both'>('salesforce');
  const [status, setStatus] = useState<Status>('idle');
  const [statusText, setStatusText] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [options, setOptions] = useState<EstimatorOption[] | null>(null);
  const [activeIdx, setActiveIdx] = useState(2); // default to Balanced
  const [error, setError] = useState('');

  function addLog(msg: string) {
    setLog((prev) => [...prev, msg]);
  }

  async function runEstimate() {
    if (!usecase.trim()) return;
    setStatus('loading');
    setStatusText('Step 1 of 3 — parsing use case...');
    setLog([]);
    setOptions(null);
    setError('');

    addLog('Use case: ' + usecase.substring(0, 60) + '...');
    addLog('Platform: ' + platform);
    addLog('Team: ' + fte + ' FTE at $' + rate.toLocaleString() + '/yr');
    if (orgContext) addLog('Org context: ' + orgContext.substring(0, 80) + '...');

    setStatusText('Step 2 of 3 — evaluating AI tools...');

    try {
      const res = await fetch('/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usecase, fte, rate, platform, orgContext }),
      });

      setStatusText('Step 3 of 3 — building delivery plan...');
      addLog('Response received, processing...');

      const data = await res.json() as EstimatorResponse & { error?: string };
      if (!res.ok || data.error) {
        throw new Error(data.error || 'API error ' + res.status);
      }

      addLog('Done — ' + data.options.length + ' delivery options generated');
      setOptions(data.options);
      setActiveIdx(data.options.length >= 3 ? 2 : 0);
      setStatus('done');
      setStatusText('Complete');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setStatus('error');
      setStatusText('Error: ' + msg);
      addLog('ERROR: ' + msg);
    }
  }

  function loadDemo() {
    setUsecase(DEMO_UC);
    setFte(3);
    setRate(120000);
    setPlatform('salesforce');
  }

  const activeOption = options && options[activeIdx] ? options[activeIdx] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Dashboard
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-semibold text-gray-900">Use case estimator</span>
          </div>
          {isConnected && orgName && (
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              {orgName}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Form card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h1 className="text-lg font-bold text-gray-900 mb-1">AI use case estimator</h1>
          <p className="text-sm text-gray-500 mb-5">
            Describe any Salesforce or IT use case. The AI agent breaks it into SDLC tasks, recommends the best
            AI tools, estimates effort and cost, and produces three delivery options.
            {isConnected && orgContext && (
              <span className="text-blue-600"> Estimates are grounded in your {orgName} org metrics.</span>
            )}
          </p>

          <textarea
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
            rows={4}
            placeholder="e.g. Build an AI-powered Salesforce lead qualification workflow that scores inbound leads using Einstein AI and routes high-value leads to senior reps..."
            value={usecase}
            onChange={(e) => setUsecase(e.target.value)}
          />

          {/* Examples */}
          <div className="flex flex-wrap gap-2 mt-3">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setUsecase(ex)}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded-full transition-colors"
              >
                {ex.substring(0, 50)}...
              </button>
            ))}
          </div>

          {/* Options row */}
          <div className="flex flex-wrap gap-4 mt-5 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Team FTE</label>
              <input
                type="number" min={1} max={200}
                className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={fte}
                onChange={(e) => setFte(parseInt(e.target.value, 10) || 5)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Blended rate ($/yr)</label>
              <input
                type="number" min={50000} step={5000}
                className="w-32 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={rate}
                onChange={(e) => setRate(parseInt(e.target.value, 10) || 120000)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Platform</label>
              <select
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={platform}
                onChange={(e) => setPlatform(e.target.value as 'salesforce' | 'generic' | 'both')}
              >
                <option value="salesforce">Salesforce</option>
                <option value="generic">Generic IT</option>
                <option value="both">Salesforce + Custom dev</option>
              </select>
            </div>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={loadDemo}
                className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-xl border border-gray-300 hover:border-gray-400 transition-colors"
              >
                Load demo
              </button>
              <button
                onClick={runEstimate}
                disabled={!usecase.trim() || status === 'loading'}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold text-sm px-6 py-2 rounded-xl transition-colors"
              >
                {status === 'loading' ? 'Analysing...' : 'Estimate with AI'}
              </button>
            </div>
          </div>
        </div>

        {/* Status / log */}
        {(status === 'loading' || status === 'error' || log.length > 0) && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              {status === 'loading' && (
                <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              )}
              {status === 'error' && <span className="text-red-500 text-sm">!</span>}
              {status === 'done' && <span className="text-green-600 text-sm font-bold">✓</span>}
              <span className="text-sm text-gray-600">{statusText}</span>
            </div>
            {log.length > 0 && (
              <div className="mt-3 font-mono text-xs text-gray-400 space-y-0.5 max-h-24 overflow-hidden">
                {log.map((l, i) => (
                  <div key={i}>&gt; {l}</div>
                ))}
              </div>
            )}
            {error && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
            )}
          </div>
        )}

        {/* Three-option selector */}
        {options && options.length > 0 && (
          <OptionSelector options={options} activeIdx={activeIdx} onSelect={setActiveIdx} />
        )}

        {/* Active option detail */}
        {activeOption && (
          <OptionDetail option={activeOption} fk={fk} fmt={fmt} />
        )}
      </main>
    </div>
  );
}

// ─── Option selector ─────────────────────────────────────────────────────────

function OptionSelector({
  options,
  activeIdx,
  onSelect,
}: {
  options: EstimatorOption[];
  activeIdx: number;
  onSelect: (i: number) => void;
}) {
  const issues = checkOptionIssues(options);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-base font-bold text-gray-900 mb-1">Three delivery options</h2>
      <p className="text-sm text-gray-500 mb-4">
        Same use case, three approaches. Click an option to see its full plan.
      </p>

      {issues.length > 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
          <span className="font-semibold">Inconsistent estimate</span> — the AI returned contradictory numbers.
          Re-run for a cleaner comparison.
          <ul className="mt-1 ml-4 list-disc">
            {issues.map((iss) => <li key={iss}>{iss}</li>)}
          </ul>
        </div>
      )}

      {/* Option buttons */}
      <div className="flex flex-wrap gap-3 mb-5">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={
              'text-left min-w-[180px] border-2 rounded-xl px-4 py-3 transition-colors ' +
              (i === activeIdx
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300')
            }
          >
            <div className="text-sm font-bold text-gray-900">{opt.optionLabel || 'Option ' + (i + 1)}</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {fk(opt.totalAiCost || 0)} &middot; {opt.deployTimeWeeks || 0} wks &middot; {opt.aiTimeSavingPct || 0}% saved
            </div>
          </button>
        ))}
      </div>

      {/* Comparison table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Option</th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Optimised for</th>
              <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase">AI cost</th>
              <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Deploy</th>
              <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Time saved</th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Trade-off</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {options.map((opt, i) => (
              <tr
                key={i}
                onClick={() => onSelect(i)}
                className={'cursor-pointer ' + (i === activeIdx ? 'bg-blue-50' : 'hover:bg-gray-50')}
              >
                <td className="px-4 py-2.5 font-semibold text-gray-900">{opt.optionLabel}</td>
                <td className="px-4 py-2.5 text-gray-600">{opt.optimizedFor}</td>
                <td className="px-4 py-2.5 text-right font-medium">{fk(opt.totalAiCost || 0)}</td>
                <td className="px-4 py-2.5 text-right">{opt.deployTimeWeeks || 0} wks</td>
                <td className="px-4 py-2.5 text-right">
                  <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                    {opt.aiTimeSavingPct || 0}%
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-500 hidden md:table-cell">{opt.tradeoff}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Option detail ────────────────────────────────────────────────────────────

function OptionDetail({ option, fk, fmt }: { option: EstimatorOption; fk: (n: number) => string; fmt: (n: number) => string }) {
  return (
    <div className="space-y-5">
      {/* Headline metrics */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-base font-bold text-gray-900">{option.optionLabel}: {option.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{option.summary}</p>
          </div>
          <span className={
            'text-xs font-semibold px-3 py-1 rounded-full ' +
            (option.complexity === 'Low' ? 'bg-green-100 text-green-800' :
              option.complexity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
              option.complexity === 'High' ? 'bg-orange-100 text-orange-800' :
              'bg-red-100 text-red-800')
          }>
            {option.complexity} complexity
          </span>
        </div>

        {/* AI recommendation banner */}
        <div className="bg-purple-50 border-l-4 border-purple-500 rounded-r-xl p-3 mb-5">
          <div className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-1">AI Agent Recommendation</div>
          <p className="text-sm text-purple-900 font-medium">{option.banner}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Manual delivery', val: option.totalManualDays + ' days', sub: fmt(option.totalManualCost) + ' total', color: 'text-gray-600' },
            { label: 'With AI', val: option.totalAiDays + ' days', sub: fmt(option.totalAiCost) + ' total', color: 'text-blue-700' },
            { label: 'Time saved', val: option.aiTimeSavingPct + '%', sub: (option.totalManualDays - option.totalAiDays) + ' days faster', color: 'text-green-700' },
            { label: 'Deploy to prod', val: option.deployTimeWeeks + ' wks', sub: 'AI-augmented team', color: 'text-gray-700' },
            { label: 'Monthly run cost', val: fmt(option.monthlyRunCost), sub: 'Licences + tokens', color: 'text-orange-700' },
          ].map((m) => (
            <div key={m.label} className="bg-gray-50 rounded-xl p-3">
              <div className={'text-xl font-bold ' + m.color}>{m.val}</div>
              <div className="text-xs font-medium text-gray-600 mt-0.5">{m.label}</div>
              <div className="text-xs text-gray-400">{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Task breakdown */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">SDLC task breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Phase</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Task</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">AI tool</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Manual</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">With AI</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Saved</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Tool /mo</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Conf.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {option.tasks.map((t: EstimatorTask, i: number) => {
                const saved = Math.round(((t.manualDays - t.aiDays) / Math.max(t.manualDays, 1)) * 100);
                const bg = TC_BG[t.aiToolCategory] || '#f0ede8';
                const fg = TC_FG[t.aiToolCategory] || '#555';
                return (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{t.phase}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{t.task}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{t.description}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-md"
                        style={{ background: bg, color: fg }}
                      >
                        {t.aiTool}
                      </span>
                      {t.rationale.startsWith('Outside selected stack:') && (
                        <div className="text-xs text-amber-600 mt-0.5">{t.rationale}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">{t.manualDays}d</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700">{t.aiDays}d</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs bg-green-100 text-green-800 font-semibold px-2 py-0.5 rounded-full">-{saved}%</span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-500 hidden sm:table-cell">
                      {t.toolMonthlyCost > 0 ? '$' + t.toolMonthlyCost + '/mo' : 'Incl.'}
                    </td>
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      <span className={
                        'text-xs font-semibold px-2 py-0.5 rounded-full ' +
                        (t.confidence === 'High' ? 'bg-green-100 text-green-800' :
                          t.confidence === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800')
                      }>
                        {t.confidence}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gantt */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Delivery timeline</h3>
        <GanttChart tasks={option.tasks} />
      </div>

      {/* Toolchain + Risks + Arch in a grid */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Recommended toolchain</h3>
          <div className="space-y-3">
            {option.toolchain.map((tl: ToolchainLayer, i: number) => (
              <div key={i} className="border border-gray-100 rounded-xl p-3">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Layer {i + 1} — {tl.layer}</div>
                <div className="text-sm font-semibold text-gray-900">{tl.tool}</div>
                <div className="text-xs text-gray-500 mt-0.5">{tl.purpose}</div>
                <div className="text-xs text-gray-400 mt-1">Alt: {tl.alternatives}</div>
                {tl.monthlyCost > 0
                  ? <div className="text-xs font-medium text-orange-700 mt-1">${tl.monthlyCost}/mo</div>
                  : <div className="text-xs font-medium text-green-700 mt-1">Included / free tier</div>
                }
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Key risks</h3>
            <ul className="space-y-2">
              {option.risks.map((r: string, i: number) => (
                <li key={i} className="flex gap-2 text-sm text-gray-600">
                  <span className="text-gray-400 mt-0.5">&#9658;</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Architecture notes</h3>
            <ul className="space-y-2">
              {option.architectureNotes.map((n: string, i: number) => (
                <li key={i} className="flex gap-2 text-sm text-gray-600">
                  <span className="text-gray-400 mt-0.5">&#9658;</span>
                  {n}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Gantt chart ──────────────────────────────────────────────────────────────

function GanttChart({ tasks }: { tasks: EstimatorTask[] }) {
  const WPD = 5;
  const ALL_PHASES = ['Requirements', 'Design', 'Development', 'Testing', 'Deployment', 'Monitoring', 'Documentation'];

  const pd: Record<string, { m: number; a: number; tools: string[] }> = {};
  ALL_PHASES.forEach((ph) => { pd[ph] = { m: 0, a: 0, tools: [] }; });
  tasks.forEach((t) => {
    const ph = t.phase || 'Other';
    if (!pd[ph]) pd[ph] = { m: 0, a: 0, tools: [] };
    pd[ph].m += t.manualDays;
    pd[ph].a += t.aiDays;
    if (t.aiTool && !pd[ph].tools.includes(t.aiTool)) pd[ph].tools.push(t.aiTool);
  });

  const active = ALL_PHASES.filter((ph) => pd[ph].m > 0);

  function toW(d: number) { return d / WPD; }
  function fmtW(d: number) {
    const w = d / WPD;
    return w >= 1 ? (Math.round(w * 10) / 10) + 'w' : d + 'd';
  }

  let mCur = 0, aCur = 0;
  const mStarts: number[] = [];
  const aStarts: number[] = [];
  active.forEach((ph) => {
    mStarts.push(mCur);
    aStarts.push(aCur);
    mCur += toW(pd[ph].m);
    aCur += toW(pd[ph].a);
  });

  const totM = mCur, totA = aCur;
  const maxW = Math.max(totM, totA, 1);
  const totSp = Math.round(((totM - totA) / Math.max(totM, 0.1)) * 100);

  return (
    <div>
      <div className="flex gap-4 text-xs text-gray-400 mb-2 ml-28">
        <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-gray-400 rounded-sm inline-block" />Traditional</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-emerald-500 rounded-sm inline-block" />AI-augmented</span>
      </div>
      <div className="space-y-2">
        {active.map((ph, idx) => {
          const mD = pd[ph].m;
          const aD = pd[ph].a;
          const mL = (mStarts[idx] / maxW) * 100;
          const aL = (aStarts[idx] / maxW) * 100;
          const mW = Math.max((toW(mD) / maxW) * 100, 2);
          const aW = Math.max((toW(aD) / maxW) * 100, 2);
          const sp = Math.round(((mD - aD) / Math.max(mD, 0.1)) * 100);

          return (
            <div key={ph} className="flex items-center gap-2">
              <div className="w-28 min-w-[7rem] text-xs font-semibold text-gray-500 text-right pr-2 truncate">{ph}</div>
              <div className="flex-1 relative h-9">
                <div
                  className="absolute top-0 h-[15px] bg-gray-400 rounded-sm flex items-center overflow-hidden"
                  style={{ left: mL + '%', width: mW + '%' }}
                >
                  <span className="text-white text-[9px] font-bold ml-1 whitespace-nowrap">{fmtW(mD)}</span>
                </div>
                <div
                  className="absolute top-[19px] h-[15px] bg-emerald-500 rounded-sm flex items-center overflow-hidden"
                  style={{ left: aL + '%', width: aW + '%' }}
                >
                  <span className="text-white text-[9px] font-bold ml-1 whitespace-nowrap">{fmtW(aD)}</span>
                </div>
              </div>
              <div className="w-12 text-right text-xs font-semibold text-green-700">-{sp}%</div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
        <div className="w-28 min-w-[7rem] text-xs font-bold text-gray-700 text-right pr-2">TOTAL</div>
        <div className="flex-1 text-xs text-gray-600">
          <span className="font-bold">{Math.round(totM * 10) / 10} weeks</span> traditional vs{' '}
          <span className="font-bold text-emerald-700">{Math.round(totA * 10) / 10} weeks</span> AI-augmented
        </div>
        <div className="w-12 text-right text-xs font-bold text-green-700">-{totSp}%</div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function checkOptionIssues(options: EstimatorOption[]): string[] {
  if (options.length < 2) return [];
  const costs = options.map((o) => o.totalAiCost || 0);
  const times = options.map((o) => o.deployTimeWeeks || 0);
  const minCost = Math.min(...costs);
  const minTime = Math.min(...times);
  const issues: string[] = [];
  options.forEach((o) => {
    const label = (o.optionLabel || '').toLowerCase();
    if (label.includes('cost') && (o.totalAiCost || 0) > minCost) {
      issues.push('"' + o.optionLabel + '" is not the cheapest — another option costs less.');
    }
    if (label.includes('fast') && (o.deployTimeWeeks || 0) > minTime) {
      issues.push('"' + o.optionLabel + '" is not the fastest — another option deploys sooner.');
    }
  });
  return issues;
}
