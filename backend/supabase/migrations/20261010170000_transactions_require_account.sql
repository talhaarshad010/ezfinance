-- Every transaction belongs to one of the user's linked bank accounts (no Cash). Accounts are
-- only ever soft-deleted, so the link must never be dropped: restrict hard deletes.
alter table public.transactions drop constraint transactions_account_id_fkey;
alter table public.transactions alter column account_id set not null;
alter table public.transactions
  add constraint transactions_account_id_fkey
  foreign key (account_id) references public.bank_accounts (id) on delete restrict;
