create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profile (id, role, "fullName")
  values (new.id, 'customer', new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

create or replace function reserve_box(
  p_box_id uuid, p_customer_id uuid, p_payment_method payment_method
) returns reservation
language plpgsql security definer set search_path = public as $$
declare
  v_box public.box;
  v_reservation reservation;
  v_code text;
  v_status reservation_status;
begin
  select * into v_box from box where id = p_box_id for update;
  if not found then raise exception 'box_not_found'; end if;
  if v_box.status <> 'active' or v_box."stockQty" < 1 then raise exception 'out_of_stock'; end if;

  update box set
    "stockQty" = "stockQty" - 1,
    status = case when "stockQty" - 1 = 0 then 'soldOut'::box_status else status end
  where id = p_box_id;

  v_code := 'RC-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
  v_status := case when p_payment_method = 'cardMock' then 'paid'::reservation_status else 'reserved'::reservation_status end;

  insert into reservation ("boxId", "customerId", code, "paymentMethod", status, amount, "expiresAt")
  values (p_box_id, p_customer_id, v_code, p_payment_method, v_status, v_box.price, v_box."pickupEnd")
  returning * into v_reservation;

  return v_reservation;
end; $$;

create or replace function expire_reservations() returns int
language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  with expired as (
    update reservation set status = 'expired'
    where status in ('reserved', 'paid') and "expiresAt" < now()
    returning "boxId"
  ), grouped as (
    select "boxId", count(*) as cnt from expired group by "boxId"
  ), restocked as (
    update box b set "stockQty" = b."stockQty" + g.cnt, status = 'active'
    from grouped g where b.id = g."boxId" returning b.id
  )
  select coalesce((select count(*) from expired), 0) into v_count;
  return v_count;
end; $$;

create or replace function list_boxes_near(p_lat double precision, p_lng double precision)
returns table (
  id uuid, "storeId" uuid, title text, price numeric, "originalPrice" numeric,
  "stockQty" int, "photoUrl" text, "bestBefore" date, "pickupEnd" timestamptz,
  "storeName" text, neighborhood text, lat double precision, lng double precision,
  "distanceKm" double precision, "storeRating" numeric
) language sql stable set search_path = public as $$
  select b.id, b."storeId", b.title, b.price, b."originalPrice",
    b."stockQty", b."photoUrl", b."bestBefore", b."pickupEnd",
    s.name, s.neighborhood, s.lat, s.lng,
    6371 * acos(least(1,
      cos(radians(p_lat)) * cos(radians(s.lat)) * cos(radians(s.lng) - radians(p_lng))
      + sin(radians(p_lat)) * sin(radians(s.lat)))) as "distanceKm",
    coalesce((select round(avg(r.rating), 1) from review r where r."storeId" = s.id), 0)
  from box b join store s on s.id = b."storeId"
  where b.status = 'active' and b."stockQty" > 0
  order by "distanceKm" asc;
$$;

grant execute on function reserve_box(uuid, uuid, payment_method) to authenticated;
grant execute on function list_boxes_near(double precision, double precision) to anon, authenticated;
