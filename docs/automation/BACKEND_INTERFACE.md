# Backend Interface (Current Repo)

Purpose: this repository currently ships a Vite React app to Azure, with no
in-repo backend API package or server route layer.

For a grouped index of backend, dataset, validation, and audit **surfaces**
(with explicit “not present” paths such as `apps/api/`), see
`docs/automation/BACKEND_AND_DATA_FOUNDATIONS.md` (Linear **NEW-32**).

## Scope

The Linear issue references `/apps/api/`, but this repository currently has no
`apps/api/` directory. Scope is mapped to the real repo surfaces that define
runtime behavior, deployment, and service boundaries:

- `src/App.tsx` browser UI and interaction workflow entry point
- `src/data/*` and `src/exports/interaction_pairs.json` static app data read by
  the browser bundle
- `src/services/geminiService.ts` client-side explanatory text helper
- `vite.config.ts` build-time configuration and environment injection
- `wrangler.jsonc` Cloudflare assets/preview configuration
- `.github/workflows/azure-deploy.yml` Azure App Service deployment workflow
- `package.json` scripts for local dev, preview, build, deploy, and verification
- `scripts/*` local automation and data/workflow tooling
- live Azure target: `https://entheogen.azurewebsites.net`

Out of scope for this issue:

- new backend routes
- new API handlers
- new database writes
- new deployment behavior
- schema or dataset changes

## Current Runtime Shape

The deployed application is a static web app artifact built by Vite and deployed
to Azure App Service. The repo does not currently define Express, Fastify,
Next.js API routes, Azure Functions, Cloudflare Worker request handlers, or an
`apps/api/` package.

Supabase (and Metabase on top of it) is for analytics and graphs, not the live
runtime data plane for this SPA—the browser uses bundled static artifacts from
this repo’s build, not Supabase at request time.

Current application flow:

```text
browser request
  -> Azure App Service static artifact
  -> Vite/React app shell
  -> static dataset imports under src/data/ and src/exports/
  -> client-side interaction rendering in src/App.tsx
```

The production endpoint is the app origin:

- `GET https://entheogen.azurewebsites.net/`

Read-only checks on 2026-05-02 returned `200 text/html` for `/`, `/api/`,
`/apps/api/`, and `/health`, with matching response hashes. That behavior is
consistent with the deployed SPA fallback serving the app shell; it is not
evidence of separate backend API routes.

## Existing Endpoints And Routes

Documented runtime endpoints:

- `/` on `https://entheogen.azurewebsites.net`: serves the deployed app shell.
- Static asset paths emitted by `npm run build`: served as part of the Vite
  artifact.
- Client-side routes or unknown paths: currently resolve to the app shell in the
  observed Azure deployment.

Not present in the repo:

- `/apps/api/`
- `/apps/api/routes/*`
- `/api/*` server handlers
- `/health` server handler
- runtime submission route
- runtime publication route

Existing automation docs already reflect two important route boundaries:

- `docs/automation/SUBMISSION_INTAKE_FLOW.md` states there is no
  `/apps/api/routes/submission.*` route.
- `AUTOMATION_README.md` and `docs/automation/AUTOMATION_AGENTS.md` state there
  is no `/apps/api/routes/publish.*` route.

## Service Boundaries

Browser/runtime surfaces:

- `src/App.tsx` coordinates UI state, selected substances, interaction lookup,
  favorites, display rendering, and calls to local helper modules.
- `src/data/interactionDataset.ts` imports
  `src/exports/interaction_pairs.json` and `src/data/interactionDatasetV2.json`.
- `src/data/drugData.ts` imports `src/data/substances_snapshot.json` and
  resolves interaction metadata for the UI.
- `src/services/geminiService.ts` currently returns deterministic explanatory
  text from local inputs; it does not define a backend endpoint.

Build/deployment surfaces:

- `vite.config.ts` configures React, Tailwind, Cloudflare plugin support, path
  aliasing, and build-time environment values.
