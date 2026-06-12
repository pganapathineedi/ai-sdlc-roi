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
- **AgentforceVibes** — 'Agentforce Vibes' tab: story volume + per-story effort calculator (editable benchmarks), Flex credit cost model (defaults to 180 credits/story), live Salesforce Flex credit pricing fetch via Anthropic API web search (`web_search_20260209`), and a manual contracted-rate override. Costs in AUD.

## Modules planned (build in this order)
1. ~~Confidence Bands~~ DONE
2. **Source Footnotes** — superscript citations on each benchmark % with a references panel tab
3. **Validate with your data** — client pilot input fields that override model assumptions with real observed numbers

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
