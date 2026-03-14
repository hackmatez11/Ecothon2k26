-- Migration: Add officer assignment fields to complaints table

alter table complaints
  add column if not exists location text,
  add column if not exists assigned_officer_id uuid references officers(id),
  add column if not exists assigned_officer_name text,
  add column if not exists assignment_reason text;