- `.github/workflows/azure-deploy.yml` runs install, typecheck, submission-intake
  guard, interaction-data guard, build, artifact upload, and Azure Web App
  deployment.
- `wrangler.jsonc` configures Cloudflare assets behavior for preview/deploy
  support. Its comments explicitly preserve the boundary that rapid/manual
  submission intake is file-first, not a Worker API route.

Automation/local integration surfaces:

- `scripts/parseInteractionReports.ts` parses file-first submission material
  into reviewable update proposals.
- `scripts/workflow/transitionInteractionUpdateState.ts` and
  `scripts/workflow/stateMachine.ts` enforce workflow transitions locally.
- `scripts/slack/slackApi.ts` is an outbound Slack API helper for local
  automation; it is not a deployed EntheoGen backend route.
- Dataset and knowledge-base scripts read and write local repo artifacts under
  `src/`, `knowledge-base/`, and `scripts/`.

## Error handling (current)

Linear **NEW-30** / **ENT-025** alignment: there is **no** in-repo
`/packages/errors/` package and **no** shared HTTP error envelope for the
deployed app. Behavior is **surface-specific**; do not assume a single JSON error
shape across browser, CLI, Slack, and agent payloads.

**Browser (deployed SPA)**

- `src/App.tsx` holds user-visible readout failures in React state
  (`error: string | null`) and renders a single plain-language message in the
  rule-based context panel.
- Readout text comes from `src/services/geminiService.ts` (deterministic,
  local inputs only); there is no live model API or typed error code path in
  that layer today.
- `console.error` is used for diagnostics (for example readout pipeline and
  favorites JSON parse failures); those paths do **not** expose structured
  errors to end users.

**Automation, validation, integrations**

- Canonical wording for CLI validation prefixes, workflow throws, Slack
  transport vs CLI JSON, and agent payload `errors[]` lives in
  `docs/automation/AUTOMATION_AGENTS.md` (section *Error Handling Surfaces*).
- `scripts/slack/slackApi.ts` `callSlackApi` returns the parsed Slack JSON on
  HTTP 2xx and **does not** throw only because Slack set `ok: false`; callers
  that need hard failures check `.ok` (see `scripts/slack/slackPost.ts`) or map
  errors explicitly.

## Duplicate detection and conflicts (current)

Linear **NEW-17** / **ENT-012** alignment: there is **no**
`packages/agents/deduplication/` package in this repository. Duplicate and
conflict behavior is **surface-specific**, targets the **current V2 dataset
shape**, and keeps **reviewable** artifacts for humans (especially the Data
Curator). No separate indexing or storage subsystem is introduced for
deduplication beyond existing canonical JSON files and reports.

**Canonical interaction dataset (`InteractionDatasetV2`)**

- `scripts/validateInteractionsV2.ts` enforces unique `pair.key` across all
  pairs, rejects **duplicate active** rows for the same canonical pair key when
  `provenance.deprecated` is false, checks grouped validation flags for
  internal duplicates, and aligns grouped flags with `audit.validation_flags`.
- Validation flags such as `duplicate_active_pair` (see
  `src/data/interactionSchemaV2.ts`) are part of the typed contract; validator
  output surfaces them via the standard `ERROR:` / `WARN:` / `INFO:` CLI
  diagnostics.

**Knowledge-base consolidation**

- `scripts/consolidateJsonUpdates.ts` merges structured update candidates into
  canonical `interactionDatasetV2`, source manifest, citation registry, and
  related artifacts. It records **`duplicate_signals`** (for example
  `existing_pair_match`, `source_ref_deduplicated`, `citation_deduplicated`,
  `claim_deduplicated`) and **`review_conflicts`** on the consolidation report
  for curator review. Signals describe what happened; they are **not** silent
  approval of scientific merges.

**NL submission intake**

- `scripts/parseInteractionReports.ts` deduplicates extracted **source_id**
  refs when building proposals (last write per id in a `Map`), and uses
  `dedupeNonEmpty` for reviewer-note section strings. Proposal `update_id`
  values are deterministic hashes for traceability; **append-only**
  `interaction-updates.jsonl` does not replace a global dedup engine for the
  canonical dataset (validators and curator workflow gate canonical truth).

