# Automation Workflow Notes

This repo uses automation to prepare reviewable changes; humans keep authority
over safety interpretation, publication, and high-impact dataset decisions.

## Scope

Automation may work on concrete repo surfaces:

- app code in `src/`
- source/index/schema artifacts in `knowledge-base/`
- runtime snapshot artifacts in `src/data/` and `src/exports/`
- repeatable commands in `scripts/` and `package.json`
- reviewer-facing docs in `README.md`, `docs/`, and `.github/`

If a system, path, or external workspace is not present in this repository, do
not treat it as an operational dependency.

## Automation May Do

- Open scoped branches and PRs with reviewable diffs.
- Run local verification commands such as `npm run typecheck`,
  `npm run validate:interactions:v2`, `npm run kb:validate`, and targeted
  `tsx scripts/...` checks.
- Generate candidate claims, provisional interaction updates, reports, and
  changelog-style summaries for reviewer approval.
- Record residual risks when evidence is sparse, generated artifacts were not
  rebuilt, or a command could not be run.
- Use the rapid/manual submission path documented in
  `docs/automation/SUBMISSION_HOW_TO.md` when Steve or Linear delegates a
  specific urgent interaction correction.

## Humans Must Approve

- Publication, release notes, and deployment interpretation.
- Safety classifications, evidence upgrades, and claims of clinical relevance.
- Promotion of pending claims into reviewed/rejected state.
- Any changelog entry that represents source-surface changes or reviewer
  context.

## Prohibited

- Do not commit secrets, private tokens, local credentials, or personal machine
  paths.
- Do not use AI synthesis as sole authority for risk grading or evidence
  upgrades.
- Do not bypass executable workflow-state or validation checks. Direct bypasses
  are defects to fix in code, not exceptions to document away.
- Do not describe absent infrastructure as active repo behavior.

## Source and Export Boundaries

- Source surfaces: `knowledge-base/sources/`, `knowledge-base/extracted/`,
  `knowledge-base/indexes/`, `knowledge-base/schemas/`, and the scripts that
  validate or transform them.
- App export/runtime surfaces: `src/data/interactionDatasetV2.json`,
  `src/data/substances_snapshot.json`, `src/exports/interaction_pairs.json`,
  and adapters such as `src/data/uiInteractions.ts`.

Changelog or report generation should name which surface changed. A source
claim update and an app snapshot rebuild are related, but they are not the same
review event.

## Acceptance Criteria

A change is ready for review when:

- The diff is scoped to the requested surfaces.
- Generated or local-only drift is either committed intentionally or removed.
- Relevant verification commands pass, or the PR summary explains exactly what
  was not run and why.
- Safety/evidence changes include traceability metadata or reviewer notes.
- Remaining limitations are explicit enough for a reviewer to decide what to do
  next.

## Verification Commands

Use the narrowest commands that cover the change:

```bash
npm run test:submission-intake
npm run typecheck
npm run validate:interactions:v2
npm run kb:validate
npm run test:ui-adapter
```

## Output Expectations

Automation output should be PR-reviewable: changed files, commands run, command
results, and residual risks. It should not imply autonomous approval, release,
or clinical authority.

## Known Limitations

- Some source evidence is sparse or provisional.
- AI-generated research synthesis can help discovery, but not authority.
- App snapshots may lag source-surface updates until the relevant build or
  migration script is run.
