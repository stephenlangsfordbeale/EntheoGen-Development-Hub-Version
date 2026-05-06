# Submission To Review Workflow (Current Repo)

Purpose: this repository currently uses Linear as the preferred workflow
control plane, Codex for scoped implementation and verification, GitHub for
reviewable change history, humans for approval, and Azure for approved
deployment.

Grouped index (absent `packages/integrations/*`, submission route myths):
`docs/automation/INTAKE_AND_INTEGRATION.md` (Linear **NEW-33**).

Canonical tone and submission product language:
[Tone and direction guidance](https://linear.app/new-psychonaut/document/tone-and-direction-guidance-51ab8ce0ad71),
[Submission intake how-to](https://linear.app/new-psychonaut/document/submission-intake-how-to-e14174e53d28).

## Scope

This document is scoped to the real repo surfaces that currently define
submission, review, PR execution, and deployment boundaries:

- Linear issue state, ownership, and delegation metadata
- `scripts/workflow/stateMachine.ts` workflow transition policy
- `scripts/workflow/transitionInteractionUpdateState.ts` governed transition
  CLI and audit payload output
- `scripts/workflow/linearWorkflowAlignment.ts` workflow-to-Linear role/status
  mapping
- `scripts/parseInteractionReports.ts` parser for file-first submission intake
- `src/curation/interaction-updates.jsonl` reviewable proposal queue
- `docs/automation/SUBMISSION_INTAKE_FLOW.md`
- `docs/automation/SUBMISSION_HOW_TO.md`
- `docs/governance.md`
- `.github/workflows/ci.yml` PR and `auto-dev` verification
- `.github/workflows/azure-deploy.yml` approved Azure deployment path
- `package.json` scripts for workflow, submission, validation, typecheck, and
  build verification

Out of scope for this issue:

- new workflow states
- new backend routes
- new dataset/schema changes
- new deployment behavior
- changing Linear, GitHub, Azure, Codex, or Cursor permissions

## Operating Model

Use this model for consequential submission-to-review work:

```text
Linear issue or explicit user-scoped task
  -> Codex implementation, parsing, or verification
  -> GitHub branch, PR, or reviewable working-tree diff
  -> human review and approval
  -> approved merge path
  -> Azure deployment workflow or backend/workflow enforcement surface
```

Linear is the preferred control plane for work state, owner visibility,
delegation, and review readiness. A direct user instruction may override Linear
when the Linear app is unavailable, a Codex or Cursor cloud environment cannot
access the needed issue context, or urgent work must proceed before the control
plane can be synchronized. When that happens, keep the override explicit in the
work summary or PR context and update Linear when access returns.

Codex and Cursor are execution and reasoning surfaces, not approval authorities.
They may produce drafts, diffs, tests, summaries, and review packets. They do
not approve their own consequential outputs.

GitHub is the review and change-history surface. For consequential workflow,
dataset, deployment, or publication-affecting changes, prefer a branch and PR
so reviewers can inspect the diff, tests, and approval evidence before merge.

Azure is the current live deployment target. The deployment workflow runs only
through `.github/workflows/azure-deploy.yml` on `main` pushes or manual
dispatch, and it retains explicit guard steps before deployment.

## Submission Path

Current file-first submission flow:

```text
source report markdown
  -> scripts/parseInteractionReports.ts
  -> workflow-initialized proposal in src/curation/interaction-updates.jsonl
  -> scripts/workflow/transitionInteractionUpdateState.ts
  -> role-aligned review states
  -> PR/review evidence when changes become consequential
```

There is no current `/apps/api/routes/submission.*` backend route. Submission
intake is represented by parser scripts, workflow transition guards, reviewable
repo artifacts, and Linear/GitHub coordination.

For urgent Steve-directed corrections, use the rapid manual path documented in
`docs/automation/RAPID_MANUAL_INTAKE.md` and the broader operating guide in
`docs/automation/SUBMISSION_HOW_TO.md`. That path can move faster, but it does
not bypass provenance, validation, PR review, or human approval.

## Review And Role Responsibilities

Current workflow states are enforced in `scripts/workflow/stateMachine.ts`:

- `submitted`
- `structured`
- `curator_review`
- `safety_review`
- `approved`
- `published`
- `archived`
- `blocked`

Current role and state alignment is centralized in
`scripts/workflow/linearWorkflowAlignment.ts`:

| Workflow state | Linear state | Primary owner | GitHub PR expectation |
| --- | --- | --- | --- |
| `submitted` | `Todo` | Beta Coordinator / UX | `not_required` |
| `structured` | `In Progress` | Data Curator | `recommended` |
| `curator_review` | `In Progress` | Data Curator | `recommended` |
| `safety_review` | `In Review` | Ethics Advisor | `recommended` |
| `approved` | `In Review` | Product Lead | `required_for_publication` |
| `published` | `Done` | Product Lead | `already_published_or_retired` |
| `archived` | `Canceled` | Product Lead | `already_published_or_retired` |
| `blocked` | `Todo` | Technical Lead | `not_required` |

These states describe execution status and review readiness. They do not grant
dataset approval, safety approval, publication approval, or deployment approval
by themselves.

Role responsibilities:

- Product Lead owns scope, release timing, and publication approval.
- Data Curator owns evidence quality and structured record readiness.
- Ethics Advisor owns safety and ethics review gates.
- Technical Lead owns system integrity, workflow blockers, and deployment
  behavior questions.
- Beta Coordinator / UX owns early intake triage and contributor flow clarity.
- Codex may implement, inspect, parse, test, and prepare reviewable outputs
  within the issue scope.
- Cursor may assist drafting, reasoning, and transformation when outputs remain
  attributable and reviewable.

## PR-Based Execution

Use PR-based execution when a change affects:

- workflow transition behavior
- canonical dataset or schema artifacts
- publication or approval state
- production deployment behavior
- frontend behavior visible to users
- backend/API/deployment boundaries

For small docs-only changes, a reviewable working-tree diff with targeted
verification is usually sufficient until the user asks for a PR. For
consequential work, the PR should include:

- Linear issue reference or explicit user override context
- summary of changed repo surfaces
- verification commands and outputs
- approval boundaries and any residual risks
- links to generated reports or changelog artifacts when relevant

The CI workflow in `.github/workflows/ci.yml` verifies PRs to `main` and
`auto-dev`, and pushes to `auto-dev`, with typecheck, validation,
submission-intake guard, alignment suite, and build steps.

The Azure deployment workflow in `.github/workflows/azure-deploy.yml` deploys
the built `dist` artifact to `https://entheogen.azurewebsites.net` after its
guard steps pass. Deployment remains a human-governed release decision, not an
automatic approval created by Linear state or automation output.

## Decision Boundaries

Automation may:

- read Linear issues and docs when connected
- parse file-first submission reports into reviewable proposals
- apply valid workflow transitions through guarded scripts
- run local tests, typecheck, validation, and build commands
- create branches, PR descriptions, summaries, changelogs, and review packets
- note when a user override was necessary because Linear, Codex cloud, or
  Cursor cloud access could not provide the needed control-plane context

Humans must approve:

- publication decisions and `approved -> published` intent
- safety and ethics conclusions
- final dataset interpretation when evidence is uncertain or conflicting
- production deployment timing and production-impacting changes
- any new backend/API route or server-side mutation path
- any override that materially changes issue scope, authority, or release risk

Prohibited in this flow:

- treating Linear state changes as human approval
- bypassing workflow transition guards
- skipping PR review for consequential dataset, workflow, deployment, or
  publication changes
- publishing autonomously
- adding backend enforcement or deployment behavior under a documentation-only
  issue
- hiding Codex or Cursor environment limitations that required a user override

## Risk-Based Guidance

- If Linear is available and accurate, use it as the coordination source for
  issue state, owner, and review readiness.
- If Linear is unavailable or incomplete, proceed from the user's explicit
  scoped request, record the override, and sync Linear later when possible.
- If Codex or Cursor cloud environments cannot access repo, issue, secret, or
  runtime context, keep work local and make that limitation visible in the
  handoff or PR.
- If a change is docs-only, use targeted documentation and workflow checks.
- If a change affects transition policy, run workflow tests before calling it
  complete.
- If a change affects deployment or user-visible behavior, run typecheck, build,
  and the relevant targeted tests before requesting review.
- If a change affects safety, publication, or canonical data, preserve PR
  evidence and require human approval before merge or deployment.

## Acceptance Criteria (Testable Now)

- The doc states Linear is the preferred control plane and describes when an
  explicit user override is appropriate.
- The Linear -> Codex -> GitHub PR -> human approval -> Azure deployment /
  backend enforcement model is explicit.
- PR-based execution is described with concrete repo workflows and review
  expectations.
- Role responsibilities match current workflow alignment code.
- Automation, human approval, and prohibited actions are separated.
- The doc points to real repo surfaces and does not introduce backend logic,
  schema changes, data changes, or deployment changes.

## Verification

Run:

```bash
test -f docs/workflows/submission-to-review.md && echo "workflow doc present"
rg -n "Linear|Codex|GitHub|Azure|user override|PR-based" docs/workflows/submission-to-review.md
npm run test:workflow-linear-alignment
npm run test:workflow-transition-integration
npm run test:submission-intake
```

Expected outputs:

- `workflow doc present`
- `rg` finds the control-plane, override, PR, and deployment language in this
  document.
- `npm run test:workflow-linear-alignment` prints
  `workflow-linear alignment assertions passed`.
- `npm run test:workflow-transition-integration` prints
  `Interaction update workflow transition integration tests passed.`
- `npm run test:submission-intake` completes parser and workflow transition
  assertions successfully.

Residual risks and limitations:

- Linear, Codex cloud, Cursor cloud, and GitHub availability can vary; explicit
  user override remains necessary when the preferred control plane is
  temporarily incomplete or inaccessible.
- This document describes current repo behavior. Update it with
  `scripts/workflow/*`, GitHub workflows, and deployment docs when those
  surfaces change.
- Workflow state alignment supports coordination and review readiness; it does
  not replace human approval for safety, publication, production, or dataset
  interpretation.
