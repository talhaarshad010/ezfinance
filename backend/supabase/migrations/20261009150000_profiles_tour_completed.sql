-- Whether the user has finished (or skipped) the app tour shown on their first visit. Stored on
-- the server so the tour shows once per account, not once per device.
alter table public.profiles add column tour_completed boolean not null default false;
