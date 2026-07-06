create table product (
  id uuid primary key default gen_random_uuid(),
  "storeId" uuid not null references store(id) on delete cascade,
  name text not null,
  brand text,
  category text,
  subcategory text,
  cost numeric(10,2),
  price numeric(10,2) not null,
  "photoUrl" text,
  "createdAt" timestamptz not null default now(),
  unique ("storeId", name)
);
create index on product ("storeId");
create index on product (category);

create table lot (
  id uuid primary key default gen_random_uuid(),
  "productId" uuid not null references product(id) on delete cascade,
  "storeId" uuid not null references store(id) on delete cascade,
  qty int not null default 0 check (qty >= 0),
  "unitCost" numeric(10,2) not null default 0,
  price numeric(10,2) not null default 0,
  "expiryDate" date not null,
  "receivedAt" date not null default current_date,
  "createdAt" timestamptz not null default now()
);
create index on lot ("storeId");
create index on lot ("productId");
create index on lot ("expiryDate");

alter table product enable row level security;
alter table lot enable row level security;

create policy "product public read" on product for select using (true);
create policy "product owner write" on product for all
  using (exists (select 1 from store s where s.id = product."storeId" and s."ownerId" = auth.uid()))
  with check (exists (select 1 from store s where s.id = product."storeId" and s."ownerId" = auth.uid()));

create policy "lot owner all" on lot for all
  using (exists (select 1 from store s where s.id = lot."storeId" and s."ownerId" = auth.uid()))
  with check (exists (select 1 from store s where s.id = lot."storeId" and s."ownerId" = auth.uid()));

grant select on product to anon, authenticated;
grant insert, update, delete on product to authenticated;
grant select, insert, update, delete on lot to authenticated;
