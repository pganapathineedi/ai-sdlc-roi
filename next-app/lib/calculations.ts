import type { RoiParams, PhaseConfig, ModelDef, RoiResult } from './types';

export const DEF_PHASES: PhaseConfig[] = [
  { name: 'Requirements', pct: 0.10, aiR: 0.25, time: 20, tools: 'Claude / GPT-4, Agentforce' },
  { name: 'Design',       pct: 0.10, aiR: 0.20, time: 18, tools: 'GitHub Copilot, Figma AI' },
  { name: 'Development',  pct: 0.35, aiR: 0.45, time: 35, tools: 'GitHub Copilot, Einstein Code, Cursor' },
  { name: 'Testing / QA', pct: 0.20, aiR: 0.40, time: 30, tools: 'Copado AI, SF Test AI' },
  { name: 'Deployment',   pct: 0.10, aiR: 0.20, time: 15, tools: 'Copado, GitLab Duo' },
  { name: 'Monitoring',   pct: 0.10, aiR: 0.25, time: 20, tools: 'Splunk AI, Einstein Analytics' },
  { name: 'Docs',         pct: 0.05, aiR: 0.50, time: 50, tools: 'Notion AI, Claude' },
];

export const DEF_MODELS: ModelDef[] = [
  { name: 'Crawl', label: 'AI-assisted',   color: '#5F5E5A', bg: '#F1EFE8', mult: 0.42, saasScale: 0.3, sfScale: 0.2, infraScale: 0,   trainScale: 0.5 },
  { name: 'Walk',  label: 'AI-integrated', color: '#185FA5', bg: '#E6F1FB', mult: 0.70, saasScale: 0.6, sfScale: 0.5, infraScale: 0,   trainScale: 0.8 },
  { name: 'Run',   label: 'AI-augmented',  color: '#3B6D11', bg: '#EAF3DE', mult: 1.00, saasScale: 1.0, sfScale: 1.0, infraScale: 0.5, trainScale: 1.0, rec: true },
  { name: 'Fly',   label: 'AI-native',     color: '#3C3489', bg: '#EEEDFE', mult: 1.43, saasScale: 1.3, sfScale: 1.5, infraScale: 1.0, trainScale: 1.2 },
];

export const DEF_TEAM: RoiParams = { fte: 10, rate: 120000, adopt: 0.70, overhead: 0.25, level: 2 };

export function calcSaving(p: RoiParams, phases: PhaseConfig[], levelIdx: number): number {
  let t = 0;
  phases.forEach(ph => { t += ph.pct * p.fte * ph.aiR * p.adopt * (1 - p.overhead); });
  return t * DEF_MODELS[levelIdx].mult;
}

export function avgEffortReduction(phases: PhaseConfig[]): number {
  return phases.reduce((sum, ph) => sum + ph.pct * ph.aiR, 0);
}

export function calcRoi(p: RoiParams, phases: PhaseConfig[], annualCost: number): RoiResult {
  const fteSaved = calcSaving(p, phases, p.level);
  const grossSaving = fteSaved * p.rate;
  const totalCost = annualCost;
  const netBenefit = grossSaving - totalCost;
  const oneOffCost = p.fte * 700; // rough training one-off
  const paybackMonths = netBenefit > 0 ? (oneOffCost / netBenefit) * 12 : null;
  const roiMultiple = totalCost > 0 ? grossSaving / totalCost : 0;

  return {
    grossSaving: Math.round(grossSaving),
    totalCost: Math.round(totalCost),
    netBenefit: Math.round(netBenefit),
    paybackMonths,
    avgEffortReduction: avgEffortReduction(phases),
    fteSaved: Math.round(fteSaved * 10) / 10,
    roiMultiple: Math.round(roiMultiple * 10) / 10,
  };
}

export function estimateFteFromOrg(apexClasses: number, lwcComponents: number, flows: number, activeUsers: number): number {
  // Heuristic: ~1 dev per 50 Apex classes or 30 LWC, capped to reasonable range
  const byCode = Math.ceil((apexClasses / 50) + (lwcComponents / 30) + (flows / 40));
  const byUsers = Math.ceil(activeUsers / 20);
  const estimate = Math.round((byCode + byUsers) / 2);
  return Math.max(3, Math.min(estimate, 150));
}

export function fk(n: number): string {
  if (Math.abs(n) >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
  if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (Math.abs(n) >= 1e3) return '$' + Math.round(n / 1000) + 'k';
  return '$' + n;
}

export function fm(n: number): string {
  return '$' + Math.round(n).toLocaleString('en-US');
}
