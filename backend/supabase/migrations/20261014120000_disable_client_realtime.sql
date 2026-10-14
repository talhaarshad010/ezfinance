-- Undo 20261011163000_enable_realtime.sql: the app no longer connects to Supabase directly.
-- Live sync now goes through the API (GET /api/sync WebSocket), so app users don't need any
-- table access. Back to: only the backend (connected as postgres) can read or write user data.

-- 1. Stop broadcasting these tables over Supabase Realtime
do $$
declare
  t text;
begin
  foreach t in array array['transactions', 'bank_accounts', 'transfers', 'recurring_bills', 'loans', 'goals'] loop
    if exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime drop table public.%I', t);
    end if;
  end loop;
end $$;

-- 2. Remove the per-user read policies
drop policy if exists "Users can select own transactions" on public.transactions;
drop policy if exists "Users can select own bank_accounts" on public.bank_accounts;
drop policy if exists "Users can select own transfers" on public.transfers;
drop policy if exists "Users can select own recurring_bills" on public.recurring_bills;
drop policy if exists "Users can select own loans" on public.loans;
drop policy if exists "Users can select own goals" on public.goals;

-- 3. Revoke the read grants (RLS stays enabled with no policies)
revoke select on table public.transactions from authenticated;
revoke select on table public.bank_accounts from authenticated;
revoke select on table public.transfers from authenticated;
revoke select on table public.recurring_bills from authenticated;
revoke select on table public.loans from authenticated;
revoke select on table public.goals from authenticated;
