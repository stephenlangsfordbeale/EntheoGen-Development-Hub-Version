# Handover — EntheoGen (pre-beta / dataset)

**Date context:** 2026-05-03  
**Branch/workspace:** local `EntheoGen`; dataset rebuild uses `npm run dataset:build-beta -- .` (workspace-root `interactions.csv` + `substances.csv`).

## Done in the prior session

### NEW-63 — Ayahuasca + cardiovascular meds (short path)

- **`interactions.csv`**: Refined copy + `primary_mechanism_category` / `mechanism_categories` for antihypertensives/beta-blockers/CCBs/clonidine/guanfacine/clonidine_guanfacine (depressor vs pressor framing; removed misleading tags where needed; risk/confidence bumps where agreed).
- Rebuilt **`src/exports/interaction_pairs.json`** (and substances snapshot) via `dataset:build-beta`.

### NEW-62 — MAOI-centered ayahuasca tightening (short path)

- **`interactions.csv`**: Batch alignment to three conceptual pathways using **existing** `MechanismCategory` values only (no new schema keys):
  - **Serotonergic:** e.g. SSRI, SNRI, TCA, serotonergic opioids, 5-MeO-DMT, MDMA, DOx, 2C-x, NBOMe, yopo, atypical AD copy/categories.
  - **Sympathomimetic:** amphetamine+ayahuasca, cocaine, methylphenidate, NDRI/bupropion, mescaline primary emphasis where appropriate.
  - **Demoted mis-tags:** antipsychotics+ayahuasca (primary no longer `serotonergic_toxicity` vs headline); cannabis (dropped vague `maoi_potentiation`-only framing); alcohol broadened beyond single tag.
- Ketamine / psilocybin / pharmahuasca-style rows: expanded **category lists** + mechanism prose so serotonergic vs hemodynamic vs operational layers are explicit.
- Re-ran **`dataset:build-beta -- .`** and **`npm run test:ui-adapter`** (passed).

### Other context

- **Linear:** [NEW-63](https://linear.app/new-psychonaut/issue/NEW-63/review-cardiovascular-interaction-layer-for-ayahuasca-pairs), [NEW-62](https://linear.app/new-psychonaut/issue/NEW-62/review-maoi-centered-ayahuasca-interaction-fixes); docs referenced in issues include cardiovascular layer + MAOI tightening writeups.
- **Cloud Agent / Linear:** prior note that Cursor may post Linear activity as the connected user; delegate field exists for agents.
- **Continual learning:** last memory-updater run reported **no high-signal AGENTS.md changes**; index refreshed.

## Deferred (user intent)

- **Full path:** New mechanism/taxonomy enums (e.g. `pressor_conflict`, `maoi_interaction_type` JSON), V2 schema + UI chips — file as separate upgrade work.
- **Commit:** Uncommitted changes expected in `interactions.csv`, `src/exports/interaction_pairs.json`, possibly `src/data/substances_snapshot.json`, and this handover file.

## Quick verify

```bash
npm run dataset:build-beta -- .
npm run test:ui-adapter
npm run typecheck   # optional; was passing after prior export
```

## Conventions to keep

- Prefer **existing** `MechanismCategory` strings in CSV until taxonomy work lands.
- App export still uses **single** `primary_mechanism_category` → `interaction_pairs.json` `mechanism_category`; CSV `mechanism_categories` array is for consistency / downstream, not fully mirrored in that JSON today.
