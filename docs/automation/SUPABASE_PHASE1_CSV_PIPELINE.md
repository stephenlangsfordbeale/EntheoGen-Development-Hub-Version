# Supabase Phase 1 CSV pipeline (repo automation)

This repo ships a **local automation** for keeping workspace-root **`interactions.csv`** / **`substances.csv`** in sync with live **`public.interactions`** and **`public.substances`**, backing up on Supabase, reloading through **staging tables**, and refreshing the **Metabase `interactions_enriched`** model SQL copy.

## Commands

| Command | What it does |
|---------|----------------|
| `npm run supabase:phase1-csv-pipeline -- export` | `SELECT` from Supabase/Postgres → writes **`interactions.csv`** and **`substances.csv`** at the **repo root**. |
| `npm run supabase:phase1-csv-pipeline -- emit-bundle` | Copies committed Metabase model SQL from **`docs/metabase/`** into **`scripts/automation/generated/`** (gitignored local bundle), including **`interactions_enriched.sql`** and **`class_interaction_matrix.sql`**. Removes a stale **`interactions_enriched_v2.sql`** in that folder if present. No DB access. |
| `npm run supabase:phase1-csv-pipeline -- all` | Runs **export** then **emit-bundle**. |

**Environment (export only):** set **`DATABASE_URL`** or **`SUPABASE_DB_URL`** in **`.env.local`** (gitignored). Use a connection string that can `SELECT` from `public` (pooled or direct). Do not commit secrets.

## Supabase SQL roundtrip (manual steps in dashboard)

SQL files live under [scripts/automation/sql](../../scripts/automation/sql):

1. **`01_backup_phase1_tables.sql`** — Copies live rows into **`_phase1_backup_*`** tables (re-runnable; overwrites prior backups).
2. **`02_staging_ddl_and_helper.sql`** — Creates **`_staging_substances_csv`** / **`_staging_interactions_csv`** (all `text`) plus **`_staging_mechanism_categories_to_jsonb(text)`** for CSV → `jsonb`.
3. **Import** repo-root CSVs into those staging tables (Table Editor → Import).
4. **`03_swap_from_staging.sql`** — `TRUNCATE` live tables, **`INSERT … SELECT`** from staging with `NULL` / boolean / numeric / `jsonb` casting.

After a successful swap, run **`npm run dataset:build-beta -- .`** so JSON snapshots match the database you just loaded.

## Metabase model SQL

- Canonical query: [docs/metabase/interactions_enriched.sql](../metabase/interactions_enriched.sql) (normalized pair ids, `pair_key` hygiene, `is_comparable_pair`, `risk_severity_bucket`, `risk_bucket` alias).
- Class matrix query: [docs/metabase/class_interaction_matrix.sql](../metabase/class_interaction_matrix.sql) (built from `interactions_enriched`, class values from normalized pair ids, heatmap-ready class pair rollups).
- After `emit-bundle`, model files are written under `scripts/automation/generated/` for packaging with the generated runbook.

Metabase UI steps and model naming: [docs/metabase/README.md](../metabase/README.md).

---

## Guidelines: Linear / generic draft corrections (Metabase & analytics)

When adapting **generic “interaction dashboard” SQL** (e.g. Linear doc *Metabase table, graph and model layer creation*) to **EntheoGen Phase 1**, apply these corrections so charts and models stay honest:

| Wrong assumption in drafts | Phase 1 reality |
|----------------------------|-----------------|
| **`risk_score` is 0–1** or thresholds like `>= 0.7` | **`risk_score`** is **`numeric`**, typically **integer-like 1–5** (plus **null** and **self-pair** cases such as **-1**). Bucket with **integer cutpoints** (e.g. ≥5 critical, ≥4 high, ≥3 moderate) or derive buckets from **`classification_code`** / **`risk_label`**, not probabilities. |
| **`classification_confidence` is numeric** or `ROUND(..., 1)` | It is **`text`**: `high` / `medium` / `low` / `none` / `not_applicable`. Map with **`CASE lower(...)`** or discrete categories only. |
| **`mechanism_categories` is a string; use `LIKE '%,%'`** for “multi mechanism” | Column is **`jsonb` array**. Use **`jsonb_array_length`**, **`jsonb_array_elements_text`**, or containment operators. |
| Join **names** using only `substance_a_id` / `substance_b_id` row order | For undirected analytics, attach labels to **`LEAST(substance_a_id, substance_b_id)`** and **`GREATEST(...)`** (matches **`pair_key`** canonical rule in migrations). |
| **`substances.category`** | Column is **`class`** (text). |
| **`severity` column** | Use **`risk_label`**, **`risk_score`**, and/or **`classification_code`**. |

The committed **`interactions_enriched.sql`** model already encodes the rows above (normalized pair ids, text confidence bucket, integer-style `risk_severity_bucket` / `risk_bucket`, `jsonb` mechanism counts, deprecated filter). Pair semantics and bucket cutpoints for sign-off: [PAIR_AND_BUCKET_DEFINITIONS.md](../metabase/PAIR_AND_BUCKET_DEFINITIONS.md) (**NEW-88**).

---

## Safety

- Run backups (`01_…`) immediately before destructive steps.
- Prefer a **maintenance window**; `TRUNCATE` removes all live Phase 1 rows until the swap `INSERT` completes.
- **RLS:** SQL editor must use a role that can bypass or satisfy RLS for `public` maintenance (often the **postgres** user in Supabase).
- Validate **row counts** and a few **spot `pair_key`s** after swap before pointing Metabase or the app at the DB.
