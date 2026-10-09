-- Create a user's profile from their auth metadata if it doesn't exist. Used by the sign-up
-- trigger and by the backend to recreate a profile that is missing (e.g. a row deleted by hand).
-- Unknown values are dropped rather than failing. Google sign-ins provide full_name or name.
create function public.ensure_profile(user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb;
begin
  select coalesce(u.raw_user_meta_data, '{}'::jsonb) into meta from auth.users u where u.id = user_id;
  if not found then
    return;
  end if;

  insert into public.profiles (id, full_name, monthly_income, city, province, filer_status)
  values (
    user_id,
    left(coalesce(nullif(trim(meta ->> 'full_name'), ''), trim(meta ->> 'name'), ''), 100),
    case when meta ->> 'monthly_income' in ('under_25k', '25k_50k', '50k_100k', '100k_150k', '150k_plus')
      then meta ->> 'monthly_income' end,
    left(nullif(trim(meta ->> 'city'), ''), 100),
    case when meta ->> 'province' in ('Punjab', 'Sindh', 'KPK', 'Balochistan', 'ICT', 'AJK', 'GB')
      then meta ->> 'province' end,
    case when meta ->> 'filer_status' in ('filer', 'non_filer', 'unsure')
      then meta ->> 'filer_status' else 'unsure' end
  )
  on conflict (id) do nothing;
end;
$$;

revoke execute on function public.ensure_profile(uuid) from public, anon, authenticated;

-- The sign-up trigger now shares the same logic.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.ensure_profile(new.id);
  return new;
end;
$$;
