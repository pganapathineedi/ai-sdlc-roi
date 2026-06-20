import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { EstimatorRequest, EstimatorResponse } from '@/lib/types';

const client = new Anthropic();

const OPTION_SCHEMA = '{"optionLabel":"Lowest cost|Fastest time-to-market|Balanced","optimizedFor":"short phrase","tradeoff":"one line","title":"string","summary":"2 sentences","complexity":"Low|Medium|High|Very High","totalManualDays":0,"totalAiDays":0,"totalManualCost":0,"totalAiCost":0,"monthlyRunCost":0,"deployTimeWeeks":0,"aiTimeSavingPct":0,"banner":"one sentence ROI","tasks":[{"phase":"Requirements|Design|Development|Testing|Deployment|Monitoring|Documentation","task":"name","description":"short","aiTool":"tool name","aiToolCategory":"Code Gen|Test Automation|Requirements|Deployment|Monitoring|Docs|LLM/Agent","manualDays":0,"aiDays":0,"toolMonthlyCost":0,"confidence":"High|Medium|Low","rationale":"short"}],"toolchain":[{"layer":"name","tool":"name","purpose":"short","monthlyCost":0,"alternatives":"short"}],"risks":["r1","r2"],"architectureNotes":["n1","n2"]}';

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
  parts.push(
    'Produce EXACTLY 3 delivery options for the SAME use case: ' +
    'option 1 optimised for LOWEST COST, option 2 for FASTEST TIME-TO-MARKET, option 3 BALANCED (best overall value). ' +
    'Set each optionLabel to "Lowest cost", "Fastest time-to-market", "Balanced" respectively, and give a one-line tradeoff and a short optimizedFor for each.'
  );
  parts.push(
    'CRITICAL numeric ordering across the 3 options (scope is identical, so the numbers MUST be internally consistent): ' +
    'the "Lowest cost" option MUST have the LOWEST totalAiCost and monthlyRunCost of the three. ' +
    'The "Fastest time-to-market" option MUST have the LOWEST deployTimeWeeks and totalAiDays, and normally the HIGHEST totalAiCost. ' +
    'The "Balanced" option MUST have a totalAiCost AND a deployTimeWeeks that both fall strictly BETWEEN the other two. ' +
    'Never let "Lowest cost" cost more than another option, and never let "Fastest time-to-market" be slower than another option. ' +
    'Re-check these inequalities before responding.'
  );

  if (req.orgContext) {
    parts.push('Salesforce org context: ' + req.orgContext + '. Use this to calibrate complexity and tool recommendations.');
  }

  parts.push('For each option, break the work into max 6 SDLC tasks and recommend the single best AI tool per task.');
  parts.push('Respond with ONLY a valid JSON object matching this schema exactly. No markdown, no text outside JSON.');
  parts.push('Schema: {"options":[OPTION, OPTION, OPTION]} where each OPTION matches: ' + OPTION_SCHEMA);
  parts.push('Keep every string value short (under 80 chars). Per option: max 4 toolchain layers, 2 risks, 2 notes.');
  parts.push('Estimates realistic for a ' + req.fte + ' person team at $' + req.rate + ' per year blended rate. Real tools only.');

  return parts.join(' ');
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
