-- Phase 1: snapshot current live tables before CSV reload (Supabase SQL editor).
-- Safe to re-run: replaces prior backup tables in public schema.

begin;

drop table if exists public._phase1_backup_interactions;
drop table if exists public._phase1_backup_substances;

create table public._phase1_backup_interactions as
select * from public.interactions;

create table public._phase1_backup_substances as
select * from public.substances;

commit;
