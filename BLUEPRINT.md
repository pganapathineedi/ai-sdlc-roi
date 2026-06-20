# AI SDLC ROI Tool — Rebuild Blueprint

> **Purpose of this file.** A compact, faithful spec of the single-file app in `index.html`
> (~3,700 lines). Paste this into a Claude chat and say *"Build this as a single self-contained
> HTML artifact, following the coding rules exactly"* to regenerate a functionally-equivalent tool
> at a fraction of the upload-token cost of the raw HTML.
>
> **What this is NOT.** Markdown does not "run" in a chat — only an HTML artifact executes. And the
> regeneration is lossy: the numbers below are exact, but exact pixel layout/wording will vary.
> For a guaranteed-identical, zero-token launch, just open the hosted build:
> **https://ai-sdlc-roi.onrender.com**

---

## 1. What the tool is

An interactive, single-file HTML business-case tool that quantifies the ROI of adopting AI across
the software development lifecycle (SDLC). Salesforce-aware, fully configurable, no backend.
Pure HTML + vanilla JS + Chart.js (CDN). Currency: USD for the core roll-up (AUD in some SF sub-tabs).

**Top-nav tabs:** Executive summary · SDLC phases · Crawl/Walk/Run/Fly · Cost model ·
Investment vs savings · Current to target · Workings · Configure · Use case estimator ·
Salesforce · Sources & assumptions · Reference.

---

## 2. Tech & sandbox coding rules (CRITICAL — regenerate with these)

- Single file: HTML + CSS + JS. Only dependency = Chart.js via CDN.
- NO async/await — use `.then().catch()` Promise chains.
- NO inline HTML event handlers — use `addEventListener` in JS.
- NO template literals (backticks) — string concatenation with `+`.
- NO special Unicode in JS strings (no em-dash, ellipsis, arrows, emoji). HTML entities
  (`&mdash;`, `&#9658;`, `&times;`, etc.) are fine inside HTML strings only.
- NO `continue` in loops; NO `for...of`. Use `for` or `.forEach`.
- Use `var`, not `let`/`const`. Always `parseInt(x, 10)` with radix.
- New features = self-contained IIFE modules appended AFTER `init()`, pattern:
  `var Mod=(function(){function injectUI(){...} return {init:function(){injectUI();}};})(); Mod.init();`

---

## 3. Core data model (defaults — VERBATIM, these drive every number)

