export interface SfSession {
  accessToken: string;
  instanceUrl: string;
  orgId: string;
  userId: string;
  displayName: string;
}

export interface SfOrgMetadata {
  orgName: string;
  orgId: string;
  orgType: string;
  edition: string;
  totalUsers: number;
  activeUsers: number;
  developerUsers: number;
  apexClasses: number;
  apexTriggers: number;
  lwcComponents: number;
  auraComponents: number;
  flows: number;
  customObjects: number;
  installedPackages: InstalledPackage[];
  sfLicenses: SfLicense[];
}

export interface InstalledPackage {
  name: string;
  namespace: string;
  version: string;
}

export interface SfLicense {
  name: string;
  total: number;
  used: number;
}

export interface RoiParams {
  fte: number;
  rate: number;
  adopt: number;
  overhead: number;
  level: number;
}

export interface PhaseConfig {
  name: string;
  pct: number;
  aiR: number;
  time: number;
  tools: string;
}

export interface ModelDef {
  name: string;
  label: string;
  color: string;
  bg: string;
  mult: number;
  saasScale: number;
  sfScale: number;
  infraScale: number;
  trainScale: number;
  rec?: boolean;
}

export interface RoiResult {
  grossSaving: number;
  totalCost: number;
  netBenefit: number;
  paybackMonths: number | null;
  avgEffortReduction: number;
  fteSaved: number;
  roiMultiple: number;
}

// ── Estimator types ──────────────────────────────────────────────────────────

export type AiToolCategory =
  | 'Code Gen'
  | 'Test Automation'
  | 'Requirements'
  | 'Deployment'
  | 'Monitoring'
  | 'Docs'
  | 'LLM/Agent';

export interface EstimatorTask {
  phase: string;
  task: string;
  description: string;
  aiTool: string;
  aiToolCategory: AiToolCategory;
  manualDays: number;
  aiDays: number;
  toolMonthlyCost: number;
  confidence: 'High' | 'Medium' | 'Low';
  rationale: string;
}

export interface ToolchainLayer {
  layer: string;
  tool: string;
  purpose: string;
  monthlyCost: number;
  alternatives: string;
}

export interface EstimatorOption {
  optionLabel: string;
  optimizedFor: string;
  tradeoff: string;
  title: string;
  summary: string;
  complexity: 'Low' | 'Medium' | 'High' | 'Very High';
  totalManualDays: number;
  totalAiDays: number;
  totalManualCost: number;
  totalAiCost: number;
  monthlyRunCost: number;
  deployTimeWeeks: number;
  aiTimeSavingPct: number;
  banner: string;
  tasks: EstimatorTask[];
  toolchain: ToolchainLayer[];
  risks: string[];
  architectureNotes: string[];
}

export interface EstimatorRequest {
  usecase: string;
  fte: number;
  rate: number;
  platform: 'salesforce' | 'generic' | 'both';
  orgContext?: string;
}

export interface EstimatorResponse {
  options: EstimatorOption[];
}
