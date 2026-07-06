insert into storage.buckets (id, name, public) values ('box-photos', 'box-photos', true) on conflict (id) do nothing;
drop policy if exists "box_photos_read" on storage.objects;
create policy "box_photos_read" on storage.objects for select using (bucket_id = 'box-photos');
drop policy if exists "box_photos_insert" on storage.objects;
create policy "box_photos_insert" on storage.objects for insert to authenticated with check (bucket_id = 'box-photos');