```js
var DEF_PHASES = [
  {name:'Requirements', pct:0.10, aiR:0.25, time:20, tools:'Claude / GPT-4, Agentforce'},
  {name:'Design',       pct:0.10, aiR:0.20, time:18, tools:'GitHub Copilot, Figma AI'},
  {name:'Development',  pct:0.35, aiR:0.45, time:35, tools:'GitHub Copilot, Einstein Code, Cursor'},
  {name:'Testing / QA', pct:0.20, aiR:0.40, time:30, tools:'Copado AI, SF Test AI'},
  {name:'Deployment',   pct:0.10, aiR:0.20, time:15, tools:'Copado, GitLab Duo'},
  {name:'Monitoring',   pct:0.10, aiR:0.25, time:20, tools:'Splunk AI, Einstein Analytics'},
  {name:'Docs',         pct:0.05, aiR:0.50, time:50, tools:'Notion AI, Claude'}
];
// pct = share of total effort (sum=1.0); aiR = AI effort reduction; time = % time-to-delivery cut

var DEF_MODELS = [ // Crawl/Walk/Run/Fly maturity. mult scales FTE saving; *Scale scale each cost line
  {name:'Crawl', label:'AI-assisted',  color:'#5F5E5A', bg:'#F1EFE8', mult:0.42, saasScale:0.3, sfScale:0.2, infraScale:0,   trainScale:0.5},
  {name:'Walk',  label:'AI-integrated',color:'#185FA5', bg:'#E6F1FB', mult:0.70, saasScale:0.6, sfScale:0.5, infraScale:0,   trainScale:0.8},
  {name:'Run',   label:'AI-augmented', color:'#3B6D11', bg:'#EAF3DE', mult:1.00, saasScale:1.0, sfScale:1.0, infraScale:0.5, trainScale:1.0, rec:true},
  {name:'Fly',   label:'AI-native',    color:'#3C3489', bg:'#EEEDFE', mult:1.43, saasScale:1.3, sfScale:1.5, infraScale:1.0, trainScale:1.2}
];
var LEVEL_NAMES = ['Crawl','Walk','Run','Fly'];

var DEF_SAAS = [ // active = which models [Crawl,Walk,Run,Fly] include this licence
  {name:'GitHub Copilot Business',  rate:19,  seats:10, active:[0,1,1,1]},
  {name:'GitHub Copilot Enterprise',rate:39,  seats:0,  active:[0,0,1,1]},
  {name:'Copado Robotic Testing',   rate:150, seats:2,  active:[0,1,1,1]},
  {name:'Mabl / Testim AI',         rate:200, seats:0,  active:[0,0,1,1]},
  {name:'GitLab Duo Pro',           rate:19,  seats:0,  active:[0,0,1,1]},
  {name:'Notion AI',                rate:20,  seats:5,  active:[1,1,1,1]},
  {name:'Splunk AI',                rate:300, seats:0,  active:[0,0,1,1]}
];
var DEF_SF = [ // Salesforce add-ons; monthly = units/mo; unit = price per unit
  {name:'Agentforce',             model:'per action (Flex)', unit:0.10,  monthly:500,  note:'20 Flex credits/action at US$500/100k'},
  {name:'Einstein Copilot seats', model:'per seat/mo',       unit:50,    monthly:5,    note:'5 power-user seats'},
  {name:'Einstein Code',          model:'per seat/mo',       unit:25,    monthly:10,   note:'All developers'},
  {name:'Data Cloud credits',     model:'per credit',        unit:0.012, monthly:5000, note:'~5k credits/mo'}
];
var DEF_TOKENS = [ // tier picks LLM price column; tpd = tasks/day; tIn/tOut = tokens per task
  {phase:'Requirements', task:'User story generation',    tier:'primary', tIn:2000, tOut:1500, tpd:3},
  {phase:'Design',       task:'Architecture suggestion',  tier:'primary', tIn:3000, tOut:2000, tpd:2},
  {phase:'Development',  task:'Code generation',          tier:'primary', tIn:1500, tOut:2000, tpd:25},
  {phase:'Testing / QA', task:'Test case generation',     tier:'mid',     tIn:2000, tOut:2500, tpd:10},
  {phase:'Deployment',   task:'Release notes',            tier:'cheap',   tIn:1000, tOut:800,  tpd:2},
  {phase:'Monitoring',   task:'Alert triage summary',     tier:'mid',     tIn:1500, tOut:1000, tpd:4},
  {phase:'Docs',         task:'Documentation generation', tier:'cheap',   tIn:2000, tOut:3000, tpd:3}
];
var DEF_TRAINING = [
  {name:'Prompt engineering workshop',   type:'One-off',  unitCost:500, perPerson:true,  annual:0},
  {name:'Salesforce Trailhead AI certs', type:'One-off',  unitCost:200, perPerson:true,  annual:0},
  {name:'AI Champion program',           type:'Recurring',unitCost:0,   perPerson:false, annual:5000},
  {name:'Ongoing micro-learning',        type:'Recurring',unitCost:100, perPerson:true,  annual:100}
];
var LLM_PRICES = { // US$ per 1M tokens. p=primary, m=mid, c=cheap; In/Out
  sonnet:  {pIn:3,    pOut:15,   mIn:1,    mOut:5,    cIn:0.15, cOut:0.60},
  gpt4o:   {pIn:2.50, pOut:10,   mIn:0.15, mOut:0.60, cIn:0.15, cOut:0.60},
  haiku:   {pIn:1,    pOut:5,    mIn:1,    mOut:5,    cIn:0.15, cOut:0.60},
  gpt4mini:{pIn:0.15, pOut:0.60, mIn:0.15, mOut:0.60, cIn:0.15, cOut:0.60},
  opus:    {pIn:5,    pOut:25,   mIn:3,    mOut:15,   cIn:1,    cOut:5}
};
var DEF_TEAM = {fte:10, rate:120000, adopt:70, overhead:25, level:2}; // level 2 = Run
```

