-- Savings goals, their contributions, the monthly budget and its envelopes, each owned by its auth
-- user. Ids come from the app (UUIDs) so retries never duplicate a row. Deletes are soft. Like the
-- other tables, only the backend reads and writes them.

-- Savings goals. What's saved is the sum of the goal's contributions.
create table public.goals (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  target numeric(16, 2) not null check (target > 0 and target <= 100000000000),
  deadline date,
  icon text check (char_length(icon) <= 40),
  paused boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index goals_user_idx on public.goals (user_id) where deleted_at is null;

-- Money put towards a goal. Negative amounts are withdrawals.
create table public.goal_contributions (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid not null references public.goals (id) on delete cascade,
  amount numeric(16, 2) not null check (amount <> 0 and abs(amount) <= 100000000000),
  occurred_on date not null,
  created_at timestamptz not null default now()
);
create index goal_contributions_goal_idx on public.goal_contributions (goal_id);

-- The user's monthly spending limit (one row per user).
create table public.budgets (
  user_id uuid primary key references auth.users (id) on delete cascade,
  monthly_limit numeric(16, 2) not null check (monthly_limit > 0 and monthly_limit <= 100000000000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Envelopes: monthly caps per spending category. Spending in the transaction category with the
-- same name counts against the envelope.
create table public.budget_envelopes (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  icon text not null default 'package' check (char_length(icon) <= 40),
  color text not null default '#0047AB' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  monthly_limit numeric(16, 2) not null check (monthly_limit > 0 and monthly_limit <= 100000000000),
  is_main boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index budget_envelopes_user_idx on public.budget_envelopes (user_id) where deleted_at is null;
-- One live envelope per name, so spending is never counted twice.
create unique index budget_envelopes_user_name_idx
  on public.budget_envelopes (user_id, lower(name)) where deleted_at is null;

alter table public.goals enable row level security;
alter table public.goal_contributions enable row level security;
alter table public.budgets enable row level security;
alter table public.budget_envelopes enable row level security;
revoke all on table public.goals, public.goal_contributions, public.budgets, public.budget_envelopes
  from anon, authenticated;
