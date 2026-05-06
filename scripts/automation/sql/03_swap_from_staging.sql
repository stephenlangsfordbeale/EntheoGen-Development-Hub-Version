-- Phase 1: replace live tables from staging (after CSV import into staging).
-- Prerequisites: 02_staging_ddl_and_helper.sql applied; both staging tables populated.

begin;

truncate table public.interactions;
truncate table public.substances;

insert into public.substances (
  id,
  name,
  class,
  mechanism_tag,
  notes,
  deprecated,
  superseded_by,
  source_schema_version,
  source_generated_at
)
select
  nullif(trim(s.id), '') as id,
  nullif(trim(s.name), '') as name,
  nullif(trim(s.class), 'NULL') as class,
  nullif(trim(s.mechanism_tag), 'NULL') as mechanism_tag,
  nullif(trim(s.notes), 'NULL') as notes,
  lower(coalesce(nullif(trim(s.deprecated), 'NULL'), 'false')) in ('true', 't', '1') as deprecated,
  nullif(trim(s.superseded_by), 'NULL') as superseded_by,
  nullif(trim(s.source_schema_version), 'NULL') as source_schema_version,
  nullif(trim(s.source_generated_at), 'NULL')::timestamptz as source_generated_at
from public._staging_substances_csv s
order by
  case when nullif(trim(s.superseded_by), 'NULL') is null then 0 else 1 end,
  s.id;

insert into public.interactions (
  pair_key,
  substance_a_id,
  substance_b_id,
  is_self_pair,
  classification_code,
  classification_confidence,
  risk_score,
  risk_label,
  headline,
  mechanism_summary,
  timing_guidance,
  field_notes,
  primary_mechanism_category,
  mechanism_categories,
  evidence_gaps,
  provenance_confidence_tier,
  provenance_rationale
)
select
  nullif(trim(i.pair_key), '') as pair_key,
  nullif(trim(i.substance_a_id), '') as substance_a_id,
  nullif(trim(i.substance_b_id), '') as substance_b_id,
  lower(coalesce(nullif(trim(i.is_self_pair), 'NULL'), 'false')) in ('true', 't', '1') as is_self_pair,
  nullif(trim(i.classification_code), 'NULL') as classification_code,
  nullif(trim(i.classification_confidence), 'NULL') as classification_confidence,
  case
    when nullif(trim(i.risk_score), 'NULL') is null then null
    else trim(i.risk_score)::numeric
  end as risk_score,
  nullif(trim(i.risk_label), 'NULL') as risk_label,
  nullif(trim(i.headline), 'NULL') as headline,
  nullif(trim(i.mechanism_summary), 'NULL') as mechanism_summary,
  nullif(trim(i.timing_guidance), 'NULL') as timing_guidance,
  nullif(trim(i.field_notes), 'NULL') as field_notes,
  nullif(trim(i.primary_mechanism_category), 'NULL') as primary_mechanism_category,
  public._staging_mechanism_categories_to_jsonb(i.mechanism_categories) as mechanism_categories,
  nullif(trim(i.evidence_gaps), 'NULL') as evidence_gaps,
  nullif(trim(i.provenance_confidence_tier), 'NULL') as provenance_confidence_tier,
  nullif(trim(i.provenance_rationale), 'NULL') as provenance_rationale
from public._staging_interactions_csv i;

commit;
