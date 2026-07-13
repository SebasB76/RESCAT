create table box_item (
  id uuid primary key default gen_random_uuid(),
  "boxId" uuid not null references box(id) on delete cascade,
  "productId" uuid not null references product(id) on delete cascade,
  qty int not null default 1 check (qty > 0),
  "createdAt" timestamptz not null default now(),
  unique ("boxId", "productId")
);
create index on box_item ("boxId");
create index on box_item ("productId");

alter table box_item enable row level security;

create policy "box_item public read" on box_item for select using (true);

create policy "box_item owner write" on box_item for all
  using (
    exists (
      select 1 from box b join store s on s.id = b."storeId"
      where b.id = box_item."boxId" and s."ownerId" = auth.uid()
    )
    and exists (select 1 from profile p where p.id = auth.uid() and p.role = 'merchant')
  )
  with check (
    exists (
      select 1 from box b join store s on s.id = b."storeId"
      where b.id = box_item."boxId" and s."ownerId" = auth.uid()
    )
    and exists (select 1 from profile p where p.id = auth.uid() and p.role = 'merchant')
    and exists (
      select 1 from product pr join store s on s.id = pr."storeId"
      where pr.id = box_item."productId" and s."ownerId" = auth.uid()
    )
  );

grant select on box_item to anon, authenticated;
grant insert, update, delete on box_item to authenticated;
