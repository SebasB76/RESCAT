create or replace function list_boxes_near(p_lat double precision, p_lng double precision)
returns table (
  id uuid, "storeId" uuid, title text, price numeric, "originalPrice" numeric,
  "stockQty" int, "photoUrl" text, "bestBefore" date, "pickupEnd" timestamptz,
  tipo box_tipo, "storeName" text, neighborhood text, lat double precision, lng double precision,
  "distanceKm" double precision, "storeRating" numeric
) language sql stable set search_path = public as $$
  select b.id, b."storeId", b.title, b.price, b."originalPrice",
    b."stockQty", b."photoUrl", b."bestBefore", b."pickupEnd", b.tipo,
    s.name, s.neighborhood, s.lat, s.lng,
    6371 * acos(greatest(-1, least(1,
      cos(radians(p_lat)) * cos(radians(s.lat)) * cos(radians(s.lng) - radians(p_lng))
      + sin(radians(p_lat)) * sin(radians(s.lat))))) as "distanceKm",
    coalesce((select round(avg(r.rating), 1) from review r where r."storeId" = s.id), 0)
  from box b join store s on s.id = b."storeId"
  where b.status = 'active' and b."stockQty" > 0 and b."pickupEnd" > now()
  order by "distanceKm" asc;
$$;

create or replace function create_order(p_items jsonb, p_payment_method payment_method)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_customer uuid := auth.uid();
  v_store uuid;
  v_purchase purchase;
  v_code text;
  v_total numeric(10,2);
  v_status text;
  v_attempts int;
  v_result jsonb := '[]'::jsonb;
begin
  if v_customer is null then raise exception 'not_authenticated'; end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then raise exception 'empty_cart'; end if;
  if exists (select 1 from jsonb_to_recordset(p_items) as it("productId" uuid, qty int) where it.qty <= 0) then
    raise exception 'invalid_qty';
  end if;
  if (select count(*) from jsonb_to_recordset(p_items) as it("productId" uuid, qty int)
      join product pr on pr.id = it."productId") <> jsonb_array_length(p_items) then
    raise exception 'invalid_product';
  end if;

  v_status := case when p_payment_method = 'cardMock' then 'paid' else 'pending' end;

  for v_store in
    select distinct pr."storeId"
    from jsonb_to_recordset(p_items) as it("productId" uuid, qty int)
    join product pr on pr.id = it."productId"
  loop
    select round(sum(pr.price * it.qty), 2) into v_total
    from jsonb_to_recordset(p_items) as it("productId" uuid, qty int)
    join product pr on pr.id = it."productId"
    where pr."storeId" = v_store;

    v_attempts := 0;
    loop
      v_attempts := v_attempts + 1;
      v_code := 'PC-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
      begin
        insert into purchase ("customerId", "storeId", status, "paymentMethod", code, total)
        values (v_customer, v_store, v_status, p_payment_method, v_code, v_total)
        returning * into v_purchase;
        exit;
      exception when unique_violation then
        if v_attempts >= 5 then raise; end if;
      end;
    end loop;

    insert into purchase_item ("purchaseId", "productId", qty, price)
    select v_purchase.id, it."productId", it.qty, pr.price
    from jsonb_to_recordset(p_items) as it("productId" uuid, qty int)
    join product pr on pr.id = it."productId"
    where pr."storeId" = v_store;

    v_result := v_result || jsonb_build_object('storeId', v_store, 'code', v_code, 'total', v_total);
  end loop;

  return v_result;
end; $$;

revoke execute on function lots_with_level(uuid) from public;
revoke execute on function inventory_kpis(uuid) from public;
revoke execute on function create_order(jsonb, payment_method) from public;
grant execute on function create_order(jsonb, payment_method) to authenticated;

revoke select on product from anon, authenticated;
grant select ("id", "storeId", name, brand, category, subcategory, price, "photoUrl", "createdAt") on product to anon, authenticated;

drop policy if exists "purchase update own or merchant" on purchase;
create policy "purchase update owner" on purchase for update
  using (exists (select 1 from store s where s.id = purchase."storeId" and s."ownerId" = auth.uid()))
  with check (exists (select 1 from store s where s.id = purchase."storeId" and s."ownerId" = auth.uid()));
