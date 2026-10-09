-- Whether the user has chosen a password. Supabase gives accounts created with an emailed code
-- (passwordless sign-up) a random password, so auth.users.encrypted_password can't tell us whether
-- the user can actually log in with one. The backend sets this flag when a password is chosen:
-- sign-up password step, set-password, forgot-password reset, or a successful password login.
alter table public.profiles add column has_password boolean not null default false;
