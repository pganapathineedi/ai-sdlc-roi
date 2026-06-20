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
