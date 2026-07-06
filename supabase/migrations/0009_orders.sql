create table purchase (
  id uuid primary key default gen_random_uuid(),
  "customerId" uuid not null references profile(id) on delete cascade,
  "storeId" uuid not null references store(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'paid', 'pickedUp', 'cancelled')),
  "paymentMethod" payment_method not null,
  code text not null unique,
  total numeric(10,2) not null default 0,
  "createdAt" timestamptz not null default now()
);
create index on purchase ("customerId");
create index on purchase ("storeId");

create table purchase_item (
  id uuid primary key default gen_random_uuid(),
  "purchaseId" uuid not null references purchase(id) on delete cascade,
  "productId" uuid not null references product(id) on delete cascade,
  qty int not null check (qty > 0),
  price numeric(10,2) not null
);
create index on purchase_item ("purchaseId");

alter table purchase enable row level security;
alter table purchase_item enable row level security;

create policy "purchase read own or merchant" on purchase for select
  using ("customerId" = auth.uid()
    or exists (select 1 from store s where s.id = purchase."storeId" and s."ownerId" = auth.uid()));
create policy "purchase insert own" on purchase for insert
  with check ("customerId" = auth.uid());
create policy "purchase update own or merchant" on purchase for update
  using ("customerId" = auth.uid()
    or exists (select 1 from store s where s.id = purchase."storeId" and s."ownerId" = auth.uid()));

create policy "purchase_item read via purchase" on purchase_item for select
  using (exists (select 1 from purchase p where p.id = purchase_item."purchaseId"
    and (p."customerId" = auth.uid()
      or exists (select 1 from store s where s.id = p."storeId" and s."ownerId" = auth.uid()))));
create policy "purchase_item insert own" on purchase_item for insert
  with check (exists (select 1 from purchase p where p.id = purchase_item."purchaseId" and p."customerId" = auth.uid()));

grant select, insert, update on purchase to authenticated;
grant select, insert on purchase_item to authenticated;