**Sliders (`getP()`):** `fte` (team size), `rate` (loaded $/FTE/yr), `adopt` (0-1), `overhead`
(0-1 ramp discount), `level` (0-3 maturity index). Selects: `llm-model`, `gpu-opt`, `vdb-opt`,
`mlops-opt` (monthly $ infra figures).

---

## 4. Core formulas (VERBATIM)

```js
function calcSaving(p, i){ // FTE saved at model i
  var t=0; PHASES.forEach(function(ph){ t += ph.pct*p.fte*ph.aiR*p.adopt*(1-p.overhead); });
  return t * MODELS_DEF[i].mult;
}
function tokAnn(p){ // annual API/token cost; 220 working days; only adopted FTE generate tasks
  var pr=LLM_PRICES[llmModelValue], days=220, tot=0;
  TOKEN_PHASES.forEach(function(tp){
    var rIn,rOut; if(tp.tier==='primary'){rIn=pr.pIn;rOut=pr.pOut;}
    else if(tp.tier==='mid'){rIn=pr.mIn;rOut=pr.mOut;} else {rIn=pr.cIn;rOut=pr.cOut;}
    tot += (tp.tIn/1e6*rIn + tp.tOut/1e6*rOut) * tp.tpd * Math.round(p.fte*p.adopt) * days;
  });
  return Math.round(tot * MODELS_DEF[p.level].mult);
}
function saasAnn(p){ var t=0; SAAS.forEach(function(s){ if(s.active[p.level]) t+=s.rate*s.seats*12; });
  return Math.round(t * MODELS_DEF[p.level].saasScale); }
function sfAnn(p){ var t=0; SF_ADDONS.forEach(function(a){ t+=a.unit*a.monthly*12; });
  return Math.round(t * MODELS_DEF[p.level].sfScale); }
function infraAnn(p){ return Math.round((gpu+vdb+mlops)*12 * MODELS_DEF[p.level].infraScale); }
function trainCosts(p){ var oo=0,an=0; TRAINING.forEach(function(t){ var u=t.perPerson?p.fte:1;
  if(t.type==='One-off') oo+=t.unitCost*u; an+=t.annual*(t.perPerson?p.fte:1); });
  return {oo:Math.round(oo*scale), an:Math.round(an*scale)}; } // scale = trainScale
function totalCost(p){ return tokAnn(p)+saasAnn(p)+sfAnn(p)+infraAnn(p)+trainCosts(p).an; }

// Headline (Executive summary):
gross  = calcSaving(p, p.level) * p.rate;        // gross annual saving ($)
cost   = totalCost(p);                            // all-in annual AI cost ($)
net    = gross - cost;                            // net annual benefit ($)
payback= net>0 ? (trainCosts(p).oo / net) * 12 : null; // months to recover one-off
avgEff = sum(ph.pct * ph.aiR);                    // avg effort reduction across phases
// 3-yr net for model i: calcSaving*rate*3 - totalCost*3 - trainCosts.oo
// ROI multiple = gross / cost
```

**Formatters:** `fk(n)` -> `$Xk/$X.XM/$X.XB`; `fm(n)` -> `$X,XXX`; `pbFmt(m)` -> `~N mo` / `>36 mo` / `No payback`.
**Flow:** mutate any `PHASES/MODELS_DEF/SAAS/SF_ADDONS/TOKEN_PHASES/TRAINING` then call `recalc()`.
Charts: `phaseChart`, `roiChart` (set to null before recalc to force rebuild).

