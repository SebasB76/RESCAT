create table demo_box_schedule (
  "boxId" uuid primary key references box(id) on delete cascade,
  "dailyStockQty" int not null check ("dailyStockQty" > 0),
  enabled boolean not null default true,
  "lastRefreshedAt" timestamptz
);

comment on table demo_box_schedule is
  'Recurrencia exclusiva para datos demostrativos. Las cajas reales nunca se renuevan automáticamente.';

alter table demo_box_schedule enable row level security;
revoke all on demo_box_schedule from public, anon, authenticated;

insert into demo_box_schedule ("boxId", "dailyStockQty")
select b.id, greatest(b."stockQty", 1)
from box b
join store s on s.id = b."storeId"
where s.name in ('Mini Market Juanita', 'Despensa Doña María')
on conflict ("boxId") do nothing;

create or replace function refresh_demo_boxes()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  perform expire_reservations();

  with due as (
    select
      b.id,
      greatest(
        1,
        ceil(extract(epoch from (now() - b."pickupEnd")) / 86400.0)::int
      ) as shift_days,
      schedule."dailyStockQty"
    from demo_box_schedule schedule
    join box b on b.id = schedule."boxId"
    where schedule.enabled
      and b."pickupEnd" <= now()
  ),
  refreshed as (
    update box b
    set
      "pickupStart" = b."pickupStart" + make_interval(days => due.shift_days),
      "pickupEnd" = b."pickupEnd" + make_interval(days => due.shift_days),
      "bestBefore" = case
        when b."bestBefore" is null then null
        else b."bestBefore" + due.shift_days
      end,
      "stockQty" = due."dailyStockQty",
      status = 'active'
    from due
    where b.id = due.id
    returning b.id
  )
  update demo_box_schedule schedule
  set "lastRefreshedAt" = now()
  where schedule."boxId" in (select id from refreshed);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function refresh_demo_boxes() from public, anon, authenticated;
grant execute on function refresh_demo_boxes() to service_role;

create or replace function list_boxes_near(p_lat double precision, p_lng double precision)
returns table (
  id uuid, "storeId" uuid, title text, price numeric, "originalPrice" numeric,
  "stockQty" int, "photoUrl" text, "bestBefore" date, "pickupEnd" timestamptz, "pickupStart" timestamptz,
  tipo box_tipo, items text[], "storeName" text, neighborhood text, lat double precision, lng double precision,
  "distanceKm" double precision, "storeRating" numeric, "boxRating" numeric, "boxReviewCount" int
)
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  perform refresh_demo_boxes();

  return query
    select b.id, b."storeId", b.title, b.price, b."originalPrice",
      b."stockQty", b."photoUrl", b."bestBefore", b."pickupEnd", b."pickupStart", b.tipo, b.items,
      s.name, s.neighborhood, s.lat, s.lng,
      6371 * acos(greatest(-1, least(1,
        cos(radians(p_lat)) * cos(radians(s.lat)) * cos(radians(s.lng) - radians(p_lng))
        + sin(radians(p_lat)) * sin(radians(s.lat))))) as "distanceKm",
      coalesce((select round(avg(r.rating), 1) from review r where r."storeId" = s.id), 0),
      coalesce((select round(avg(r.rating), 1) from review r where r."boxId" = b.id), 0),
      coalesce((select count(*) from review r where r."boxId" = b.id), 0)::int
    from box b
    join store s on s.id = b."storeId"
    where b.status = 'active'
      and b."stockQty" > 0
      and b."pickupEnd" > now()
    order by "distanceKm" asc;
end;
$$;

revoke execute on function list_boxes_near(double precision, double precision) from public;
grant execute on function list_boxes_near(double precision, double precision) to anon, authenticated, service_role;

select refresh_demo_boxes();
