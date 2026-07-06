revoke update on public.profile from anon, authenticated;
grant update ("fullName", phone) on public.profile to anon, authenticated;

drop policy if exists "store owner write" on store;
create policy "store owner write" on store for all
  using ("ownerId" = auth.uid() and exists (select 1 from profile p where p.id = auth.uid() and p.role = 'merchant'))
  with check ("ownerId" = auth.uid() and exists (select 1 from profile p where p.id = auth.uid() and p.role = 'merchant'));

drop policy if exists "box owner write" on box;
create policy "box owner write" on box for all
  using (exists (select 1 from store s where s.id = box."storeId" and s."ownerId" = auth.uid())
         and exists (select 1 from profile p where p.id = auth.uid() and p.role = 'merchant'))
  with check (exists (select 1 from store s where s.id = box."storeId" and s."ownerId" = auth.uid())
              and exists (select 1 from profile p where p.id = auth.uid() and p.role = 'merchant'));
