/**
 * Phase 1 Supabase ↔ workspace CSV automation (repo-local).
 *
 * **export** — Reads `public.substances` and `public.interactions` via Postgres,
 * writes `substances.csv` and `interactions.csv` at repo root (same columns the
 * beta dataset build expects).
 *
 * **emit-bundle** — Refreshes `scripts/automation/generated/` (Metabase model
 * copies + runbook) without touching the database.
 *
 * **all** — `export` then `emit-bundle`.
 *
 * Requires `DATABASE_URL` (or `SUPABASE_DB_URL`) for **export** only.
 * Use a direct or pooler connection with rights to SELECT Phase 1 tables.
 * Do not commit credentials; keep secrets in `.env.local` (gitignored).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');

dotenv.config({ path: path.join(root, '.env.local') });
dotenv.config({ path: path.join(root, '.env') });

const SUBSTANCES_COLUMNS = [
  'id',
  'name',
  'class',
  'mechanism_tag',
  'notes',
  'deprecated',
  'superseded_by',
  'source_schema_version',
  'source_generated_at'
] as const;

const INTERACTIONS_COLUMNS = [
  'pair_key',
  'substance_a_id',
  'substance_b_id',
  'is_self_pair',
  'classification_code',
  'classification_confidence',
  'risk_score',
  'risk_label',
  'headline',
  'mechanism_summary',
  'timing_guidance',
  'field_notes',
  'primary_mechanism_category',
  'mechanism_categories',
  'evidence_gaps',
  'provenance_confidence_tier',
  'provenance_rationale'
] as const;

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'object') {
    return csvCell(JSON.stringify(value));
  }
  const s = String(value);
  if (s === '') return 'NULL';
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowToCsvLine(
  row: Record<string, unknown>,
  cols: readonly string[]
): string {
  return cols.map((c) => csvCell(row[c])).join(',');
}

function getConnectionString(): string {
  const url = process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL ?? '';
  if (!url.trim()) {
    throw new Error(
      'Missing DATABASE_URL or SUPABASE_DB_URL for export. Set in .env.local (not committed).'
    );
  }
  return url;
}

async function exportFromDb(): Promise<void> {
  const pool = new pg.Pool({ connectionString: getConnectionString(), max: 1 });
  try {
    const { rows: sRows } = await pool.query(`
      select
        id,
        name,
        class,
        mechanism_tag,
        notes,
        deprecated,
        superseded_by,
        source_schema_version,
        case
          when source_generated_at is null then null
          else to_char(
            source_generated_at at time zone 'UTC',
            'YYYY-MM-DD HH24:MI:SS.US'
          ) || '+00'
        end as source_generated_at
      from public.substances
      order by id
    `);
    const { rows: iRows } = await pool.query(`
      select
        pair_key,
        substance_a_id,
        substance_b_id,
        is_self_pair,
        classification_code,
        classification_confidence,
        case
          when risk_score is null then null
          else trim(to_char(risk_score, 'FM999999990.009999'))
        end as risk_score,
        risk_label,
        headline,
        mechanism_summary,
        timing_guidance,
        field_notes,
        primary_mechanism_category,
        mechanism_categories::text as mechanism_categories,
        evidence_gaps,
        provenance_confidence_tier,
        provenance_rationale
      from public.interactions
      order by pair_key
    `);

    const substancesPath = path.join(root, 'substances.csv');
    const interactionsPath = path.join(root, 'interactions.csv');

    const sLines = [
      SUBSTANCES_COLUMNS.join(','),
      ...sRows.map((r) => rowToCsvLine(r as Record<string, unknown>, SUBSTANCES_COLUMNS))
    ];
    const iLines = [
      INTERACTIONS_COLUMNS.join(','),
      ...iRows.map((r) => rowToCsvLine(r as Record<string, unknown>, INTERACTIONS_COLUMNS))
    ];

    fs.writeFileSync(substancesPath, sLines.join('\n') + '\n', 'utf8');
    fs.writeFileSync(interactionsPath, iLines.join('\n') + '\n', 'utf8');

    console.log(
      `Wrote ${sRows.length} substances → ${path.relative(root, substancesPath)}`
    );
    console.log(
      `Wrote ${iRows.length} interactions → ${path.relative(root, interactionsPath)}`
    );
  } finally {
    await pool.end();
  }
}

function emitBundle(): void {
  const genDir = path.join(root, 'scripts', 'automation', 'generated');
  fs.mkdirSync(genDir, { recursive: true });

  const metabaseModels = [
    'interactions_enriched.sql',
    'class_interaction_matrix.sql'
  ] as const;

  for (const model of metabaseModels) {
    fs.copyFileSync(
      path.join(root, 'docs', 'metabase', model),
      path.join(genDir, model)
    );
  }

  const legacyV2 = path.join(genDir, 'interactions_enriched_v2.sql');
  if (fs.existsSync(legacyV2)) {
    fs.unlinkSync(legacyV2);
  }

  const rel = (p: string) => path.relative(root, p);
  for (const model of metabaseModels) {
    console.log(`Wrote ${rel(path.join(genDir, model))}`);
  }
  console.log(
    'See docs/automation/SUPABASE_PHASE1_CSV_PIPELINE.md for backup → staging → swap and Metabase guardrails.'
  );
}

function printHelp(): void {
  console.log(`Usage:
  npm run supabase:phase1-csv-pipeline -- export       # DB → repo root CSVs
  npm run supabase:phase1-csv-pipeline -- emit-bundle # refresh generated/ + Metabase SQL copy
  npm run supabase:phase1-csv-pipeline -- all          # export + emit-bundle

Environment (export only):
  DATABASE_URL or SUPABASE_DB_URL — Postgres connection string with SELECT on public.*`);
}

async function main(): Promise<void> {
  const cmd = process.argv[2] ?? 'help';
  if (cmd === 'export') {
    await exportFromDb();
    return;
  }
  if (cmd === 'emit-bundle') {
    emitBundle();
    return;
  }
  if (cmd === 'all') {
    await exportFromDb();
    emitBundle();
    return;
  }
  printHelp();
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
