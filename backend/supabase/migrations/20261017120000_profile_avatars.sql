-- Profile photos. Files live in a private Storage bucket; the profile row stores only the file's
-- path inside it (e.g. "<user id>/<random>.jpg"). Only the backend reads and writes the bucket
-- (with the project's secret key) and hands the app short-lived signed URLs. No storage.objects
-- policies are added, so the public Storage API can't list, read or upload anything here.

alter table public.profiles add column if not exists avatar_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
