# Knowledge Steward Agent

Purpose: convert raw submissions into structured, review-facing draft records
without collapsing uncertainty into approved dataset facts.

This package defines the first EntheoGen agent prompt and its output contract.
It is draft-only: the agent may extract and structure candidate outputs, but
humans approve interpretation, safety classification, publication-facing use,
and downstream dataset changes.

## Files

- `system.md` - system message for the Knowledge Steward agent.
- `output-contract.json` - JSON Schema for the agent output envelope.
- `examples/interaction-draft.example.json` - minimal valid review-facing draft.

## Output Boundaries

The contract separates:

- `extracted_from_source` - text-supported fields, quotes, and source metadata.
- `inferred_or_suggested` - provisional mappings or dataset-facing suggestions.
- `uncertain_or_missing` - missing information, weak support, conflicts, and limits.

Dataset-facing suggestions use current repo surfaces:

- claim candidates: `knowledge-base/schemas/claim.schema.json`
- source entries: `knowledge-base/schemas/source.schema.json`
- interaction proposals: `src/curation/interaction-updates.jsonl`
- interaction enums: `src/data/interactionSchemaV2.ts`

The agent must not write reviewed claims, overwrite app snapshots, publish
records, or imply approval.

## Verification

Run the package verifier:

```bash
npm run agents:verify-knowledge-steward
```

Expected output: the contract and example parse successfully, required
separation fields are present, and contract enums remain compatible with the
current dataset-facing schemas.

For broader repo checks, use:

```bash
npm run lint
npm test
```

## Known Limits

- The verifier checks structure and enum compatibility, not scientific truth.
- Duplicate/conflict detection is a draft signal for reviewers, not an
  automated rejection or merge decision.
- Canonical duplicate pair rules and consolidation merge reporting live in
  repo scripts (`scripts/validateInteractionsV2.ts`,
  `scripts/consolidateJsonUpdates.ts`); there is no `packages/agents/deduplication/`
  runtime in this repository.
- A valid draft can still require source review before any dataset update.
