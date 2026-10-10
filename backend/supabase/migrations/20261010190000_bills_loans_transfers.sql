-- Repeated bills, loans and transfers, each owned by its auth user. Ids come from the app (UUIDs)
-- so retries never duplicate a row. Deletes are soft (deleted_at). Like the other tables, only the
-- backend reads and writes them.

-- Repeated bills: paid every month from one of the user's linked accounts. Marking one paid logs
-- an expense transaction in that account and records the day in last_paid_on.
create table public.recurring_bills (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.bank_accounts (id) on delete restrict,
  name text not null check (char_length(name) between 1 and 60),
  amount numeric(14, 2) not null check (amount > 0 and amount <= 1000000000),
  category text not null default 'Bills'
    check (category in ('Groceries', 'Fuel', 'Salary', 'Bills', 'Dining', 'Other')),
  due_day smallint not null check (due_day between 1 and 31),
  remind_days_before smallint not null default 3 check (remind_days_before between 0 and 14),
  last_paid_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index recurring_bills_user_idx on public.recurring_bills (user_id) where deleted_at is null;

-- Loans and other debts the user is paying off.
create table public.loans (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  lender text not null default '' check (char_length(lender) <= 60),
  total_amount numeric(16, 2) not null check (total_amount > 0 and total_amount <= 100000000000),
  remaining numeric(16, 2) not null check (remaining >= 0 and remaining <= total_amount),
  interest_rate numeric(5, 2) not null default 0 check (interest_rate between 0 and 100),
  emi numeric(14, 2) not null default 0 check (emi >= 0),
  due_day smallint not null check (due_day between 1 and 31),
  remind_days_before smallint not null default 3 check (remind_days_before between 0 and 14),
  remind_on_due boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index loans_user_idx on public.loans (user_id) where deleted_at is null;

-- Money moved between two of the user's own accounts. Not income or spending: it lowers one
-- account's balance and raises the other's, so net worth stays the same.
create table public.transfers (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  from_account_id uuid not null references public.bank_accounts (id) on delete restrict,
  to_account_id uuid not null references public.bank_accounts (id) on delete restrict,
  amount numeric(14, 2) not null check (amount > 0 and amount <= 1000000000),
  note text check (char_length(note) <= 60),
  occurred_on date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (from_account_id <> to_account_id)
);
create index transfers_user_idx on public.transfers (user_id, occurred_on desc) where deleted_at is null;

alter table public.recurring_bills enable row level security;
alter table public.loans enable row level security;
alter table public.transfers enable row level security;
revoke all on table public.recurring_bills, public.loans, public.transfers from anon, authenticated;
