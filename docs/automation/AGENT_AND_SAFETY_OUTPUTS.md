# Agent and safety outputs (current)

Purpose: map **assisted agent and safety packages** to real repo surfaces,
review ownership, and **observable** verification commands. Aligns Linear
**NEW-34** (group) with completed child work (**NEW-16**, **NEW-17**, **NEW-18**,
**NEW-19**, **NEW-20**). This file is descriptive; it does not grant automation
any authority beyond what the contracts and workflow code already enforce.

## Authority model

- Outputs are **drafts** or **review-facing signals** only.
- **Data Curator** — structured dataset-facing proposals and evidence
  resolution (`structured`, `curator_review` in workflow alignment).
- **Ethics Advisor** — safety/ethics interpretation and escalation decisions
  (`safety_review`).
- **Product Lead** — publication staging and closure (`approved`, `published`,
  `archived`).
- Workflow ↔ Linear expectations: `scripts/workflow/linearWorkflowAlignment.ts`.

No package in `packages/agents/` performs autonomous merge, publish, or Linear
issue creation.

## Package inventory

| Component | Directory | Machine contract | Human-facing example | Verify |
| --- | --- | --- | --- | --- |
| Knowledge Steward | `packages/agents/knowledge_steward/` | `output-contract.json` | `examples/interaction-draft.example.json` | `npm run agents:verify-knowledge-steward` |
| Safety Rules | `packages/agents/safety_rules/` | `rules.json` | `examples/high-risk-interaction.example.json` | `npm run agents:verify-safety` |
| Safety Sentinel | `packages/agents/safety_sentinel/` | `output-contract.json` | `examples/safety-signal.example.json` | `npm run agents:verify-safety` |

Verifier scripts: `scripts/verifyKnowledgeStewardContract.ts`,
`scripts/verifySafetyAgentContracts.ts`.

## Dataset and intake surfaces (contract alignment)

Knowledge Steward and Safety Sentinel contracts stay compatible with:

- `src/data/interactionSchemaV2.ts` — enums and interaction shape used by
  validators and UI adapters.
- `src/curation/interaction-update` workflow fields on proposals produced by
  `scripts/parseInteractionReports.ts` and stored in
  `src/curation/interaction-updates.jsonl`.
- `scripts/workflow/stateMachine.ts` and
  `scripts/workflow/transitionInteractionUpdateState.ts` — allowed workflow
  states and transition guards.
- Knowledge-base JSON Schemas under `knowledge-base/schemas/`.

Repo intake how-to (operational): `docs/automation/SUBMISSION_HOW_TO.md`.

## Summary outputs (no `packages/agents/summarization/`)

Some Linear scope text referenced `packages/agents/summarization/`; **that
directory does not exist** in this repository. Summary-shaped behavior is
implemented at:

| Surface | Role |
| --- | --- |
| `src/services/geminiService.ts` | Rule-based markdown readouts for the deployed app (not a JSON agent envelope). |
| `scripts/parseInteractionReports.ts` | NL report → `InteractionUpdateProposal` with `reviewer_notes` and `proposed_changes` aligned to V2 field paths. |
| `scripts/generateInteractionReports.ts` | Generates curator-facing report text consumed upstream of parsing (when used in that flow). |

Regression coverage for parser / proposal shape: `npm run updates:test-parser`
(see `docs/testing/TEST_SUITE_MAP.md`, `agent_output_contracts`).

## Duplicate and conflict signals

Canonical duplicate detection and consolidation reporting: see
`docs/automation/BACKEND_INTERFACE.md` (*Duplicate detection and conflicts*) and
`docs/automation/AUTOMATION_AGENTS.md` (same heading). Knowledge Steward drafts
include `duplicate_conflict_checks` as **review-facing** hypotheses only.

## Safety rules ↔ Sentinel ↔ workflow

- `packages/agents/safety_rules/rules.json` defines `workflow_labels`,
  `review_owners`, `flag_categories`, and per-rule routing metadata.
- `scripts/verifySafetyAgentContracts.ts` checks that rules and Sentinel
  examples remain compatible with contract enums (workflow labels, owners,
  severities, flag categories).
- `packages/agents/safety_sentinel/output-contract.json` includes
  `linear_escalation` **draft** fields (routing context). Actual Linear issue
  creation and outcomes require human action; see
  `packages/agents/safety_sentinel/README.md` (*Linear Routing Fields*).
- `workflow_effect` and related Sentinel fields are recommendations for review,
  not autonomous workflow mutations.

## Product direction (external)

Tone and submission-intake guidance maintained in Linear (for example
[Submission intake how-to](https://linear.app/new-psychonaut/document/submission-intake-how-to-e14174e53d28)
and
[Tone and direction guidance](https://linear.app/new-psychonaut/document/tone-and-direction-guidance-51ab8ce0ad71))
informs how humans and agents **should** write drafts. Repo contracts do **not**
embed those URLs as machine-checkable gates (see `AGENTS.md`, *Verification*).

## Observable verification

```bash
npm run agents:verify-knowledge-steward
npm run agents:verify-safety
```

Expect **exit code 0** after any edit to agent contracts, examples, or
`rules.json`.
