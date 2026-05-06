# Dataset Interaction Flow (Current Repo)

Purpose: this repository reads reviewed dataset CSV snapshots, writes app
runtime snapshot artifacts, and routes canonical dataset changes through
PR-based human review.

## Scope

The Linear issue references `/packages/dataset/`, but this repository currently
has no `packages/dataset/` directory. Scope is mapped to the real repo surfaces
that read, write, validate, or review dataset artifacts:

- `scripts/datasetPaths.ts` path resolution for CSV inputs and app/canonical
  outputs
- `scripts/buildAppDatasetFromBeta.ts` CSV-to-JSON snapshot export
- `scripts/generateDatasetChangelog.ts` PR-linked canonical change summary
- `scripts/consolidateJsonUpdates.ts` canonical dataset/index/schema merge path
- root `substances.csv` and `interactions.csv` snapshot inputs when
  `npm run dataset:build-beta -- .` is used (Supabase table exports often land
  as **`substances_rows.csv`** / **`interactions_rows.csv`**; rename or copy
  into the **`substances.csv`** / **`interactions.csv`** filenames the builder
  reads, unless the script contract is intentionally extended)
- `src/data/interactionDataset.ts` and `src/data/drugData.ts` app read surfaces
- `src/exports/interaction_pairs.json` and `src/data/substances_snapshot.json`
  app snapshot artifacts
- `src/data/interactionDatasetV2.json` and `knowledge-base/indexes/*` canonical
  review surfaces

Out of scope for this issue:

- schema redesign
- canonical data edits
- new storage/indexing systems

## Dataset Files And Roles

- CSV input: `substances.csv` is read by
  `scripts/buildAppDatasetFromBeta.ts`.
- CSV input currently consumed by the repo: `interactions.csv` is read by
  `scripts/buildAppDatasetFromBeta.ts`.
- Legacy or source-workspace input: `interactions_enriched.csv` may exist
  outside this repo or in earlier export flows, but the current script contract
  does not auto-discover it.
- Operational implication: when an upstream source provides
  `interactions_enriched.csv`, treat it as reference input until a human chooses
  the handling path. A reviewed path may be an explicit copy/rename to
  `interactions.csv`, a checked script change, or a decision to leave it out of
  scope.
- App snapshot output: `src/data/substances_snapshot.json`.
- App snapshot output: `src/exports/interaction_pairs.json`.
- Canonical source artifact in this repo: `src/data/interactionDatasetV2.json`.
- Canonical supporting indexes/schemas:
  `knowledge-base/indexes/source_manifest.json`,
  `knowledge-base/indexes/source_tags.json`,
  `knowledge-base/indexes/citation_registry.json`,
  `knowledge-base/schemas/source.schema.json`,
  `knowledge-base/schemas/claim.schema.json`

This document does not make `interactions_enriched.csv` a canonical in-repo
input. It records the current boundary: the app snapshot builder consumes
`interactions.csv` and `substances.csv`; enriched interaction exports need
explicit review before they affect app snapshots or canonical source files.

## Read/Write Pathways

1. CSV input detection and path resolution
- Command: `npm run dataset:paths`
- Source: `scripts/datasetPaths.ts`
- Behavior: prints resolved `beta_csv_inputs` and `app_dataset_exports` paths.

2. Snapshot export for app runtime
- Command: `npm run dataset:build-beta <beta-data-dir>`
- Source: `scripts/buildAppDatasetFromBeta.ts`
- Reads: `<beta-data-dir>/substances.csv` and
  `<beta-data-dir>/interactions.csv` (current script contract)
- Current repo-root refresh command after approved root CSV updates:
  `npm run dataset:build-beta -- .`
- Upstream compatibility note: if only
  `<beta-data-dir>/interactions_enriched.csv` exists, resolve that mismatch
  explicitly before this command is run.
- Writes: `src/data/substances_snapshot.json` and
  `src/exports/interaction_pairs.json`

3. App runtime dataset read
- Source: `src/data/interactionDataset.ts`
- Reads: `src/exports/interaction_pairs.json` and
  `src/data/interactionDatasetV2.json`
