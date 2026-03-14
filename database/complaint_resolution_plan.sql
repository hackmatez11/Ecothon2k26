-- Migration: Add resolution plan fields to complaints table

alter table complaints
  add column if not exists resolution_plan text,
  add column if not exists resolution_steps jsonb,
  add column if not exists expected_timeline text,
  add column if not exists plan_generated_at timestamptz,
  add column if not exists plan_generated_by text;
