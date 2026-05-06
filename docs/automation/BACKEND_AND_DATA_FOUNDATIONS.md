# Backend and data foundations (current)

Purpose: single **repo-reality** map for Linear **NEW-32** (group), tying together
completed child work (**NEW-9** backend interface, **NEW-10** dataset flow,
**NEW-11** validation, **NEW-12** audit) without inventing architecture. This
file does not add runtime behavior.

## What is not in this repository

These Linear/GitHub paths are **out of scope** as packages or servers today:

| Referenced path | Present? | Actual surfaces |
| --- | --- | --- |
| `apps/api/` | No | Static Azure-hosted Vite app; see `docs/automation/BACKEND_INTERFACE.md`. |
| `packages/dataset/` | No | `docs/automation/DATASET_INTERACTION_FLOW.md`, `scripts/datasetPaths.ts`, `scripts/buildAppDatasetFromBeta.ts`, canonical JSON under `src/data/` and `knowledge-base/`. |
| `packages/validation/` | No | `scripts/validateInteractionsV2.ts`, `scripts/validateKnowledgeBase.ts`, `npm test`; see `docs/schema.md` (*Validator CLI diagnostics*). |
| `packages/audit/` | No | Dataset **pair** `audit` metadata in `src/data/interactionSchemaV2.ts` / `interactionDatasetV2.json`; **workflow** audit events from `scripts/workflow/transitionInteractionUpdateState.ts` (structured JSON to stdout) and `transition_history` on proposals in `src/curation/interaction-updates.jsonl`. |

## Backend and deployment (pointer)

- **Authoritative doc:** `docs/automation/BACKEND_INTERFACE.md` (runtime shape,
  Azure, absence of server API routes, service boundaries).
- **Quality / CI commands:** `docs/automation/QUALITY_AND_RELIABILITY.md`.
- **Intake / Linear / GitHub control plane (no integration packages):**
  `docs/automation/INTAKE_AND_INTEGRATION.md` (Linear **NEW-33**).

## Dataset read/write (pointer)

- **Authoritative doc:** `docs/automation/DATASET_INTERACTION_FLOW.md` (CSV →
  snapshot JSON, canonical V2, PR/changelog path, consolidation).
- **Schema contract summary:** `docs/schema.md`.
- **Supabase → repo CSV names:** learned preference in `AGENTS.md` — table
  exports often arrive as `interactions_rows.csv` / `substances_rows.csv`;
  `dataset:build-beta` expects `interactions.csv` / `substances.csv` in the
  chosen data directory (repo root when using `-- .`).
- **Live DB ↔ workspace CSV + Metabase model bundle:** `docs/automation/SUPABASE_PHASE1_CSV_PIPELINE.md` and `npm run supabase:phase1-csv-pipeline`.

## Validation behavior (pointer)

- **Interaction V2 gate:** `npm run test:interactions:validate` →
  `scripts/validateInteractionsV2.ts` (`ERROR:` / `WARN:` / `INFO:` lines,
  non-zero exit on errors).
- **Knowledge-base gate:** `npm run test:kb:validate` →
  `scripts/validateKnowledgeBase.ts`.
- **Default npm test:** runs both validators (`package.json` `test:validators`).
- **Policy:** `AGENTS.md` (*Verification*) — no ceremony-only checks.

## Audit logging and traceability (pointer)

**Canonical dataset (V2 pairs)**

- Each pair carries typed **`audit`** metadata per `interactionSchemaV2.ts`
  (for example validation flags alignment with grouped flags). Validators
  enforce consistency; this is not a separate log service.

**Interaction update proposals (file-first workflow)**

- `scripts/workflow/stateMachine.ts` appends **`transition_history`** entries
  when transitions apply.
- `scripts/workflow/transitionInteractionUpdateState.ts` constructs a
  **`WorkflowTransitionAuditEvent`** and prints `Audit event: …` as JSON for
  operator/script capture (not a centralized audit database in-repo).
- `scripts/workflow/interactionUpdateWorkflow.ts` normalizes
  `transition_history` on merge paths.

**Automation target fields**

- `docs/automation/AUTOMATION_AGENTS.md` (*Audit Compatibility*) lists
  recommended fields (`item_id`, `actor`, `timestamp`, etc.) for future
  components; workflow transitions today guarantee `actor`, timestamp (`at`),
  and optional `note` per that section.

## Observable verification

```bash
npm run typecheck
npm test
npm run test:interactions:validate
npm run test:kb:validate
```

For PR parity and build, see `docs/automation/QUALITY_AND_RELIABILITY.md`.

## Residual risk

- Live Azure and Supabase behavior can drift; re-run read-only checks in
  `BACKEND_INTERFACE.md` before release-critical decisions.
- Audit JSON on stdout is only as durable as the calling environment captures
  it; there is no mandated central log store in this repo.
