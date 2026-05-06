# Intake and integration (current)

Purpose: describe the **actual** control plane for Linear **NEW-33**—traceable
work, human approval, and repo-local execution—without inventing backend or
`packages/integrations/*` layers. Child issues **NEW-13**, **NEW-14**,
**NEW-15**, and **NEW-38** are documented as completed in Linear; this file
consolidates the in-repo story (depends on **NEW-32** foundations).

## Paths that are not in this repository

| Referenced path | Role in Linear issues | In-repo reality |
| --- | --- | --- |
| `/apps/api/routes/submission.*` | HTTP submission API | **File-first** intake: `scripts/parseInteractionReports.ts` → `src/curation/interaction-updates.jsonl`. See `docs/automation/SUBMISSION_INTAKE_FLOW.md`. |
| `packages/integrations/linear/` | Packaged Linear SDK | **No** package. Workflow alignment lives in `scripts/workflow/linearWorkflowAlignment.ts`. Linear itself is the external app; Cursor/CLI/MCP may call it—nothing in `packages/` wraps it. |
| `packages/integrations/github/` | Packaged GitHub integration | **No** package. **GitHub** hosts branches and PRs; `.github/workflows/*.yml` runs CI/deploy; humans merge. Optional `gh` CLI per operator setup—not a repo integration module. |

## End-to-end execution model (present tense)

```text
Linear issue or explicit scoped task (traceability)
  -> implementation in Cursor / Codex / local tools (execution)
  -> GitHub branch + PR + CI (reviewable diff)
  -> human approval (merge, dataset, publication decisions)
  -> Azure deploy workflow on main when applicable (see BACKEND_INTERFACE)
```

Submission **content** still flows through parser + workflow CLI as in
`SUBMISSION_INTAKE_FLOW.md`; Linear tracks **who owns** the lane, not a server
that ingests HTTP uploads inside this repo.

## Authoritative doc map

| Topic | Document |
| --- | --- |
| File-first parser, dirs, CLI, audit lines | `docs/automation/SUBMISSION_INTAKE_FLOW.md` |
| Contributor / agent operating guide | `docs/automation/SUBMISSION_HOW_TO.md` |
| Rapid manual lane | `docs/automation/RAPID_MANUAL_INTAKE.md` |
| Linear ↔ workflow states, roles, PR expectations | `docs/workflows/submission-to-review.md` |
| Workflow transition code | `scripts/workflow/stateMachine.ts`, `transitionInteractionUpdateState.ts` |
| Alignment helper | `scripts/workflow/linearWorkflowAlignment.ts` |
| Automation policy (no ceremony gates) | `AGENTS.md`, `AUTOMATION_README.md`, `AUTOMATION_GOVERNANCE.md`, `AUTOMATION_AGENTS.md` (**NEW-38**) |
| Foundations (backend, data) | `docs/automation/BACKEND_AND_DATA_FOUNDATIONS.md` |
| Supabase Phase 1 CSV export, backup/staging SQL, Metabase guardrails | `docs/automation/SUPABASE_PHASE1_CSV_PIPELINE.md` |
| Documentation tone and submission product (Linear) | [Tone and direction guidance](https://linear.app/new-psychonaut/document/tone-and-direction-guidance-51ab8ce0ad71), [Submission intake how-to](https://linear.app/new-psychonaut/document/submission-intake-how-to-e14174e53d28) |

## Approval boundaries (explicit)

- **Linear** state and delegation are **workflow signals**, not automatic approval
  of dataset or safety outcomes (`AUTOMATION_AGENTS.md`).
- **Merge / publish / deploy** require human decisions on the GitHub and Azure
  paths documented elsewhere.
- Automation may **open, route, or update** work only within those approved
  surfaces and tools.

## Observable verification

```bash
npm run test:submission-intake
npm run test:workflow-linear-alignment
```

For full PR gates, see `docs/automation/QUALITY_AND_RELIABILITY.md`.
