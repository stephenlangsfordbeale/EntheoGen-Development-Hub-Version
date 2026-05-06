# Workspace Baseline And Drift Triage

Last updated: 2026-04-30

Historical-snapshot note: the drift inventory in this file is a point-in-time
record, not guaranteed current workspace truth. Always rely on fresh command
output (`git status --short` and `npm run workspace:baseline`) for current
state.

## Purpose

Keep feature diffs issue-scoped and reviewable by requiring a clean (or explicitly acknowledged) workspace baseline at task start.

## Baseline Process

1. Run `git status --short`.
2. Run `npm run workspace:baseline`.
3. If drift exists, classify each file as one of:
- `keep` (part of the active issue)
- `split` (move into a dedicated issue/PR)
- `revert` (discard local-only noise)
4. Do not begin unrelated feature edits until drift is either split/reverted or explicitly documented.

## Local-Only State Guard

The following files are local tooling memory and should remain untracked:

- `.cursor/hooks/state/continual-learning.json`
- `.cursor/hooks/state/continual-learning-index.json`

If they appear in `git status`, remove them from the index (without deleting local copies):

```bash
git rm --cached .cursor/hooks/state/continual-learning.json .cursor/hooks/state/continual-learning-index.json
```

## Drift Inventory Snapshot (2026-04-30)

| Path | Current status | Classification | Notes |
| --- | --- | --- | --- |
| `.cursor/hooks/state/continual-learning.json` | resolved | untracked local-only | Removed from git index; now governed by `.gitignore`. |
| `.cursor/hooks/state/continual-learning-index.json` | resolved | untracked local-only | Removed from git index; now governed by `.gitignore`. |
| `AUTOMATION_PHASE_1_BACKLOG.md` | modified | split | Documentation update in separate scope from workflow state machine delivery. |
| `docs/REPO_LAYOUT.md` | modified | split | Documentation layout update; keep isolated from code behavior changes. |
| `package-lock.json` | modified | keep/split | Can be kept only when directly caused by intentional `package.json` script/dependency changes; otherwise split. |
| `package.json` | modified | keep/split | Contains both scoped NEW-24/NEW-42 scripts and unrelated edits; split before final delivery PR. |
| `scripts/slack/slackHealthcheck.ts` | deleted | split/revert | Unrelated Slack surface change; isolate or restore in dedicated issue. |

## Notes

- `workspace:baseline` supports allowlists for scoped runs:
  - `npm run workspace:baseline -- --allow path/to/file`
  - `npm run workspace:baseline -- --allow-prefix scripts/workflow/`
- This process is a hygiene gate, not a publication blocker.
