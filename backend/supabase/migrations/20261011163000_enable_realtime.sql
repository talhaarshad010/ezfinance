-- Enable Supabase Realtime for client-side WebSocket subscriptions
-- 1. Grant SELECT to authenticated users (INSERT/UPDATE/DELETE remain revoked; writes must go through C# API)
grant select on table public.transactions to authenticated;
grant select on table public.bank_accounts to authenticated;
grant select on table public.transfers to authenticated;
grant select on table public.recurring_bills to authenticated;
grant select on table public.loans to authenticated;
grant select on table public.goals to authenticated;

-- 2. RLS SELECT policies so Realtime only pushes each user's own data
drop policy if exists "Users can select own transactions" on public.transactions;
create policy "Users can select own transactions" on public.transactions
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can select own bank_accounts" on public.bank_accounts;
create policy "Users can select own bank_accounts" on public.bank_accounts
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can select own transfers" on public.transfers;
create policy "Users can select own transfers" on public.transfers
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can select own recurring_bills" on public.recurring_bills;
create policy "Users can select own recurring_bills" on public.recurring_bills
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can select own loans" on public.loans;
create policy "Users can select own loans" on public.loans
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can select own goals" on public.goals;
create policy "Users can select own goals" on public.goals
  for select to authenticated using (auth.uid() = user_id);

-- 3. Add tables to the supabase_realtime publication
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'transactions') then
    alter publication supabase_realtime add table public.transactions;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'bank_accounts') then
    alter publication supabase_realtime add table public.bank_accounts;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'transfers') then
    alter publication supabase_realtime add table public.transfers;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'recurring_bills') then
    alter publication supabase_realtime add table public.recurring_bills;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'loans') then
    alter publication supabase_realtime add table public.loans;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'goals') then
    alter publication supabase_realtime add table public.goals;
  end if;
end $$;
