# Submission Intake How To

Purpose: give developers, contributors, models, and coding agents one
reference for EntheoGen submission intake without replacing the existing
agentic workflows, prompts, scripts, or approval gates.

Canonical **tone** and **submission product** boundaries in Linear:
[Tone and direction guidance](https://linear.app/new-psychonaut/document/tone-and-direction-guidance-51ab8ce0ad71),
[Submission intake how-to](https://linear.app/new-psychonaut/document/submission-intake-how-to-e14174e53d28).
This file stays the **repo-technical** companion (paths, commands, tests).

This guide points to two related paths:

- rapid manual intake for Steve-directed urgent fixes:
  `docs/automation/RAPID_MANUAL_INTAKE.md`
- standard file-first submission intake:
  `docs/automation/SUBMISSION_INTAKE_FLOW.md`

Both paths create reviewable candidate changes. Neither path grants clinical,
publication, deployment, or dataset approval by itself.

## Which Path To Use

Use rapid manual intake when:

- Steve is correcting an obvious interaction readout howler.
- Steve is filling a clear substance-pair knowledge hole.
- A Linear issue delegates a specific pair/source package to a model or agent.
- Speed matters more than waiting for the planned Knowledge Steward agent.

Use standard submission intake when:

- A markdown report should be parsed through the existing file-first workflow.
- You need `InteractionUpdateProposal` JSONL output in
  `src/curation/interaction-updates.jsonl`.
- You are exercising workflow state transitions from submitted to review states.
- You want the current parser and transition tests to define the contract.

Use neither path when:

- The task is only a UI bug with no interaction-data implication.
- The request needs schema redesign, new infrastructure, or new runtime APIs.
- The evidence is too thin to support required fields even conservatively.

## Rapid Manual Intake Path

Primary reference: `docs/automation/RAPID_MANUAL_INTAKE.md`.

Inputs may be:

- an in-house research note
- academic papers or source IDs
- a Linear issue with attached evidence
- a direct Steve request naming a substance pair

Required first response:

```text
I can satisfy the required substance and/or interaction fields from the
provided information.
```

or:

```text
There is not enough information provided to satisfy the required substance
and/or interaction fields from the provided information.
```

If sufficient, draft:

- normalized pair IDs
- proposed classification and confidence
- mechanism category and evidence tier
- source support type and evidence gaps
- practical guidance
- example UI readout preview

If insufficient, record:

- unresolved substance IDs
- missing required fields
- the smallest extra source/evidence addition needed
- whether the work should remain a research gap

## Standard Submission Intake Path

Primary reference: `docs/automation/SUBMISSION_INTAKE_FLOW.md`.

Current file path:

```text
src/curation/nl-reports/incoming/<report>.md
-> npm run reports:parse
-> src/curation/interaction-updates.jsonl
-> scripts/workflow/transitionInteractionUpdateState.ts
```

Prompt contract:

```text
src/curation/prompts/nl-report-to-jsonl.md
```

Parser and workflow verification:

```bash
npm run test:submission-intake
```

The parser-generated proposal must remain draft-only:

- `status` is `proposed`
- workflow state starts as `submitted`
- `reviewer_notes` separates `Extracted`, `Inferred`, `Uncertainty`, and
  `Draft-only`
- missing source IDs use explicit `source_gap`

## Model And Agent Instructions

Models and agents should:

- preserve the user's source material and provenance timestamp
- identify whether they are using rapid manual intake or standard submission
  intake
- use existing scripts before inventing new workflow behavior
- distinguish extracted facts from inferred suggestions
- provide an example UI readout only as a preview
- avoid claiming approval, publication, deployment, or clinical authority

Models and agents should not:

- bypass `scripts/parseInteractionReports.ts` when the task is specifically to
  test or use the standard parser path
- bypass `scripts/workflow/transitionInteractionUpdateState.ts` for governed
  workflow transitions
- create Cloudflare Worker routes, Azure behavior, GitHub Actions behavior, or
  database writes just to process a manual submission
- replace the planned Knowledge Steward agent or existing prompt contracts

## Developer Checklist

Before opening a PR:

- Decide the intake path and name it in the PR.
- Keep the diff scoped to the affected report, proposal, dataset, docs, or UI
  readout surface.
- Include the example UI readout when the change affects app behavior.
- Run the narrowest verification commands that prove the change.
- Record commands actually run and any residual evidence gaps.

For parser/report-only work:

```bash
npm run test:submission-intake
```

For interaction data changes:

```bash
npm run validate:interactions:v2
npm run test:ui-adapter
```

For app-facing changes:

```bash
npm run typecheck
npm run build
```

## Workflow And Deployment Awareness

GitHub Actions:

- CI runs `npm run test:submission-intake` so intake parser and workflow
  transition contracts are visible in pull-request checks.
- CI also runs the broader alignment suite; the explicit intake guard exists so
  failures point reviewers at the submission path quickly.

Azure:

- The Azure deployment workflow runs `npm run test:submission-intake` and
  `npm run validate:interactions:v2` before build/deploy.
- A dataset/readout PR should pass these checks before production deployment is
  expected to succeed.

Cloudflare Workers / Wrangler:

- Current Cloudflare behavior is static app assets with SPA fallback.
- There is no runtime submission API route in `wrangler.jsonc`.
- Do not add Worker-side mutation or submission routes unless a separate issue
  explicitly scopes that infrastructure change.

Linear:

- Linear may delegate a rapid manual intake issue by attaching evidence and
  asking the model to follow `docs/automation/RAPID_MANUAL_INTAKE.md`.
- Linear status remains workflow progress, not scientific or publication
  approval.

## PR Provenance

Use `.github/PULL_REQUEST_TEMPLATE.md` and fill:

- title
- provenance timestamp
- source path or Linear issue
- priority
- target pair or surface
- intake path
- preview readout or reviewer-facing summary
- verification commands actually run

The PR is the provenance record for the manual workflow. Keep it plain, small,
and reviewable.
