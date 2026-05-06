# Governance And Escalation (Current Repo)

Purpose: this document defines how governance and escalation currently operate in this repository using Linear-controlled workflow state and PR-based execution.

## Scope

This document is scoped to concrete, live surfaces in this repo:

- Workflow policy and transition guards:
  - `scripts/workflow/stateMachine.ts`
  - `scripts/workflow/interactionUpdateWorkflow.ts`
  - `scripts/workflow/transitionInteractionUpdateState.ts`
- Linear role/state alignment helper:
  - `scripts/workflow/linearWorkflowAlignment.ts`
- Submission intake and draft update queue:
  - `scripts/parseInteractionReports.ts`
  - `src/curation/interaction-updates.jsonl`
- Governance and automation references:
  - `AUTOMATION_GOVERNANCE.md`
  - `AUTOMATION_README.md`
  - `docs/automation/AUTOMATION_AGENTS.md`
- Review and execution controls:
  - GitHub branches + pull requests
  - package scripts in `package.json`

Terminology note: `Linear` here means the Linear workflow application (issue and ownership control plane), not a mathematical concept.

## Operational Model

- Linear is the workflow control plane for issue state, ownership, and review readiness.
- GitHub is the execution and review plane for consequential changes (branch, PR, merge history).
- Workflow scripts enforce dataset transition rules and transition-history integrity.
- Humans retain approval authority for safety, publication, and production-impacting outcomes.

**Single-owner default:** one person may hold every Linear role in practice; the
role names still describe accountability **lanes** in
`scripts/workflow/linearWorkflowAlignment.ts`, not implied headcount. Automation
does not grant those approvals on anyone’s behalf.

Typical consequential flow:

```text
Linear issue or explicit scoped task
-> Codex implementation + verification
-> GitHub PR or reviewable diff
-> Human review/approval
-> approved deployment path
```

## Pre-Beta Operational Handoff (Development Pre-Beta Test)

This section applies to the pre-beta run of the Development Pre-Beta Test
project. Use the project documentation and Linear as the source of truth for
workflow progress, ownership, and review status.

Role boundaries for this pre-beta cycle:

- **Linear**: workflow progress and ownership tracking authority.
- **sb1397**: sole human approval and review owner for this test.
- **cursor**: structuring, drafting, and analysis support only.
- **codex**: codebase alteration tasks and verification.
- **githubcopilot**: PR drafting and review support (summaries, checklists,
  diff organization).

Lightweight handoff sequence:

```text
Linear issue or scoped task
-> cursor drafts/analysis (if needed)
-> codex implements + verifies changes
-> githubcopilot prepares PR-ready summary/diff
-> sb1397 reviews and approves
-> Linear status updated + next step recorded
```

Handoff rules (keep explicit and reviewable):

- Every handoff records the current owner and next action in Linear.
- Link any PR, doc edit, or verification output in the Linear update.
- Keep diffs small and reversible; call out any risk or uncertainty.
- No automation claims approval authority; sb1397 provides final review.

## Role Responsibilities (Current)

- Product Lead: scope, release timing, and publication approval ownership.
- Data Curator: evidence quality and structured record readiness.
- Ethics Advisor: safety/ethics review and approval gates.
- Technical Lead: system integrity and blocker resolution.
- Beta Coordinator / UX: intake triage and early workflow routing.

## Workflow State And Escalation Alignment

The dataset/workflow states currently enforced in code are:
`submitted`, `structured`, `curator_review`, `safety_review`, `approved`, `published`, `archived`, `blocked`.

State alignment and escalation routing should follow current script mappings:

| Workflow state | Linear state | Primary owner role | Escalate when | Escalate to | GitHub PR flow expectation |
| --- | --- | --- | --- | --- | --- |
| `submitted` | `Todo` | Beta Coordinator / UX | intake is ambiguous or evidence shape is incomplete | Data Curator | `not_required` |
| `structured` | `In Progress` | Data Curator | evidence conflicts or schema concerns appear | Data Curator + Technical Lead (if structural) | `recommended` |
| `curator_review` | `In Progress` | Data Curator | unresolved evidence conflict or safety concern appears | Ethics Advisor (safety), Product Lead (scope) | `recommended` |
| `safety_review` | `In Review` | Ethics Advisor | risk is unresolved or additional approval context is needed | Product Lead + Data Curator | `recommended` |
| `approved` | `In Review` | Product Lead | publication evidence link is missing | Product Lead | `required_for_publication` |
| `published` | `Done` | Product Lead | post-publication correction is required | Data Curator + Ethics Advisor (if safety related) | `already_published_or_retired` |
| `archived` | `Canceled` | Product Lead | record must be re-opened due to new evidence | Data Curator + Product Lead | `already_published_or_retired` |
| `blocked` | `Todo` | Technical Lead | blocker cannot be resolved in current lane | Technical Lead + Product Lead | `not_required` |

These workflow or Linear states indicate execution status; they do not independently grant publication, safety, or production approval.

## Governance Boundaries

Automation may:

- parse and structure draft records
- apply valid workflow transitions through governed scripts
- produce transition audit payloads and review-context output
- propose role-aligned review actions and PR flow expectations

Humans must approve:

- safety and ethics outcomes
- publication decisions (`approved -> published` lane intent)
- consequential production-impacting system changes
- final interpretation when evidence is conflicting or uncertain

Prohibited:

- bypassing workflow transition guards
- treating Linear state changes as approval artifacts
- publishing autonomously
- mutating production outside explicit scope and approval

## Risk-Based Guidance

Use conditional guidance rather than universal mandates:

- If a change is docs-only or local tooling-only, a reviewable diff with targeted checks is usually sufficient.
- If a change affects workflow, dataset records, or publication state, use PR-based review and preserve transition evidence.
- If uncertainty affects safety or publication, escalate early and keep uncertainty explicit in draft outputs.
- If uncertainty affects triage only, continue investigation while preserving review notes and ownership visibility.

## Acceptance Criteria (Testable Now)

- Governance responsibilities match current role ownership described in workflow alignment scripts.
- Escalation routes are consistent with the current workflow states and transition policy.
- Linear and PR-flow expectations reflect current code-level mappings.
- The document does not claim non-existent routes or unsupported automation authority.

## Verification

Run:

```bash
npm run test:workflow-linear-alignment
npm run test:workflow-transition-integration
npm run test:workflow
```

Expected outputs:

- `workflow-linear alignment assertions passed`
- `Interaction update workflow transition integration tests passed.`
- `Workflow state machine tests passed.` and `Workflow write-path guard passed.`

Residual risks and limitations:

- This document tracks current repo surfaces; role assignments and escalation routes must be updated when script mappings change.
- Linear state names represent workflow progress, not legal/scientific authority.
- Some escalation decisions remain context-specific and require human judgment beyond scripted validation.
