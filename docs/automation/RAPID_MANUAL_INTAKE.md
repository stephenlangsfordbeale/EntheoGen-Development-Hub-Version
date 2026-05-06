# Rapid Manual Interaction Intake

Purpose: provide Steve with a fast manual path for correcting obvious
interaction readout errors and filling clear dataset holes before the planned
Knowledge Steward agent is in service.

For the cross-workflow contributor/model/agent reference, see
`docs/automation/SUBMISSION_HOW_TO.md`.

This is a human-directed workflow: the owner retains final sign-off for
consequential outcomes. Codex, Cursor, Codex CLI, or a delegated Linear issue may
structure the evidence and draft the change, but they do not approve safety
interpretation, publication, or release.

## Priorities

1. Fix howlers: inappropriate or misleading user-facing interaction readouts.
2. Fill obvious holes: known substance-pair gaps where supplied evidence is
   sufficient for the current interaction schema.
3. Preserve provenance: keep the submitted research note, source references,
   model decision, preview readout, and review timestamp visible in the PR.

## When To Use

Use this path when Steve provides:

- an in-house research note, paper, guideline, source excerpt, or source IDs
- a specific substance pair or missing substance/pair target
- a request to rapidly assess whether the material satisfies entry criteria

Do not use this path when:

- the substance pair is ambiguous and cannot be resolved to existing IDs
- the evidence would require schema redesign or new storage/indexing work
- the change needs clinical, legal, or publication approval outside a PR review
- the supplied material cannot support the required fields even conservatively

## Required Model Response

The first model response must make one of these determinations:

```text
I can satisfy the required substance and/or interaction fields from the
provided information.
```

or:

```text
There is not enough information provided to satisfy the required substance
and/or interaction fields from the provided information.
```

If sufficient, the response must also include:

- normalized pair IDs, if known
- proposed classification, confidence, mechanism category, evidence tier, and
  source support type
- missing or weak fields that require reviewer attention
- an example UI readout as it would appear if processed and added now

If insufficient, the response must include:

- the missing fields or unresolved substance mappings
- the minimum extra evidence needed to continue
- whether the issue should stay open as a research gap

## Minimum Field Gate

A candidate can proceed only when the supplied material can support:

| Field | Minimum requirement |
| --- | --- |
| Pair | Two known substance IDs or a clear request to add/resolve a substance |
| Classification | One conservative candidate code: `LOW`, `LOW_MOD`, `CAUTION`, `UNSAFE`, `DANGEROUS`, or `UNKNOWN` |
| Confidence | `low`, `medium`, or `high`, capped by source strength |
| Mechanism | Primary category plus concise mechanism rationale |
| Guidance | Practical user-facing harm-reduction guidance |
| Evidence | Source refs or explicit `source_gap` with reviewer-visible limitations |
| Provenance | Submitted note/source path, timestamp, and model/tool author |

High-confidence or dangerous claims require direct evidence, guideline support,
or explicit human reviewer agreement. Source-gap-only proposals remain low
confidence and draft-only.

## Fast Path

1. Capture the submission.
   - Put long-form notes in `src/curation/nl-reports/incoming/`.
   - For Linear-delegated work, paste the note into the issue or attach the
     source path and ask the model to apply this runbook.
2. Decide sufficiency using the required response wording above.
3. If sufficient, draft one proposal in the shape documented by
   `src/curation/prompts/nl-report-to-jsonl.md`.
4. Run the parser path when using markdown reports:

```bash
npm run reports:parse
```

5. Preview the user-facing readout using the proposed fields before applying
   the dataset change.
6. Apply only the narrow dataset/readout fix needed for the howler or hole.
7. Open a PR with the minimal provenance template.

## Linear Delegation Prompt

Use this when the Linear workflow application delegates the issue to a model:

```text
Apply docs/automation/RAPID_MANUAL_INTAKE.md.

Submission timestamp: <ISO timestamp>
Target pair or substance: <name/id>
Priority: howler | dataset-hole
Source material: <paste note, attach path, or list source IDs>

Determine whether the supplied material satisfies the required fields. If yes,
draft the interaction update and provide the example UI readout. If no, list the
missing fields and the smallest evidence addition needed. Do not approve,
publish, or imply clinical authority.
```

## Example UI Readout Format

```text
Classification: <label/code>
Confidence: <low|medium|high>
Core interpretation: <one-sentence headline>
Mechanism of concern: <concise mechanism>
Practical guidance: <what the user should do or avoid>
Remaining uncertainty: <evidence gap or limitation>
Safety boundary: educational harm-reduction information, not medical advice.
```

## Verification

For report parsing or workflow initialization changes:

```bash
npm run test:submission-intake
```

For dataset/readout changes:

```bash
npm run validate:interactions:v2
npm run test:ui-adapter
```

For app-facing behavior changes:

```bash
npm run typecheck
npm run build
```

Record only commands actually run in the PR.

## Residual Limits

- This path bypasses the planned Knowledge Steward agent, not human approval.
- The model may draft structure and readout previews; Steve or an appointed
  reviewer remains responsible for accepting interpretation changes.
- Missing evidence should be recorded as a research gap instead of being filled
  by speculation.
