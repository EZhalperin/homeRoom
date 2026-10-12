-- HomeRoom identities (Supabase / Postgres).
-- Quoted identifiers match the camelCase column names used by the API.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  "userId" varchar not null unique,
  email varchar not null unique,
  password varchar not null,
  role varchar not null check (role in ('admin', 'teacher', 'parent')),
  "firstName" varchar not null,
  "lastName" varchar not null,
  "isActive" boolean not null default true
);

create unique index if not exists users_email_lower_idx on public.users (lower(email));
