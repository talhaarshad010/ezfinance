-- Profiles: one row per auth user, holding the details collected at sign-up.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 100),
  monthly_income text check (monthly_income in ('under_25k', '25k_50k', '50k_100k', '100k_150k', '150k_plus')),
  city text check (char_length(city) <= 100),
  province text check (province in ('Punjab', 'Sindh', 'KPK', 'Balochistan', 'ICT', 'AJK', 'GB')),
  filer_status text not null default 'unsure' check (filer_status in ('filer', 'non_filer', 'unsure')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Only the backend reads and writes profiles (it connects as postgres, which bypasses RLS).
-- RLS with no policies plus revoked grants keeps the public Data API locked out.
alter table public.profiles enable row level security;
revoke all on table public.profiles from anon, authenticated;

-- Create the profile from the metadata sent with the sign-up request. Unknown values are
-- dropped rather than failing the sign-up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, full_name, monthly_income, city, province, filer_status)
  values (
    new.id,
    left(coalesce(trim(meta ->> 'full_name'), ''), 100),
    case when meta ->> 'monthly_income' in ('under_25k', '25k_50k', '50k_100k', '100k_150k', '150k_plus')
      then meta ->> 'monthly_income' end,
    left(nullif(trim(meta ->> 'city'), ''), 100),
    case when meta ->> 'province' in ('Punjab', 'Sindh', 'KPK', 'Balochistan', 'ICT', 'AJK', 'GB')
      then meta ->> 'province' end,
    case when meta ->> 'filer_status' in ('filer', 'non_filer', 'unsure')
      then meta ->> 'filer_status' else 'unsure' end
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
