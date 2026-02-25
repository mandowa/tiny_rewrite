# Draft: Writing Flow — Full Learning System Expansion

## Requirements (confirmed)
- Existing product: “Writing Flow” — a lightweight English writing helper (rewrite + local spellcheck + TTS) intended to expand into a complete learning system.
- Target architecture layers requested (5 layers):
  - L1 Infrastructure: Supabase DB (12 tables), Cloudflare R2 storage, Cloudflare Workers API gateway.
  - L2 Core: AI rewrite engine enhancement, learning record system (CRUD/export), error analysis system.
  - L3 Practice modules: spelling, pronunciation (incl. waveform comparison), grammar, conversation, reading/writing extensions.
  - L4 Intelligence: data loop, adaptive difficulty, spaced repetition reminder (SM-2) + push.
  - L5 UX: progress dashboard/report, achievements, personalized home.
- Output requested: a detailed, executable implementation plan including complexity assessment, risk analysis, per-layer task breakdown (time estimates original vs AI-accelerated, dependencies, verification), parallelization plan, and milestones.

## Current System Snapshot (repo findings)
- Frontend: **vanilla JS static site** (no framework, no bundler). No routing.
- Key files:
  - `index.html` (dev) loads `config.js`, `spellcheck.js`, `app.js`.
  - `index.production.html` (prod) loads `config.production.js`, `api-proxy.js`, `app.js`.
  - `app.js` (~1100 LOC): main UI/controller/state; supports rewrite styles (email/teams/speaking), provider/model selection, SSE parsing, sequential generation, TTS via Web Speech API, spellcheck popup UI.
  - `spellcheck.js` + `dictionary.json`: local dictionary + Levenshtein suggestions.
  - `worker.js`: Cloudflare Worker API proxy (Azure/Qwen/NVIDIA streaming; Gemini non-streaming).
  - `api-proxy.js`: browser client that calls the Worker.
  - `DEPLOY.md`: Cloudflare Pages + Workers deployment guide.
  - `package.json`: minimal; indicates “static site” (no tests/build pipeline).
- Auth/User mgmt: **none currently**.
- Supabase/R2 integration: **none currently** (no config, no client usage).
- Wrangler config: **not present** (no `wrangler.toml/json` found).

## Technical Decisions (pending)
- Frontend direction: keep vanilla JS (modularize) vs migrate to TS/framework.
- Backend boundary: Supabase direct (RLS) vs all API via Worker (service role).
- MVP scope (which layers/modules ship first).
- Audio/pronunciation “waveform comparison” definition (visualization vs scoring).
- Testing strategy: add infra (recommended) vs manual-only.

## Research Findings
- Repo exploration complete (details above).
- External best-practice research for Supabase + Workers + R2 + waveform comparison: **in progress**.

## Scope Boundaries (draft)
- INCLUDE: Full plan covering all 5 layers, with a recommended phased rollout.
- EXCLUDE (unless user opts in): actual implementation work (this is planning only).

## Open Questions (blocking)
1. MVP scope: which modules are in v1 vs later?
2. Auth model: anonymous vs Supabase Auth (which providers) vs other.
3. Worker vs Supabase responsibilities: RLS-heavy vs Worker API-first.
4. “Waveform comparison” acceptance: what exactly is compared and how measured?
5. Supabase 12-table design: already defined or needs design included?
6. Test/QA: set up automated tests (which types) or manual verification only?