**Agent draft contracts**

- Knowledge Steward drafts (`packages/agents/knowledge_steward/`) require
  `duplicate_conflict_checks` in `output-contract.json` as **review-facing**
  structured fields. That contract supports human judgement; it does not run
  the consolidation or V2 validators by itself.

## Decision Boundaries

Automation may:

- inspect route, deployment, and script surfaces
- run read-only live endpoint checks
- update documentation to match current repo behavior
- run build, typecheck, and targeted tests
- prepare reviewable diffs that describe missing backend surfaces honestly

Humans must approve:

- any new backend package or route layer
- any server-side mutation path
- any change to Azure deployment behavior or production release timing
- any change that affects publication, dataset approval, safety interpretation,
  or clinical-facing claims
- any use of secrets or live credentials beyond the established deployment path

Prohibited in this flow:

- describing `/apps/api/` as operational when it is not present
- adding backend logic under a documentation-only issue
- treating SPA fallback responses as API route evidence
- adding submission, publication, or dataset mutation endpoints without a
  separate approved implementation issue
- exposing secrets in docs, scripts, logs, or examples

## Risk-Based Guidance

- For documentation-only backend interface updates, verify file presence,
  existing route references, and live read-only endpoint behavior.
- For frontend-only changes that affect deployed behavior, run `npm run
  typecheck` and `npm run build`; add targeted tests when existing guards cover
  the changed surface.
- For any future backend route work, require a separate issue that names the
  route, authority model, deployment target, data writes, tests, and rollback
  expectations.
- For Azure deployment changes, review `.github/workflows/azure-deploy.yml`,
  preserve the existing guard steps unless intentionally changed, and require
  human approval before production release.
- For Cloudflare/Wrangler changes, treat `wrangler.jsonc` as preview/deployment
  support unless a separate issue explicitly introduces Worker request handling.

## Acceptance Criteria (Testable Now)

- The doc states that `/apps/api/` is not a current repo surface.
- Existing deployed behavior is described as Azure App Service serving a Vite
  app artifact, not as a server API.
- Existing endpoint behavior is documented for `/` and observed SPA fallback
  paths.
- Service boundaries are mapped to concrete files, scripts, workflows, and
  artifacts.
- Automation, human approval, and prohibited actions are separated.
- No backend logic, route files, schema files, dataset files, or deployment
  behavior changes are introduced by this documentation update.

## Verification

For GitHub Actions jobs, npm scripts, and a **PR-parity** local aggregate gate
(`npm run ci:checks`), see `docs/automation/QUALITY_AND_RELIABILITY.md`
(Linear **NEW-37**).

Run:

```bash
test ! -d apps/api && echo "apps/api absent"
find . -path ./node_modules -prune -o -path ./dist -prune -o \
  \( -path '*/apps/api*' -o -path '*/routes/*' \) -print
npm run typecheck
npm run build
curl -sS -I https://entheogen.azurewebsites.net/
curl -sS -I https://entheogen.azurewebsites.net/api/
curl -sS -I https://entheogen.azurewebsites.net/apps/api/
curl -sS -I https://entheogen.azurewebsites.net/health
```

Expected outputs:

- `test ! -d apps/api` prints `apps/api absent`.
- The `find` command prints no repo route paths outside ignored
  `node_modules` and `dist`.
- `npm run typecheck` completes without TypeScript errors.
- `npm run build` completes and writes the Vite production artifact.
- The `curl -I` checks return `200` and `content-type: text/html` for the app
  origin and observed fallback paths.

Residual risks and limitations:

- Live endpoint behavior can change after a deployment; rerun the read-only
  checks before relying on this document for release work.
- `200 text/html` on fallback paths confirms app-shell serving, not backend API
  semantics.
- This document describes the current repo and Azure deployment boundary; it
  does not decide whether a future backend API should be added.
