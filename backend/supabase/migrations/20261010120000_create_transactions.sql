-- Transactions: every income and expense a user logs. One row per transaction, owned by the
-- auth user it belongs to. The app creates the id (a UUID) so a save can be retried, or replayed
-- from the offline queue, without creating a duplicate.
create table public.transactions (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('expense', 'income')),
  -- Always positive; `type` says which way the money moved.
  amount numeric(14, 2) not null check (amount > 0 and amount <= 1000000000),
  category text not null check (category in ('Groceries', 'Fuel', 'Salary', 'Bills', 'Dining', 'Other')),
  note text check (char_length(note) <= 60),
  -- Account label as the user picked it (e.g. 'Cash', 'Meezan ••4521'). Becomes a reference to
  -- a bank accounts table when accounts move to the database.
  account text check (char_length(account) <= 60),
  -- The day the money moved, as the user picked it (no time zone shifts).
  occurred_on date not null,
  source text not null default 'manual' check (source in ('manual', 'scan', 'import')),
  -- Left out of budget and spending totals (e.g. a reimbursed expense).
  exclude_from_budget boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Soft delete: set when the user deletes, cleared again by Undo.
  deleted_at timestamptz
);

-- Lists are read per user, newest first, skipping deleted rows.
create index transactions_user_occurred_idx
  on public.transactions (user_id, occurred_on desc, created_at desc)
  where deleted_at is null;

-- Only the backend reads and writes transactions (it connects as postgres, which bypasses RLS).
-- RLS with no policies plus revoked grants keeps the public Data API locked out.
alter table public.transactions enable row level security;
revoke all on table public.transactions from anon, authenticated;