- Source: `src/data/drugData.ts`
- Reads: `src/data/substances_snapshot.json`

4. Canonical review and merge flow (conditional)
- For changes touching canonical dataset/index/schema surfaces:
  - prepare the change on a branch or reviewable diff
  - run `npm run changelog:dataset -- --pr "<PR reference>"`
  - include the generated `knowledge-base/reports/dataset_changelog.md` in the
    review context when it is relevant
  - run `npm run json:consolidate` only when update artifacts are intentionally
    being absorbed
- Behavior: generate PR-linked review evidence and apply explicit merges through
  tracked scripts. The script output supports review; it does not approve,
  publish, deploy, or clinically validate the change.

## PR-Based Update Flow

```text
approved source input or reviewed proposal
  -> branch or reviewable diff
  -> targeted script run
  -> generated changelog/reports when canonical files are affected
  -> PR review by humans
  -> merge/deployment decision outside automation
```

Use this flow when a change affects canonical dataset/index/schema files or app
snapshot artifacts. For documentation-only changes like this one, the PR should
show that no schema or data files changed and that relevant path/changelog tests
still pass.

## Decision Boundaries

Automation may:

- resolve and print dataset paths
- transform approved CSV inputs into app snapshot JSON artifacts
- generate canonical dataset changelog drafts for PR review
- surface conflicts or merge candidates for curator review

Humans must approve:

- any PR that changes canonical dataset/index/schema files
- interpretation-level classification/evidence changes
- any handling decision when upstream uses `interactions_enriched.csv` instead
  of `interactions.csv`
- any script change that modifies CSV filename contracts or canonical merge
  behavior

Prohibited in this flow:

- silent direct edits to canonical dataset files outside reviewed workflows
- treating automation output as publication approval
- introducing new schema/storage/indexing layers in this doc-alignment issue
- silently substituting `interactions_enriched.csv` for `interactions.csv`
  without a reviewed handling decision

## Risk-Based Guidance

- For docs-only or test-surface-only changes, run targeted checks and avoid
  broad all-check pipelines.
- For app snapshot refreshes, verify input file naming first, then run focused
  snapshot commands.
- If `interactions_enriched.csv` is present but `interactions.csv` is not,
  treat this as an explicit decision point instead of silently guessing.
- For canonical surface changes, require PR-linked changelog evidence and human
  review before merge/deploy decisions.
- For CSV input refreshes after approved source changes, preserve the current
  filename contract unless a PR intentionally changes it and updates tests.

## Acceptance Criteria (Testable Now)

- Dataset interaction flow is explicit across read/write surfaces and commands.
- PR-based canonical update mechanism is documented with concrete command and
  artifact references.
- Boundaries clearly separate automation actions, human approvals, and
  prohibited actions.
- The doc states that `/packages/dataset/` is not a current repo surface and
  maps the issue to existing scripts, commands, paths, and artifacts.
- The doc distinguishes `interactions.csv` as the consumed in-repo interaction
  CSV from `interactions_enriched.csv` as reference input requiring explicit
  handling before use.
- This documentation update changes no schema files, dataset CSVs, app snapshot
  JSON artifacts, or canonical dataset/index files.

## Verification

Run:

```bash
npm run dataset:paths
npm run test:dataset-paths
npm run test:changelog
```

Expected outputs:

- `npm run dataset:paths` prints JSON including `beta_csv_inputs` and
  `app_dataset_exports`.
- `npm run test:dataset-paths` prints `dataset path helper checks passed`.
- `npm run test:changelog` prints
  `dataset changelog generation assertions passed.`

Residual risks and limitations:

- The current snapshot build script does not automatically consume
  `interactions_enriched.csv`; upstream naming mismatches still require explicit
  handling before execution.
- `npm run dataset:build-beta` is mutating by design and should be run only when
  a snapshot refresh is intentionally in scope.
- This document describes current execution behavior and review boundaries; it
  does not redefine upstream dataset ownership or naming policy.
