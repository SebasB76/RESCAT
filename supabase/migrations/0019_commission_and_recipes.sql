alter table reservation
  add column "subtotal" numeric(10,2),
  add column "commissionRate" numeric(6,5),
  add column "commissionAmount" numeric(10,2),
  add column "total" numeric(10,2);

update reservation
set
  "subtotal" = amount,
  "commissionRate" = 0,
  "commissionAmount" = 0,
  "total" = amount;

alter table reservation
  alter column "subtotal" set not null,
  alter column "commissionRate" set not null,
  alter column "commissionAmount" set not null,
  alter column "total" set not null,
  add constraint reservation_commission_rate_check check ("commissionRate" between 0 and 1),
  add constraint reservation_commission_amount_check check ("commissionAmount" >= 0),
  add constraint reservation_total_check check ("total" = round("subtotal" + "commissionAmount", 2));

create table reservation_item (
  id uuid primary key default gen_random_uuid(),
  "reservationId" uuid not null references reservation(id) on delete cascade,
  "productId" uuid references product(id) on delete set null,
  name text not null,
  brand text,
  category text,
  qty int not null default 1 check (qty > 0),
  "createdAt" timestamptz not null default now()
);

create index reservation_item_reservationId_idx on reservation_item ("reservationId");

create table reservation_recipe (
  id uuid primary key default gen_random_uuid(),
  "reservationId" uuid not null unique references reservation(id) on delete cascade,
  "customerId" uuid not null references profile(id) on delete cascade,
  title text not null,
  description text not null,
  servings int not null check (servings between 1 and 12),
  "totalMinutes" int not null check ("totalMinutes" between 1 and 1440),
  ingredients jsonb not null,
  steps jsonb not null,
  "storageTips" text[] not null default '{}',
  "safetyNote" text not null,
  model text not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index reservation_recipe_customerId_idx on reservation_recipe ("customerId");

alter table reservation_item enable row level security;
alter table reservation_recipe enable row level security;

create policy "reservation item customer read" on reservation_item for select
  using (
    exists (
      select 1 from reservation r
      where r.id = reservation_item."reservationId"
        and r."customerId" = auth.uid()
    )
  );

create policy "reservation item merchant read" on reservation_item for select
  using (
    exists (
      select 1
      from reservation r
      join box b on b.id = r."boxId"
      join store s on s.id = b."storeId"
      where r.id = reservation_item."reservationId"
        and s."ownerId" = auth.uid()
    )
  );

create policy "recipe customer read" on reservation_recipe for select
  using ("customerId" = auth.uid());

create policy "recipe customer insert" on reservation_recipe for insert
  with check (
    "customerId" = auth.uid()
    and exists (
      select 1 from reservation r
      where r.id = reservation_recipe."reservationId"
        and r."customerId" = auth.uid()
    )
  );

create policy "recipe customer update" on reservation_recipe for update
  using ("customerId" = auth.uid())
  with check (
    "customerId" = auth.uid()
    and exists (
      select 1 from reservation r
      where r.id = reservation_recipe."reservationId"
        and r."customerId" = auth.uid()
    )
  );

grant select on reservation_item to authenticated;
grant select, insert, update on reservation_recipe to authenticated;

insert into reservation_item ("reservationId", "productId", name, brand, category, qty)
select r.id, bi."productId", p.name, p.brand, p.category, bi.qty
from reservation r
join box_item bi on bi."boxId" = r."boxId"
join product p on p.id = bi."productId";

insert into reservation_item ("reservationId", name, qty)
select r.id, item.name, 1
from reservation r
join box b on b.id = r."boxId"
cross join lateral unnest(b.items) as item(name)
where not exists (
  select 1 from reservation_item ri where ri."reservationId" = r.id
);

create or replace function reserve_box(
  p_box_id uuid, p_customer_id uuid, p_payment_method payment_method
) returns reservation
language plpgsql security definer
set search_path = public as $$
declare
  v_box public.box;
  v_reservation reservation;
  v_code text;
  v_status reservation_status;
  v_rate numeric(6,5) := 0.07;
  v_commission numeric(10,2);
  v_total numeric(10,2);
begin
  if auth.uid() is not null and auth.uid() <> p_customer_id then
    raise exception 'forbidden';
  end if;

  select * into v_box from box where id = p_box_id for update;
  if not found then raise exception 'box_not_found'; end if;
  if v_box.status <> 'active' or v_box."stockQty" < 1 or v_box."pickupEnd" <= now() then
    raise exception 'out_of_stock';
  end if;

  v_commission := round(v_box.price * v_rate, 2);
  v_total := round(v_box.price + v_commission, 2);

  update box set
    "stockQty" = "stockQty" - 1,
    status = case when "stockQty" - 1 = 0 then 'soldOut'::box_status else status end
  where id = p_box_id;

  v_code := 'RC-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
  v_status := case when p_payment_method = 'cardMock' then 'paid'::reservation_status else 'reserved'::reservation_status end;

  insert into reservation (
    "boxId", "customerId", code, "paymentMethod", status, amount, "expiresAt",
    "subtotal", "commissionRate", "commissionAmount", "total"
  )
  values (
    p_box_id, p_customer_id, v_code, p_payment_method, v_status, v_box.price, v_box."pickupEnd",
    v_box.price, v_rate, v_commission, v_total
  )
  returning * into v_reservation;

  insert into reservation_item ("reservationId", "productId", name, brand, category, qty)
  select v_reservation.id, bi."productId", p.name, p.brand, p.category, bi.qty
  from box_item bi
  join product p on p.id = bi."productId"
  where bi."boxId" = p_box_id;

  if not found then
    insert into reservation_item ("reservationId", name, qty)
    select v_reservation.id, item.name, 1
    from unnest(v_box.items) as item(name);
  end if;

  return v_reservation;
end; $$;

drop function if exists store_reservations();

create function store_reservations()
returns table (
  id uuid,
  code text,
  status reservation_status,
  amount numeric,
  "commissionAmount" numeric,
  total numeric,
  "paymentMethod" payment_method,
  "reservedAt" timestamptz,
  "pickedUpAt" timestamptz,
  "boxId" uuid,
  "boxTitle" text,
  "storeId" uuid,
  "storeName" text,
  "customerName" text,
  "customerPhone" text
) language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  return query
    select r.id, r.code, r.status, r.amount, r."commissionAmount", r.total,
      r."paymentMethod", r."reservedAt", r."pickedUpAt",
      b.id, b.title, s.id, s.name, p."fullName", p.phone
    from reservation r
    join box b on b.id = r."boxId"
    join store s on s.id = b."storeId"
    join profile p on p.id = r."customerId"
    where s."ownerId" = auth.uid()
    order by r."reservedAt" desc;
end; $$;

revoke execute on function store_reservations() from public, anon;
grant execute on function store_reservations() to authenticated;