---

## 5. Module catalog (each is an appended IIFE; core app built first)

**Core app** — hero header, top-nav, 6 sliders, `recalc()` engine, all base tabs, Configure UI
(edit every data array + reset buttons), Chart.js phase bar chart + ROI line chart.

1. **Confidence Bands** — low/mid/high scenario toggle in Workings (scales aiR/adopt).
2. **Role-based FTE breakdown** — splits FTE saving by role.
3. **Source Footnotes** — superseded by Provenance (#13).
4. **Scale Presets + Adoption Ramp** — team-size presets + adoption ramp curve.
5. **Validate with your data** — editable assumptions; flags `input`-tier values.
6. **Multi-year TCO + payback** — 3-yr cumulative cost/benefit + payback.
7. **Use-case prioritization matrix** — impact vs effort 2x2.
8. **Readiness to maturity quiz** — questionnaire -> recommended Crawl/Walk/Run/Fly.
9. **AI tool catalog** — reference list of AI/SDLC tools.
10. **Help text & glossary** — inline help.
11. **Version stamp** — fixed badge `AI SDLC ROI vX.Y - DATE - Claude.ai|Web`. Bump every deploy.
12. **Agentforce Vibes** (Salesforce sub-tab) — per-story effort calc (editable benchmarks ~22h
    trad vs 15.5h Vibes), Flex-credit cost model (~180 credits/story), live Flex price fetch via
    Anthropic web search, manual rate override. AUD.
13. **Salesforce sub-tabs** — single 'Salesforce' top tab with inner sub-nav: Add-on licences
    (SF_ADDONS table, feeds USD roll-up) · Agentforce Vibes · Data Cloud.
14. **Data Cloud** (Salesforce sub-tab) — metered credit consumption + storage, A$/credit & A$/GB,
    live list-price fetch + override. Standalone AUD; does NOT feed USD roll-up (avoids double count).
15. **Provenance (Sources & assumptions)** — registry `P[]` of every number tagged `live`
    (vendor price, web-refreshable) / `bench` (cited study) / `input` (your assumption). Grouped
    tables, tier badges, source links, tier filter, "Refresh live prices from web" button that
    re-fetches `live` prices and writes back into SAAS/SF_ADDONS/LLM_PRICES then `recalc()`s.
16. **Reference (tools + glossary)** — AI tool reference + glossary tab.
17. **Snapshot** — "Print / Save as PDF" button on Executive summary. Builds a hidden
    `#snapshot-sheet`, `@media print` shows only it, calls `window.print()`. Synthesised one-pager:
    Executive read (computed narrative) + 1·Inputs · 2·Modelling (phase table + cost breakdown) ·
    3·Outcomes · 4·Net total + Crawl/Walk/Run/Fly comparison. All sentences derived from live figures.

---

## 6. Use-case estimator (API call)

Calls Anthropic API from browser. Model `claude-sonnet-4-6`, max_tokens 8000, returns structured
JSON (phases, effort, tools, savings). Dual path: inside Claude.ai artifact `window.claude.complete`
is free (no key); on the web build the user pastes an API key (stored in `sessionStorage`).
JSON parse has `lastIndexOf` truncation-recovery fallback.

---

## 7. Regeneration prompt (paste after this file)

> "Build this as a single self-contained `index.html` artifact — HTML + CSS + vanilla JS + Chart.js
> from CDN. Follow every sandbox coding rule in section 2 exactly (no async/await, no template
> literals, no inline handlers, `var` only). Use the verbatim data in section 3 and formulas in
> section 4 so the numbers match. Implement the core app first, then each module in section 5 as an
> appended IIFE. Default team = `DEF_TEAM`. Make it look like a clean, professional business-case tool."
