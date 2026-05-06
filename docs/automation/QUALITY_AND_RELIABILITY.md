# Quality and reliability (current)

Purpose: single map from **observable commands** to what they prove, aligned with
Linear **NEW-37** (quality / reliability group) and its completed child issues
(ENT-023 **NEW-28** CI, ENT-024 **NEW-29** tests, ENT-025 **NEW-30** errors,
**NEW-40** TypeScript, **NEW-41** package scripts). This file is descriptive only:
it does not add CI steps or tests by itself.

## TypeScript and lint surface

| Command | Definition | Evidence |
| --- | --- | --- |
| `npm run typecheck` | `tsc --noEmit` | TypeScript compiles without emit |
| `npm run lint` | alias → `npm run typecheck` | Same as typecheck (no separate ESLint) |

## Default test and validation entrypoints

| Command | Runs | Evidence |
| --- | --- | --- |
| `npm test` | `npm run test:validators` | KB JSON Schema + interaction V2 validators over canonical artifacts |
| `npm run test:validation-alignment` | same as `npm test` | Explicit alias for alignment wording |

## Pull-request CI (`.github/workflows/ci.yml`)

Triggers: `pull_request` to `main` or `auto-dev`; `push` to `auto-dev`;
`workflow_dispatch`. Job `verify` (Node 22, `npm ci`):

| Step | Command |
| --- | --- |
| Typecheck | `npm run typecheck` |
| Validation alignment | `npm test` |
| Submission intake guard | `npm run test:submission-intake` |
| Alignment suite | `npm run test:suite:alignment` |
| Build | `npm run build` |

**Local parity with PR CI** (run in order):

```bash
npm run typecheck
npm test
npm run test:submission-intake
npm run test:suite:alignment
npm run build
```

## Production deploy build (`.github/workflows/azure-deploy.yml`)

Triggers: `push` to `main`; `workflow_dispatch`. Job `build` (Node 22, `npm ci`):

| Step | Command |
| --- | --- |
| Typecheck | `npm run typecheck` |
| Submission intake guard | `npm run test:submission-intake` |
| Interaction data guard | `npm run validate:interactions:v2` |
| Build | `npm run build` |

Note: the deploy workflow does **not** run `npm test` or `npm run test:suite:alignment`; PR CI is the broader pre-merge gate.

## Local aggregate gate

| Command | Definition |
| --- | --- |
| `npm run ci:checks` | `typecheck` → `test:validation-alignment` → `test:submission-intake` → `test:suite:alignment` → `build` |

Use this before pushing when you want a single command that tracks the **PR**
`verify` job (see `package.json` for the exact chain).

## Test layout and module map

- There is **no** top-level `/tests/` directory; executable checks live under
  `scripts/**/*.ts` (often `*.test.ts`).
- Command → module mapping and coverage labels: `docs/testing/TEST_SUITE_MAP.md`.

## Error and integration surfaces

- Error shapes and duplicate/conflict reporting are **surface-specific**; see
  `docs/automation/BACKEND_INTERFACE.md` (*Error handling*, *Duplicate detection*)
  and `docs/automation/AUTOMATION_AGENTS.md` (*Error Handling Surfaces*,
  *Duplicate detection and conflicts*).

## Agent package verifiers (optional targeted)

| Command | Role |
| --- | --- |
| `npm run agents:verify-knowledge-steward` | Contract + example JSON for Knowledge Steward |
| `npm run agents:verify-safety` | Safety Rules + Safety Sentinel contract checks |

Full agent/safety output map and review boundaries:
`docs/automation/AGENT_AND_SAFETY_OUTPUTS.md` (Linear **NEW-34**).

## Forbidden verification (repo policy)

Do not add checks that assert Linear IDs, PR template wording, branch names,
checklist completion, or other process-only anchors. See `AGENTS.md`
(*Verification*).
