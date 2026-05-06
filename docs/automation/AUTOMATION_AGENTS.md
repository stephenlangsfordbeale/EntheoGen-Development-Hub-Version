# EntheoGen Automation Agents

## Core Principle

Automation supports EntheoGen. It does not control EntheoGen.

Work may come from Linear, direct user instruction, maintenance context, or
other explicit sources. Codex executes tasks. Humans approve outcomes. The
system enforces technical results, not project-management ceremony.

Terminology note: `Linear` in this document always means the Linear workflow
application (issue/state orchestration layer). It does not refer to
mathematical "linear" concepts (for example linear regression).

Linear issue states are operational signals: `Backlog`, `Todo`, `In Progress`,
`In Review`, `Done`, `Canceled`, and `Duplicate`. Automation may move work
between these states when scoped to the issue, but those transitions are not
human approval for dataset, publication, safety, or production outcomes.

## Automation Role

Automation supports workflow execution, role augmentation, and structured output
generation. It does not replace human authority, approval, or governance.

Automation outputs must be reviewable and non-destructive. Consequential system
and dataset changes should be PR-based. Automation may use Linear as workflow
context when available and operates conservatively under uncertainty, but a
missing Linear issue number is not a blocker or approval signal.

Automation may interact with approved services and tools such as Azure,
Supabase, Cloudflare/Wrangler, Slack, GitHub, Linear, Cursor, GitHub Copilot,
and other approved local or hosted tools when the interaction is scoped, uses
approved credentials or local configuration, and preserves human approval
boundaries.

Technical verification must stay separate from project-management ceremony.
It is appropriate to test code behavior, data validity, workflow transition
logic, build output, and runtime contracts. It is not appropriate to add tests,
CI checks, scripts, or guards that fail because optional process metadata is
missing or worded differently, including Linear issue numbers, PR-template
anchors, branch names, provenance fields, checklist completion, or
agent/delegate labels. Those fields may support traceability, but they must not
impede execution, review, CI, merge, or normal repository use unless Stephen
explicitly asks for enforcement.

Before adding any test, script, CI check, or package command, confirm it proves
runtime, code, data, schema, build, or executable workflow behavior. If it would
fail because a Linear reference, PR-template field, branch name, checklist item,
provenance note, issue label, agent identity, or documentation anchor is missing
or worded differently, do not add it.

For Steve-directed rapid manual submissions and standard natural-language
report parsing, use `docs/automation/SUBMISSION_HOW_TO.md`. That guide is a
reference layer only; it does not replace the Knowledge Steward output
contract, parser scripts, workflow transition guards, or PR review.

For package paths, contracts, summary surfaces (no `summarization/` package),
safety rule alignment, and verification commands, see
`docs/automation/AGENT_AND_SAFETY_OUTPUTS.md` (Linear **NEW-34**).

For backend vs static app, dataset paths, validators, and audit/trace surfaces
(with explicit non-present `packages/*` paths), see
`docs/automation/BACKEND_AND_DATA_FOUNDATIONS.md` (Linear **NEW-32**).

For intake (file-first submission), Linear/GitHub control plane, and what is
**not** an in-repo integration package, see
`docs/automation/INTAKE_AND_INTEGRATION.md` (Linear **NEW-33**).

For **canonical tone and submission framing** (Linear) versus **repo-technical**
Markdown, see `AUTOMATION_README.md` (*Documentation direction*) and the links
there (Linear **NEW-31** alignment pass).

## Output Discipline

Automation outputs must:

- Distinguish extracted facts from inferred suggestions.
- Identify missing information.
- Preserve uncertainty notes.
- Surface errors explicitly; do not fail silently.

## Audit Compatibility

Automation records should include these audit-compatible fields as a target
contract:

- `item_id`
- `actor`
- `timestamp`
- `action_context`
- `rationale`

Current workflow transition enforcement today (`scripts/workflow/stateMachine.ts`
and `scripts/workflow/transitionInteractionUpdateState.ts`) guarantees:

- `actor` (via transition context)
- `timestamp` (stored as transition `at`)
- optional `note` for transition metadata

`item_id`, `action_context`, and `rationale` are recommended audit fields for
automation outputs and should be added by the producing component where
available.

## Hard Prohibitions

Automation must not:

- Mutate production without explicit scope and approval.
- Publish autonomously.
- Modify schemas, databases, auth rules, or infrastructure unless explicitly
  scoped by a user request, issue, PR, or approved maintenance lane and kept
  reviewable.
