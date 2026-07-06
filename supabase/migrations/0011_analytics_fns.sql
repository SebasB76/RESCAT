create or replace function lots_with_level(p_store uuid default null)
returns table (
  id uuid, "storeId" uuid, "productId" uuid, "productName" text, brand text,
  category text, subcategory text, "receivedAt" date, "expiryDate" date,
  "daysToExpiry" int, qty int, "unitCost" numeric, price numeric,
  "totalValue" numeric, level text, "autoDiscountPct" int, "rescatPrice" numeric
) language sql stable set search_path = public as $$
  select l.id, l."storeId", l."productId", p.name, p.brand,
    p.category, p.subcategory, l."receivedAt", l."expiryDate",
    (l."expiryDate" - current_date) as "daysToExpiry",
    l.qty, l."unitCost", l.price,
    round(l.qty * l."unitCost", 2) as "totalValue",
    case
      when (l."expiryDate" - current_date) <= 0 then 'VENCIDO'
      when (l."expiryDate" - current_date) <= 7 then 'CRITICO'
      when (l."expiryDate" - current_date) <= 14 then 'ALERTA'
      when (l."expiryDate" - current_date) <= 30 then 'ADVERTENCIA'
      else 'OK'
    end as level,
    case
      when (l."expiryDate" - current_date) <= 0 then 0
      when (l."expiryDate" - current_date) <= 7 then 55
      when (l."expiryDate" - current_date) <= 14 then 40
      when (l."expiryDate" - current_date) <= 30 then 25
      else 0
    end as "autoDiscountPct",
    round(l.price * (1 - (case
      when (l."expiryDate" - current_date) <= 0 then 0
      when (l."expiryDate" - current_date) <= 7 then 55
      when (l."expiryDate" - current_date) <= 14 then 40
      when (l."expiryDate" - current_date) <= 30 then 25
      else 0 end)::numeric / 100), 2) as "rescatPrice"
  from lot l join product p on p.id = l."productId"
  where p_store is null or l."storeId" = p_store
  order by (l."expiryDate" - current_date) asc;
$$;

create or replace function inventory_kpis(p_store uuid default null)
returns table (
  "valorTotal" numeric, "nLotes" int, criticos int, "enAlerta" int,
  advertencia int, ok int, "valorRiesgo7d" numeric, "valorRiesgo30d" numeric,
  "qtyRiesgo30d" int
) language sql stable set search_path = public as $$
  with x as (select * from lots_with_level(p_store))
  select
    coalesce(round(sum("totalValue"), 2), 0),
    count(*)::int,
    count(*) filter (where level = 'CRITICO')::int,
    count(*) filter (where level = 'ALERTA')::int,
    count(*) filter (where level = 'ADVERTENCIA')::int,
    count(*) filter (where level = 'OK')::int,
    coalesce(round(sum("totalValue") filter (where "daysToExpiry" between 1 and 7), 2), 0),
    coalesce(round(sum("totalValue") filter (where "daysToExpiry" between 1 and 30), 2), 0),
    coalesce(sum(qty) filter (where "daysToExpiry" between 1 and 30), 0)::int
  from x;
$$;

grant execute on function lots_with_level(uuid) to authenticated;
grant execute on function inventory_kpis(uuid) to authenticated;
