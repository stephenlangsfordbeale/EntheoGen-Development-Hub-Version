-- Phase 1: text staging tables + mechanism_categories helper (run once per environment).
-- After this: import workspace-root substances.csv and interactions.csv into the staging
-- tables via Table Editor (Import), then run 03_swap_from_staging.sql.

drop table if exists public._staging_interactions_csv cascade;
drop table if exists public._staging_substances_csv cascade;
drop function if exists public._staging_mechanism_categories_to_jsonb(text);

create table public._staging_substances_csv (
  id text,
  name text,
  class text,
  mechanism_tag text,
  notes text,
  deprecated text,
  superseded_by text,
  source_schema_version text,
  source_generated_at text
);

create table public._staging_interactions_csv (
  pair_key text,
  substance_a_id text,
  substance_b_id text,
  is_self_pair text,
  classification_code text,
  classification_confidence text,
  risk_score text,
  risk_label text,
  headline text,
  mechanism_summary text,
  timing_guidance text,
  field_notes text,
  primary_mechanism_category text,
  mechanism_categories text,
  evidence_gaps text,
  provenance_confidence_tier text,
  provenance_rationale text
);

create or replace function public._staging_mechanism_categories_to_jsonb(p text)
returns jsonb
language sql
immutable
as $$
  select case
    when p is null
      or upper(btrim(p)) = 'NULL'
      or btrim(p) = ''
      or btrim(p) = '[]'
      then '[]'::jsonb
    when btrim(p) ~ '^\[[[:space:]]*"' then btrim(p)::jsonb
    else coalesce(
      (
        select jsonb_agg(to_jsonb(nullif(trim(t.x), '')) order by t.ord)
        from regexp_split_to_table(
          substring(btrim(p) from '^\[(.*)\]$'),
          '[[:space:]]+'
        ) with ordinality as t(x, ord)
        where nullif(trim(t.x), '') is not null
      ),
      '[]'::jsonb
    )
  end;
$$;
