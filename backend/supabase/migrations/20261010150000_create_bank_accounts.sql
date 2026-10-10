-- Bank accounts and wallets a user links, owned by their auth user. The app creates the id (a
-- UUID) so a retried save never duplicates a row. Only the last 4 digits of the account number
-- are kept. The balance isn't stored: it's opening_balance plus the account's transactions.
create table public.bank_accounts (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Bank from the app's list of Pakistani banks (e.g. 'meezan'), and its display name.
  bank_id text not null check (char_length(bank_id) between 1 and 40),
  bank_name text not null check (char_length(bank_name) between 1 and 60),
  account_title text not null check (char_length(account_title) between 1 and 60),
  account_last4 text not null check (account_last4 ~ '^[0-9]{4}$'),
  -- What the account held when it was added (or as set by "Update balance").
  opening_balance numeric(16, 2) not null default 0 check (abs(opening_balance) <= 100000000000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Soft delete: the account's transactions keep pointing at it.
  deleted_at timestamptz
);

create index bank_accounts_user_idx on public.bank_accounts (user_id) where deleted_at is null;

alter table public.bank_accounts enable row level security;
revoke all on table public.bank_accounts from anon, authenticated;

-- Transactions now reference the account they moved through; no account means Cash.
alter table public.transactions drop column account;
alter table public.transactions
  add column account_id uuid references public.bank_accounts (id) on delete set null;
create index transactions_account_idx on public.transactions (account_id) where deleted_at is null;
