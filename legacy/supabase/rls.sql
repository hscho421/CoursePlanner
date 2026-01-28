
create schema if not exists public;

-- GPA table
alter table if exists public.gpa_raw enable row level security;
grant select on table public.gpa_raw to anon;
drop policy if exists "public read gpa_raw" on public.gpa_raw;
create policy "public read gpa_raw"
  on public.gpa_raw
  for select
  using (true);

-- View for frontend-friendly column names (run after view exists)
-- grant select on table public.gpa_raw_public to anon;
-- drop policy if exists "public read gpa_raw_public" on public.gpa_raw_public;
-- create policy "public read gpa_raw_public"
--   on public.gpa_raw_public
--   for select
--   using (true);

-- Courses table (run after table exists)
alter table public.courses enable row level security;
grant select on table public.courses to anon;
drop policy if exists "public read courses" on public.courses;
create policy "public read courses"
  on public.courses
  for select
  using (true);

-- Majors table (run after table exists)
-- alter table public."Majors" enable row level security;
-- grant select on table public."Majors" to anon;
-- drop policy if exists "public read majors" on public."Majors";
-- create policy "public read majors"
--   on public."Majors"
--   for select
--   using (true);