- Treat workflow-state updates as approval decisions.
- Bypass human approval gates.
- Bypass workflow transition guards for publication-aligned state changes.
- Add technical checks that enforce project-management ceremony or optional
  traceability metadata.

## Components

### Knowledge Steward

The Knowledge Steward supports the Data Curator and Product Lead by helping
extract, normalize, compare, and summarize knowledge artifacts. It may suggest
updates, identify conflicts, and prepare structured review material, but humans
approve changes.

Current repo output surfaces for this component are draft-focused:

- `scripts/parseInteractionReports.ts` writes `InteractionUpdateProposal` lines
  to `src/curation/interaction-updates.jsonl`
- `src/curation/prompts/nl-report-to-jsonl.md` defines the proposal prompt
  contract used for proposal drafting

```json
{
  "component": "knowledge_steward",
  "item_id": "NEW-000",
  "actor": "codex",
  "timestamp": "2026-04-30T00:00:00.000Z",
  "action_context": "summarize candidate interaction evidence",
  "rationale": "prepare reviewable curator input without changing source data",
  "extracted_facts": [
    {
      "source": "placeholder-source-id",
      "fact": "Extracted fact stated by the source.",
      "confidence": "medium"
    }
  ],
  "inferred_suggestions": [
    {
      "suggestion": "Suggested review action.",
      "basis": "Why the suggestion follows from the extracted facts.",
      "confidence": "low"
    }
  ],
  "missing_information": [
    "Information needed before approval."
  ],
  "uncertainty_notes": [
    "Known ambiguity or limitation."
  ],
  "review_required_by": [
    "Data Curator",
    "Product Lead"
  ],
  "review_draft": {
    "draft_type": "interaction_update_proposal",
    "target_artifact": "src/curation/interaction-updates.jsonl",
    "status": "proposed",
    "workflow_state": "submitted",
    "proposal_fields": {
      "pair": [
        "ketamine",
        "serotonergic_opioids"
      ],
      "requested_change": {
        "classification.code": "CAUTION",
        "classification.confidence": "medium"
      },
      "reviewer_notes": "Extracted: <facts>. Inferred: <candidate interpretation>. Uncertainty: <limitations>. Draft-only: humans must approve interpretation and downstream use."
    }
  },
  "errors": []
}
```

`reviewer_notes` in dataset-facing proposals should keep sectioned separation:
`Extracted`, `Inferred`, `Uncertainty`, and `Draft-only`.

### Safety Sentinel

The Safety Sentinel supports the Ethics Advisor, Product Lead, and Data Curator
by identifying safety risks, approval gaps, and uncertainty that should block or
escalate automation output. It may recommend review paths, but it does not make
governance decisions.

```json
{
  "component": "safety_sentinel",
  "item_id": "NEW-000",
  "actor": "codex",
  "timestamp": "2026-04-30T00:00:00.000Z",
  "action_context": "screen proposed automation output",
  "rationale": "surface safety and governance issues before human approval",
  "extracted_facts": [
    {
      "source": "placeholder-source-id",
      "fact": "Extracted safety-relevant fact.",
      "confidence": "high"
    }
  ],
  "risk_flags": [
    {
      "risk": "Potential safety concern.",
      "severity": "medium",
      "basis": "Evidence or policy reason for the flag."
    }
  ],
  "inferred_suggestions": [
    {
      "suggestion": "Escalate for ethics review.",
      "basis": "Why escalation is warranted.",
      "confidence": "medium"
    }
  ],
  "missing_information": [
    "Information needed before safe approval."
  ],
  "uncertainty_notes": [
    "Known ambiguity or limitation."
  ],
  "approval_gate": {
    "required": true,
    "owner": "Ethics Advisor",
    "reason": "Safety risk requires human review."
  },
  "errors": []
}
```

## Error Handling Surfaces (Current)

There is no single in-repo `/packages/errors/` subsystem in this repository
today. Error handling is surface-specific and should be documented/consumed
accordingly.

Current behavior by surface:

- Deployed browser UI (`src/App.tsx`) keeps readout failures in React state
  (`error: string | null`) with one user-facing string in the rule-based
  context panel; `console.error` is used for diagnostics. Favorites JSON
  load failures log only and do not populate `error`.
- Workflow transition CLI (`scripts/workflow/transitionInteractionUpdateState.ts`)
  and workflow modules (`scripts/workflow/*.ts`) throw plain `Error` messages
  for invalid input/transition/history conditions. The CLI prints the message to
  stderr and exits non-zero.
