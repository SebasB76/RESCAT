alter table profile enable row level security;
alter table store enable row level security;
alter table box enable row level security;
alter table reservation enable row level security;
alter table review enable row level security;

create policy "profile self read" on profile for select using (auth.uid() = id);
create policy "profile self insert" on profile for insert with check (auth.uid() = id);
create policy "profile self update" on profile for update using (auth.uid() = id);

create policy "store public read" on store for select using (true);
create policy "store owner write" on store for all
  using ("ownerId" = auth.uid()) with check ("ownerId" = auth.uid());

create policy "box public read" on box for select using (true);
create policy "box owner write" on box for all
  using (exists (select 1 from store s where s.id = box."storeId" and s."ownerId" = auth.uid()))
  with check (exists (select 1 from store s where s.id = box."storeId" and s."ownerId" = auth.uid()));

create policy "reservation read own or merchant" on reservation for select
  using ("customerId" = auth.uid()
    or exists (select 1 from box b join store s on s.id = b."storeId"
               where b.id = reservation."boxId" and s."ownerId" = auth.uid()));
create policy "reservation merchant update" on reservation for update
  using (exists (select 1 from box b join store s on s.id = b."storeId"
                 where b.id = reservation."boxId" and s."ownerId" = auth.uid()));

create policy "review public read" on review for select using (true);
create policy "review verified insert" on review for insert
  with check ("customerId" = auth.uid()
    and exists (select 1 from reservation r where r.id = review."reservationId"
                and r."customerId" = auth.uid() and r.status = 'pickedUp'));
