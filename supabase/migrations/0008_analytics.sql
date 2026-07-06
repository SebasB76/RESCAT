create table sales_kpi (
  id uuid primary key default gen_random_uuid(),
  "storeId" uuid references store(id) on delete cascade,
  "ventasTotal" numeric(12,2) not null default 0,
  "gananciaTotal" numeric(12,2) not null default 0,
  "nPedidos" int not null default 0,
  "nClientes" int not null default 0
);

create table category_sales (
  id uuid primary key default gen_random_uuid(),
  "storeId" uuid references store(id) on delete cascade,
  category text not null,
  sales numeric(12,2) not null default 0,
  profit numeric(12,2) not null default 0,
  qty int not null default 0
);

create table monthly_sales (
  id uuid primary key default gen_random_uuid(),
  "storeId" uuid references store(id) on delete cascade,
  month text not null,
  sales numeric(12,2) not null default 0,
  profit numeric(12,2) not null default 0
);

create table top_product (
  id uuid primary key default gen_random_uuid(),
  "storeId" uuid references store(id) on delete cascade,
  rank int not null,
  name text not null,
  brand text,
  sales numeric(12,2) not null default 0,
  profit numeric(12,2) not null default 0,
  qty int not null default 0
);

create table basket_rule (
  id uuid primary key default gen_random_uuid(),
  "storeId" uuid references store(id) on delete cascade,
  a text not null,
  b text not null,
  "catA" text,
  "catB" text,
  freq int not null default 0,
  "confAB" numeric(6,1) not null default 0,
  "confBA" numeric(6,1) not null default 0,
  lift numeric(6,2) not null default 0
);

create index on category_sales ("storeId");
create index on monthly_sales ("storeId");
create index on top_product ("storeId");
create index on basket_rule ("storeId");

alter table sales_kpi enable row level security;
alter table category_sales enable row level security;
alter table monthly_sales enable row level security;
alter table top_product enable row level security;
alter table basket_rule enable row level security;

create policy "sales_kpi merchant read" on sales_kpi for select using (
  ("storeId" is null and exists (select 1 from profile p where p.id = auth.uid() and p.role = 'merchant'))
  or exists (select 1 from store s where s.id = sales_kpi."storeId" and s."ownerId" = auth.uid()));
create policy "category_sales merchant read" on category_sales for select using (
  ("storeId" is null and exists (select 1 from profile p where p.id = auth.uid() and p.role = 'merchant'))
  or exists (select 1 from store s where s.id = category_sales."storeId" and s."ownerId" = auth.uid()));
create policy "monthly_sales merchant read" on monthly_sales for select using (
  ("storeId" is null and exists (select 1 from profile p where p.id = auth.uid() and p.role = 'merchant'))
  or exists (select 1 from store s where s.id = monthly_sales."storeId" and s."ownerId" = auth.uid()));
create policy "top_product merchant read" on top_product for select using (
  ("storeId" is null and exists (select 1 from profile p where p.id = auth.uid() and p.role = 'merchant'))
  or exists (select 1 from store s where s.id = top_product."storeId" and s."ownerId" = auth.uid()));
create policy "basket_rule merchant read" on basket_rule for select using (
  ("storeId" is null and exists (select 1 from profile p where p.id = auth.uid() and p.role = 'merchant'))
  or exists (select 1 from store s where s.id = basket_rule."storeId" and s."ownerId" = auth.uid()));

grant select on sales_kpi, category_sales, monthly_sales, top_product, basket_rule to authenticated;
