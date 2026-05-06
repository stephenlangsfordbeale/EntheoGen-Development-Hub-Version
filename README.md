<div align="center">

![Dataset](https://img.shields.io/badge/Dataset-beta--0.1-blue)
![Interactions](https://img.shields.io/badge/Interactions-~794-informational)
![Substances](https://img.shields.io/badge/Substances-~41-informational)
![App data](https://img.shields.io/badge/App%20data-static%20JSON%20snapshot-lightgrey)
![TypeScript](https://img.shields.io/badge/TypeScript-compile%20pass-brightgreen)

# EntheoGen — plant medicine interaction guide

**Evidence-grounded, deterministic interaction readouts for intentional psychedelic contexts.**

Live demos: [entheogen.newpsychonaut.com](https://www.entheogen.newpsychonaut.com/) · [Azure](https://entheogen.azurewebsites.net)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
</div>

---

## Important

EntheoGen is **educational**, not clinical advice. For harm reduction and medical decisions, consult a qualified professional.

---

## What this version is

**Beta‑0‑1 (app)** still ships as **static JSON** built from curated CSVs—no live database required for the public interaction guide. See [Beta‑0‑1 release notes (wiki)](https://github.com/chaosste/EntheoGen/wiki/EntheoGen-Beta%E2%80%900%E2%80%901).

**Since that baseline**, the repo has gained clearer **automation and data-operation docs**, optional **Supabase Phase 1** alignment for analytics and exports (not a runtime dependency for the SPA), and operational notes for **parallel programmes** (e.g. private beta launch) without changing the core “snapshot in, UI out” contract.

---

## Data flow (unchanged core)

| Artifact | Role |
|----------|------|
| `interactions.csv`, `substances.csv` | Workspace inputs for regeneration |
| `npm run dataset:build-beta -- .` | Builds `src/data/substances_snapshot.json`, `src/exports/interaction_pairs.json` |
| `src/data/uiInteractions.ts` | Adapter to `UIInteraction` for the UI |

After CSV edits, rebuild snapshots and commit JSON before you treat a branch as release-ready.

---

## Developer quickstart

```bash
npm install
npm run dataset:build-beta -- .
npm run typecheck
npm test
```
Broader CI-style gate: npm run ci:checks (see docs/automation/QUALITY_AND_RELIABILITY.md).

## Where to read more

| Topic | Doc |
|----------|------|
| **Supabase: install `interactions_enriched` view (paste in SQL Editor)** | **docs/metabase/supabase-install-interactions-enriched-view.sql** |
| Automation roles and safety | docs/automation/AUTOMATION_AGENTS.md, docs/automation/AGENT_AND_SAFETY_OUTPUTS.md |
| Intake and submissions | docs/automation/INTAKE_AND_INTEGRATION.md, docs/automation/SUBMISSION_HOW_TO.md |
| Backend / data foundations | docs/automation/BACKEND_AND_DATA_FOUNDATIONS.md |
| Repo layout | docs/REPO_LAYOUT.md |
| Private student beta (ops) | docs/private-student-beta/README.md |
| Contributor / agent rules | AGENTS.md |

Wiki and discussions
[Project wiki](https://github.com/chaosste/EntheoGen/wiki) — release notes and narrative history
[Discussions](https://github.com/chaosste/EntheoGen/discussions/1) — feedback and community input

---
