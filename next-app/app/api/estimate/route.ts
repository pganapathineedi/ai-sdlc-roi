import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { EstimatorRequest, EstimatorResponse, EstimatorOrgSnapshot } from '@/lib/types';

const client = new Anthropic();

const OPTION_SCHEMA = '{"optionLabel":"Lowest cost|Fastest time-to-market|Balanced","optimizedFor":"short phrase","tradeoff":"one line","title":"string","summary":"2 sentences","complexity":"Low|Medium|High|Very High","totalManualDays":0,"totalAiDays":0,"totalManualCost":0,"totalAiCost":0,"monthlyRunCost":0,"deployTimeWeeks":0,"aiTimeSavingPct":0,"banner":"one sentence ROI","tasks":[{"phase":"Requirements|Design|Development|Testing|Deployment|Monitoring|Documentation","task":"name","description":"short","aiTool":"tool name","aiToolCategory":"Code Gen|Test Automation|Requirements|Deployment|Monitoring|Docs|LLM/Agent","manualDays":0,"aiDays":0,"toolMonthlyCost":0,"confidence":"High|Medium|Low","rationale":"short"}],"toolchain":[{"layer":"name","tool":"name","purpose":"short","monthlyCost":0,"alternatives":"short"}],"risks":["r1","r2"],"architectureNotes":["n1","n2"]}';

function buildOrgGrounding(org: EstimatorOrgSnapshot): string {
  const lines: string[] = [];

  lines.push('=== CONNECTED SALESFORCE ORG — ground ALL estimates in this real data ===');
  lines.push('Organisation: ' + org.orgName + ' (' + org.orgType + ')');
  lines.push('Active users: ' + org.activeUsers + ' (use this as your team/stakeholder base signal)');
  lines.push('');
  lines.push('EXISTING CODEBASE:');
  lines.push('  Apex classes:    ' + org.apexClasses + (org.apexClasses > 100 ? ' — LARGE codebase, high regression risk' : org.apexClasses > 30 ? ' — moderate codebase' : ' — small codebase'));
  lines.push('  Apex triggers:   ' + org.apexTriggers + (org.apexTriggers > 10 ? ' — significant trigger debt, refactor risk' : org.apexTriggers === 0 ? ' — no trigger debt' : ' — some triggers'));
  lines.push('  LWC components:  ' + org.lwcComponents + (org.lwcComponents === 0 ? ' — no LWC yet, greenfield frontend' : ' — existing LWC to integrate with'));
  lines.push('  Aura components: ' + org.auraComponents + (org.auraComponents > 0 ? ' — legacy Aura present, migration effort needed for any new LWC' : ''));
  lines.push('  Active flows:    ' + org.flows + (org.flows > 20 ? ' — heavy automation footprint, integration complexity is HIGH' : org.flows > 5 ? ' — moderate automation' : ' — light automation'));

  if (org.sfLicenses.length > 0) {
    const active = org.sfLicenses.filter(l => l.used > 0);
    if (active.length > 0) {
      lines.push('');
      lines.push('LICENCES ALREADY IN USE (set toolMonthlyCost to 0 for tools covered by these):');
      active.slice(0, 8).forEach(l => {
        lines.push('  ' + l.name + ': ' + l.used + '/' + l.total + ' seats used');
      });
    }
  }

  lines.push('');
  lines.push('MANDATORY GROUNDING RULES — every estimate MUST follow these:');
  lines.push('1. TRADITIONAL effort: do NOT use generic industry averages. Scale task durations to reflect THIS org.');
  lines.push('   - ' + org.apexClasses + ' Apex classes = the developer must understand existing patterns before writing new code. Add ramp-up and regression testing time.');
  lines.push('   - ' + org.flows + ' existing flows = new automation must integrate with or avoid conflicting with these. Add flow analysis time to Requirements.');
  if (org.auraComponents > 0) {
    lines.push('   - ' + org.auraComponents + ' Aura components = any LWC work must account for coexistence or migration of legacy Aura. Add design time.');
  }
  lines.push('2. AI effort reduction: AI tools are MORE effective in an established codebase (Copilot has more context, Einstein Code understands existing patterns). Reflect higher AI productivity for Apex tasks specifically.');
  lines.push('3. TOOL RECOMMENDATIONS: prefer tools that work natively with the existing Salesforce stack. If a recommended tool is covered by an existing licence, set toolMonthlyCost to 0 and note "Already licensed" in rationale.');
  lines.push('4. RISKS: always include at least one risk specific to the org\'s existing footprint (e.g. regression against existing ' + org.apexClasses + ' Apex classes, or flow conflicts).');
  lines.push('5. ARCHITECTURE NOTES: reference specific org characteristics — e.g. mention the Aura-to-LWC migration consideration, or the flow automation footprint.');
  lines.push('=== END ORG CONTEXT ===');

  return lines.join('\n');
}

