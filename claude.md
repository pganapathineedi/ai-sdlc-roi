# CLAUDE.md — AI SDLC ROI Tool

## Project overview
This is a single-file interactive HTML business case tool that quantifies the ROI of AI adoption across the software development lifecycle (SDLC). It is Salesforce-aware and fully configurable.

## Repo structure
```
ai-sdlc-roi/
  ├── index.html   ← entire app (HTML + CSS + JS, single file)
  ├── CLAUDE.md    ← this file
  └── README.md    ← public-facing description
```

## Tech stack
- Pure HTML / vanilla JS — no build step, no framework, no dependencies except Chart.js (CDN)
- Hosted as a static site on Render (auto-deploys on push to main)
- GitHub repo: https://github.com/pganapathineedi/ai-sdlc-roi

## Deploy process
To deploy any change:
```bash
git add index.html
git commit -m "your message"
git push
```
Render auto-deploys within 60 seconds. Live URL: https://ai-sdlc-roi.onrender.com

## Architecture — module pattern
New features are added as self-contained IIFE modules at the bottom of the script block, AFTER the `init()` call. Each module follows this pattern:

```javascript
// MODULE: Module Name
// Depends on: [list globals it uses]
// Adds: [what it injects into the UI]
var ModuleName = (function() {
  function injectUI() { ... }
  return { init: function() { injectUI(); } };
})();
ModuleName.init();
```

## Existing modules
- **Core app** — tabs, sliders, recalc engine, cost model, config UI
- **ConfidenceBands** — low/mid/high scenario toggle in Workings tab (injected above slider section)
- **Salesforce tab** — single top-nav 'Salesforce' tab consolidating all SF-specific components, with an inner sub-nav (`.subnav` / `.sfpanel`, switched by the **SalesforceTab** module). Three sub-tabs:
  - *Add-on licences* — relocated SF add-on cost table (`sf-tbody`, `sf-month`, `sf-year`); still populated by the core `recalc()` from `SF_ADDONS` and feeds the Cost-model roll-up. Editing remains in the Configure tab.
  - *Agentforce Vibes* — the **AgentforceVibes** module (injects into `vibes-root`): per-story effort calculator (editable benchmarks), Flex credit cost model (defaults to 180 credits/story), live Flex credit pricing fetch via Anthropic API web search (`web_search_20260209`), manual contracted-rate override. AUD.
  - *Data Cloud* — the **DataCloud** module (injects into `dc-root`): monthly credit consumption by metered type (ingestion/processing, queries & calculated insights, segmentation, activations, identity resolution) + data storage GB/mo, contracted A$/credit & A$/GB rates, live Data Cloud list-price fetch + manual override, annual-cost metrics. Standalone AUD — does NOT feed the USD roll-up (avoids double-counting the `SF_ADDONS` Data Cloud line).
- **Provenance** — 'Sources & assumptions' tab (injects into `sources-root`). Catalogues every number in the tool in a registry `P[]`, each tagged with a tier: `live` (published vendor price — real source URL, web-refreshable), `bench` (industry study — cited, not daily-live), or `input` (your org assumption — no external source, meant to be edited). Renders grouped-by-category tables with tier badges, publisher links + as-of dates, a rationale column, and a tier filter. A **Refresh live prices from web** button (Anthropic web search on the web build; knowledge-based inside Claude.ai) re-fetches current prices + source URLs for the `live` tier and **applies them back into `SAAS`/`SF_ADDONS`/`LLM_PRICES`** then `recalc()`s. This effectively delivers roadmap modules 2 (Source Footnotes) and 3 (Validate with your data).

## Modules planned (build in this order)
1. ~~Confidence Bands~~ DONE
2. ~~Source Footnotes~~ DONE (delivered as the **Provenance** / Sources & assumptions tab)
3. ~~Validate with your data~~ DONE (numbers are editable everywhere; provenance flags `input`-tier assumptions to override)

## Key globals (used across modules)
- `PHASES` — live array of SDLC phase objects `{name, pct, aiR, time, tools}`
- `MODELS_DEF` — Crawl/Walk/Run/Fly model definitions
- `SAAS`, `SF_ADDONS`, `TOKEN_PHASES`, `TRAINING` — cost model arrays
- `recalc()` — call this after mutating any of the above to refresh all tabs
- `phaseChart`, `roiChart` — Chart.js instances (set to null before recalc to force rebuild)
- `getP()` — returns current slider params `{fte, rate, adopt, overhead, level}`
- `fk(n)` — formats number as `$Xk`
- `fm(n)` — formats number as `$X,XXX`

## Coding rules (important — sandbox constraints)
The artifact renders in a sandboxed iframe. These rules prevent syntax errors:
- NO async/await — use `.then().catch()` Promise chains only
- NO inline event handlers in HTML (`onclick=`, `oninput=` etc.) — use `addEventListener` in JS
- NO template literals (backticks) — use string concatenation with `+`
- NO special Unicode characters in JS strings (no em-dash, ellipsis, arrows, emoji)
- NO `continue` statements inside loops
- Use `var` not `let`/`const`
- Always use `parseInt(x, 10)` with explicit radix
- HTML entities (`&mdash;`, `&#9658;` etc.) are fine in HTML strings, never in JS strings
- Use `for` loops or `forEach` — avoid `for...of`

## API calls (use case estimator)
The use case estimator calls the Anthropic API directly from the browser:
- Model: `claude-sonnet-4-6`
- Max tokens: 8000
- Returns structured JSON — see schema in `runEstimator()` function
- JSON parse has a fallback via `lastIndexOf` truncation recovery

## Commit message conventions
```
Module N: Short description     ← new feature module
Fix: Short description          ← bug fix
Config: Short description       ← data/assumption change
Refactor: Short description     ← structural change
```

## When I say "deploy [message]"
1. Write the provided content to `index.html`
2. Run `git add index.html`
3. Run `git commit -m "[message]"`
4. Run `git push`
5. Confirm push was successful