- Validation CLIs (`scripts/validateKnowledgeBase.ts`,
  `scripts/validateInteractionsV2.ts`) accumulate string diagnostics, print
  prefixed lines (`ERROR:`, `WARN:`, `INFO:`), then emit a summary and set a
  non-zero exit code when errors exist.
- Integration transport helper (`scripts/slack/slackApi.ts`) throws plain
  `Error` on missing credentials or non-2xx HTTP responses. On HTTP 2xx it
  returns the parsed Slack body as-is: Slack may set `ok: false` with an
  `error` string without an exception; callers must inspect `.ok` when they
  need to branch (for example `scripts/slack/slackPost.ts` after
  `chat.postMessage`).
- Integration CLI wrapper (`scripts/slack/slackPost.ts`) emits JSON output for
  automation consumers:
  - success: `{ "ok": true, ... }`
  - failure: `{ "ok": false, "error": "<message>" }`
- Agent output contracts in this document use an `errors` array for
  payload-level reporting. That field is not a global runtime exception
  envelope.

Future standardization of richer error envelopes is allowed, but not required
for current correctness.

## Duplicate detection and conflicts (current)

There is **no** `packages/agents/deduplication/` package in this repository.
Duplicate surfacing and conflict reporting are implemented in **validators**,
**consolidation tooling**, **intake parsing**, and **agent draft contracts** —
not a standalone deduplication microservice.

Current behavior by surface:

- **Canonical dataset gate:** `scripts/validateInteractionsV2.ts` rejects
  duplicate `pair.key` entries, duplicate **active** (non-deprecated) canonical
  pair keys, and inconsistent / duplicated validation flag groupings for a pair.
- **Knowledge-base consolidation:** `scripts/consolidateJsonUpdates.ts` emits
  `duplicate_signals` and `review_conflicts` on its JSON report so curators can
  review merges, suppressed duplicate refs, and blocked inserts without a new
  index store.
- **NL intake:** `scripts/parseInteractionReports.ts` deduplicates structured
  source refs when extracting proposals and dedupes non-empty note lines for
  reviewer-facing text hygiene.
- **Knowledge Steward drafts:** `packages/agents/knowledge_steward/` output
  contract requires `duplicate_conflict_checks` as **candidate** duplicate /
  conflict hypotheses for reviewers, not an automated merge decision.

Humans retain approval for canonical merges, conflict resolution, and final
record changes. For full file-level mapping and boundaries, see
`docs/automation/BACKEND_INTERFACE.md` (*Duplicate detection and conflicts*).

## Escalation Mapping

- Safety risk -> Ethics Advisor
- Data inconsistency -> Data Curator
- Workflow ambiguity -> Product Lead
- System issue -> Technical Lead

## Publication Path Notes

In this repository, publication-aligned workflow enforcement is represented by:

- workflow transition guards in `scripts/workflow/stateMachine.ts` and
  `scripts/workflow/transitionInteractionUpdateState.ts`
- explicit publication traceability: `approved -> published` requires a
  non-empty transition note (for example PR/review reference)
- GitHub branch/PR review
- Azure deployment workflow in `.github/workflows/azure-deploy.yml`
- rapid/manual and standard intake reference in
  `docs/automation/SUBMISSION_HOW_TO.md`
- submission intake path in `scripts/parseInteractionReports.ts` writing to
  `src/curation/interaction-updates.jsonl` and transitioning via
  `scripts/workflow/transitionInteractionUpdateState.ts`
- workflow-to-Linear status/owner mapping helper in
  `scripts/workflow/linearWorkflowAlignment.ts`

There is no `/apps/api/routes/publish.*` path in the current repo layout.
There is no `/apps/api/routes/submission.*` path in the current repo layout.

## Acceptance And Verification

This automation guidance is current when it:

- names real repo surfaces rather than inferred packages or services
- separates automation actions from human approval decisions
- keeps Azure, Supabase, Cloudflare/Wrangler, Slack, GitHub, Linear, Cursor,
  GitHub Copilot, and other approved tools available within scoped boundaries
- allows investigation, UI testing, validation, docs updates, and normal local
  development without requiring project-management ceremony
- reserves hard prohibitions for consequential outcomes, secrets, production
  mutation, publication, and approval bypasses

For documentation-only updates, verify with:

```sh
git diff --check
```

Expected output: the command exits successfully with no whitespace errors.

Residual limitations:

- This document describes operational boundaries; executable behavior is still
  proven by the relevant scripts, tests, builds, validators, or deployment
  logs.
- Human approval remains necessary for safety, publication, interpretation,
  production, and other consequential decisions.