function buildSystemPrompt(req: EstimatorRequest): string {
  let pctx: string;
  if (req.platform === 'salesforce') {
    pctx = 'Salesforce (Apex, LWC, Flow, Agentforce, Einstein, Copado, MuleSoft)';
  } else if (req.platform === 'generic') {
    pctx = 'Generic IT cloud stack (AWS/Azure, React/Node, Python, GitHub Actions)';
  } else {
    pctx = 'Salesforce plus custom development (Apex, LWC, APIs, microservices)';
  }

  const parts: string[] = [];

  parts.push('You are an expert AI SDLC estimator specialising in ' + pctx + '.');

  if (req.orgSnapshot) {
    parts.push(buildOrgGrounding(req.orgSnapshot));
  }

  parts.push(
    'Produce EXACTLY 3 delivery options for the SAME use case: ' +
    'option 1 optimised for LOWEST COST, option 2 for FASTEST TIME-TO-MARKET, option 3 BALANCED (best overall value). ' +
    'Set each optionLabel to "Lowest cost", "Fastest time-to-market", "Balanced" respectively, and give a one-line tradeoff and a short optimizedFor for each.'
  );
  parts.push(
    'CRITICAL numeric ordering: ' +
    '"Lowest cost" MUST have the LOWEST totalAiCost and monthlyRunCost. ' +
    '"Fastest time-to-market" MUST have the LOWEST deployTimeWeeks and totalAiDays. ' +
    '"Balanced" MUST fall strictly BETWEEN the other two on both cost and time. ' +
    'Re-check these inequalities before responding.'
  );
  parts.push('For each option, break the work into max 6 SDLC tasks and recommend the single best AI tool per task.');
  parts.push('Respond with ONLY a valid JSON object matching this schema exactly. No markdown, no text outside JSON.');
  parts.push('Schema: {"options":[OPTION, OPTION, OPTION]} where each OPTION matches: ' + OPTION_SCHEMA);
  parts.push('Keep every string value short (under 80 chars). Per option: max 4 toolchain layers, 2 risks, 2 notes.');
  parts.push('Estimates realistic for a ' + req.fte + ' person team at $' + req.rate + ' per year blended rate. Real tools only.');

  return parts.join('\n\n');
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  let body: EstimatorRequest;
  try {
    body = await request.json() as EstimatorRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.usecase?.trim()) {
    return NextResponse.json({ error: 'usecase is required' }, { status: 400 });
  }

  const sys = buildSystemPrompt(body);
  const userMsg =
    'Use case: ' + body.usecase +
    '. Team: ' + body.fte + ' FTE at $' + body.rate + '/yr.' +
    ' Platform: ' + body.platform + '.' +
    ' Return JSON only.';

  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 16000,
      system: sys,
      messages: [{ role: 'user', content: userMsg }],
    });

    let raw = '';
    for (const block of msg.content) {
      if (block.type === 'text') raw += block.text;
    }

    const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    let result: EstimatorResponse;
    try {
      result = JSON.parse(clean) as EstimatorResponse;
    } catch {
      const lastClose = Math.max(clean.lastIndexOf('}'), clean.lastIndexOf(']'));
      if (lastClose > 0) {
        result = JSON.parse(clean.substring(0, lastClose + 1)) as EstimatorResponse;
      } else {
        throw new Error('Could not parse AI response as JSON');
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
